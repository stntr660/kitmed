const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- category tree and category images, checked tile by tile.
 *
 * A) Images (87-before.json = slug -> {before, after}):
 *    - the 7 domains (Ophtalmologie, ORL, Literie et mobilier médical,
 *      Orthopédie, Dispositifs médicaux/Pharma, Drapage, Contactologie) get
 *      the photos of the client's homepage mockup (Drapage had none);
 *    - every product-cutout tile is rebuilt 1200x400: white margins trimmed,
 *      product centred and enlarged, so the 3:1 tiles no longer cut square
 *      photos in half;
 *    - FCI / MORIA / oculoplastie tiles are rebuilt from 3 real products of
 *      the category, enlarged (long instruments tilted) -- they were thin
 *      lines lost in white.
 *    Photo tiles from the Appareillage mockup are left as they are.
 * B) French accents on the Literie / Orthopédie sub-categories.
 * C) Orthopédie > « Consommables » (0 product, no image) hidden.
 * D) The RUMEX vitreoretinal instruments product sat directly on the
 *    Instrumentation page: new sub-category « Instruments RUMEX ».
 *
 * REVERT POINT: before values are in 87-before.json and below; --revert puts
 * them back and deletes the RUMEX sub-category (product back to instrumentation).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 87-images-et-arborescence.js <app>:/tmp/87.js
 *   docker cp 87-before.json <app>:/tmp/87-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/87.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/87.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/87.js --revert
 * The q87-*.jpg files are copied to uploads/categories first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const IMAGES = JSON.parse(fs.readFileSync(path.join(__dirname, "87-before.json"), "utf8"));

const NAMES_FR = {
  "literie-hospitaliere":      ["Literie hospitaliere", "Literie hospitalière"],
  "tables-medicales":          ["Tables medicales", "Tables médicales"],
  "equipement-pediatrique":    ["Equipement pediatrique", "Équipement pédiatrique"],
  "mobilite-et-soutien":       ["Mobilite et soutien", "Mobilité et soutien"],
  "ortheses-articulaires":     ["Ortheses articulaires", "Orthèses articulaires"],
  "genouilleres-chevillieres": ["Genouilleres et chevillieres", "Genouillères et chevillières"],
  "ortheses-cervicales":       ["Ortheses cervicales", "Orthèses cervicales"],
};
const HIDE = { "ortho-consumable": [true, false] };
const RUMEX_CAT = { id: "c87a0001-0000-4000-8000-000000000001", slug: "rumex-instruments",
  fr: "Instruments RUMEX", en: "RUMEX instruments", image: "/uploads/categories/q87-rumex-instruments.jpg" };
const RUMEX_PRODUCT = "f5b84c2a-9ed1-420b-be63-5527aa65f6ab";
const pick = ([b, a]) => (REVERT ? b : a);

async function main() {
  // D first on apply (category must exist), last on revert
  const instr = await prisma.categories.findUnique({ where: { slug: "instrumentation" } });
  if (!REVERT) {
    if (await prisma.categories.findUnique({ where: { slug: RUMEX_CAT.slug } })) console.log(`  [SKIP] create ${RUMEX_CAT.slug}`);
    else {
      console.log(`  + create ${RUMEX_CAT.slug}`);
      if (WRITE) await prisma.categories.create({ data: { id: RUMEX_CAT.id, slug: RUMEX_CAT.slug, name: RUMEX_CAT.fr, parent_id: instr.id,
        sort_order: 30, type: "equipment", is_active: true, image_url: RUMEX_CAT.image, updated_at: new Date(),
        category_translations: { create: [{ id: crypto.randomUUID(), language_code: "fr", name: RUMEX_CAT.fr }, { id: crypto.randomUUID(), language_code: "en", name: RUMEX_CAT.en }] } } });
    }
  }
  const p = await prisma.products.findUnique({ where: { id: RUMEX_PRODUCT } });
  const to = REVERT ? instr.id : RUMEX_CAT.id;
  if (p.category_id === to) console.log("  [SKIP] RUMEX product");
  else { console.log(`  RUMEX product -> ${REVERT ? "instrumentation" : RUMEX_CAT.slug}`); if (WRITE) await prisma.products.update({ where: { id: p.id }, data: { category_id: to, updated_at: new Date() } }); }
  if (REVERT && await prisma.categories.findUnique({ where: { slug: RUMEX_CAT.slug } })) {
    console.log(`  - delete ${RUMEX_CAT.slug}`); await prisma.categories.delete({ where: { slug: RUMEX_CAT.slug } });
  }

  for (const [slug, { before, after }] of Object.entries(IMAGES)) {
    const target = REVERT ? before : after;
    if (target && !fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) { console.log(`  [MISSING FILE] ${target}`); continue; }
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if ((cat.image_url || null) === target) continue;
    console.log(`  image ${slug.padEnd(40)} -> ${target}`);
    if (WRITE) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }
  for (const [slug, pair] of Object.entries(NAMES_FR)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    const tr = await prisma.category_translations.findUnique({ where: { category_id_language_code: { category_id: cat.id, language_code: "fr" } } });
    if (tr?.name === pick(pair) && cat.name === pick(pair)) continue;
    console.log(`  name ${slug}: « ${tr?.name} » -> « ${pick(pair)} »`);
    if (WRITE) {
      await prisma.category_translations.updateMany({ where: { category_id: cat.id, language_code: "fr" }, data: { name: pick(pair) } });
      await prisma.categories.update({ where: { id: cat.id }, data: { name: pick(pair), updated_at: new Date() } });
    }
  }
  for (const [slug, pair] of Object.entries(HIDE)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat || cat.is_active === pick(pair)) continue;
    console.log(`  ${slug} is_active ${cat.is_active} -> ${pick(pair)}`);
    if (WRITE) await prisma.categories.update({ where: { id: cat.id }, data: { is_active: pick(pair), updated_at: new Date() } });
  }
  console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
