require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const CONSULTATION_ID = "d0a4a93b-980b-4630-bc87-a4d68268902f";
const VERRES_OPHT_ID = "b3bcc215-951d-4dae-92bd-8f416f975eb5";
const DIAGNOSTIC_ID = "oph-diagnostic";
const OCULOPLASTIE_FCI_ID = "ee805e39-2bb1-4cdb-adb6-a6ebeb7fdb56";

async function upsertTranslation(tx, categoryId, langCode, fields) {
  const existing = await tx.category_translations.findFirst({
    where: { category_id: categoryId, language_code: langCode },
  });
  if (existing) {
    await tx.category_translations.update({
      where: { id: existing.id },
      data: fields,
    });
  } else {
    await tx.category_translations.create({
      data: {
        id: randomUUID(),
        category_id: categoryId,
        language_code: langCode,
        name: fields.name,
        description: fields.description || "",
      },
    });
  }
}

async function createSubcategory(tx, { parentId, slug, sortOrder, nameFr, nameEn }) {
  const existing = await tx.categories.findFirst({ where: { slug } });
  if (existing) {
    console.log(`  [SKIP] "${slug}" already exists (${existing.id})`);
    return existing.id;
  }
  const id = randomUUID();
  await tx.categories.create({
    data: {
      id,
      name: nameFr,
      slug,
      parent_id: parentId,
      type: "equipment",
      sort_order: sortOrder,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      category_translations: {
        create: [
          { id: randomUUID(), language_code: "fr", name: nameFr, description: "" },
          { id: randomUUID(), language_code: "en", name: nameEn, description: "" },
        ],
      },
    },
  });
  console.log(`  [OK] Created "${slug}" (${id})`);
  return id;
}

async function main() {
  console.log("\n== Phase 1A: Category restructure ==\n");

  await prisma.$transaction(async (tx) => {
    console.log("1. Soft-delete Diagnostic (is_active=false, rename)");
    await tx.categories.update({
      where: { id: DIAGNOSTIC_ID },
      data: { name: "[Archived] Diagnostic", is_active: false, updated_at: new Date() },
    });
    await upsertTranslation(tx, DIAGNOSTIC_ID, "fr", { name: "[Archive] Diagnostic" });
    await upsertTranslation(tx, DIAGNOSTIC_ID, "en", { name: "[Archived] Diagnostics" });

    console.log("2. Archive 2 active products still in Diagnostic");
    const archivedActive = await tx.products.updateMany({
      where: { category_id: DIAGNOSTIC_ID, status: "active" },
      data: { status: "archived", updated_at: new Date() },
    });
    console.log(`   [OK] ${archivedActive.count} products archived`);

    console.log("3. Rename Oculoplastie (FCI) -> Oculoplastie et Retine (FCI)");
    await tx.categories.update({
      where: { id: OCULOPLASTIE_FCI_ID },
      data: { name: "Oculoplastie et Retine (FCI)", updated_at: new Date() },
    });
    await upsertTranslation(tx, OCULOPLASTIE_FCI_ID, "fr", { name: "Oculoplastie et Retine (FCI)" });
    await upsertTranslation(tx, OCULOPLASTIE_FCI_ID, "en", { name: "Oculoplasty and Retina (FCI)" });

    console.log("4. Rename Verres et ophtalmoscope -> Verres et ophtalmoscope et Skeepens");
    await tx.categories.update({
      where: { id: VERRES_OPHT_ID },
      data: {
        name: "Verres et ophtalmoscope et Skeepens",
        slug: "verres-ophtalmoscope-et-skeepens",
        updated_at: new Date(),
      },
    });
    await upsertTranslation(tx, VERRES_OPHT_ID, "fr", {
      name: "Verres et ophtalmoscope et Skeepens",
    });
    await upsertTranslation(tx, VERRES_OPHT_ID, "en", {
      name: "Trial Lenses, Ophthalmoscopes and Schepens",
    });

    console.log("5. Create 3 subcategories");
    const ophtalmoscopeId = await createSubcategory(tx, {
      parentId: VERRES_OPHT_ID,
      slug: "ophtalmoscope",
      sortOrder: 1,
      nameFr: "Ophtalmoscope",
      nameEn: "Ophthalmoscopes",
    });
    const verresId = await createSubcategory(tx, {
      parentId: VERRES_OPHT_ID,
      slug: "verres",
      sortOrder: 2,
      nameFr: "Verres",
      nameEn: "Trial Lenses",
    });
    const skeepensId = await createSubcategory(tx, {
      parentId: VERRES_OPHT_ID,
      slug: "skeepens",
      sortOrder: 3,
      nameFr: "Skeepens",
      nameEn: "Schepens",
    });
    console.log(`   [OK] subcats: ophtalmoscope=${ophtalmoscopeId}, verres=${verresId}, skeepens=${skeepensId}`);

    console.log("6. Move remaining active products from parent -> Verres subcategory");
    const moved = await tx.products.updateMany({
      where: {
        category_id: VERRES_OPHT_ID,
        status: "active",
        NOT: { reference_fournisseur: { in: ["2509-P-8025", "1945-P-5019"] } },
      },
      data: { category_id: verresId, updated_at: new Date() },
    });
    console.log(`   [OK] ${moved.count} products moved to Verres`);

    console.log("7. Reorder Consultation siblings");
    await tx.categories.update({
      where: { slug: "ecran-optotype" },
      data: { sort_order: 6, updated_at: new Date() },
    });
    await tx.categories.update({
      where: { id: "oph-table-motorisee" },
      data: { sort_order: 7, updated_at: new Date() },
    });
    await tx.categories.update({
      where: { id: VERRES_OPHT_ID },
      data: { sort_order: 8, updated_at: new Date() },
    });
    console.log("   [OK] Ecran=6, Table motorisee=7, Verres+Skeepens=8");
  });

  console.log("\n== Phase 1A complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
