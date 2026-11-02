const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Reassigns Nidek products from oph-diagnostic to the correct new subcategories.
 * Also reassigns products from other brands that belong in Consultation/Exploration.
 */

// Nidek product slug -> target subcategory slug mapping
const NIDEK_MAPPINGS = [
  // --- Consultation subcategories ---
  // Table de consultation (consultation units, chairs)
  { pattern: "unite-de-consultation", target: "table-de-consultation" },
  { pattern: "fauteuil-d-examen", target: "table-de-consultation" },
  { pattern: "unit-synetic", target: "table-de-consultation" },

  // Refracto (refractometers, auto-refractometers)
  { pattern: "auto-refracto", target: "refracto" },
  { pattern: "refract", target: "refracto" },
  { pattern: "intelligent-refractor", target: "refracto" },

  // Tonometres
  { pattern: "tonom", target: "tonometres" },

  // Phoroptere (not found in current Nidek products)

  // Frontocometre (lensmeters)
  { pattern: "frontofocometre", target: "frontocometre" },

  // Lampe a fente (slit lamps)
  { pattern: "lampe", target: "lampe-a-fente" },
  { pattern: "slit", target: "lampe-a-fente" },

  // --- Exploration subcategories ---
  // OCT / Retinographe
  { pattern: "oct-retinographe", target: "oct-retinographe" },
  { pattern: "retinographe", target: "oct-retinographe" },
  { pattern: "opd-scan", target: "oct-retinographe" },
  { pattern: "ophtalmoscope", target: "oct-retinographe" },
  { pattern: "mirante", target: "oct-retinographe" },

  // Lasers
  { pattern: "laser", target: "lasers" },
  { pattern: "photocoagul", target: "lasers" },
  { pattern: "yag", target: "lasers" },

  // Biometrie / Echographie
  { pattern: "biometre", target: "biometrie-echographie" },
  { pattern: "biometer", target: "biometrie-echographie" },
  { pattern: "echograph", target: "biometrie-echographie" },
  { pattern: "us-4000", target: "biometrie-echographie" },
  { pattern: "al-scan", target: "biometrie-echographie" },

  // Microscopie speculaire
  { pattern: "microscope-speculaire", target: "microscopie-speculaire" },
  { pattern: "speculaire", target: "microscopie-speculaire" },
  { pattern: "cem-530", target: "microscopie-speculaire" },

  // Champ visuel et electrophysiologie
  { pattern: "perimetre", target: "champ-visuel-electrophysiologie" },
  { pattern: "microperimetre", target: "champ-visuel-electrophysiologie" },
  { pattern: "champ visuel", target: "champ-visuel-electrophysiologie" },
  { pattern: "pupillometre", target: "champ-visuel-electrophysiologie" },

  // Consultation misc (optotypes, projectors, gonioscopes)
  { pattern: "optotype", target: "table-de-consultation" },
  { pattern: "projecteur", target: "table-de-consultation" },
  { pattern: "chart", target: "table-de-consultation" },
  { pattern: "gonioscop", target: "table-de-consultation" },

  // Bloc operatoire - Phaco
  { pattern: "chirurgi", target: "phaco" },
  { pattern: "phaco", target: "phaco" },

  // Meuleuses (grinders) - keep in oph-diagnostic or move to consultation
  { pattern: "meuleuse", target: "table-de-consultation" },
  { pattern: "ice-1", target: "table-de-consultation" },
];

async function main() {
  console.log("=== REASSIGN NIDEK & DIAGNOSTIC PRODUCTS TO SUBCATEGORIES ===\n");

  // Build category slug -> id map
  const allCats = await prisma.categories.findMany({
    select: { id: true, slug: true }
  });
  const catMap = {};
  for (const c of allCats) catMap[c.slug] = c.id;

  // Get all active products in old ophthalmology categories
  const oldCategorySlugs = ["oph-diagnostic", "oph-exploration", "oph-instruments", "oph-consumable", "oph-pharmaceutics", "oph-contactology", "ophthalmology", "ophtalmologie"];
  const oldCategoryIds = oldCategorySlugs.map(s => catMap[s]).filter(Boolean);

  const products = await prisma.products.findMany({
    where: {
      status: "active",
      category_id: { in: oldCategoryIds }
    },
    include: {
      product_translations: {
        select: { nom: true, description: true, language_code: true }
      }
    }
  });

  console.log(`Found ${products.length} products in old ophthalmology categories\n`);

  let moved = 0;
  let unmatched = 0;

  for (const product of products) {
    const frName = (product.product_translations.find(t => t.language_code === "fr")?.nom || "").toLowerCase();
    const frDesc = (product.product_translations.find(t => t.language_code === "fr")?.description || "").toLowerCase();
    const slug = product.slug.toLowerCase();
    const ref = product.reference_fournisseur.toLowerCase();
    const allText = `${frName} ${frDesc} ${slug} ${ref}`;

    let matched = false;
    for (const mapping of NIDEK_MAPPINGS) {
      if (allText.includes(mapping.pattern)) {
        const targetId = catMap[mapping.target];
        if (targetId) {
          await prisma.products.update({
            where: { id: product.id },
            data: { category_id: targetId, updated_at: new Date() }
          });
          console.log(`  [OK] "${frName}" -> ${mapping.target}`);
          moved++;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      console.log(`  [SKIP] "${frName}" (${product.constructeur}) - no mapping, stays in current category`);
      unmatched++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Moved: ${moved}`);
  console.log(`Unmatched: ${unmatched}`);

  // Update category images for newly populated subcategories
  console.log("\nUpdating subcategory images...");
  const subSlugs = [...new Set(NIDEK_MAPPINGS.map(m => m.target))];
  for (const slug of subSlugs) {
    const catId = catMap[slug];
    if (!catId) continue;

    const bestProduct = await prisma.products.findFirst({
      where: { category_id: catId, status: "active" },
      orderBy: [{ is_featured: "desc" }, { sort_order: "asc" }, { created_at: "desc" }],
      include: {
        product_media: {
          where: { type: "image" },
          orderBy: { is_primary: "desc" },
          take: 1,
          select: { url: true }
        }
      }
    });

    if (bestProduct && bestProduct.product_media.length > 0) {
      await prisma.categories.update({
        where: { id: catId },
        data: { image_url: bestProduct.product_media[0].url, updated_at: new Date() }
      });
      console.log(`  [OK] "${slug}" image updated`);
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
