const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- owner: the MC2 product photos (cut from the catalogue in script 93) are blurry;
 * the client sent new sharp images. This script swaps them for the 11 products of
 * Orthoptie > « Échelles d'acuité visuelle » and rebuilds that sub-category tile
 * (collage of the same 3 products as before: plastic charts T1-T10, Théophane 2, Rossano).
 * The other MC2 products (binocular tests, Bilan VP, HRW) are handled by 98a.
 * The client photo with no visible name (UVEFH / HRFND letter chart) = Échelle Théophane 1
 * (same chart as its current image).
 *
 * Images: client file kept whole (only the empty white border trimmed), centred on a white
 * 1200x900 canvas with a 5% margin, JPEG q90. Tile: 1200x400, three 400x400 cells.
 * Files (copied into the staging uploads volume before --apply, chown 1001:65533):
 *   products/mc2-<slug>-98.jpg (11), categories/mc2-tile-echelles-acuite-98.jpg
 *
 * REVERT POINT: the previous URLs below; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 98b-mc2-images-echelles.js <app>:/tmp/98b.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98b.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98b.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98b.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

// product id suffix (script 93 pid) -> image slug (mc2-<slug>.jpg)
const PRODUCTS = {
  "03": "echelles-plastique",       // MC2-T1/T2/T5/T6/T7/T8/T9/T10
  "04": "echelle-parinaud",         // MC2-EL
  "05": "echelle-enfants-illettres", // MC2-EI
  "06": "echelle-ddass",            // MC2-T15
  "07": "echelle-pigassou",         // MC2-T20
  "09": "echelles-rossano",         // MC2-ROSSANO
  "11": "echelle-gracis",           // MC2-GRACIS-ECHELLE
  "12": "echelle-contrastes",       // MC2-CONTRASTES-VP-VL
  "13": "echelle-galinet",          // MC2-GALINET
  "14": "echelle-theophane-1",      // MC2-THEOPHANE-1 (the UVEFH chart)
  "15": "echelle-theophane-2",      // MC2-THEOPHANE-2
};
const MEDIA = Object.fromEntries(Object.entries(PRODUCTS).map(([n, s]) => [
  `d93a0001-0000-4000-8000-0000000000${n}-m93`,
  [`/uploads/products/mc2-${s}.jpg`, `/uploads/products/mc2-${s}-98.jpg`],
]));
const CATEGORIES = {
  "mc2-echelles-acuite-visuelle": ["/uploads/categories/mc2-tile-echelles-acuite.jpg", "/uploads/categories/mc2-tile-echelles-acuite-98.jpg"],
};

async function main() {
  for (const [id, urls] of Object.entries(MEDIA)) {
    const m = await prisma.product_media.findUnique({ where: { id } });
    if (!m) { console.log(`  [MISSING] media ${id}`); continue; }
    console.log(`  media ${id}: ${m.url} -> ${pick(urls)}`);
    if (WRITE && m.url !== pick(urls)) await prisma.product_media.update({ where: { id }, data: { url: pick(urls) } });
  }
  for (const [slug, urls] of Object.entries(CATEGORIES)) {
    const c = await prisma.categories.findUnique({ where: { slug } });
    if (!c) { console.log(`  [MISSING] category ${slug}`); continue; }
    console.log(`  category ${slug}: ${c.image_url} -> ${pick(urls)}`);
    if (WRITE && c.image_url !== pick(urls)) await prisma.categories.update({ where: { slug }, data: { image_url: pick(urls), updated_at: new Date() } });
  }
  if (!WRITE) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
