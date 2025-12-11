const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Professional French medical translations for MORIA products
const professionalTranslations = {
  // Forceps / Pinces
  '1121B': {
    nom: 'Curette Abadie (petit modèle: Ø 8mm)',
    description: 'La curette Abadie est une petite curette réutilisable qui peut être utilisée pour les procédures d\'éviscération. Instrument de précision conçu pour les interventions ophtalmiques délicates.',
    ficheTechnique: 'Curette chirurgicale Abadie de petit diamètre (8mm). Construction en acier inoxydable de qualité médicale. Design ergonomique pour un contrôle optimal.'
  },

  '13160': {
    nom: 'Pinces Bonn (dents 0.12-mm avec plateformes)',
    description: 'Pinces de maintien Bonn réutilisables avec plateformes et micro-dents de 0,12 mm face à face, avec manche cage d\'oiseau. Idéales pour maintenir l\'œil pendant la chirurgie ophtalmique.',
    ficheTechnique: 'Pinces de précision avec micro-dents pour manipulation délicate. Plateformes intégrées pour une prise sûre. Manche ergonomique texturé.'
  },

  '13161': {
    nom: 'Pinces Bonn-Moria (dents 0.12-mm avec plateformes)',
    description: 'Pinces de maintien Bonn réutilisables avec plateformes et micro-dents de 0,12 mm face à face, avec manche cage d\'oiseau. Conçues pour la manipulation délicate des tissus oculaires.',
    ficheTechnique: 'Pinces de maintien de haute précision. Micro-dents de 0,12 mm pour minimiser les traumatismes tissulaires. Construction robuste en acier inoxydable.'
  },

  '13167': {
    nom: 'Pinces Moria (plateformes 7-mm, droites, 10/0)',
    description: 'Pinces Moria avec manche plat strié, droites, pour monofilament 10/0, avec plateformes de 7 mm et longueur totale de 10,9 cm.',
    ficheTechnique: 'Pinces spécialisées pour sutures fines 10/0. Plateformes de 7 mm pour manipulation précise. Manche ergonomique antidérapant.'
  },

  '13238': {
    nom: 'Pinces Blaydes (action croisée, mâchoires 7-mm)',
    description: 'Longueur totale de 11,9 cm avec partie active de 13 mm. Manche ergonomique, délicat et résistant pour la manipulation des tissus fins.',
    ficheTechnique: 'Pinces à action croisée pour manipulation délicate. Mâchoires de 7 mm avec design ergonomique. Construction renforcée pour durabilité.'
  },

  '13240': {
    nom: 'Pinces Bonn-Kraff (dents obliques 0.1-mm et plateformes de nouage)',
    description: 'Pinces Bonn-Kraff réutilisables avec dents obliques de 0,1 mm et plateformes de nouage, avec manche cage d\'oiseau. Parfaites pour les procédures de suture délicate.',
    ficheTechnique: 'Pinces de nouage spécialisées avec dents obliques ultra-fines. Plateformes intégrées pour faciliter les nœuds. Manche texturé pour prise sécurisée.'
  },

  '13245': {
    nom: 'Pinces Mac Pherson-Moria (dents 0.2-mm avec plateformes, angulées)',
    description: 'Pinces Mac Pherson-Moria réutilisables, angulées, avec dents de 0,2 mm et plateformes, avec poignée en griffe pour une préhension optimale.',
    ficheTechnique: 'Pinces angulées pour accès difficile. Dents de précision 0,2 mm. Poignée ergonomique avec texture antidérapante pour contrôle maximal.'
  },

  '13261': {
    nom: 'Pinces Waring (mâchoires 7-mm)',
    description: 'Longueur totale de 11,7 cm avec partie active incorporant des plateformes de 7 mm. Instrument polyvalent pour diverses procédures ophtalmiques.',
    ficheTechnique: 'Pinces polyvalentes avec mâchoires de 7 mm. Construction équilibrée pour réduire la fatigue. Surface texturée pour préhension optimale.'
  },

  '17161': {
    nom: 'Pinces de Maintien Faulkner (mâchoires 7-mm)',
    description: 'Longueur totale de 11,7 cm avec partie active de 11 mm incluant mâchoires inclinées, émoussées et arrondies de 7 mm.',
    ficheTechnique: 'Pinces de maintien avec mâchoires inclinées pour accès anatomique optimal. Surface émoussée pour minimiser les traumatismes tissulaires.'
  },

  '18158': {
    nom: 'Pinces Colin (action croisée, mâchoires striées)',
    description: 'Ergonomiques, longueur totale de 11,7 cm avec partie active courbe de 5 mm. Peuvent être utilisées comme pinces hémostatiques pour les petits vaisseaux.',
    ficheTechnique: 'Pinces hémostatiques de précision. Action croisée pour force de serrage contrôlée. Mâchoires striées pour préhension sécurisée.'
  },

  '18225': {
    nom: 'Pinces Fechtner (plateformes de nouage fines)',
    description: 'Ergonomiques, droites avec micro-plateforme. Atraumatiques grâce à leur pointe constituée de plateformes de nouage délicates.',
    ficheTechnique: 'Pinces de nouage ultra-fines avec plateformes micro. Design atraumatique pour préservation tissulaire. Construction légère et équilibrée.'
  },

  '19003': {
    nom: 'Pinces à Implant (mâchoires 8-mm)',
    description: 'Pinces à implant à action directe de 12,8 cm avec partie active de 8 mm. Conçues pour l\'implantation et la manipulation d\'implants intraoculaires.',
    ficheTechnique: 'Pinces spécialisées pour implants IOL. Mâchoires de 8 mm avec surface protectrice. Action directe pour contrôle précis de la force.'
  },

  '19074': {
    nom: 'Pinces d\'Explantation IOL (mâchoires striées 7-mm)',
    description: 'Longueur totale de 11,9 cm, partie active avec mâchoires striées de 7 mm. Conçues pour retirer en sécurité les implants intraoculaires.',
    ficheTechnique: 'Pinces d\'explantation spécialisées. Mâchoires striées pour préhension sécurisée des IOL. Design minimise les risques de dommages aux implants.'
  },

  '19079': {
    nom: 'Pinces de Capsulorhexis Hachet (incision 2.2-mm, action croisée)',
    description: 'Pinces de capsulorhexis à action croisée avec partie active courbe et pointe angulée à ≈45° pour produire une capsulorhexis parfaitement ronde.',
    ficheTechnique: 'Pinces spécialisées capsulorhexis avec pointe angulée de précision. Action croisée pour contrôle fin. Incision minimale 2,2 mm.'
  },

  '19082': {
    nom: 'Pinces De Laage (courbes)',
    description: 'Longueur totale de 94 cm avec partie active courbe de 7 mm. Conçues pour la sclérectomie profonde et autres procédures du segment postérieur.',
    ficheTechnique: 'Pinces longues pour accès au segment postérieur. Courbure anatomique pour sclérectomie. Longueur exceptionnelle de 94 cm.'
  },

  '20000': {
    nom: 'Pinces Crozafon - 1.8 mm (incision 1.8-mm)',
    description: 'Pinces de capsulorhexis réutilisables avec partie active courbe et pointe angulée à ≈45° pour produire une capsulorhexis parfaitement circulaire.',
    ficheTechnique: 'Pinces capsulorhexis micro-incision 1,8 mm. Pointe angulée de précision pour capsulorhexis parfaite. Design ultra-compact.'
  },

  '20001': {
    nom: 'Micro Pré-Hachoir Crozafon (action croisée, incision 2.2-mm)',
    description: 'Longueur totale de 120 mm avec partie active en forme de pinces de 11 mm de long. Conçu pour le pré-hachage du cristallin.',
    ficheTechnique: 'Micro-instrument de pré-hachage avec action croisée. Longueur de 120 mm pour accès optimal. Partie active spécialisée de 11 mm.'
  },

  '20003': {
    nom: 'Pinces Ogawa (pour insertion de greffon DSAEK)',
    description: 'Longueur de 11,6 cm avec partie active en forme de pinces de 0,5 mm sur 0,45 mm. Spécialement conçues pour l\'insertion de greffons DSAEK.',
    ficheTechnique: 'Pinces ultra-fines pour greffons DSAEK. Dimensions précises 0,5 x 0,45 mm. Design spécialisé pour manipulation délicate des greffons.'
  },

  '20004': {
    nom: 'Pinces Busin 20G (20G, contrôle distal)',
    description: 'Longueur de 14,7 cm avec partie active de 2,2 cm. Conçues pour placer un greffon cornéen et effectuer des sutures de sécurité.',
    ficheTechnique: 'Pinces 20G avec contrôle distal pour greffons cornéens. Partie active de 2,2 cm pour manipulation précise. Design pour sutures de sécurité.'
  },

  '20021': {
    nom: 'Dissecteur Stroma-Descemetique en Y (pour DMEK)',
    description: 'Crochet de stroma descemetique utilisé pendant la première étape de préparation du greffon pour les procédures DMEK.',
    ficheTechnique: 'Dissecteur spécialisé DMEK avec design en Y. Crochet de précision pour séparation stroma-Descemet. Partie active ultra-fine.'
  },

  '20028': {
    nom: 'Spatule Double-Extrémité Fontana (pour DALK)',
    description: 'Une extrémité est une spatule en forme de disque pour le détachement des adhérences intrastromales : semi-flexible et délicate pour éviter la perforation.',
    ficheTechnique: 'Spatule DALK à double extrémité. Disque semi-flexible pour dissection intrastromale. Design prévenaint les perforations accidentelles.'
  },

  '20032': {
    nom: 'Spatule Double-Extrémité Ancel (pour LASIK, SMILE)',
    description: 'Instrument à double extrémité avec : une partie active en forme de crochet, et l\'autre avec une spatule émoussée pour les procédures LASIK et SMILE.',
    ficheTechnique: 'Spatule spécialisée LASIK/SMILE. Double extrémité : crochet et spatule émoussée. Design optimisé pour chirurgie réfractive.'
  },

  '9601': {
    nom: 'Ciseaux Vannas (Courbes émoussées)',
    description: 'Longueur totale de 8,7 cm avec lames courbes émoussées, 5 mm x 0,5 mm. Peuvent être utilisés pour couper la cornée lors de chirurgies ophtalmiques délicates.',
    ficheTechnique: 'Ciseaux de précision Vannas avec lames courbes émoussées. Design ergonomique pour contrôle optimal. Matériau acier inoxydable qualité chirurgicale.'
  }
};

async function improveTranslations() {
  try {
    console.log('✨ AMÉLIORATION DES TRADUCTIONS FRANÇAISES');
    console.log('==========================================');
    
    let updatedCount = 0;
    
    for (const [productRef, translation] of Object.entries(professionalTranslations)) {
      const product = await prisma.product.findUnique({
        where: { referenceFournisseur: productRef },
        include: { translations: true }
      });
      
      if (!product) {
        console.log(`⚠️ Produit non trouvé: ${productRef}`);
        continue;
      }
      
      const frTranslation = product.translations.find(t => t.languageCode === 'fr');
      
      if (frTranslation) {
        await prisma.productTranslation.update({
          where: { id: frTranslation.id },
          data: {
            nom: translation.nom,
            description: translation.description,
            ficheTechnique: translation.ficheTechnique
          }
        });
        
        console.log(`✅ Mis à jour: ${productRef} - ${translation.nom}`);
        updatedCount++;
      }
    }
    
    console.log(`\\n🎯 RÉSUMÉ:`);
    console.log(`✅ Traductions améliorées: ${updatedCount} produits`);
    console.log(`📚 Traductions professionnelles appliquées avec terminologie médicale française`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
  }
}

improveTranslations();