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

async function setTitle(tx, productRef, nomFr, nomEn) {
  const p = await tx.products.findUnique({ where: { reference_fournisseur: productRef } });
  if (!p) {
    console.log(`   [MISS] ${productRef} not found`);
    return null;
  }
  for (const [lang, nom] of [["fr", nomFr], ["en", nomEn]]) {
    const t = await tx.product_translations.findFirst({
      where: { product_id: p.id, language_code: lang },
    });
    if (t) {
      await tx.product_translations.update({ where: { id: t.id }, data: { nom } });
    }
  }
  await tx.products.update({
    where: { id: p.id },
    data: { updated_at: new Date() },
  });
  console.log(`   [TITLE] ${productRef}: ${nomFr}`);
  return p.id;
}

async function consolidate(tx, { keepRef, deleteRefs, nomFr, nomEn }) {
  await setTitle(tx, keepRef, nomFr, nomEn);
  for (const ref of deleteRefs) {
    const dup = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
    if (!dup) {
      console.log(`   [MISS] dup ${ref} not found`);
      continue;
    }
    await deleteProductCascade(tx, dup.id);
    console.log(`   [DEL-DUP] ${ref} (${dup.id})`);
  }
}

async function main() {
  console.log("\n== Phase 2B: Product consolidations ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. YC-200 family (Système Laser YAG + S Plus)");
      await consolidate(tx, {
        keepRef: "YC-200",
        deleteRefs: ["YC-200-S-PLUS"],
        nomFr: "Système Laser YAG YC-200 / YC-200 S Plus",
        nomEn: "YC-200 / YC-200 S Plus YAG Laser System",
      });

      console.log("\n2. GYC-500 family (Green Laser Photocoagulator, Mono / Multi spot)");
      await consolidate(tx, {
        keepRef: "GYC-500",
        deleteRefs: ["GYC-500-VIXI"],
        nomFr: "Photocoagulateur Laser Vert GYC-500 / GYC-500 VIXI (Mono / Multi spot)",
        nomEn: "GYC-500 / GYC-500 VIXI Green Laser Photocoagulator (Mono / Multi spot)",
      });

      console.log("\n3. YLC-500 family");
      await consolidate(tx, {
        keepRef: "YLC-500",
        deleteRefs: ["YLC-500-VIXI"],
        nomFr: "Photodisrupteur YAG YLC-500 / YLC-500 VIXI",
        nomEn: "YLC-500 / YLC-500 VIXI YAG Photodisruptor",
      });

      console.log("\n4. Goldmann Applanation Tonometer family (AT 900 / BQ / R 900 / T 900)");
      await consolidate(tx, {
        keepRef: "7220531",
        deleteRefs: ["7200154", "7200033", "7200032"],
        nomFr: "Tonomètre à Aplanation Goldmann AT 900 / AT 900 BQ / R 900 / T 900",
        nomEn: "Goldmann Applanation Tonometer AT 900 / AT 900 BQ / R 900 / T 900",
      });

      console.log("\n5. ARK-1 family (already consolidated in title — delete archived duplicates)");
      for (const ref of ["ARK-1", "ARK-1a"]) {
        const dup = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
        if (dup) {
          await deleteProductCascade(tx, dup.id);
          console.log(`   [DEL-DUP] ${ref} (${dup.id})`);
        }
      }

      console.log("\n6. LM-1800 family (already consolidated in title)");
      const lm1800pd = await tx.products.findUnique({ where: { reference_fournisseur: "LM-1800PD" } });
      if (lm1800pd) {
        await deleteProductCascade(tx, lm1800pd.id);
        console.log(`   [DEL-DUP] LM-1800PD (${lm1800pd.id})`);
      }

      console.log("\n7. LM-7 family");
      await consolidate(tx, {
        keepRef: "LM-7",
        deleteRefs: ["LM-7P"],
        nomFr: "Frontofocomètre Automatique LM-7 / LM-7P",
        nomEn: "LM-7 / LM-7P Automatic Lensmeter",
      });

      console.log("\n8. Espansione count variants (merge 250 + 500 of same color)");
      await consolidate(tx, {
        keepRef: "ESP-ELLBM(-WJUM",
        deleteRefs: ["ESP-ELLBM(-FDIO"],
        nomFr: "Masque Bleu Eye-Light LM LLLT (250 / 500 Traitements)",
        nomEn: "Eye-Light LM LLLT Blue Mask (250 / 500 Treatments)",
      });
      await consolidate(tx, {
        keepRef: "ESP-ELLYM(-040F",
        deleteRefs: ["ESP-ELLYM(-BQ32"],
        nomFr: "Masque Jaune Eye-Light LM LLLT (250 / 500 Traitements)",
        nomEn: "Eye-Light LM LLLT Yellow Mask (250 / 500 Treatments)",
      });
      await consolidate(tx, {
        keepRef: "ESP-MLLBM(-OVAK",
        deleteRefs: ["ESP-MLLBM(-W05H"],
        nomFr: "Masque Bleu Meibomask LM LLLT (250 / 500 Traitements)",
        nomEn: "Meibomask LM LLLT Blue Mask (250 / 500 Treatments)",
      });
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 2B complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
