const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Reassigns existing products to the new subcategory structure.
 *
 * Ophthalmology reassignments:
 * - Phaco products (Sofu, Nidek phaco) -> Bloc operatoire > Phaco
 * - Haag-Streit Metis -> Bloc operatoire > Microscope
 * - Medicontur IOLs -> Consommable > Implant
 * - Rheon products -> Consommable > Valves
 * - FCI products -> Consommable > FCI
 * - MORIA instruments -> Bloc operatoire > Instrumentation
 *
 * Hospital reassignments:
 * - Nitrocare products by type keyword matching
 * - Foshan products by type keyword matching
 */

async function findCategory(slug) {
  const cat = await prisma.categories.findFirst({ where: { slug } });
  if (!cat) {
    console.log(`  [WARN] Category "${slug}" not found, skipping assignments to it`);
  }
  return cat;
}

async function reassignByPartnerSlug(partnerSlugPattern, targetCategoryId, targetName) {
  const result = await prisma.products.updateMany({
    where: {
      partners: { slug: { contains: partnerSlugPattern, mode: "insensitive" } },
      status: "active"
    },
    data: { category_id: targetCategoryId, updated_at: new Date() }
  });
  console.log(`  [OK] ${result.count} products (partner ~"${partnerSlugPattern}") -> "${targetName}"`);
  return result.count;
}

async function reassignByConstructeur(constructeurPattern, targetCategoryId, targetName) {
  const result = await prisma.products.updateMany({
    where: {
      constructeur: { contains: constructeurPattern, mode: "insensitive" },
      status: "active"
    },
    data: { category_id: targetCategoryId, updated_at: new Date() }
  });
  console.log(`  [OK] ${result.count} products (constructeur ~"${constructeurPattern}") -> "${targetName}"`);
  return result.count;
}

async function reassignByNamePattern(namePattern, targetCategoryId, targetName) {
  // Find products whose translations match the pattern
  const matchingProducts = await prisma.products.findMany({
    where: {
      status: "active",
      product_translations: {
        some: {
          nom: { contains: namePattern, mode: "insensitive" }
        }
      }
    },
    select: { id: true }
  });

  if (matchingProducts.length === 0) {
    console.log(`  [SKIP] No products matching name ~"${namePattern}"`);
    return 0;
  }

  const result = await prisma.products.updateMany({
    where: { id: { in: matchingProducts.map(p => p.id) } },
    data: { category_id: targetCategoryId, updated_at: new Date() }
  });
  console.log(`  [OK] ${result.count} products (name ~"${namePattern}") -> "${targetName}"`);
  return result.count;
}

