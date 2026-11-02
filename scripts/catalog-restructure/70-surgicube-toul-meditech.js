const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-01 -- client feedback: two new products from the SOCOMMED
 * documentation (French distributor brochures sent by the client):
 *   - SurgiCube® (SurgiCube International, NL): laminar-airflow operating cube
 *     for ambulatory microsurgery, models SC180 / SC200 / SC220.
 *   - Toul Meditech Opério® / SteriStay®: laminar airflow generators
 *     (Opério Mobile, Opério Ceiling, SteriStay instrument table).
 *
 * Creates:
 *   - partners « SurgiCube » (SurgiCube International) and « Toul Meditech » (logos cut
 *     from the brochures, brochure as default PDF);
 *   - sub-category « Flux d'air laminaire » under Ophtalmologie > Bloc opératoire
 *     (the SurgiCube brochure shows cataract surgery);
 *   - the two products, FR/EN name, description, fiche technique, photos
 *     cut from the brochures, brochure PDF.
 *
 * Files (in public/uploads/ and copied to the uploads volume first):
 *   products/surgicube.jpg, products/surgicube-chirurgie-cataracte.jpg,
 *   products/toul-operio-mobile.jpg, products/toul-steristay.jpg,
 *   partners/surgicube-logo.png, partners/toul-meditech-logo.png,
 *   categories/flux-air-laminaire.jpg,
 *   pdfs/kitmed-2026-11-surgicube-brochure.pdf, pdfs/kitmed-2026-11-toul-meditech-brochure.pdf
 *
 * REVERT POINT: everything is created with fixed ids; --revert deletes the two
 * products (media and translations cascade), the sub-category and the two partners.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 70-surgicube-toul-meditech.js <app>:/tmp/70.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/70.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/70.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/70.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const PARTNERS = [
  {
    id: "a70a0001-0000-4000-8000-000000000001", slug: "surgicube-international",
    name: "SurgiCube", website: "https://www.surgicube.com", // « SurgiCube International » was cut off on the partner card
    logo: "/uploads/partners/surgicube-logo.png", pdf: "/uploads/pdfs/kitmed-2026-11-surgicube-brochure.pdf",
    fr: "Fabricant néerlandais du SurgiCube®, cube opératoire à flux d'air laminaire pour la microchirurgie ambulatoire, développé avec le Netherlands Institute for Innovative Ocular Surgery.",
    en: "Dutch manufacturer of the SurgiCube®, a laminar-airflow operating cube for ambulatory microsurgery, developed with the Netherlands Institute for Innovative Ocular Surgery.",
  },
  {
    id: "a70a0001-0000-4000-8000-000000000002", slug: "toul-meditech",
    name: "Toul Meditech", website: null,
    logo: "/uploads/partners/toul-meditech-logo.png", pdf: "/uploads/pdfs/kitmed-2026-11-toul-meditech-brochure.pdf",
    fr: "Fabricant des générateurs de flux d'air laminaire Opério® et SteriStay®, qui protègent la zone opératoire et les instruments de la contamination aérienne.",
    en: "Manufacturer of the Opério® and SteriStay® laminar airflow generators, which protect the surgical site and instruments from airborne contamination.",
  },
];

const CATEGORY = {
  id: "c70a0001-0000-4000-8000-000000000001", slug: "flux-air-laminaire", parent: "bloc-operatoire",
  image: "/uploads/categories/flux-air-laminaire.jpg",
  fr: "Flux d'air laminaire", en: "Laminar airflow",
};

