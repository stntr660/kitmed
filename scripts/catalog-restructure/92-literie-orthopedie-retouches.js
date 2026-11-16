const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-16 -- client edits (WhatsApp 2026-11-16) on « Literie et mobilier médical »
 * and « Orthopédie »:
 *   A) moves to « Mobilité et soutien » (mobilite-et-soutien):
 *      - the FOSHAN wheelchairs (« chaises roulantes ») of Fauteuils patients
 *        (FS609U, FS696, FS809, FS868 [archived], FS874F5, FS894, FS902GC);
 *        NITROCARE transport / dialysis / donor chairs stay in Fauteuils patients;
 *      - crutch FS9274L and walker FS912L (were in Tables médicales);
 *      - PRIM urinal SC7065 (was in Orthopédie > Chaussures et protections).
 *   B) category pukang-mobilier-soins renamed « Mobilier médical d'appoint »
 *      (EN « Auxiliary medical furniture »); slug kept.
 *   C) photos:
 *      - products whose only photo was not flagged primary (so the listing showed
 *        the placeholder icon): that photo becomes primary (G-20, FS809, FS123GC,
 *        FS9280L, FS952LCQ, FS980LQF8, Attelle de Stack taille 5 100705);
 *      - photos replaced by a clean crop of the PUKANG 2026 catalogue
 *        (pukang-92-*.jpg): G-9 (old photo showed a stretcher room), G-11
 *        (watermarked), B-36 / B-46 (watermarked, not primary), DA-11 (brand logo,
 *        not primary), F-46 (watermarked, not primary).
 *   D) Orthèses cervicales: PRIM collars from the PRIM catalogue (p. 89-91) that were
 *      missing: 30090 stabiliser for collar 961, E120, E41, E45 (961 already on the
 *      site). Photos prim-92-*.jpg extracted from the catalogue (E45: teal studio
 *      background turned white).
 *
 * REVERT POINT: 92-before.json (--snapshot, refuses to overwrite) holds every touched
 * product row + media, and the category row + translations. --revert writes it back
 * and deletes the 4 created PRIM products.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 92-literie-orthopedie-retouches.js <app>:/tmp/92.js
 *   docker cp 92-before.json <app>:/tmp/92-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/92.js --snapshot   # once
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/92.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/92.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/92.js --revert
 * The pukang-92-*.jpg and prim-92-*.jpg photos are copied to uploads/products first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "92-before.json");
const now = () => new Date();
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));

// ---------------------------------------------------------------- A) moves
const MOBILITE = "mobilite-et-soutien";
const MOVES = {
  "590a4739-6bf5-4526-a71b-2da3a50a572e": "FS609U",
  "b2697472-5af3-4469-9c84-d76c6ad7e045": "FS696",
  "9f1b7117-7a09-4b6e-8663-37cc67c3f92c": "FS809",
  "0e1dba58-7cc2-4975-bc6f-e5a65f8c71e0": "FS868",
  "496f3138-024a-41e4-8597-aeebeba7e2be": "FS874F5",
  "a45ddd82-5b84-4e9b-8159-3edb94b787f5": "FS894",
  "8a5aaee3-d20b-4ae1-b924-3ee4bf6bcc56": "FS902GC",
  "992d2f63-aa44-449d-8f5f-bfc5783bdaee": "FS912L",
  "0f9f86dd-14a3-4871-8a97-db39f7634f88": "FS9274L",
  "prim-1768238719081-dn8tkvbgn": "SC7065",
};

// ---------------------------------------------------------------- B) category name
const CAT = { slug: "pukang-mobilier-soins", fr: "Mobilier médical d'appoint", en: "Auxiliary medical furniture" };

