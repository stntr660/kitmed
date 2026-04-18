require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const HEINE_PARTNER_ID = "5622c568-5df3-4169-94f3-fb62e952c37f";
const OPHTALMOSCOPE_SUBCAT_ID = "104a9ac2-ddb2-4f92-ba51-f65bbda657f8";
const SKEEPENS_SUBCAT_ID = "79aba79d-0f96-4a68-9c23-f21f95168376";

const UNARCHIVE_TO_OPHTALMOSCOPE = [
  { id: "17a11d68-2725-4c4d-acf1-6fc5abbe0d57", name: "Ophtalmoscope Beta 200 LED" },
  { id: "ad0edaa4-cfb9-4b54-84c9-ff8d4545f29e", name: "Ophtalmoscope Mini 3000 LED" },
  { id: "a3e2d935-c5bb-4630-afb0-43b6a2874d83", name: "Ensemble Diagnostique Beta 200 LED" },
  { id: "725aa72d-d0d8-41d9-891b-9feebf36e17e", name: "Ensemble Diagnostique Mini 3000 LED" },
];

const UNARCHIVE_TO_SKEEPENS = [
  { id: "9f59a846-94a2-4841-b03e-20847d57b575", name: "Ophtalmoscope Indirect Binoculaire Omega 500 LED" },
];

const DELETE_OLD_OMEGA_600 = "0cb46485-cf7d-4ae5-8187-dfe4fc326c9a";

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function main() {
  console.log("\n== Phase 2C: Heine un-archive + recategorize ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Un-archive + move to Ophtalmoscope subcategory");
      for (const p of UNARCHIVE_TO_OPHTALMOSCOPE) {
        await tx.products.update({
          where: { id: p.id },
          data: {
            status: "active",
            category_id: OPHTALMOSCOPE_SUBCAT_ID,
            partner_id: HEINE_PARTNER_ID,
            updated_at: new Date(),
          },
        });
        console.log(`   [UNARCH] ${p.name}`);
      }

      console.log("\n2. Un-archive + move to Skeepens subcategory");
      for (const p of UNARCHIVE_TO_SKEEPENS) {
        await tx.products.update({
          where: { id: p.id },
          data: {
            status: "active",
            category_id: SKEEPENS_SUBCAT_ID,
            partner_id: HEINE_PARTNER_ID,
            updated_at: new Date(),
          },
        });
        console.log(`   [UNARCH] ${p.name}`);
      }

      console.log("\n3. Delete old archived Omega 600 (HEINE-OMEGA-600 is the new master)");
      await deleteProductCascade(tx, DELETE_OLD_OMEGA_600);
      console.log(`   [DEL] old Omega 600 record (${DELETE_OLD_OMEGA_600})`);
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 2C complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
