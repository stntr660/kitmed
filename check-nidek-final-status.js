const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNidekCurrentStatus() {
  try {
    console.log('🎯 NIDEK PRODUCTS - CURRENT STATUS AFTER AI TRANSFORMATION');
    console.log('=========================================================\n');
    
    // Get NIDEK products with translations
    const nidekProducts = await prisma.products.findMany({
      where: { constructeur: 'nidek-japon' },
      include: { product_translations: true },
      orderBy: { reference_fournisseur: 'asc' }
    });
    
    console.log('Total NIDEK products:', nidekProducts.length);
    console.log('\n📊 QUALITY ANALYSIS:\n');
    
    let highQuality = 0;
    let mediumQuality = 0;
    let lowQuality = 0;
    let samples = [];
    
    for (const product of nidekProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      if (!frTrans || !enTrans) continue;
      
      const frText = (frTrans.nom + ' ' + (frTrans.description || '')).toLowerCase();
      const enText = (enTrans.nom + ' ' + (enTrans.description || '')).toLowerCase();
      
      // Calculate quality score
      let score = 100;
      
      // Check for mixed languages
      if (/\b(the|with|for|and|of|system)\b/.test(frText)) score -= 30;
      if (/\b(pour|avec|le|la|les|système)\b/.test(enText)) score -= 30;
      
      // Check for generic content
      if (frText.includes('équipement médical de précision')) score -= 20;
      if (enText.includes('precision medical equipment')) score -= 20;
      
      // Check for specific details (positive)
      if (frText.includes('chirurgie') || enText.includes('surgery')) score += 10;
      if (frText.includes('mm') || enText.includes('mm')) score += 10;
      if (frText.includes('°') || enText.includes('°')) score += 5;
      
      score = Math.max(0, Math.min(100, score));
      
      if (score >= 80) highQuality++;
      else if (score >= 50) mediumQuality++;
      else lowQuality++;
      
      // Collect samples
      if (samples.length < 5) {
        samples.push({
          ref: product.reference_fournisseur,
          frName: frTrans.nom,
          enName: enTrans.nom,
          frDesc: frTrans.description?.substring(0, 100),
          enDesc: enTrans.description?.substring(0, 100),
          score: score
        });
      }
    }
    
    console.log('High Quality (80%+):', highQuality, '(' + Math.round(highQuality/nidekProducts.length*100) + '%)');
    console.log('Medium Quality (50-79%):', mediumQuality, '(' + Math.round(mediumQuality/nidekProducts.length*100) + '%)');
    console.log('Low Quality (<50%):', lowQuality, '(' + Math.round(lowQuality/nidekProducts.length*100) + '%)');
    
    console.log('\n📦 SAMPLE PRODUCTS:\n');
    samples.forEach(s => {
      console.log('Reference:', s.ref, '(Score:', s.score + '%)');
      console.log('  FR:', s.frName);
      if (s.frDesc) console.log('     ', s.frDesc + '...');
      console.log('  EN:', s.enName);
      if (s.enDesc) console.log('     ', s.enDesc + '...');
      console.log('');
    });
    
    // Check for the original problematic descriptions
    console.log('🔍 CHECKING ORIGINAL PROBLEMS:\n');
    
    const problematicRefs = ['182413010A', '183013050A', '184613040G'];
    for (const ref of problematicRefs) {
      const product = nidekProducts.find(p => p.reference_fournisseur === ref);
      if (product) {
        const fr = product.product_translations.find(t => t.language_code === 'fr');
        const en = product.product_translations.find(t => t.language_code === 'en');
        
        console.log('Product:', ref);
        console.log('  BEFORE: "Système of Chirurgie Ophtalmiques With Accessoires"');
        console.log('  NOW FR:', fr?.nom || 'Missing');
        console.log('  NOW EN:', en?.nom || 'Missing');
        
        // Check if still has mixed languages
        const hasMixedFr = /\b(with|of|system)\b/i.test(fr?.nom || '');
        const hasMixedEn = /\b(avec|système)\b/i.test(en?.nom || '');
        
        if (hasMixedFr || hasMixedEn) {
          console.log('  ⚠️  Still has mixed languages');
        } else {
          console.log('  ✅ Mixed languages fixed');
        }
        console.log('');
      }
    }
    
    console.log('📊 OVERALL NIDEK TRANSFORMATION RESULT:');
    console.log('=======================================');
    const successRate = Math.round((highQuality + mediumQuality) / nidekProducts.length * 100);
    console.log('Success Rate:', successRate + '%');
    
    if (successRate >= 80) {
      console.log('✅ NIDEK products successfully transformed!');
    } else if (successRate >= 60) {
      console.log('⚠️  NIDEK products partially improved');
    } else {
      console.log('❌ NIDEK products need more work');
    }
    
    await prisma.$disconnect();
  } catch(e) { 
    console.error('Error:', e.message); 
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkNidekCurrentStatus();