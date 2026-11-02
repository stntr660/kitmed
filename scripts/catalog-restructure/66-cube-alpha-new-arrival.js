const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-29 -- NIDEK Cube α is back as a new range (« nouvelle gamme »).
 *
 * A) Adds products.is_new_arrival (BOOLEAN, default false): drives the
 *    « Nouvel arrivage » badge and the homepage carousel. Must run BEFORE the
 *    code that reads it is deployed. Idempotent (ADD COLUMN IF NOT EXISTS).
 * B) Reactivates the Cube α archived by script 64 (Phaco now shows Sophi AND
 *    the Cube), flags it as a new arrival, rewrites its FR/EN name,
 *    description and fiche technique from the NIDEK brochure (CV-9000 and
 *    CV-9000R), and swaps its primary photo for the clean cut-out
 *    (old one had the "Cube α CV-9000" caption burnt in).
 *    The English 2026 brochure already on the volume is kept.
 *
 * REVERT POINT: `before` is each value on 2026-10-29; --revert puts it back.
 * The column itself is left in place on --revert (the code reads it).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 66-cube-alpha-new-arrival.js <app>:/tmp/66.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --revert
 * nidek-cube-alpha.jpg (= categories/phaco-photo-clean.jpg) is copied to
 * uploads/products/ on the volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const SLUG = "nidek-cube-alpha-cv-9000-cv-9000";

const PRODUCT = {
  status:         { before: "archived", after: "active" },
  is_new_arrival: { before: false,      after: true },
};

const IMAGE = {
  before: "/uploads/products/cv9000-1776181629792-006f6075.jpg",
  after:  "/uploads/products/nidek-cube-alpha.jpg",
};

