const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-19 -- the Hylo eye drops (URSAPHARM) link to their official page on
 * hylo.ma instead of a PDF. The site shows « Site officiel » for a link that
 * is a web page (isWebPageLink in src/lib/utils.ts).
 *
 * A link is written only if hylo.ma answers with that product's page: the site
 * returns 200 with an "Erreur 404" title for unknown slugs, so the title is
 * checked, not the status.
 *
 * HYLO DUAL INTENSE has no page on hylo.ma (the Moroccan site does not list it)
 * and is left as it is.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 60-hylo-official-pages.js <app>:/tmp/60.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/60.js          # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/60.js --apply
 *
 * Rollback: set pdf_brochure_url back to NULL for these references (none of
 * them had a brochure before).
 */

const APPLY = process.argv.includes("--apply");

// reference -> official page; the "r" endings are hylo.ma's own slugs (®)
const PAGES = {
  "HYLO-FRESH":          "https://hylo.ma/produits/hylo-freshr/",
  "HYLO-COMOD":          "https://hylo.ma/produits/hylo-comodr/",
  "HYLO-DUAL":           "https://hylo.ma/produits/hylo-dualr/",
  "HYLO-GEL":            "https://hylo.ma/produits/hylor-gel/",
  "HYLO CARE (COLLYRE)": "https://hylo.ma/produits/hylo-carer/",
  "HYLO-PARIN":          "https://hylo.ma/produits/hylo-parinr/",
};

async function isProductPage(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const title = ((await res.text()).match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    return res.ok && !/erreur 404/i.test(title) ? title : null;
  } catch { return null; }
}

async function main() {
  for (const [ref, url] of Object.entries(PAGES)) {
    const p = await prisma.products.findUnique({ where: { reference_fournisseur: ref } });
    if (!p) { console.log(`  [MISSING PRODUCT] ${ref}`); continue; }
    if (p.pdf_brochure_url === url) { console.log(`  [SKIP] ${ref} déjà à jour`); continue; }
    const title = await isProductPage(url);
    if (!title) { console.log(`  [NOT A PRODUCT PAGE] ${ref} ${url}`); continue; }
    console.log(`  ${ref.padEnd(20)} ${p.pdf_brochure_url || "(aucune)"} -> ${url}  (${title.trim()})`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { pdf_brochure_url: url, updated_at: new Date() } });
  }
  console.log(APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
