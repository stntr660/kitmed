const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// French translation mappings for medical terminology
const medicalTermsMap = {
  // Basic terms
  'forceps': 'pinces',
  'scissors': 'ciseaux', 
  'curved': 'courbes',
  'straight': 'droites',
  'blunt': 'émoussées',
  'sharp': 'tranchantes',
  'reusable': 'réutilisables',
  'length': 'longueur',
  'total length': 'longueur totale',
  'active part': 'partie active',
  'platforms': 'plateformes',
  'teeth': 'dents',
  'jaws': 'mâchoires',
  'tip': 'pointe',
  'handle': 'manche',
  
  // Measurements
  'mm': 'mm',
  'cm': 'cm',
  
  // Medical procedures  
  'ophthalmic surgery': 'chirurgie ophtalmique',
  'cornea': 'cornée',
  'eye': 'œil',
  'eyeball': 'globe oculaire',
  'iris': 'iris',
  'conjunctiva': 'conjonctive',
  'sclera': 'sclère',
  'retina': 'rétine',
  
  // Actions
  'can be used': 'peut être utilisé',
  'used to': 'utilisé pour',
  'used for': 'utilisé pour',
  'hold': 'maintenir',
  'cut': 'couper',
  'manipulate': 'manipuler',
  'grasp': 'saisir',
  'seize': 'saisir',
  
  // Descriptions
  'micro teeth': 'micro-dents',
  'oblique teeth': 'dents obliques',
  'serrated': 'dentelées',
  'smooth': 'lisses',
  'cross-action': 'à action croisée',
  'double-ended': 'à double extrémité',
  'angled': 'angulées',
  'with': 'avec'
};

// Pre-defined high-quality French translations for specific products
const productTranslations = {
  '9601': {
    nom: 'Vannas Ciseaux (Courbes émoussées)',
    description: 'Longueur totale de 8,7 cm avec lames courbes émoussées, 5 mm x 0,5 mm. Peut être utilisé pour couper la cornée lors de chirurgies ophtalmiques délicates.',
    ficheTechnique: 'Ciseaux de précision Vannas avec lames courbes émoussées. Conception ergonomique pour un contrôle optimal. Matériau en acier inoxydable de qualité chirurgicale.'
  },
  
  '13246': {
    nom: 'Pinces Bonn-Kraff (0.12-mm dents avec plateformes)',
    description: 'Pinces de maintien Bonn-Kraff réutilisables avec plateformes et micro-dents de 0,12 mm face à face, avec manche cage d\'oiseau. Peut être utilisé pour maintenir l\'œil pendant la chirurgie ophtalmique.',
    ficheTechnique: 'Pinces de précision avec micro-dents pour manipulation délicate des tissus. Design ergonomique avec manche texturé pour une prise sûre.'
  },
  
  '7850A': {
    nom: 'Pinces Bonn-Moria (0.18-mm dents avec plateformes)',
    description: 'Pinces de maintien Bonn-Moria réutilisables avec plateformes et micro-dents de 0,18 mm face à face. Peut être utilisé pour maintenir la cornée.',
    ficheTechnique: 'Pinces de haute précision avec plateformes pour manipulation sûre des tissus cornéens. Construction robuste en acier inoxydable.'
  },
  
  '1205-P-5010': {
    nom: 'Vantage Plus LED Digital avec logiciel Keeler Kapture',
    description: 'Images et documentation numériques exceptionnelles d\'un simple clic. Le Vantage Plus LED offre une imagerie rétinienne de haute qualité avec un logiciel intégré pour la capture et l\'analyse d\'images.',
    ficheTechnique: 'Système d\'imagerie rétinienne numérique avec technologie LED avancée. Interface intuitive avec logiciel Keeler Kapture pour gestion complète des images patient.'
  },
  
  '2414-P-5032': {
    nom: 'Plaque Guide de Tonomètre KAT T (Démontable)',
    description: 'Accessoire original Keeler pour votre tonomètre d\'aplanation. Pièce de rechange de haute qualité conçue pour maintenir la précision et la fiabilité de vos mesures de pression intraoculaire.',
    ficheTechnique: 'Plaque guide de remplacement pour tonomètre Keeler. Fabrication de précision pour assurer des mesures exactes. Compatible avec les modèles KAT T.'
  },
  
  '3010-P-2000': {
    nom: 'Keeler PSL Classic – Lampe à Fente Portable de Main',
    description: 'Excellence en optique, polyvalence et portabilité. Le PSL Classic combine l\'optique supérieure de Keeler avec la commodité d\'un design portable pour l\'examen ophtalmique en déplacement.',
    ficheTechnique: 'Lampe à fente portable avec optiques Keeler de qualité supérieure. Design compact et léger pour examens en clinique ou à domicile. Éclairage LED avec contrôle d\'intensité variable.'
  }
};

