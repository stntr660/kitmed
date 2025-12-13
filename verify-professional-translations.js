const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyProfessionalUpdates() {
  try {
    console.log('🔍 VERIFYING PROFESSIONAL TRANSLATIONS UPDATE');
    console.log('============================================\n');
    
    // Sample professional products that should have been updated
    const testProducts = [
      { brand: 'ESENSA', sku: '18193' },
      { brand: 'FCI', sku: '30025' },
      { brand: 'HAAG-STREIT', sku: 'BM970' },
      { brand: 'HEINE', sku: 'C-000.32.430' },
      { brand: 'Keeler', sku: '2112-P-1052' }
    ];
    
    // Manufacturer mapping
    const manufacturerMap = {
      'ESENSA': 'esensa',
      'FCI': 'fci', 
      'HAAG-STREIT': 'haag-streit-u-k',
      'HEINE': 'heine',
      'Keeler': 'KEELER'
    };
    
    let verifiedCount = 0;
    let totalChecked = 0;
    
    for (const test of testProducts) {
      const dbManufacturer = manufacturerMap[test.brand];
      
      const product = await prisma.products.findFirst({
        where: {
          reference_fournisseur: test.sku,
          constructeur: dbManufacturer
        },
        include: { product_translations: true }
      });
      
      if (product) {
        totalChecked++;
        const frTrans = product.product_translations.find(t => t.language_code === 'fr');
        const enTrans = product.product_translations.find(t => t.language_code === 'en');
        
        console.log(`📦 ${test.brand} ${test.sku}:`);
        console.log(`  🇫🇷 FR: ${frTrans?.nom || 'Missing'}`);
        if (frTrans?.description) {
          console.log(`     ${frTrans.description.substring(0, 120)}...`);
        }
        console.log(`  🇬🇧 EN: ${enTrans?.nom || 'Missing'}`);
        if (enTrans?.description) {
          console.log(`     ${enTrans.description.substring(0, 120)}...`);
        }
        
        // Check quality indicators
        const hasGoodFrench = frTrans && frTrans.nom && !frTrans.nom.includes('Precision Medical Equipment');
        const hasGoodEnglish = enTrans && enTrans.nom && !enTrans.nom.includes('Precision Medical Equipment');
        const hasMixedLanguageFr = frTrans && /\b(the|with|for|and|system)\b/i.test((frTrans.nom || '') + ' ' + (frTrans.description || ''));
        const hasMixedLanguageEn = enTrans && /\b(pour|avec|le|la|système)\b/i.test((enTrans.nom || '') + ' ' + (enTrans.description || ''));
        
        if (hasGoodFrench && hasGoodEnglish && !hasMixedLanguageFr && !hasMixedLanguageEn) {
          console.log('  ✅ High-quality professional translations verified');
          verifiedCount++;
        } else if (hasMixedLanguageFr || hasMixedLanguageEn) {
          console.log('  ⚠️  Still has mixed languages');
        } else {
          console.log('  ⚠️  Quality could be improved');
        }
        
        console.log('');
      } else {
        console.log(`❌ Product not found: ${test.brand} ${test.sku}`);
      }
    }
    
    // Check overall quality of recently updated products
    const recentlyUpdated = await prisma.products.findMany({
      where: {
        constructeur: { in: ['esensa', 'fci', 'haag-streit-u-k', 'heine', 'KEELER'] },
        product_translations: { some: {} }
      },
      include: { product_translations: true },
      orderBy: { updated_at: 'desc' },
      take: 10
    });
    
    let highQualityCount = 0;
    let totalQualityChecked = 0;
    
    console.log('📊 OVERALL QUALITY CHECK (Recent Updates):');
    console.log('==========================================');
    
    for (const product of recentlyUpdated) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      if (frTrans && enTrans) {
        totalQualityChecked++;
        
        const frText = ((frTrans.nom || '') + ' ' + (frTrans.description || '')).toLowerCase();
        const enText = ((enTrans.nom || '') + ' ' + (enTrans.description || '')).toLowerCase();
        
        const hasGeneric = frText.includes('precision medical equipment') || enText.includes('precision medical equipment');
        const hasMixedFr = /\b(the|with|for|and|system)\b/.test(frText);
        const hasMixedEn = /\b(pour|avec|le|la|système)\b/.test(enText);
        
        if (!hasGeneric && !hasMixedFr && !hasMixedEn) {
          highQualityCount++;
          console.log(`✅ ${product.constructeur.toUpperCase()} ${product.reference_fournisseur}: High quality`);
        } else {
          console.log(`⚠️  ${product.constructeur.toUpperCase()} ${product.reference_fournisseur}: Needs improvement`);
        }
      }
    }
    
    console.log('\n📈 VERIFICATION SUMMARY:');
    console.log('========================');
    console.log(`Sample products verified: ${verifiedCount}/${totalChecked}`);
    console.log(`Overall quality rate: ${totalQualityChecked > 0 ? Math.round((highQualityCount / totalQualityChecked) * 100) : 0}%`);
    
    if (verifiedCount >= totalChecked * 0.8) {
      console.log('\n🎉 SUCCESS: Professional translations successfully applied with high quality!');
    } else {
      console.log('\n⚠️  Some translations may need additional review');
    }
    
    await prisma.$disconnect();
  } catch(e) { 
    console.error('❌ Error:', e.message); 
    process.exit(1);
  }
}

verifyProfessionalUpdates();