const PRODUCTS = [
  {
    id: "d70a0001-0000-4000-8000-000000000001", partner: 0,
    slug: "surgicube-cube-operatoire-flux-laminaire", ref: "SURGICUBE-SC180-SC200-SC220", constructeur: "surgicube-international",
    pdf: "/uploads/pdfs/kitmed-2026-11-surgicube-brochure.pdf",
    images: [
      { url: "/uploads/products/surgicube.jpg", alt: "SurgiCube" },
      { url: "/uploads/products/surgicube-chirurgie-cataracte.jpg", alt: "SurgiCube en chirurgie de la cataracte" },
    ],
    fr: {
      nom: "SurgiCube® — Cube opératoire à flux laminaire pour l'ambulatoire (SC180 / SC200 / SC220)",
      description:
        "Le SurgiCube est un cube opératoire autonome qui crée une zone ultra-propre de classe ISO 5 sur la zone d'intervention et la table à instruments, grâce à un flux d'air filtré unidirectionnel non turbulent (préfiltres et filtre HEPA H14). " +
        "Alternative économique au bloc opératoire pour la microchirurgie sous anesthésie locale : ophtalmologie (cataracte, IVT), ORL, dermatologie, chirurgie esthétique. " +
        "Installation rapide dans un local existant, encombrement réduit (pièce de 25 m²), prise en charge rapide des patients en circuit raccourci et intervention moins stressante. " +
        "Trois modèles selon la largeur du champ de travail : SC180, SC200 et SC220, avec deux tables à instruments incluses.",
      fiche_technique: [
        "Flux d'air : downflow conforme EN ISO 14644-1 (2015), classe ISO 5, sans mélange, 100 % ex-filtration",
        "Filtration : préfiltres G3 (< 5 %, EN 779) et F7 (63 %, EN 779) ; filtres HEPA H14 99,995 % MPPS (EN 1822)",
        "Débit d'air laminaire : 0,45 m/s en fonctionnement",
        "Zone de propreté : < 5 UFC/m³ ; ≤ 3 520 particules de 0,5 µm/m³ (ISO 5)",
        "Conditions : 15 à 25 °C, 25 à 70 % d'humidité, local propre sans courant d'air",
        "Alimentation : 230 V, 50/60 Hz ; équipement de classe I",
        "SC180 : champ de travail en zone propre 180 x 80 cm ; 2 tables à instruments incluses",
        "SC200 : champ de travail en zone propre 200 x 80 cm ; 2 tables à instruments incluses",
        "SC220 : champ de travail en zone propre 220 x 80 cm ; 2 tables à instruments incluses",
        "Normes : CEI/EN 60601-1:2006, CEI/EN 60601-1-2:2014, ISO 14971:2019",
      ].join("\n"),
    },
    en: {
      nom: "SurgiCube® — Laminar-airflow operating cube for ambulatory surgery (SC180 / SC200 / SC220)",
      description:
        "The SurgiCube is a self-contained operating cube that creates an ISO class 5 ultra-clean zone over the surgical site and the instrument table, using a non-turbulent unidirectional filtered airflow (pre-filters and HEPA H14 filter). " +
        "A cost-effective alternative to the operating room for microsurgery under local anaesthesia: ophthalmology (cataract, IVT), ENT, dermatology, aesthetic surgery. " +
        "Quick installation in an existing room, small footprint (25 m² room), fast patient flow and a less stressful procedure. " +
        "Three models according to the working field width: SC180, SC200 and SC220, with two instrument tables included.",
      fiche_technique: [
        "Airflow: downflow compliant with EN ISO 14644-1 (2015), ISO class 5, no mixing, 100% ex-filtration",
        "Filtration: G3 (< 5%, EN 779) and F7 (63%, EN 779) pre-filters; HEPA H14 filters 99.995% MPPS (EN 1822)",
        "Laminar airflow: 0.45 m/s in operation",
        "Clean zone: < 5 CFU/m³; ≤ 3,520 particles of 0.5 µm/m³ (ISO 5)",
        "Conditions: 15 to 25 °C, 25 to 70% humidity, clean room without draughts",
        "Power: 230 V, 50/60 Hz; class I equipment",
        "SC180: clean working field 180 x 80 cm; 2 instrument tables included",
        "SC200: clean working field 200 x 80 cm; 2 instrument tables included",
        "SC220: clean working field 220 x 80 cm; 2 instrument tables included",
        "Standards: IEC/EN 60601-1:2006, IEC/EN 60601-1-2:2014, ISO 14971:2019",
      ].join("\n"),
    },
  },
  {
    id: "d70a0001-0000-4000-8000-000000000002", partner: 1,
    slug: "toul-meditech-operio-steristay", ref: "TOUL-OPERIO-STERISTAY", constructeur: "toul-meditech",
    pdf: "/uploads/pdfs/kitmed-2026-11-toul-meditech-brochure.pdf",
    images: [
      { url: "/uploads/products/toul-operio-mobile.jpg", alt: "Opério Mobile" },
      { url: "/uploads/products/toul-steristay.jpg", alt: "SteriStay" },
    ],
    fr: {
      nom: "Toul Meditech Opério® / SteriStay® — Générateurs de flux d'air laminaire",
      description:
        "Les générateurs Opério® et SteriStay® protègent la zone opératoire et les instruments de la contamination aérienne, l'une des origines des infections du site opératoire. " +
        "L'air ambiant traverse un filtre HEPA H14 et une toile laminaire stérile : l'air ultra-propre est dirigé sans turbulence sur la zone à risque et repousse l'air contaminé. " +
        "La zone stérile est indiquée par un faisceau lumineux, et les champs stériles à usage unique sont contrôlés par lecteur de code-barres. " +
        "Trois versions : Opério® Mobile, unité mobile avec plateau à instruments amovible ; Opério® Ceiling, unité suspendue au plafond par un bras articulé, qui libère le sol ; SteriStay®, table à instruments mobile à flux filtré et hauteur réglable. " +
        "Ils fonctionnent indépendamment du système de ventilation de la salle.",
      fiche_technique: [
        "Opério® Mobile : 230 V, 290 W (veille 23 W) ; 45 x 60 x 170 cm ; 42 kg ; plateau en option 45 x 60 ou 40 x 50 cm, réglable de 80 à 120 cm, 5 kg max ; profondeur du champ de travail 120 cm",
        "Opério® Ceiling : 230 V, 160 W (veille 23 W) ; longueur 60 cm, portée 180 à 200 cm, largeur 25 cm, hauteur 90 cm ; 35 kg ; profondeur du champ de travail 100 cm",
        "SteriStay® : 230 V, 160 W (veille 23 W) ; 170 x 60 x 170 cm ; 60 kg ; table 133 x 60 cm (version S 173 x 60 cm), réglable de 80 à 120 cm, 50 kg max ; profondeur du champ de travail 133 cm",
        "Filtre HEPA classe H14 : 99,995 % MPPS ; durée de vie 1 an ou 2 000 heures ; préfiltre en treillis nylon",
        "Débit d'air : 0,4 à 0,5 m/s, 400 m³/h ; zone de propreté < 5 UFC/m³",
        "Pointeur de zone stérile : laser classe 3R (5 mW, vert 520 nm) ; lecteur de code-barres laser classe 2 (1 mW, rouge 650 nm)",
        "Conditions : 0 à 30 °C, 5 à 80 % d'humidité sans condensation, 500 à 1 000 hPa",
        "Conformité : CE, directive 93/42/CEE relative aux dispositifs médicaux",
      ].join("\n"),
    },
    en: {
      nom: "Toul Meditech Opério® / SteriStay® — Laminar airflow generators",
      description:
        "The Opério® and SteriStay® generators protect the surgical site and instruments from airborne contamination, one of the causes of surgical site infections. " +
        "Room air passes through a HEPA H14 filter and a sterile laminar fabric: the ultra-clean air is directed without turbulence over the risk zone and pushes contaminated air away. " +
        "The sterile zone is shown by a light beam, and single-use sterile drapes are checked by a barcode reader. " +
        "Three versions: Opério® Mobile, a mobile unit with a removable instrument tray; Opério® Ceiling, a ceiling-mounted unit on an articulated arm that keeps the floor clear; SteriStay®, a mobile, height-adjustable instrument table with filtered airflow. " +
        "They work independently of the room's ventilation system.",
      fiche_technique: [
        "Opério® Mobile: 230 V, 290 W (standby 23 W); 45 x 60 x 170 cm; 42 kg; optional tray 45 x 60 or 40 x 50 cm, adjustable from 80 to 120 cm, 5 kg max; working field depth 120 cm",
        "Opério® Ceiling: 230 V, 160 W (standby 23 W); length 60 cm, reach 180 to 200 cm, width 25 cm, height 90 cm; 35 kg; working field depth 100 cm",
        "SteriStay®: 230 V, 160 W (standby 23 W); 170 x 60 x 170 cm; 60 kg; table 133 x 60 cm (S version 173 x 60 cm), adjustable from 80 to 120 cm, 50 kg max; working field depth 133 cm",
        "HEPA class H14 filter: 99.995% MPPS; lifetime 1 year or 2,000 hours; nylon mesh pre-filter",
        "Airflow: 0.4 to 0.5 m/s, 400 m³/h; clean zone < 5 CFU/m³",
        "Sterile zone pointer: class 3R laser (5 mW, green 520 nm); class 2 laser barcode reader (1 mW, red 650 nm)",
        "Conditions: 0 to 30 °C, 5 to 80% humidity non-condensing, 500 to 1,000 hPa",
        "Compliance: CE, Medical Devices Directive 93/42/EEC",
      ].join("\n"),
    },
  },
];

