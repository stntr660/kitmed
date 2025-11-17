const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductSlugs() {
  console.log('🔧 Fixing product slugs...');
  
  const products = await prisma.product.findMany({
    include: {
      translations: true
    }
  });

  for (const product of products) {
    const frenchTranslation = product.translations.find(t => t.languageCode === 'fr');
    if (frenchTranslation && frenchTranslation.nom) {
      const slug = frenchTranslation.nom
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await prisma.product.update({
        where: { id: product.id },
        data: { slug: slug }
      });

      console.log(`✅ Updated slug for "${frenchTranslation.nom}": ${slug}`);
    }
  }
  
  console.log('✅ Product slugs fixed successfully!');
}

fixProductSlugs()
  .catch((e) => {
    console.error('❌ Error fixing slugs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });