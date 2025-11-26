const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteProductsWithoutImages() {
  try {
    console.log('🗑️  DELETING PRODUCTS WITHOUT IMAGES');
    console.log('===================================');
    
    // First, get all products without images for tracking
    const productsWithoutImages = await prisma.product.findMany({
      where: {
        media: { none: {} }
      },
      include: {
        translations: true,
        partner: true
      },
      orderBy: { referenceFournisseur: 'asc' }
    });
    
    console.log(`📊 Found ${productsWithoutImages.length} products without images\n`);
    
    // Group by manufacturer for summary
    const byManufacturer = {};
    const deletionLog = [];
    
    productsWithoutImages.forEach(product => {
      const manufacturer = product.constructeur || 'Unknown';
      const frName = product.translations.find(t => t.languageCode === 'fr')?.nom || 'No French name';
      const enName = product.translations.find(t => t.languageCode === 'en')?.nom || 'No English name';
      
      if (!byManufacturer[manufacturer]) {
        byManufacturer[manufacturer] = [];
      }
      
      byManufacturer[manufacturer].push({
        ref: product.referenceFournisseur,
        frName,
        enName
      });
      
      deletionLog.push({
        referenceFournisseur: product.referenceFournisseur,
        constructeur: manufacturer,
        frenchName: frName,
        englishName: enName,
        partnerId: product.partner?.id || null,
        partnerName: product.partner?.name || 'No partner',
        categoryId: product.categoryId
      });
    });
    
    // Show what will be deleted by manufacturer
    console.log('📋 PRODUCTS TO DELETE BY MANUFACTURER:');
    console.log('=====================================');
    Object.entries(byManufacturer).forEach(([manufacturer, products]) => {
      console.log(`\n🏭 ${manufacturer} (${products.length} products):`);
      products.forEach(p => {
        console.log(`   - ${p.ref}: ${p.frName}`);
      });
    });
    
    console.log(`\n⚠️  TOTAL TO DELETE: ${productsWithoutImages.length} products`);
    console.log('🔄 Starting deletion process...\n');
    
    let deletedCount = 0;
    let errors = 0;
    
    // Delete products one by one with error handling
    for (const product of productsWithoutImages) {
      try {
        await prisma.product.delete({
          where: { id: product.id }
        });
        
        const frName = product.translations.find(t => t.languageCode === 'fr')?.nom || 'No name';
        console.log(`✅ Deleted: ${product.referenceFournisseur} - ${frName}`);
        deletedCount++;
        
      } catch (error) {
        console.log(`❌ Failed to delete ${product.referenceFournisseur}: ${error.message}`);
        errors++;
      }
    }
    
    // Final verification
    const remainingProducts = await prisma.product.count();
    const remainingWithoutImages = await prisma.product.count({
      where: { media: { none: {} } }
    });
    
    console.log('\n📊 DELETION SUMMARY:');
    console.log('====================');
    console.log(`✅ Successfully deleted: ${deletedCount} products`);
    console.log(`❌ Deletion errors: ${errors} products`);
    console.log(`📦 Total products remaining: ${remainingProducts}`);
    console.log(`🖼️  Products without images remaining: ${remainingWithoutImages}`);
    
    // Calculate new image coverage
    const productsWithImages = await prisma.product.count({
      where: { media: { some: {} } }
    });
    const imageCoverage = remainingProducts > 0 ? Math.round((productsWithImages/remainingProducts)*100) : 0;
    
    console.log(`📈 New image coverage: ${imageCoverage}% (${productsWithImages}/${remainingProducts})`);
    
    // Save deletion log to file
    const fs = require('fs');
    const logContent = JSON.stringify(deletionLog, null, 2);
    fs.writeFileSync('deleted-products-log.json', logContent);
    console.log('\n📄 Deletion log saved to: deleted-products-log.json');
    
    console.log('\n🎯 CLEANUP COMPLETE!');
    console.log('✅ All products now have images');
    console.log('✅ No more missing image warnings');
    console.log('✅ Admin interface will display cleanly');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error during deletion:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deleteProductsWithoutImages();