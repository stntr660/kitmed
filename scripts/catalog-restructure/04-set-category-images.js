const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Sets each subcategory's image_url to the primary image of its best product
 * (featured first, then by sort_order, then by created_at).
 */

async function main() {
  console.log("=== SET SUBCATEGORY IMAGES FROM BEST PRODUCTS ===\n");

  // Get all categories that have a parent (i.e., subcategories)
  const subcategories = await prisma.categories.findMany({
    where: {
      parent_id: { not: null },
      is_active: true
    },
    select: { id: true, name: true, slug: true, image_url: true }
  });

  console.log(`Found ${subcategories.length} subcategories to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const cat of subcategories) {
    // Find the best product in this category
    const bestProduct = await prisma.products.findFirst({
      where: {
        category_id: cat.id,
        status: "active"
      },
      orderBy: [
        { is_featured: "desc" },
        { sort_order: "asc" },
        { created_at: "desc" }
      ],
      include: {
        product_media: {
          where: { type: "image" },
          orderBy: { is_primary: "desc" },
          take: 1,
          select: { url: true }
        }
      }
    });

    if (!bestProduct || bestProduct.product_media.length === 0) {
      // Try products in child categories
      const children = await prisma.categories.findMany({
        where: { parent_id: cat.id, is_active: true },
        select: { id: true }
      });

      if (children.length > 0) {
        const childProduct = await prisma.products.findFirst({
          where: {
            category_id: { in: children.map(c => c.id) },
            status: "active"
          },
          orderBy: [
            { is_featured: "desc" },
            { sort_order: "asc" },
            { created_at: "desc" }
          ],
          include: {
            product_media: {
              where: { type: "image" },
              orderBy: { is_primary: "desc" },
              take: 1,
              select: { url: true }
            }
          }
        });

        if (childProduct && childProduct.product_media.length > 0) {
          await prisma.categories.update({
            where: { id: cat.id },
            data: { image_url: childProduct.product_media[0].url, updated_at: new Date() }
          });
          console.log(`  [OK] "${cat.slug}" -> image from child product`);
          updated++;
          continue;
        }
      }

      console.log(`  [SKIP] "${cat.slug}" - no products with images`);
      skipped++;
      continue;
    }

    const imageUrl = bestProduct.product_media[0].url;

    await prisma.categories.update({
      where: { id: cat.id },
      data: { image_url: imageUrl, updated_at: new Date() }
    });

    console.log(`  [OK] "${cat.slug}" -> ${imageUrl.substring(0, 60)}...`);
    updated++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}, Skipped (no images): ${skipped}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