const TRANSLATIONS = {
  fr: {
    before: {
      nom: "Nidek Cube Alpha CV-9000",
      description: "Systeme de phacoemulsification Nidek Cube Alpha CV-9000. Plateforme chirurgicale integree pour la chirurgie de la cataracte.",
      fiche_technique: null,
    },
    after: {
      nom: "NIDEK Cube α CV-9000 / CV-9000R",
      description:
        "Système chirurgical ophtalmique pour la chirurgie de la cataracte, compact et complet. " +
        "Le Cube α intègre la technologie de torsion Gyro : l'oscillation ultrasonore torsionnelle délivre l'énergie efficacement, " +
        "en particulier sur les cataractes modérées, tout en protégeant les tissus intraoculaires. " +
        "La console, légère, se détache de son support pour faciliter le transport. " +
        "Chambre antérieure stable grâce aux sondes Neo et MicroNeo, redémarrage automatique du flux et des ultrasons après une occlusion, " +
        "mode ProPedal, pédale multifonction à six commutateurs et écran tactile avec mode Navi. " +
        "Deux modèles : CV-9000 avec cassette à usage unique, CV-9000R avec tubulure réutilisable stérilisable en autoclave.",
      fiche_technique: [
        "Application : chirurgie de la cataracte",
        "Pompe : péristaltique",
        "Pression d'aspiration : CV-9000 0 à 700 mmHg (mode I/A), 0 à 650 mmHg (modes US et Vit) ; CV-9000R 0 à 650 mmHg",
        "Débit : 0 à 60 ml/min",
        "Tubulure : CV-9000 cassette à usage unique ; CV-9000R tubulure réutilisable (autoclave, jusqu'à 10 fois)",
        "Ultrasons : transducteur piézoélectrique ; pièce à main Gyro 42,5 kHz (longitudinal) et 30,2 kHz (torsionnel) ; pièce à main US 40 kHz",
        "Modes d'oscillation : Gyro longitudinal, longitudinal (VIS), torsionnel, longitudinal/torsionnel, torsionnel/longitudinal ; US longitudinal, longitudinal (VIS)",
        "Diathermie : 515 kHz, 0,5 à 10 W (5 à 100 %)",
        "Vitréotome : guillotine pneumatique, 100 à 1 000 cpm, compresseur interne",
        "Alimentation : 100 à 230 V CA, 50/60 Hz ; consommation 240 VA",
        "Dimensions / poids : 337 (L) x 452 (P) x 307 (H) mm ; CV-9000 18 kg, CV-9000R 17 kg",
        "Option : support à mât motorisé, 115/230 V CA, 300 VA, 433 x 567 x 1 067 mm, 38 kg",
        "Accessoires : sondes silicone Neo (2,8 mm) et MicroNeo (2,4 mm), pointes Gyro 21G, pointes US standard 20G et 21G (15° ou 30°), pointes I/A droites ou courbes",
      ].join("\n"),
    },
  },
  en: {
    before: {
      nom: "Nidek Cube Alpha CV-9000",
      description: "Nidek Cube Alpha CV-9000 phacoemulsification system. Integrated surgical platform for cataract surgery.",
      fiche_technique: null,
    },
    after: {
      nom: "NIDEK Cube α CV-9000 / CV-9000R",
      description:
        "Compact, comprehensive ophthalmic surgical system for cataract surgery. " +
        "The Cube α incorporates Gyro torsional technology: torsional ultrasound oscillation delivers energy efficiently, " +
        "especially for moderate cataracts, while protecting intraocular tissues. " +
        "The lightweight console detaches from its stand for easy transport. " +
        "Stable anterior chamber with Neo and MicroNeo sleeves, automatic flow and ultrasound restart after occlusion, " +
        "ProPedal mode, multifunction footswitch with six switches and touch screen with Navi mode. " +
        "Two models: CV-9000 with single-use cassette, CV-9000R with autoclavable reusable tubing.",
      fiche_technique: [
        "Application: cataract surgery",
        "Pump: peristaltic",
        "Aspiration pressure: CV-9000 0 to 700 mmHg (I/A mode), 0 to 650 mmHg (US and Vit modes); CV-9000R 0 to 650 mmHg",
        "Flow rate: 0 to 60 ml/min",
        "Tubing: CV-9000 single-use cassette; CV-9000R reusable tubing (autoclavable up to 10 times)",
        "Ultrasound: piezoelectric transducer; Gyro handpiece 42.5 kHz (longitudinal) and 30.2 kHz (torsional); US handpiece 40 kHz",
        "Oscillation modes: Gyro longitudinal, longitudinal (VIS), torsional, longitudinal/torsional, torsional/longitudinal; US longitudinal, longitudinal (VIS)",
        "Diathermy: 515 kHz, 0.5 to 10 W (5 to 100%)",
        "Vitreous cutter: pneumatic guillotine, 100 to 1,000 cpm, internal compressor",
        "Power supply: 100 to 230 VAC, 50/60 Hz; power consumption 240 VA",
        "Dimensions / weight: 337 (W) x 452 (D) x 307 (H) mm; CV-9000 18 kg, CV-9000R 17 kg",
        "Option: motorized pole stand, 115/230 VAC, 300 VA, 433 x 567 x 1,067 mm, 38 kg",
        "Accessories: Neo (2.8 mm) and MicroNeo (2.4 mm) silicone sleeves, Gyro 21G tips, standard US tips 20G and 21G (15° or 30°), straight or curved I/A tips",
      ].join("\n"),
    },
  },
};

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");

  // A) column
  const col = await prisma.$queryRawUnsafe(
    "SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_new_arrival'"
  );
  if (col.length) {
    console.log("  [SKIP] column products.is_new_arrival exists");
  } else {
    console.log("  column products.is_new_arrival -> ADD (BOOLEAN NOT NULL DEFAULT false)");
    if (APPLY) await prisma.$executeRawUnsafe("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN NOT NULL DEFAULT false");
    else if (!REVERT) console.log("  (dry-run stops here: the product update needs the column)");
  }
  if (!col.length && !APPLY) return;

  // B) product
  const rows = await prisma.$queryRawUnsafe("SELECT id, status, is_new_arrival FROM products WHERE slug = $1", SLUG);
  const row = rows[0];
  if (!row) { console.log(`  [MISSING PRODUCT] ${SLUG}`); return; }

  const data = {};
  for (const [field, { before, after }] of Object.entries(PRODUCT)) {
    const target = REVERT ? before : after;
    if (row[field] === target) { console.log(`  [SKIP] ${field}`); continue; }
    console.log(`  ${field.padEnd(16)} ${row[field]} -> ${target}`);
    data[field] = target;
  }
  if ((APPLY || REVERT) && Object.keys(data).length) {
    // raw SQL so it also works with the Prisma client built before the column existed
    if ("status" in data) await prisma.$executeRawUnsafe("UPDATE products SET status = $1, updated_at = now() WHERE id = $2", data.status, row.id);
    if ("is_new_arrival" in data) await prisma.$executeRawUnsafe("UPDATE products SET is_new_arrival = $1, updated_at = now() WHERE id = $2", data.is_new_arrival, row.id);
  }

  // primary image
  const media = await prisma.product_media.findFirst({ where: { product_id: row.id, is_primary: true, type: "image" } });
  const imgTarget = REVERT ? IMAGE.before : IMAGE.after;
  if (!media) console.log("  [MISSING] primary image");
  else if (media.url === imgTarget) console.log("  [SKIP] primary image");
  else {
    console.log(`  image ${media.url} -> ${imgTarget}`);
    if (APPLY || REVERT) await prisma.product_media.update({ where: { id: media.id }, data: { url: imgTarget, alt_text: REVERT ? null : "NIDEK Cube α" } });
  }

  // translations
  for (const [lang, { before, after }] of Object.entries(TRANSLATIONS)) {
    const target = REVERT ? before : after;
    const tr = await prisma.product_translations.findFirst({ where: { product_id: row.id, language_code: lang } });
    if (!tr) { console.log(`  [MISSING] translation ${lang}`); continue; }
    const changed = ["nom", "description", "fiche_technique"].filter(k => (tr[k] ?? null) !== target[k]);
    if (!changed.length) { console.log(`  [SKIP] translation ${lang}`); continue; }
    console.log(`  translation ${lang}: ${changed.join(", ")} -> ${target.nom}`);
    if (APPLY || REVERT) await prisma.product_translations.update({ where: { id: tr.id }, data: target });
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
