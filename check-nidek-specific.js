const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificProducts() {
  try {
    console.log('🔍 DETAILED CHECK OF NIDEK PRODUCTS');
    console.log('===================================\n');
    
    const products = await prisma.products.findMany({
      where: { 
        constructeur: 'nidek-japon',
        reference_fournisseur: { in: ['182413010A', '182413020A', 'SL-1800', 'AFC-330'] }
      },
      include: { product_translations: true }
    });
    
    products.forEach(p => {
      const fr = p.product_translations.find(t => t.language_code === 'fr');
      const en = p.product_translations.find(t => t.language_code === 'en');
      
      console.log('📦 Product:', p.reference_fournisseur);
      console.log('  FR Name:', fr?.nom);
      console.log('  EN Name:', en?.nom);
      
      // Analyze problems
      const frProblems = [];
      const enProblems = [];
      
      if (fr?.nom) {
        if (/\bwith\b/i.test(fr.nom)) frProblems.push('Contains "with" (should be "avec")');
        if (/\bof\b/i.test(fr.nom)) frProblems.push('Contains "of" (should be "de")');
        if (/\bsystem\b/i.test(fr.nom)) frProblems.push('Contains "system" (should be "système")');
      }
      
      if (en?.nom) {
        if (/\bavec\b/i.test(en.nom)) enProblems.push('Contains "avec" (should be "with")');
        if (/\bde\b/i.test(en.nom) && !/\bde\s[A-Z]/i.test(en.nom)) enProblems.push('Contains "de" (should be "of")');
        if (/\bophtalmique\b/i.test(en.nom)) enProblems.push('Contains "ophtalmique" (should be "ophthalmic")');
        if (/\bchirurgie\b/i.test(en.nom)) enProblems.push('Contains "chirurgie" (should be "surgery")');
      }
      
      if (frProblems.length > 0) {
        console.log('  ❌ French issues:', frProblems.join(', '));
      } else {
        console.log('  ✅ French: Clean');
      }
      
      if (enProblems.length > 0) {
        console.log('  ❌ English issues:', enProblems.join(', '));
      } else {
        console.log('  ✅ English: Clean');
      }
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch(e) { 
    console.error('Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSpecificProducts();