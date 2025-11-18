const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function importProducts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Loading processed product data...');
    
    const dataFile = path.join(__dirname, '../data/processed-products.json');
    if (!fs.existsSync(dataFile)) {
      console.error('No processed data found. Please run: node scripts/process-csv-import.js first');
      return;
    }
    
    const products = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`Found ${products.length} products to import`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const product of products) {
      try {
        // Check if product already exists
        const existing = await prisma.product.findUnique({
          where: { referenceFournisseur: product.referenceFournisseur }
        });
        
        if (existing) {
          console.log(`⚠️  Skipping ${product.referenceFournisseur} - already exists`);
          skipped++;
          continue;
        }
        
        console.log(`Importing: ${product.translations[0].nom}`);
        
        // Create product with all relations
        const createdProduct = await prisma.product.create({
          data: {
            id: product.id,
            referenceFournisseur: product.referenceFournisseur,
            constructeur: product.constructeur,
            slug: product.slug,
            categoryId: product.categoryId,
            status: product.status,
            isFeatured: product.isFeatured,
            pdfBrochureUrl: product.pdfBrochureUrl,
            translations: {
              create: product.translations.map(trans => ({
                languageCode: trans.languageCode,
                nom: trans.nom,
                description: trans.description,
                ficheTechnique: trans.ficheTechnique
              }))
            },
            media: {
              create: product.media.map(media => ({
                type: media.type,
                url: media.url,
                isPrimary: media.isPrimary,
                sortOrder: media.sortOrder,
                altText: media.altText
              }))
            }
          },
          include: {
            translations: true,
            media: true
          }
        });
        
        console.log(`✅ Imported: ${createdProduct.referenceFournisseur} (${createdProduct.translations.length} translations, ${createdProduct.media.length} media files)`);
        imported++;
        
      } catch (error) {
        console.error(`❌ Failed to import ${product.referenceFournisseur}:`, error.message);
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`✅ Successfully imported: ${imported} products`);
    console.log(`⚠️  Skipped (already exist): ${skipped} products`);
    console.log(`❌ Failed: ${products.length - imported - skipped} products`);
    
    if (imported > 0) {
      console.log('\n🎉 Products imported successfully!');
      console.log('You can view them at: http://localhost:3001/fr/admin/products');
    }
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importProducts();
}

module.exports = { importProducts };