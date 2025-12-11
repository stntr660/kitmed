const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('crypto');
const fs = require('fs');
const { downloadFileSafe, generateSafeFilename, fileExists } = require('./safe-media-manager');

const prisma = new PrismaClient();

/**
 * Enhanced CSV Uploader with Safe Media Management
 * 
 * Features:
 * - Checks for existing products before creating
 * - Downloads media safely with duplicate detection
 * - Rate limiting and retry logic
 * - Comprehensive error handling
 * - Detailed progress reporting
 */

async function enhancedCSVUpload(csvFilePath, options = {}) {
  const config = {
    batchSize: 10, // Process in smaller batches
    mediaDownload: true, // Whether to download media
    skipExisting: true, // Skip products that already exist
    ...options
  };
  
  try {
    console.log('📦 ENHANCED CSV UPLOAD WITH SAFE MEDIA MANAGEMENT');
    console.log('=================================================');
    console.log(`File: ${csvFilePath}`);
    console.log(`Batch size: ${config.batchSize}`);
    console.log(`Media download: ${config.mediaDownload ? 'Enabled' : 'Disabled'}`);
    console.log('');
    
    // Category mapping from processed CSV to actual DB slugs
    const categoryMapping = {
      'surgery-instruments': 'surgery-surgical-instruments',
      'ophthalmology-surgical': 'ophthalmology-surgical-equipment',
      'ophthalmology-diagnostic': 'ophthalmology-diagnostic-equipment'
    };
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Found ${records.length} products to process`);
    
    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      mediaDownloaded: 0,
      mediaFailed: 0,
      mediaExisted: 0
    };
    
    // Process in batches
    for (let i = 0; i < records.length; i += config.batchSize) {
      const batch = records.slice(i, i + config.batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/config.batchSize) + 1}: Products ${i + 1}-${Math.min(i + config.batchSize, records.length)}`);
      
      for (const record of batch) {
        try {
          results.processed++;
          
          console.log(`\n${results.processed}. Processing: ${record.referenceFournisseur}`);
          
          // Check if product already exists
          if (config.skipExisting) {
            const existing = await prisma.products.findUnique({
              where: { reference_fournisseur: record.referenceFournisseur }
            });
            
            if (existing) {
              console.log(`  ⏭️  Already exists: ${record.referenceFournisseur}`);
              results.skipped++;
              continue;
            }
          }
          
          // Verify manufacturer exists
          const manufacturer = await prisma.partners.findFirst({
            where: { slug: record.constructeur, type: 'manufacturer' }
          });
          
          if (!manufacturer) {
            console.log(`  ❌ Manufacturer not found: ${record.constructeur}`);
            results.errors++;
            continue;
          }
          
          // Map and verify category
          const actualCategorySlug = categoryMapping[record.categoryId] || record.categoryId;
          const category = await prisma.categories.findFirst({
            where: { slug: actualCategorySlug, is_active: true }
          });
          
          if (!category) {
            console.log(`  ❌ Category not found: ${record.categoryId}`);
            results.errors++;
            continue;
          }
          
          console.log(`  🏭 Manufacturer: ${manufacturer.slug}`);
          console.log(`  📂 Category: ${actualCategorySlug}`);
          
          // Generate slug
          const slug = record.nom_fr
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Process media URLs before creating product
          const mediaData = [];
          let mediaResults = { downloaded: 0, existed: 0, failed: 0 };
          
          if (config.mediaDownload && record.imageUrls) {
            console.log(`  📸 Processing media...`);
            const imageUrls = record.imageUrls.split('|').map(u => u.trim()).filter(u => u);
            
            for (let idx = 0; idx < imageUrls.length && idx < 5; idx++) {
              const url = imageUrls[idx];
              const isPrimary = idx === 0;
              const filename = generateSafeFilename(
                url, 
                record.referenceFournisseur, 
                isPrimary ? 'primary' : 'gallery',
                idx
              );
              
              // Check if file exists or download it
              let localPath;
              if (fileExists(filename)) {
                localPath = `/uploads/products/${filename}`;
                mediaResults.existed++;
                console.log(`    ⏭️  Using existing: ${filename}`);
              } else {
                console.log(`    📥 Downloading: ${url}`);
                const downloadResult = await downloadFileSafe(
                  url,
                  filename,
                  `${record.referenceFournisseur} - ${isPrimary ? 'Primary' : 'Gallery'}`
                );
                
                if (downloadResult.success) {
                  localPath = downloadResult.localPath;
                  mediaResults.downloaded++;
                  console.log(`    ✅ Downloaded: ${filename}`);
                } else {
                  mediaResults.failed++;
                  console.log(`    ❌ Download failed: ${downloadResult.error}`);
                  // Use original URL as fallback
                  localPath = url;
                }
              }
              
              mediaData.push({
                id: randomUUID(),
                type: 'image',
                url: localPath,
                alt_text: `${record.nom_fr} - ${isPrimary ? 'Image principale' : 'Image ' + (idx + 1)}`,
                title: `${record.nom_fr} - ${isPrimary ? 'Image principale' : 'Image ' + (idx + 1)}`,
                sort_order: idx,
                is_primary: isPrimary
              });
              
              // Small delay between downloads
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } else if (record.imageUrls) {
            // No download, use external URLs
            const imageUrls = record.imageUrls.split('|').map(u => u.trim()).filter(u => u);
            
            for (let idx = 0; idx < imageUrls.length && idx < 5; idx++) {
              mediaData.push({
                id: randomUUID(),
                type: 'image',
                url: imageUrls[idx],
                alt_text: `${record.nom_fr} - Image ${idx + 1}`,
                title: `${record.nom_fr} - Image ${idx + 1}`,
                sort_order: idx,
                is_primary: idx === 0
              });
            }
          }
          
          // Create the product with all data
          const product = await prisma.products.create({
            data: {
              id: randomUUID(),
              reference_fournisseur: record.referenceFournisseur,
              constructeur: record.constructeur,
              partner_id: manufacturer.id,
              category_id: category.id,
              slug: slug,
              pdf_brochure_url: record.pdfBrochureUrl || null,
              status: record.status || 'active',
              is_featured: record.featured === 'true',
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          
          // Create translations
          await prisma.product_translations.create({
            data: {
              id: randomUUID(),
              product_id: product.id,
              language_code: 'fr',
              nom: record.nom_fr,
              description: record.description_fr || null,
              fiche_technique: record.ficheTechnique_fr || null
            }
          });
          
          await prisma.product_translations.create({
            data: {
              id: randomUUID(),
              product_id: product.id,
              language_code: 'en',
              nom: record.nom_en,
              description: record.description_en || null,
              fiche_technique: record.ficheTechnique_en || null
            }
          });
          
          // Create media records
          for (const media of mediaData) {
            await prisma.product_media.create({
              data: {
                ...media,
                product_id: product.id
              }
            });
          }
          
          console.log(`  ✅ Created product: ${record.referenceFournisseur}`);
          console.log(`     Media: ${mediaResults.downloaded} downloaded, ${mediaResults.existed} existing, ${mediaResults.failed} failed`);
          
          results.created++;
          results.mediaDownloaded += mediaResults.downloaded;
          results.mediaExisted += mediaResults.existed;
          results.mediaFailed += mediaResults.failed;
          
        } catch (error) {
          console.error(`  ❌ Error processing ${record.referenceFournisseur}: ${error.message}`);
          results.errors++;
        }
      }
      
      // Pause between batches
      if (i + config.batchSize < records.length) {
        console.log(`\n⏸️  Pausing between batches...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📦 ENHANCED CSV UPLOAD COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Processed: ${results.processed} products`);
    console.log(`✅ Created: ${results.created} products`);
    console.log(`⏭️  Skipped: ${results.skipped} products (already exist)`);
    console.log(`❌ Errors: ${results.errors} products`);
    console.log(`📥 Media downloaded: ${results.mediaDownloaded} files`);
    console.log(`📁 Media existing: ${results.mediaExisted} files`);
    console.log(`❌ Media failed: ${results.mediaFailed} files`);
    
    if (results.created > 0) {
      console.log('\n🎉 SUCCESS! Products uploaded with safe media management.');
      console.log('\n📁 Media files stored in: public/uploads/products/');
      console.log('\n🔍 Next steps:');
      console.log('  1. Verify products in admin panel');
      console.log('  2. Check image loading performance');
      console.log('  3. Test search and filtering');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Enhanced CSV upload failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other scripts
module.exports = { enhancedCSVUpload };

// Run if called directly
if (require.main === module) {
  const csvFile = process.argv[2] || '/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP/kitmed_batch_5_FINAL.csv';
  const mediaDownload = process.argv[3] !== 'no-download';
  
  console.log(`Starting enhanced CSV upload...`);
  console.log(`File: ${csvFile}`);
  console.log(`Media download: ${mediaDownload ? 'Enabled' : 'Disabled'}`);
  
  enhancedCSVUpload(csvFile, { 
    mediaDownload,
    batchSize: 5 // Smaller batches for safety
  }).then(result => {
    if (result.created > 0) {
      console.log('\n🎯 ENHANCED CSV UPLOAD SUCCESSFUL!');
      console.log(`🏭 ${result.created} products created`);
      console.log(`📸 ${result.mediaDownloaded} images downloaded safely`);
    } else {
      console.log('\n⚠️  No new products were created.');
    }
  }).catch(error => {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  });
}