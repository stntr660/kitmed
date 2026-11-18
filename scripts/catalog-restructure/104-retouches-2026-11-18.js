const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- client voice note (catalogue retouches):
 *
 * 1) NIDEK « Tomographe OCT RS-1 » (moved to Rétinographie by script 90) goes back to
 *    « OCT et imagerie » (oct-et-imagerie), first card as before script 90 (sort 0).
 * 2) KEELER « D-KAT » and « KAT » applanation tonometers (reactivated by script 90 in
 *    Tonomètre / Pachymètre) move to « Lampe à fente » (slit-lamp mounted tonometers,
 *    « catégorie lampe à fente »), right after the Haag-Streit Goldmann AT 900 (sort 60):
 *    D-KAT 61, KAT 62.
 * 3) NIDEK échographe « US-4000 » archived.
 * 4) Contactologie (oph-contactology, was Ophtalmologie > Consommables > Contactologie)
 *    becomes a top-level category (parent null, type discipline) right after Orthoptie:
 *    sort_order 3; the following top-level categories (ORL, Literie, Orthopédie,
 *    Dispositifs médicaux, Drapage) move down by one, as script 93 did. Slug, products
 *    and image kept.
 * 5) NITROCARE « BST 01 Compact Table de Lit » moves from Literie hospitalière to
 *    « Mobilier médical d'appoint » (pukang-mobilier-soins), with the other bed tables.
 * 6) PRIM must not appear under « Literie et mobilier médical » on the Partenaires page:
 *    the only PRIM product in that tree is the urinal SC7065 (moved to Mobilité et soutien
 *    by script 92) -> back to Orthopédie > Chaussures et protections (sort 99, as before 92).
 * 7) ACUVUE « Lentilles de Contact Mensuelles ACUVUE VITA » (ACUVUEVI) archived. The other
 *    ACUVUE products are left to script 106.
 *
 * REVERT POINT: 104-before.json (--snapshot, refuses to overwrite) holds the touched
 * product rows, the oph-contactology row and the sort_order / parent / type of every
 * top-level category. --revert writes back ONLY the columns this script changes
 * (category_id, sort_order, status; parent_id, type, sort_order), so later edits by
 * scripts 105/106 on the same rows (texts, media) are not undone.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 104-retouches-2026-11-18.js <app>:/tmp/104.js ; docker cp 104-before.json <app>:/tmp/104-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/104.js --snapshot   # once
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/104.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/104.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/104.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const BEFORE_FILE = path.join(__dirname, "104-before.json");
const now = () => new Date();
const same = (a, b) => (a ?? null) === (b ?? null);

// ---------------------------------------------------------------- products
const P = {
  RS1: "3d1d1339-5099-4492-82a4-806448bf3de5",
  DKAT: "683027a2-f527-485c-86dc-44cfe93f2d70",
  KAT: "4aa63549-d0a0-41f5-9b64-605a18bd00e1",
  US4000: "70f6f49b-e132-4dbb-bd22-560b7545d149",
  BST01: "nitro-1768234616120-rx0dm6zl3",
  SC7065: "prim-1768238719081-dn8tkvbgn",
  VITA: "c79544bd-54fa-4005-bee1-64ae2716c440",
};

// id -> desired columns (cat = category slug)
const PRODUCTS = {
  [P.RS1]: { cat: "oct-et-imagerie", sort_order: 0 },
  [P.DKAT]: { cat: "lampe-a-fente", sort_order: 61 },
  [P.KAT]: { cat: "lampe-a-fente", sort_order: 62 },
  [P.US4000]: { status: "archived" },
  [P.BST01]: { cat: "pukang-mobilier-soins" },
  [P.SC7065]: { cat: "chaussures-protections", sort_order: 99 },
  [P.VITA]: { status: "archived" },
};
const PRODUCT_COLS = ["category_id", "sort_order", "status"];

