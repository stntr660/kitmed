require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const HEINE_PARTNER_ID = "5622c568-5df3-4169-94f3-fb62e952c37f";
const OPHTALMOSCOPE_SUBCAT_ID = "104a9ac2-ddb2-4f92-ba51-f65bbda657f8";
const TOPOGRAPHIE_CAT_ID = "54effae5-ffbd-4a20-8c67-682e9c88ed55";
const EYESTAR_900_PRODUCT_ID = "e7429d79-b881-4e67-acbd-f97e1fc9acaa";
const HYLO_DUAL_INTENSE_ID = "cb364d27-335e-4b40-b3a1-7a5f21982001";

const HYLO_NEW_IMAGE = "/uploads/products/hylo-dual-intense.webp";

async function main() {
  console.log("\n== Phase 3: HYLO image + Heine BETA 200S + Topography + Biometrie attrs ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Swap HYLO DUAL INTENSE primary image");
      await tx.product_media.deleteMany({
        where: { product_id: HYLO_DUAL_INTENSE_ID, is_primary: true },
      });
      await tx.product_media.create({
        data: {
          id: randomUUID(),
          product_id: HYLO_DUAL_INTENSE_ID,
          type: "image",
          url: HYLO_NEW_IMAGE,
          alt_text: "HYLO DUAL INTENSE",
          title: "HYLO DUAL INTENSE Collyre",
          sort_order: 0,
          is_primary: true,
          created_at: new Date(),
        },
      });
      console.log(`   [IMG] HYLO DUAL INTENSE -> ${HYLO_NEW_IMAGE}`);

      console.log("\n2. Create HEINE BETA 200S LED (missing from range)");
      const existing = await tx.products.findUnique({
        where: { reference_fournisseur: "HEINE-BETA-200S-LED" },
      });
      if (existing) {
        console.log(`   [SKIP] already exists (${existing.id})`);
      } else {
        const id = `custom-${Date.now()}-${randomUUID().slice(0, 8)}`;
        await tx.products.create({
          data: {
            id,
            reference_fournisseur: "HEINE-BETA-200S-LED",
            category_id: OPHTALMOSCOPE_SUBCAT_ID,
            constructeur: "heine",
            slug: "heine-beta-200s-led-ophthalmoscope",
            status: "active",
            is_featured: false,
            sort_order: 2,
            partner_id: HEINE_PARTNER_ID,
            created_at: new Date(),
            updated_at: new Date(),
            product_translations: {
              create: [
                {
                  id: randomUUID(),
                  language_code: "fr",
                  nom: "Ophtalmoscope HEINE BETA 200S LED",
                  description: "Ophtalmoscope direct HEINE BETA 200S LED, conçu pour l'examen des petites pupilles. Durabilité exceptionnelle et optique de haute précision.",
                },
                {
                  id: randomUUID(),
                  language_code: "en",
                  nom: "HEINE BETA 200S LED Ophthalmoscope",
                  description: "HEINE BETA 200S LED direct ophthalmoscope, designed for small-pupil examination. Outstanding durability with high-precision optics.",
                },
              ],
            },
          },
        });
        console.log(`   [PROD] HEINE BETA 200S LED created (${id})`);
      }

      console.log("\n3. Move EYESTAR 900 from OCT -> Topography");
      await tx.products.update({
        where: { id: EYESTAR_900_PRODUCT_ID },
        data: { category_id: TOPOGRAPHIE_CAT_ID, updated_at: new Date() },
      });
      console.log(`   [MOV] EYESTAR 900 -> topographie`);

      console.log("\n4. Biometrie designation attributes (Contact vs Non-contact)");
      const biometrieDesigns = [
        { ref: "AL-SCAN", type: "Sans contact" },
        { ref: "1009001", type: "Sans contact" },
        { ref: "US-4000", type: "Contact / Multi-contact" },
      ];
      for (const { ref, type } of biometrieDesigns) {
        const p = await tx.products.findUnique({
          where: { reference_fournisseur: ref },
        });
        if (!p) {
          console.log(`   [MISS] ${ref}`);
          continue;
        }
        await tx.product_attributes.deleteMany({
          where: { product_id: p.id, name: "Designation" },
        });
        await tx.product_attributes.create({
          data: {
            id: randomUUID(),
            product_id: p.id,
            name: "Designation",
            value: type,
            type: "text",
            sort_order: 1,
          },
        });
        console.log(`   [ATTR] ${ref}: Designation=${type}`);
      }
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 3 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
