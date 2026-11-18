const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: new primary photo for « Kit d'entraînement Kitaro » (FCI).
 * The new photo becomes the primary image (sort 0); the previous one is kept as second image.
 * File: /uploads/products/kitaro-116.jpg (copied into the staging uploads volume first).
 * REVERT: --revert deletes the new media row and makes the old one primary again.
 *
 *   docker cp 116-kitaro-photo.js <app>:/tmp/116.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/116.js [--apply|--revert]
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const PRODUCT_ID = "6b60008e-c95e-4111-9164-a5e1c5ff2c24";
const OLD_MEDIA = "088f7672-53e2-41c9-bea1-0a654795ec60";
const NEW_MEDIA = "d116a001-0000-4000-8000-000000000001";

async function main() {
  if (REVERT) {
    await prisma.product_media.deleteMany({ where: { id: NEW_MEDIA } });
    await prisma.product_media.update({ where: { id: OLD_MEDIA }, data: { is_primary: true, sort_order: 0 } });
    console.log("reverted");
    return;
  }
  const exists = await prisma.product_media.findUnique({ where: { id: NEW_MEDIA } });
  console.log(exists ? "already applied" : "new primary kitaro-116.jpg, old photo -> 2nd");
  if (!APPLY || exists) return;
  await prisma.product_media.update({ where: { id: OLD_MEDIA }, data: { is_primary: false, sort_order: 1 } });
  await prisma.product_media.create({ data: {
    id: NEW_MEDIA, product_id: PRODUCT_ID, type: "image", url: "/uploads/products/kitaro-116.jpg",
    alt_text: "Kit d'entraînement Kitaro", is_primary: true, sort_order: 0,
  } });
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
