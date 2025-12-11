const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActualDisplayData() {
  try {
    console.log('🔍 CHECKING WHAT ADMIN INTERFACE ACTUALLY SEES');
    console.log('==============================================');
    
    // Check exactly what the API returns for admin interface
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        translations: true,
        media: true,
        partner: true
      }
    });
    
    console.log('📋 Raw database data for admin interface:\n');
    
    products.forEach((p, index) => {
      console.log(`📦 Product ${index + 1}: ${p.referenceFournisseur}`);
      console.log(`   🏭 Constructor field: ${p.constructeur}`);
      console.log(`   🏢 Partner name: ${p.partner?.name}`);
      console.log(`   📸 Media count: ${p.media.length}`);
      
      console.log('   🌍 Translations in DB:');
      p.translations.forEach(t => {
        console.log(`     - ${t.languageCode}: ${t.nom}`);
      });
      
      // Check what API would return for frontend
      const frenchTranslation = p.translations.find(t => t.languageCode === 'fr');
      const englishTranslation = p.translations.find(t => t.languageCode === 'en');
      
      console.log(`   🇫🇷 French in DB: ${frenchTranslation?.nom || 'MISSING'}`);
      console.log(`   🇬🇧 English in DB: ${englishTranslation?.nom || 'MISSING'}`);
      console.log(`   ⚠️  Same name?: ${frenchTranslation?.nom === englishTranslation?.nom ? 'YES - PROBLEM!' : 'No - OK'}`);
      
      if (p.media.length > 0) {
        console.log('   🖼️  Images:');
        p.media.forEach((m, idx) => {
          console.log(`     ${idx + 1}. ${m.url.substring(0, 80)}...`);
        });
      } else {
        console.log('   ❌ No images');
      }
      console.log('');
    });
    
    // Check translation effectiveness
    const identicalNameCount = await prisma.product.count({
      where: {
        translations: {
          some: {
            AND: [
              { languageCode: 'fr' },
              {
                nom: {
                  in: await prisma.productTranslation.findMany({
                    where: { languageCode: 'en' },
                    select: { nom: true }
                  }).then(results => results.map(r => r.nom))
                }
              }
            ]
          }
        }
      }
    });
    
    const totalProducts = await prisma.product.count();
    console.log('📊 TRANSLATION ANALYSIS:');
    console.log('========================');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with identical FR/EN names: ${identicalNameCount}`);
    console.log(`Properly translated: ${totalProducts - identicalNameCount}`);
    
    await prisma.$disconnect();
  } catch(e) { 
    console.error('❌ Error:', e.message); 
    await prisma.$disconnect();
  }
}

checkActualDisplayData();