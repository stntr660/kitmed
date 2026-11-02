const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-19 -- ophthalmology category cards show a real product photo
 * instead of the AI-generated artwork, as the client listed them.
 *
 * Each new image is /uploads/categories/<slug>-photo.jpg: the product's own
 * photo, squared on white so the square card does not crop it. Scansys, the
 * 877PA IOL and Eyesi were cut out of their brochure page, Oculoplastie is the
 * FCI catalogue cover, Matériel de réfraction puts Tonoref III and RT-6100
 * side by side. Categories the client left blank are not touched. The five
 * homepage disciplines show three of their own products (no people in them).
 *
 * REVERT POINT: `before` is what each category showed on 2026-10-19 (the AI
 * artwork). Those files are kept, so --revert puts every card back exactly.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 62-category-product-photos.js <app>:/tmp/62.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/62.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/62.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/62.js --revert   # back to the AI artwork
 * The *-photo.jpg files are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const CATEGORIES = {
  "table-de-consultation":                             { before: "/uploads/categories/table-de-consultation.png", from: "Synetic" },
  "materiel-de-refraction":                            { before: "/uploads/categories/materiel-de-refraction.png", from: "Tonoref III + RT-6100" },
  "lampe-a-fente":                                     { before: "/uploads/categories/lampe-a-fente.png", from: "ELARA 900" },
  "segment-anterieur":                                 { before: "/uploads/categories/segment-anterieur.jpg", from: "OPD-Scan III" },
  "tonometres-pachymetres":                            { before: "/uploads/categories/tonometres-pachymetres.png", from: "NT-1P" },
  "microscopie-speculaire":                            { before: "/uploads/categories/microscopie-speculaire.png", from: "CEM-530" },
  "topographie":                                       { before: "/uploads/categories/topographie.png", from: "Scansys TA-517" },
  "verres-ophtalmoscope-et-skeepens":                  { before: "/uploads/categories/verres-ophtalmoscope-et-skeepens.png", from: "Verre 90D" },
  "lasers-et-ipl":                                     { before: "/uploads/categories/lasers-et-ipl.png", from: "GYC-500" },
  "traitement-et-diagnostique-secheresse-oculaire":    { before: "/uploads/categories/traitement-et-diagnostique-secheresse-oculaire.png", from: "Eye-Light" },
  "laser-yag-et-slt":                                  { before: "/uploads/categories/laser-yag-et-slt.png", from: "YC-200" },
  "laser-photocoagulateurs":                           { before: "/uploads/categories/laser-photocoagulateurs.png", from: "GYC-500" },
  "diagnostic-retine":                                 { before: "/uploads/categories/diagnostic-retine.png", from: "Mirante" },
  "oct-et-imagerie":                                   { before: "/uploads/categories/oct-et-imagerie.png", from: "RS-1" },
  "retinographes":                                     { before: "/uploads/categories/retinographes.jpg", from: "AFC-330" },
  "perimetres":                                        { before: "/uploads/categories/perimetres.jpg", from: "Octopus 900" },
  "angiographes":                                      { before: null, from: "Mirante" },
  "biometrie-contact-sans-contact-et-echographie":     { before: "/uploads/categories/biometrie-contact-sans-contact-et-echographie.png", from: "EYESTAR 900" },
  "microscope-operatoire":                             { before: "/uploads/categories/microscope-operatoire.png", from: "METIS 900" },
  "phaco":                                             { before: "/uploads/categories/phaco.png", from: "Cube CV-9000" },
  "consommable":                                       { before: "/uploads/categories/consommable.png", from: "IOL 877PA" },
  "oculoplastie-fci":                                  { before: "/uploads/categories/oculoplastie-fci.png", from: "catalogue FCI Oculoplastie" },
  "valves":                                            { before: "/uploads/categories/valves.png", from: "eyeWatch Rheon" },
  "simulateur":                                        { before: "/uploads/categories/simulateur.png", from: "Eyesi (Haag-Streit)" },
  // homepage discipline cards (added the same day): three real products each
  "ophtalmologie":                                     { before: "/uploads/categories/ophtalmologie.png", from: "ELARA 900 + Tonoref III + RS-1" },
  "orl-oto-rhino-laryngologie":                        { before: "/uploads/categories/orl-oto-rhino-laryngologie.png", from: "stroboscopie + lampe frontale + tympanomètre" },
  "mobilier-et-literie-hospitaliers":                  { before: "/uploads/categories/mobilier-et-literie-hospitaliers.png", from: "chariot F-50 + fauteuil roulant + déambulateur" },
  "orthopedics":                                       { before: "/uploads/categories/orthopedics.png", from: "genouillère + chevillière + ceinture" },
  "dispositifs-medicaux":                              { before: "/uploads/categories/oph-pharmaceutics.png", from: "ISOMAR + HYLO DUAL + HYLO COMOD" },
};

async function main() {
  for (const [slug, { before, from }] of Object.entries(CATEGORIES)) {
    const target = REVERT ? before : `/uploads/categories/${slug}-photo.jpg`;
    if (target && !fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) {
      console.log(`  [MISSING FILE] ${slug} ${target}`);
      continue;
    }
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (cat.image_url === target) { console.log(`  [SKIP] ${slug}`); continue; }
    console.log(`  ${slug.padEnd(48)} ${cat.image_url || "(aucune)"} -> ${target || "(aucune)"}${REVERT ? "" : `  (${from})`}`);
    if (APPLY || REVERT) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }
  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
