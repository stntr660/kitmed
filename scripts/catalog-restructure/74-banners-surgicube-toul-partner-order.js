const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-02 -- client feedback:
 *  A) two new homepage slider banners for the products of the SOCOMMED
 *     brochures (script 70), same format as script 69 (split layout, cut-out
 *     PNG on a 1.2:1 transparent canvas, CTA to the product page):
 *       surgicube-slider.png               the cube, cut out of the brochure cover
 *       toul-operio-steristay-slider.png   SteriStay + Opério Mobile, cut out of the cover
 *  B) partner SurgiCube: sharper logo (vector logo of the brochure rendered at
 *     700 dpi, transparent: surgicube-logo-hd.png) and moved to 5th place on the
 *     partners page; Medicontur, FCI and Moria move from 5/6/7 to 6/7/8.
 *
 * Files (public/uploads/, copied to the uploads volume first):
 *   banners/surgicube-slider.png, banners/toul-operio-steristay-slider.png,
 *   partners/surgicube-logo-hd.png
 *
 * REVERT POINT: --revert deletes the two banners (fixed ids), puts the old
 * SurgiCube logo and sort_order 99 back, and Medicontur/FCI/Moria back to 5/6/7.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 74-banners-surgicube-toul-partner-order.js <app>:/tmp/74.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/74.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/74.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/74.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const BANNERS = [
  {
    id: "b74a0001-0000-4000-8000-000000000001", sort: 9, file: "surgicube-slider.png",
    cta_url: "/fr/products/surgicube-cube-operatoire-flux-laminaire",
    fr: { title: "SurgiCube®", subtitle: "Une alternative au bloc opératoire",
          description: "Cube opératoire autonome à flux d'air laminaire : une zone ultra-propre de classe ISO 5 pour la microchirurgie sous anesthésie locale (cataracte, IVT, ORL, dermatologie), installée dans une pièce de 25 m².",
          cta: "Découvrir" },
    en: { title: "SurgiCube®", subtitle: "An alternative to the operating room",
          description: "Self-contained laminar-airflow operating cube: an ultra-clean ISO class 5 zone for microsurgery under local anaesthesia (cataract, IVT, ENT, dermatology), set up in a 25 m² room.",
          cta: "Discover" },
  },
  {
    id: "b74a0001-0000-4000-8000-000000000002", sort: 10, file: "toul-operio-steristay-slider.png",
    cta_url: "/fr/products/toul-meditech-operio-steristay",
    fr: { title: "Opério® & SteriStay®", subtitle: "Le flux d'air laminaire au plus près du geste",
          description: "Les générateurs Toul Meditech protègent la zone opératoire et les instruments de toute contamination aérienne : Opério sur pied mobile ou au plafond, et table à instruments SteriStay.",
          cta: "Découvrir" },
    en: { title: "Opério® & SteriStay®", subtitle: "Laminar airflow right where you operate",
          description: "Toul Meditech generators protect the surgical site and the instruments from airborne contamination: Opério on a mobile stand or ceiling-mounted, and the SteriStay instrument table.",
          cta: "Discover" },
  },
];

const PARTNERS = {
  "surgicube-international": {
    before: { sort_order: 99, logo_url: "/uploads/partners/surgicube-logo.png" },
    after:  { sort_order: 5,  logo_url: "/uploads/partners/surgicube-logo-hd.png" },
  },
  "medicontur": { before: { sort_order: 5 }, after: { sort_order: 6 } },
  "fci":        { before: { sort_order: 6 }, after: { sort_order: 7 } },
  "moria":      { before: { sort_order: 7 }, after: { sort_order: 8 } },
};

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  const write = APPLY || REVERT;

  for (const b of BANNERS) {
    const row = await prisma.banners.findUnique({ where: { id: b.id } });
    if (REVERT) {
      if (!row) { console.log(`  [SKIP] banner ${b.fr.title} absent`); continue; }
      console.log(`  delete banner ${b.fr.title}`);
      await prisma.banners.delete({ where: { id: b.id } }); // translations cascade
      continue;
    }
    if (row) { console.log(`  [SKIP] banner ${b.fr.title} exists`); continue; }
    console.log(`  create banner ${b.fr.title.padEnd(22)} sort ${b.sort}  /uploads/banners/${b.file}  -> ${b.cta_url}`);
    if (!APPLY) continue;
    await prisma.banners.create({
      data: {
        id: b.id, title: b.fr.title, subtitle: b.fr.subtitle, description: b.fr.description,
        image_url: `/uploads/banners/${b.file}`, cta_text: b.fr.cta, cta_url: b.cta_url, cta_style: "primary",
        position: "homepage", layout: "split", text_align: "left", overlay_opacity: 0.9,
        sort_order: b.sort, is_active: true, updated_at: new Date(),
        banner_translations: { create: ["fr", "en"].map((lang) => ({
          id: `${b.id}-${lang}`, language_code: lang, title: b[lang].title,
          subtitle: b[lang].subtitle, description: b[lang].description, cta_text: b[lang].cta,
        })) },
      },
    });
  }

  for (const [slug, { before, after }] of Object.entries(PARTNERS)) {
    const target = REVERT ? before : after;
    const row = await prisma.partners.findUnique({ where: { slug } });
    if (!row) { console.log(`  [MISSING PARTNER] ${slug}`); continue; }
    const changes = Object.entries(target).filter(([k, v]) => row[k] !== v);
    if (!changes.length) { console.log(`  [SKIP] partner ${slug}`); continue; }
    console.log(`  partner ${slug.padEnd(26)} ${changes.map(([k, v]) => `${k} ${row[k]} -> ${v}`).join(", ")}`);
    if (write) await prisma.partners.update({ where: { id: row.id }, data: { ...Object.fromEntries(changes), updated_at: new Date() } });
  }

  console.log(write ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
