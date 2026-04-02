const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

/**
 * Creates the full ophthalmology subcategory hierarchy:
 *
 * Ophtalmologie (existing root)
 * |-- Consultation
 * |   |-- Table de consultation
 * |   |-- Refracto
 * |   |-- Tonometres
 * |   |-- Phoroptere
 * |   |-- Frontocometre
 * |   |-- Lampe a fente
 * |-- Exploration
 * |   |-- OCT / Retinographe
 * |   |-- Lasers
 * |   |-- Biometrie / Echographie
 * |   |-- Microscopie speculaire
 * |   |-- Champ visuel et electrophysiologie
 * |-- Bloc operatoire
 * |   |-- Phaco
 * |   |-- Microscope
 * |   |-- Instrumentation
 * |-- Consommable
 *     |-- Implant
 *     |-- Aiguilles
 *     |-- Ciseaux
 *     |-- Couteaux
 *     |-- Valves
 *     |-- FCI
 *         |-- Oculoplastie
 *         |-- Bouchons et clou-trous
 *         |-- Retine
 */

async function createCategory(data) {
  const existing = await prisma.categories.findFirst({
    where: { slug: data.slug }
  });

  if (existing) {
    console.log(`  [SKIP] "${data.slug}" already exists (${existing.id})`);
    return existing.id;
  }

  const id = randomUUID();
  await prisma.categories.create({
    data: {
      id,
      name: data.nameFr,
      slug: data.slug,
      parent_id: data.parentId,
      type: "equipment",
      sort_order: data.sortOrder,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      category_translations: {
        create: [
          {
            id: randomUUID(),
            language_code: "fr",
            name: data.nameFr,
            description: data.descFr || ""
          },
          {
            id: randomUUID(),
            language_code: "en",
            name: data.nameEn,
            description: data.descEn || ""
          }
        ]
      }
    }
  });

  console.log(`  [OK] Created "${data.slug}" (${id})`);
  return id;
}

