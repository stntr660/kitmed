const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-29 -- client feedback: new tagline (subtitle) on the homepage
 * Phantom banner, FR and EN. Title, description and image unchanged.
 *
 * REVERT POINT: `before` is each value on 2026-10-29; --revert puts it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 68-phantom-banner-tagline.js <app>:/tmp/68.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/68.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/68.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/68.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const BANNER_ID = "69cc2ddf-d8c7-43db-bae4-5af364e3b3b9"; // « Phantom », homepage
const SUBTITLE = {
  fr: { before: "La réfraction en champ ouvert", after: "Le seul Phantom devant lequel vous ne fermerez pas les yeux." },
  en: { before: "Open-field refraction",         after: "The only Phantom you will keep your eyes open for." },
};

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  const banner = await prisma.banners.findUnique({ where: { id: BANNER_ID } });
  if (!banner) { console.log("  [MISSING BANNER]"); return; }

  // banners.subtitle is the FR fallback
  const fallback = REVERT ? SUBTITLE.fr.before : SUBTITLE.fr.after;
  if (banner.subtitle === fallback) console.log("  [SKIP] banners.subtitle");
  else {
    console.log(`  banners.subtitle: ${banner.subtitle} -> ${fallback}`);
    if (APPLY || REVERT) await prisma.banners.update({ where: { id: BANNER_ID }, data: { subtitle: fallback, updated_at: new Date() } });
  }

  for (const [lang, { before, after }] of Object.entries(SUBTITLE)) {
    const target = REVERT ? before : after;
    const tr = await prisma.banner_translations.findFirst({ where: { banner_id: BANNER_ID, language_code: lang } });
    if (!tr) { console.log(`  [MISSING] translation ${lang}`); continue; }
    if (tr.subtitle === target) { console.log(`  [SKIP] ${lang}`); continue; }
    console.log(`  ${lang}: ${tr.subtitle} -> ${target}`);
    if (APPLY || REVERT) await prisma.banner_translations.update({ where: { id: tr.id }, data: { subtitle: target } });
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