// ---------------------------------------------------------------- C) photos
// existing single photo becomes primary
const MAKE_PRIMARY = {
  "e84aba0c-cfc3-465f-97e7-f906fc71355b": "G-20",
  "9f1b7117-7a09-4b6e-8663-37cc67c3f92c": "FS809",
  "b4fa6f6c-2a32-47e9-aa87-238fd505d0ef": "FS123GC",
  "8b37bd9a-4f04-4b6a-b81a-879982480850": "FS9280L",
  "302d97f6-f6fb-4b3e-962d-eab0d9cd3b5a": "FS952LCQ",
  "64b79d69-e981-4144-99e7-d47f6db6f38d": "FS980LQF8",
  "prim-1768238719005-momsk0j64": "100705",
};
// whole media set replaced by one catalogue crop
const REPLACE = {
  "ba7732b1-4db0-4bfc-8732-d30070302c0e": ["G-9", "/uploads/products/pukang-92-g-9.jpg"],
  "e5a9a8cb-c97c-46d7-a770-724146d60f51": ["G-11", "/uploads/products/pukang-92-g-11.jpg"],
  "fe91e990-0027-46a0-a04c-aab40ec894d0": ["B-36", "/uploads/products/pukang-92-b-36.jpg"],
  "efe7a845-54d7-4e67-bba8-046bf9dc10ad": ["B-46", "/uploads/products/pukang-92-b-46.jpg"],
  "98a9a80b-4228-4ea2-b24a-6a0a8fbe5d7a": ["DA-11", "/uploads/products/pukang-92-da-11.jpg"],
  "8c643ef1-079c-4284-8e85-ac73074147e2": ["F-46", "/uploads/products/pukang-92-f-46.jpg"],
};

