const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-14 -- client notes + mockups (« trio ophtalmique », « Appareillage
 * ophtalmologique » pages 1/2 and 2/2).
 *
 * Ophtalmologie gets 3 pillars, in this order:
 *   1. Appareillage (new)      -- the 25 tiles of the mockup, flat, mockup order
 *                                 (+ Réfracteurs, which the mockup leaves out)
 *   2. Consommables            -- the old « Consommables et implants », renamed;
 *                                 Glaucome, Schirmer/fluo/bleu, Oculoplastie and
 *                                 Contactologie move under it
 *   3. Instrumentation         -- moved up out of Bloc opératoire
 * New tiles: Matériel de consultation ophtalmique, Cryochirurgie, Synoptophore.
 * The grouping categories that the mockup drops (Matériel de réfraction,
 * Segment antérieur, Diagnostic rétine, Bloc opératoire, Plateformes
 * multimodales, Micropérimètres, Pupillomètres, Autres) are set inactive once
 * empty. Tile images = the images of the client's mockups, cropped as-is.
 *
 * Products: HEINE ophthalmoscopes, Ray Vision trial sets, ICE edgers and the
 * FE-2010 chair -> Matériel de consultation; Mirante -> Angiographie; MP-3 ->
 * Rétinographie (client lists it there); PM-700 + Phantom -> Réfracteurs;
 * Synoptophore LED -> Synoptophore; OMNI -> Schirmer, fluorescéine et bleu;
 * Cryomatic MK II console reactivated in Cryochirurgie. PDFs attached to
 * Mirante, MP-3 and Cryomatic MK II.
 * Also: « Literie et mobilier médical » and the accent on « Orthopédie ».
 *
 * REVERT POINT: 76-before.json is the exact state of every touched row on
 * 2026-11-14 (category parent/order/active/image/names, product category/
 * status/pdf). --revert writes it back and deletes the 3 new categories.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 76-ophtalmo-trois-piliers.js <app>:/tmp/76.js
 *   docker cp 76-before.json <app>:/tmp/76-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/76.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/76.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/76.js --revert
 * The oph-*.jpg tile images and the 3 PDFs are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE = JSON.parse(fs.readFileSync(path.join(__dirname, "76-before.json"), "utf8"));
const img = (n) => `/uploads/categories/oph-${n}.jpg`;

const NEW = {
  "appareillage-ophtalmique":         { id: "c76a0001-0000-4000-8000-000000000001", fr: "Appareillage", en: "Equipment" },
  "materiel-consultation-ophtalmique": { id: "c76a0001-0000-4000-8000-000000000002", fr: "Matériel de consultation ophtalmique", en: "Ophthalmic examination instruments" },
  "cryochirurgie":                     { id: "c76a0001-0000-4000-8000-000000000003", fr: "Cryochirurgie", en: "Cryosurgery" },
  "synoptophore":                      { id: "c76a0001-0000-4000-8000-000000000004", fr: "Synoptophore", en: "Synoptophore" },
};

