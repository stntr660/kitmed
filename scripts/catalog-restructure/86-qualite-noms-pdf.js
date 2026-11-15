const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- quality pass after the Lot D catalogue scripts (80-85).
 * Audit of the 1 276 active products: FR/EN names, descriptions and images are
 * complete. This script fixes what the audit found:
 *   A) French names still in English (Nitrocare HB 1310 / EVA JMM 04, Inophta
 *      Nutri-FOV, Stylus handle, Phantom);
 *   B) same French name on two products: MORIA single-use items get
 *      « (usage unique) », the EYESTAR 900 row in Biométrie says « biomètre »;
 *   C) placeholder reference « - » on the Haag-Streit IM 600 / IM 910 modules;
 *   D) Synetic unit without partner -> NIDEK;
 *   E) the 94 PRIM products had no PDF -> PRIM catalogue (file copied first:
 *      /uploads/pdfs/prim-catalogue-orthopedie.pdf), also the partner default.
 *
 * REVERT POINT: every `before` below is the value on 2026-11-15; --revert puts
 * them back (PRIM pdf back to null).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 86-qualite-noms-pdf.js <app>:/tmp/86.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/86.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/86.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/86.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const PRIM_PDF = "/uploads/pdfs/prim-catalogue-orthopedie.pdf";

// product id -> { lang: [before, after] }
const NAMES = {
  "nitro-1768234615862-fbkjvouje": {
    fr: ["NITRO HB 1310 Manuel Hydraulique Bed", "Lit hydraulique manuel NITRO HB 1310"] },
  "nitro-1768234616085-bnqhg4rfl": {
    fr: ["EVA JMM 04 Quatre Moteurs Gynaecological Chair", "Fauteuil gynécologique EVA JMM 04 à quatre moteurs"] },
  "b8c7c96f-4a07-4d0d-982a-feea0fbbc9f6": {
    fr: ["Supplement (Lutein, Omega-3, Vitamins) for retinal protection and combating ocular aging.",
         "Nutri-FOV — complément alimentaire (lutéine, oméga-3, vitamines) pour la protection de la rétine"],
    en: ["Supplement (Lutein, Omega-3, Vitamins) for Retinal Protection",
         "Nutri-FOV — dietary supplement (lutein, omega-3, vitamins) for retinal protection"] },
  "d82a0001-0000-4000-8000-000000000026": {
    fr: ["Manche pour lames « blade and tip » Stylus™", "Manche pour lames et embouts Stylus™"] },
  "31ad0ac7-21ab-4cdb-b365-f22ea1c7f990": {
    fr: ["Phantom - Open Field Refraction System", "Phantom — système de réfraction en champ ouvert"] },
  "d80a0001-0000-4000-8000-000000000018": {
    fr: ["Pince de Paufique", "Pince de Paufique (usage unique)"], en: ["Paufique forceps", "Paufique forceps (single use)"] },
  "d80a0001-0000-4000-8000-000000000035": {
    fr: ["Pince de Busin 23G", "Pince de Busin 23G (usage unique)"], en: ["Busin forceps 23G", "Busin forceps 23G (single use)"] },
  "d80a0001-0000-4000-8000-000000000046": {
    fr: ["Crochet de Price", "Crochet de Price (usage unique)"], en: ["Price hook", "Price hook (single use)"] },
  "721b3617-3772-4416-adc0-71ccbe4c6b62": {
    fr: ["EYESTAR 900 C-Suite — OCT Swept-Source Biométrie / Topographie (Cataract Suite)",
         "EYESTAR 900 C-Suite — biomètre optique OCT Swept-Source"],
    en: ["EYESTAR 900 C-Suite — Swept-Source OCT Biometry / Topography (Cataract Suite)",
         "EYESTAR 900 C-Suite — Swept-Source OCT optical biometer"] },
};
// product id -> { field: [before, after] }
const FIELDS = {
  "8a15bc84-3d62-45fa-bb42-754a32edcc9b": { reference_fournisseur: ["-", "HAAG-IM-600-IM-910"] },
  "509127fd-2898-4e84-a897-b596bbd59526": { partner_id: [null, "3b9ab70b-80d7-4130-a4db-f1196ce8e1d1"] }, // NIDEK
};
const PRIM_PARTNER = "f1731aed-ede2-4bf8-aa60-e071e4fc0404";

const pick = ([before, after]) => (REVERT ? before : after);

async function main() {
  for (const [id, langs] of Object.entries(NAMES)) {
    for (const [lang, pair] of Object.entries(langs)) {
      const row = await prisma.product_translations.findUnique({ where: { product_id_language_code: { product_id: id, language_code: lang } } });
      if (!row) { console.log(`  [MISSING] ${id} ${lang}`); continue; }
      if (row.nom === pick(pair)) { console.log(`  [SKIP] ${lang} ${row.nom}`); continue; }
      console.log(`  ${lang} « ${row.nom} » -> « ${pick(pair)} »`);
      if (WRITE) await prisma.product_translations.update({ where: { id: row.id }, data: { nom: pick(pair) } });
    }
  }
  for (const [id, fields] of Object.entries(FIELDS)) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) { console.log(`  [MISSING] ${id}`); continue; }
    const data = {};
    for (const [f, pair] of Object.entries(fields)) if (row[f] !== pick(pair)) data[f] = pick(pair);
    if (!Object.keys(data).length) { console.log(`  [SKIP] ${row.reference_fournisseur}`); continue; }
    console.log(`  ${row.reference_fournisseur} ${JSON.stringify(data)}`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { ...data, updated_at: new Date() } });
  }
  if (!REVERT && !fs.existsSync(path.join(UPLOADS, PRIM_PDF.replace(/^\/uploads\//, "")))) console.log(`  [MISSING FILE] ${PRIM_PDF}`);
  const primWhere = REVERT ? { partner_id: PRIM_PARTNER, pdf_brochure_url: PRIM_PDF }
    : { partner_id: PRIM_PARTNER, status: "active", pdf_brochure_url: null };
  const n = await prisma.products.count({ where: primWhere });
  console.log(`  PRIM products pdf ${REVERT ? "-> null" : "-> " + PRIM_PDF}: ${n}`);
  if (WRITE && n) await prisma.products.updateMany({ where: primWhere, data: { pdf_brochure_url: REVERT ? null : PRIM_PDF, updated_at: new Date() } });
  const partner = await prisma.partners.findUnique({ where: { id: PRIM_PARTNER } });
  const target = REVERT ? null : PRIM_PDF;
  if (partner.default_pdf_url !== target && (REVERT ? partner.default_pdf_url === PRIM_PDF : !partner.default_pdf_url)) {
    console.log(`  partner PRIM default_pdf_url ${partner.default_pdf_url} -> ${target}`);
    if (WRITE) await prisma.partners.update({ where: { id: PRIM_PARTNER }, data: { default_pdf_url: target, updated_at: new Date() } });
  } else console.log(`  [SKIP] partner PRIM (${partner.default_pdf_url})`);

  console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