// ---------------------------------------------------------------- D) PRIM collars
const PRIM = "f1731aed-ede2-4bf8-aa60-e071e4fc0404";
const PRIM_PDF = "/uploads/pdfs/prim-catalogue-orthopedie.pdf";
const CERVICAL = "ortho-cervicale"; // category id (slug ortheses-cervicales)
const SIZES_5 = {
  fr: "Tailles (tour de cou / hauteur) :\nXS : 32-37 cm / 7,5-9 cm\nS : 36-41 cm / 8-9,5 cm\nM : 40-45 cm / 8,5-10 cm\nL : 44-49 cm / 9-10,5 cm\nXL : 48-53 cm / 9-10,5 cm",
  en: "Sizes (circumference / height):\nXS: 32-37 cm / 7.5-9 cm\nS: 36-41 cm / 8-9.5 cm\nM: 40-45 cm / 8.5-10 cm\nL: 44-49 cm / 9-10.5 cm\nXL: 48-53 cm / 9-10.5 cm",
};
const NEW = [
  { id: "d92a0001-0000-4000-8000-000000000001", ref: "30090", slug: "stabilisateur-collier-philadelphia-961-30090", img: "/uploads/products/prim-92-30090.jpg",
    fr: { nom: "Stabilisateur pour collier Philadelphia 961 - 30090",
      description: "Stabilisateur thoracique PRIM qui se fixe sur le collier rigide Philadelphia 961. Idéal en rééducation, il limite les mouvements du cou selon le besoin. Mise en place facile grâce aux fermetures velcro latérales ; fixations en plastique radiotransparentes. Indications : arthrose cervicale, hernie discale cervicale, entorse du cou, névralgie cervico-brachiale, fracture cervicale, immobilisation cervicale post-opératoire, métastases osseuses cervicales et dorsales hautes.",
      fiche_technique: "Référence : 30090\nCompatible avec : collier rigide Philadelphia 961\nFermeture : velcro latéral\nFixations : plastique radiotransparent\nTaille : unique" },
    en: { nom: "Stabiliser for Philadelphia collar 961 - 30090",
      description: "PRIM thoracic stabiliser attached to the rigid Philadelphia collar 961. Ideal for rehabilitation processes, it restricts neck movement as required. Easy to fit with the side Velcro fasteners; X-ray transparent plastic fixings. Indications: cervical osteoarthritis, cervical herniated disc, neck sprain, cervical root pain, cervical fracture, cervical post-operative immobilisation, cervical and upper dorsal bone metastases.",
      fiche_technique: "Reference: 30090\nFits: rigid Philadelphia collar 961\nFastening: side Velcro\nFixings: X-ray transparent plastic\nSize: one size" } },
  { id: "d92a0001-0000-4000-8000-000000000002", ref: "E120", slug: "collier-cervical-reglable-appui-mentonnier-e120", img: "/uploads/products/prim-92-e120.jpg",
    fr: { nom: "Collier cervical réglable en hauteur avec appui mentonnier E120",
      description: "Collier cervical PRIM en polyéthylène basse densité de 1 mm, recouvert de lycra et de mousse. Composé de deux pièces qui, une fois séparées, permettent de régler la hauteur ; fermeture velcro arrière. L'appui mentonnier apporte un meilleur maintien et plus de confort. Indications : arthrose cervicale, protrusion discale, entorse sévère, stabilisation post-opératoire, torticolis, cervicalgie, hernie discale.",
      fiche_technique: "Référence : E120\nMatériau : polyéthylène basse densité 1 mm, recouvert de lycra et de mousse\nRéglage : hauteur réglable (deux pièces)\nFermeture : velcro arrière\nAppui mentonnier : oui\n" + SIZES_5.fr },
    en: { nom: "Height-adjustable collar with chin support E120",
      description: "PRIM collar made of 1 mm low density polyethylene, covered with lycra and foam. It consists of two pieces which, when separated, allow the height to be adjusted; rear Velcro fastener. The chin support provides better support and comfort. Indications: cervical osteoarthritis, disc protrusion, severe sprain, post-operative stabilisation, torticollis, neck pain, herniated disc.",
      fiche_technique: "Reference: E120\nMaterial: 1 mm low density polyethylene, covered with lycra and foam\nAdjustment: height-adjustable (two pieces)\nFastening: rear Velcro\nChin support: yes\n" + SIZES_5.en } },
  { id: "d92a0001-0000-4000-8000-000000000003", ref: "E41", slug: "collier-cervical-reglable-en-hauteur-e41", img: "/uploads/products/prim-92-e41.jpg",
    fr: { nom: "Collier cervical réglable en hauteur E41",
      description: "Collier cervical PRIM en polyéthylène basse densité de 1 mm, recouvert de lycra et de mousse. Composé de deux pièces qui, une fois séparées, permettent de régler la hauteur ; fermeture velcro arrière. Indications : traumatisme sévère, arthrose cervicale, entorse sévère, torticolis, protrusion discale, cervicalgie.",
      fiche_technique: "Référence : E41\nMatériau : polyéthylène basse densité 1 mm, recouvert de lycra et de mousse\nRéglage : hauteur réglable (deux pièces)\nFermeture : velcro arrière\n" + SIZES_5.fr },
    en: { nom: "Height-adjustable collar E41",
      description: "PRIM collar made of 1 mm low density polyethylene, covered with lycra and foam. It consists of two pieces which, when separated, allow the height to be adjusted; rear Velcro fastener. Indications: severe trauma, cervical osteoarthritis, severe sprain, torticollis, disc protrusion, neck pain.",
      fiche_technique: "Reference: E41\nMaterial: 1 mm low density polyethylene, covered with lycra and foam\nAdjustment: height-adjustable (two pieces)\nFastening: rear Velcro\n" + SIZES_5.en } },
  { id: "d92a0001-0000-4000-8000-000000000004", ref: "E45", slug: "minerve-somi-imo-e45", img: "/uploads/products/prim-92-e45.jpg",
    fr: { nom: "Minerve SOMI I.M.O. E45",
      description: "Minerve PRIM de type SOMI qui maintient le rachis cervical immobilisé. Elle se compose d'un appui mentonnier et d'un appui occipital reliés à une plaque thoracique par deux barres métalliques placées derrière la tête et par un appui antérieur au niveau de la mâchoire, le tout fixé à une pièce centrale posée sur le thorax comme un gilet rigide. Le patient peut s'allonger confortablement sans perdre l'immobilisation. Les appuis mentonnier et occipital se portent toute la journée ; ils se retirent et se remplacent facilement par l'appui frontal pour les activités qui sollicitent la mâchoire, comme les repas. Adaptable aux patients sous traction. Indications : cervicalgie sévère, névralgie cervico-brachiale, traumatisme sévère, post-opératoire, fracture cervicale, arthrose cervicale, processus inflammatoire avec contracture.",
      fiche_technique: "Référence : E45\nType : minerve SOMI (sterno-occipito-mandibulaire)\nComposants : appui mentonnier, appui occipital, appui frontal, plaque thoracique\nAdaptable aux patients sous traction\nTailles (taille du patient) :\nS : jusqu'à 144 cm\nL : plus de 144 cm" },
    en: { nom: "I.M.O. SOMI collar E45",
      description: "PRIM SOMI collar that keeps the cervical spine immobilised. It is composed of a chin support and an occipital support attached to a thoracic plate through two metal bars located behind the head and by an anterior support at the level of the jaw, all fixed to a central piece that rests on the thorax like a rigid vest. The patient can lie down comfortably while maintaining immobilisation. The chin and occipital supports are worn throughout the day; they can be easily removed and replaced by the frontal support for activities that require the use of the jaw, such as eating. Can be adapted to patients undergoing traction. Indications: severe neck pain, cervical root pain, severe trauma, post-operative, cervical fracture, cervical osteoarthritis, inflammatory process causing contracture.",
      fiche_technique: "Reference: E45\nType: SOMI (sterno-occipital-mandibular immobiliser)\nParts: chin support, occipital support, frontal support, thoracic plate\nCan be adapted to patients undergoing traction\nSizes (patient height):\nS: up to 144 cm\nL: over 144 cm" } },
];

