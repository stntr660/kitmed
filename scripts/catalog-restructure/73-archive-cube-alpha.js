const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-02 -- client feedback: hide the Cube α product from the site.
 * Status -> archived (same as script 64 on 2026-10-27), nothing deleted:
 * texts, photo, brochure and the new-arrival flag stay in the database.
 *
 * REVERT POINT: on 2026-11-02 the product was active; --revert reactivates it.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 73-archive-cube-alpha.js <app>:/tmp/73.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/73.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/73.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/73.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const PRODUCTS = {
  "nidek-cube-alpha-cv-9000-cv-9000": { before: "active", after: "archived" },
};

async function main() {
  for (const [slug, { before, after }] of Object.entries(PRODUCTS)) {
    const target = REVERT ? before : after;
    const row = await prisma.products.findUnique({ where: { slug } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${slug}`); continue; }
    if (row.status === target) { console.log(`  [SKIP] product ${slug}`); continue; }
    console.log(`  product ${slug.padEnd(36)} ${row.status} -> ${target}`);
    if (APPLY || REVERT) await prisma.products.update({ where: { id: row.id }, data: { status: target, updated_at: new Date() } });
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