// slug -> { parent, sort, fr?, en?, image?, active? }
const PILLARS = {
  "appareillage-ophtalmique": { parent: "ophtalmologie", sort: 1, image: img("pilier-appareillage") },
  "consommable":     { parent: "ophtalmologie", sort: 2, fr: "Consommables", en: "Consumables", image: img("pilier-consommables") },
  "instrumentation": { parent: "ophtalmologie", sort: 3, image: img("pilier-instrumentation") },
};
const A = "appareillage-ophtalmique";
const TILES = {
  "microscopie-speculaire":     { parent: A, sort: 1,  fr: "Microscope spéculaire", en: "Specular microscope", image: img("microscope-speculaire") },
  "traitement-et-diagnostique-secheresse-oculaire": { parent: A, sort: 2, fr: "Sécheresse oculaire", en: "Dry eye", image: img("secheresse-oculaire") },
  "retinographes":              { parent: A, sort: 3,  fr: "Rétinographie", en: "Retinography", image: img("retinographie") },
  "verres-ophtalmoscope-et-skeepens": { parent: A, sort: 4, fr: "Verres ophtalmiques", en: "Ophthalmic lenses", image: img("verres-ophtalmiques") },
  "oct-et-imagerie":            { parent: A, sort: 5,  fr: "Tomographie à cohérence optique (OCT)", en: "Optical coherence tomography (OCT)", image: img("oct") },
  "angiographes":               { parent: A, sort: 6,  fr: "Angiographie", en: "Angiography", image: img("angiographie"), active: true },
  "table-de-consultation":      { parent: A, sort: 7,  fr: "Unité de consultation ophtalmique", en: "Ophthalmic examination unit", image: img("unite-consultation") },
  "auto-refractometres":        { parent: A, sort: 8,  fr: "Autoréfracto-kératomètre", en: "Auto refracto-keratometer", image: img("autorefracto-keratometre") },
  "tonometres-pachymetres":     { parent: A, sort: 9,  fr: "Tonomètre / Pachymètre", en: "Tonometer / Pachymeter", image: img("tonometre-pachymetre") },
  "frontofocometre":            { parent: A, sort: 10, fr: "Frontofocomètre", en: "Lensmeter", image: img("frontofocometre") },
  "lampe-a-fente":              { parent: A, sort: 11, fr: "Lampe à fente", en: "Slit lamp", image: img("lampe-a-fente") },
  "ecran-optotype":             { parent: A, sort: 12, fr: "Projecteur de tests", en: "Test projector", image: img("projecteur-tests") },
  "refracteurs":                { parent: A, sort: 13 },
  "biometrie-contact-sans-contact-et-echographie": { parent: A, sort: 14, fr: "Biomètre / Échographe", en: "Biometer / Ultrasound", image: img("biometre-echographe") },
  "perimetres":                 { parent: A, sort: 15, fr: "Champ visuel", en: "Visual field", image: img("champ-visuel") },
  "microscope-operatoire":      { parent: A, sort: 16, image: img("microscope-operatoire") },
  "lasers-et-ipl":              { parent: A, sort: 17, fr: "Laser ophtalmique", en: "Ophthalmic laser", image: img("laser-ophtalmique") },
  "materiel-consultation-ophtalmique": { parent: A, sort: 18, image: img("materiel-consultation") },
  "phaco":                      { parent: A, sort: 19, fr: "Phacoémulsification", image: img("phacoemulsification") },
  "cryochirurgie":              { parent: A, sort: 20, image: img("cryochirurgie") },
  "topographie":                { parent: A, sort: 21, fr: "Aberromètre / Topographe cornéen", en: "Aberrometer / Corneal topographer", image: img("aberrometre-topographe") },
  "gonioscope":                 { parent: A, sort: 22, image: img("gonioscope") },
  "flux-air-laminaire":         { parent: A, sort: 23, fr: "Système à flux laminaire", en: "Laminar flow system", image: img("flux-laminaire") },
  "simulateur":                 { parent: A, sort: 24, image: img("simulateur") },
  "synoptophore":               { parent: A, sort: 25, image: img("synoptophore") },
  "table-motorisee":            { parent: A, sort: 26, fr: "Table motorisée", en: "Motorized table", image: img("table-motorisee") },
  // Consommables
  "implant-et-visco":           { parent: "consommable", sort: 1 },
  "viscoelastique":             { parent: "consommable", sort: 2 },
  "couteaux":                   { parent: "consommable", sort: 3 },
  "valves":                     { parent: "consommable", sort: 4 },
  "schirmer-fluorescein-et-bleu-vision": { parent: "consommable", sort: 5, fr: "Schirmer, fluorescéine et bleu", en: "Schirmer, fluorescein and blue dye", active: true },
  "oculoplastie-fci":           { parent: "consommable", sort: 6 },
  "oph-contactology":           { parent: "consommable", sort: 7 },
  // other domains
  "mobilier-et-literie-hospitaliers": { fr: "Literie et mobilier médical", en: "Medical beds and furniture" },
  "orthopedics":                { fr: "Orthopédie" },
};
// emptied by the moves above -> inactive
const HIDE = ["materiel-de-refraction", "segment-anterieur", "diagnostic-retine", "bloc-operatoire",
  "plateformes-multimodales", "champ-visuel-electrophysiologie", "pupillometres", "autres"];

