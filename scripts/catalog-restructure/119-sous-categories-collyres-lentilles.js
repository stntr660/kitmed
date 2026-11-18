const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: add sub-categories « Collyres » under Dispositifs médicaux and
 * « Lentilles de contact » under Contactologie.
 * A category with sub-categories only shows its sub-category tiles (products sitting on the parent
 * are no longer listed), so every product of both parents is moved into a sub-category:
 *   - Collyres: the 5 HYLO eye drops;
 *   - Compléments et solutions (extra, so nothing disappears): Nutri-FOV, ISOMAX saline;
 *   - Lentilles de contact: the 4 ACUVUE lenses.
 * Tile images: /uploads/categories/q119-*.jpg (copied into the staging uploads volume first).
 * REVERT: --revert moves the products back to their parent and deletes the 3 sub-categories.
 *
 *   docker cp 119-sous-categories-collyres-lentilles.js <app>:/tmp/119.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/119.js [--apply|--revert]
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const now = () => new Date();

const SUBS = [
  { id: "d119c001-0000-4000-8000-000000000001", parent: "dispositifs-medicaux", slug: "collyres", sort: 1,
    fr: "Collyres", en: "Eye drops",
    dfr: "Collyres et gouttes oculaires lubrifiantes", den: "Lubricating eye drops",
    image: "/uploads/categories/q119-collyres.jpg",
    products: ["hylo-care", "hylo-comod", "hylo-dual-intense", "hylo-fresh", "hylo-gel"] },
  { id: "d119c001-0000-4000-8000-000000000002", parent: "dispositifs-medicaux", slug: "complements-et-solutions", sort: 2,
    fr: "Compléments et solutions", en: "Supplements and solutions",
    dfr: "Compléments alimentaires et solutions physiologiques", den: "Food supplements and saline solutions",
    image: "/uploads/categories/q119-complements-solutions.jpg",
    products: ["supplement-lutein-omega-3-vitamins-for-retinal-protection-and-combating-ocular-aging", "isomax-saline-solution"] },
  { id: "d119c001-0000-4000-8000-000000000003", parent: "oph-contactology", slug: "lentilles-de-contact", sort: 1,
    fr: "Lentilles de contact", en: "Contact lenses",
    dfr: "Lentilles de contact journalières et à renouvellement fréquent", den: "Daily and frequent-replacement contact lenses",
    image: "/uploads/categories/q119-lentilles-de-contact.jpg",
    products: ["1-day-acuvue-moist", "1-day-acuvue-moist-for-astigmatism", "acuvue-oasys-hydraclear-plus", "acuvue-oasys-for-astigmatism"] },
];

async function main() {
  for (const s of SUBS) {
    const parent = await prisma.categories.findUnique({ where: { slug: s.parent } });
    if (REVERT) {
      await prisma.products.updateMany({ where: { slug: { in: s.products }, category_id: s.id }, data: { category_id: parent.id, updated_at: now() } });
      await prisma.categories.deleteMany({ where: { id: s.id } });
      console.log(`  reverted ${s.slug}`);
      continue;
    }
    const exists = await prisma.categories.findUnique({ where: { id: s.id } });
    console.log(`  ${exists ? "[SKIP] " : "+ "}category ${s.slug} under ${s.parent}, products: ${s.products.length}`);
    if (!APPLY) continue;
    if (!exists) await prisma.categories.create({ data: {
      id: s.id, slug: s.slug, name: s.fr, description: s.dfr, parent_id: parent.id, sort_order: s.sort,
      is_active: true, type: "equipment", image_url: s.image, updated_at: now(),
      category_translations: { create: [
        { id: `${s.id}-fr`, language_code: "fr", name: s.fr, description: s.dfr },
        { id: `${s.id}-en`, language_code: "en", name: s.en, description: s.den }] } } });
    const r = await prisma.products.updateMany({ where: { slug: { in: s.products } }, data: { category_id: s.id, updated_at: now() } });
    console.log(`    moved ${r.count} products`);
  }
  if (!APPLY && !REVERT) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
