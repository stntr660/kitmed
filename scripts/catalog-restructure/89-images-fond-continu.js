const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- owner: category images of Orthopédie, Literie et mobilier
 * médical (and the few other tiles cut from tinted product photos) must look
 * coherent and not cropped. These 22 sources have a light-blue / grey studio
 * background: the 3:1 tile now extends that background to the edges (edge
 * columns stretched + blurred, photo blended in) instead of a box on white.
 *
 * REVERT POINT: 89-before.json = slug -> {before (script 87 tile), after}.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 89-images-fond-continu.js <app>:/tmp/89.js
 *   docker cp 89-before.json <app>:/tmp/89-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/89.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/89.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/89.js --revert
 * The q89-*.jpg files are copied to uploads/categories first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const IMAGES = JSON.parse(fs.readFileSync(path.join(__dirname, "89-before.json"), "utf8"));

async function main() {
  for (const [slug, { before, after }] of Object.entries(IMAGES)) {
    const target = REVERT ? before : after;
    if (!fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) { console.log(`  [MISSING FILE] ${target}`); continue; }
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (cat.image_url === target) continue;
    console.log(`  ${slug.padEnd(32)} -> ${target}`);
    if (WRITE) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }
  console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
