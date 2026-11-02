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
  console.log("\n== Phase 9: FCI Oculoplastie consolidation ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Delete redundant FCI-OCULOPLASTIE-KIT placeholder");
      const kit = await tx.products.findUnique({
        where: { reference_fournisseur: "FCI-OCULOPLASTIE-KIT" },
      });
      if (kit) {
        await deleteProductCascade(tx, kit.id);
        console.log(`   [DEL] FCI-OCULOPLASTIE-KIT (${kit.id})`);
      }

      console.log("\n2. Merge 6 instrument boxes/forceps -> 1");
      await mergeGroup(tx, {
        masterRef: "A10.7000, A8.4050, A8.4120, A6.8000, A1.2210, A1.2300, A3.3100, A3.1120, A7.1010, A8.3010",
        mergeRefs: [
          "A10.1500, A1.2100, A3.1030, A6.2026, A6.8000, A7.1110, A8.3005",
          "A10.4000, A5.2113, A3.1210, A3.4030, A2.4400, A6.7110, A6.5110, A6.4100, A7.3110, A8.3010",
          "A10.1600, A3.1030, A3.3000, A6.6210, A6.8000, A6.8030, A7.1110, A8.3005",
          "PINCEGLA",
          "PINCEPTO",
        ],
        nomFr: "Boîtes d'Instruments Chirurgicaux et Pinces FCI (DCR / Chalazion / Glaucome / Ptérygion / Ptosis)",
        nomEn: "FCI Surgical Instrument Boxes & Forceps (DCR / Chalazion / Glaucoma / Pterygium / Ptosis)",
      });

      console.log("\n3. Merge 3 Monoka variants -> 1");
      await mergeGroup(tx, {
        masterRef: "S1.1621, S1.1631, S1.1661, S1.1711",
        mergeRefs: ["S1.1501, S1.1521", "S1.1801, S1.1811, S1.1821"],
        nomFr: "Sondes d'Intubation Monocanaliculaire Monoka FCI (Monoka / Mini-Monoka / Monoka Fayet-Bernard Ritleng)",
        nomEn: "FCI Monoka Monocanalicular Intubation Probes (Monoka / Mini-Monoka / Monoka Fayet-Bernard Ritleng)",
      });

      console.log("\n4. Merge 2 Ritleng variants -> 1");
      await mergeGroup(tx, {
        masterRef: "S1.1451, S1.1491",
        mergeRefs: ["S1.1456, S1.1496"],
        nomFr: "Système d'Intubation Bicanaliculonasale Ritleng / Ritleng+ Autostable (FCI)",
        nomEn: "FCI Ritleng / Ritleng+ Bicanaliculonasal Intubation System",
      });
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 9 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
