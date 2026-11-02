require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MASTER_REF = "ESP-MW-MG3L";
const MERGE_REFS = ["ESP-MLLRM(-6A87"];

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function main() {
  console.log("\n== Phase 5B: My-Mask consolidation ==\n");

  await prisma.$transaction(
    async (tx) => {
      const master = await tx.products.findUnique({
        where: { reference_fournisseur: MASTER_REF },
      });
      if (!master) throw new Error(`master ${MASTER_REF} not found`);

      const dups = [];
      for (const ref of MERGE_REFS) {
        const d = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
        if (d) dups.push(d);
      }

      const joinedRef = [MASTER_REF, ...dups.map((d) => d.reference_fournisseur)].join(", ");
      await tx.products.update({
        where: { id: master.id },
        data: { reference_fournisseur: joinedRef, updated_at: new Date() },
      });

      const nomFr = "Station de Travail My-Mask + Masque Rouge My-Mask LM LLLT (250 Traitements)";
      const nomEn = "My-Mask Workstation + My-Mask LM LLLT Red Mask (250 Treatments)";

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
      console.log(`   [MERGE] master refs: ${joinedRef}`);
      console.log(`           title: ${nomFr}`);

      for (const d of dups) {
        await deleteProductCascade(tx, d.id);
        console.log(`   [DEL-DUP] ${d.reference_fournisseur} (${d.id})`);
      }
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 5B complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
