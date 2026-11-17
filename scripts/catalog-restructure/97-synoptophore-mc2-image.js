const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- owner: the MC2 synoptophore photo was wrong; the new official photo must be
 * used everywhere the synoptophore appears:
 *   - product « Synoptophore » MC2 (main image),
 *   - Orthoptie > « Synoptophore et tables » tile (collage rebuilt: new synoptophore + the 3 tables),
 *   - Ophtalmologie « Synoptophore » category tile (the two heads, 3:1).
 * No banner uses it. The INAMI « Synoptophore LED » product (another brand) keeps its own photo.
 * Files (copied into the staging uploads volume before --apply):
 *   products/mc2-synoptophore-97.jpg, categories/mc2-tile-synoptophore-tables-97.jpg,
 *   categories/oph-synoptophore-97.jpg
 *
 * REVERT POINT: the previous URLs below; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 97-synoptophore-mc2-image.js <app>:/tmp/97.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/97.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/97.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/97.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

const MEDIA = {
  "d93a0001-0000-4000-8000-000000000001-m93": ["/uploads/products/mc2-synoptophore.jpg", "/uploads/products/mc2-synoptophore-97.jpg"],
};
const CATEGORIES = {
  "mc2-synoptophore-tables": ["/uploads/categories/mc2-tile-synoptophore-tables.jpg", "/uploads/categories/mc2-tile-synoptophore-tables-97.jpg"],
  "synoptophore": ["/uploads/categories/oph-synoptophore.jpg", "/uploads/categories/oph-synoptophore-97.jpg"],
};

async function main() {
  for (const [id, urls] of Object.entries(MEDIA)) {
    const m = await prisma.product_media.findUnique({ where: { id } });
    if (!m) { console.log(`  [MISSING] media ${id}`); continue; }
    console.log(`  media ${id}: ${m.url} -> ${pick(urls)}`);
    if (WRITE && m.url !== pick(urls)) await prisma.product_media.update({ where: { id }, data: { url: pick(urls) } });
  }
  for (const [slug, urls] of Object.entries(CATEGORIES)) {
    const c = await prisma.categories.findUnique({ where: { slug } });
    if (!c) { console.log(`  [MISSING] category ${slug}`); continue; }
    console.log(`  category ${slug}: ${c.image_url} -> ${pick(urls)}`);
    if (WRITE && c.image_url !== pick(urls)) await prisma.categories.update({ where: { slug }, data: { image_url: pick(urls), updated_at: new Date() } });
  }
  if (!WRITE) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
