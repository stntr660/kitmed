const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- owner: new category image for « Lampe à fente » (slit-lamp exam photo,
 * cropped 3:1 like the other tiles). File: /uploads/categories/q95-lampe-a-fente.jpg
 * (copied into the staging uploads volume before --apply).
 *
 * REVERT POINT: previous image_url below; --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 95-lampe-a-fente-image.js <app>:/tmp/95.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/95.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/95.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/95.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SLUG = "lampe-a-fente";
const BEFORE = "/uploads/categories/oph-lampe-a-fente.jpg";
const AFTER = "/uploads/categories/q95-lampe-a-fente.jpg";

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
