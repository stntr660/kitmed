const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-02 -- client feedback: remove the partners « SIEM BIOMEDICAL » and
 * « LED » from the site. Status -> inactive (hidden from the partners page and
 * the logo strip). Neither has an active product (SIEM 1, LED 23, all inactive).
 *
 * REVERT POINT: on 2026-11-02 both were active; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 71-hide-siem-led.js <app>:/tmp/71.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/71.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/71.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/71.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const PARTNERS = {
  "siem-biomedical": { before: "active", after: "inactive" },
  "led":             { before: "active", after: "inactive" },
};

async function main() {
  for (const [slug, { before, after }] of Object.entries(PARTNERS)) {
    const target = REVERT ? before : after;
    const row = await prisma.partners.findUnique({ where: { slug } });
    if (!row) { console.log(`  [MISSING PARTNER] ${slug}`); continue; }
    if (row.status === target) { console.log(`  [SKIP] partner ${slug}`); continue; }
    console.log(`  partner ${slug.padEnd(36)} ${row.status} -> ${target}`);
    if (APPLY || REVERT) await prisma.partners.update({ where: { id: row.id }, data: { status: target, updated_at: new Date() } });
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
