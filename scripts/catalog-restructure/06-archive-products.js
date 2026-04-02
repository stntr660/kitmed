const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Archives products by setting status='archived'.
 * Matches by reference_fournisseur, slug, or product name (translations).
 *
 * Products to archive:
 * ICE 1500, ICE 1, iSpace, A455ML, C4V, Ophtec 570,
 * Myopie 206, Implant C, Valcegla, Ocubluntr, Implats, Kahooks
 */

const PRODUCTS_TO_ARCHIVE = [
  "ice 1500",
  "ice1500",
  "ice 1",
  "ice1",
  "ispace",
  "i-space",
  "a455ml",
  "a-455-ml",
  "c4v",
  "resensught",
  "ophtec 570",
  "ophtec570",
  "myopie 206",
  "myopie206",
  "implant c",
  "implant-c",
  "valcegla",
  "ocubluntr",
  "implats",
  "kahooks",
  "kahook"
];

async function main() {
  console.log("=== ARCHIVE PRODUCTS ===\n");

  let totalArchived = 0;
  const notFound = [];

  for (const term of PRODUCTS_TO_ARCHIVE) {
    // Search across reference, slug, and translations
    const products = await prisma.products.findMany({
      where: {
        status: "active",
        OR: [
          { reference_fournisseur: { contains: term, mode: "insensitive" } },
          { slug: { contains: term, mode: "insensitive" } },
          {
            product_translations: {
              some: {
                nom: { contains: term, mode: "insensitive" }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        reference_fournisseur: true,
        slug: true,
        status: true,
        product_translations: {
          select: { nom: true, language_code: true },
          take: 1
        }
      }
    });

    if (products.length === 0) {
      notFound.push(term);
      continue;
    }

    for (const product of products) {
      const name = product.product_translations[0]?.nom || product.reference_fournisseur;
      await prisma.products.update({
        where: { id: product.id },
        data: { status: "archived", updated_at: new Date() }
      });
      console.log(`  [ARCHIVED] "${name}" (ref: ${product.reference_fournisseur}, slug: ${product.slug})`);
      totalArchived++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Archived: ${totalArchived} products`);

  if (notFound.length > 0) {
    console.log(`\nNot found (review manually):`);
    for (const term of notFound) {
      console.log(`  - "${term}"`);
    }
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
