require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const SHARPOINT_PRODUCT_REF = "SHARPOINT-BLADES";
const SHARPOINT_PARTNER_SLUG = "sharpoint";
const UNIQUETECH_PRODUCT_REF = "UNIQUETECH-COUTEAUX";
const UNIQUETECH_IMAGE_URL = "/uploads/products/uniquetech-blades.webp";
const UNIQUETECH_CATALOG_PDF = "/uploads/pdfs/uniquetech-knives-catalog.pdf";
const UNIQUETECH_LOGO_URL = "/uploads/products/uniquetech-blades.webp";
const ESPANSIONE_PARTNER_SLUG = "espansione-marketing";

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function main() {
  console.log("\n== Phase 2A: Assets + cleanup ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Delete SHARPOINT product + partner");
      const sp = await tx.products.findUnique({
        where: { reference_fournisseur: SHARPOINT_PRODUCT_REF },
      });
      if (sp) {
        await deleteProductCascade(tx, sp.id);
        console.log(`   [DEL] product SHARPOINT-BLADES (${sp.id})`);
      } else {
        console.log(`   [SKIP] SHARPOINT-BLADES product not found`);
      }
      const spPartner = await tx.partners.findUnique({
        where: { slug: SHARPOINT_PARTNER_SLUG },
      });
      if (spPartner) {
        await tx.partner_translations.deleteMany({
          where: { partner_id: spPartner.id },
        });
        await tx.partners.delete({ where: { id: spPartner.id } });
        console.log(`   [DEL] partner sharpoint (${spPartner.id})`);
      }

      console.log("\n2. Create/update UniqueTech partner");
      let utPartner = await tx.partners.findUnique({ where: { slug: "uniquetech" } });
      if (!utPartner) {
        const id = randomUUID();
        await tx.partners.create({
          data: {
            id,
            name: "Uniquetech",
            slug: "uniquetech",
            logo_url: UNIQUETECH_LOGO_URL,
            default_pdf_url: UNIQUETECH_CATALOG_PDF,
            type: "manufacturer",
            is_featured: false,
            sort_order: 99,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
            partner_translations: {
              create: [
                {
                  id: randomUUID(),
                  language_code: "fr",
                  name: "Uniquetech",
                  description: "Fabricant de couteaux chirurgicaux ophtalmiques a usage unique.",
                },
                {
                  id: randomUUID(),
                  language_code: "en",
                  name: "Uniquetech",
                  description: "Manufacturer of single-use ophthalmic surgical knives.",
                },
              ],
            },
          },
        });
        utPartner = await tx.partners.findUnique({ where: { slug: "uniquetech" } });
        console.log(`   [PART] created uniquetech (${utPartner.id})`);
      } else {
        await tx.partners.update({
          where: { id: utPartner.id },
          data: {
            logo_url: UNIQUETECH_LOGO_URL,
            default_pdf_url: UNIQUETECH_CATALOG_PDF,
            updated_at: new Date(),
          },
        });
        console.log(`   [PART] uniquetech updated with logo + pdf`);
      }

      console.log("\n3. Attach image + PDF to UniqueTech product");
      const utProduct = await tx.products.findUnique({
        where: { reference_fournisseur: UNIQUETECH_PRODUCT_REF },
      });
      if (!utProduct) throw new Error("UNIQUETECH-COUTEAUX product not found");

      await tx.products.update({
        where: { id: utProduct.id },
        data: {
          pdf_brochure_url: UNIQUETECH_CATALOG_PDF,
          partner_id: utPartner.id,
          updated_at: new Date(),
        },
      });
      await tx.product_media.deleteMany({
        where: { product_id: utProduct.id, is_primary: true },
      });
      await tx.product_media.create({
        data: {
          id: randomUUID(),
          product_id: utProduct.id,
          type: "image",
          url: UNIQUETECH_IMAGE_URL,
          alt_text: "Couteaux Chirurgicaux Uniquetech",
          title: "Couteaux Chirurgicaux Uniquetech",
          sort_order: 0,
          is_primary: true,
          created_at: new Date(),
        },
      });
      console.log(`   [PROD] UniqueTech image + PDF + partner_id attached`);

      console.log("\n4. Propagate Espansione brochure to all Espansione products without a PDF");
      const esp = await tx.partners.findUnique({
        where: { slug: ESPANSIONE_PARTNER_SLUG },
      });
      const espProducts = await tx.products.findMany({
        where: {
          OR: [
            { partner_id: esp?.id },
            { constructeur: "espansione-marketing" },
          ],
          pdf_brochure_url: null,
        },
        select: { id: true, reference_fournisseur: true },
      });
      let updated = 0;
      for (const p of espProducts) {
        await tx.products.update({
          where: { id: p.id },
          data: {
            pdf_brochure_url: esp.default_pdf_url,
            partner_id: esp.id,
            updated_at: new Date(),
          },
        });
        updated++;
      }
      console.log(`   [ESP] ${updated} Espansione products now reference brochure`);
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 2A complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
