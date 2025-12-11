const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Safe Media Manager for KITMED Platform
 * 
 * Features:
 * - Duplicate detection before download
 * - Rate limiting and retry logic
 * - File existence verification
 * - Safe filename generation
 * - Domain blocking protection
 * - Comprehensive logging
 */

// Configuration
const CONFIG = {
  uploadDir: path.join(__dirname, 'public/uploads/products'),
  maxRetries: 3,
  downloadDelay: 500, // ms between downloads
  timeout: 30000, // 30 second timeout
  userAgent: 'Mozilla/5.0 (compatible; KITMED-Media-Manager/1.0)',
  maxFileSize: 10 * 1024 * 1024, // 10MB max
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
  blockedDomains: [] // Add problematic domains here
};

/**
 * Generate safe filename from URL and product reference
 */
function generateSafeFilename(url, productRef, type = 'primary', index = 0) {
  // Clean product reference
  const cleanRef = productRef.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  // Get file extension
  const ext = getFileExtension(url);
  
  // Generate type suffix
  let suffix;
  if (type === 'primary') {
    suffix = 'primary';
  } else if (type === 'gallery') {
    suffix = `gallery-${index + 1}`;
  } else if (type === 'pdf') {
    suffix = `brochure-${index + 1}`;
  } else {
    suffix = `media-${index + 1}`;
  }
  
  return `${cleanRef}-${suffix}${ext}`;
}

/**
 * Get file extension from URL with safety checks
 */
function getFileExtension(url) {
  if (!url) return '.jpg';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const ext = path.extname(pathname);
    
    // Validate extension
    if (CONFIG.allowedExtensions.includes(ext)) {
      return ext;
    }
    
    // Default based on query parameters or content type hints
    if (pathname.includes('pdf') || urlObj.searchParams.has('format') && urlObj.searchParams.get('format') === 'pdf') {
      return '.pdf';
    }
    
    return '.jpg'; // Safe default
  } catch (error) {
    return '.jpg';
  }
}

/**
 * Check if file already exists locally
 */
