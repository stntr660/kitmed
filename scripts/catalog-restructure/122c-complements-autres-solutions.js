const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-20 -- owner: the « Compléments et solutions » sub-category is renamed « Compléments et autres
 * solutions » (EN « Supplements and other solutions »), and the POSIFORLID spray 15 ml moves to « Collyres ».
 * The slug (complements-et-solutions) is kept. --revert restores the names and the category.
 *
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/122c.js [--apply|--revert]
 */
const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const COMPLEMENTS = "d119c001-0000-4000-8000-000000000002";
const COLLYRES = "d119c001-0000-4000-8000-000000000001";
const SPRAY = "d122p001-0000-4000-8000-000000000002";
const NAMES = {
  before: { fr: "Compléments et solutions", en: "Supplements and solutions" },
  after: { fr: "Compléments et autres solutions", en: "Supplements and other solutions" },
};

(async () => {
  const n = REVERT ? NAMES.before : NAMES.after;
  const cat = REVERT ? COMPLEMENTS : COLLYRES;
  console.log(`category ${COMPLEMENTS} -> « ${n.fr} » / « ${n.en} »; POSIFORLID spray -> ${REVERT ? "Compléments" : "Collyres"}`);
  if (!APPLY && !REVERT) return console.log("dry-run: nothing written (use --apply)");
  await prisma.categories.update({ where: { id: COMPLEMENTS }, data: { name: n.fr, updated_at: new Date() } });
  for (const lang of ["fr", "en"])
    await prisma.category_translations.update({ where: { id: `${COMPLEMENTS}-${lang}` }, data: { name: n[lang] } });
  await prisma.products.update({ where: { id: SPRAY }, data: { category_id: cat, updated_at: new Date() } });
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
