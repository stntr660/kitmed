const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Batch 2026-08-21 -- categories only, step 1/2.
 *
 * Create 5 grouping categories under the `ophtalmologie` discipline.
 * They hold no products of their own; step 2 reparents existing categories
 * under them.
 *
 * BLOC OPERATOIRE and CONSOMMABLE were dissolved by 50-flatten-hierarchy.js
 * in June. This recreates them at the client's request.
 *
 * Nothing is renamed and no product is touched.
 *
 * Run:
 *   node 51-create-parents.js          # dry-run
 *   node 51-create-parents.js --apply
 */

const APPLY = process.argv.includes("--apply");

const DISCIPLINE_SLUG = "ophtalmologie";

const PARENTS = [
  { slug: "lasers-et-ipl",     fr: "LASERS & IPL",      en: "Lasers & IPL" },
  { slug: "diagnostic-retine", fr: "DIAGNOSTIC RETINE", en: "Retina Diagnostics" },
  { slug: "segment-anterieur", fr: "SEGMENT ANTERIEUR", en: "Anterior Segment" },
  { slug: "bloc-operatoire",   fr: "BLOC OPERATOIRE",   en: "Operating Room" },
  { slug: "consommable",       fr: "CONSOMMABLE",       en: "Consumables" },
];

async function main() {
  console.log(`=== Create grouping parents (2026-08-21) ===`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const discipline = await prisma.categories.findUnique({
    where: { slug: DISCIPLINE_SLUG },
  });
  if (!discipline) throw new Error(`Discipline not found: ${DISCIPLINE_SLUG}`);
  console.log(`Parent discipline: ${discipline.name} (${discipline.id})\n`);

  const maxSort = await prisma.categories.aggregate({
    _max: { sort_order: true },
    where: { parent_id: discipline.id },
  });
  let nextSort = (maxSort._max.sort_order ?? 0) + 1;

  let created = 0;
  let skipped = 0;

  for (const p of PARENTS) {
    const existing = await prisma.categories.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  [SKIP] ${p.slug} already exists (${existing.id}), parent=${existing.parent_id}`);
      skipped++;
      continue;
    }

    console.log(`  [CREATE] "${p.fr}" / "${p.en}" (${p.slug}) sort=${nextSort}`);

    if (APPLY) {
      const id = randomUUID();
      await prisma.categories.create({
        data: {
          id,
          name: p.fr,
          slug: p.slug,
          parent_id: discipline.id,
          sort_order: nextSort,
          is_active: true,
          type: "equipment",
          updated_at: new Date(),
          category_translations: {
            create: [
              { id: randomUUID(), language_code: "fr", name: p.fr },
              { id: randomUUID(), language_code: "en", name: p.en },
            ],
          },
        },
      });
      console.log(`           -> created ${id}`);
    }
    created++;
    nextSort++;
  }

  const total = await prisma.categories.count();
  const activeProducts = await prisma.products.count({ where: { status: "active" } });
  console.log(`\n  created: ${created} | skipped: ${skipped}`);
  console.log(`  categories now: ${total} | active products: ${activeProducts} (must stay 412)`);

  console.log(`\n${APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply"}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
