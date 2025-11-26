const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Enhanced French medical translation function
const medicalTermsMap = {
  'forceps': 'pinces',
  'scissors': 'ciseaux',
  'curved': 'courbes',
  'straight': 'droites',
  'blunt': 'émoussées',
  'sharp': 'tranchantes',
  'replacement tip': 'pointe de remplacement',
  'replacement': 'remplacement',
  'tip': 'pointe',
  'trephine': 'trépan',
  'keratoplasty': 'kératoplastie',
  'punch': 'perforatrice',
  'glaucoma': 'glaucome',
  'cannula': 'canule',
  'hydrodissection': 'hydrodissection',
  'angled': 'angulées',
  'block': 'bloc',
  'silicone': 'silicone',
  'reusable': 'réutilisable',
  'handle': 'poignée',
  'wrench': 'clé',
  'adjustment': 'ajustement',
  'depth': 'profondeur',
  'mounting': 'montage',
  'hollow': 'creux',
  'capsulorhexis': 'capsulorhexis',
  'incision': 'incision',
  'cross-action': 'à action croisée',
  'distal control': 'contrôle distal',
  'iris': 'iris',
  'serrated jaws': 'mâchoires dentelées',
  'serrated': 'dentelées',
  'jaws': 'mâchoires',
  'counter-clockwise': 'sens antihoraire',
  'retractor': 'écarteur',
  'prongs': 'branches',
  'wounds': 'plaies',
  'caliper': 'compas',
  'graduations': 'graduations',
  'opening': 'ouverture',
  'active part': 'partie active',
  'turbine': 'turbine',
  'manual': 'manuel',
  'hanna': 'Hanna',
  'for': 'pour',
  'with': 'avec',
  'diameter': 'diamètre',
  'limit stop': 'butée limitée',
  'receptacle': 'réceptacle'
};

function translateToFrench(englishText) {
  if (!englishText) return '';
  
  let frenchText = englishText;
  
  // Apply medical terminology mapping
  Object.entries(medicalTermsMap).forEach(([english, french]) => {
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    frenchText = frenchText.replace(regex, french);
  });
  
  return frenchText;
}

async function fixRecentImports() {
  try {
    console.log('🔧 FIXING RECENT IMPORT FRENCH TRANSLATIONS');
    console.log('============================================');
    
    // Get products imported in the last batch (created today)
    const recentProducts = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        translations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${recentProducts.length} recent products to fix\n`);
    
    let fixedCount = 0;
    
    for (const product of recentProducts) {
      const frTranslation = product.translations.find(t => t.languageCode === 'fr');
      const enTranslation = product.translations.find(t => t.languageCode === 'en');
      
      if (!frTranslation || !enTranslation) continue;
      
      // Check if French name is identical to English (indicating corrupt data)
      if (frTranslation.nom === enTranslation.nom || 
          frTranslation.nom.toLowerCase().includes('replacement tip') ||
          frTranslation.nom.toLowerCase().includes('trephine') ||
          frTranslation.nom.toLowerCase().includes('forceps') ||
          frTranslation.nom.toLowerCase().includes('scissors')) {
        
        console.log(`🔧 Fixing: ${product.referenceFournisseur}`);
        console.log(`   ❌ Before: ${frTranslation.nom}`);
        
        // Translate the English name to French
        const frenchName = translateToFrench(enTranslation.nom);
        const frenchDesc = translateToFrench(enTranslation.description || '');
        const frenchSpec = translateToFrench(enTranslation.ficheTechnique || '');
        
        await prisma.productTranslation.update({
          where: { id: frTranslation.id },
          data: {
            nom: frenchName,
            description: frenchDesc || frTranslation.description,
            ficheTechnique: frenchSpec || frTranslation.ficheTechnique
          }
        });
        
        console.log(`   ✅ After:  ${frenchName}`);
        fixedCount++;
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Fixed French translations for ${fixedCount} products`);
    console.log('🌍 Products now have proper French medical terminology');
    
    await prisma.$disconnect();
  } catch(e) { 
    console.error('Error:', e.message); 
    await prisma.$disconnect();
  }
}

fixRecentImports();