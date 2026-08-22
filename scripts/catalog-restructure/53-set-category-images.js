const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Batch 2026-08-22 -- set image_url on the 5 categories created by
 * 51-create-parents.js, using client-supplied artwork.
 *
 * Unlike 04-set-category-images.js (which derives an image from the category's
 * best product), this sets explicit files dropped into
 * public/uploads/categories/.
 *
 * A slug is skipped if its file is not on disk yet, so this can be re-run as
 * the remaining artwork arrives.
 *
 * NOTE: public/uploads is a mounted volume on staging
 * (/root/docker-volumes/kitmed-staging/public/uploads). Putting a file in the
 * repo is NOT enough -- it must also be copied onto that volume, otherwise the
 * URL 404s. This script only writes the DB column.
 *
 * Run:
 *   node 53-set-category-images.js          # dry-run
 *   node 53-set-category-images.js --apply
 */

const APPLY = process.argv.includes("--apply");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads", "categories");
const URL_PREFIX = "/uploads/categories";

// Auto-discover: any <slug>.{png,jpg,jpeg,webp} in public/uploads/categories/
// whose basename matches a category slug becomes that category's image.
// Drop a file in, re-run, done -- no need to edit this list.
const EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function discoverImages() {
  if (!fs.existsSync(UPLOAD_DIR)) return {};
  const map = {};
  for (const file of fs.readdirSync(UPLOAD_DIR)) {
    const ext = path.extname(file).toLowerCase();
    if (!EXTS.includes(ext)) continue;
    const slug = path.basename(file, path.extname(file));
    // Prefer png over jpg if both exist for the same slug
    if (!map[slug] || ext === ".png") map[slug] = file;
  }
  return map;
}

const IMAGES = discoverImages();

async function main() {
  console.log(`=== Set category images (2026-08-22) ===`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  let updated = 0, noFile = 0, missing = 0, unchanged = 0;
  const rollback = [];

  const entries = Object.entries(IMAGES).sort();
  console.log(`Found ${entries.length} image file(s) in ${UPLOAD_DIR}\n`);

  for (const [slug, filename] of entries) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) {
      console.log(`  [NO CATEGORY] ${filename} -> no category with slug "${slug}", skipping`);
      missing++;
      continue;
    }

    const diskPath = path.join(UPLOAD_DIR, filename);
    const url = `${URL_PREFIX}/${filename}`;
    const sizeKb = Math.round(fs.statSync(diskPath).size / 1024);
    console.log(`  [${slug}] "${cat.name}"`);
    console.log(`    from: ${cat.image_url ?? "(none)"} -> to: ${url} (${sizeKb} KB)`);

    if (cat.image_url === url) {
      console.log(`    already set -> skip`);
      unchanged++;
      continue;
    }

    rollback.push(
      `UPDATE categories SET image_url = ${cat.image_url === null ? "NULL" : `'${cat.image_url}'`}, updated_at = NOW() WHERE slug = '${slug}';`
    );

    if (APPLY) {
      await prisma.categories.update({
        where: { id: cat.id },
        data: { image_url: url, updated_at: new Date() },
      });
      console.log(`    [SET]`);
    }
    updated++;
  }

  const stillBare = await prisma.categories.count({
    where: { OR: [{ image_url: null }, { image_url: "" }] },
  });
  const activeProducts = await prisma.products.count({ where: { status: "active" } });

  console.log(`\n  set: ${updated} | already set: ${unchanged} | awaiting artwork: ${noFile} | missing category: ${missing}`);
  console.log(`  categories still without image: ${stillBare}`);
  console.log(`  active products: ${activeProducts} (must stay 412)`);

  if (rollback.length) {
    console.log(`\n--- ROLLBACK SQL ---`);
    rollback.forEach((s) => console.log(s));
  }

  console.log(`\n${APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply"}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
