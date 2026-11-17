const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- client: the MC2 product photos (cut from the catalogue in script 93) are blurry;
 * the client sent new sharp photos. Part C (this script, 12 products): Orthoptie >
 * « Occlusion et traitement de l'amblyopie » (Obturateur à ventouse OB100/OB105, Orthopads,
 * Opticlude EC200/EC201, Press-on prismes 3M, Bangerter, Palette de Bernell, Clips deux gorges,
 * Lunette de dépistage, Cache-œil, Filmo) + Plaquettes de Mawas and Cube de Lang (both in
 * « Faces, Maddox et prismes »; that tile is left to 98d).
 * No new photo was sent for « Écran translucide de Spielmann » (MC2-ECRAN-SPIELMANN): unchanged.
 * Same format as 98b: client photo kept whole (only the empty white border trimmed), centred on a
 * white 1200x900 canvas (4:3 like the 93 originals) with a 5% margin, JPEG q90
 * -> products/mc2-<slug>-98.jpg (main image, media <id>-m93).
 * The « Occlusion et traitement de l'amblyopie » tile (1200x400, three 400x400 cells, same 3
 * products as 93: lunette de dépistage, Orthopads, cache-œil) is rebuilt from the sharp photos
 * -> categories/mc2-tile-occlusion-amblyopie-98.jpg.
 * Files are copied into the staging uploads volume (chown 1001:65533) before --apply.
 *
 * REVERT POINT: the previous URLs below; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 98c-mc2-images-occlusion.js <app>:/tmp/98c.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98c.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98c.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/98c.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

const MEDIA = {
  "d93a0001-0000-4000-8000-000000000045-m93": ["/uploads/products/mc2-plaquettes-mawas.jpg", "/uploads/products/mc2-plaquettes-mawas-98.jpg"],
  "d93a0001-0000-4000-8000-000000000046-m93": ["/uploads/products/mc2-cube-lang.jpg", "/uploads/products/mc2-cube-lang-98.jpg"],
  "d93a0001-0000-4000-8000-000000000047-m93": ["/uploads/products/mc2-filmo.jpg", "/uploads/products/mc2-filmo-98.jpg"],
  "d93a0001-0000-4000-8000-000000000048-m93": ["/uploads/products/mc2-cache-oeil.jpg", "/uploads/products/mc2-cache-oeil-98.jpg"],
  "d93a0001-0000-4000-8000-000000000049-m93": ["/uploads/products/mc2-lunette-depistage.jpg", "/uploads/products/mc2-lunette-depistage-98.jpg"],
  "d93a0001-0000-4000-8000-000000000050-m93": ["/uploads/products/mc2-clips-deux-gorges.jpg", "/uploads/products/mc2-clips-deux-gorges-98.jpg"],
  "d93a0001-0000-4000-8000-000000000051-m93": ["/uploads/products/mc2-palette-bernell.jpg", "/uploads/products/mc2-palette-bernell-98.jpg"],
  "d93a0001-0000-4000-8000-000000000053-m93": ["/uploads/products/mc2-feuilles-bangerter.jpg", "/uploads/products/mc2-feuilles-bangerter-98.jpg"],
  "d93a0001-0000-4000-8000-000000000054-m93": ["/uploads/products/mc2-press-on-prismes.jpg", "/uploads/products/mc2-press-on-prismes-98.jpg"],
  "d93a0001-0000-4000-8000-000000000055-m93": ["/uploads/products/mc2-opticlude.jpg", "/uploads/products/mc2-opticlude-98.jpg"],
  "d93a0001-0000-4000-8000-000000000056-m93": ["/uploads/products/mc2-orthopads.jpg", "/uploads/products/mc2-orthopads-98.jpg"],
  "d93a0001-0000-4000-8000-000000000057-m93": ["/uploads/products/mc2-obturateur-ventouse.jpg", "/uploads/products/mc2-obturateur-ventouse-98.jpg"],
};
const CATEGORIES = {
  "mc2-occlusion-amblyopie": ["/uploads/categories/mc2-tile-occlusion-amblyopie.jpg", "/uploads/categories/mc2-tile-occlusion-amblyopie-98.jpg"],
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
