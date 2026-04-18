require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function mergeGroup(tx, { masterRef, mergeRefs, nomFr, nomEn }) {
  const master = await tx.products.findUnique({ where: { reference_fournisseur: masterRef } });
  if (!master) throw new Error(`master ${masterRef} not found`);
  const dups = [];
  for (const ref of mergeRefs) {
    const d = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
    if (d) dups.push(d);
  }
  const joined = [masterRef, ...dups.map((d) => d.reference_fournisseur)].join(", ");
  await tx.products.update({
    where: { id: master.id },
    data: { reference_fournisseur: joined, updated_at: new Date() },
  });
  for (const lang of ["fr", "en"]) {
    const t = await tx.product_translations.findFirst({
      where: { product_id: master.id, language_code: lang },
    });
    if (t) {
      await tx.product_translations.update({
        where: { id: t.id },
        data: { nom: lang === "fr" ? nomFr : nomEn },
      });
    }
  }
  console.log(`   [MERGE] master=${masterRef}`);
  console.log(`           title: ${nomFr}`);
  for (const d of dups) {
    await deleteProductCascade(tx, d.id);
    console.log(`   [DEL-DUP] ${d.reference_fournisseur}`);
  }
}

async function main() {
  console.log("\n== Phase 9B: eyePlate / eyeWatch consolidation ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Merge 4 eyePlate variants -> 1");
      await mergeGroup(tx, {
        masterRef: "2P2",
        mergeRefs: ["2P2s", "3P2", "3P2s"],
        nomFr: "eyePlate Rheon (eyePlate-200 / 200s / 300 / 300s)",
        nomEn: "Rheon eyePlate (eyePlate-200 / 200s / 300 / 300s)",
      });

      console.log("\n2. Merge 2 Stylo eyeWatch variants -> 1");
      await mergeGroup(tx, {
        masterRef: "C4",
        mergeRefs: ["sC1"],
        nomFr: "Stylo eyeWatch Rheon (Standard / Usage Unique)",
        nomEn: "Rheon eyeWatch Pen (Standard / Single-Use)",
      });

      console.log("\n3. Merge 2 full eyeWatch systems -> 1");
      await mergeGroup(tx, {
        masterRef: "aW-syst-2Q0-01",
        mergeRefs: ["eW-syst-300-01"],
        nomFr: "Système complet eyeWatch Rheon (avec eyePlate-200 / 300) — Implant + Stylo usage unique + eyePlate",
        nomEn: "Complete Rheon eyeWatch System (with eyePlate-200 / 300) — Implant + Single-use Pen + eyePlate",
      });
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 9B complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
