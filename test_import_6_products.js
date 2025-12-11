const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// CSV parser function
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function testImport6Products() {
  const prisma = new PrismaClient();
  
  console.log('🧪 TEST IMPORT: 6 Products (3 MORIA + 3 KEELER)');
  console.log('================================================');
  
  try {
    // Find the test CSV file
    const dataDir = path.join(__dirname, 'data');
    const testFiles = fs.readdirSync(dataDir).filter(f => f.includes('kitmed_TEST_import'));
    
    if (testFiles.length === 0) {
      throw new Error('No test CSV file found! Please run create_test_sample.js first.');
    }
    
    const testCsvFile = path.join(dataDir, testFiles[testFiles.length - 1]); // Get the latest
    console.log('📁 Using test file:', testCsvFile);
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(testCsvFile, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = parseCSVLine(lines[0]);
    
    console.log('📋 CSV headers:', headers.length, 'columns');
    console.log('📊 Total test products:', lines.length - 1);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('\n🔄 Starting import...\n');
    
    // Process each product
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const values = parseCSVLine(line);
        
        // Map CSV columns to product data
        const productData = {
          referenceFournisseur: values[0] || '',
          constructeur: values[1] || '',
          slug: values[2] || '',
          categoryId: values[3] || 'ophthalmology-surgical',
          status: values[4] || 'active',
          isFeatured: values[5] === 'true' || false,
          
          // Core URLs
          imageUrl: values[12] || null,
          pdfBrochureUrl: values[16] || null,
          
          // Check for existing product
        };
        
        console.log(`📦 Processing: ${productData.referenceFournisseur} (${productData.constructeur})`);
        
        // Check if product already exists
        const existing = await prisma.product.findUnique({
          where: { referenceFournisseur: productData.referenceFournisseur }
        });
        
        if (existing) {
          console.log(`  ⚠️  SKIPPED - Product already exists: ${productData.referenceFournisseur}`);
          skipped++;
          continue;
        }
        
        // Find partner by manufacturer name
        const partner = await prisma.partner.findFirst({
          where: { name: productData.constructeur }
        });
        
        if (!partner) {
          console.log(`  ❌ ERROR - No partner found for manufacturer: ${productData.constructeur}`);
          errors++;
          continue;
        }
        
        // Create the product with full data
        const createdProduct = await prisma.product.create({
          data: {
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: productData.slug,
            categoryId: productData.categoryId,
            status: productData.status,
            isFeatured: productData.isFeatured,
            partnerId: partner.id,
            
            // Translations
            translations: {
              create: [
                {
                  languageCode: 'fr',
                  nom: values[6] || values[7] || 'Produit médical',
                  description: values[8] || 'Équipement médical professionnel',
                  ficheTechnique: values[10] || ''
                },
                {
                  languageCode: 'en', 
                  nom: values[7] || values[6] || 'Medical product',
                  description: values[9] || 'Professional medical equipment',
                  ficheTechnique: values[11] || ''
                }
              ]
            },
            
            // Media
            media: {
              create: [
                // Primary image
                ...(productData.imageUrl ? [{
                  type: 'image',
                  url: productData.imageUrl,
                  isPrimary: true,
                  sortOrder: 0,
                  altText: values[7] || 'Product image'
                }] : []),
                
                // Secondary images
                ...(values[13] ? [{
                  type: 'image',
                  url: values[13],
                  isPrimary: false,
                  sortOrder: 1,
                  altText: `${values[7]} - Image 2`
                }] : []),
                
                ...(values[14] ? [{
                  type: 'image',
                  url: values[14],
                  isPrimary: false,
                  sortOrder: 2,
                  altText: `${values[7]} - Image 3`
                }] : []),
                
                ...(values[15] ? [{
                  type: 'image',
                  url: values[15],
                  isPrimary: false,
                  sortOrder: 3,
                  altText: `${values[7]} - Image 4`
                }] : []),
                
                // PDF if available
                ...(productData.pdfBrochureUrl ? [{
                  type: 'pdf',
                  url: productData.pdfBrochureUrl,
                  isPrimary: false,
                  sortOrder: 10,
                  altText: `${values[7]} - Brochure`
                }] : [])
              ]
            }
          },
          include: {
            translations: true,
            media: true,
            partner: true
          }
        });
        
        const mediaCount = createdProduct.media.length;
        const translationCount = createdProduct.translations.length;
        
        console.log(`  ✅ IMPORTED: ${createdProduct.referenceFournisseur}`);
        console.log(`     Partner: ${createdProduct.partner.name}`);
        console.log(`     Translations: ${translationCount} | Media: ${mediaCount}`);
        
        imported++;
        
      } catch (error) {
        console.log(`  ❌ ERROR importing ${values[0]}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST IMPORT COMPLETE!');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${imported} products`);
    console.log(`⚠️  Skipped (already exist): ${skipped} products`);
    console.log(`❌ Errors: ${errors} products`);
    console.log(`📊 Total processed: ${imported + skipped + errors} products`);
    
    if (imported > 0) {
      console.log('\n🎉 SUCCESS! Test products imported.');
      console.log('🔍 Next steps:');
      console.log('  1. Check admin dashboard: http://localhost:3001/fr/admin/products');
      console.log('  2. Verify French/English translations');
      console.log('  3. Test image loading');
      console.log('  4. Verify manufacturer mapping');
      console.log('  5. If all good → import full dataset (615 products)');
    }
    
    return {
      imported,
      skipped, 
      errors,
      total: imported + skipped + errors
    };
    
  } catch (error) {
    console.error('❌ Test import failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testImport6Products().then(result => {
    if (result.imported > 0) {
      console.log('\n🎯 TEST SUCCESSFUL!');
      console.log(`Ready to import ${615 - result.imported} remaining products.`);
    } else {
      console.log('\n⚠️  No products were imported. Check the logs above.');
    }
  }).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testImport6Products };