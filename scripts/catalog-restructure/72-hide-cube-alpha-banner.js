const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-02 -- client feedback: remove the Cube α banner from the homepage
 * slider. The banner (created by script 69) is set inactive, not deleted;
 * the Cube α product itself is not touched.
 *
 * REVERT POINT: on 2026-11-02 the banner was active; --revert reactivates it.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 72-hide-cube-alpha-banner.js <app>:/tmp/72.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/72.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/72.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/72.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const BANNER_ID = "b69a0001-0000-4000-8000-000000000004"; // cube-alpha-slider-wide.png

async function main() {
  const target = REVERT;
  const row = await prisma.banners.findUnique({ where: { id: BANNER_ID } });
  if (!row) console.log(`  [MISSING BANNER] ${BANNER_ID}`);
  else if (row.is_active === target) console.log(`  [SKIP] banner Cube α`);
  else {
    console.log(`  banner Cube α  is_active ${row.is_active} -> ${target}`);
    if (APPLY || REVERT) await prisma.banners.update({ where: { id: BANNER_ID }, data: { is_active: target, updated_at: new Date() } });
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
