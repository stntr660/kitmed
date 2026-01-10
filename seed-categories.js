const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  console.log('Seeding categories...');

  // Categories to keep (with translations)
  const categories = [
    {
      id: 'ophthalmology',
      slug: 'ophthalmology',
      is_active: true,
      sort_order: 1,
      translations: [
        { language_code: 'fr', name: 'Ophtalmologie', description: 'Equipements ophtalmologiques de pointe' },
        { language_code: 'en', name: 'Ophthalmology', description: 'Advanced ophthalmology equipment' }
      ]
    },
    {
      id: 'cardiology',
      slug: 'cardiology',
      is_active: true,
      sort_order: 2,
      translations: [
        { language_code: 'fr', name: 'Cardiologie', description: 'Equipements cardiovasculaires de pointe' },
        { language_code: 'en', name: 'Cardiology', description: 'Advanced cardiovascular equipment' }
      ]
    },
    {
      id: 'ent',
      slug: 'ent',
      is_active: true,
      sort_order: 3,
      translations: [
        { language_code: 'fr', name: 'ORL (Oto-Rhino-Laryngologie)', description: 'Equipements ORL specialises' },
        { language_code: 'en', name: 'ENT (Ear, Nose and Throat)', description: 'Specialized ENT equipment' }
      ]
    },
    {
      id: 'hospital-furniture',
      slug: 'hospital-furniture',
      is_active: true,
      sort_order: 4,
      translations: [
        { language_code: 'fr', name: 'Mobilier et literie hospitaliers', description: 'Mobilier medical et literie hospitaliere' },
        { language_code: 'en', name: 'Hospital Furniture & Bedding', description: 'Medical furniture and hospital bedding' }
      ]
    },
    {
      id: 'orthopedics',
      slug: 'orthopedics',
      is_active: true,
      sort_order: 5,
      translations: [
        { language_code: 'fr', name: 'Orthopedie', description: 'Equipements orthopediques' },
        { language_code: 'en', name: 'Orthopedics', description: 'Orthopedic equipment' }
      ]
    }
  ];

  // First, deactivate all existing categories
  console.log('Deactivating existing categories...');
  await prisma.categories.updateMany({
    data: { is_active: false }
  });

  // Upsert each category with translations
  for (const category of categories) {
    try {
      // Upsert category
      await prisma.categories.upsert({
        where: { id: category.id },
        update: {
          slug: category.slug,
          is_active: category.is_active,
          sort_order: category.sort_order,
          updated_at: new Date()
        },
        create: {
          id: category.id,
          slug: category.slug,
          is_active: category.is_active,
          sort_order: category.sort_order,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Delete existing translations and create new ones
      await prisma.category_translations.deleteMany({
        where: { category_id: category.id }
      });

      for (const translation of category.translations) {
        await prisma.category_translations.create({
          data: {
            id: `${category.id}-${translation.language_code}`,
            category_id: category.id,
            language_code: translation.language_code,
            name: translation.name,
            description: translation.description
          }
        });
      }

      console.log(`Category "${category.translations[0].name}" seeded`);
    } catch (error) {
      console.error(`Error seeding category "${category.id}":`, error);
    }
  }

  console.log('Categories seeded successfully!');
  console.log('Active categories: Ophthalmology, Cardiology, ENT, Hospital Furniture, Orthopedics');
}

seedCategories()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
