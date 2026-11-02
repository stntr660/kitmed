require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const FCI_LOGO_URL = "/uploads/partners/fci-logo.svg";
const HAAG_OCTOPUS_PDF = "/uploads/pdfs/haag-streit-octopus-compendium.pdf";

const FCI_PARTNER_SLUG = "fci";

async function main() {
  console.log("\n== Phase 5: FCI logo + Haag-Streit brochures ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Update FCI partner logo");
      await tx.partners.update({
        where: { slug: FCI_PARTNER_SLUG },
        data: { logo_url: FCI_LOGO_URL, updated_at: new Date() },
      });
      console.log(`   [LOGO] fci -> ${FCI_LOGO_URL}`);

      console.log("\n2. Attach Haag-Streit Octopus compendium to Octopus 900 + 600");
      for (const ref of ["HAAG-OCTOPUS-900", "7220001"]) {
        const result = await tx.products.updateMany({
          where: { reference_fournisseur: ref },
          data: { pdf_brochure_url: HAAG_OCTOPUS_PDF, updated_at: new Date() },
        });
        console.log(`   [PDF] ${ref}: ${result.count} row`);
      }
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 5 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
