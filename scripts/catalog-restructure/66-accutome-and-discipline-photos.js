const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-27 -- client feedback, fourth batch of the day.
 *
 * A) ACCUTOME is no longer shown as a partner (status -> inactive, no active product).
 * B) Homepage discipline cards:
 *    drawn icons instead of product photos, sources in ./icons/*.svg
 *    - Orthopédie: a knee support (orthopedics-icon.jpg)
 *    - Dispositifs médicaux: an eye-drop bottle over an eye
 *      (dispositifs-medicaux-icon.jpg), no more ISOMAR nasal spray
 *
 * REVERT POINT: `before` is each row's value on 2026-10-27; --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 66-accutome-and-discipline-photos.js <app>:/tmp/66.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/66.js --revert
 * The *-photo2.jpg files are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const PARTNERS = {
  "accutome": { before: "active", after: "inactive" },
};
const IMAGES = {
  "orthopedics":          { before: "/uploads/categories/orthopedics-photo.jpg",          after: "/uploads/categories/orthopedics-icon.jpg" },
  "dispositifs-medicaux": { before: "/uploads/categories/dispositifs-medicaux-photo.jpg", after: "/uploads/categories/dispositifs-medicaux-icon.jpg" },
};

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
