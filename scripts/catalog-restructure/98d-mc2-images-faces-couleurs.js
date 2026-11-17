const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- client: the MC2 product photos (extracted from the catalogue PDF) are blurry;
 * the client sent new sharp photos. Part D (this script, 18 products):
 *   Orthoptie > « Faces, Maddox et prismes » (11): cylindres croisés, règles à prisme, coffret de prismes,
 *     biprisme de Gracis, croix et aile de Maddox, Maddox sur manche, Bagolini, Flipper test, face monoculaire,
 *     face polarisée / rouge-vert (2 photos: main + a 2nd media <id>-m98, sort 1), and the 4-clear-lens
 *     hand flipper = « Face binoculaire » MC2-FACE-BINO (the client's unnamed screenshot shows the current
 *     Face binoculaire photo; « Face nue / Face 4 verres » has no new photo and is left as is).
 *   Orthoptie > « Vision des couleurs, Amsler et coordimètre » (4): torche de Kratz, coordimètre de Weiss,
 *     Amsler, Farnsworth (Ishihara: no new photo, unchanged).
 *   Orthoptie > « Tests de vision binoculaire » extras (3): Vectogram, Mallett VP, Mallett VL (the box
 *     with remote in the unnamed screenshot = current Mallett VL photo).
 * Same format as 98a: each photo kept whole (info panels included), white borders trimmed, fitted in
 * 900x900 on a white 1000x1000 canvas, JPEG q90 -> products/mc2-<slug>-98.jpg (media <id>-m93).
 * Tiles (1200x400, 3 cells of 400, image fitted in 352x340), rebuilt from the sharp photos:
 *   mc2-faces-maddox-prismes: coffret de prismes + face binoculaire + Maddox sur manche (same 3 as before)
 *   mc2-couleurs-amsler-coordimetre: Farnsworth + coordimètre + Amsler (Ishihara replaced by Farnsworth:
 *     Ishihara has no sharp photo)
 * Files are copied into the staging uploads volume (chown 1001:65533) before --apply.
 * The binocular tile belongs to 98a.
 *
 * REVERT POINT: the previous URLs below; --revert puts them back and deletes the extra -m98 media.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 98d-mc2-images-faces-couleurs.js <app>:/tmp/98d.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98d.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98d.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98d.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

// product id suffix (script 93 pid) -> image slug (mc2-<slug>.jpg)
const PRODUCTS = {
  "25": "test-malett-vp",            // MC2-MALETT-VP
  "26": "test-malett-vl",            // MC2-MALETT-VL (box + remote)
  "27": "vectogram",                 // MC2-VECTOGRAM
  "29": "test-farnsworth",           // MC2-FARNSWORTH
  "30": "amsler",                    // MC2-AMSLER
  "31": "coordimetre-weiss",         // MC2-COORDIMETRE-WEISS
  "32": "torche-kratz",              // MC2-TORCHE-KRATZ
  "33": "face-monoculaire",          // MC2-FACE-MONO
  "34": "face-binoculaire",          // MC2-FACE-BINO (4 clear lenses on a handle)
  "35": "face-polarisee-rouge-vert", // MC2-FACE-POL-RV (photo 1)
  "36": "face-bagolini",             // MC2-BAGOLINI
  "37": "flipper-test",              // MC2-FLIPPER
  "39": "maddox-sur-manche",         // MC2-MADDOX-MANCHE
  "40": "croix-aile-maddox",         // MC2-CROIX-AILE-MADDOX
  "41": "biprisme-gracis",           // MC2-BIPRISME-GRACIS
  "42": "coffret-prismes",           // MC2-COFFRET-PRISMES
  "43": "regles-prisme",             // MC2-REGLES-PRISME
  "44": "coffret-cylindres-croises", // MC2-CYLINDRES-CROISES
};
const MEDIA = Object.fromEntries(Object.entries(PRODUCTS).map(([n, s]) => [
  `d93a0001-0000-4000-8000-0000000000${n}-m93`,
  [`/uploads/products/mc2-${s}.jpg`, `/uploads/products/mc2-${s}-98.jpg`],
]));
// extra media (created by --apply, deleted by --revert)
const EXTRA = [{
  id: "d93a0001-0000-4000-8000-000000000035-m98", product_id: "d93a0001-0000-4000-8000-000000000035", type: "image",
  url: "/uploads/products/mc2-face-polarisee-rouge-vert-2-98.jpg",
  alt_text: "Face polarisée / Face rouge-vert", title: "Face polarisée / Face rouge-vert", sort_order: 1, is_primary: false,
}];
const CATEGORIES = {
  "mc2-faces-maddox-prismes": ["/uploads/categories/mc2-tile-faces-maddox-prismes.jpg", "/uploads/categories/mc2-tile-faces-maddox-prismes-98.jpg"],
  "mc2-couleurs-amsler-coordimetre": ["/uploads/categories/mc2-tile-couleurs-amsler-coordimetre.jpg", "/uploads/categories/mc2-tile-couleurs-amsler-coordimetre-98.jpg"],
};

async function main() {
  for (const [id, urls] of Object.entries(MEDIA)) {
    const m = await prisma.product_media.findUnique({ where: { id } });
    if (!m) { console.log(`  [MISSING] media ${id}`); continue; }
    console.log(`  media ${id}: ${m.url} -> ${pick(urls)}`);
    if (WRITE && m.url !== pick(urls)) await prisma.product_media.update({ where: { id }, data: { url: pick(urls) } });
  }
  for (const e of EXTRA) {
    const m = await prisma.product_media.findUnique({ where: { id: e.id } });
    if (REVERT) {
      console.log(m ? `  - media ${e.id} (${m.url})` : `  [SKIP] media ${e.id} absent`);
      if (m) await prisma.product_media.delete({ where: { id: e.id } });
    } else if (m) {
      console.log(`  [SKIP] media ${e.id} exists (${m.url})`);
    } else {
      console.log(`  + media ${e.id}: ${e.url} (sort ${e.sort_order})`);
      if (APPLY) await prisma.product_media.create({ data: e });
    }
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