const HEINE_RAY = Object.keys(BEFORE.products).filter((id) =>
  BEFORE.products[id].category_id === "b3bcc215-951d-4dae-92bd-8f416f975eb5");
const PRODUCTS = [
  ...HEINE_RAY.map((id) => ({ id, to: "materiel-consultation-ophtalmique" })),
  { id: "6c4b7a2f-8bd7-418d-98d9-0f050156f4ab", to: "materiel-consultation-ophtalmique" }, // ICE-1
  { id: "c632cb82-b68c-439c-a615-ab0fe070cdb8", to: "materiel-consultation-ophtalmique" }, // ICE-1500
  { id: "87dc43e2-6b64-4bce-86ed-41a18ccebf49", to: "materiel-consultation-ophtalmique" }, // FE-2010
  { id: "13e41431-7e1e-42a5-a9d4-91315fa7c524", to: "angiographes", pdf: "/uploads/pdfs/kitmed-2026-11-nidek-mirante.pdf" },
  { id: "16a900cb-4ff6-48a4-b2d9-0686d3590603", to: "retinographes", pdf: "/uploads/pdfs/kitmed-2026-11-nidek-mp-3.pdf" },
  { id: "7571ecad-f25e-45d4-92a3-505da95cdb1f", to: "refracteurs" },   // PM-700
  { id: "31ad0ac7-21ab-4cdb-b365-f22ea1c7f990", to: "refracteurs" },   // Phantom
  { id: "066a53f1-2aa7-4e5b-90c9-0587c616fa4d", to: "synoptophore" },  // Synoptophore LED
  { id: "omni-1768245275619-1fd5kczer", to: "schirmer-fluorescein-et-bleu-vision" },
  { id: "omni-1768245275641-mcac2r5g2", to: "schirmer-fluorescein-et-bleu-vision" },
  { id: "omni-1768245275610-ozjjmhwc7", to: "schirmer-fluorescein-et-bleu-vision" },
  { id: "ed939d0c-c518-42ca-9b5f-7f5a3922adb5", to: "cryochirurgie", status: "active", pdf: "/uploads/pdfs/kitmed-2026-11-keeler-cryomatic-mk-ii.pdf" },
];

const ids = {};
async function idOf(slug) {
  if (!ids[slug]) ids[slug] = (await prisma.categories.findUnique({ where: { slug } }))?.id || NEW[slug]?.id;
  return ids[slug];
}
const now = () => new Date();

async function setNames(cat, fr, en) {
  for (const [lang, name] of [["fr", fr], ["en", en]]) {
    if (!name) continue;
    const row = await prisma.category_translations.findUnique({ where: { category_id_language_code: { category_id: cat.id, language_code: lang } } });
    if (row?.name === name) continue;
    console.log(`    ${lang} « ${row?.name} » -> « ${name} »`);
    if (WRITE) await prisma.category_translations.upsert({
      where: { category_id_language_code: { category_id: cat.id, language_code: lang } },
      update: { name }, create: { id: crypto.randomUUID(), category_id: cat.id, language_code: lang, name } });
  }
  if (fr && cat.name !== fr) {
    console.log(`    name « ${cat.name} » -> « ${fr} »`);
    if (WRITE) await prisma.categories.update({ where: { id: cat.id }, data: { name: fr, updated_at: now() } });
  }
}

