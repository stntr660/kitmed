require("dotenv").config({ path: ".env.staging" });
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MAPPING = JSON.parse(
  fs.readFileSync(path.join(__dirname, "icon-mapping.json"), "utf-8"),
);

const BRAND_SUBS = new Set(MAPPING.brand_subcategories_use_logo || []);

const SECTIONS = [
  "root_disciplines",
  "ophtalmologie_l2",
  "consultation_l3",
  "exploration_l3",
  "consommable_l3",
  "bloc_operatoire_l3",
  "verres_sub_l3",
  "orthopedics_l2",
  "mobilier_l2",
  "orl_l2",
];

async function main() {
  console.log("\n== Phase 8: Category icons as image_url ==\n");

  const updates = [];
  for (const section of SECTIONS) {
    const block = MAPPING[section];
    for (const slug of Object.keys(block)) {
      if (BRAND_SUBS.has(slug)) continue;
      updates.push({ slug, url: `/uploads/categories/${slug}.svg` });
    }
  }

  console.log(`Updating ${updates.length} categories`);

  await prisma.$transaction(
    async (tx) => {
      for (const { slug, url } of updates) {
        const cat = await tx.categories.findUnique({ where: { slug } });
        if (!cat) {
          console.log(`   [MISS] ${slug}`);
          continue;
        }
        await tx.categories.update({
          where: { id: cat.id },
          data: { image_url: url, updated_at: new Date() },
        });
      }
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log(`\n[OK] ${updates.length} category image_urls updated`);
  console.log("\n== Phase 8 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