async function revert() {
  for (const p of PRODUCTS) {
    const n = await prisma.products.deleteMany({ where: { id: p.id } });
    console.log(`  delete product ${p.slug}: ${n.count}`);
  }
  const c = await prisma.categories.deleteMany({ where: { id: CATEGORY.id } });
  console.log(`  delete category ${CATEGORY.slug}: ${c.count}`);
  for (const p of PARTNERS) {
    const n = await prisma.partners.deleteMany({ where: { id: p.id } });
    console.log(`  delete partner ${p.slug}: ${n.count}`);
  }
}

async function main() {
  console.log(APPLY ? "== APPLY ==" : REVERT ? "== REVERT ==" : "== DRY-RUN ==");
  if (REVERT) return revert();
  const now = new Date();

  for (const p of PARTNERS) {
    const existing = await prisma.partners.findUnique({ where: { id: p.id } });
    if (existing) {
      if (existing.name === p.name) { console.log(`  [SKIP] partner ${p.slug}`); continue; }
      console.log(`  rename partner ${p.slug}: ${existing.name} -> ${p.name}`);
      if (APPLY) {
        await prisma.partners.update({ where: { id: p.id }, data: { name: p.name, updated_at: now } });
        await prisma.partner_translations.updateMany({ where: { partner_id: p.id }, data: { name: p.name } });
      }
      continue;
    }
    console.log(`  create partner ${p.slug}`);
    if (APPLY) await prisma.partners.create({ data: {
      id: p.id, name: p.name, slug: p.slug, website_url: p.website, logo_url: p.logo, default_pdf_url: p.pdf,
      type: "manufacturer", is_featured: false, sort_order: 99, status: "active", created_at: now, updated_at: now,
      partner_translations: { create: [
        { id: `${p.id}-fr`, language_code: "fr", name: p.name, description: p.fr },
        { id: `${p.id}-en`, language_code: "en", name: p.name, description: p.en },
      ] },
    } });
  }

  const parent = await prisma.categories.findUnique({ where: { slug: CATEGORY.parent }, include: { other_categories: { select: { sort_order: true, type: true } } } });
  if (!parent) { console.log(`  [MISSING] parent ${CATEGORY.parent}`); return; }
  if (await prisma.categories.findUnique({ where: { id: CATEGORY.id } })) console.log(`  [SKIP] category ${CATEGORY.slug}`);
  else {
    const sort = Math.max(0, ...parent.other_categories.map(c => c.sort_order)) + 1;
    const type = parent.other_categories[0]?.type || "equipment";
    console.log(`  create category ${CATEGORY.slug} under ${CATEGORY.parent} (sort ${sort}, type ${type})`);
    if (APPLY) await prisma.categories.create({ data: {
      id: CATEGORY.id, name: CATEGORY.fr, slug: CATEGORY.slug, parent_id: parent.id, sort_order: sort,
      is_active: true, type, image_url: CATEGORY.image, updated_at: now,
      category_translations: { create: [
        { id: `${CATEGORY.id}-fr`, language_code: "fr", name: CATEGORY.fr },
        { id: `${CATEGORY.id}-en`, language_code: "en", name: CATEGORY.en },
      ] },
    } });
  }

  for (const p of PRODUCTS) {
    if (await prisma.products.findUnique({ where: { id: p.id } })) { console.log(`  [SKIP] product ${p.slug}`); continue; }
    console.log(`  create product ${p.slug} (${p.images.length} photos, ${p.pdf})`);
    if (!APPLY) continue;
    await prisma.products.create({ data: {
      id: p.id, reference_fournisseur: p.ref, category_id: CATEGORY.id, constructeur: p.constructeur,
      slug: p.slug, status: "active", is_featured: false, sort_order: 0, pdf_brochure_url: p.pdf,
      partner_id: PARTNERS[p.partner].id, created_at: now, updated_at: now,
      product_translations: { create: ["fr", "en"].map(lang => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
      product_media: { create: p.images.map((img, i) => ({
        id: `${p.id}-m${i}`, type: "image", url: img.url, alt_text: img.alt, sort_order: i, is_primary: i === 0,
      })) },
    } });
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
