const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Batch 2026-09-14 -- client review of the staging catalogue (WhatsApp photos
 * IMG_9300..9312 from KITMED's commercial director) plus the category order of
 * the client Excel ("Nouveau Feuille de calcul Microsoft Excel (3).xlsx").
 *
 * A) ophthalmology families: client order, French names with accents,
 *    "Biométrie et échographie" filled instead of empty, "Périmètres" created
 *    for the Octopus 900/600, empty families switched off
 * B) "Pharmacie" is renamed "Dispositifs médicaux" (client: "au lieu de
 *    pharmacie, dispositif médical")
 * C) products the client asked to remove are ARCHIVED (status only, nothing
 *    deleted), misnamed ones renamed, misplaced ones moved, brand order fixed
 * D) wrong/missing photos replaced; image files must already be on the staging
 *    volume -- a file missing locally is skipped, never linked
 * E) brochure links that 404, point at example.com, pack several URLs into one
 *    field, or are really images are removed, so no empty download button shows
 *
 * NOTE: public/uploads is a mounted volume on staging
 * (/root/docker-volumes/kitmed-staging/public/uploads). Copy new files there
 * BEFORE --apply, otherwise the URLs written here 404.
 *
 * Rollback: full pg_dump taken first,
 *   backups/kitmed_staging_before_client_feedback_2026-09-14.dump
 *
 * Run:
 *   DATABASE_URL=... node 58-client-feedback-2026-09-14.js          # dry-run
 *   DATABASE_URL=... node 58-client-feedback-2026-09-14.js --apply
 */

const APPLY = process.argv.includes("--apply");
const UPLOADS = path.join(__dirname, "..", "..", "public", "uploads");

// ---------------------------------------------------------------- A. families
// Order of the client Excel: UNITES DE CONSULTATION, REFRACTION, LAMPE A FENTE,
// LASERS & IPL, DIAGNOSTIC RETINE, SEGMENT ANTERIEUR, BLOC OPERATOIRE,
// CONSOMMABLE, COUTEAUX, AUTRES, OCULOPLASTIE, (RETINE), GLAUCOME.
// Families the Excel does not name sit next to their closest sibling.
const OPHTHALMOLOGY_ORDER = [
  ["table-de-consultation",            "Unités de consultation",          "Examination Units"],
  ["table-motorisee",                  "Tables motorisées",               "Motorized Tables"],
  ["materiel-de-refraction",           "Matériel de réfraction",          "Refraction Equipment"],
  ["lampe-a-fente",                    "Lampes à fente",                  "Slit Lamps"],
  ["verres-ophtalmoscope-et-skeepens", "Verres et ophtalmoscopes",        "Lenses and Ophthalmoscopes"],
  ["lasers-et-ipl",                    "Lasers & IPL",                    "Lasers & IPL"],
  ["diagnostic-retine",                "Diagnostic rétine",               "Retina Diagnostics"],
  ["segment-anterieur",                "Segment antérieur",               "Anterior Segment"],
  ["biometrie-contact-sans-contact-et-echographie", "Biométrie et échographie", "Biometry and Ultrasound"],
  ["gonioscope",                       "Gonioscope",                      "Gonioscope"],
  ["bloc-operatoire",                  "Bloc opératoire",                 "Operating Room"],
  ["consommable",                      "Consommables et implants",        "Consumables and Implants"],
  ["couteaux",                         "Couteaux",                        "Knives"],
  ["oculoplastie-fci",                 "Oculoplastie",                    "Oculoplasty"],
  ["valves",                           "Glaucome",                        "Glaucoma"],
  ["oph-contactology",                 "Contactologie",                   "Contactology"],
  ["simulateur",                       "Simulateur",                      "Simulator"],
  ["autres",                           "Autres",                          "Other"],
];

// accents / wording only, slug and parent unchanged
const RENAME_ONLY = {
  "microscope-operatoire": ["Microscope opératoire", "Surgical Microscope"],
  "traitement-et-diagnostique-secheresse-oculaire": ["Traitement et diagnostic de la sécheresse oculaire", "Dry Eye Treatment and Diagnosis"],
};

