const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- PUKANG rows left as they were by script 85 but filed or named
 * wrongly (found while checking them against the 2026 catalogue):
 *   - cupboards G-9 / G-18 / G-19 were in Tables médicales -> Armoires et rangement;
 *   - trolley F-20 was in Tables médicales -> Chariots;
 *   - IV poles R-1 / R-2 / R-3 were in Armoires / Literie -> Accessoires de lit
 *     (with R-4 / R-5 / R-6 from script 85);
 *   - French names: model code added to the G cupboards, E-4 is a connecting
 *     stretcher for the operating room (not « pliable »), A-5 is a 3-function
 *     manual bed (was « Mobilier Médical PUKANG A-5 »).
 *
 * REVERT POINT: `before` values are the state on 2026-11-15; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 88-pukang-classement.js <app>:/tmp/88.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/88.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/88.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/88.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;

// id -> { cat: [beforeSlug, afterSlug], fr?: [before, after], en?: [before, after] }
const ROWS = {
  "ba7732b1-4db0-4bfc-8732-d30070302c0e": { cat: ["tables-medicales", "armoires-et-rangement"],
    fr: ["Armoire Médicale en Acier", "Armoire médicale en acier inoxydable G-9"] },
  "34e454ea-1227-44d5-bd69-ed10f3c02957": { cat: ["tables-medicales", "armoires-et-rangement"],
    fr: ["Armoire de Rangement Médicale", "Armoire de rangement médicale G-18"] },
  "2ca231ba-3acf-4a00-9695-599b0b777409": { cat: ["tables-medicales", "armoires-et-rangement"],
    fr: ["Armoire à Instruments en Acier Inoxydable", "Armoire à instruments en acier inoxydable G-19"] },
  "e84aba0c-cfc3-465f-97e7-f906fc71355b": {
    fr: ["Armoire de Stockage Hospitalière", "Armoire de stockage hospitalière G-20"] },
  "73642b7d-17de-45f9-9722-ad964e822409": { cat: ["tables-medicales", "chariots"] },
  "66cb77d7-c1e2-40b0-b6a8-258deadc3b59": { cat: ["armoires-et-rangement", "pukang-accessoires-lit"] },
  "9394c1a5-5ce3-4052-8feb-8ab6820d9175": { cat: ["armoires-et-rangement", "pukang-accessoires-lit"] },
  "c07f4990-f8b9-490b-8ac7-df7512703b05": { cat: ["literie-hospitaliere", "pukang-accessoires-lit"] },
  "51c63135-d016-4548-bf23-cf5f681a07e9": {
    fr: ["Brancard Pliable", "Brancard de transfert pour bloc opératoire E-4"],
    en: ["Medical Manual Connecting Stretcher for Operating Room", "E-4 manual connecting stretcher for the operating room"] },
  "c21ba929-85ad-4bff-a0cd-357900ea3fd1": {
    fr: ["Mobilier Médical PUKANG A-5", "Lit d'hôpital manuel à trois fonctions A-5"],
    en: ["Three Function Manual Hospital Bed", "A-5 three-function manual hospital bed"] },
};
const pick = ([b, a]) => (REVERT ? b : a);

async function main() {
  for (const [id, r] of Object.entries(ROWS)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) { console.log(`  [MISSING] ${id}`); continue; }
    if (r.cat) {
      const cat = await prisma.categories.findUnique({ where: { slug: pick(r.cat) } });
      if (p.category_id !== cat.id) {
        console.log(`  ${p.reference_fournisseur} -> ${pick(r.cat)}`);
        if (WRITE) await prisma.products.update({ where: { id }, data: { category_id: cat.id, updated_at: new Date() } });
      }
    }
    for (const lang of ["fr", "en"]) {
      if (!r[lang]) continue;
      const tr = await prisma.product_translations.findUnique({ where: { product_id_language_code: { product_id: id, language_code: lang } } });
      if (tr.nom === pick(r[lang])) continue;
      console.log(`  ${p.reference_fournisseur} ${lang} « ${tr.nom} » -> « ${pick(r[lang])} »`);
      if (WRITE) await prisma.product_translations.update({ where: { id: tr.id }, data: { nom: pick(r[lang]) } });
    }
  }
  console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
