const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  const categories = [
    {
      id: 'cardiology',
      name: 'Cardiologie',
      slug: 'cardiology',
      description: 'Équipements cardiovasculaires de pointe',
      isActive: true
    },
    {
      id: 'radiology', 
      name: 'Radiologie',
      slug: 'radiology',
      description: 'Imagerie médicale haute définition',
      isActive: true
    },
    {
      id: 'surgery',
      name: 'Chirurgie', 
      slug: 'surgery',
      description: 'Instruments chirurgicaux précis',
      isActive: true
    },
    {
      id: 'laboratory',
      name: 'Laboratoire',
      slug: 'laboratory', 
      description: 'Analyses et diagnostics avancés',
      isActive: true
    },
    {
      id: 'emergency',
      name: 'Urgences',
      slug: 'emergency',
      description: 'Solutions d\'urgence et réanimation',
      isActive: true
    },
    {
      id: 'icu',
      name: 'Soins Intensifs',
      slug: 'icu',
      description: 'Technologies de soins critiques',
      isActive: true
    }
  ];

  for (const category of categories) {
    try {
      await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category,
      });
      console.log(`✅ Category "${category.name}" seeded`);
    } catch (error) {
      console.error(`❌ Error seeding category "${category.name}":`, error);
    }
  }
  
  console.log('✅ Categories seeded successfully!');
}

seedCategories()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });