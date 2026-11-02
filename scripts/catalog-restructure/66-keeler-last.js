const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-28 -- Keeler at the end of the partners list (client request:
 * "pour la classification ophtalmologie, Keeler en fin de liste").
 *
 * Keeler was at sort_order 50 like the other non-listed partners but, being
 * featured, the API (sort_order, featured, name) put it before them, 5th in
 * Ophtalmologie. sort_order 999 puts it after every other partner, in every
 * category it appears in.
 *
 * REVERT POINT: on 2026-10-28 Keeler was at sort_order 50. --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 66-keeler-last.js <app>:/tmp/66.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const SLUG = "keeler";
const BEFORE = 50;
const LAST = 999;

async function main() {
  const row = await prisma.partners.findFirst({ where: { slug: SLUG } });
  if (!row) throw new Error(`partner "${SLUG}" not found`);
  const target = REVERT ? BEFORE : LAST;
  console.log(`${APPLY || REVERT ? "" : "[dry-run] "}${SLUG}: sort_order ${row.sort_order} -> ${target}`);
  if ((APPLY || REVERT) && row.sort_order !== target) {
    await prisma.partners.update({ where: { id: row.id }, data: { sort_order: target, updated_at: new Date() } });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