// ---------------------------------------------------------------- categories
const CONTACTO = { slug: "oph-contactology", parent_id: null, type: "discipline", sort_order: 3 };
const CAT_COLS = ["parent_id", "type", "sort_order"];

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const out = { taken_at: now().toISOString(), products: {}, contactology: null, top_level: [] };
  for (const id of Object.keys(PRODUCTS)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) throw new Error(`missing product ${id}`);
    out.products[id] = p;
  }
  out.contactology = await prisma.categories.findUnique({ where: { slug: CONTACTO.slug } });
  out.top_level = await prisma.categories.findMany({ where: { parent_id: null }, select: { id: true, slug: true, sort_order: true, parent_id: true, type: true }, orderBy: { sort_order: "asc" } });
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${Object.keys(out.products).length} products, ${out.top_level.length} top-level categories -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
async function apply() {
  const BEFORE = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  const catIds = {};
  const catId = async (slug) => (catIds[slug] ??= (await prisma.categories.findUnique({ where: { slug } })).id);

  for (const [id, spec] of Object.entries(PRODUCTS)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) { console.log(`  [MISSING] ${id}`); continue; }
    const label = `${p.reference_fournisseur}`.slice(0, 28).padEnd(28);
    const data = {};
    const log = [];
    for (const [k, v] of Object.entries(spec)) {
      if (k === "cat") { const c = await catId(v); if (p.category_id !== c) { data.category_id = c; log.push(`-> ${v}`); } }
      else if (!same(p[k], v)) { data[k] = v; log.push(`${k} ${JSON.stringify(p[k])} -> ${JSON.stringify(v)}`); }
    }
    if (!log.length) { console.log(`  [SKIP] ${label}`); continue; }
    console.log(`  ${label} ${log.join(" | ")}`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { ...data, updated_at: now() } });
  }

  // top-level order: Contactologie right after Orthoptie, the others (as snapshotted) move down by one
  for (const t of BEFORE.top_level) {
    if (t.slug === CONTACTO.slug) continue;
    const target = t.sort_order >= CONTACTO.sort_order ? t.sort_order + 1 : t.sort_order;
    const row = await prisma.categories.findUnique({ where: { id: t.id } });
    if (!row) { console.log(`  [MISSING CATEGORY] ${t.slug}`); continue; }
    if (row.sort_order === target) continue;
    console.log(`  sort ${t.slug}: ${row.sort_order} -> ${target}`);
    if (WRITE) await prisma.categories.update({ where: { id: t.id }, data: { sort_order: target, updated_at: now() } });
  }

  const c = await prisma.categories.findUnique({ where: { slug: CONTACTO.slug } });
  if (!c) { console.log(`  [MISSING CATEGORY] ${CONTACTO.slug}`); return; }
  const d = {};
  for (const k of CAT_COLS) if (!same(c[k], CONTACTO[k])) d[k] = CONTACTO[k];
  if (!Object.keys(d).length) console.log(`  [SKIP] category ${CONTACTO.slug}`);
  else {
    console.log(`  category ${CONTACTO.slug} ${JSON.stringify(d)}`);
    if (WRITE) await prisma.categories.update({ where: { id: c.id }, data: { ...d, updated_at: now() } });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  const B = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  for (const [id, row] of Object.entries(B.products)) {
    const data = Object.fromEntries(PRODUCT_COLS.map((k) => [k, row[k]]));
    console.log(`  restore ${row.reference_fournisseur} ${JSON.stringify(data)}`);
    await prisma.products.update({ where: { id }, data: { ...data, updated_at: new Date(row.updated_at) } });
  }
  const c = B.contactology;
  console.log(`  restore category ${c.slug} parent ${c.parent_id} type ${c.type} sort ${c.sort_order}`);
  await prisma.categories.update({ where: { id: c.id }, data: { parent_id: c.parent_id, type: c.type, sort_order: c.sort_order, updated_at: new Date(c.updated_at) } });
  for (const t of B.top_level) {
    const row = await prisma.categories.findUnique({ where: { id: t.id } });
    if (!row || row.sort_order === t.sort_order) continue;
    console.log(`  sort ${t.slug}: ${row.sort_order} -> ${t.sort_order}`);
    await prisma.categories.update({ where: { id: t.id }, data: { sort_order: t.sort_order, updated_at: now() } });
  }
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