const TOUCHED = [...new Set([...Object.keys(MOVES), ...Object.keys(MAKE_PRIMARY), ...Object.keys(REPLACE)])];

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const products = await prisma.products.findMany({ where: { id: { in: TOUCHED } }, include: { product_media: true }, orderBy: { id: "asc" } });
  const cat = await prisma.categories.findUnique({ where: { slug: CAT.slug }, include: { category_translations: true } });
  const out = { taken_at: new Date().toISOString(), category: cat, products: {} };
  for (const p of products) { const { product_media, ...row } = p; out.products[p.id] = { row, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${products.length}/${TOUCHED.length} products, category ${CAT.slug} -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
async function apply() {
  const mob = await prisma.categories.findUnique({ where: { slug: MOBILITE } });
  for (const [id, ref] of Object.entries(MOVES)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) { console.log(`  [MISSING] ${ref} ${id}`); continue; }
    if (p.category_id === mob.id) { console.log(`  [SKIP] move ${ref}`); continue; }
    console.log(`  move ${ref} -> ${MOBILITE}`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { category_id: mob.id, updated_at: now() } });
  }

  const cat = await prisma.categories.findUnique({ where: { slug: CAT.slug }, include: { category_translations: true } });
  const trName = (l) => cat.category_translations.find((t) => t.language_code === l)?.name;
  if (cat.name === CAT.fr && trName("fr") === CAT.fr && trName("en") === CAT.en) console.log(`  [SKIP] category ${CAT.slug}`);
  else {
    console.log(`  category ${CAT.slug}: « ${trName("fr")} » / « ${trName("en")} » -> « ${CAT.fr} » / « ${CAT.en} »`);
    if (WRITE) {
      await prisma.categories.update({ where: { id: cat.id }, data: { name: CAT.fr, updated_at: now() } });
      await prisma.category_translations.updateMany({ where: { category_id: cat.id, language_code: "fr" }, data: { name: CAT.fr } });
      await prisma.category_translations.updateMany({ where: { category_id: cat.id, language_code: "en" }, data: { name: CAT.en } });
    }
  }

  for (const [id, ref] of Object.entries(MAKE_PRIMARY)) {
    const media = await prisma.product_media.findMany({ where: { product_id: id, type: "image" }, orderBy: { sort_order: "asc" } });
    if (!media.length) { console.log(`  [NO MEDIA] ${ref}`); continue; }
    if (media.some((m) => m.is_primary)) { console.log(`  [SKIP] primary ${ref}`); continue; }
    const m = media[0];
    if (!exists(m.url)) console.log(`  [MISSING FILE] ${m.url}`);
    console.log(`  primary ${ref} -> ${m.url}`);
    if (WRITE) await prisma.product_media.update({ where: { id: m.id }, data: { is_primary: true, sort_order: 0 } });
  }

  for (const [id, [ref, url]] of Object.entries(REPLACE)) {
    if (!exists(url)) { console.log(`  [MISSING FILE] ${url}`); continue; }
    const p = await prisma.products.findUnique({ where: { id }, include: { product_media: true, product_translations: { where: { language_code: "fr" } } } });
    if (!p) { console.log(`  [MISSING] ${ref}`); continue; }
    if (p.product_media.length === 1 && p.product_media[0].url === url && p.product_media[0].is_primary) { console.log(`  [SKIP] photo ${ref}`); continue; }
    const nom = p.product_translations[0]?.nom || ref;
    console.log(`  photo ${ref}: ${p.product_media.map((m) => m.url).join(", ")} -> ${url}`);
    if (WRITE) await prisma.$transaction([
      prisma.product_media.deleteMany({ where: { product_id: id } }),
      prisma.product_media.create({ data: { id: `${id}-m92-0`, product_id: id, type: "image", url, alt_text: nom, title: nom, sort_order: 0, is_primary: true } }),
      prisma.products.update({ where: { id }, data: { updated_at: now() } }),
    ]);
  }

  if (!exists(PRIM_PDF)) console.log(`  [MISSING FILE] ${PRIM_PDF}`);
  for (const p of NEW) {
    if (!exists(p.img)) { console.log(`  [MISSING FILE] ${p.img}`); continue; }
    if (await prisma.products.findUnique({ where: { id: p.id } })) { console.log(`  [SKIP] product ${p.ref}`); continue; }
    const clash = await prisma.products.findFirst({ where: { OR: [{ slug: p.slug }, { reference_fournisseur: p.ref, partner_id: PRIM }] } });
    if (clash) { console.log(`  [CLASH] ${p.ref} / ${p.slug} already used by ${clash.id}`); continue; }
    console.log(`  + product ${p.slug} [${p.ref}] -> ortheses-cervicales`);
    if (WRITE) await prisma.products.create({ data: {
      id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: CERVICAL, constructeur: "prim", partner_id: PRIM,
      status: "active", sort_order: 99, pdf_brochure_url: PRIM_PDF, updated_at: now(),
      product_translations: { create: ["fr", "en"].map((l) => ({ id: `${p.id}-${l}`, language_code: l, ...p[l] })) },
      product_media: { create: [{ id: `${p.id}-m92-0`, type: "image", url: p.img, alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true }] } } });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  const BEFORE = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  product ${b.row.reference_fournisseur}`);
    await prisma.$transaction(async (tx) => {
      await tx.products.update({ where: { id }, data: { ...row, updated_at: new Date(row.updated_at) } });
      await tx.product_media.deleteMany({ where: { product_id: id } });
      for (const m of b.media) await tx.product_media.create({ data: m });
    });
  }
  const { category_translations, id, created_at, ...crow } = BEFORE.category;
  console.log(`  category ${crow.slug}`);
  await prisma.categories.update({ where: { id }, data: crow });
  for (const t of category_translations) await prisma.category_translations.update({ where: { id: t.id }, data: { name: t.name } });
  const del = await prisma.products.deleteMany({ where: { id: { in: NEW.map((p) => p.id) } } });
  console.log(`  - deleted ${del.count} created PRIM products`);
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