// Basic French translation function
function translateToFrench(englishText, productRef = '') {
  if (!englishText) return '';
  
  // Check for pre-defined translations first
  if (productRef && productTranslations[productRef]) {
    return productTranslations[productRef].description;
  }
  
  let frenchText = englishText.toLowerCase();
  
  // Apply medical terminology mapping
  Object.entries(medicalTermsMap).forEach(([english, french]) => {
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
    frenchText = frenchText.replace(regex, french);
  });
  
  // Capitalize first letter
  frenchText = frenchText.charAt(0).toUpperCase() + frenchText.slice(1);
  
  return frenchText;
}

async function fixFrenchTranslations() {
  try {
    console.log('🔧 FIXING FRENCH TRANSLATIONS');
    console.log('==============================');
    
    // Get all products with problematic French descriptions
    const products = await prisma.product.findMany({
      include: {
        translations: true
      }
    });
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const product of products) {
      const frTranslation = product.translations.find(t => t.languageCode === 'fr');
      const enTranslation = product.translations.find(t => t.languageCode === 'en');
      
      if (!frTranslation || !enTranslation) {
        console.log(`⚠️ Missing translations for ${product.referenceFournisseur}`);
        continue;
      }
      
      // Check if French description looks like English
      const frDesc = frTranslation.description || '';
      const enDesc = enTranslation.description || '';
      
      const hasEnglishWords = /\b(the|and|or|with|for|in|at|by|from|up|about|into|through|during|can|be|used|to)\b/.test(frDesc.toLowerCase());
      const hasFrenchWords = /\b(le|la|les|et|ou|avec|pour|dans|par|de|du|sur|sous|entre|peut|être|utilisé|pour)\b/.test(frDesc.toLowerCase());
      
      if (hasEnglishWords && !hasFrenchWords && frDesc.length > 10) {
        console.log(`🔧 Fixing: ${product.referenceFournisseur} (${product.constructeur})`);
        console.log(`   ❌ French (before): ${frDesc.substring(0, 80)}...`);
        
        // Generate French translation
        let newFrenchDesc = '';
        let newFrenchName = frTranslation.nom;
        let newFrenchSpec = frTranslation.ficheTechnique || '';
        
        // Use pre-defined translations if available
        if (productTranslations[product.referenceFournisseur]) {
          const translation = productTranslations[product.referenceFournisseur];
          newFrenchDesc = translation.description;
          newFrenchName = translation.nom;
          newFrenchSpec = translation.ficheTechnique;
        } else {
          // Use basic translation
          newFrenchDesc = translateToFrench(enDesc, product.referenceFournisseur);
          newFrenchSpec = translateToFrench(enTranslation.ficheTechnique || '', product.referenceFournisseur);
        }
        
        // Update the French translation
        await prisma.productTranslation.update({
          where: { id: frTranslation.id },
          data: {
            nom: newFrenchName,
            description: newFrenchDesc,
            ficheTechnique: newFrenchSpec
          }
        });
        
        console.log(`   ✅ French (after): ${newFrenchDesc.substring(0, 80)}...`);
        fixedCount++;
        
      } else if (hasFrenchWords) {
        console.log(`✅ Already correct: ${product.referenceFournisseur}`);
        alreadyCorrectCount++;
      } else {
        console.log(`⚠️ Needs manual review: ${product.referenceFournisseur}`);
      }
    }
    
    console.log('\n📊 TRANSLATION FIX SUMMARY:');
    console.log('============================');
    console.log(`✅ Fixed: ${fixedCount} products`);
    console.log(`✅ Already correct: ${alreadyCorrectCount} products`);
    console.log(`📝 Total processed: ${products.length} products`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error fixing translations:', error);
    await prisma.$disconnect();
  }
}

// Run the fix
fixFrenchTranslations();