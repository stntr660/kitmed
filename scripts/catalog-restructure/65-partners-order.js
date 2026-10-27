const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-27 -- partners page order, as the client listed it.
 *
 * A) First, in this order: Ursapharm, Johnson & Johnson Vision, Nidek,
 *    Haag-Streit, Medicontur, FCI, Moria (sort_order 1..7). Every other
 *    partner still at 0 moves to 50, so it comes after them; the public API
 *    then orders by sort_order, featured, name.
 * B) STURDY is no longer shown as a partner (status -> inactive, no active product).
 * C) Ray Vision logo: the old file is a 200x200 square with the logo in a thin
 *    strip, so it looked tiny. ray-vision-logo.png is that strip cropped and
 *    upscaled.
 *
 * REVERT POINT: on 2026-10-27 every partner below was at sort_order 0 and
 * STURDY was active. --revert puts the 1..7 and the 50s back to 0, STURDY
 * back to active and the old Ray Vision logo back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 65-partners-order.js <app>:/tmp/65.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/65.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/65.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/65.js --revert
 * ray-vision-logo.png is copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const FIRST = ["ursapharm", "johnson-johnson-vision", "nidek", "haag-streit", "medicontur", "fci", "moria"];
const REST = 50;
const HIDE = { sturdy: { before: "active", after: "inactive" } };
const LOGOS = {
  "ray-vision": {
    before: "/uploads/partners/images--1--removebg-preview-1766005891914-1ee662a5.png",
    after: "/uploads/partners/ray-vision-logo.png",
  },
};

async function setPartner(row, data, label) {
  console.log(`  ${row.slug.padEnd(28)} ${label}`);
  if (APPLY || REVERT) await prisma.partners.update({ where: { id: row.id }, data: { ...data, updated_at: new Date() } });
}

async function main() {
  const all = await prisma.partners.findMany();
  for (const row of all) {
    const i = FIRST.indexOf(row.slug);
    let target;
    if (REVERT) target = i >= 0 || row.sort_order === REST ? 0 : row.sort_order;
    else target = i >= 0 ? i + 1 : row.sort_order === 0 ? REST : row.sort_order;
    if (target !== row.sort_order) await setPartner(row, { sort_order: target }, `sort_order ${row.sort_order} -> ${target}`);
  }

  for (const [slug, { before, after }] of Object.entries(HIDE)) {
    const target = REVERT ? before : after;
    const row = all.find(r => r.slug === slug);
    if (!row) { console.log(`  [MISSING PARTNER] ${slug}`); continue; }
    if (row.status !== target) await setPartner(row, { status: target }, `status ${row.status} -> ${target}`);
  }

  for (const [slug, { before, after }] of Object.entries(LOGOS)) {
    const target = REVERT ? before : after;
    if (!fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) {
      console.log(`  [MISSING FILE] ${slug} ${target}`);
      continue;
    }
    const row = all.find(r => r.slug === slug);
    if (!row) { console.log(`  [MISSING PARTNER] ${slug}`); continue; }
    if (row.logo_url !== target) await setPartner(row, { logo_url: target }, `logo -> ${target}`);
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
