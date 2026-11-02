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

  const allRefs = [masterRef, ...dups.map((d) => d.reference_fournisseur)].join(", ");
  await tx.products.update({
    where: { id: master.id },
    data: { reference_fournisseur: allRefs, updated_at: new Date() },
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
  console.log(`           refs: ${allRefs}`);
  console.log(`           title: ${nomFr}`);

  for (const d of dups) {
    await deleteProductCascade(tx, d.id);
    console.log(`   [DEL-DUP] ${d.reference_fournisseur} (${d.id})`);
  }
}

async function main() {
  console.log("\n== Phase 5C: Meibomask + Eye-Light group merges ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Meibomask group (Station + Mask 250/500 Blue/Red + 2000 sessions)");
      await mergeGroup(tx, {
        masterRef: "ESP-MW-61BT",
        mergeRefs: ["ESP-MLLBM(-OVAK, ESP-MLLRM(-KFKK", "M2000"],
        nomFr: "Station de Travail Meibomask + Masques LM LLLT (Bleu 250/500, Rouge 500, 2000 Séances)",
        nomEn: "Meibomask Workstation + LM LLLT Masks (Blue 250/500, Red 500, 2000 Sessions)",
      });

      console.log("\n2. Eye-Light group (Station Nouvelle MDR + Lampe OPE IPL + Dermatology masks)");
      await mergeGroup(tx, {
        masterRef: "ESP-NMEWSA-FET5",
        mergeRefs: [
          "ESP-EDLLRM-HMZM, ESP-EDLLBM-TH1G, ESP-EDLLYM-8CVH, ESP-EDLLIM-OPLT",
          "ESP-EOIL(T-L03R",
        ],
        nomFr:
          "Station de Travail Eye-Light Nouvelle MDR (segments Antérieur + Postérieur) + Lampe Eye-Light OPE IPL (500) + Masque Dermatologie LM LLLT (Bleu / Rouge / Jaune / Infrarouge, 500 Traitements)",
        nomEn:
          "Eye-Light Nouvelle MDR Workstation (Anterior + Posterior segments) + Eye-Light OPE IPL Lamp (500) + Dermatology LM LLLT Mask (Blue / Red / Yellow / Infrared, 500 Treatments)",
      });
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 5C complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
