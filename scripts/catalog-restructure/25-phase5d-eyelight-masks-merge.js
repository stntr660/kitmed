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

async function main() {
  console.log("\n== Phase 5D: Eye-Light masks merge (standard + AMD) ==\n");

  await prisma.$transaction(
    async (tx) => {
      const MASTER = "ESP-ELLBM(-WJUM, ESP-ELLYM(-040F, ESP-ELLRM(-H1CQ";
      const MERGE = "ESP-ELLRMY-KVW6";

      const master = await tx.products.findUnique({
        where: { reference_fournisseur: MASTER },
      });
      if (!master) throw new Error(`master not found`);

      const dup = await tx.products.findUnique({
        where: { reference_fournisseur: MERGE },
      });
      if (!dup) throw new Error(`dup not found`);

      const newRef = `${MASTER}, ${MERGE}`;
      await tx.products.update({
        where: { id: master.id },
        data: { reference_fournisseur: newRef, updated_at: new Date() },
      });

      const nomFr =
        "Masque Eye-Light LM LLLT — Bleu / Jaune (250 / 500 Traitements) / Rouge (500 Traitements) / Rouge + Jaune DMLA (25 cycles / 8 sessions / 200 traitements)";
      const nomEn =
        "Eye-Light LM LLLT Mask — Blue / Yellow (250 / 500 Treatments) / Red (500 Treatments) / Red + Yellow AMD (25 cycles / 8 sessions / 200 treatments)";

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
      console.log(`   [MERGE] refs: ${newRef}`);
      console.log(`           title: ${nomFr}`);

      await deleteProductCascade(tx, dup.id);
      console.log(`   [DEL-DUP] ${MERGE} (${dup.id})`);
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 5D complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
