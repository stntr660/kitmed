const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- Lot D, FCI catalogues.
 *
 * Rebuilds the FCI range from the two client catalogues (data in 81-fci-data.json,
 * generated from the PDFs; photos cropped from the catalogue pages):
 *
 *  - « FCI CATALOGUE 1 » = FCI Oculoplastics catalog 2020 (consumables, S-codes).
 *    Ophtalmologie > Consommables > oculoplastie-fci is renamed « Oculoplastie FCI » /
 *    « FCI oculoplastics » and gets 8 sub-categories (épiphora bouchons / intubation /
 *    DCR, sécheresse oculaire, paupières ptosis / poids, orbite implants / accessoires).
 *    46 products, one per product line, sizes / lengths / packagings as variants in
 *    the technical sheet (206 codes).
 *  - « INSTRUMENTATION FCI 2021 » (reusable instruments, A/F codes).
 *    Ophtalmologie > Instrumentation gets « Instruments FCI » (fci-instruments) with 20
 *    family sub-categories (Pinces split in 4) and « Boîtes chirurgicales FCI »
 *    (fci-boites). 219 instrument products: one per catalogue entry with its own photo
 *    (entries sharing one photo, e.g. Ciseaux de Bonn droits / courbes, are one product
 *    with variants) = all 259 codes of the index p.65-68; 12 surgical boxes A10.xxxx
 *    with their composition (codes + names) in description and technical sheet.
 *
 * Every created product: partner FCI, constructeur « fci », status active, photo
 * /uploads/products/fci-*.jpg, catalogue PDF as pdf_brochure_url
 * (/uploads/pdfs/fci-catalogue-oculoplastie-2020.pdf or fci-catalogue-instrumentation-2021.pdf).
 * Category tiles: /uploads/categories/fci-tile-*.jpg (3:1).
 *
 * Existing FCI rows: the archived bundle rows stay archived and untouched. The two
 * active catalogue placeholders (« Oculoplastie FCI » FCI-OCULOPLASTIE-KIT and
 * « Instruments FCI » FCI-INSTRUMENTS) are not real products -> archived.
 * The archived 'valves' FCI row (Paul / Ahmed) is not touched (stays archived).
 *
 * REVERT POINT: 81-before.json (written by --snapshot, refuses to overwrite) holds the
 * exact rows of oculoplastie-fci and instrumentation (with translations) and of the
 * two archived placeholders (row, translations, media). --revert writes them back and
 * deletes the created products and categories (fixed ids, see data file).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 81-fci.js <app>:/tmp/81.js
 *   docker cp 81-fci-data.json <app>:/tmp/81-fci-data.json
 *   docker cp 81-before.json <app>:/tmp/81-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/81.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/81.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/81.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "81-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "81-fci-data.json"), "utf8"));
const now = () => new Date();

