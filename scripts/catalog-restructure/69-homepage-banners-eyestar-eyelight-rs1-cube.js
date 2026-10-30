const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-30 -- client feedback: four new homepage slider banners, same
 * format as the active ones (split layout, cut-out PNG on transparent
 * background, title = product, subtitle = tagline, CTA to the product page):
 *   Eyestar 900 (Haag-Streit), Eye-Light (Espansione), RS-1 (NIDEK), Cube α (NIDEK).
 *
 * Images (public/uploads/banners/, also copied to the uploads volume first):
 *   eyestar-900-slider.png  product photo, beams/icons/« Swiss made » badge removed
 *   eye-light-slider.png    cut out of the Espansione brochure, page 24
 *   rs-1-slider-wide.png    product photo cut out of its white background
 *   cube-alpha-slider-wide.png  idem
 *   (both are tall products: centred on a 1.2:1 transparent canvas so the
 *   slider keeps the same height as the other banners)
 *
 * REVERT POINT: --revert deletes these four banners (fixed ids below);
 * the existing banners are not touched.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 69-homepage-banners-eyestar-eyelight-rs1-cube.js <app>:/tmp/69.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/69.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/69.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/69.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const BANNERS = [
  {
    id: "b69a0001-0000-4000-8000-000000000001", sort: 5, file: "eyestar-900-slider.png",
    cta_url: "/fr/products/eyestar-900",
    fr: { title: "Eyestar 900", subtitle: "La biométrie OCT Swept-Source",
          description: "Biomètre et topographe Haag-Streit pour planifier la chirurgie de la cataracte : topographie antérieure et postérieure, kératométrie, pachymétrie et calcul d'implant, les deux yeux en 40 secondes environ.",
          cta: "Découvrir" },
    en: { title: "Eyestar 900", subtitle: "Swept-source OCT biometry",
          description: "Haag-Streit biometer and topographer for cataract surgery planning: anterior and posterior topography, keratometry, pachymetry and IOL calculation, both eyes in about 40 seconds.",
          cta: "Discover" },
  },
  {
    id: "b69a0001-0000-4000-8000-000000000002", sort: 6, file: "eye-light-slider.png",
    cta_url: "/fr/products/new-mdr-eye-light-workstation-both-segments-anterior-posterior",
    fr: { title: "Eye-Light", subtitle: "Tout-en-un pour la surface oculaire",
          description: "La station Espansione réunit la Light Modulation LLLT et l'IPL OPE pour traiter la sécheresse oculaire liée au dysfonctionnement des glandes de Meibomius, la blépharite et le chalazion.",
          cta: "Découvrir" },
    en: { title: "Eye-Light", subtitle: "All-in-one for the ocular surface",
          description: "The Espansione workstation combines Light Modulation LLLT and OPE IPL to treat dry eye caused by Meibomian gland dysfunction, blepharitis and chalazion.",
          cta: "Discover" },
  },
  {
    id: "b69a0001-0000-4000-8000-000000000003", sort: 7, file: "rs-1-slider-wide.png",
    cta_url: "/fr/products/rs-1-rs-1",
    fr: { title: "RS-1", subtitle: "L'OCT à 250 000 A-scans/s",
          description: "Tomographe NIDEK OCT-SLO : coupes larges et profondes, OCT-Angiographie haute résolution et analyses assistées par intelligence artificielle, avec une acquisition rapide et automatisée.",
          cta: "Découvrir" },
    en: { title: "RS-1", subtitle: "OCT at 250,000 A-scans/s",
          description: "NIDEK OCT-SLO tomographer: wide, deep scans, high-resolution OCT angiography and AI-assisted analysis, with fast, automated acquisition.",
          cta: "Discover" },
  },
  {
    id: "b69a0001-0000-4000-8000-000000000004", sort: 8, file: "cube-alpha-slider-wide.png",
    cta_url: "/fr/products/nidek-cube-alpha-cv-9000-cv-9000",
    fr: { title: "Cube α", subtitle: "Compact et complet, puissant mais pratique",
          description: "Système NIDEK de chirurgie de la cataracte avec technologie de torsion Gyro : énergie ultrasonore efficace, chambre antérieure stable et console détachable de son support.",
          cta: "Découvrir" },
    en: { title: "Cube α", subtitle: "Compact and complete, powerful yet handy",
          description: "NIDEK cataract surgery system with Gyro torsional technology: efficient ultrasound energy, stable anterior chamber and a console that detaches from its stand.",
          cta: "Discover" },
  },
];

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  for (const b of BANNERS) {
    const row = await prisma.banners.findUnique({ where: { id: b.id } });
    if (REVERT) {
      if (!row) { console.log(`  [SKIP] ${b.fr.title} absent`); continue; }
      console.log(`  delete ${b.fr.title}`);
      await prisma.banners.delete({ where: { id: b.id } }); // translations cascade
      continue;
    }
    if (row) {
      const url = `/uploads/banners/${b.file}`;
      if (row.image_url === url) { console.log(`  [SKIP] ${b.fr.title} exists`); continue; }
      console.log(`  image ${b.fr.title}: ${row.image_url} -> ${url}`);
      if (APPLY) await prisma.banners.update({ where: { id: b.id }, data: { image_url: url, updated_at: new Date() } });
      continue;
    }
    console.log(`  create ${b.fr.title.padEnd(12)} sort ${b.sort}  /uploads/banners/${b.file}  -> ${b.cta_url}`);
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
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