function fileExists(filename) {
  const filePath = path.join(CONFIG.uploadDir, filename);
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

/**
 * Generate content hash for duplicate detection
 */
function generateContentHash(url, productRef, type) {
  return crypto
    .createHash('md5')
    .update(`${url}-${productRef}-${type}`)
    .digest('hex');
}

/**
 * Check if domain is blocked or problematic
 */
function isDomainBlocked(url) {
  try {
    const urlObj = new URL(url);
    return CONFIG.blockedDomains.includes(urlObj.hostname);
  } catch {
    return true; // Block invalid URLs
  }
}

/**
 * Safe file download with retries and validation
 */
async function downloadFileSafe(url, filename, description = '', retries = 0) {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      resolve({ success: false, error: 'Empty URL' });
      return;
    }

    // Check if domain is blocked
    if (isDomainBlocked(url)) {
      resolve({ success: false, error: 'Domain blocked', skipped: true });
      return;
    }

    const filePath = path.join(CONFIG.uploadDir, filename);
    
    // Check if file already exists
    if (fileExists(filename)) {
      console.log(`    ⏭️  Already exists: ${filename}`);
      resolve({ 
        success: true, 
        localPath: `/uploads/products/${filename}`, 
        existed: true 
      });
      return;
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`    📥 Downloading: ${description} (attempt ${retries + 1})`);
    
    try {
      const protocol = url.startsWith('https:') ? https : http;
      const file = fs.createWriteStream(filePath);
      let downloaded = 0;
      
      const request = protocol.get(url, {
        timeout: CONFIG.timeout,
        headers: {
          'User-Agent': CONFIG.userAgent,
          'Accept': 'image/*,application/pdf,*/*;q=0.9',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlink(filePath, () => {});
          console.log(`    🔄 Redirect: ${response.headers.location}`);
          
          // Follow redirect
          return downloadFileSafe(response.headers.location, filename, description, retries)
            .then(resolve)
            .catch(reject);
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(filePath, () => {});
          
          if (retries < CONFIG.maxRetries) {
            console.log(`    🔄 Retrying ${response.statusCode}: ${url}`);
            setTimeout(() => {
              downloadFileSafe(url, filename, description, retries + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (retries + 1)); // Exponential backoff
          } else {
            resolve({ success: false, error: `HTTP ${response.statusCode}` });
          }
          return;
        }
        
        // Check content length
        const contentLength = parseInt(response.headers['content-length'] || '0');
        if (contentLength > CONFIG.maxFileSize) {
          file.close();
          fs.unlink(filePath, () => {});
          resolve({ success: false, error: 'File too large' });
          return;
        }
        
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          if (downloaded > CONFIG.maxFileSize) {
            file.close();
            fs.unlink(filePath, () => {});
            resolve({ success: false, error: 'File too large during download' });
            return;
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          
          // Verify file was actually downloaded
          if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            console.log(`    ✅ Downloaded: ${filename} (${(downloaded / 1024).toFixed(1)}KB)`);
            resolve({ 
              success: true, 
              localPath: `/uploads/products/${filename}`,
              size: downloaded
            });
          } else {
            fs.unlink(filePath, () => {});
            resolve({ success: false, error: 'Empty file downloaded' });
          }
        });
        
        file.on('error', (err) => {
          file.close();
          fs.unlink(filePath, () => {});
          
          if (retries < CONFIG.maxRetries) {
            console.log(`    🔄 File error, retrying: ${err.message}`);
            setTimeout(() => {
              downloadFileSafe(url, filename, description, retries + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (retries + 1));
          } else {
            resolve({ success: false, error: `File error: ${err.message}` });
          }
        });
      });
      
      request.on('error', (err) => {
        file.close();
        fs.unlink(filePath, () => {});
        
        if (retries < CONFIG.maxRetries) {
          console.log(`    🔄 Request error, retrying: ${err.message}`);
          setTimeout(() => {
            downloadFileSafe(url, filename, description, retries + 1)
              .then(resolve)
              .catch(reject);
          }, 1000 * (retries + 1));
        } else {
          resolve({ success: false, error: `Request error: ${err.message}` });
        }
      });
      
      request.setTimeout(CONFIG.timeout, () => {
        request.destroy();
        file.close();
        fs.unlink(filePath, () => {});
        
        if (retries < CONFIG.maxRetries) {
          console.log(`    ⏰ Timeout, retrying...`);
          setTimeout(() => {
            downloadFileSafe(url, filename, description, retries + 1)
              .then(resolve)
              .catch(reject);
          }, 2000 * (retries + 1));
        } else {
          resolve({ success: false, error: 'Download timeout' });
        }
      });
      
    } catch (error) {
      fs.unlink(filePath, () => {});
      resolve({ success: false, error: `Setup error: ${error.message}` });
    }
  });
}

/**
 * Process media for a single product with safety checks
 */
async function processProductMedia(productId, productRef, mediaList) {
  console.log(`📦 Processing: ${productRef} (${mediaList.length} media files)`);
  
  const results = {
    downloaded: 0,
    existed: 0,
    failed: 0,
    updated: 0,
    totalSize: 0
  };
  
  for (let i = 0; i < mediaList.length; i++) {
    const media = mediaList[i];
    
    try {
      // Determine media type
      const type = media.is_primary ? 'primary' : 
                   media.type === 'pdf' ? 'pdf' : 'gallery';
      
      // Generate safe filename
      const filename = generateSafeFilename(
        media.url, 
        productRef, 
        type, 
        media.sort_order || i
      );
      
      // Download with safety measures
      const result = await downloadFileSafe(
        media.url,
        filename,
        `${productRef} - ${type}`
      );
      
      if (result.success) {
        // Update database with local path
        await prisma.product_media.update({
          where: { id: media.id },
          data: { url: result.localPath }
        });
        
        if (result.existed) {
          results.existed++;
          console.log(`    🔄 Using existing: ${result.localPath}`);
        } else {
          results.downloaded++;
          results.totalSize += result.size || 0;
          console.log(`    🔄 Updated DB: ${media.url} -> ${result.localPath}`);
        }
        results.updated++;
        
      } else if (result.skipped) {
        console.log(`    ⏭️  Skipped: ${result.error}`);
      } else {
        results.failed++;
        console.log(`    ❌ Failed: ${result.error}`);
      }
      
    } catch (error) {
      results.failed++;
      console.log(`    ❌ Processing error: ${error.message}`);
    }
    
    // Rate limiting delay
    if (i < mediaList.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.downloadDelay));
    }
  }
  
  return results;
}

