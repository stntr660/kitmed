const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: some product galleries show a broken second picture
 * (e.g. /fr/products/auto-refracto-keratometre). Audit of every active product image:
 * 5 gallery rows are PDFs stored as images (NIDEK), nothing else is broken
 * (no missing / empty / non-image file). Those rows are removed; main photos are kept.
 *
 * REVERT POINT: 112-before.json (written on --apply) holds the removed rows; --revert recreates them.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 112-galeries-pdf-cassees.js <app>:/tmp/112.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/112.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/112.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/112.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE = path.join(__dirname, "112-before.json");
const IDS = [
  "b56328d1-e1d1-4b37-8dd6-cf9425de398c", // optical-biometer-al-scan  al-scan-gallery-2.pdf
  "525c20ee-77ed-489c-9ddc-20d71b27f50b", // laser-vert-photocoagulation gyc-500-gallery-2.pdf
  "444a900a-cf48-48d7-9365-f9930461e297", // auto-refracto-keratometre ar-1-gallery-2.pdf
  "e0dc6f0e-27be-46af-9c4f-e19289d7c426", // chart-projector-cp-9 cp-9-gallery-2.pdf
  "1fc92c45-f78d-4fdd-a4ba-f26e25f58794", // chart-projector-cp-9 cp-9-gallery-4.pdf
];

async function main() {
  if (REVERT) {
    for (const row of JSON.parse(fs.readFileSync(BEFORE, "utf8"))) {
      if (await prisma.product_media.findUnique({ where: { id: row.id } })) continue;
      await prisma.product_media.create({ data: { ...row, created_at: new Date(row.created_at) } });
      console.log(`  restored ${row.id}`);
    }
    return;
  }
  const rows = await prisma.product_media.findMany({ where: { id: { in: IDS } } });
  for (const r of rows) console.log(`  ${r.id} ${r.url} -> removed`);
  if (!APPLY) { console.log("dry-run: nothing written (use --apply)"); return; }
  if (!fs.existsSync(BEFORE)) fs.writeFileSync(BEFORE, JSON.stringify(rows, null, 2));
  await prisma.product_media.deleteMany({ where: { id: { in: rows.map(r => r.id) } } });
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
