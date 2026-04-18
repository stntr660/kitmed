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

async function mergeOne(tx, { masterRef, mergeRef, nomFr, nomEn }) {
  const master = await tx.products.findUnique({ where: { reference_fournisseur: masterRef } });
  const dup = await tx.products.findUnique({ where: { reference_fournisseur: mergeRef } });
  if (!master || !dup) throw new Error(`missing master=${!!master} dup=${!!dup}`);

  const newRef = `${masterRef}, ${mergeRef}`;
  await tx.products.update({
    where: { id: master.id },
    data: { reference_fournisseur: newRef, updated_at: new Date() },
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
  console.log(`   [MERGE] ${newRef}`);
  console.log(`           title: ${nomFr}`);

  await deleteProductCascade(tx, dup.id);
  console.log(`   [DEL-DUP] ${mergeRef} (${dup.id})`);
}

async function main() {
  console.log("\n== Phase 5E: Final Dry Eye merges ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. My-Mask base device -> Station My-Mask");
      await mergeOne(tx, {
        masterRef: "ESP-MW-MG3L, ESP-MLLRM(-6A87",
        mergeRef: "MYMASK",
        nomFr:
          "Station de Travail My-Mask + Masque LM LLLT Photobiomodulation + Masque Rouge (250 Traitements)",
        nomEn:
          "My-Mask Workstation + LM LLLT Photobiomodulation Mask + Red Mask (250 Treatments)",
      });

      console.log("\n2. Pack Diagnostic Me-Check -> ME-CHECK Module");
      await mergeOne(tx, {
        masterRef: "MECHECK",
        mergeRef: "ESP-MDP-IGGW",
        nomFr: "ME-CHECK Module de Dépistage MGD + Pack Diagnostic",
        nomEn: "ME-CHECK MGD Screening Module + Diagnostic Pack",
      });
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 5E complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
