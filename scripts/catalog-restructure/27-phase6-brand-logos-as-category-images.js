require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const LAMPE_BRAND_MAP = [
  { catSlug: "haag-streit", partnerSlug: "haag-streit" },
  { catSlug: "keeler", partnerSlug: "keeler" },
  { catSlug: "mediworks", partnerSlug: "mediworks" },
];

async function main() {
  console.log("\n== Phase 6: Brand logos as lampe-a-fente sub-category images ==\n");

  await prisma.$transaction(
    async (tx) => {
      const parent = await tx.categories.findUnique({ where: { slug: "lampe-a-fente" } });

      for (const { catSlug, partnerSlug } of LAMPE_BRAND_MAP) {
        const cat = await tx.categories.findFirst({
          where: { slug: catSlug, parent_id: parent.id },
        });
        if (!cat) {
          console.log(`   [MISS] sub-category "${catSlug}" under lampe-a-fente not found`);
          continue;
        }
        const partner = await tx.partners.findUnique({ where: { slug: partnerSlug } });
        if (!partner?.logo_url) {
          console.log(`   [MISS] partner "${partnerSlug}" has no logo_url`);
          continue;
        }
        await tx.categories.update({
          where: { id: cat.id },
          data: { image_url: partner.logo_url, updated_at: new Date() },
        });
        console.log(`   [LOGO] ${catSlug} -> ${partner.logo_url}`);
      }
    },
    { timeout: 30000, maxWait: 5000 },
  );

  console.log("\n== Phase 6 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