async function reassignHospitalProducts(hospitalCategorySlugs) {
  // Keyword mapping for hospital product types
  const hospitalKeywordMap = [
    { keywords: ["bed", "lit", "icu", "lowbed", "bariatric bed"], target: "literie-hospitaliere" },
    { keywords: ["stretcher", "brancard", "gurney", "ambulance stretcher"], target: "brancards" },
    { keywords: ["chair", "fauteuil", "seating", "dialysis", "chemo"], target: "fauteuils-patients" },
    { keywords: ["table", "examination", "examen", "operating table", "mayo", "overbed"], target: "tables-medicales" },
    { keywords: ["trolley", "cart", "chariot", "emergency trolley"], target: "chariots" },
    { keywords: ["cabinet", "armoire", "bedside", "locker", "casier"], target: "armoires-et-rangement" },
    { keywords: ["baby", "infant", "pediatric", "berceau", "phototherapy", "warmer"], target: "equipement-pediatrique" },
    { keywords: ["wheelchair", "walker", "crutch", "fauteuil roulant", "deambulateur"], target: "mobilite-et-soutien" }
  ];

  // Get the hospital root category
  const hospital = await prisma.categories.findFirst({
    where: {
      OR: [
        { slug: "hospital-furniture" },
        { slug: "hopital" },
        { slug: "hospital" },
        { slug: { contains: "hospital" } }
      ],
      parent_id: null
    }
  });

  if (!hospital) {
    console.log("  [WARN] Hospital root not found, skipping hospital reassignment");
    return;
  }

  // Get all products currently under hospital or its old subcategories
  const hospitalChildIds = await prisma.categories.findMany({
    where: { parent_id: hospital.id },
    select: { id: true }
  });
  const allHospitalCatIds = [hospital.id, ...hospitalChildIds.map(c => c.id)];

  // Also include patient-chairs-seating
  const patientChairs = await prisma.categories.findFirst({ where: { slug: "patient-chairs-seating" } });
  if (patientChairs) allHospitalCatIds.push(patientChairs.id);

  const hospitalProducts = await prisma.products.findMany({
    where: {
      category_id: { in: allHospitalCatIds },
      status: "active"
    },
    include: {
      product_translations: { select: { nom: true, description: true, language_code: true } }
    }
  });

  console.log(`\n  Found ${hospitalProducts.length} hospital products to categorize`);

  let reassigned = 0;
  for (const product of hospitalProducts) {
    const allText = [
      product.reference_fournisseur,
      product.constructeur,
      ...product.product_translations.map(t => `${t.nom} ${t.description}`)
    ].join(" ").toLowerCase();

    let matched = false;
    for (const mapping of hospitalKeywordMap) {
      if (mapping.keywords.some(kw => allText.includes(kw))) {
        const targetCat = hospitalCategorySlugs[mapping.target];
        if (targetCat) {
          await prisma.products.update({
            where: { id: product.id },
            data: { category_id: targetCat, updated_at: new Date() }
          });
          matched = true;
          reassigned++;
          break;
        }
      }
    }

    if (!matched) {
      console.log(`  [UNMATCHED] "${product.reference_fournisseur}" - could not categorize`);
    }
  }

  console.log(`  [OK] Reassigned ${reassigned}/${hospitalProducts.length} hospital products`);
}

async function main() {
  console.log("=== PRODUCT REASSIGNMENT TO NEW SUBCATEGORIES ===\n");

  // ---- Ophthalmology reassignments ----
  console.log("--- Ophthalmology ---");

  const phaco = await findCategory("phaco");
  const microscope = await findCategory("microscope-operatoire");
  const instrumentation = await findCategory("instrumentation");
  const implant = await findCategory("implant");
  const valves = await findCategory("valves");
  const fci = await findCategory("fci");

  if (phaco) {
    // Phaco machines - match by name patterns
    await reassignByNamePattern("phaco", phaco.id, "Phaco");
    await reassignByNamePattern("sofu", phaco.id, "Phaco");
  }

  if (microscope) {
    await reassignByNamePattern("metis", microscope.id, "Microscope");
    await reassignByNamePattern("microscope", microscope.id, "Microscope");
  }

  if (instrumentation) {
    // MORIA surgical instruments -> Instrumentation
    await reassignByConstructeur("moria", instrumentation.id, "Instrumentation");
  }

  if (implant) {
    await reassignByConstructeur("medicontur", implant.id, "Implant");
    await reassignByNamePattern("implant", implant.id, "Implant");
    await reassignByNamePattern("iol", implant.id, "Implant");
  }

  if (valves) {
    await reassignByConstructeur("rheon", valves.id, "Valves");
  }

  if (fci) {
    await reassignByConstructeur("fci", fci.id, "FCI");
  }

  // ---- Hospital reassignments ----
  console.log("\n--- Hospital ---");

  // Build hospital category slug -> id map
  const hospitalSlugs = [
    "literie-hospitaliere", "brancards", "fauteuils-patients",
    "tables-medicales", "chariots", "armoires-et-rangement",
    "equipement-pediatrique", "mobilite-et-soutien"
  ];

  const hospitalCatMap = {};
  for (const slug of hospitalSlugs) {
    const cat = await findCategory(slug);
    if (cat) hospitalCatMap[slug] = cat.id;
  }

  if (Object.keys(hospitalCatMap).length > 0) {
    await reassignHospitalProducts(hospitalCatMap);
  } else {
    console.log("  [SKIP] No hospital subcategories found, run 02-hospital-subcategories.js first");
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
