const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-27 -- ACCUTOME is no longer shown as a partner
 * (status -> inactive, no active product).
 *
 * A first version also put drawn icons on the Orthopédie and Dispositifs
 * médicaux homepage cards; the client meant the partners page strip
 * (KneeSupport / EyeDrops in src/components/icons), so those two cards were
 * put back to orthopedics-photo.jpg / dispositifs-medicaux-photo.jpg.
 *
 * REVERT POINT: --revert sets ACCUTOME back to active.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 67-accutome-hidden.js <app>:/tmp/67.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const PARTNERS = {
  "accutome": { before: "active", after: "inactive" },
};
const IMAGES = {};

async function main() {
  for (const [slug, { before, after }] of Object.entries(PARTNERS)) {
    const target = REVERT ? before : after;
    const row = await prisma.partners.findUnique({ where: { slug } });
    if (!row) { console.log(`  [MISSING PARTNER] ${slug}`); continue; }
    if (row.status === target) { console.log(`  [SKIP] partner ${slug}`); continue; }
    console.log(`  partner ${slug.padEnd(24)} ${row.status} -> ${target}`);
    if (APPLY || REVERT) await prisma.partners.update({ where: { id: row.id }, data: { status: target, updated_at: new Date() } });
  }

  for (const [slug, { before, after }] of Object.entries(IMAGES)) {
    const target = REVERT ? before : after;
    if (!fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) {
      console.log(`  [MISSING FILE] ${slug} ${target}`);
      continue;
    }
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (cat.image_url === target) { console.log(`  [SKIP] category ${slug}`); continue; }
    console.log(`  category ${slug.padEnd(23)} ${cat.image_url} -> ${target}`);
    if (APPLY || REVERT) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
