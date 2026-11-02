const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-02 -- client feedback: better photos for « Toul Meditech Opério® /
 * SteriStay® ». The photos cut from the SOCOMMED brochure were blurry; these
 * are the manufacturer's own renders (toulmeditech.com), on white, squared:
 *   m0 toul-operio-mobile-hd.jpg     Opério Mobile (main photo)
 *   m1 toul-steristay-hd.jpg         SteriStay
 *   m2 toul-operio-ceiling.jpg       Opério Ceiling (new)
 *   m3 toul-operio-mobile-flux.jpg   Opério Mobile with its airflow (new)
 *
 * Files (public/uploads/products/, copied to the uploads volume first).
 *
 * REVERT POINT: --revert puts m0/m1 back on toul-operio-mobile.jpg and
 * toul-steristay.jpg and deletes m2/m3.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 75-toul-product-photos.js <app>:/tmp/75.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/75.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/75.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/75.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const PRODUCT_ID = "d70a0001-0000-4000-8000-000000000002";
const MEDIA = [
  { n: 0, before: "/uploads/products/toul-operio-mobile.jpg", after: "/uploads/products/toul-operio-mobile-hd.jpg", alt: "Opério Mobile" },
  { n: 1, before: "/uploads/products/toul-steristay.jpg",     after: "/uploads/products/toul-steristay-hd.jpg",     alt: "SteriStay" },
  { n: 2, before: null, after: "/uploads/products/toul-operio-ceiling.jpg",     alt: "Opério Ceiling" },
  { n: 3, before: null, after: "/uploads/products/toul-operio-mobile-flux.jpg", alt: "Opério Mobile, flux d'air laminaire" },
];

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  const write = APPLY || REVERT;
  for (const m of MEDIA) {
    const id = `${PRODUCT_ID}-m${m.n}`;
    const target = REVERT ? m.before : m.after;
    const row = await prisma.product_media.findUnique({ where: { id } });
    if (!target) {
      if (!row) { console.log(`  [SKIP] m${m.n} absent`); continue; }
      console.log(`  delete m${m.n} ${row.url}`);
      if (write) await prisma.product_media.delete({ where: { id } });
      continue;
    }
    if (!row) {
      console.log(`  create m${m.n} ${target}`);
      if (write) await prisma.product_media.create({ data: { id, product_id: PRODUCT_ID, type: "image", url: target, alt_text: m.alt, sort_order: m.n, is_primary: m.n === 0 } });
      continue;
    }
    if (row.url === target) { console.log(`  [SKIP] m${m.n}`); continue; }
    console.log(`  m${m.n} ${row.url} -> ${target}`);
    if (write) await prisma.product_media.update({ where: { id }, data: { url: target } });
  }
  console.log(write ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
