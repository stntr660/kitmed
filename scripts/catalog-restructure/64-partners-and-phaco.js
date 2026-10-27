const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-27 -- client feedback, second batch of the day.
 *
 * A) AKTIVE (« la gamme active ») and INTERMEDIC are no longer shown as
 *    partners: status -> inactive. Neither has an active product.
 * B) Phacoémulsification keeps only Sophi: the NIDEK Cube α CV-9000 is
 *    ARCHIVED (status only), and the category card shows the Sophi A machine
 *    (phaco-photo-sophi.jpg, cut out of its brochure cover).
 *
 * REVERT POINT: `before` is each row's value on 2026-10-27; --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 64-partners-and-phaco.js <app>:/tmp/64.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/64.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/64.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/64.js --revert
 * phaco-photo-sophi.jpg is copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const PARTNERS = {
  "aktive":     { before: "active", after: "inactive" },
  "intermedic": { before: "active", after: "inactive" },
};
const PRODUCTS = {
  "nidek-cube-alpha-cv-9000-cv-9000": { before: "active", after: "archived" },
};
const IMAGES = {
  "phaco": { before: "/uploads/categories/phaco-photo-clean.jpg", after: "/uploads/categories/phaco-photo-sophi.jpg" },
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

  for (const [slug, { before, after }] of Object.entries(PRODUCTS)) {
    const target = REVERT ? before : after;
    const row = await prisma.products.findUnique({ where: { slug } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${slug}`); continue; }
    if (row.status === target) { console.log(`  [SKIP] product ${slug}`); continue; }
    console.log(`  product ${slug.padEnd(36)} ${row.status} -> ${target}`);
    if (APPLY || REVERT) await prisma.products.update({ where: { id: row.id }, data: { status: target, updated_at: new Date() } });
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
    console.log(`  category ${slug.padEnd(35)} ${cat.image_url} -> ${target}`);
    if (APPLY || REVERT) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
