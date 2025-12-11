const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Translation mappings for common Keeler product types
const productTranslations = {
  // Ophthalmoscopes
  'pocket ophthalmoscope': {
    fr: { 
      name: 'Ophtalmoscope de Poche',
      desc: 'Ophtalmoscope de poche compact et portable pour examens de routine. Éclairage LED haute intensité avec optique de précision. Idéal pour les consultations en salle et les visites à domicile.'
    },
    en: { 
      name: 'Pocket Ophthalmoscope',
      desc: 'Compact and portable pocket ophthalmoscope for routine examinations. High-intensity LED illumination with precision optics. Ideal for ward rounds and home visits.'
    }
  },
  'oftalmoscopio de bolsillo jazz led': {
    fr: { 
      name: 'Ophtalmoscope de Poche Jazz LED',
      desc: 'Ophtalmoscope Jazz LED compact avec technologie d\'éclairage avancée. Design ergonomique et construction robuste. Parfait pour les examens ophtalmiques rapides et précis.'
    },
    en: { 
      name: 'Jazz LED Pocket Ophthalmoscope',
      desc: 'Compact Jazz LED ophthalmoscope with advanced illumination technology. Ergonomic design and robust construction. Perfect for quick and accurate ophthalmic examinations.'
    }
  },
  
  // Otoscopes
  'led practitioner otoscope': {
    fr: { 
      name: 'Otoscope Practitioner LED',
      desc: 'Otoscope professionnel avec éclairage LED pour examens auriculaires. Leader du marché pour utilisation hospitalière et médecine générale. Vue claire et brillante pour diagnostic précis.'
    },
    en: { 
      name: 'LED Practitioner Otoscope',
      desc: 'Professional otoscope with LED illumination for ear examinations. Market leader for hospital and general practice use. Clear, bright view for accurate diagnosis.'
    }
  },
  'led fibre optic otoscope': {
    fr: { 
      name: 'Otoscope à Fibre Optique LED',
      desc: 'Otoscope à fibre optique nouvelle génération avec éclairage LED supérieur. Transmission de lumière optimale pour vue détaillée du conduit auditif et du tympan.'
    },
    en: { 
      name: 'LED Fibre Optic Otoscope',
      desc: 'Next-generation fibre optic otoscope with superior LED illumination. Optimal light transmission for detailed view of ear canal and tympanic membrane.'
    }
  },
  
  // Tonometers
  'pulsair desktop – non contact tonometer': {
    fr: { 
      name: 'Tonomètre Sans Contact Pulsair Desktop',
      desc: 'Tonomètre à air pulsé Keeler Pulsair pour mesure non-invasive de la pression intraoculaire. Visualisation exceptionnelle du patient avec technologie de jet d\'air doux.'
    },
    en: { 
      name: 'Pulsair Desktop Non-Contact Tonometer',
      desc: 'Keeler Pulsair air-puff tonometer for non-invasive intraocular pressure measurement. Exceptional patient visualization with gentle air puff technology.'
    }
  },
  'pulsair intellipuff – non contact tonometer': {
    fr: { 
      name: 'Tonomètre Sans Contact Pulsair IntelliPuff',
      desc: 'Tonomètre Pulsair IntelliPuff avec technologie de jet d\'air intelligent et adaptatif. Mesure précise et confortable de la PIO pour tous les patients.'
    },
    en: { 
      name: 'Pulsair IntelliPuff Non-Contact Tonometer',
      desc: 'Pulsair IntelliPuff tonometer with intelligent adaptive air puff technology. Accurate and comfortable IOP measurement for all patients.'
    }
  },
  
  // Batteries
  'lithium battery pour wireless vantage plus': {
    fr: { 
      name: 'Batterie Lithium pour Vantage Plus Sans Fil',
      desc: 'Batterie lithium rechargeable haute capacité pour ophtalmoscope indirect Vantage Plus. Alimentation fiable et longue durée pour examens prolongés.'
    },
    en: { 
      name: 'Lithium Battery for Wireless Vantage Plus',
      desc: 'High-capacity rechargeable lithium battery for Vantage Plus indirect ophthalmoscope. Reliable, long-lasting power for extended examinations.'
    }
  },
  'double lithium upgrade kit': {
    fr: { 
      name: 'Kit de Mise à Niveau Double Lithium',
      desc: 'Kit complet avec 2 poignées et chargeur double lithium. S\'adapte parfaitement aux instruments diagnostiques Keeler. Solution d\'alimentation pratique et efficace.'
    },
    en: { 
      name: 'Double Lithium Upgrade Kit',
      desc: 'Complete kit with 2 handles and double lithium charger. Fits neatly into Keeler diagnostic instruments. Convenient and efficient power solution.'
    }
  },
  
  // Slit Lamps
  'lámpara de hendidura portátil keeler psl one': {
    fr: { 
      name: 'Lampe à Fente Portable Keeler PSL One',
      desc: 'Lampe à fente portable PSL One pour examens biomicroscopiques. Optique de haute qualité avec grossissement variable. Parfaite pour examens en mobilité.'
    },
    en: { 
      name: 'Keeler PSL One Portable Slit Lamp',
      desc: 'PSL One portable slit lamp for biomicroscopic examinations. High-quality optics with variable magnification. Perfect for mobile examinations.'
    }
  },
  
  // Indirect Ophthalmoscopes  
  'all pupil 2 led upgrade': {
    fr: { 
      name: 'Kit de Mise à Niveau All Pupil II LED',
      desc: 'Kit de conversion LED pour ophtalmoscope indirect All Pupil II. Amélioration significative de l\'éclairage avec technologie LED moderne. Installation facile et compatibilité totale.'
    },
    en: { 
      name: 'All Pupil II LED Upgrade Kit',
      desc: 'LED conversion kit for All Pupil II indirect ophthalmoscope. Significant illumination improvement with modern LED technology. Easy installation and full compatibility.'
    }
  },
  
  // Accessories
  'pack de four assorted colour handle sleeves': {
    fr: { 
      name: 'Pack de 4 Manchons de Poignée Couleurs Assorties',
      desc: 'Ensemble de 4 manchons colorés pour poignées d\'instruments Keeler. Identification facile et hygiène améliorée. Protection supplémentaire et prise en main confortable.'
    },
    en: { 
      name: 'Pack of Four Assorted Colour Handle Sleeves',
      desc: 'Set of 4 colored sleeves for Keeler instrument handles. Easy identification and improved hygiene. Additional protection and comfortable grip.'
    }
  },
  'd-kat tonometer calibration arm assembly': {
    fr: { 
      name: 'Ensemble Bras de Calibration D-KAT pour Tonomètre',
      desc: 'Accessoire de calibration D-KAT authentique Keeler pour tonomètres à aplanation. Assure la précision et la fiabilité des mesures de PIO.'
    },
    en: { 
      name: 'D-KAT Tonometer Calibration Arm Assembly',
      desc: 'Genuine Keeler D-KAT calibration accessory for applanation tonometers. Ensures accuracy and reliability of IOP measurements.'
    }
  },
  'binocular indirect face shield': {
    fr: { 
      name: 'Écran Facial pour Ophtalmoscope Indirect Binoculaire',
      desc: 'Protection faciale transparente pour ophtalmoscope indirect. Barrière hygiénique entre praticien et patient. Compatible avec tous les modèles Keeler.'
    },
    en: { 
      name: 'Binocular Indirect Face Shield',
      desc: 'Clear face protection for indirect ophthalmoscope. Hygienic barrier between practitioner and patient. Compatible with all Keeler models.'
    }
  },
  'aluminium carry case pour psl': {
    fr: { 
      name: 'Mallette de Transport en Aluminium pour PSL',
      desc: 'Mallette robuste en aluminium pour lampe à fente portable PSL. Protection optimale pendant le transport et le stockage. Intérieur mousse sur mesure.'
    },
    en: { 
      name: 'Aluminium Carry Case for PSL',
      desc: 'Robust aluminium case for PSL portable slit lamp. Optimal protection during transport and storage. Custom foam interior.'
    }
  }
};

