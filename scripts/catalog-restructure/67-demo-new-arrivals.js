const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-29 -- DEMO: fill the homepage « Nouveaux arrivages » carousel with
 * the 11 products currently flagged « Phare » (is_featured), so the client
 * sees it scrolling. Only is_new_arrival changes (false -> true).
 * Needs the column from script 66.
 *
 * REVERT POINT: all 11 were false on 2026-10-29; --revert puts them back
 * (the Cube α, flagged by script 66, is not touched).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 67-demo-new-arrivals.js <app>:/tmp/67.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/67.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const SLUGS = [
  "phantom-open-field-refraction-system-phantom",
  "rs-1-rs-1",
  "elara-900-lampe-fente-avanc-e",
  "metis-900-centre-de-contr-le-chirurgical",
  "om-v50-op-ration-microscope",
  "hylo-gel",
  "hylo-fresh",
  "hylo-dual",
  "hylo-comod",
  "hylo-dual-intense",
  "hylo-care",
];

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  const target = !REVERT;
  for (const slug of SLUGS) {
    const row = await prisma.products.findUnique({ where: { slug }, select: { id: true, is_new_arrival: true } });
    if (!row) { console.log(`  [MISSING] ${slug}`); continue; }
    if (row.is_new_arrival === target) { console.log(`  [SKIP] ${slug}`); continue; }
    console.log(`  ${slug.padEnd(46)} ${row.is_new_arrival} -> ${target}`);
    if (APPLY || REVERT) await prisma.products.update({ where: { id: row.id }, data: { is_new_arrival: target, updated_at: new Date() } });
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
