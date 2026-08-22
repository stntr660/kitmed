const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Batch 2026-08-21 -- categories only, step 2/2.
 *
 * Reparent 13 existing categories under the grouping parents created by
 * 51-create-parents.js (plus materiel-de-refraction, which already exists).
 *
 * Only `parent_id` changes. Names, slugs, type, is_active and sort_order are
 * untouched, and NO product is moved -- products follow their category
 * automatically because products.category_id is not modified.
 *
 * Run:
 *   node 52-reparent-categories.js          # dry-run
 *   node 52-reparent-categories.js --apply
 */

const APPLY = process.argv.includes("--apply");

// child slug -> new parent slug
const MOVES = [
  ["laser-yag-et-slt",                               "lasers-et-ipl"],
  ["laser-photocoagulateurs",                        "lasers-et-ipl"],
  ["traitement-et-diagnostique-secheresse-oculaire", "lasers-et-ipl"],
  ["oct-et-imagerie",                                "diagnostic-retine"],
  ["topographie",                                    "segment-anterieur"],
  ["tonometres-pachymetres",                         "segment-anterieur"],
  ["microscopie-speculaire",                         "segment-anterieur"],
  ["microscope-operatoire",                          "bloc-operatoire"],
  ["phaco",                                          "bloc-operatoire"],
  ["instrumentation",                                "bloc-operatoire"],
  ["implant-et-visco",                               "consommable"],
  ["frontofocometre",                                "materiel-de-refraction"],
  ["ecran-optotype",                                 "materiel-de-refraction"],
];

async function main() {
  console.log(`=== Reparent categories (2026-08-21) ===`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const activeBefore = await prisma.products.count({ where: { status: "active" } });
  console.log(`Active products before: ${activeBefore}\n`);

  let moved = 0, already = 0, missing = 0;
  const rollback = [];

  for (const [childSlug, parentSlug] of MOVES) {
    const child = await prisma.categories.findUnique({
      where: { slug: childSlug },
      include: { categories: { select: { slug: true } } },
    });
    if (!child) { console.log(`  [MISSING] child ${childSlug}`); missing++; continue; }

    const parent = await prisma.categories.findUnique({ where: { slug: parentSlug } });
    if (!parent) { console.log(`  [MISSING] parent ${parentSlug} (for ${childSlug})`); missing++; continue; }

    const productCount = await prisma.products.count({
      where: { category_id: child.id, status: "active" },
    });

    console.log(`  [${childSlug}] "${child.name}" (${productCount} active)`);
    console.log(`    from: ${child.categories?.slug ?? "(root)"} -> to: ${parentSlug}`);

    if (child.parent_id === parent.id) {
      console.log(`    already in target -> skip`);
      already++;
      continue;
    }

    rollback.push(
      `UPDATE categories SET parent_id = '${child.parent_id}', updated_at = NOW() WHERE slug = '${childSlug}';`
    );

    if (APPLY) {
      await prisma.categories.update({
        where: { id: child.id },
        data: { parent_id: parent.id, updated_at: new Date() },
      });
      console.log(`    [MOVED]`);
    }
    moved++;
  }

  const activeAfter = await prisma.products.count({ where: { status: "active" } });
  const totalCats = await prisma.categories.count();

  console.log(`\n  moved: ${moved} | already in place: ${already} | missing: ${missing}`);
  console.log(`  categories: ${totalCats} | active products: ${activeBefore} -> ${activeAfter}`);
  if (activeBefore !== activeAfter) {
    console.log(`  *** WARNING: active product count changed. This batch must not touch products. ***`);
  }

  if (rollback.length) {
    console.log(`\n--- ROLLBACK SQL ---`);
    rollback.forEach((s) => console.log(s));
  }

  console.log(`\n${APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply"}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
