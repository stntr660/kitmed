const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

/**
 * Creates hospital subcategories based on existing product types:
 *
 * Hopital (existing root)
 * |-- Literie hospitaliere (Hospital Beds)
 * |-- Brancards (Stretchers/Gurneys)
 * |-- Fauteuils patients (Patient Chairs & Seating)
 * |-- Tables medicales (Medical/Examination Tables)
 * |-- Chariots (Trolleys & Carts)
 * |-- Armoires et rangement (Storage & Cabinets)
 * |-- Equipement pediatrique (Pediatric/Neonatal)
 * |-- Mobilite et soutien (Mobility & Support)
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
  console.log("=== HOSPITAL SUBCATEGORY RESTRUCTURE ===\n");

  // Find the hospital root discipline
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
    console.error("ERROR: Hospital discipline not found!");
    // List root categories for debugging
    const roots = await prisma.categories.findMany({
      where: { parent_id: null },
      select: { id: true, slug: true, name: true }
    });
    console.log("Available root categories:", roots.map(r => `${r.slug} (${r.name})`));
    process.exit(1);
  }

  console.log(`Found Hospital: ${hospital.id} (slug: ${hospital.slug})\n`);
  console.log("Creating subcategories...\n");

  const subcategories = [
    {
      slug: "literie-hospitaliere",
      nameFr: "Literie hospitaliere",
      nameEn: "Hospital Beds",
      descFr: "Lits d'hopital, lits de soins intensifs, lits bariatriques",
      descEn: "Hospital beds, ICU beds, bariatric beds",
      sortOrder: 1
    },
    {
      slug: "brancards",
      nameFr: "Brancards",
      nameEn: "Stretchers & Gurneys",
      descFr: "Brancards d'urgence, de transfert, hydrauliques et ambulanciers",
      descEn: "Emergency, transfer, hydraulic and ambulance stretchers",
      sortOrder: 2
    },
    {
      slug: "fauteuils-patients",
      nameFr: "Fauteuils patients",
      nameEn: "Patient Chairs & Seating",
      descFr: "Fauteuils de dialyse, chimiotherapie, prelevement et geriatrie",
      descEn: "Dialysis, chemotherapy, blood collection and geriatric chairs",
      sortOrder: 3
    },
    {
      slug: "tables-medicales",
      nameFr: "Tables medicales",
      nameEn: "Medical Tables",
      descFr: "Tables d'examen, d'operation, gynecologiques et autopsie",
      descEn: "Examination, operating, gynecological and autopsy tables",
      sortOrder: 4
    },
    {
      slug: "chariots",
      nameFr: "Chariots",
      nameEn: "Trolleys & Carts",
      descFr: "Chariots d'urgence, de pansement, a medicaments et instruments",
      descEn: "Emergency, dressing, medicine and instrument trolleys",
      sortOrder: 5
    },
    {
      slug: "armoires-et-rangement",
      nameFr: "Armoires et rangement",
      nameEn: "Storage & Cabinets",
      descFr: "Armoires a instruments, pharmacie, tables de chevet et casiers",
      descEn: "Instrument cabinets, pharmacy, bedside tables and lockers",
      sortOrder: 6
    },
    {
      slug: "equipement-pediatrique",
      nameFr: "Equipement pediatrique",
      nameEn: "Pediatric Equipment",
      descFr: "Berceaux, tables chauffantes, phototherapie neonatale",
      descEn: "Baby cots, infant warmers, neonatal phototherapy",
      sortOrder: 7
    },
    {
      slug: "mobilite-et-soutien",
      nameFr: "Mobilite et soutien",
      nameEn: "Mobility & Support",
      descFr: "Fauteuils roulants, deambulateurs, bequilles",
      descEn: "Wheelchairs, walkers, crutches",
      sortOrder: 8
    }
  ];

  for (const sub of subcategories) {
    await createCategory({ ...sub, parentId: hospital.id });
  }

  console.log(`\n=== DONE ===`);
  console.log(`Hospital now has ${subcategories.length} subcategories.`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
