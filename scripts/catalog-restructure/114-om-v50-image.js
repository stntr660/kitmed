const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: the « Microscope opératoire OM-V50 » photo was a 300 px AVIF; same picture
 * upscaled with Gemini (gemini-3.1-flash-image, upscale only, 1024 px). File:
 * /uploads/products/om-v50-114.jpg (copied into the staging uploads volume first).
 * REVERT POINT: previous URL below; --revert puts it back (the old file stays).
 *
 *   docker cp 114-om-v50-image.js <app>:/tmp/114.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/114.js [--apply|--revert]
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const MEDIA_ID = "393691e6-eb1d-495c-b38a-05289e166e7d";
const BEFORE = "/uploads/products/06a787a1-f9ce-4976-ba86-f2b31b213536/1768474975639-0.jpg";
const AFTER = "/uploads/products/om-v50-114.jpg";

async function main() {
  const m = await prisma.product_media.findUnique({ where: { id: MEDIA_ID } });
  const target = REVERT ? BEFORE : AFTER;
  console.log(`media ${MEDIA_ID}: ${m.url} -> ${target}`);
  if ((APPLY || REVERT) && m.url !== target) await prisma.product_media.update({ where: { id: MEDIA_ID }, data: { url: target } });
  if (!APPLY && !REVERT) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