const CREATE = [
  { slug: "perimetres", parent: "diagnostic-retine", sort: 20, fr: "Périmètres (champ visuel)", en: "Perimeters (Visual Field)" },
];

// child slug -> [new parent slug, sort_order]
const REPARENT = {
  "biometres-optiques": ["biometrie-contact-sans-contact-et-echographie", 1],
  "echographes":        ["biometrie-contact-sans-contact-et-echographie", 2],
};

// Empty once this batch is applied (or already empty): the public API hides
// them anyway, switching them off keeps the admin tree honest too.
const DEACTIVATE = [
  "schirmer-fluorescein-et-bleu-vision", // client: the OMNI strips already live in "Autres"
  "punchs-trepans",                      // "catégorie en cours de développement"
  "angiographes",
  "logiciels",
  "retine",                              // client: "on fait pas la rétine"
];

// sub-categories whose card showed an initial instead of a photo; the file is
// a square crop of the category's own product photo
const CATEGORY_IMAGES = [
  "unites-excellence", "unites-performances", "unites-compactes",
  "pupillometres", "auto-refractometres", "refracteurs",
  "plateformes-multimodales", "retinographes", "echographes",
  "biometres-optiques", "viscoelastique", "perimetres",
];

// ------------------------------------------------------------- B. discipline
const DISCIPLINE_RENAME = {
  from: "oph-pharmaceutics",
  slug: "dispositifs-medicaux",
  fr: "Dispositifs médicaux",
  en: "Medical Devices",
};

// --------------------------------------------------------------- C. products
// reference_fournisseur -> why
const ARCHIVE = {
  "SSC-370":          "IMG_9300: carte « Écran d'Optotypes SC-1600 » avec la photo et la réf. du SSC-370 -- doublon du vrai SC-1600",
  "FE 3001":          "IMG_9311: « c'est un fauteuil, pas une unité de consultation, donc à enlever »",
  "570":              "IMG_9306: Precizon Presbyopic NVA -- « hada heydo aussi »",
  "IMPLANTG, VALVEGLA": "IMG_9303: glaucome FCI -- « hada FCI makanjibouhch »",
  "ANNEAUXD":         "IMG_9308: anneaux rétiniens FCI -- « on fait pas la rétine »",
  "Silklase":         "IMG_9308: Autres -- tout à enlever sauf le Synoptophore encadré",
  "SA-260MB":         "IMG_9308: Autres -- tout à enlever sauf le Synoptophore encadré",
  "RITSIGHT":         "IMG_9308: Autres -- tout à enlever sauf le Synoptophore encadré",
  "Visio System":     "IMG_9308: Autres -- hors liste Excel (AUTRES = OMNI, STARSET), non encadré",
  "OCU-MKBIIKYJ":     "IMG_9311: « à enlever, déjà mis dans les verres » -- doublon à la racine Ophtalmologie",
  "GS-1":             "doublon à la racine Ophtalmologie du GS-1 déjà classé dans Gonioscope",
  "TONOREF-III-TONO": "doublon : deux cartes « Tonoref III » identiques dans Auto-réfractomètres",
};