async function main() {
  console.log("=== OPHTHALMOLOGY SUBCATEGORY RESTRUCTURE ===\n");

  // Find the ophthalmology root discipline
  const ophthalmology = await prisma.categories.findFirst({
    where: {
      OR: [
        { slug: "ophthalmology" },
        { slug: "ophtalmologie" }
      ]
    }
  });

  if (!ophthalmology) {
    console.error("ERROR: Ophthalmology discipline not found!");
    process.exit(1);
  }

  console.log(`Found Ophthalmology: ${ophthalmology.id} (slug: ${ophthalmology.slug})\n`);

  // Rename "Chirurgie" to "Bloc operatoire" if it exists under ophthalmology
  const chirurgie = await prisma.categories.findFirst({
    where: {
      parent_id: ophthalmology.id,
      OR: [
        { slug: { contains: "chirurgie" } },
        { name: { contains: "chirurgie", mode: "insensitive" } }
      ]
    }
  });

  if (chirurgie) {
    await prisma.categories.update({
      where: { id: chirurgie.id },
      data: { name: "Bloc operatoire", slug: "bloc-operatoire", updated_at: new Date() }
    });
    await prisma.category_translations.updateMany({
      where: { category_id: chirurgie.id, language_code: "fr" },
      data: { name: "Bloc operatoire" }
    });
    await prisma.category_translations.updateMany({
      where: { category_id: chirurgie.id, language_code: "en" },
      data: { name: "Operating Room" }
    });
    console.log(`[RENAME] "Chirurgie" -> "Bloc operatoire" (${chirurgie.id})\n`);
  }

  // ---- LEVEL 2: Main groups ----
  console.log("Creating Level 2 groups...");

  const consultationId = await createCategory({
    slug: "consultation",
    nameFr: "Consultation",
    nameEn: "Consultation",
    descFr: "Equipements de consultation ophtalmologique",
    descEn: "Ophthalmic consultation equipment",
    parentId: ophthalmology.id,
    sortOrder: 1
  });

  const explorationId = await createCategory({
    slug: "exploration",
    nameFr: "Exploration",
    nameEn: "Exploration",
    descFr: "Equipements d'exploration et diagnostic",
    descEn: "Exploration and diagnostic equipment",
    parentId: ophthalmology.id,
    sortOrder: 2
  });

  const blocId = chirurgie
    ? chirurgie.id
    : await createCategory({
        slug: "bloc-operatoire",
        nameFr: "Bloc operatoire",
        nameEn: "Operating Room",
        descFr: "Equipements de bloc operatoire ophtalmologique",
        descEn: "Ophthalmic operating room equipment",
        parentId: ophthalmology.id,
        sortOrder: 3
      });

  const consommableId = await createCategory({
    slug: "consommable",
    nameFr: "Consommable",
    nameEn: "Consumables",
    descFr: "Consommables et implants ophtalmologiques",
    descEn: "Ophthalmic consumables and implants",
    parentId: ophthalmology.id,
    sortOrder: 4
  });

  // ---- LEVEL 3: Consultation subcategories ----
  console.log("\nCreating Consultation subcategories...");

  const consultationSubs = [
    { slug: "table-de-consultation", nameFr: "Table de consultation", nameEn: "Consultation Table", sortOrder: 1 },
    { slug: "refracto", nameFr: "Refracto", nameEn: "Refractometer", sortOrder: 2 },
    { slug: "tonometres", nameFr: "Tonometres", nameEn: "Tonometers", sortOrder: 3 },
    { slug: "phoroptere", nameFr: "Phoroptere", nameEn: "Phoropter", sortOrder: 4 },
    { slug: "frontocometre", nameFr: "Frontocometre", nameEn: "Lensometer", sortOrder: 5 },
    { slug: "lampe-a-fente", nameFr: "Lampe a fente", nameEn: "Slit Lamp", sortOrder: 6 }
  ];

  for (const sub of consultationSubs) {
    await createCategory({ ...sub, parentId: consultationId });
  }

  // ---- LEVEL 3: Exploration subcategories ----
  console.log("\nCreating Exploration subcategories...");

  const explorationSubs = [
    { slug: "oct-retinographe", nameFr: "OCT / Retinographe", nameEn: "OCT / Retinograph", sortOrder: 1 },
    { slug: "lasers", nameFr: "Lasers", nameEn: "Lasers", sortOrder: 2 },
    { slug: "biometrie-echographie", nameFr: "Biometrie / Echographie", nameEn: "Biometry / Ultrasound", sortOrder: 3 },
    { slug: "microscopie-speculaire", nameFr: "Microscopie speculaire", nameEn: "Specular Microscopy", sortOrder: 4 },
    { slug: "champ-visuel-electrophysiologie", nameFr: "Champ visuel et electrophysiologie", nameEn: "Visual Field & Electrophysiology", sortOrder: 5 }
  ];

  for (const sub of explorationSubs) {
    await createCategory({ ...sub, parentId: explorationId });
  }

  // ---- LEVEL 3: Bloc operatoire subcategories ----
  console.log("\nCreating Bloc operatoire subcategories...");

  const blocSubs = [
    { slug: "phaco", nameFr: "Phaco", nameEn: "Phaco", sortOrder: 1 },
    { slug: "microscope-operatoire", nameFr: "Microscope", nameEn: "Microscope", sortOrder: 2 },
    { slug: "instrumentation", nameFr: "Instrumentation", nameEn: "Instrumentation", sortOrder: 3 }
  ];

  for (const sub of blocSubs) {
    await createCategory({ ...sub, parentId: blocId });
  }

  // ---- LEVEL 3: Consommable subcategories ----
  console.log("\nCreating Consommable subcategories...");

  const consommableSubs = [
    { slug: "implant", nameFr: "Implant", nameEn: "Implant", sortOrder: 1 },
    { slug: "aiguilles", nameFr: "Aiguilles", nameEn: "Needles", sortOrder: 2 },
    { slug: "ciseaux", nameFr: "Ciseaux", nameEn: "Scissors", sortOrder: 3 },
    { slug: "couteaux", nameFr: "Couteaux", nameEn: "Blades", sortOrder: 4 },
    { slug: "valves", nameFr: "Valves", nameEn: "Valves", sortOrder: 5 }
  ];

  for (const sub of consommableSubs) {
    await createCategory({ ...sub, parentId: consommableId });
  }

  // FCI is special - has sub-sub-categories
  const fciId = await createCategory({
    slug: "fci",
    nameFr: "FCI",
    nameEn: "FCI",
    descFr: "Produits FCI pour ophtalmologie",
    descEn: "FCI ophthalmic products",
    parentId: consommableId,
    sortOrder: 6
  });

  // ---- LEVEL 4: FCI sub-sub-categories ----
  console.log("\nCreating FCI sub-sub-categories...");

  const fciSubs = [
    { slug: "oculoplastie", nameFr: "Oculoplastie", nameEn: "Oculoplasty", sortOrder: 1 },
    { slug: "bouchons-et-clou-trous", nameFr: "Bouchons et clou-trous", nameEn: "Plugs and Punctal Occluders", sortOrder: 2 },
    { slug: "retine", nameFr: "Retine", nameEn: "Retina", sortOrder: 3 }
  ];

  for (const sub of fciSubs) {
    await createCategory({ ...sub, parentId: fciId });
  }

  // Summary
  const totalCreated = await prisma.categories.count({
    where: {
      OR: [
        { parent_id: ophthalmology.id },
        { categories: { parent_id: ophthalmology.id } }
      ]
    }
  });

  console.log(`\n=== DONE ===`);
  console.log(`Ophthalmology now has subcategories at multiple levels.`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
