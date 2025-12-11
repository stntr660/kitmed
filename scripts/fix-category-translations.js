const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCategoryTranslations() {
  try {
    // Define proper category translations
    const categoryTranslations = [
      {
        slug: 'ophtalmologie',
        fr: {
          name: 'Ophtalmologie',
          description: 'Équipements spécialisés pour les soins oculaires et la chirurgie ophtalmique'
        },
        en: {
          name: 'Ophthalmology',
          description: 'Specialized equipment for eye care and ophthalmic surgery'
        }
      },
      {
        slug: 'cardiologie',
        fr: {
          name: 'Cardiologie',
          description: 'Équipements cardiaques et cardiovasculaires pour le diagnostic et le traitement'
        },
        en: {
          name: 'Cardiology',
          description: 'Cardiac and cardiovascular equipment for diagnosis and treatment'
        }
      },
      {
        slug: 'chirurgie',
        fr: {
          name: 'Chirurgie',
          description: 'Solutions professionnelles pour chirurgie et interventions médicales'
        },
        en: {
          name: 'Surgery',
          description: 'Professional solutions for surgery and medical procedures'
        }
      },
      {
        slug: 'radiologie',
        fr: {
          name: 'Radiologie',
          description: 'Équipements d\'imagerie médicale et de diagnostic radiologique'
        },
        en: {
          name: 'Radiology',
          description: 'Medical imaging and radiological diagnostic equipment'
        }
      },
      {
        slug: 'laboratoire',
        fr: {
          name: 'Laboratoire',
          description: 'Équipements et instruments de laboratoire médical'
        },
        en: {
          name: 'Laboratory',
          description: 'Medical laboratory equipment and instruments'
        }
      },
      {
        slug: 'anesth-sie',
        fr: {
          name: 'Anesthésie',
          description: 'Équipements d\'anesthésie et de réanimation'
        },
        en: {
          name: 'Anesthesia',
          description: 'Anesthesia and resuscitation equipment'
        }
      },
      {
        slug: 'mobilier-m-dical',
        fr: {
          name: 'Mobilier Médical',
          description: 'Équipements de mobilier pour environnements médicaux et hospitaliers'
        },
        en: {
          name: 'Medical Furniture',
          description: 'Furniture equipment for medical and hospital environments'
        }
      },
      {
        slug: 'lits-d-h-pital',
        fr: {
          name: 'Lits d\'Hôpital',
          description: 'Lits médicaux et équipements de repos pour patients hospitalisés'
        },
        en: {
          name: 'Hospital Beds',
          description: 'Medical beds and rest equipment for hospitalized patients'
        }
      },
      {
        slug: 'mobilit',
        fr: {
          name: 'Mobilité',
          description: 'Équipements d\'aide à la mobilité et accessibilité pour patients'
        },
        en: {
          name: 'Mobility',
          description: 'Mobility aids and accessibility equipment for patients'
        }
      },
      {
        slug: 'pharmaceutique',
        fr: {
          name: 'Pharmaceutique',
          description: 'Médicaments et produits pharmaceutiques pour traitements médicaux'
        },
        en: {
          name: 'Pharmaceutical',
          description: 'Medications and pharmaceutical products for medical treatments'
        }
      }
    ];

    for (const categoryData of categoryTranslations) {
      // Find the category
      const category = await prisma.categories.findUnique({
        where: { slug: categoryData.slug }
      });

      if (!category) {
        console.log(`Category not found: ${categoryData.slug}`);
        continue;
      }

      // Update French translation if exists
      await prisma.category_translations.updateMany({
        where: {
          category_id: category.id,
          language_code: 'fr'
        },
        data: {
          name: categoryData.fr.name,
          description: categoryData.fr.description
        }
      });

      // Update English translation if exists  
      await prisma.category_translations.updateMany({
        where: {
          category_id: category.id,
          language_code: 'en'
        },
        data: {
          name: categoryData.en.name,
          description: categoryData.en.description
        }
      });

      console.log(`✅ Updated translations for: ${categoryData.slug}`);
    }

    console.log('\n✅ All category translations have been fixed!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error fixing category translations:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixCategoryTranslations();