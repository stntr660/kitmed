const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// NIDEK product names based on model numbers
const nidekProductData = {
  'YC-200': { 
    nom: 'YAG Laser YC-200',
    description: 'Laser YAG pour capsulotomie postérieure et iridotomie périphérique avec système de visée précis'
  },
  'US-4000': {
    nom: 'Échographe US-4000',
    description: 'Système d\'échographie ophtalmique haute résolution pour biométrie et diagnostic'
  },
  'SSC-370': {
    nom: 'Caméra Rétinienne SSC-370',
    description: 'Caméra numérique pour fond d\'œil avec capture d\'image haute définition'
  },
  'SL-1800': {
    nom: 'Lampe à Fente SL-1800',
    description: 'Biomicroscope avec système optique Galiléen pour examen du segment antérieur'
  },
  'RT-6100': {
    nom: 'Réfractomètre RT-6100',
    description: 'Réfractomètre automatique avec kératométrie intégrée'
  },
  'RT-3100': {
    nom: 'Réfractomètre RT-3100',
    description: 'Réfractomètre automatique compact avec mesure rapide et précise'
  },
  'RS-330': {
    nom: 'Retinoscope RS-330',
    description: 'Rétinoscope à spot avec lumière halogène pour réfraction objective'
  },
  'PM-700': {
    nom: 'Pachymètre PM-700',
    description: 'Pachymètre ultrasonique pour mesure de l\'épaisseur cornéenne'
  },
  'OT-6400': {
    nom: 'Table Ophtalmique OT-6400',
    description: 'Table motorisée pour instruments ophtalmiques avec élévation électrique'
  },
  'OT-4200': {
    nom: 'Table Ophtalmique OT-4200',
    description: 'Table manuelle pour instruments ophtalmiques avec structure robuste'
  },
  'NT-530': {
    nom: 'Tonomètre NT-530',
    description: 'Tonomètre à air pulsé sans contact pour mesure de la pression intraoculaire'
  },
  'NT-510': {
    nom: 'Tonomètre NT-510', 
    description: 'Tonomètre sans contact automatique avec positionnement 3D'
  },
  'NT-2000': {
    nom: 'Tonomètre NT-2000',
    description: 'Tonomètre portable sans contact pour dépistage'
  },
  'MP-3': {
    nom: 'Micropérimètre MP-3',
    description: 'Micropérimètre avec système de suivi rétinien pour analyse fonctionnelle de la macula'
  },
  'MP-1': {
    nom: 'Micropérimètre MP-1',
    description: 'Micropérimètre pour évaluation de la sensibilité rétinienne'
  },
  'MIRANTE': {
    nom: 'OCT/SLO MIRANTE',
    description: 'Système OCT multimodal avec angiographie et imagerie grand champ'
  },
  'ME-1200': {
    nom: 'Unité de Phacoémulsification ME-1200',
    description: 'Système de phacoémulsification avec contrôle ultrasonique avancé'
  },
  'LM-8': {
    nom: 'Lentimètre LM-8',
    description: 'Lentimètre automatique pour mesure des verres ophtalmiques'
  },
  'LM-1800P': {
    nom: 'Lentimètre LM-1800P',
    description: 'Lentimètre numérique avec imprimante intégrée'
  },
  'LM-1000': {
    nom: 'Lentimètre LM-1000',
    description: 'Lentimètre automatique avec écran LCD'
  },
  'GS-1': {
    nom: 'Green Laser GS-1',
    description: 'Laser vert pour photocoagulation rétinienne'
  },
  'AFC-330': {
    nom: 'Caméra Rétinienne AFC-330',
    description: 'Rétinographe non mydriatique automatique'
  },
  '182413020A': {
    nom: 'Lentille d\'Examen 182413020A',
    description: 'Lentille de contact pour examen du fond d\'œil'
  },
  '185110': {
    nom: 'Accessoire 185110',
    description: 'Accessoire pour équipement NIDEK'
  },
  '185113': {
    nom: 'Accessoire 185113',
    description: 'Accessoire pour équipement NIDEK'
  },
  '190000': {
    nom: 'Consommable 190000',
    description: 'Consommable médical pour équipements NIDEK'
  }
};

async function fixNidekTranslations() {
  try {
    console.log('🔧 FIXING NIDEK-JAPON PRODUCT TRANSLATIONS');
    console.log('==========================================');
    
    // Get all NIDEK-JAPON products without translations
    const productsWithoutTranslations = await prisma.products.findMany({
      where: {
        constructeur: 'nidek-japon',
        product_translations: {
          none: {}
        }
      }
    });
    
    console.log('Found', productsWithoutTranslations.length, 'products without translations');
    
    for (const product of productsWithoutTranslations) {
      const productInfo = nidekProductData[product.reference_fournisseur];
      
      if (productInfo) {
        // Create French translation
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: productInfo.nom,
            description: productInfo.description,
            fiche_technique: null
          }
        });
        
        // Create English translation
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: productInfo.nom.replace('Lampe à Fente', 'Slit Lamp')
                           .replace('Réfractomètre', 'Refractometer')
                           .replace('Tonomètre', 'Tonometer')
                           .replace('Caméra Rétinienne', 'Retinal Camera')
                           .replace('Échographe', 'Ultrasound')
                           .replace('Table Ophtalmique', 'Ophthalmic Table')
                           .replace('Pachymètre', 'Pachymeter')
                           .replace('Lentimètre', 'Lensometer'),
            description: productInfo.description,
            fiche_technique: null
          }
        });
        
        console.log('✅ Added translations for:', product.reference_fournisseur, '-', productInfo.nom);
      } else {
        // Create generic translation based on reference
        const genericName = `NIDEK ${product.reference_fournisseur}`;
        const genericDesc = `Équipement ophtalmique NIDEK - Modèle ${product.reference_fournisseur}`;
        
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'fr',
            nom: genericName,
            description: genericDesc,
            fiche_technique: null
          }
        });
        
        await prisma.product_translations.create({
          data: {
            id: randomUUID(),
            product_id: product.id,
            language_code: 'en',
            nom: genericName,
            description: `NIDEK ophthalmic equipment - Model ${product.reference_fournisseur}`,
            fiche_technique: null
          }
        });
        
        console.log('⚠️  Added generic translation for:', product.reference_fournisseur);
      }
    }
    
    // Verify the fix
    const remainingWithoutTranslations = await prisma.products.count({
      where: {
        constructeur: 'nidek-japon',
        product_translations: {
          none: {}
        }
      }
    });
    
    console.log('\n📊 RESULTS:');
    console.log('Fixed:', productsWithoutTranslations.length, 'products');
    console.log('Remaining without translations:', remainingWithoutTranslations);
    
    await prisma.$disconnect();
    console.log('\n✅ NIDEK translations fix complete!');
  } catch(error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixNidekTranslations();