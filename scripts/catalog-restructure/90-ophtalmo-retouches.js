const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-16 -- client WhatsApp notes on Ophtalmologie > Appareillage
 * (screenshots IMG_2129 / 2130 / 2131 / 2134 / 2135).
 *
 * A) Rétinographie: « Rétinographe Non-Mydriatique AFC-330 » archived (« à
 *    supprimer »); « RS-330 DUO 2 » archived and replaced by the NIDEK RS-1
 *    (« à remplacer par le RS1 »): the RS-1 row moves from OCT et imagerie to
 *    Rétinographie, first card (a product has one category only).
 * B) Unité de consultation: the 5 products of the sub-categories
 *    « d'Excellence » / « Performances » / « Compactes » go directly into
 *    table-de-consultation (Excellence, then Performances, then Compactes);
 *    the 3 empty sub-categories are set inactive.
 * C) Tonomètre / Pachymètre: « Tonomètre à aplanation AT870 » (Haag-Streit
 *    Perkins Mk3) renamed « Tonomètre à aplanation portable PERKINS ».
 *    KEELER tonometers (« regarder les tonomètres KEELER à ajouter »): the
 *    archived KEELER rows of this category are reused, one card per current
 *    KEELER range (keelerglobal.com: KAT, D-KAT, Pulsair, TonoCare, AccuPen):
 *      KAT   row 2414-P-2030 (+ photo of KAT R 2414-P-2040, row left archived)
 *      D-KAT row 2414-P-2032 (+ photo of D-KAT R 2414-P-2042, row left archived)
 *      Pulsair desktop 2417-P-2000, TonoCare 2418-P-2000, AccuPen 24-3000
 *    -> active, clean slug, accented FR/EN names and short descriptions, the
 *    Spanish scraped fiche_technique cleared. Their photos are already on the
 *    volume (Keeler product shots, white background). Accessories, spare parts,
 *    duplicates and the discontinued IntelliPuff / Z-KAT stay archived.
 * D) Frontofocomètre: LM-7 / LM-7P and LM-1800 P/PD archived; only
 *    « Frontofocomètre automatique LM-1PD / LM-1P / LM-1 » stays.
 * E) Matériel de consultation ophtalmique, broken photos:
 *    - FE-2010: its brochure PDF row was also is_primary, so the category card
 *      showed the PDF as image -> PDF row is_primary false; the gallery row
 *      pointing at a PDF gets type pdf.
 *    - TL-L15: both photos were hot-linked from the Ray Vision CDN, which now
 *      answers 567 -> official Ray Vision photo (from the Wayback copy of their
 *      CDN, 2026-01-13) stored locally: oph90-ray-vision-tl-l15.jpg.
 *    - TL-V20 had the TL-G40 photo (same file) -> official TL-V20 photo,
 *      oph90-ray-vision-tl-v20.jpg.
 * F) Cryochirurgie tile: the « -80°C » device replaced by the Cryomatic MK II
 *    console photo (2509-P-1010-primary.jpg), 1200x400 with its studio
 *    background extended: q90-cryochirurgie.jpg.
 *
 * REVERT POINT: 90-before.json (--snapshot, refuses to overwrite) holds the
 * exact state on 2026-11-16 of every product touched (row, fr/en translations,
 * media) and of every category touched. --revert writes it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 90-ophtalmo-retouches.js <app>:/tmp/90.js
 *   docker cp 90-before.json <app>:/tmp/90-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/90.js --snapshot   # once
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/90.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/90.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/90.js --revert
 * The oph90-*.jpg photos (products/) and q90-cryochirurgie.jpg (categories/)
 * are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "90-before.json");
const now = () => new Date();
const kimg = (ref) => `/uploads/products/${ref}-primary.webp`;

// ---------------------------------------------------------------- products
const P = {
  AFC330: "467fbbb6-8517-409f-ab5f-1f8d2996899f",
  RS330: "7d49fb91-4401-4592-ab8d-e1bce05c2112",
  RS1: "3d1d1339-5099-4492-82a4-806448bf3de5",
  OT6400: "d6427d02-d53a-48b6-b5c9-f09ffefd19d0",
  SYNETIC: "509127fd-2898-4e84-a897-b596bbd59526",
  OT4200: "b63b26fa-0716-4370-879a-0340bf573a7f",
  OT2200: "8f0fa842-bcbe-4540-b4b5-4a6da01e44b4",
  LYPOP: "6b31c251-147f-49b6-aaf2-a78c21f46eab",
  PERKINS: "9fad61dd-c843-4420-84b0-929de153fd46",
  KAT: "4aa63549-d0a0-41f5-9b64-605a18bd00e1",
  DKAT: "683027a2-f527-485c-86dc-44cfe93f2d70",
  PULSAIR: "d68162c8-76f4-4a54-b3bb-62fb894ec1d9",
  TONOCARE: "e3e31895-9be0-47cf-a96d-4ae1e70bf183",
  ACCUPEN: "5a8aba58-c1b9-4ec0-9edd-d58f32f28835",
  LM7: "2576f5ce-74b4-457a-b7d5-da4ef892faae",
  LM1800: "c5916866-4e40-4436-b950-654e945b443a",
  FE2010: "87dc43e2-6b64-4bce-86ed-41a18ccebf49",
  TLL15: "a1033956-d016-42d6-9c46-35e89ce5ff77",
  TLV20: "b6eb72dc-a45a-4689-b08a-b282b4a43174",
};

// id -> desired state. row: products columns (cat = category slug);
// fr/en: translation columns; media: full list (replaces); mediaPatch: [{id, data}]
const PRODUCTS = {
  // A) Rétinographie
  [P.AFC330]: { row: { status: "archived" } },
  [P.RS330]: { row: { status: "archived" } },
  [P.RS1]: { row: { cat: "retinographes", sort_order: 0 } },

  // B) Unité de consultation
  [P.OT6400]: { row: { cat: "table-de-consultation", sort_order: 1 } },
  [P.SYNETIC]: { row: { cat: "table-de-consultation", sort_order: 2 } },
  [P.OT4200]: { row: { cat: "table-de-consultation", sort_order: 3 } },
  [P.OT2200]: { row: { cat: "table-de-consultation", sort_order: 4 } },
  [P.LYPOP]: { row: { cat: "table-de-consultation", sort_order: 5 } },

  // C) Tonomètre / Pachymètre
  [P.PERKINS]: {
    fr: { nom: "Tonomètre à aplanation portable PERKINS" },
    en: { nom: "PERKINS portable applanation tonometer" },
  },
  [P.DKAT]: {
    row: { status: "active", sort_order: 3, slug: "keeler-d-kat-tonometre-aplanation-numerique", reference_fournisseur: "2414-P-2032 / 2414-P-2042" },
    fr: { nom: "Tonomètre à aplanation numérique D-KAT (types T et R)", fiche_technique: null,
      description: "Tonomètre à aplanation de Goldmann numérique KEELER D-KAT, conçu et fabriqué à la main au Royaume-Uni. L'électronique interne et l'écran LED affichent directement la valeur de la pression intraoculaire, lisible même en salle sombre. Deux montages : type T amovible (2414-P-2032), qui se partage entre plusieurs lampes à fente, et type R fixe (2414-P-2042) pour les lampes à fente de type tour. Fourni avec bras de calibration et prisme de mesure réutilisable ; une pile AA 1,5 V." },
    en: { nom: "D-KAT digital applanation tonometer (T and R types)", fiche_technique: null,
      description: "KEELER D-KAT digital Goldmann applanation tonometer, designed and hand-made in the UK. Internal electronics and an LED display show the intraocular pressure directly, easy to read in a darkened room. Two mountings: removable T type (2414-P-2032), shared between several slit lamps, and fixed R type (2414-P-2042) for tower slit lamps. Supplied with calibration arm and reusable measuring prism; one 1.5 V AA battery." },
    media: [kimg("2414-P-2032"), kimg("2414-P-2042")],
  },
  [P.KAT]: {
    row: { status: "active", sort_order: 4, slug: "keeler-kat-tonometre-aplanation", reference_fournisseur: "2414-P-2030 / 2414-P-2040" },
    fr: { nom: "Tonomètre à aplanation KAT (types T et R)", fiche_technique: null,
      description: "Tonomètre à aplanation de Goldmann mécanique KEELER KAT, fabriqué au Royaume-Uni. Il mesure la pression intraoculaire en déterminant la force nécessaire pour aplanir une zone cornéenne de 3,06 mm, sans pile ni électronique. Deux montages : type T amovible (2414-P-2030), qui passe d'une lampe à fente à l'autre, et type R fixe (2414-P-2040) pour les lampes à fente de type tour. Fourni avec prisme de mesure réutilisable." },
    en: { nom: "KAT applanation tonometer (T and R types)", fiche_technique: null,
      description: "KEELER KAT mechanical Goldmann applanation tonometer, made in the UK. It measures intraocular pressure from the force needed to flatten a 3.06 mm area of the cornea, with no battery or electronics. Two mountings: removable T type (2414-P-2030), moved from one slit lamp to another, and fixed R type (2414-P-2040) for tower slit lamps. Supplied with a reusable measuring prism." },
    media: [kimg("2414-P-2030"), kimg("2414-P-2040")],
  },
  [P.PULSAIR]: {
    row: { status: "active", sort_order: 5, slug: "keeler-pulsair-tonometre-sans-contact" },
    fr: { nom: "Tonomètre sans contact de bureau Pulsair", fiche_technique: null,
      description: "Tonomètre à air pulsé KEELER Pulsair pour mesurer la pression intraoculaire sans contact avec la cornée. Le souffle intelligent démarre en douceur et n'augmente que si la PIO du patient est élevée. Alignement et déclenchement automatiques grâce à la détection de position par LED. Format de bureau compact (moins de la moitié de l'encombrement d'un tonomètre sans contact classique), fixation murale possible, aucun consommable stérile." },
    en: { nom: "Pulsair desktop non-contact tonometer", fiche_technique: null,
      description: "KEELER Pulsair air-puff tonometer for measuring intraocular pressure without touching the cornea. The intelligent puff starts gently and only increases when the patient's IOP is high. Automatic alignment and capture through LED position detection. Compact desktop format (less than half the footprint of a conventional non-contact tonometer), wall mounting available, no sterile consumables." },
  },
  [P.TONOCARE]: {
    row: { status: "active", sort_order: 6, slug: "keeler-tonocare-tonometre-portable-sans-contact" },
    fr: { nom: "Tonomètre portable sans contact TonoCare", fiche_technique: null,
      description: "Tonomètre à air pulsé KEELER TonoCare, portable et sans fil. Buse convergente pour un jet d'air précis sur la cornée, plage de mesure de 5 à 50 mmHg (norme ISO 8612). Prêt en moins de 10 secondes, mesure des deux yeux en 30 secondes environ, sans embout jetable. Poids 1,0 kg ; la station d'accueil assure la recharge et le transfert des mesures vers un PC par USB." },
    en: { nom: "TonoCare handheld non-contact tonometer", fiche_technique: null,
      description: "KEELER TonoCare handheld, wireless air-puff tonometer. Converging nozzle for a precise air jet on the cornea, 5 to 50 mmHg measuring range (ISO 8612). Ready in under 10 seconds, both eyes measured in about 30 seconds, no disposable tips. Weight 1.0 kg; the docking station charges the unit and sends readings to a PC over USB." },
  },
  [P.ACCUPEN]: {
    row: { status: "active", sort_order: 7, slug: "keeler-accupen-tonometre-portable" },
    fr: { nom: "Tonomètre portable AccuPen", fiche_technique: null,
      description: "Tonomètre électronique de contact KEELER AccuPen, en forme de stylo, pour mesurer la pression intraoculaire quelle que soit la position du patient (assis, allongé, au bloc). La technologie Gravity Offset compense l'orientation de l'instrument et limite les calibrations. Embouts AccuTip à usage unique pour une mesure hygiénique, affichage numérique immédiat. Adapté au dépistage, à la pédiatrie et aux patients qui ne peuvent pas être examinés à la lampe à fente." },
    en: { nom: "AccuPen handheld tonometer", fiche_technique: null,
      description: "KEELER AccuPen pen-shaped electronic contact tonometer, measuring intraocular pressure in any patient position (seated, supine, in the operating room). Gravity Offset technology compensates for the instrument's orientation and reduces calibration. Single-use AccuTip covers for hygienic measurement, immediate digital readout. Suited to screening, paediatrics and patients who cannot be examined at a slit lamp." },
  },

  // D) Frontofocomètre
  [P.LM7]: { row: { status: "archived" } },
  [P.LM1800]: { row: { status: "archived" } },

  // E) Matériel de consultation ophtalmique
  [P.FE2010]: { mediaPatch: [
    { id: "7d9546b6-bdfc-49c7-bcb6-b7f4209e995c", data: { is_primary: false } },  // fe-2010-brochure.pdf
    { id: "d545585f-329f-4e68-9044-a45d588ccc3a", data: { type: "pdf" } },        // fe-2010-gallery-2.pdf
  ] },
  [P.TLL15]: { media: ["/uploads/products/oph90-ray-vision-tl-l15.jpg"] },
  [P.TLV20]: { media: ["/uploads/products/oph90-ray-vision-tl-v20.jpg"] },
};

// ---------------------------------------------------------------- categories
const CATEGORIES = {
  "unites-excellence": { is_active: false },
  "unites-performances": { is_active: false },
  "unites-compactes": { is_active: false },
  "cryochirurgie": { image_url: "/uploads/categories/q90-cryochirurgie.jpg" },
};

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const out = { taken_at: now().toISOString(), products: {}, categories: {} };
  for (const id of Object.keys(PRODUCTS)) {
    const p = await prisma.products.findUnique({ where: { id }, include: { product_translations: true, product_media: true } });
    if (!p) throw new Error(`missing product ${id}`);
    const { product_translations, product_media, ...row } = p;
    out.products[id] = { row, translations: product_translations, media: product_media };
  }
  for (const slug of Object.keys(CATEGORIES)) {
    out.categories[slug] = await prisma.categories.findUnique({ where: { slug } });
  }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${Object.keys(out.products).length} products, ${Object.keys(out.categories).length} categories -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);

async function apply() {
  const catIds = {};
  const catId = async (slug) => (catIds[slug] ??= (await prisma.categories.findUnique({ where: { slug } })).id);

  for (const [id, spec] of Object.entries(PRODUCTS)) {
    const p = await prisma.products.findUnique({ where: { id }, include: { product_translations: true, product_media: true } });
    if (!p) { console.log(`  [MISSING] ${id}`); continue; }
    const label = `${p.reference_fournisseur}`.slice(0, 28).padEnd(28);
    const log = [];

    const data = {};
    for (const [k, v] of Object.entries(spec.row || {})) {
      if (k === "cat") { const c = await catId(v); if (p.category_id !== c) { data.category_id = c; log.push(`-> ${v}`); } }
      else if (!same(p[k], v)) { data[k] = v; log.push(`${k} ${JSON.stringify(p[k])} -> ${JSON.stringify(v)}`); }
    }

    const trUpd = [];
    for (const lang of ["fr", "en"]) {
      if (!spec[lang]) continue;
      const tr = p.product_translations.find((t) => t.language_code === lang);
      const d = {};
      for (const [k, v] of Object.entries(spec[lang])) if (!same(tr?.[k], v)) d[k] = v;
      if (Object.keys(d).length) { trUpd.push({ tr, lang, d }); log.push(`${lang}: ${d.nom ? `« ${tr?.nom} » -> « ${d.nom} »` : Object.keys(d).join("+")}`); }
    }

    let media = null;
    if (spec.media) {
      spec.media.forEach((u) => { if (!exists(u)) console.log(`  [MISSING FILE] ${u}`); });
      const fr = spec.fr?.nom || p.product_translations.find((t) => t.language_code === "fr")?.nom;
      media = spec.media.map((url, i) => ({ id: `${id}-m90-${i}`, product_id: id, type: "image", url, alt_text: fr, title: fr, sort_order: i, is_primary: i === 0 }));
      const ok = p.product_media.length === media.length && media.every((m) => p.product_media.some((x) => x.url === m.url && x.is_primary === m.is_primary && x.sort_order === m.sort_order && x.type === "image"));
      if (ok) media = null; else log.push(`photos -> ${spec.media.join(", ")} (replace ${p.product_media.length})`);
    }
    const patches = (spec.mediaPatch || []).filter(({ id: mid, data: d }) => {
      const m = p.product_media.find((x) => x.id === mid);
      return m && Object.entries(d).some(([k, v]) => m[k] !== v);
    });
    patches.forEach(({ id: mid, data: d }) => log.push(`media ${p.product_media.find((x) => x.id === mid).url.split("/").pop()} ${JSON.stringify(d)}`));

    if (!log.length) { console.log(`  [SKIP] ${label}`); continue; }
    console.log(`  ${label} ${log.join(" | ")}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id }, data: { ...data, updated_at: now() } });
      for (const { tr, d } of trUpd) await tx.product_translations.update({ where: { id: tr.id }, data: d });
      if (media) {
        await tx.product_media.deleteMany({ where: { product_id: id } });
        for (const m of media) await tx.product_media.create({ data: m });
      }
      for (const { id: mid, data: d } of patches) await tx.product_media.update({ where: { id: mid }, data: d });
    });
  }

  for (const [slug, want] of Object.entries(CATEGORIES)) {
    const c = await prisma.categories.findUnique({ where: { slug } });
    if (!c) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (want.image_url && !exists(want.image_url)) { console.log(`  [MISSING FILE] ${want.image_url}`); continue; }
    const d = {};
    for (const [k, v] of Object.entries(want)) if (!same(c[k], v)) d[k] = v;
    if (!Object.keys(d).length) { console.log(`  [SKIP] category ${slug}`); continue; }
    console.log(`  category ${slug.padEnd(22)} ${JSON.stringify(d)}`);
    if (WRITE) await prisma.categories.update({ where: { id: c.id }, data: { ...d, updated_at: now() } });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  const B = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  const date = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /_at$/.test(k) && v ? new Date(v) : v]));
  for (const [id, b] of Object.entries(B.products)) {
    const { id: _id, ...row } = date(b.row);
    console.log(`  restore ${b.row.reference_fournisseur}`);
    await prisma.$transaction(async (tx) => {
      await tx.products.update({ where: { id }, data: row });
      for (const t of b.translations) {
        const { id: tid, product_id, ...d } = t;
        await tx.product_translations.update({ where: { id: tid }, data: d });
      }
      await tx.product_media.deleteMany({ where: { product_id: id } });
      for (const m of b.media) await tx.product_media.create({ data: date(m) });
    });
  }
  for (const [slug, c] of Object.entries(B.categories)) {
    console.log(`  restore category ${slug}`);
    await prisma.categories.update({ where: { id: c.id }, data: { is_active: c.is_active, image_url: c.image_url, updated_at: new Date(c.updated_at) } });
  }
}

async function main() {
  if (SNAPSHOT) await snapshot();
  else if (REVERT) await revert();
  else await apply();
  if (!SNAPSHOT) console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
