const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-17 -- owner: the remaining domain images (ORL, Orthopédie, Dispositifs médicaux, Drapage)
 * were soft crops of the mockup; sharp versions regenerated from them with Gemini (gemini-3-pro-image,
 * same scene, no text). Files (copied into the staging uploads volume before --apply):
 * categories/q102-<slug>.jpg. Homepage / Partenaires tiles are updated in the repo (public/images).
 *
 * REVERT POINT: previous image_url per slug below; --revert puts them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 102-categories-gemini-images.js <app>:/tmp/102.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/102.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/102.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/102.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SLUGS = ["orl-oto-rhino-laryngologie", "orthopedics", "dispositifs-medicaux", "drapage"];

async function main() {
  for (const slug of SLUGS) {
    const before = `/uploads/categories/q87-${slug}.jpg`;
    const after = `/uploads/categories/q102-${slug}.jpg`;
    const target = REVERT ? before : after;
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING] ${slug}`); continue; }
    console.log(`  ${slug}: ${cat.image_url} -> ${target}`);
    if ((APPLY || REVERT) && cat.image_url !== target) {
      await prisma.categories.update({ where: { slug }, data: { image_url: target, updated_at: new Date() } });
    }
  }
  if (!APPLY && !REVERT) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
