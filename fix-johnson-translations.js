const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const johnsonProducts = [
  {
    sku: '1DAYMOIS',
    title_en: '1-DAY ACUVUE MOIST for Astigmatism with LACREON',
    title_fr: '1-DAY ACUVUE MOIST pour Astigmatisme avec LACREON',
    desc_en: 'Daily disposable toric contact lenses with LACREON technology for astigmatism correction. Features Lid Stabilized Design for stable vision throughout the day.',
    desc_fr: 'Lentilles de contact toriques jetables journalières avec technologie LACREON pour la correction de l\'astigmatisme. Conception stabilisée par la paupière pour une vision stable toute la journée.'
  },
  {
    sku: 'ACUVUE2',
    title_en: 'ACUVUE 2 Bi-Weekly Contact Lenses',
    title_fr: 'Lentilles de Contact Bi-Hebdomadaires ACUVUE 2',
    desc_en: 'Bi-weekly hydrogel contact lenses. Thin and easy to handle with blue visibility tint for convenient insertion and removal.',
    desc_fr: 'Lentilles de contact hydrogel bi-hebdomadaires. Fines et faciles à manipuler avec teinte de visibilité bleue pour une insertion et un retrait pratiques.'
  },
  {
    sku: 'ACUVUEOA',
    title_en: 'ACUVUE OASYS 1-DAY with HydraLuxe',
    title_fr: 'ACUVUE OASYS 1-DAY avec HydraLuxe',
    desc_en: 'Daily silicone hydrogel contact lenses with HydraLuxe technology designed to reduce digital eye strain and maintain comfort throughout the day.',
    desc_fr: 'Lentilles de contact en silicone hydrogel journalières avec technologie HydraLuxe conçue pour réduire la fatigue oculaire numérique et maintenir le confort tout au long de la journée.'
  },
  {
    sku: '1DAYACUV',
    title_en: 'ACUVUE OASYS 1-DAY for Astigmatism with HydraLuxe',
    title_fr: 'ACUVUE OASYS 1-DAY pour Astigmatisme avec HydraLuxe',
    desc_en: 'Daily toric silicone hydrogel lenses combining HydraLuxe technology with stabilization design for astigmatism correction and digital comfort.',
    desc_fr: 'Lentilles toriques en silicone hydrogel journalières combinant la technologie HydraLuxe avec une conception stabilisée pour la correction de l\'astigmatisme et le confort numérique.'
  },
  {
    sku: 'ACUVUEMU',
    title_en: '1-DAY ACUVUE MOIST Multifocal',
    title_fr: '1-DAY ACUVUE MOIST Multifocal',
    desc_en: 'Daily contact lenses for presbyopia with Pupil Optimized Design providing clear vision at all distances - near, intermediate, and far.',
    desc_fr: 'Lentilles de contact journalières pour la presbytie avec conception optimisée pour la pupille offrant une vision claire à toutes les distances - proche, intermédiaire et lointaine.'
  },
  {
    sku: 'ACUVUETE',
    title_en: '1-DAY ACUVUE TruEye',
    title_fr: '1-DAY ACUVUE TruEye',
    desc_en: 'Earlier generation daily silicone hydrogel contact lenses. Now replaced by ACUVUE OASYS 1-Day with HydraLuxe in most markets.',
    desc_fr: 'Lentilles de contact en silicone hydrogel journalières de génération précédente. Désormais remplacées par ACUVUE OASYS 1-Day avec HydraLuxe sur la plupart des marchés.'
  },
  {
    sku: 'ACUVUEDA',
    title_en: '1-DAY ACUVUE MOIST Daily Contact Lenses',
    title_fr: 'Lentilles de Contact Journalières 1-DAY ACUVUE MOIST',
    desc_en: 'Standard daily hydrogel contact lenses with long-lasting hydration. Designed for sensitive eyes and all-day comfort.',
    desc_fr: 'Lentilles de contact hydrogel journalières standard avec hydratation longue durée. Conçues pour les yeux sensibles et le confort tout au long de la journée.'
  },
  {
    sku: 'ACUVUEAS',
    title_en: 'ACUVUE OASYS for Astigmatism',
    title_fr: 'ACUVUE OASYS pour Astigmatisme',
    desc_en: 'Bi-weekly toric contact lenses with HYDRACLEAR PLUS technology for exceptional comfort in dry environments and extended wear.',
    desc_fr: 'Lentilles de contact toriques bi-hebdomadaires avec technologie HYDRACLEAR PLUS pour un confort exceptionnel dans les environnements secs et le port prolongé.'
  },
  {
    sku: 'ACUVUEHY',
    title_en: 'ACUVUE OASYS with HYDRACLEAR PLUS',
    title_fr: 'ACUVUE OASYS avec HYDRACLEAR PLUS',
    desc_en: 'Spherical bi-weekly silicone hydrogel lenses. Benchmark for digital comfort with HYDRACLEAR PLUS technology.',
    desc_fr: 'Lentilles sphériques bi-hebdomadaires en silicone hydrogel. Référence pour le confort numérique avec technologie HYDRACLEAR PLUS.'
  },
  {
    sku: 'ACUVUERE',
    title_en: 'ACUVUE RevitaLens Multi-Purpose Solution',
    title_fr: 'Solution Polyvalente ACUVUE RevitaLens',
    desc_en: 'Multi-purpose disinfecting solution compatible with all soft contact lens types for cleaning, rinsing, disinfecting, and storing.',
    desc_fr: 'Solution désinfectante polyvalente compatible avec tous les types de lentilles souples pour le nettoyage, le rinçage, la désinfection et le stockage.'
  },
  {
    sku: 'BLINKCON',
    title_en: 'Blink Contacts Lubricating Eye Drops',
    title_fr: 'Gouttes Oculaires Lubrifiantes Blink Contacts',
    desc_en: 'Lubricating eye drops specifically formulated for contact lens wearers. Relieves dryness and discomfort during lens wear.',
    desc_fr: 'Gouttes oculaires lubrifiantes spécialement formulées pour les porteurs de lentilles de contact. Soulage la sécheresse et l\'inconfort pendant le port des lentilles.'
  },
  {
    sku: 'BLINKINT',
    title_en: 'Blink Intensive Eye Drops',
    title_fr: 'Gouttes Oculaires Blink Intensive',
    desc_en: 'Advanced protective eye drops for persistent dry eye symptoms. Provides enhanced and long-lasting relief.',
    desc_fr: 'Gouttes oculaires protectrices avancées pour les symptômes persistants de sécheresse oculaire. Procure un soulagement renforcé et durable.'
  },
  {
    sku: 'BLINKGEL',
    title_en: 'Blink Intensive Plus Gel Drops',
    title_fr: 'Gouttes Gel Blink Intensive Plus',
    desc_en: 'Viscous gel drops for long-lasting relief of dry eye symptoms. Suitable for day and night use.',
    desc_fr: 'Gouttes gel visqueuses pour un soulagement durable des symptômes de sécheresse oculaire. Adaptées pour une utilisation de jour et de nuit.'
  },
  {
    sku: 'ACUVUEVI',
    title_en: 'ACUVUE VITA Monthly Contact Lenses',
    title_fr: 'Lentilles de Contact Mensuelles ACUVUE VITA',
    desc_en: 'Monthly replacement contact lenses with HydraMax technology designed to maintain hydration and comfort throughout the entire month of wear.',
    desc_fr: 'Lentilles de contact à remplacement mensuel avec technologie HydraMax conçue pour maintenir l\'hydratation et le confort pendant tout le mois de port.'
  }
];

