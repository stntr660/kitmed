const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: some supplier logos have a white background; make them background-less
 * transparent PNGs and check every partner has a working logo (one looked missing).
 * Audit (31 active partners, all logo files HTTP 200 and real images): 7 had an opaque white /
 * near-white background (JPG or RGB PNG). Each is replaced by a transparent PNG:
 *   - mc2, medicontur, otopront: white removed from the edges (flood fill + soft alpha edges),
 *     letter counters cleared, margins trimmed (medicontur cropped out of a 1200x630 preview).
 *   - star-set: official transparent PNG from star-set.com (the old JPG was a grey-box copy).
 *   - surgicalspecialities-corza: official SVG from corza.com rendered to PNG 1600 px.
 *   - nitrocare: official transparent logo@2x from nitrocare.com.tr (490 px, was 212 px).
 *   - toul-meditech: official current horizontal logo from toulmeditech.com (1600 px).
 * Plus fci: its SVG (no width/height attributes) collapses to 0x0 in the homepage partners band
 * (ManufacturerCarousel, <img> with max-h/max-w only) -> the slot looked empty. Replaced by the
 * same official SVG rendered to a transparent PNG (600x841); the white panel is part of the logo.
 * Files (copied into the staging uploads volume before --apply): partners/<slug>-logo-108.png
 *
 * REVERT POINT: the previous URLs below; --revert puts them back (old files are kept).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 107-logos-partenaires-transparents.js <app>:/tmp/107.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/107.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/107.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/107.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const WRITE = APPLY || REVERT;
const pick = ([before, after]) => (REVERT ? before : after);

const PARTNERS = {
  "fci": ["/uploads/partners/fci-logo.svg", "/uploads/partners/fci-logo-108.png"],
  "mc2": ["/uploads/partners/mc2-logo.png", "/uploads/partners/mc2-logo-108.png"],
  "medicontur": ["/uploads/partners/website-preview-1766007655251-d10a950e.jpg", "/uploads/partners/medicontur-logo-108.png"],
  "nitrocare": ["/uploads/partners/images--2--1766006973133-25580eb0.png", "/uploads/partners/nitrocare-logo-108.png"],
  "otopront": ["/uploads/partners/image-1765306373375-4cf986b1.png", "/uploads/partners/otopront-logo-108.png"],
  "star-set": ["/uploads/partners/photo-2026-01-13-15-02-50-1768322196326-bdc1405a.jpg", "/uploads/partners/star-set-logo-108.png"],
  "surgicalspecialities-corza": ["/uploads/partners/griz-corzamedical-full-logo-color-1-100-1764081480490-10e49b8c.jpg", "/uploads/partners/surgicalspecialities-corza-logo-108.png"],
  "toul-meditech": ["/uploads/partners/toul-meditech-logo.png", "/uploads/partners/toul-meditech-logo-108.png"],
};

async function main() {
  for (const [slug, urls] of Object.entries(PARTNERS)) {
    const p = await prisma.partners.findUnique({ where: { slug } });
    if (!p) { console.log(`  [MISSING] partner ${slug}`); continue; }
    const target = pick(urls);
    const expected = REVERT ? urls[1] : urls[0];
    const flag = p.logo_url === target ? "[ALREADY]" : p.logo_url === expected ? "" : "[UNEXPECTED CURRENT]";
    console.log(`  partner ${slug}: ${p.logo_url} -> ${target} ${flag}`);
    if (WRITE && p.logo_url !== target) await prisma.partners.update({ where: { slug }, data: { logo_url: target, updated_at: new Date() } });
  }
  if (!WRITE) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
