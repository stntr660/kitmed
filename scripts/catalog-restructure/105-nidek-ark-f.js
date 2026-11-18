const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- new NIDEK model in Ophtalmologie > Appareillage ophtalmique >
 * « Autoréfracto-kératomètre » (slug auto-refractometres): the fully automatic
 * auto-réfracto-kératomètre ARK-F, next to the ARK-1s / AR-1 / Tonoref III already there.
 *
 * Source: NIDEK SA brochure « ARK-F / AR-F » (SA-MKT-DOC-84-V02, janvier 2022, FR, 6 p.).
 * Only the ARK-F (with keratometry) is created; the AR-F (refraction only) is mentioned in
 * the brochure but is not a separate product here.
 *   photo    : cover product photo extracted from the PDF (1251x1719 embedded image), white
 *              background cleaned, trimmed and centred on a 1400x1400 white canvas
 *              -> /uploads/products/nidek-ark-f.jpg
 *   brochure : the PDF as-is -> /uploads/pdfs/nidek-ark-f-brochure.pdf
 *   partner  : NIDEK (existing, 3b9ab70b-…), constructeur « nidek »
 *
 * One product with a fixed id, so --revert just deletes it (nothing else is touched).
 * Dry-run by default; --apply; --revert.
 *   docker cp 105-nidek-ark-f.js <app>:/tmp/105.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/105.js [--apply|--revert]
 * The photo (products/) and the PDF (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const now = () => new Date();
const L = (...lines) => lines.join("\n");

const NIDEK = "3b9ab70b-80d7-4130-a4db-f1196ce8e1d1";
const CAT = "auto-refractometres";
const IMG = "/uploads/products/nidek-ark-f.jpg";
const PDF = "/uploads/pdfs/nidek-ark-f-brochure.pdf";

const P = {
  id: "d105a001-0000-4000-8000-000000000001", slug: "nidek-ark-f", ref: "ARK-F", sort: 2,
  fr: {
    nom: "Auto-Réfracto-Kératomètre ARK-F",
    description: "Auto-réfracto-kératomètre NIDEK entièrement automatisé : dès que le patient pose le visage sur la mentonnière, une caméra grand-angle détecte les yeux, règle la mentonnière, aligne l'appareil (tracking 3D), déclenche la mesure puis passe seul au deuxième œil, avec un guidage vocal tout au long de l'examen. Réfraction sur une aire pupillaire large (ø 1 à 6 mm) et centrale (ø 1 à 3,5 mm) mesurées simultanément, dès 2 mm de pupille, avec technologie SLD / CCD, mode cataracte automatique et brouillage tenant compte de l'astigmatisme. Kératométrie par double mire annulaire de Placido, moins sensible à la paupière supérieure. Mesure de l'amplitude d'accommodation, du diamètre pupillaire et cornéen, image de rétro-illumination avec indices NIDEK de cataracte (COI-H, COI-A, POI). Écran tactile couleur 7 pouces inclinable et pivotant, permettant d'installer l'appareil contre un mur ou dans un coin ; imprimante thermique intégrée, LAN, USB et Wi-Fi. Manette de contrôle filaire ou Bluetooth en option.",
    fiche_technique: L(
      "Fabricant : NIDEK CO., LTD. (Japon) ; dispositif médical de classe IIa, CE0344",
      "Réfraction - sphère : -30,00 à +25,00 D (DVO = 12 mm), pas de 0,01 / 0,12 / 0,25 D",
      "Réfraction - cylindre : 0 à 12,00 D, pas de 0,01 / 0,12 / 0,25 D",
      "Réfraction - axe : 0 à 180°, pas de 1° / 5°",
      "Diamètre pupillaire minimum : ø 2 mm ; aire de mesure : ø 1 à 6 mm",
      "Kératométrie - rayon de courbure : 5 à 13 mm, pas de 0,01 mm",
      "Kératométrie - puissance réfractive : 25,96 à 67,50 D, pas de 0,01 / 0,12 / 0,25 D",
      "Kératométrie - astigmatisme : 0 à ±12 D, pas de 0,12 / 0,25 D ; axe 0 à 180°",
      "Kératométrie - aire de mesure : ø 3,3 mm (R = 7,7 mm), ø 2,4 mm (R = 7,8 mm)",
      "Accommodation : 0 à 10,00 D, pas de 0,01 / 0,12 / 0,25 D",
      "Diamètre pupillaire : automatique, 1,0 à 10,0 mm ; diamètre cornéen : automatique, 1,0 à 14,0 mm",
      "Écart pupillaire : 30 à 85 mm, pas de 1 mm",
      "Image de rétro-illumination : oui (indices de cataracte COI-H, COI-A, POI)",
      "Déclenchement de la mesure : automatique ; tracking 3D (XYZ) ; passage automatique d'un œil à l'autre",
      "Écran : LCD couleur tactile 7 pouces, inclinable et pivotant",
      "Imprimante : thermique intégrée, découpe automatique",
      "Connectique : RS-232C x 2, LAN x 1, USB x 2, Wi-Fi (WLAN)",
      "Alimentation : 100 à 240 V CA, 50/60 Hz ; consommation 100 VA",
      "Dimensions / poids : 305 (L) x 492 (P) x 488 (H) mm / 20 kg",
      "Accessoires standards : rouleau d'impression, câble secteur, housse, œil test, papier et picots de mentonnière",
      "Accessoires en option : câble RS-232C, câble RJ45, manette de contrôle (filaire ou Bluetooth)"),
  },
  en: {
    nom: "ARK-F Auto Ref-Keratometer",
    description: "Fully automated NIDEK auto ref-keratometer: as soon as the patient's face is on the chinrest, a wide-angle camera detects the eyes, adjusts the chinrest, aligns the unit (3D tracking), starts the measurement and moves on to the second eye by itself, with voice guidance throughout the exam. Refraction over a wide (ø1 to 6 mm) and a central (ø1 to 3.5 mm) pupil area measured simultaneously, from a 2 mm pupil, with SLD / CCD technology, automatic cataract mode and astigmatism-aware fogging. Keratometry with a double Placido ring mire, less affected by the upper eyelid. Accommodation amplitude, pupil and corneal diameter measurement, retro-illumination image with NIDEK cataract indices (COI-H, COI-A, POI). Tiltable and swivelling 7-inch colour touch screen, so the unit fits against a wall or in a corner; built-in thermal printer, LAN, USB and Wi-Fi. Optional wired or Bluetooth control pad.",
    fiche_technique: L(
      "Manufacturer: NIDEK CO., LTD. (Japan); class IIa medical device, CE0344",
      "Refraction - sphere: -30.00 to +25.00 D (VD = 12 mm), 0.01 / 0.12 / 0.25 D steps",
      "Refraction - cylinder: 0 to 12.00 D, 0.01 / 0.12 / 0.25 D steps",
      "Refraction - axis: 0 to 180°, 1° / 5° steps",
      "Minimum pupil diameter: ø2 mm; measurement area: ø1 to 6 mm",
      "Keratometry - radius of curvature: 5 to 13 mm, 0.01 mm steps",
      "Keratometry - refractive power: 25.96 to 67.50 D, 0.01 / 0.12 / 0.25 D steps",
      "Keratometry - astigmatism: 0 to ±12 D, 0.12 / 0.25 D steps; axis 0 to 180°",
      "Keratometry - measurement area: ø3.3 mm (R = 7.7 mm), ø2.4 mm (R = 7.8 mm)",
      "Accommodation: 0 to 10.00 D, 0.01 / 0.12 / 0.25 D steps",
      "Pupil diameter: automatic, 1.0 to 10.0 mm; corneal diameter: automatic, 1.0 to 14.0 mm",
      "Pupillary distance: 30 to 85 mm, 1 mm steps",
      "Retro-illumination image: yes (cataract indices COI-H, COI-A, POI)",
      "Measurement start: automatic; 3D (XYZ) tracking; automatic move from one eye to the other",
      "Display: tiltable and swivelling 7-inch colour LCD touch screen",
      "Printer: built-in thermal printer, auto cutter",
      "Interfaces: RS-232C x 2, LAN x 1, USB x 2, wireless LAN (WLAN)",
      "Power supply: 100 to 240 V AC, 50/60 Hz; power consumption 100 VA",
      "Dimensions / mass: 305 (W) x 492 (D) x 488 (H) mm / 20 kg",
      "Standard accessories: printer paper roll, power cord, dust cover, model eye, chinrest paper and pins",
      "Optional accessories: RS-232C cable, RJ45 cable, control pad (wired or Bluetooth)"),
  },
};

const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const TXT = ["nom", "description", "fiche_technique"];

async function apply() {
  for (const f of [IMG, PDF]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);
  const cat = await prisma.categories.findFirst({ where: { slug: CAT } });
  if (!cat) throw new Error(`category ${CAT} not found`);
  if (!(await prisma.partners.findUnique({ where: { id: NIDEK } }))) throw new Error("partner NIDEK not found");
  const dup = await prisma.products.findFirst({ where: { id: { not: P.id }, OR: [{ reference_fournisseur: P.ref }, { slug: P.slug }] } });
  if (dup) { console.log(`  [DUPLICATE] ${P.slug} [${P.ref}] already used by ${dup.slug} -- skipped`); return; }

  const media = { id: `${P.id}-m105`, type: "image", url: IMG, alt_text: P.fr.nom, title: P.fr.nom, sort_order: 0, is_primary: true };
  const row = await prisma.products.findUnique({ where: { id: P.id }, include: { product_translations: true, product_media: true } });
  if (!row) {
    console.log(`  + product ${P.slug} [${P.ref}] -> ${CAT} « ${P.fr.nom} »`);
    if (WRITE) await prisma.products.create({ data: {
      id: P.id, reference_fournisseur: P.ref, slug: P.slug, category_id: cat.id, constructeur: "nidek", partner_id: NIDEK,
      status: "active", sort_order: P.sort, pdf_brochure_url: PDF, updated_at: now(),
      product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${P.id}-${lang}`, language_code: lang, ...P[lang] })) },
      product_media: { create: [media] } } });
    return;
  }
  const data = {};
  for (const [k, v] of [["category_id", cat.id], ["status", "active"], ["sort_order", P.sort], ["pdf_brochure_url", PDF],
    ["reference_fournisseur", P.ref], ["constructeur", "nidek"], ["partner_id", NIDEK], ["slug", P.slug]]) if (row[k] !== v) data[k] = v;
  const tr = ["fr", "en"].filter((lang) => { const t = row.product_translations.find((x) => x.language_code === lang); return !t || TXT.some((k) => !same(t[k], P[lang][k])); });
  const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary;
  if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${P.slug}`); return; }
  console.log(`  product ${P.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : " photo"}`);
  if (!WRITE) return;
  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) await tx.products.update({ where: { id: P.id }, data: { ...data, updated_at: now() } });
    for (const lang of tr) await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: P.id, language_code: lang } },
      update: P[lang], create: { id: `${P.id}-${lang}`, product_id: P.id, language_code: lang, ...P[lang] } });
    if (!mediaOk) { await tx.product_media.deleteMany({ where: { product_id: P.id } }); await tx.product_media.create({ data: { ...media, product_id: P.id } }); }
  });
}

async function revert() {
  const n = await prisma.products.deleteMany({ where: { id: P.id } });
  console.log(`  - deleted ${n.count} product (${P.slug})`);
}

(REVERT ? revert() : apply())
  .then(async () => { console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
