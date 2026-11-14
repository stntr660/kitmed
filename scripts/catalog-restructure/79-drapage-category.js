const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-14 -- homepage mockup (« Nos domaines d'expertise ») has a « Drapage »
 * tile; no such category existed. Creates the root category:
 *   slug drapage, FR « Drapage », EN « Surgical drapes », type discipline, active,
 *   placed after the existing roots (sort_order = max + 1).
 * It has no products yet, so the public categories API (which hides empty
 * categories) does not list it in the menus until products are added; the
 * homepage tile links to /products/categories/drapage.
 *
 * REVERT: --revert deletes the category, only if it still has no products and
 * no child categories.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 79-drapage-category.js <app>:/tmp/79.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/79.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/79.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/79.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;

const CAT = { id: "c79a0001-0000-4000-8000-000000000001", slug: "drapage", fr: "Drapage", en: "Surgical drapes" };

async function apply() {
  const existing = await prisma.categories.findUnique({ where: { slug: CAT.slug } });
  if (existing) {
    console.log(`  [SKIP] ${CAT.slug} exists (id ${existing.id}, active ${existing.is_active})`);
    return;
  }
  const last = await prisma.categories.aggregate({ where: { parent_id: null }, _max: { sort_order: true } });
  const sort = (last._max.sort_order || 0) + 1;
  console.log(`  + create root ${CAT.slug} « ${CAT.fr} » / « ${CAT.en} » type discipline, sort_order ${sort}`);
  if (WRITE) await prisma.categories.create({ data: {
    id: CAT.id, slug: CAT.slug, name: CAT.fr, type: "discipline", is_active: true, parent_id: null,
    sort_order: sort, updated_at: new Date(),
    category_translations: { create: [
      { id: crypto.randomUUID(), language_code: "fr", name: CAT.fr },
      { id: crypto.randomUUID(), language_code: "en", name: CAT.en },
    ] },
  } });
}

async function revert() {
  const cat = await prisma.categories.findUnique({ where: { slug: CAT.slug } });
  if (!cat) { console.log(`  [SKIP] ${CAT.slug} does not exist`); return; }
  const products = await prisma.products.count({ where: { category_id: cat.id } });
  const children = await prisma.categories.count({ where: { parent_id: cat.id } });
  if (products || children) { console.log(`  [KEEP] ${CAT.slug} has ${products} products, ${children} children`); return; }
  console.log(`  - delete ${CAT.slug}`);
  await prisma.categories.delete({ where: { id: cat.id } });
}

(REVERT ? revert() : apply())
  .then(async () => { console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
