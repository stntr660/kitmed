require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PDF_MAP = {
  "BI-900": "/uploads/pdfs/haag-bi900-ifu.pdf",
  "BM-900": "/uploads/pdfs/haag-bm900-brochure.pdf",
  "BQ-900": "/uploads/pdfs/haag-bq900-brochure.pdf",
  "S390I": "/uploads/pdfs/mediworks-s390-brochure.pdf",
};

const MINI3000_MASTER = "D-001.71.120, D-002.71.120, D-008.71.120, D-008.71.220, D-886.11.021, D-886.11.022";
const MINI3000_DUP = "D-886.11.021, D-886.11.022";

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function main() {
  console.log("\n== Phase 7: slit lamp PDFs + Mini 3000 merge ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Attach PDFs to slit lamp products");
      for (const [ref, url] of Object.entries(PDF_MAP)) {
        const r = await tx.products.updateMany({
          where: { reference_fournisseur: ref },
          data: { pdf_brochure_url: url, updated_at: new Date() },
        });
        console.log(`   [PDF] ${ref} <- ${url}  (${r.count} row)`);
      }

      console.log("\n2. Consolidate Mini 3000 Diagnostic Set -> standalone Ophthalmoscope");
      const master = await tx.products.findUnique({
        where: { reference_fournisseur: MINI3000_MASTER },
      });
      const dup = await tx.products.findUnique({
        where: { reference_fournisseur: MINI3000_DUP },
      });
      if (!master || !dup) throw new Error(`mini3000 master=${!!master} dup=${!!dup}`);

      const nomFr = "Ophtalmoscope HEINE Mini 3000 LED (+ Ensemble Diagnostique avec Otoscope)";
      const nomEn = "HEINE Mini 3000 LED Ophthalmoscope (+ Diagnostic Set with Otoscope)";
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
      await tx.products.update({
        where: { id: master.id },
        data: { updated_at: new Date() },
      });
      console.log(`   [TITLE] ${nomFr}`);

      await deleteProductCascade(tx, dup.id);
      console.log(`   [DEL-DUP] ${MINI3000_DUP} (${dup.id})`);
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 7 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
