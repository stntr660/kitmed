require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const COUTEAUX_CAT_ID = "3fbcf977-9921-403d-bbb3-01c24504ef9e";
const OCULOPLASTIE_FCI_CAT_ID = "ee805e39-2bb1-4cdb-adb6-a6ebeb7fdb56";
const SKEEPENS_CAT_ID = "79aba79d-0f96-4a68-9c23-f21f95168376";

const FCI_PARTNER_ID = "588ba503-6949-406b-82c6-6670f3c32692";
const MORIA_PARTNER_ID = "a378183d-07d2-4f52-aa4d-ddbcf205cc97";
const HEINE_PARTNER_ID = "5622c568-5df3-4169-94f3-fb62e952c37f";
const OCULAR_PARTNER_ID = "316d7982-4ea8-49d6-b82a-230b1357ed7c";

const SHARPOINT_LOGO_URL = "/uploads/partners/sharpoint-logo.webp";
const SHARPOINT_BLADES_IMAGE = "/uploads/products/sharpoint-blades.webp";
const COUTEAUX_CAT_IMAGE = "/uploads/categories/sharpoint-blades.webp";
const FCI_OCULOPLASTIE_PDF = "/uploads/pdfs/fci-oculoplastie-catalog.pdf";
const MORIA_PDF = "/uploads/partners/moria-reusable-instruments-2023.pdf";
const OCULAR_PDF = "/uploads/pdfs/ocular-product-catalog.pdf";
const HEINE_OMEGA_600_PDF = "/uploads/pdfs/heine-omega-600-brochure.pdf";

async function upsertPartner(tx, { slug, nameFr, nameEn, logoUrl, defaultPdfUrl, website }) {
  const existing = await tx.partners.findUnique({ where: { slug } });
  if (existing) {
    const data = {};
    if (logoUrl && !existing.logo_url) data.logo_url = logoUrl;
    if (defaultPdfUrl) data.default_pdf_url = defaultPdfUrl;
    if (Object.keys(data).length) {
      data.updated_at = new Date();
      await tx.partners.update({ where: { id: existing.id }, data });
      console.log(`   [PART] ${slug} updated (${Object.keys(data).filter(k => k !== "updated_at").join(", ")})`);
    } else {
      console.log(`   [PART] ${slug} already complete`);
    }
    return existing.id;
  }
  const id = randomUUID();
  await tx.partners.create({
    data: {
      id,
      name: nameFr,
      slug,
      website_url: website || null,
      logo_url: logoUrl || null,
      default_pdf_url: defaultPdfUrl || null,
      type: "manufacturer",
      is_featured: false,
      sort_order: 99,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
      partner_translations: {
        create: [
          { id: randomUUID(), language_code: "fr", name: nameFr, description: "" },
          { id: randomUUID(), language_code: "en", name: nameEn, description: "" },
        ],
      },
    },
  });
  console.log(`   [PART] Created partner ${slug} (${id})`);
  return id;
}

async function upsertProduct(tx, { ref, constructeur, slug, categoryId, partnerId, pdfUrl, imageUrl, nameFr, nameEn, descFr, descEn, sortOrder = 1 }) {
  const existing = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
  if (existing) {
    console.log(`   [PROD] ${ref} already exists (${existing.id}) — skipping create`);
    return existing.id;
  }
  const id = `custom-${Date.now()}-${randomUUID().slice(0, 8)}`;
  await tx.products.create({
    data: {
      id,
      reference_fournisseur: ref,
      category_id: categoryId,
      constructeur,
      slug,
      status: "active",
      is_featured: false,
      sort_order: sortOrder,
      pdf_brochure_url: pdfUrl || null,
      partner_id: partnerId || null,
      created_at: new Date(),
      updated_at: new Date(),
      product_translations: {
        create: [
          {
            id: randomUUID(),
            language_code: "fr",
            nom: nameFr,
            description: descFr || "",
          },
          {
            id: randomUUID(),
            language_code: "en",
            nom: nameEn,
            description: descEn || "",
          },
        ],
      },
    },
  });
  if (imageUrl) {
    await tx.product_media.create({
      data: {
        id: randomUUID(),
        product_id: id,
        type: "image",
        url: imageUrl,
        alt_text: nameFr,
        title: nameFr,
        sort_order: 0,
        is_primary: true,
        created_at: new Date(),
      },
    });
  }
  console.log(`   [PROD] Created ${ref} (${id})`);
  return id;
}