async function updateJohnsonProducts() {
  console.log('='.repeat(50));
  console.log('UPDATING JOHNSON & JOHNSON PRODUCTS');
  console.log('='.repeat(50));

  let updated = 0;
  let notFound = 0;

  for (const item of johnsonProducts) {
    // Find product by SKU
    const product = await prisma.products.findFirst({
      where: {
        reference_fournisseur: item.sku,
        constructeur: 'johnson-johnson-vision'
      }
    });

    if (!product) {
      // Try partial match
      const partialMatch = await prisma.products.findFirst({
        where: {
          reference_fournisseur: { contains: item.sku.substring(0, 5) },
          constructeur: 'johnson-johnson-vision'
        }
      });

      if (partialMatch) {
        console.log(`Partial match for ${item.sku}: ${partialMatch.reference_fournisseur}`);
      } else {
        console.log(`NOT FOUND: ${item.sku} - ${item.title_en}`);
        notFound++;
        continue;
      }
    }

    const targetProduct = product;

    try {
      // Update French translation
      await prisma.product_translations.updateMany({
        where: {
          product_id: targetProduct.id,
          language_code: 'fr'
        },
        data: {
          nom: item.title_fr,
          description: item.desc_fr
        }
      });

      // Update English translation
      await prisma.product_translations.updateMany({
        where: {
          product_id: targetProduct.id,
          language_code: 'en'
        },
        data: {
          nom: item.title_en,
          description: item.desc_en
        }
      });

      updated++;
      console.log(`UPDATED: ${item.title_en}`);
    } catch (err) {
      console.log(`ERROR: ${item.sku} - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`SUMMARY: Updated ${updated}, Not Found ${notFound}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

updateJohnsonProducts().catch(console.error);