async function apply() {
  for (const [slug, n] of Object.entries(NEW)) {
    if (await prisma.categories.findUnique({ where: { slug } })) { console.log(`  [SKIP] create ${slug}`); continue; }
    console.log(`  + create ${slug}`);
    if (WRITE) await prisma.categories.create({ data: { id: n.id, slug, name: n.fr, type: "equipment", is_active: true, updated_at: now(),
      category_translations: { create: [{ id: crypto.randomUUID(), language_code: "fr", name: n.fr }, { id: crypto.randomUUID(), language_code: "en", name: n.en }] } } });
  }
  for (const [slug, t] of Object.entries({ ...PILLARS, ...TILES })) {
    const cat = await prisma.categories.findUnique({ where: { slug } }) || (!WRITE && NEW[slug] ? { id: NEW[slug].id, slug, name: NEW[slug].fr } : null);
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (t.image && !fs.existsSync(path.join(UPLOADS, t.image.replace(/^\/uploads\//, "")))) console.log(`  [MISSING FILE] ${t.image}`);
    const data = {};
    if (t.parent) { const p = await idOf(t.parent); if (cat.parent_id !== p) data.parent_id = p; }
    if (t.sort !== undefined && cat.sort_order !== t.sort) data.sort_order = t.sort;
    if (t.image && cat.image_url !== t.image) data.image_url = t.image;
    if (t.active !== undefined && cat.is_active !== t.active) data.is_active = t.active;
    console.log(`  ${slug}${Object.keys(data).length ? " " + JSON.stringify(data) : ""}`);
    if (WRITE && Object.keys(data).length && cat.updated_at) await prisma.categories.update({ where: { id: cat.id }, data: { ...data, updated_at: now() } });
    await setNames(cat, t.fr, t.en);
  }
  for (const p of PRODUCTS) {
    const row = await prisma.products.findUnique({ where: { id: p.id } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${p.id}`); continue; }
    if (p.pdf && !fs.existsSync(path.join(UPLOADS, p.pdf.replace(/^\/uploads\//, "")))) console.log(`  [MISSING FILE] ${p.pdf}`);
    const data = {};
    const to = await idOf(p.to);
    if (row.category_id !== to) data.category_id = to;
    if (p.status && row.status !== p.status) data.status = p.status;
    if (p.pdf && row.pdf_brochure_url !== p.pdf) data.pdf_brochure_url = p.pdf;
    if (!Object.keys(data).length) { console.log(`  [SKIP] product ${row.reference_fournisseur}`); continue; }
    console.log(`  product ${row.reference_fournisseur.slice(0, 30).padEnd(30)} -> ${p.to}${data.status ? " (active)" : ""}${data.pdf_brochure_url ? " +pdf" : ""}`);
    if (WRITE) await prisma.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
  }
  for (const slug of HIDE) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    const left = await prisma.products.count({ where: { category_id: cat.id, status: "active" } });
    const moving = PRODUCTS.filter((p) => BEFORE.products[p.id]?.category_id === cat.id && BEFORE.products[p.id]?.status === "active").length;
    if (left - (WRITE ? 0 : moving) > 0) { console.log(`  [KEEP] ${slug} still has ${left} active products`); continue; }
    if (!cat.is_active) { console.log(`  [SKIP] hide ${slug}`); continue; }
    console.log(`  hide ${slug}`);
    if (WRITE) await prisma.categories.update({ where: { id: cat.id }, data: { is_active: false, updated_at: now() } });
  }
}

async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    console.log(`  product ${id} -> ${b.category_id} ${b.status}`);
    await prisma.products.update({ where: { id }, data: { category_id: b.category_id, status: b.status, pdf_brochure_url: b.pdf_brochure_url, updated_at: now() } });
  }
  for (const [slug, b] of Object.entries(BEFORE.categories)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    console.log(`  ${slug}`);
    await prisma.categories.update({ where: { id: cat.id }, data: { parent_id: b.parent_id, sort_order: b.sort_order, is_active: b.is_active, image_url: b.image_url, name: b.name, updated_at: now() } });
    for (const lang of ["fr", "en"]) if (b[lang]) await prisma.category_translations.updateMany({ where: { category_id: cat.id, language_code: lang }, data: { name: b[lang] } });
  }
  for (const slug of Object.keys(NEW).reverse()) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) continue;
    const n = await prisma.products.count({ where: { category_id: cat.id } });
    if (n) { console.log(`  [KEEP] ${slug} has ${n} products`); continue; }
    await prisma.categories.updateMany({ where: { parent_id: cat.id }, data: { parent_id: null } });
    console.log(`  - delete ${slug}`);
    await prisma.categories.delete({ where: { id: cat.id } });
  }
}

(REVERT ? revert() : apply())
  .then(async () => { console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
