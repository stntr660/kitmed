const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- owner: new category image for « Literie et mobilier médical » (owner photo: hospital bed room,
 * cropped 3:1 like the other tiles). File: /uploads/categories/q101-literie.jpg
 * (copied into the staging uploads volume before --apply).
 *
 * REVERT POINT: previous image_url below; --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 101-literie-image.js <app>:/tmp/101.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/101.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/101.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/101.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SLUG = "mobilier-et-literie-hospitaliers";
const BEFORE = "/uploads/categories/q87-mobilier-et-literie-hospitaliers.jpg";
const AFTER = "/uploads/categories/q101-literie.jpg";

async function main() {
  const cat = await prisma.categories.findUnique({ where: { slug: SLUG } });
  if (!cat) throw new Error(`category ${SLUG} not found`);
  const target = REVERT ? BEFORE : AFTER;
  console.log(`${SLUG}: ${cat.image_url} -> ${target}`);
  if ((APPLY || REVERT) && cat.image_url !== target) {
    await prisma.categories.update({ where: { slug: SLUG }, data: { image_url: target, updated_at: new Date() } });
    console.log("  updated");
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
