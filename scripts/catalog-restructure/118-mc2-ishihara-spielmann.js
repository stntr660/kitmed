const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: client's sharp photos for the two MC2 products still blurry after script 98
 * (Test d'Ishihara, Écran translucide de Spielmann), same 1200x900 white canvas as 98a-d.
 * Files: /uploads/products/mc2-test-ishihara-118.jpg, mc2-ecran-spielmann-118.jpg.
 * REVERT: before -> after URL pairs below.
 *
 *   docker cp 118-mc2-ishihara-spielmann.js <app>:/tmp/118.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/118.js [--apply|--revert]
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const MEDIA = {
  "d93a0001-0000-4000-8000-000000000028-m93": ["/uploads/products/mc2-test-ishihara.jpg", "/uploads/products/mc2-test-ishihara-118.jpg"],
  "d93a0001-0000-4000-8000-000000000052-m93": ["/uploads/products/mc2-ecran-spielmann.jpg", "/uploads/products/mc2-ecran-spielmann-118.jpg"],
};

async function main() {
  for (const [id, [before, after]] of Object.entries(MEDIA)) {
    const target = REVERT ? before : after;
    const m = await prisma.product_media.findUnique({ where: { id } });
    console.log(`  ${id}: ${m.url} -> ${target}`);
    if ((APPLY || REVERT) && m.url !== target) await prisma.product_media.update({ where: { id }, data: { url: target } });
  }
  if (!APPLY && !REVERT) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
