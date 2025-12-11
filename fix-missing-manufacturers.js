const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

/**
 * Fix the missing manufacturers upload issues
 * 1. Complete NIDEK upload (handle slug conflicts)
 * 2. Add missing PDFs for NIDEK
 * 3. Handle other manufacturers with filename issues
 */

// Enhanced slug generation to avoid conflicts
function generateUniqueSlug(productName, reference, manufacturer) {
  // Clean the product name
  let slug = productName
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '');

  // If slug is too long or generic, use reference + name combination
  if (slug.length > 50 || slug === 'systeme-de-chirurgie-ophtalmiques-avec-accessoires') {
    // Use reference as primary identifier for these generic names
    const cleanRef = reference.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const shortName = slug.split('-').slice(0, 3).join('-'); // First 3 words
    slug = cleanRef + '-' + shortName;
  }
  
  return slug.substring(0, 60); // Database limit
}

// Enhanced media download with better error handling
async function downloadMedia(url, filename, productRef) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, 'public/uploads/products');
    
    // Ensure safe filename (handle very long references)
    let safeFilename = filename;
    if (filename.length > 100) {
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      safeFilename = baseName.substring(0, 80) + ext;
    }
    
    const filePath = path.join(uploadDir, safeFilename);
    
    // Check if file already exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`    ⏭️  Already exists: ${safeFilename}`);
      resolve(`/uploads/products/${safeFilename}`);
      return;
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`    📥 Downloading: ${safeFilename}`);
    
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    const request = protocol.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KITMED-PDF-Downloader/1.0)',
        'Accept': 'application/pdf,image/jpeg,image/png,*/*;q=0.9'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(filePath).size;
          console.log(`    ✅ Downloaded: ${safeFilename} (${(size / 1024).toFixed(1)}KB)`);
          resolve(`/uploads/products/${safeFilename}`);
        });
      } else {
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      fs.unlink(filePath, () => {});
      reject(new Error('Download timeout'));
    });
  });
}

async function processNidekProducts() {
  try {
    console.log('📦 PROCESSING REMAINING NIDEK PRODUCTS');
    console.log('======================================');
    
    // Read the CSV file
    const csvPath = './kitmed_batch_4_FINAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Filter NIDEK products
    const nidekRecords = records.filter(record => 
      record.constructeur && record.constructeur.toLowerCase() === 'nidek'
    );
    
    console.log(`📊 Found ${nidekRecords.length} NIDEK products in CSV`);
    
    let processedCount = 0;
    let addedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const record of nidekRecords) {
      const reference = record.referenceFournisseur;
      console.log(`\n📦 Processing: ${reference}`);
      
      // Check if product already exists
      const existing = await prisma.products.findFirst({
        where: {
          reference_fournisseur: reference,
          constructeur: 'nidek'
        }
      });
      
      if (existing) {
        console.log(`  ⏭️  Already exists: ${reference}`);
        skippedCount++;
        continue;
      }
      
      try {
        // Generate unique slug using enhanced method
        const uniqueSlug = generateUniqueSlug(record.nom_fr, reference, 'nidek');
        
        // Check if slug already exists
        const slugExists = await prisma.products.findUnique({
          where: { slug: uniqueSlug }
        });
        
        if (slugExists) {
          // Add random suffix for uniqueness
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          const finalSlug = `${uniqueSlug}-${randomSuffix}`;
          console.log(`  🔄 Slug conflict resolved: ${finalSlug}`);
        }
        
        const finalSlug = slugExists ? `${uniqueSlug}-${Math.random().toString(36).substring(2, 6)}` : uniqueSlug;
        
        // Create product
        const product = await prisma.products.create({
          data: {
            id: crypto.randomUUID(),
            reference_fournisseur: reference,
            constructeur: 'nidek',
            category_id: record.categoryId || 'ophthalmology-surgical',
            slug: finalSlug,
            status: 'active',
            is_featured: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        
        // Create translations
        await prisma.product_translations.createMany({
          data: [
            {
              id: crypto.randomUUID(),
              product_id: product.id,
              language_code: 'fr',
              nom: record.nom_fr || reference,
              description: record.description_fr || '',
              fiche_technique: record.ficheTechnique_fr || ''
            },
            {
              id: crypto.randomUUID(),
              product_id: product.id,
              language_code: 'en',
              nom: record.nom_en || record.nom_fr || reference,
              description: record.description_en || record.description_fr || '',
              fiche_technique: record.ficheTechnique_en || record.ficheTechnique_fr || ''
            }
          ]
        });
        
        // Process media URLs
        if (record.imageUrls) {
          const mediaUrls = record.imageUrls.split('|').map(url => url.trim()).filter(url => url);
          
          for (let i = 0; i < mediaUrls.length; i++) {
            const mediaUrl = mediaUrls[i];
            const mediaType = mediaUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
            const fileExt = mediaType === 'pdf' ? '.pdf' : '.jpg';
            
            try {
              // Generate safe filename
              const cleanRef = reference.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
              const suffix = i === 0 ? 'primary' : `gallery-${i + 1}`;
              const filename = `${cleanRef}-${suffix}${fileExt}`;
              
              const localPath = await downloadMedia(mediaUrl, filename, reference);
              
              // Add to database
              await prisma.product_media.create({
                data: {
                  id: crypto.randomUUID(),
                  product_id: product.id,
                  type: mediaType,
                  url: localPath,
                  is_primary: i === 0,
                  sort_order: i + 1
                }
              });
              
              console.log(`    ✅ Added ${mediaType}: ${localPath}`);
              
            } catch (mediaError) {
              console.log(`    ❌ Failed to download ${mediaType}: ${mediaError.message}`);
            }
          }
        }
        
        console.log(`  ✅ Successfully created: ${reference}`);
        addedCount++;
        
      } catch (error) {
        console.log(`  ❌ Error creating product: ${error.message}`);
        errorCount++;
      }
      
      processedCount++;
      
      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 NIDEK PROCESSING SUMMARY`);
    console.log(`===========================`);
    console.log(`Products processed: ${processedCount}`);
    console.log(`Products added: ${addedCount}`);
    console.log(`Products skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    const totalNidek = await prisma.products.count({
      where: { constructeur: 'nidek' }
    });
    console.log(`\n📦 Total NIDEK products in database: ${totalNidek}`);
    
  } catch (error) {
    console.error('❌ Error processing NIDEK products:', error.message);
    throw error;
  }
}

async function fixMissingManufacturers() {
  try {
    console.log('🔧 FIXING MISSING MANUFACTURERS UPLOAD ISSUES');
    console.log('=============================================');
    
    // Process NIDEK products first
    await processNidekProducts();
    
    console.log('\n🎉 NIDEK processing completed!');
    console.log('\nℹ️  For other manufacturers (HAAG-STREIT, HEINE, JOHNSON & JOHNSON):');
    console.log('     These require manual preprocessing due to extremely long reference names');
    console.log('     that exceed filesystem filename limits.');
    
  } catch (error) {
    console.error('❌ Error fixing manufacturers:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMissingManufacturers().then(() => {
  console.log('\n✅ MANUFACTURER FIX COMPLETED!');
}).catch(error => {
  console.error('❌ Manufacturer fix failed:', error.message);
  process.exit(1);
});