const FCI = "588ba503-6949-406b-82c6-6670f3c32692"; // partners.slug = fci
const OCU = "oculoplastie-fci";
const INSTR = "instrumentation";
const OCU_FR = { name: "Oculoplastie FCI", description: "Consommables oculoplastiques FCI : épiphora, sécheresse oculaire, paupières et orbite." };
const OCU_EN = { name: "FCI oculoplastics", description: "FCI oculoplastic consumables: epiphora, dry eye, eyelids and orbit." };
const ARCHIVE = [
  "2b2ae872-7ae9-4779-b102-e13a9717981f", // « Oculoplastie FCI » FCI-OCULOPLASTIE-KIT: catalogue placeholder
  "7f1a6ff3-ca81-496d-8f0c-f1a20cb89dd7", // « Instruments FCI » FCI-INSTRUMENTS: catalogue placeholder
];

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const cats = await prisma.categories.findMany({ where: { slug: { in: [OCU, INSTR] } }, include: { category_translations: true } });
  const products = await prisma.products.findMany({ where: { id: { in: ARCHIVE } }, include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  const out = { taken_at: new Date().toISOString(), categories: {}, products: {} };
  for (const c of cats) { const { category_translations, ...row } = c; out.categories[c.slug] = { row, translations: category_translations }; }
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${cats.length} categories, ${products.length} products -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const pimg = (f) => `/uploads/products/${f}`;

async function syncCatTranslations(id, fr, en) {
  const tr = await prisma.category_translations.findMany({ where: { category_id: id } });
  for (const [lang, v] of [["fr", fr], ["en", en]]) {
    const t = tr.find((x) => x.language_code === lang);
    if (t && same(t.name, v.name) && (v.description === undefined || same(t.description, v.description))) continue;
    console.log(`    translation ${lang} « ${t?.name ?? "-"} » -> « ${v.name} »`);
    if (WRITE) await prisma.category_translations.upsert({
      where: { category_id_language_code: { category_id: id, language_code: lang } },
      update: v, create: { id: `${id}-${lang}`, category_id: id, language_code: lang, ...v } });
  }
}

async function apply() {
  // 1. oculoplastie-fci rename
  const ocu = await prisma.categories.findUnique({ where: { slug: OCU } });
  const instr = await prisma.categories.findUnique({ where: { slug: INSTR } });
  if (ocu.name !== OCU_FR.name) {
    console.log(`  category ${OCU} « ${ocu.name} » -> « ${OCU_FR.name} »`);
    if (WRITE) await prisma.categories.update({ where: { id: ocu.id }, data: { name: OCU_FR.name, updated_at: now() } });
  } else console.log(`  [SKIP] category ${OCU}`);
  await syncCatTranslations(ocu.id, OCU_FR, OCU_EN);

  // 2. categories (parents first: data order is ocu subs, fci-instruments, fci-boites, families)
  const idBySlug = { [OCU]: ocu.id, [INSTR]: instr.id };
  for (const c of DATA.categories) {
    idBySlug[c.slug] = c.id;
    if (!exists(c.image)) console.log(`  [MISSING FILE] ${c.image}`);
    const parent = idBySlug[c.parent];
    const row = await prisma.categories.findUnique({ where: { id: c.id } });
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » under ${c.parent} (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, parent_id: parent, sort_order: c.sort,
        is_active: true, type: instr.type, image_url: c.image, updated_at: now(),
        category_translations: { create: [{ id: `${c.id}-fr`, language_code: "fr", name: c.fr }, { id: `${c.id}-en`, language_code: "en", name: c.en }] } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== parent) data.parent_id = parent;
    if (row.sort_order !== c.sort) data.sort_order = c.sort;
    if (row.image_url !== c.image) data.image_url = c.image;
    if (!row.is_active) data.is_active = true;
    if (row.name !== c.fr) data.name = c.fr;
    if (row.slug !== c.slug) data.slug = c.slug;
    if (Object.keys(data).length) {
      console.log(`  category ${c.slug} ${JSON.stringify(data)}`);
      if (WRITE) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
    }
    await syncCatTranslations(c.id, { name: c.fr }, { name: c.en });
  }

  // 3. products
  let created = 0, skipped = 0, updated = 0;
  for (const p of DATA.products) {
    for (const f of [pimg(p.img), p.pdf]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);
    const catId = idBySlug[p.cat];
    const media = { id: `${p.id}-m81`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    if (!row) {
      created++;
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat}`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId, constructeur: "fci", partner_id: FCI,
        status: "active", sort_order: p.sort, pdf_brochure_url: p.pdf, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    if (row.category_id !== catId) data.category_id = catId;
    if (row.status !== "active") data.status = "active";
    if (row.sort_order !== p.sort) data.sort_order = p.sort;
    if (row.pdf_brochure_url !== p.pdf) data.pdf_brochure_url = p.pdf;
    if (row.reference_fournisseur !== p.ref) data.reference_fournisseur = p.ref;
    if (row.slug !== p.slug) data.slug = p.slug;
    if (row.constructeur !== "fci") data.constructeur = "fci";
    if (row.partner_id !== FCI) data.partner_id = FCI;
    const tr = [];
    for (const lang of ["fr", "en"]) {
      const t = row.product_translations.find((x) => x.language_code === lang);
      if (!t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k]))) tr.push(lang);
    }
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary;
    if (!Object.keys(data).length && !tr.length && mediaOk) { skipped++; continue; }
    updated++;
    console.log(`  product ${p.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : " photo"}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({
        where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: crypto.randomUUID(), product_id: p.id, language_code: lang, ...p[lang] } });
      if (!mediaOk) {
        await tx.product_media.deleteMany({ where: { product_id: p.id } });
        await tx.product_media.create({ data: { ...media, product_id: p.id } });
      }
    });
  }
  console.log(`  products: ${created} to create, ${updated} to update, ${skipped} unchanged`);

  // 4. placeholders -> archived
  for (const id of ARCHIVE) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${id}`); continue; }
    if (row.status === "archived") { console.log(`  [SKIP] archive ${row.slug}`); continue; }
    console.log(`  archive ${row.slug} [${row.reference_fournisseur}]`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }

  // 5. partner FCI must be active
  const partner = await prisma.partners.findUnique({ where: { id: FCI } });
  if (partner.status !== "active") console.log(`  [WARN] partner FCI status=${partner.status} (not changed by this script)`);
}

// ---------------------------------------------------------------- revert
async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  product ${b.row.slug} -> ${b.row.status}`);
    await prisma.$transaction(async (tx) => {
      await tx.products.update({ where: { id }, data: { ...row, updated_at: now() } });
      for (const t of b.translations) {
        const { id: tid, product_id, language_code, ...fields } = t;
        await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: id, language_code } }, update: fields, create: t });
      }
      await tx.product_media.deleteMany({ where: { product_id: id } });
      for (const m of b.media) await tx.product_media.create({ data: m });
    });
  }
  const n = await prisma.products.deleteMany({ where: { id: { in: DATA.products.map((p) => p.id).filter((id) => !BEFORE.products[id]) } } });
  console.log(`  - deleted ${n.count} new products`);
  for (const [slug, b] of Object.entries(BEFORE.categories)) {
    const { id, created_at, ...row } = b.row;
    console.log(`  category ${slug}`);
    await prisma.categories.update({ where: { id }, data: { ...row, updated_at: now() } });
    for (const t of b.translations) {
      const { id: tid, category_id, language_code, ...fields } = t;
      await prisma.category_translations.upsert({ where: { category_id_language_code: { category_id, language_code } }, update: fields, create: t });
    }
  }
  for (const c of [...DATA.categories].reverse()) { // families first, then their parents
    if (!(await prisma.categories.findUnique({ where: { id: c.id } }))) continue;
    const k = await prisma.products.count({ where: { category_id: c.id } });
    const ch = await prisma.categories.count({ where: { parent_id: c.id } });
    if (k || ch) { console.log(`  [KEEP] ${c.slug} has ${k} products / ${ch} children`); continue; }
    console.log(`  - delete category ${c.slug}`);
    await prisma.categories.delete({ where: { id: c.id } });
  }
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
