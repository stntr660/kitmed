const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner:
 *  - new category image for « Microscopie spéculaire » (owner photo, cropped 3:1 like the other tiles):
 *    /uploads/categories/q111-microscopie-speculaire.jpg (copied into the staging uploads volume first);
 *  - product « microscope-speculaire » (CEM-530): keep its photo, only remove the broken gallery entry
 *    (a PDF stored as an image -> shown as a broken picture).
 *
 * REVERT POINT: 111-before.json (written on --apply) holds the old category image and the removed media row.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 111-microscopie-speculaire.js <app>:/tmp/111.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/111.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/111.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/111.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE = path.join(__dirname, "111-before.json");
const SLUG = "microscopie-speculaire";
const NEW_IMAGE = "/uploads/categories/q111-microscopie-speculaire.jpg";
const BROKEN_MEDIA_ID = "063e66fd-0b07-4c5b-ad52-15c01a579533";

async function main() {
  if (REVERT) {
    const b = JSON.parse(fs.readFileSync(BEFORE, "utf8"));
    await prisma.categories.update({ where: { slug: SLUG }, data: { image_url: b.categoryImage, updated_at: new Date() } });
    if (b.media && !(await prisma.product_media.findUnique({ where: { id: b.media.id } }))) {
      await prisma.product_media.create({ data: { ...b.media, created_at: new Date(b.media.created_at) } });
    }
    console.log("reverted");
    return;
  }
  const cat = await prisma.categories.findUnique({ where: { slug: SLUG } });
  const media = await prisma.product_media.findUnique({ where: { id: BROKEN_MEDIA_ID } });
  console.log(`category ${SLUG}: ${cat.image_url} -> ${NEW_IMAGE}`);
  console.log(`media ${BROKEN_MEDIA_ID}: ${media ? media.url + " -> removed" : "already removed"}`);
  if (!APPLY) { console.log("dry-run: nothing written (use --apply)"); return; }
  if (!fs.existsSync(BEFORE)) fs.writeFileSync(BEFORE, JSON.stringify({ categoryImage: cat.image_url, media }, null, 2));
  if (cat.image_url !== NEW_IMAGE) await prisma.categories.update({ where: { slug: SLUG }, data: { image_url: NEW_IMAGE, updated_at: new Date() } });
  if (media) await prisma.product_media.delete({ where: { id: BROKEN_MEDIA_ID } });
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
