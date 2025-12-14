const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBatchUpdates() {
  try {
    console.log('🔍 VERIFYING PROFESSIONAL TRANSLATION BATCH UPDATES');
    console.log('=================================================\n');

    // Check for recent translation updates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const recentUpdates = await prisma.product_translations.count({
      where: {
        updated_at: {
          gte: oneDayAgo
        }
      }
    });
    
    const yesterdayUpdates = await prisma.product_translations.count({
      where: {
        updated_at: {
          gte: twoDaysAgo,
          lt: oneDayAgo
        }
      }
    });
    
    console.log('📅 RECENT ACTIVITY ANALYSIS:');
    console.log('==========================');
    console.log(`Translation updates (last 24h): ${recentUpdates}`);
    console.log(`Translation updates (24-48h ago): ${yesterdayUpdates}`);
    
    if (recentUpdates === 0) {
      console.log('⚠️  WARNING: NO recent translation updates found!');
      console.log('This suggests batch processing may not have been applied.\n');
    } else {
      console.log('✅ Recent translation activity detected\n');
    }

    // Check for mixed-language issues that should have been fixed
    console.log('🧪 MIXED-LANGUAGE DETECTION ANALYSIS:');
    console.log('====================================');
    
    // French translations with English words
    const frenchWithEnglish = await prisma.product_translations.findMany({
      where: {
        language_code: 'fr',
        OR: [
          { nom: { contains: ' with ' } },
          { nom: { contains: ' for ' } },
          { nom: { contains: ' and ' } },
          { nom: { contains: ' of ' } },
          { nom: { contains: ' system' } },
          { nom: { contains: ' holder' } },
          { description: { contains: ' with ' } },
          { description: { contains: ' for ' } },
          { description: { contains: ' and ' } }
        ]
      },
      include: {
        products: {
          select: { 
            reference_fournisseur: true, 
            constructeur: true,
            updated_at: true
          }
        }
      },
      take: 10
    });
    
    // English translations with French words
    const englishWithFrench = await prisma.product_translations.findMany({
      where: {
        language_code: 'en',
        OR: [
          { nom: { contains: ' pour ' } },
          { nom: { contains: ' avec ' } },
          { nom: { contains: ' le ' } },
          { nom: { contains: ' la ' } },
          { nom: { contains: ' système' } },
          { nom: { contains: ' ophtalmique' } },
          { description: { contains: ' pour ' } },
          { description: { contains: ' avec ' } },
          { description: { contains: ' le ' } }
        ]
      },
      include: {
        products: {
          select: { 
            reference_fournisseur: true, 
            constructeur: true,
            updated_at: true
          }
        }
      },
      take: 10
    });
    
    console.log(`🇫🇷 French translations with English words: ${frenchWithEnglish.length}`);
    console.log(`🇬🇧 English translations with French words: ${englishWithFrench.length}`);
    
    if (frenchWithEnglish.length > 0) {
      console.log('\n❌ PROBLEMATIC FRENCH TRANSLATIONS:');
      frenchWithEnglish.forEach((trans, i) => {
        console.log(`${i + 1}. ${trans.products.constructeur} ${trans.products.reference_fournisseur}`);
        console.log(`   French: ${trans.nom}`);
        console.log(`   Last updated: ${trans.products.updated_at ? new Date(trans.products.updated_at).toISOString().split('T')[0] : 'Never'}`);
      });
    }
    
    if (englishWithFrench.length > 0) {
      console.log('\n❌ PROBLEMATIC ENGLISH TRANSLATIONS:');
      englishWithFrench.forEach((trans, i) => {
        console.log(`${i + 1}. ${trans.products.constructeur} ${trans.products.reference_fournisseur}`);
        console.log(`   English: ${trans.nom}`);
        console.log(`   Last updated: ${trans.products.updated_at ? new Date(trans.products.updated_at).toISOString().split('T')[0] : 'Never'}`);
      });
    }

    // Check products from specific batches that should have been updated
    console.log('\n🎯 BATCH-SPECIFIC VERIFICATION:');
    console.log('==============================');
    
    // Check some NIDEK products (Batch 4) that had known issues
    const nidekProblematic = await prisma.products.findMany({
      where: {
        constructeur: 'nidek-japon',
        reference_fournisseur: {
          in: ['182413010A', '183013050A', '184613040G', 'SL-1800']
        }
      },
      include: { product_translations: true }
    });
    
    console.log('NIDEK Products (should be fixed):');
    nidekProblematic.forEach(p => {
      const fr = p.product_translations.find(t => t.language_code === 'fr');
      const en = p.product_translations.find(t => t.language_code === 'en');
      
      const frHasEnglish = fr && /\b(with|of|system)\b/i.test(fr.nom);
      const enHasFrench = en && /\b(avec|système)\b/i.test(en.nom);
      
      console.log(`  ${p.reference_fournisseur}:`);
      console.log(`    FR: ${fr?.nom || 'Missing'} ${frHasEnglish ? '❌' : '✅'}`);
      console.log(`    EN: ${en?.nom || 'Missing'} ${enHasFrench ? '❌' : '✅'}`);
    });

    // Overall quality metrics
    console.log('\n📊 OVERALL QUALITY METRICS:');
    console.log('===========================');
    
    const totalProducts = await prisma.products.count();
    const productsWithBothTranslations = await prisma.products.count({
      where: {
        product_translations: {
          some: {
            AND: [
              { language_code: 'fr' },
              { language_code: 'en' }
            ]
          }
        }
      }
    });
    
    // Sample quality analysis
    const sampleProducts = await prisma.products.findMany({
      include: { product_translations: true },
      take: 100,
      orderBy: { updated_at: 'desc' }
    });
    
    let highQuality = 0;
    let mixedLanguageCount = 0;
    
    for (const product of sampleProducts) {
      const fr = product.product_translations.find(t => t.language_code === 'fr');
      const en = product.product_translations.find(t => t.language_code === 'en');
      
      if (!fr || !en) continue;
      
      const frText = (fr.nom + ' ' + (fr.description || '')).toLowerCase();
      const enText = (en.nom + ' ' + (en.description || '')).toLowerCase();
      
      const hasMixedFr = /\b(the|with|for|and|of|system|holder)\b/.test(frText);
      const hasMixedEn = /\b(pour|avec|le|la|système|ophtalmique)\b/.test(enText);
      
      if (hasMixedFr || hasMixedEn) {
        mixedLanguageCount++;
      } else {
        highQuality++;
      }
    }
    
    const qualityRate = Math.round((highQuality / (highQuality + mixedLanguageCount)) * 100);
    
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with both translations: ${productsWithBothTranslations}`);
    console.log(`Sample quality analysis (100 products):`);
    console.log(`  Clean translations: ${highQuality}`);
    console.log(`  Mixed language issues: ${mixedLanguageCount}`);
    console.log(`  Quality rate: ${qualityRate}%`);

    // Final verdict
    console.log('\n🎯 VERIFICATION VERDICT:');
    console.log('========================');
    
    if (recentUpdates === 0) {
      console.log('❌ VERDICT: NO RECENT UPDATES DETECTED');
      console.log('   Professional translation batches may not have been applied to database.');
      console.log('   Recommend re-running batch processors.');
    } else if ((frenchWithEnglish.length + englishWithFrench.length) > 20) {
      console.log('⚠️  VERDICT: UPDATES PARTIALLY APPLIED');
      console.log('   Recent updates detected but significant mixed-language issues remain.');
      console.log('   Additional cleaning may be needed.');
    } else if (qualityRate < 80) {
      console.log('⚠️  VERDICT: MIXED RESULTS');
      console.log('   Some updates applied but quality issues persist.');
      console.log('   Additional processing recommended.');
    } else {
      console.log('✅ VERDICT: UPDATES SUCCESSFULLY APPLIED');
      console.log('   Professional translations appear to be working correctly.');
      console.log('   Mixed-language issues resolved.');
    }

    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run verification
verifyBatchUpdates();