async function main() {
  console.log("\n== Phase 1D: Assets + new products ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Upsert brand partners");
      await upsertPartner(tx, {
        slug: "sharpoint",
        nameFr: "SharPoint",
        nameEn: "SharPoint",
        logoUrl: SHARPOINT_LOGO_URL,
        website: "https://surgicalspecialties.com/brands/sharpoint/",
      });
      await upsertPartner(tx, {
        slug: "moria",
        nameFr: "Moria",
        nameEn: "Moria",
        defaultPdfUrl: MORIA_PDF,
      });
      await upsertPartner(tx, {
        slug: "ocular",
        nameFr: "Ocular Instruments",
        nameEn: "Ocular Instruments",
        defaultPdfUrl: OCULAR_PDF,
      });

      console.log("\n2. Set Couteaux category image");
      await tx.categories.update({
        where: { id: COUTEAUX_CAT_ID },
        data: { image_url: COUTEAUX_CAT_IMAGE, updated_at: new Date() },
      });
      console.log(`   [CAT] Couteaux image set`);

      console.log("\n3. Create SharPoint product in Couteaux");
      const sharpointPartnerId = (await tx.partners.findUnique({ where: { slug: "sharpoint" } })).id;
      await upsertProduct(tx, {
        ref: "SHARPOINT-BLADES",
        constructeur: "SharPoint",
        slug: "sharpoint-ophthalmic-blades-knives",
        categoryId: COUTEAUX_CAT_ID,
        partnerId: sharpointPartnerId,
        imageUrl: SHARPOINT_BLADES_IMAGE,
        nameFr: "Lames et Couteaux Ophtalmiques SharPoint",
        nameEn: "SharPoint Ophthalmic Blades & Knives",
        descFr: "Gamme complete de lames et couteaux ophtalmiques SharPoint a usage unique pour la chirurgie de la cataracte et les interventions sur le segment anterieur.",
        descEn: "Complete range of single-use SharPoint ophthalmic blades and knives for cataract surgery and anterior segment procedures.",
      });

      console.log("\n4. Create FCI Oculoplastie product");
      await upsertProduct(tx, {
        ref: "FCI-OCULOPLASTIE-KIT",
        constructeur: "FCI",
        slug: "fci-oculoplastie-surgical-instruments",
        categoryId: OCULOPLASTIE_FCI_CAT_ID,
        partnerId: FCI_PARTNER_ID,
        pdfUrl: FCI_OCULOPLASTIE_PDF,
        nameFr: "Instruments Chirurgicaux FCI - Oculoplastie",
        nameEn: "FCI Oculoplastie Surgical Instruments",
        descFr: "Catalogue complet des instruments FCI pour la chirurgie oculoplastique et de la retine : instruments de dissection, sutures, implants et dispositifs reutilisables. Consultez le catalogue PDF pour la reference complete.",
        descEn: "Complete FCI catalogue of surgical instruments for oculoplastic and retinal surgery: dissection instruments, sutures, implants, and reusable devices. See attached PDF for full reference.",
      });

      console.log("\n5. Create Heine OMEGA 600 product in Skeepens");
      await upsertProduct(tx, {
        ref: "HEINE-OMEGA-600",
        constructeur: "HEINE",
        slug: "heine-omega-600-indirect-ophthalmoscope",
        categoryId: SKEEPENS_CAT_ID,
        partnerId: HEINE_PARTNER_ID,
        pdfUrl: HEINE_OMEGA_600_PDF,
        nameFr: "Ophtalmoscope Indirect Binoculaire HEINE OMEGA 600",
        nameEn: "HEINE OMEGA 600 Binocular Indirect Ophthalmoscope",
        descFr: "Ophtalmoscope indirect binoculaire HEINE OMEGA 600 avec eclairage LED de haute puissance et optique de precision pour l'examen de la retine.",
        descEn: "HEINE OMEGA 600 binocular indirect ophthalmoscope with high-power LED illumination and precision optics for retinal examination.",
      });
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 1D complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
