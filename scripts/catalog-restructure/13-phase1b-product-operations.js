require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const REFERENCES_TO_DELETE = [
  "FC161",
  "FC162",
  "RS-330",
  "4000006",
  "ACUVUERE",
  "2509-P-8025",
  "1945-P-5019",
  "OCUBLUTR",
  "TA517",
];

const ISOMAX_REFS_TO_MOVE = ["GA1360000", "GA1359900", "ISO-ISS-16X5"];
const PHARMA_CATEGORY_ID = "oph-pharmaceutics";

const HYLO_SORT = [
  { ref: "HYLO DUAL INTENSE", sort: 1 },
  { ref: "HYLO-DUAL", sort: 2 },
  { ref: "HYLO CARE (COLLYRE)", sort: 3 },
  { ref: "HYLO-COMOD", sort: 4 },
  { ref: "HYLO-FRESH", sort: 5 },
  { ref: "HYLO-GEL", sort: 6 },
];

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function main() {
  console.log("\n== Phase 1B: Product operations ==\n");

  await prisma.$transaction(async (tx) => {
    // extended below
    console.log(`1. Delete ${REFERENCES_TO_DELETE.length} products (cascade)`);
    for (const ref of REFERENCES_TO_DELETE) {
      const matches = await tx.products.findMany({
        where: { reference_fournisseur: ref },
        select: { id: true, reference_fournisseur: true },
      });
      if (matches.length === 0) {
        console.log(`   [MISS] no product with ref=${ref}`);
        continue;
      }
      for (const p of matches) {
        await deleteProductCascade(tx, p.id);
        console.log(`   [DEL] ${ref} (id=${p.id})`);
      }
    }

    console.log(`\n2. Move 3 ISOMAX/ISOMAR products -> Pharma`);
    for (const ref of ISOMAX_REFS_TO_MOVE) {
      const result = await tx.products.updateMany({
        where: { reference_fournisseur: ref },
        data: { category_id: PHARMA_CATEGORY_ID, updated_at: new Date() },
      });
      console.log(`   [MOV] ${ref}: ${result.count} row(s) updated`);
    }

    console.log(`\n3. Prioritize HYLO products (sort_order 1..6)`);
    for (const { ref, sort } of HYLO_SORT) {
      const result = await tx.products.updateMany({
        where: { reference_fournisseur: ref, status: "active" },
        data: { sort_order: sort, is_featured: true, updated_at: new Date() },
      });
      console.log(`   [HYLO] ${ref} -> sort=${sort} (${result.count} row)`);
    }
  }, { timeout: 60000, maxWait: 10000 });

  console.log("\n== Phase 1B complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