// reference -> { fr, en } (only the fields given are written)
const RENAME = {
  "SYMPHONY-Q": { fr: "Symphony Q Series" },                        // IMG_9301: « Symphony avec Y »
  "SC-1600":    { fr: "Écran d'optotypes SC-1600 / SC-1600 Pola", en: "SC-1600 / SC-1600 Pola Visual Acuity Chart" },
  // IMG_9303: « makhassouch ykun YAG, rir dak désignation dialo »
  // YLC-500 is NIDEK's yellow (577 nm) photocoagulator, not a YAG laser.
  // Wording from https://www.nidek.fr/laser-photocoagulateur/ylc-500-500-vixi-577nm/
  "YLC-500": {
    fr: "Laser photocoagulateur jaune YLC-500 / YLC-500 VIXI",
    en: "YLC-500 / YLC-500 VIXI Yellow Laser Photocoagulator",
    frDescription: "Laser photocoagulateur NIDEK en longueur d'onde jaune (577 nm), monté sur lampe à fente. YLC-500 en monospot, YLC-500 VIXI en multispot.",
    enDescription: "NIDEK yellow-wavelength (577 nm) laser photocoagulator, slit-lamp mounted. YLC-500 single spot, YLC-500 VIXI multispot.",
  },
  // same family, same wording (https://www.nidek.fr/laser-photocoagulateur/gyc-500-500-vixi-532nm/)
  "GYC-500": {
    fr: "Laser photocoagulateur vert GYC-500 / GYC-500 VIXI",
    en: "GYC-500 / GYC-500 VIXI Green Laser Photocoagulator",
  },
  // The box reads "Duo -- Hiluron 1.4% / Hiluron 3.0%". "DuoVisc" is an Alcon
  // trademark and Hiluron is a Care Group product, not Medicontur.
  "DUOVISC-HILURON": {
    fr: "Hiluron Duo - Système viscoélastique double",
    en: "Hiluron Duo - Dual Viscoelastic System",
    frDescription: "Hiluron Duo (Care Group) : 2 seringues préremplies stériles de 1 ml, Hiluron 1,4 % (hyaluronate de sodium cohésif) et Hiluron 3,0 % (hyaluronate de sodium dispersif). Solution ophtalmique pour la chirurgie de la cataracte.",
    enDescription: "Hiluron Duo (Care Group): 2 sterile prefilled 1 ml syringes, Hiluron 1.4% (cohesive sodium hyaluronate) and Hiluron 3.0% (dispersive sodium hyaluronate). Ophthalmic solution for cataract surgery.",
  },
};

// reference -> brand, matching how the other Care Group products are stored
// Care Group has no partner row, so its raw constructeur is what the cards
// print -- "caregroupe" next to "MEDICONTUR" in the list the client reviewed.
const REBRAND = {
  "DUOVISC-HILURON":  { constructeur: "CARE GROUP", partner_id: null },
  "OCUFLEX-2":        { constructeur: "CARE GROUP", partner_id: null },
  "ACRIOL-PRELOADED": { constructeur: "CARE GROUP", partner_id: null },
};

// reference -> category slug
const MOVE = {
  "PLANCHER, FORMESPO, COQUEDEP": "oculoplastie-fci", // orbital implants are not intra-ocular implants
  "HAAG-OCTOPUS-900": "perimetres",                   // perimeter, not a microperimeter
  "7220001":          "perimetres",                   // Octopus 600
};

// IMG_9306: « les implants : Medicontur en premier, après Care Group »
// Sequence inside each category; anything unlisted keeps its value but is
// pushed after the listed ones.
const PRODUCT_ORDER = {
  "implant-et-visco": [
    "877PA-877PAY", "BIFLEX-T-677TA", "ELON-EDOF", "ELON-TORIC", "A4DW0M", // Medicontur
    "OCUFLEX-2", "ACRIOL-PRELOADED",                                     // Care Group (Excel: OCUFLEX, ACRIYOL)
    "ARTISAN APHAKIA", "OD125",                                          // Ophtec
  ],
  "viscoelastique": [
    "Biovis-1.6", "Biovis-1.8", "Biovis-3.0", "VISCO-MC",                 // Medicontur
    "DUOVISC-HILURON",
  ],
  "perimetres": ["HAAG-OCTOPUS-900", "7220001"],
  "ecran-optotype": ["SC-1600", "CP-9"],
};

// ------------------------------------------------------------------ D. photos
// reference -> file under public/uploads/products (becomes the primary image)
const PRIMARY_IMAGES = {
  "SC-1600":             "sc-1600-pola.jpg",
  "HAAG-OCTOPUS-900":    "octopus-900.jpg",
  "HEINE-BETA-200S-LED": "heine-beta-200s-led.jpg",
  // "DUOVISC-HILURON": no clean packshot of Hiluron Duo exists online; the
  // client's phone photo stays until KITMED sends a proper one
  "OD125":               "ophtec-enclavation-needle.jpg",
};
// A wrong photo is worse than none: if the replacement is not available, the
// product is archived instead of keeping the wrong image.
const ARCHIVE_IF_NO_IMAGE = { "OD125": "IMG_9306: « l'image n'est pas celle de l'aiguille » -- aucune photo fiable trouvée" };

