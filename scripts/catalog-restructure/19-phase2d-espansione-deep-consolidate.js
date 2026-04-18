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

async function mergeFamily(tx, { keepRef, mergeRefs, newRefValue, nomFr, nomEn }) {
  const master = await tx.products.findUnique({ where: { reference_fournisseur: keepRef } });
  if (!master) {
    console.log(`   [MISS] master ${keepRef} not found`);
    return;
  }

  const dups = [];
  for (const ref of mergeRefs) {
    const d = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
    if (d) dups.push(d);
  }

  const allRefs = [keepRef, ...dups.map((d) => d.reference_fournisseur)];
  const joined = newRefValue || allRefs.join(", ");

  await tx.products.update({
    where: { id: master.id },
    data: { reference_fournisseur: joined, updated_at: new Date() },
  });

  for (const lang of ["fr", "en"]) {
    const nom = lang === "fr" ? nomFr : nomEn;
    const t = await tx.product_translations.findFirst({
      where: { product_id: master.id, language_code: lang },
    });
    if (t) {
      await tx.product_translations.update({ where: { id: t.id }, data: { nom } });
    }
  }

  console.log(`   [MERGE] master=${joined}`);
  console.log(`           title: ${nomFr}`);

  for (const d of dups) {
    await deleteProductCascade(tx, d.id);
    console.log(`           [DEL-DUP] ${d.reference_fournisseur} (${d.id})`);
  }
}

async function main() {
  console.log("\n== Phase 2D: Espansione deep consolidation ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Eye-Light Standard (merge Red into existing Blue+Yellow master)");
      await mergeFamily(tx, {
        keepRef: "ESP-ELLBM(-WJUM",
        mergeRefs: ["ESP-ELLYM(-040F", "ESP-ELLRM(-H1CQ"],
        nomFr: "Masque Eye-Light LM LLLT — Bleu / Jaune (250 / 500 Traitements) / Rouge (500 Traitements)",
        nomEn: "Eye-Light LM LLLT Mask — Blue / Yellow (250 / 500 Treatments) / Red (500 Treatments)",
      });

      console.log("\n2. Eye-Light Dermatology (merge 4 colors into one)");
      await mergeFamily(tx, {
        keepRef: "ESP-EDLLRM-HMZM",
        mergeRefs: ["ESP-EDLLBM-TH1G", "ESP-EDLLYM-8CVH", "ESP-EDLLIM-OPLT"],
        nomFr: "Masque Dermatologie Eye-Light LM LLLT — Bleu / Rouge / Jaune / Infrarouge (500 Traitements)",
        nomEn: "Eye-Light LM LLLT Dermatology Mask — Blue / Red / Yellow / Infrared (500 Treatments)",
      });

      console.log("\n3. Meibomask (merge Red 500 into Blue master)");
      await mergeFamily(tx, {
        keepRef: "ESP-MLLBM(-OVAK",
        mergeRefs: ["ESP-MLLRM(-KFKK"],
        nomFr: "Masque Meibomask LM LLLT — Bleu (250 / 500 Traitements) / Rouge (500 Traitements)",
        nomEn: "Meibomask LM LLLT Mask — Blue (250 / 500 Treatments) / Red (500 Treatments)",
      });
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 2D complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
