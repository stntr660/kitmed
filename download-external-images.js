const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Download file function
async function downloadFile(url, filename, description = '') {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      resolve(null);
      return;
    }

    try {
      const protocol = url.startsWith('https:') ? https : http;
      const filePath = path.join(__dirname, 'public/uploads/products', filename);
      
      // Check if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`    ⏭️  Already exists: ${filename}`);
        resolve(`/uploads/products/${filename}`);
        return;
      }
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`    📥 Downloading: ${description}`);
      
      const file = fs.createWriteStream(filePath);
      
      const request = protocol.get(url, { timeout: 15000 }, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`    ✅ Downloaded: ${filename}`);
            resolve(`/uploads/products/${filename}`);
          });
        } else {
          console.log(`    ❌ Failed to download: ${response.statusCode} - ${url}`);
          file.close();
          fs.unlink(filePath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        console.log(`    ❌ Error downloading: ${err.message}`);
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
      
      request.setTimeout(15000, () => {
        console.log(`    ⏰ Timeout: ${url}`);
        request.destroy();
        file.close();
        fs.unlink(filePath, () => {});
        resolve(null);
      });
      
    } catch (error) {
      console.log(`    ❌ Error processing: ${error.message}`);
      resolve(null);
    }
  });
}

// Get file extension from URL
function getFileExtension(url) {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext || '.jpg';
  } catch {
    return '.jpg';
  }
}

// Generate filename from URL and product reference
function generateFilename(url, productRef, index = 0) {
  const ext = getFileExtension(url);
  const base = productRef.replace(/[^a-zA-Z0-9]/g, '-');
  const suffix = index === 0 ? 'primary' : `gallery-${index}`;
  return `${base}-${suffix}${ext}`;
}

async function downloadExternalImages() {
  try {
    console.log('📥 DOWNLOADING EXTERNAL IMAGES TO LOCAL STORAGE');
    console.log('===============================================');
    
    // Get all external image URLs
    const externalMedia = await prisma.product_media.findMany({
      where: { 
        url: { startsWith: 'http' },
        type: 'image'
      },
      orderBy: [
        { product_id: 'asc' },
        { sort_order: 'asc' }
      ]
    });
    
    console.log(`🔍 Found ${externalMedia.length} external images to download`);
    
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;
    let updated = 0;
    
    // Group by product
    const productGroups = {};
    externalMedia.forEach(media => {
      const productId = media.product_id;
      if (!productGroups[productId]) {
        productGroups[productId] = [];
      }
      productGroups[productId].push(media);
    });
    
    console.log(`📦 Processing ${Object.keys(productGroups).length} products with external images\n`);
    
    for (const [productId, mediaList] of Object.entries(productGroups)) {
      // Get product data separately
      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { reference_fournisseur: true, id: true }
      });
      console.log(`📦 Product: ${product.reference_fournisseur} (${mediaList.length} images)`);
      
      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i];
        
        try {
          // Generate local filename
          const filename = generateFilename(
            media.url, 
            product.reference_fournisseur, 
            media.is_primary ? 0 : i
          );
          
          // Download the image
          const localPath = await downloadFile(
            media.url,
            filename,
            `${product.reference_fournisseur} - ${media.is_primary ? 'Primary' : 'Gallery'}`
          );
          
          if (localPath) {
            // Update database with local path
            await prisma.product_media.update({
              where: { id: media.id },
              data: { url: localPath }
            });
            
            downloaded++;
            updated++;
            console.log(`    🔄 Updated DB: ${media.url} -> ${localPath}`);
          } else {
            errors++;
            console.log(`    ❌ Failed to download: ${media.url}`);
          }
          
        } catch (error) {
          console.log(`    ❌ Error processing ${media.url}: ${error.message}`);
          errors++;
        }
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(''); // Space between products
    }
    
    console.log('='.repeat(60));
    console.log('📥 IMAGE DOWNLOAD COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Downloaded: ${downloaded} images`);
    console.log(`🔄 Database updated: ${updated} records`);
    console.log(`⏭️  Skipped (exist): ${skipped} images`);
    console.log(`❌ Errors: ${errors} images`);
    
    // Verify results
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
    
    if (downloaded > 0) {
      console.log('\n🎉 SUCCESS! Images downloaded and database updated.');
      console.log('\n📁 Local images stored in: public/uploads/products/');
      console.log('\n🚀 Benefits:');
      console.log('  ✅ Faster image loading');
      console.log('  ✅ No external dependency failures');
      console.log('  ✅ Better caching and performance');
      console.log('  ✅ Local SEO optimization');
    }
    
    return { downloaded, updated, skipped, errors };
    
  } catch (error) {
    console.error('❌ Download process failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  downloadExternalImages().then(result => {
    if (result.downloaded > 0) {
      console.log('\n🎯 IMAGE DOWNLOAD SUCCESSFUL!');
      console.log(`📸 ${result.downloaded} images now stored locally`);
      console.log('🚀 Page loading will be faster');
    } else {
      console.log('\n⚠️  No new images were downloaded.');
    }
  }).catch(error => {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  });
}

module.exports = { downloadExternalImages };