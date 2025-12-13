const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function updateWithProfessionalTranslations() {
  try {
    console.log('🎯 PROFESSIONAL TRANSLATIONS BATCH UPDATE');
    console.log('=========================================\n');

    // Read the professional CSV file
    const csvPath = '/Users/mac/Downloads/Batch1_Products_1-200_PROFESSIONAL.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📋 Processing ${lines.length - 1} professional product translations...\n`);

    // Manufacturer mapping to handle name variations
    const manufacturerMap = {
      'ESENSA': 'esensa',
      'Espansione Group': 'espansione-marketing',
      'FCI': 'fci', 
      'Foshan Kaiyang': 'foshan',
      'HAAG-STREIT': 'haag-streit-u-k',
      'Haag-Streit': 'haag-streit-u-k',
      'HEINE': 'heine',
      'Johnson & Johnson': 'johnson-johnson-vision',
      'Keeler': 'KEELER'
    };

    let matchedCount = 0;
    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handle quoted values)
        const columns = parseCSVLine(line);
        if (columns.length < 6) continue;

        const [brand, sku, titleEn, titleFr, descEn, descFr] = columns;
        
        // Skip if no SKU (some rows might not have one)
        if (!sku || sku.trim() === '') {
          console.log(`⏭️  Skipping ${brand} - No SKU/Reference provided`);
          continue;
        }

        // Map manufacturer name
        const dbManufacturer = manufacturerMap[brand] || brand.toLowerCase();
        
        console.log(`🔍 Searching for: ${sku} (${brand} → ${dbManufacturer})`);

        // Search for product in database with multiple matching strategies
        let product = null;

        // Strategy 1: Exact SKU match with exact manufacturer
        product = await prisma.products.findFirst({
          where: {
            reference_fournisseur: sku,
            constructeur: dbManufacturer
          },
          include: { product_translations: true }
        });

        // Strategy 2: Exact SKU match with any manufacturer (in case of variations)
        if (!product) {
          product = await prisma.products.findFirst({
            where: {
              reference_fournisseur: sku
            },
            include: { product_translations: true }
          });
        }

        // Strategy 3: Fuzzy SKU match (remove spaces, dashes, periods)
        if (!product) {
          const normalizedSku = normalizeReference(sku);
          const possibleProducts = await prisma.products.findMany({
            where: {
              constructeur: dbManufacturer
            },
            include: { product_translations: true }
          });

          product = possibleProducts.find(p => 
            normalizeReference(p.reference_fournisseur) === normalizedSku
          );
        }

        if (product) {
          console.log(`✅ Found: ${product.reference_fournisseur} (${product.constructeur})`);
          matchedCount++;

          // Update French translation
          const frTrans = product.product_translations.find(t => t.language_code === 'fr');
          if (frTrans) {
            if (frTrans.nom !== titleFr || frTrans.description !== descFr) {
              await prisma.product_translations.update({
                where: { id: frTrans.id },
                data: {
                  nom: titleFr,
                  description: descFr
                }
              });
              console.log(`  🇫🇷 Updated French: ${titleFr}`);
            }
          } else {
            // Create French translation if it doesn't exist
            await prisma.product_translations.create({
              data: {
                id: require('crypto').randomUUID(),
                product_id: product.id,
                language_code: 'fr',
                nom: titleFr,
                description: descFr
              }
            });
            console.log(`  🇫🇷 Created French: ${titleFr}`);
          }

          // Update English translation
          const enTrans = product.product_translations.find(t => t.language_code === 'en');
          if (enTrans) {
            if (enTrans.nom !== titleEn || enTrans.description !== descEn) {
              await prisma.product_translations.update({
                where: { id: enTrans.id },
                data: {
                  nom: titleEn,
                  description: descEn
                }
              });
              console.log(`  🇬🇧 Updated English: ${titleEn}`);
            }
          } else {
            // Create English translation if it doesn't exist
            await prisma.product_translations.create({
              data: {
                id: require('crypto').randomUUID(),
                product_id: product.id,
                language_code: 'en',
                nom: titleEn,
                description: descEn
              }
            });
            console.log(`  🇬🇧 Created English: ${titleEn}`);
          }

          updatedCount++;
        } else {
          console.log(`❌ Not found: ${sku} (${brand})`);
          notFoundCount++;
        }

        console.log(''); // Empty line for readability

      } catch (error) {
        console.error(`❌ Error processing line ${i}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 PROFESSIONAL TRANSLATIONS UPDATE SUMMARY');
    console.log('==========================================');
    console.log(`📋 Total processed: ${lines.length - 1} products`);
    console.log(`✅ Products matched: ${matchedCount}`);
    console.log(`🔄 Products updated: ${updatedCount}`);
    console.log(`❌ Products not found: ${notFoundCount}`);
    console.log(`⚠️  Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((matchedCount / (lines.length - 1)) * 100)}%\n`);

    if (matchedCount > 0) {
      console.log('🎉 Professional translations have been successfully applied!');
      console.log('✨ Product names and descriptions updated with high-quality content.');
    }

    if (notFoundCount > 0) {
      console.log(`\n⚠️  ${notFoundCount} products could not be matched. Consider:
- Verifying SKU/Reference codes match database exactly
- Checking manufacturer name variations
- Manual review of unmatched products`);
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Critical error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Helper function to parse CSV line with quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to normalize reference codes for fuzzy matching
function normalizeReference(ref) {
  return ref.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

// Run the update
updateWithProfessionalTranslations();