const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-14 -- one-line descriptions under the 3 Ophtalmologie pillar cards
 * (client mockup « trio ophtalmique avec instrumentation »). Sets
 * category_translations.description (FR + EN) only.
 *
 * REVERT POINT: BEFORE below is the exact description of each touched
 * translation row on staging on 2026-11-14 (read by the dry-run).
 * null = the row had no description. --revert writes these values back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 77-pillar-descriptions.js <app>:/tmp/77.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/77.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/77.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/77.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;

const DESCRIPTIONS = {
  "appareillage-ophtalmique": {
    fr: "Équipements de diagnostic, de consultation et de chirurgie ophtalmologique.",
    en: "Diagnostic, examination and surgical ophthalmic equipment.",
  },
  "consommable": {
    fr: "Implants intraoculaires, viscoélastiques et consommables de chirurgie.",
    en: "Intraocular lenses, viscoelastics and surgical consumables.",
  },
  "instrumentation": {
    fr: "Instruments de précision pour la chirurgie ophtalmique.",
    en: "Precision instruments for ophthalmic surgery.",
  },
};

// Recorded from the staging dry-run on 2026-11-14.
const BEFORE = {
  "appareillage-ophtalmique": { fr: null, en: null },
  "consommable": { fr: null, en: null },
  "instrumentation": { fr: "Instruments chirurgicaux ophtalmiques", en: "Ophthalmic surgical instruments" },
};

async function run() {
  const target = REVERT ? BEFORE : DESCRIPTIONS;
  for (const [slug, langs] of Object.entries(target)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    for (const lang of ["fr", "en"]) {
      const value = langs[lang];
      const row = await prisma.category_translations.findUnique({
        where: { category_id_language_code: { category_id: cat.id, language_code: lang } } });
      if ((row?.description ?? null) === value) { console.log(`  [SKIP] ${slug} ${lang}`); continue; }
      console.log(`  ${slug} ${lang}: ${JSON.stringify(row?.description ?? null)} -> ${JSON.stringify(value)}`);
      if (!WRITE) continue;
      if (row) {
        await prisma.category_translations.update({ where: { id: row.id }, data: { description: value } });
      } else if (value !== null) {
        await prisma.category_translations.create({ data: {
          id: crypto.randomUUID(), category_id: cat.id, language_code: lang, name: cat.name, description: value } });
      }
    }
  }
}

run()
  .then(async () => { console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