async function fixKeelerDescriptions() {
  try {
    console.log('🔧 FIXING KEELER PRODUCT DESCRIPTIONS');
    console.log('=====================================\n');

    // Get all Keeler products
    const keelerProducts = await prisma.products.findMany({
      where: { constructeur: 'KEELER' },
      include: { product_translations: true }
    });

    console.log(`Processing ${keelerProducts.length} Keeler products...\n`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const product of keelerProducts) {
      const frTrans = product.product_translations.find(t => t.language_code === 'fr');
      const enTrans = product.product_translations.find(t => t.language_code === 'en');
      
      const currentName = (frTrans?.nom || enTrans?.nom || '').toLowerCase();
      
      // Find matching translation template
      let translationTemplate = null;
      for (const [key, value] of Object.entries(productTranslations)) {
        if (currentName.includes(key) || currentName.includes(key.replace('–', '-'))) {
          translationTemplate = value;
          break;
        }
      }

      if (translationTemplate) {
        // Update French translation
        if (frTrans) {
          await prisma.product_translations.update({
            where: { id: frTrans.id },
            data: {
              nom: translationTemplate.fr.name,
              description: translationTemplate.fr.desc
            }
          });
          updatedCount++;
        } else {
          await prisma.product_translations.create({
            data: {
              id: require('crypto').randomUUID(),
              product_id: product.id,
              language_code: 'fr',
              nom: translationTemplate.fr.name,
              description: translationTemplate.fr.desc
            }
          });
          createdCount++;
        }

        // Update English translation
        if (enTrans) {
          await prisma.product_translations.update({
            where: { id: enTrans.id },
            data: {
              nom: translationTemplate.en.name,
              description: translationTemplate.en.desc
            }
          });
          updatedCount++;
        } else {
          await prisma.product_translations.create({
            data: {
              id: require('crypto').randomUUID(),
              product_id: product.id,
              language_code: 'en',
              nom: translationTemplate.en.name,
              description: translationTemplate.en.desc
            }
          });
          createdCount++;
        }

        console.log(`✅ Fixed: ${product.reference_fournisseur} - ${translationTemplate.fr.name}`);
      } else {
        // For products without specific templates, clean up existing translations
        if (frTrans && frTrans.nom) {
          // Clean up French name (remove Spanish/English words)
          let cleanFrName = frTrans.nom
            .replace(/oftalmoscopio/gi, 'ophtalmoscope')
            .replace(/lámpara/gi, 'lampe')
            .replace(/deportiva/gi, 'sport')
            .replace(/pour /gi, 'pour ')
            .replace(/avec /gi, 'avec ')
            .replace(/et /gi, 'et ')
            .replace(/de bolsillo/gi, 'de poche');
          
          // Clean up description
          let cleanFrDesc = (frTrans.description || '')
            .replace(/pour /gi, 'pour ')
            .replace(/avec /gi, 'avec ')
            .replace(/et /gi, 'et ')
            .replace(/New pour 2024/gi, 'Nouveau pour 2024')
            .replace(/The industry leader/gi, 'Leader du marché');

          if (cleanFrName !== frTrans.nom || cleanFrDesc !== frTrans.description) {
            await prisma.product_translations.update({
              where: { id: frTrans.id },
              data: {
                nom: cleanFrName,
                description: cleanFrDesc || 'Instrument diagnostique professionnel Keeler de haute qualité.'
              }
            });
            updatedCount++;
            console.log(`🔄 Cleaned: ${product.reference_fournisseur}`);
          }
        }
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Updated: ${updatedCount} translations`);
    console.log(`✅ Created: ${createdCount} new translations`);
    console.log(`✅ Total processed: ${keelerProducts.length} products`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixKeelerDescriptions();