const { PrismaClient } = require('@prisma/client');

// Local database
const localPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

// Staging database
const stagingPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://kitmed_staging_user:KitMed_Staging_2024_SecurePass@srv1123138.hstgr.cloud:5432/kitmed_staging' } }
});

async function syncPukang() {
  try {
    // Get all PUKANG products from local
    const localProducts = await localPrisma.products.findMany({
      where: { partner_id: '8e928e51-8b4a-424d-b0d2-8182411dc002' },
      include: { product_translations: true, product_media: true }
    });

    console.log(`Found ${localProducts.length} PUKANG products to sync\n`);

    for (const product of localProducts) {
      console.log(`Syncing: ${product.reference_fournisseur}`);

      // Sync translations
      for (const trans of product.product_translations) {
        try {
          await stagingPrisma.product_translations.upsert({
            where: { id: trans.id },
            update: { nom: trans.nom, description: trans.description },
            create: {
              id: trans.id,
              product_id: trans.product_id,
              language_code: trans.language_code,
              nom: trans.nom,
              description: trans.description
            }
          });
        } catch (e) {
          console.log(`  Translation error: ${e.message.substring(0, 50)}`);
        }
      }

      // Sync media
      for (const media of product.product_media) {
        try {
          await stagingPrisma.product_media.upsert({
            where: { id: media.id },
            update: { url: media.url, alt_text: media.alt_text },
            create: {
              id: media.id,
              product_id: media.product_id,
              type: media.type,
              url: media.url,
              alt_text: media.alt_text,
              is_primary: media.is_primary,
              sort_order: media.sort_order
            }
          });
        } catch (e) {
          console.log(`  Media error: ${e.message.substring(0, 50)}`);
        }
      }

      console.log(`  Synced`);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await stagingPrisma.$disconnect();
  }
}

syncPukang();
