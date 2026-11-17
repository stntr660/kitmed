const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- client: the MC2 product photos (extracted from the catalogue PDF) are blurry;
 * the client sent new sharp photos. Part A (this script, 10 products, mostly
 * Orthoptie > « Tests de vision binoculaire »; part B = 98b, the other 11):
 *   MC2-TEST-WORTH-VL, MC2-TEST-WORTH-VP, MC2-TEST-CHAT, MC2-TEST-RANDOM-DOT (« Test Random Dot »,
 *   stéréotest vectoriel au papillon), MC2-TEST-RANDOT, MC2-TEST-LANG, MC2-TEST-TNO, MC2-TEST-MOUCHE,
 *   MC2-BILAN-VP and MC2-HRW (both in « Échelles d'acuité visuelle »).
 * Each photo is kept whole (info panels included), white borders trimmed, fitted on a white
 * 1000x1000 canvas with ~5% margin, JPEG q90 -> products/mc2-<slug>-98.jpg (main image, media <id>-m93).
 * The « Tests de vision binoculaire » tile (1200x400, TNO + Worth VP + Randot as before) is
 * rebuilt from the sharp photos -> categories/mc2-tile-tests-binoculaires-98.jpg.
 * Files are copied into the staging uploads volume (chown 1001:65533) before --apply.
 *
 * REVERT POINT: the previous URLs below; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 98a-mc2-images-binoculaire.js <app>:/tmp/98a.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98a.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98a.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98a.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

const MEDIA = {
  "d93a0001-0000-4000-8000-000000000010-m93": ["/uploads/products/mc2-echelle-hrw.jpg", "/uploads/products/mc2-echelle-hrw-98.jpg"],
  "d93a0001-0000-4000-8000-000000000016-m93": ["/uploads/products/mc2-bilan-vp.jpg", "/uploads/products/mc2-bilan-vp-98.jpg"],
  "d93a0001-0000-4000-8000-000000000017-m93": ["/uploads/products/mc2-test-mouche.jpg", "/uploads/products/mc2-test-mouche-98.jpg"],
  "d93a0001-0000-4000-8000-000000000018-m93": ["/uploads/products/mc2-test-tno.jpg", "/uploads/products/mc2-test-tno-98.jpg"],
  "d93a0001-0000-4000-8000-000000000019-m93": ["/uploads/products/mc2-test-lang.jpg", "/uploads/products/mc2-test-lang-98.jpg"],
  "d93a0001-0000-4000-8000-000000000020-m93": ["/uploads/products/mc2-test-randot.jpg", "/uploads/products/mc2-test-randot-98.jpg"],
  "d93a0001-0000-4000-8000-000000000021-m93": ["/uploads/products/mc2-test-random-dot.jpg", "/uploads/products/mc2-test-random-dot-98.jpg"],
  "d93a0001-0000-4000-8000-000000000022-m93": ["/uploads/products/mc2-test-chat.jpg", "/uploads/products/mc2-test-chat-98.jpg"],
  "d93a0001-0000-4000-8000-000000000023-m93": ["/uploads/products/mc2-test-worth-vp.jpg", "/uploads/products/mc2-test-worth-vp-98.jpg"],
  "d93a0001-0000-4000-8000-000000000024-m93": ["/uploads/products/mc2-test-worth-vl.jpg", "/uploads/products/mc2-test-worth-vl-98.jpg"],
};
const CATEGORIES = {
  "mc2-tests-vision-binoculaire": ["/uploads/categories/mc2-tile-tests-binoculaires.jpg", "/uploads/categories/mc2-tile-tests-binoculaires-98.jpg"],
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
