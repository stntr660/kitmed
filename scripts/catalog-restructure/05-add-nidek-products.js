const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

/**
 * Adds new Nidek products to the ophthalmology catalog:
 * - Lypop (dry eye treatment)
 * - Affinity (refraction system)
 * - Synetic (slit lamp)
 * - DT 6400 (digital tonometer)
 */

const NIDEK_PRODUCTS = [
  {
    reference: "NIDEK-LYPOP",
    slug: "nidek-lypop",
    nameFr: "Nidek Lypop",
    nameEn: "Nidek Lypop",
    descFr: "Systeme de traitement de la secheresse oculaire Nidek Lypop",
    descEn: "Nidek Lypop dry eye treatment system",
    categorySlug: "consultation"
  },
  {
    reference: "NIDEK-AFFINITY",
    slug: "nidek-affinity",
    nameFr: "Nidek Affinity",
    nameEn: "Nidek Affinity",
    descFr: "Systeme de refraction automatique Nidek Affinity",
    descEn: "Nidek Affinity automatic refraction system",
    categorySlug: "refracto"
  },
  {
    reference: "NIDEK-SYNETIC",
    slug: "nidek-synetic",
    nameFr: "Nidek Synetic",
    nameEn: "Nidek Synetic",
    descFr: "Lampe a fente Nidek Synetic",
    descEn: "Nidek Synetic slit lamp",
    categorySlug: "lampe-a-fente"
  },
  {
    reference: "NIDEK-DT6400",
    slug: "nidek-dt-6400",
    nameFr: "Nidek DT 6400",
    nameEn: "Nidek DT 6400",
    descFr: "Tonometre digital Nidek DT 6400",
    descEn: "Nidek DT 6400 digital tonometer",
    categorySlug: "tonometres"
  }
];

async function main() {
  console.log("=== ADD NEW NIDEK PRODUCTS ===\n");

  // Find Nidek partner
  const nidek = await prisma.partners.findFirst({
    where: {
      OR: [
        { slug: { contains: "nidek", mode: "insensitive" } },
        { name: { contains: "nidek", mode: "insensitive" } }
      ]
    }
  });

  if (!nidek) {
    console.error("ERROR: Nidek partner not found in database!");
    process.exit(1);
  }

  console.log(`Found Nidek partner: ${nidek.id} (${nidek.name})\n`);

  for (const product of NIDEK_PRODUCTS) {
    // Check if product already exists
    const existing = await prisma.products.findFirst({
      where: {
        OR: [
          { slug: product.slug },
          { reference_fournisseur: product.reference }
        ]
      }
    });

    if (existing) {
      console.log(`[SKIP] "${product.slug}" already exists (${existing.id})`);
      continue;
    }

    // Find target category
    const category = await prisma.categories.findFirst({
      where: { slug: product.categorySlug }
    });

    if (!category) {
      // Fall back to ophthalmology root
      const ophthalmology = await prisma.categories.findFirst({
        where: { slug: { in: ["ophthalmology", "ophtalmologie"] } }
      });
      if (!ophthalmology) {
        console.log(`[ERROR] No category found for "${product.slug}", skipping`);
        continue;
      }
      console.log(`  [WARN] Category "${product.categorySlug}" not found, using ophthalmology root`);
      product.categoryId = ophthalmology.id;
    } else {
      product.categoryId = category.id;
    }

    const id = randomUUID();
    await prisma.products.create({
      data: {
        id,
        reference_fournisseur: product.reference,
        slug: product.slug,
        constructeur: "Nidek",
        category_id: product.categoryId,
        partner_id: nidek.id,
        status: "active",
        is_featured: false,
        sort_order: 0,
        created_at: new Date(),
        updated_at: new Date(),
        product_translations: {
          create: [
            {
              id: randomUUID(),
              language_code: "fr",
              nom: product.nameFr,
              description: product.descFr
            },
            {
              id: randomUUID(),
              language_code: "en",
              nom: product.nameEn,
              description: product.descEn
            }
          ]
        }
      }
    });

    console.log(`[OK] Created "${product.slug}" (${id}) -> category "${product.categorySlug}"`);
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
