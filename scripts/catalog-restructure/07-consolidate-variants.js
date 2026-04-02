const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Consolidates variant products by merging similar names into one product.
 * Strategy: keep the first product, update its title to cover all variants,
 * archive the duplicates.
 *
 * Example: "Nidek LM 1800P" + "Nidek LM 1800PD" -> "Nidek LM 1800P/PD"
 *
 * Detection: groups products by manufacturer + base name similarity.
 */

function getBaseName(name) {
  // Remove trailing model suffixes like P, PD, S, etc.
  // "Nidek LM 1800P" -> "Nidek LM 1800"
  // "Nidek LM 1800PD" -> "Nidek LM 1800"
  return name
    .replace(/\s*[-/]\s*$/, "")
    .replace(/\s+[A-Z]{1,3}$/, "")
    .replace(/\d+[A-Z]+$/, (match) => match.replace(/[A-Z]+$/, ""))
    .trim();
}

function getSuffix(name, baseName) {
  const suffix = name.substring(baseName.length).trim();
  return suffix.replace(/^[-/\s]+/, "");
}

async function main() {
  console.log("=== CONSOLIDATE VARIANT PRODUCTS ===\n");

  // Fetch all active products with translations
  const products = await prisma.products.findMany({
    where: { status: "active" },
    include: {
      product_translations: {
        select: { id: true, nom: true, language_code: true }
      },
      partners: { select: { slug: true, name: true } }
    },
    orderBy: { created_at: "asc" }
  });

  console.log(`Total active products: ${products.length}\n`);

  // Group by manufacturer + base name
  const groups = {};
  for (const product of products) {
    const frName = product.product_translations.find(t => t.language_code === "fr")?.nom || "";
    const manufacturer = (product.partners?.slug || product.constructeur || "unknown").toLowerCase();
    const baseName = getBaseName(frName);
    const key = `${manufacturer}::${baseName.toLowerCase()}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push({ product, frName, baseName });
  }

  // Find groups with > 1 product (variants)
  const variantGroups = Object.entries(groups).filter(([_, items]) => items.length > 1);

  if (variantGroups.length === 0) {
    console.log("No variant groups detected.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${variantGroups.length} potential variant groups:\n`);

  let totalConsolidated = 0;
  let totalArchived = 0;

  for (const [key, items] of variantGroups) {
    // Only consolidate if names are actually similar (not just same manufacturer)
    const baseNames = [...new Set(items.map(i => i.baseName.toLowerCase()))];
    if (baseNames.length > 1) continue; // Different base names, not variants

    const canonical = items[0]; // Keep the first (oldest) product
    const duplicates = items.slice(1);

    // Build combined title
    const allSuffixes = items
      .map(i => getSuffix(i.frName, canonical.baseName))
      .filter(s => s.length > 0);

    const uniqueSuffixes = [...new Set(allSuffixes)];

    if (uniqueSuffixes.length <= 1 && duplicates.length > 0) {
      // Same exact name - true duplicates
      console.log(`[DUPLICATE] "${canonical.frName}" x${items.length}`);
    } else if (uniqueSuffixes.length > 1) {
      // Different suffixes - merge into combined title
      const combinedTitle = `${canonical.baseName} ${uniqueSuffixes.join("/")}`;
      console.log(`[MERGE] "${canonical.frName}" + ${duplicates.length} variants -> "${combinedTitle}"`);

      // Update canonical product title in all languages
      for (const translation of canonical.product.product_translations) {
        const enName = items[0].product.product_translations.find(t => t.language_code === "en")?.nom;
        const enBase = enName ? getBaseName(enName) : canonical.baseName;

        if (translation.language_code === "fr") {
          await prisma.product_translations.update({
            where: { id: translation.id },
            data: { nom: combinedTitle }
          });
        } else if (translation.language_code === "en") {
          const enCombined = `${enBase} ${uniqueSuffixes.join("/")}`;
          await prisma.product_translations.update({
            where: { id: translation.id },
            data: { nom: enCombined }
          });
        }
      }
    } else {
      continue; // No meaningful variants to consolidate
    }

    // Archive duplicates
    for (const dup of duplicates) {
      await prisma.products.update({
        where: { id: dup.product.id },
        data: { status: "archived", updated_at: new Date() }
      });
      console.log(`  [ARCHIVED] "${dup.frName}" (${dup.product.reference_fournisseur})`);
      totalArchived++;
    }

    totalConsolidated++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Groups consolidated: ${totalConsolidated}`);
  console.log(`Products archived: ${totalArchived}`);

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