/**
 * Main function to safely download and manage all external media
 */
async function safeMediaDownload() {
  try {
    console.log('📥 SAFE MEDIA DOWNLOAD & MANAGEMENT');
    console.log('=====================================');
    console.log('Features: Duplicate detection, Rate limiting, Retry logic, File validation');
    console.log('');
    
    // Ensure upload directory exists
    if (!fs.existsSync(CONFIG.uploadDir)) {
      fs.mkdirSync(CONFIG.uploadDir, { recursive: true });
      console.log(`📁 Created upload directory: ${CONFIG.uploadDir}`);
    }
    
    // Get all external media
    const externalMedia = await prisma.product_media.findMany({
      where: { 
        url: { startsWith: 'http' },
        type: 'image' // Focus on images first, PDFs later
      },
      orderBy: [
        { product_id: 'asc' },
        { sort_order: 'asc' }
      ]
    });
    
    console.log(`🔍 Found ${externalMedia.length} external images to process`);
    
    // Group by product
    const productGroups = {};
    externalMedia.forEach(media => {
      const productId = media.product_id;
      if (!productGroups[productId]) {
        productGroups[productId] = [];
      }
      productGroups[productId].push(media);
    });
    
    console.log(`📦 Processing ${Object.keys(productGroups).length} products\n`);
    
    const totalResults = {
      downloaded: 0,
      existed: 0,
      failed: 0,
      updated: 0,
      totalSize: 0,
      productsProcessed: 0
    };
    
    for (const [productId, mediaList] of Object.entries(productGroups)) {
      // Get product data
      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { reference_fournisseur: true, id: true }
      });
      
      if (!product) {
        console.log(`❌ Product not found: ${productId}`);
        continue;
      }
      
      // Process this product's media
      const results = await processProductMedia(productId, product.reference_fournisseur, mediaList);
      
      // Aggregate results
      Object.keys(results).forEach(key => {
        totalResults[key] += results[key];
      });
      totalResults.productsProcessed++;
      
      console.log(`    📊 Results: ${results.downloaded} new, ${results.existed} existing, ${results.failed} failed\n`);
      
      // Pause between products to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    console.log('='.repeat(60));
    console.log('📥 SAFE MEDIA DOWNLOAD COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ New downloads: ${totalResults.downloaded}`);
    console.log(`📁 Existing files used: ${totalResults.existed}`);
    console.log(`🔄 Database records updated: ${totalResults.updated}`);
    console.log(`❌ Failed downloads: ${totalResults.failed}`);
    console.log(`📦 Products processed: ${totalResults.productsProcessed}`);
    console.log(`💾 Total size downloaded: ${(totalResults.totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Verify final state
    const remainingExternal = await prisma.product_media.count({
      where: { 
        url: { startsWith: 'http' },
        type: 'image'
      }
    });
    
    const localImages = await prisma.product_media.count({
      where: { 
        url: { startsWith: '/uploads/' },
        type: 'image'
      }
    });
    
    console.log('\n📊 Final Status:');
    console.log(`Local images: ${localImages}`);
    console.log(`External images remaining: ${remainingExternal}`);
    
    if (totalResults.downloaded > 0 || totalResults.existed > 0) {
      console.log('\n🎉 SUCCESS! Media management completed safely.');
      console.log('\n🚀 Benefits:');
      console.log('  ✅ Faster page loading');
      console.log('  ✅ No external dependency failures');
      console.log('  ✅ Better caching and CDN support');
      console.log('  ✅ SEO optimization');
      console.log('  ✅ Offline capability');
    }
    
    return totalResults;
    
  } catch (error) {
    console.error('❌ Safe media download failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for use in other scripts
module.exports = {
  safeMediaDownload,
  downloadFileSafe,
  generateSafeFilename,
  fileExists,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  safeMediaDownload().then(result => {
    if (result.downloaded > 0 || result.existed > 0) {
      console.log('\n🎯 SAFE MEDIA DOWNLOAD SUCCESSFUL!');
      console.log(`📸 ${result.updated} media files now managed locally`);
      console.log('🛡️  Protected against rate limiting and blocks');
    } else {
      console.log('\n⚠️  No new media was processed.');
    }
  }).catch(error => {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  });
}