// --------------------------------------------------------------- E. brochures
// partner slug -> default_pdf_url to clear
const CLEAR_PARTNER_PDF = ["foshan"]; // /uploads/products/foshan-catalog.pdf is a 404

// its "pdf" media row was a JPG; the real 6-page brochure is on the volume
const SET_BROCHURE = { "AFC-330": "/uploads/products/afc-330-brochure.pdf" };

// ============================================================================

const log = [];
const say = (s) => { console.log(s); log.push(s); };
const now = () => new Date();

async function setCategoryNames(cat, fr, en) {
  for (const [lang, name] of [["fr", fr], ["en", en]]) {
    if (!name) continue;
    const tr = await prisma.category_translations.findUnique({
      where: { category_id_language_code: { category_id: cat.id, language_code: lang } },
    });
    if (tr && tr.name === name) continue;
    say(`    ${lang}: "${tr ? tr.name : "(none)"}" -> "${name}"`);
    if (!APPLY) continue;
    if (tr) await prisma.category_translations.update({ where: { id: tr.id }, data: { name } });
    else await prisma.category_translations.create({ data: { id: randomUUID(), category_id: cat.id, language_code: lang, name } });
  }
  if (fr && cat.name !== fr && APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { name: fr, updated_at: now() } });
}

async function product(ref) {
  const p = await prisma.products.findUnique({
    where: { reference_fournisseur: ref },
    include: {
      product_translations: true,
      product_media: true,
      categories: { select: { slug: true } },
    },
  });
  if (!p) say(`  [MISSING PRODUCT] ${ref}`);
  return p;
}

const frName = (p) => p.product_translations.find((t) => t.language_code === "fr")?.nom || p.reference_fournisseur;

