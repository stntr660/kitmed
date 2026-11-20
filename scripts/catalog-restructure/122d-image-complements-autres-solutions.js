const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-20 -- owner sent the photo for the new « Compléments et autres solutions » category
 * (pill bottle, blister, capsules), cropped to the 5:2 sub-category tile: /uploads/categories/q122d-dispositifs-nasaux.jpg
 * (copied into the staging uploads volume first). --revert puts back the script 119 tile.
 *
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/122d.js [--apply|--revert]
 */
const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const ID = "d119c001-0000-4000-8000-000000000002";
const BEFORE = "/uploads/categories/q119-complements-solutions.jpg";
const AFTER = "/uploads/categories/q122d-complements-autres-solutions.jpg";

(async () => {
  const url = REVERT ? BEFORE : AFTER;
  console.log(`category ${ID} image -> ${url}`);
  if (APPLY || REVERT) await prisma.categories.update({ where: { id: ID }, data: { image_url: url, updated_at: new Date() } });
  else console.log("dry-run: nothing written (use --apply)");
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