async function main() {
  say(`=== Client feedback 2026-09-14 ===`);
  say(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}  DB: ${(process.env.DATABASE_URL || "").replace(/\/\/[^@]+@/, "//***@")}\n`);
  const activeBefore = await prisma.products.count({ where: { status: "active" } });

  // ---------------------------------------------------------------- A
  say("--- A. familles ophtalmologie ---");
  const oph = await prisma.categories.findUnique({ where: { slug: "ophtalmologie" } });

  for (const c of CREATE) {
    const exists = await prisma.categories.findUnique({ where: { slug: c.slug } });
    if (exists) { say(`  [EXISTS] ${c.slug}`); continue; }
    const parent = await prisma.categories.findUnique({ where: { slug: c.parent } });
    say(`  + ${c.slug} "${c.fr}" sous ${c.parent}`);
    if (APPLY) {
      await prisma.categories.create({
        data: {
          id: randomUUID(), name: c.fr, slug: c.slug, parent_id: parent.id, sort_order: c.sort,
          is_active: true, type: "equipment", updated_at: now(),
          category_translations: { create: [
            { id: randomUUID(), language_code: "fr", name: c.fr },
            { id: randomUUID(), language_code: "en", name: c.en },
          ] },
        },
      });
    }
  }

  for (const [i, [slug, fr, en]] of OPHTHALMOLOGY_ORDER.entries()) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { say(`  [MISSING] ${slug}`); continue; }
    const sort = i + 1;
    const changes = [];
    if (cat.parent_id !== oph.id) changes.push("parent -> ophtalmologie");
    if (cat.sort_order !== sort) changes.push(`sort ${cat.sort_order} -> ${sort}`);
    if (!cat.is_active) changes.push("réactivée");
    say(`  ${String(sort).padStart(2)}. ${slug}${changes.length ? "  (" + changes.join(", ") + ")" : ""}`);
    if (APPLY && changes.length) {
      await prisma.categories.update({ where: { id: cat.id }, data: { parent_id: oph.id, sort_order: sort, is_active: true, updated_at: now() } });
    }
    await setCategoryNames(cat, fr, en);
  }

  for (const [slug, [fr, en]] of Object.entries(RENAME_ONLY)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { say(`  [MISSING] ${slug}`); continue; }
    say(`  ~ ${slug}`);
    await setCategoryNames(cat, fr, en);
  }

  for (const [slug, [parentSlug, sort]] of Object.entries(REPARENT)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    const parent = await prisma.categories.findUnique({ where: { slug: parentSlug } });
    if (!cat || !parent) { say(`  [MISSING] ${slug} / ${parentSlug}`); continue; }
    if (cat.parent_id === parent.id && cat.sort_order === sort) { say(`  [SKIP] ${slug} déjà sous ${parentSlug}`); continue; }
    say(`  > ${slug} -> ${parentSlug} (sort ${sort})`);
    if (APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { parent_id: parent.id, sort_order: sort, updated_at: now() } });
  }

  // ---------------------------------------------------------------- B
  say("\n--- B. Pharmacie -> Dispositifs médicaux ---");
  {
    const cat = await prisma.categories.findUnique({ where: { slug: DISCIPLINE_RENAME.from } })
      || await prisma.categories.findUnique({ where: { slug: DISCIPLINE_RENAME.slug } });
    if (!cat) say("  [MISSING] discipline pharmacie");
    else {
      if (cat.slug !== DISCIPLINE_RENAME.slug) {
        say(`  slug ${cat.slug} -> ${DISCIPLINE_RENAME.slug}`);
        if (APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { slug: DISCIPLINE_RENAME.slug, updated_at: now() } });
      }
      await setCategoryNames(cat, DISCIPLINE_RENAME.fr, DISCIPLINE_RENAME.en);
      const trs = await prisma.category_translations.findMany({ where: { category_id: cat.id } });
      for (const tr of trs) {
        if (tr.description && /pharma/i.test(tr.description)) {
          say(`    ${tr.language_code} description mentionne "pharma" -> vidée (fallback générique)`);
          if (APPLY) await prisma.category_translations.update({ where: { id: tr.id }, data: { description: null } });
        }
      }
      if (cat.description && /pharma/i.test(cat.description) && APPLY) {
        await prisma.categories.update({ where: { id: cat.id }, data: { description: null, updated_at: now() } });
      }
    }
  }

  // ---------------------------------------------------------------- C
  say("\n--- C1. produits archivés ---");
  const archive = { ...ARCHIVE };
  for (const [ref, file] of Object.entries(PRIMARY_IMAGES)) {
    if (ARCHIVE_IF_NO_IMAGE[ref] && !fs.existsSync(path.join(UPLOADS, "products", file))) archive[ref] = ARCHIVE_IF_NO_IMAGE[ref];
  }
  for (const [ref, why] of Object.entries(archive)) {
    const p = await product(ref);
    if (!p) continue;
    if (p.status !== "active") { say(`  [SKIP] ${ref} déjà ${p.status}`); continue; }
    say(`  x [${p.categories.slug}] ${frName(p).slice(0, 60)}\n      ${why}`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { status: "archived", updated_at: now() } });
  }

  say("\n--- C2. renommages ---");
  for (const [ref, r] of Object.entries(RENAME)) {
    const p = await product(ref);
    if (!p) continue;
    for (const [lang, nom, description] of [["fr", r.fr, r.frDescription], ["en", r.en, r.enDescription]]) {
      if (!nom) continue;
      const tr = p.product_translations.find((t) => t.language_code === lang);
      if (!tr) { say(`  [NO ${lang}] ${ref}`); continue; }
      const data = {};
      if (tr.nom !== nom) data.nom = nom;
      if (description && tr.description !== description) data.description = description;
      if (!Object.keys(data).length) continue;
      say(`  ${ref} ${lang}: "${tr.nom}" -> "${nom}"${data.description ? " (+ description)" : ""}`);
      if (APPLY) await prisma.product_translations.update({ where: { id: tr.id }, data });
    }
  }

  say("\n--- C2b. marques ---");
  for (const [ref, data] of Object.entries(REBRAND)) {
    const p = await product(ref);
    if (!p) continue;
    if (p.constructeur === data.constructeur && p.partner_id === data.partner_id) continue;
    say(`  ${ref}: ${p.constructeur}/${p.partner_id || "-"} -> ${data.constructeur}/${data.partner_id || "-"}`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
  }

  say("\n--- C3. déplacements ---");
  for (const [ref, slug] of Object.entries(MOVE)) {
    const p = await product(ref);
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!p) continue;
    if (!cat) { say(`  [MISSING CATEGORY] ${slug}${APPLY ? "" : " (créée en apply)"}`); continue; }
    if (p.category_id === cat.id) { say(`  [SKIP] ${ref} déjà dans ${slug}`); continue; }
    say(`  ${p.categories.slug} -> ${slug}   ${frName(p).slice(0, 50)}`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { category_id: cat.id, updated_at: now() } });
  }

  say("\n--- C4. ordre des produits ---");
  for (const [slug, refs] of Object.entries(PRODUCT_ORDER)) {
    for (const [i, ref] of refs.entries()) {
      const p = await product(ref);
      if (!p) continue;
      const sort = (i + 1) * 10;
      if (p.sort_order === sort) continue;
      say(`  ${slug}: ${ref} sort ${p.sort_order} -> ${sort}`);
      if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { sort_order: sort, updated_at: now() } });
    }
    // unlisted products in the same category go after the listed ones
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) continue;
    const others = await prisma.products.findMany({
      where: { category_id: cat.id, status: "active", reference_fournisseur: { notIn: refs }, sort_order: { lte: refs.length * 10 } },
    });
    for (const o of others) {
      say(`  ${slug}: ${o.reference_fournisseur} (non listé) sort ${o.sort_order} -> 999`);
      if (APPLY) await prisma.products.update({ where: { id: o.id }, data: { sort_order: 999, updated_at: now() } });
    }
  }

  // ---------------------------------------------------------------- D
  say("\n--- D1. photos produits ---");
  for (const [ref, file] of Object.entries(PRIMARY_IMAGES)) {
    const p = await product(ref);
    if (!p) continue;
    if (!fs.existsSync(path.join(UPLOADS, "products", file))) { say(`  [NO FILE] ${ref} (${file})`); continue; }
    const url = `/uploads/products/${file}`;
    const current = p.product_media.find((m) => m.type === "image" && m.is_primary)
      || p.product_media.filter((m) => m.type === "image").sort((a, b) => a.sort_order - b.sort_order)[0];
    if (current && current.url === url) { say(`  [SKIP] ${ref} a déjà ${file}`); continue; }
    say(`  ${ref}: ${current ? current.url : "(aucune)"} -> ${url}`);
    if (!APPLY) continue;
    // the old photo was wrong or missing: drop the image rows, keep pdf rows
    await prisma.product_media.deleteMany({ where: { product_id: p.id, type: "image" } });
    await prisma.product_media.create({
      data: { id: randomUUID(), product_id: p.id, type: "image", url, alt_text: frName(p), sort_order: 0, is_primary: true },
    });
  }

  say("\n--- D2. photos des sous-catégories ---");
  for (const slug of CATEGORY_IMAGES) {
    const file = ["jpg", "png", "webp"].map((e) => `${slug}.${e}`).find((f) => fs.existsSync(path.join(UPLOADS, "categories", f)));
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!file) { say(`  [NO FILE] ${slug}`); continue; }
    if (!cat) { say(`  [MISSING CATEGORY] ${slug}${APPLY ? "" : " (créée en apply)"}`); continue; }
    const url = `/uploads/categories/${file}`;
    if (cat.image_url === url) continue;
    say(`  ${slug}: ${cat.image_url || "(aucune)"} -> ${url}`);
    if (APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: url, updated_at: now() } });
  }

  // ---------------------------------------------------------------- A (end)
  say("\n--- A2. familles désactivées ---");
  for (const slug of DEACTIVATE) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { say(`  [MISSING] ${slug}`); continue; }
    if (!cat.is_active) { say(`  [SKIP] ${slug} déjà inactive`); continue; }
    const left = await prisma.products.count({ where: { category_id: cat.id, status: "active" } });
    const pendingArchive = await prisma.products.count({
      where: { category_id: cat.id, status: "active", reference_fournisseur: { in: Object.keys(archive) } },
    });
    if (left - pendingArchive > 0) { say(`  [KEEP] ${slug}: ${left - pendingArchive} produit(s) actif(s) restant(s)`); continue; }
    say(`  - ${slug}`);
    if (APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { is_active: false, updated_at: now() } });
  }

  // ---------------------------------------------------------------- E
  say("\n--- E. brochures ---");
  const withPdf = await prisma.products.findMany({
    where: { status: "active", OR: [{ pdf_brochure_url: { not: null } }, { product_media: { some: { type: "pdf" } } }] },
    include: { product_media: { where: { type: "pdf" } }, product_translations: { where: { language_code: "fr" } } },
  });
  const reachable = new Map();
  const check = async (url) => {
    if (reachable.has(url)) return reachable.get(url);
    let ok = false;
    try {
      if (/example\.com/i.test(url)) ok = false;
      else if (url.startsWith("/uploads/")) {
        // the local public/uploads mirror is partial; ask the live volume
        const res = await fetch(`https://kitmed-staging.zonemation.cloud${encodeURI(decodeURI(url))}`, { method: "GET", headers: { Range: "bytes=0-4" } });
        const buf = Buffer.from(await res.arrayBuffer());
        ok = res.ok && buf.slice(0, 4).toString() === "%PDF";
      } else if (/^https?:\/\//.test(url)) {
        const res = await fetch(encodeURI(decodeURI(url)), { method: "GET", headers: { Range: "bytes=0-4", "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
        const buf = Buffer.from(await res.arrayBuffer());
        ok = res.ok && buf.slice(0, 4).toString() === "%PDF";
      }
    } catch { ok = false; }
    reachable.set(url, ok);
    return ok;
  };

  for (const p of withPdf) {
    const name = (p.product_translations[0]?.nom || p.reference_fournisseur).slice(0, 48);
    if (p.pdf_brochure_url) {
      const parts = p.pdf_brochure_url.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
      let keep = null;
      for (const u of parts) { if (await check(u)) { keep = u; break; } }
      if (keep !== p.pdf_brochure_url) {
        say(`  ${p.reference_fournisseur.slice(0, 20)} ${name}: brochure ${keep ? "-> " + keep.slice(0, 70) : "retirée"} (était ${p.pdf_brochure_url.slice(0, 70)}${parts.length > 1 ? ", " + parts.length + " URLs" : ""})`);
        if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { pdf_brochure_url: keep, updated_at: now() } });
      }
    }
    for (const m of p.product_media) {
      if (await check(m.url)) continue;
      say(`  ${p.reference_fournisseur.slice(0, 20)} ${name}: média pdf retiré (${m.url.slice(0, 70)})`);
      if (APPLY) await prisma.product_media.delete({ where: { id: m.id } });
    }
  }
  for (const slug of CLEAR_PARTNER_PDF) {
    const partner = await prisma.partners.findUnique({ where: { slug } });
    if (!partner || !partner.default_pdf_url) continue;
    if (await check(partner.default_pdf_url)) { say(`  [KEEP] partenaire ${slug}: brochure accessible`); continue; }
    say(`  partenaire ${slug}: brochure par défaut retirée (${partner.default_pdf_url})`);
    if (APPLY) await prisma.partners.update({ where: { id: partner.id }, data: { default_pdf_url: null, updated_at: now() } });
  }

  for (const [ref, url] of Object.entries(SET_BROCHURE)) {
    const p = await product(ref);
    if (!p || p.pdf_brochure_url) continue;
    if (!(await check(url))) { say(`  [NOT A PDF] ${ref} ${url}`); continue; }
    say(`  ${ref}: brochure -> ${url}`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { pdf_brochure_url: url, updated_at: now() } });
  }

  const activeAfter = await prisma.products.count({ where: { status: "active" } });
  say(`\n  produits actifs: ${activeBefore} -> ${activeAfter}`);
  say(`\n${APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply"}`);

  const out = path.join(__dirname, `58-client-feedback-2026-09-14.${APPLY ? "apply" : "dry-run"}.log`);
  fs.writeFileSync(out, log.join("\n") + "\n");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
