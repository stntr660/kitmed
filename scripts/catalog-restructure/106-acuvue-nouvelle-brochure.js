const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: « the brochure changed: delete all existing ACUVUE products and recreate
 * them from this brochure; use good images ». Source: « Brochure_johnson (2).pdf » (J&J Vision
 * Middle East, ACUVUE Products & Services Brochure, 28 p., © 2024).
 *
 * The brochure covers exactly 4 lens families (the rest is philosophy, fitting calculator,
 * fitting guides, J&J Vision and credo pages -- no product created for those):
 *   1-DAY ACUVUE® MOIST                    p.10-11 (+ fitting guide p.23)
 *   1-DAY ACUVUE® MOIST for ASTIGMATISM    p.12-13 (+ calculator p.22, guide p.23)
 *   ACUVUE® OASYS (HYDRACLEAR® PLUS)       p.16-17 (+ guide p.24)
 *   ACUVUE® OASYS for ASTIGMATISM          p.18-19 (+ calculator p.22, guide p.24)
 *
 * A) every J&J Vision ACUVUE product still active (snapshotted in 106-before.json) is ARCHIVED
 *    (never deleted). ACUVUE VITA is archived by script 104 too -- fine if already archived.
 * B) the 4 brochure lenses are created in Contactologie (slug oph-contactology), partner
 *    JOHNSON & JOHNSON VISION, FR/EN name + description + technical sheet from the brochure's
 *    « Product Specifications » tables and fitting guides, the brochure PDF
 *    (/uploads/pdfs/jnj-acuvue-brochure-produits.pdf) and 2 photos each (3/4 + front).
 *    Photos: the PDF packshots are low resolution (331-785 px), so they come from J&J Vision's
 *    official « ACUVUE Product Packshots » kit (jnjvisionpro.com/en-me, practice centre >
 *    promotional materials > logos & packshots, 2400x1800 PNG), rebuilt 1000x1000 on white,
 *    centred: /uploads/products/acuvue-<key>-106-{1,2}.jpg.
 * C) partner default_pdf_url = the new brochure, so /fr/catalogues lists it under J&J Vision
 *    (no J&J brochure was referenced before: default_pdf_url and all product PDFs were null).
 *
 * REVERT POINT: 106-before.json (--snapshot, refuses to overwrite) = status of every ACUVUE
 * product archived here + the partner's default_pdf_url. --revert deletes the 4 new products
 * (fixed ids), puts the statuses and the partner PDF back. ACUVUE VITA belongs to script 104:
 * --revert leaves it as it is.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 106-acuvue-nouvelle-brochure.js <app>:/tmp/106.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/106.js --snapshot   # writes /tmp/106-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/106.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/106.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/106.js --revert
 * (copy 106-before.json next to the script before --apply/--revert.) The 8 photos (products/)
 * and the brochure (pdfs/) are copied to the uploads volume first (chown 1001:65533).
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "106-before.json");
const now = () => new Date();

const PARTNER_ID = "4f9c451d-9287-4e32-a04c-ff9b788d090b"; // JOHNSON & JOHNSON VISION
const CONSTRUCTEUR = "johnson-johnson-vision";
const CATEGORY_SLUG = "oph-contactology";
const VITA = "c79544bd-54fa-4005-bee1-64ae2716c440"; // owned by script 104
const PDF = "/uploads/pdfs/jnj-acuvue-brochure-produits.pdf";
const pimg = (key, n) => `/uploads/products/acuvue-${key}-106-${n}.jpg`;
const pid = (n) => `d106a001-0000-4000-8000-00000000000${n}`;

const MFR = ["Fabricant : Johnson & Johnson Vision", "Manufacturer : Johnson & Johnson Vision"];
const P = [
  {
    key: "1day-moist", slug: "1-day-acuvue-moist", ref: "ACUVUE-1DAY-MOIST",
    nom: ["1-DAY ACUVUE® MOIST", "1-DAY ACUVUE® MOIST"],
    desc: [
      "Lentille de contact journalière jetable en hydrogel (etafilcon A) avec technologie LACREON® : l'agent mouillant PVP intégré à la lentille offre un coussin d'hydratation durable de 20 heures ou plus, et l'etafilcon A préserve le lysozyme du film lacrymal. Lentille journalière la plus vendue au monde, filtre UV classe 2. Existe aussi pour l'astigmatisme et la presbytie.",
      "Daily disposable hydrogel contact lens (etafilcon A) with LACREON® Technology: the PVP wetting agent locked into the lens provides a long-lasting cushion of moisture for 20 hours or more, and etafilcon A keeps the tear-film lysozyme in its natural state. The #1 selling daily disposable contact lens in the world, Class 2 UV blocking. Also available for astigmatism and presbyopia.",
    ],
    fiche: [
      ["Type : lentille journalière jetable, sphérique", "Matériau : etafilcon A (hydrogel)", "Technologie d'hydratation : LACREON®",
        "Teneur en eau : 58 %", "Transmissibilité à l'oxygène (Dk/t) : 25,5 x 10⁻⁹ (lentille -3,00 D, corrigée bord et limite)",
        "Flux d'oxygène (disponible pour la cornée) : 88 %", "Rayon de courbure : 8,5 mm ; 9,0 mm", "Diamètre : 14,2 mm",
        "Épaisseur au centre : 0,084 mm (lentille -3,00 D)",
        "Puissances : -0,50 D à -6,00 D (pas de 0,25 D) ; -6,50 D à -12,00 D (pas de 0,50 D) ; +0,50 D à +6,00 D (pas de 0,25 D)",
        "Filtre UV : classe 2 (99 % des UVB, 85 % des UVA)", "Aides à la manipulation : teinte de visibilité, indicateur d'inversion « 123 »",
        "Renouvellement : usage unique, remplacement journalier", "Conditionnement : boîte de 30 lentilles",
        "Lentille d'essai recommandée : 8,5 / 14,2 (alternative plus serrée : 9,0 / 14,2)"],
      ["Type : daily disposable lens, spherical", "Material : etafilcon A (hydrogel)", "Wetting technology : LACREON®",
        "Water content : 58%", "Oxygen transmissibility (Dk/t) : 25.5 x 10⁻⁹ (-3.00D lens, boundary and edge corrected)",
        "Oxygen flux (available to cornea) : 88%", "Base curve : 8.5 mm, 9.0 mm", "Diameter : 14.2 mm",
        "Centre thickness : 0.084 mm (-3.00D lens)",
        "Power range : -0.50D to -6.00D (0.25D steps); -6.50D to -12.00D (0.50D steps); +0.50D to +6.00D (0.25D steps)",
        "UV blocking : Class 2 (99% UVB, 85% UVA)", "Handling features : visibility tint, '123' inversion indicator",
        "Replacement : single use, daily replacement", "Pack : box of 30 lenses",
        "Recommended trial lens : 8.5 / 14.2 (steeper alternative: 9.0 / 14.2)"],
    ],
  },
  {
    key: "1day-moist-astigmatism", slug: "1-day-acuvue-moist-for-astigmatism", ref: "ACUVUE-1DAY-MOIST-ASTIG",
    nom: ["1-DAY ACUVUE® MOIST for ASTIGMATISM", "1-DAY ACUVUE® MOIST for ASTIGMATISM"],
    desc: [
      "Lentille de contact torique journalière jetable (etafilcon A) pour les patients astigmates. L'EYELID STABILISED DESIGN utilise les mouvements naturels des paupières : la lentille s'oriente en quelques minutes, se réaligne à chaque clignement et garde une vision claire et stable toute la journée, même lors des mouvements de tête et des yeux. Pas de prisme vertical dans la zone optique, aussi simple à adapter qu'une lentille sphérique. Technologie LACREON®, filtre UV classe 2.",
      "Daily disposable toric contact lens (etafilcon A) for astigmatic patients. The EYELID STABILISED DESIGN uses natural eyelid movement: the lens orients within minutes, realigns with every blink and keeps vision clear and stable all day, even with extensive head and eye movements. No vertical prism in the optic zone, as easy to fit as the spherical lens. LACREON® Technology, Class 2 UV blocking.",
    ],
    fiche: [
      ["Type : lentille journalière jetable, torique", "Matériau : etafilcon A (hydrogel)", "Géométrie : EYELID STABILISED DESIGN (stabilisation par les paupières)",
        "Technologie d'hydratation : LACREON®", "Teneur en eau : 58 %",
        "Transmissibilité à l'oxygène (Dk/t) : 23,8 x 10⁻⁹ (lentille -3,00 D, corrigée bord et limite)", "Flux d'oxygène (disponible pour la cornée) : 88 %",
        "Rayon de courbure : 8,5 mm", "Diamètre : 14,5 mm", "Épaisseur au centre : 0,090 mm (lentille -3,00 D)",
        "Plan à -6,00 D (pas de 0,25 D) : cylindres -0,75 / -1,25 / -1,75 D, axes 10° à 180° (pas de 10°) ; cylindre -2,25 D, axes 70°-110° et 20°-160° (pas de 10°)",
        "-6,50 D à -9,00 D (pas de 0,50 D) : cylindres -0,75 / -1,25 / -1,75 D, axes 70°-110° et 20°-160° (pas de 10°)",
        "+0,25 D à +4,00 D (pas de 0,25 D) : cylindres -0,75 / -1,25 / -1,75 D, axes 70°-110° et 20°-160° (pas de 10°)",
        "Filtre UV : classe 2 (99 % des UVB, 85 % des UVA)", "Repères d'orientation : traits verticaux à 6 h et 12 h", "Aide à la manipulation : teinte de visibilité",
        "Renouvellement : usage unique, remplacement journalier", "Conditionnement : boîte de 30 lentilles",
        "Aide à l'adaptation : calculateur ACUVUE® pour astigmatisme (jnjvisioncare.ae/contact-lens-astigmatism-calculator)"],
      ["Type : daily disposable lens, toric", "Material : etafilcon A (hydrogel)", "Lens design : EYELID STABILISED DESIGN",
        "Wetting technology : LACREON®", "Water content : 58%",
        "Oxygen transmissibility (Dk/t) : 23.8 x 10⁻⁹ (-3.00D lens, boundary and edge corrected)", "Oxygen flux (available to cornea) : 88%",
        "Base curve : 8.5 mm", "Diameter : 14.5 mm", "Centre thickness : 0.090 mm (-3.00D lens)",
        "Plano to -6.00D (0.25D steps) : -0.75 / -1.25 / -1.75 DC, axes 10-180 (10° steps); -2.25 DC, axes 70-110 and 20-160 (10° steps)",
        "-6.50D to -9.00D (0.50D steps) : -0.75 / -1.25 / -1.75 DC, axes 70-110 and 20-160 (10° steps)",
        "+0.25D to +4.00D (0.25D steps) : -0.75 / -1.25 / -1.75 DC, axes 70-110 and 20-160 (10° steps)",
        "UV blocking : Class 2 (99% UVB, 85% UVA)", "Orientation marks : vertical single lines at 6 and 12 o'clock", "Handling feature : visibility tint",
        "Replacement : single use, daily replacement", "Pack : box of 30 lenses",
        "Fitting aid : ACUVUE® Astigmatism Fitting Calculator (jnjvisioncare.ae/contact-lens-astigmatism-calculator)"],
    ],
  },
  {
    key: "oasys", slug: "acuvue-oasys-hydraclear-plus", ref: "ACUVUE-OASYS-2W",
    nom: ["ACUVUE® OASYS avec HYDRACLEAR® PLUS", "ACUVUE® OASYS with HYDRACLEAR® PLUS"],
    desc: [
      "Lentille de contact en silicone hydrogel (senofilcon A) à remplacement toutes les 2 semaines. La technologie HYDRACLEAR® PLUS intègre un agent mouillant (PVP) qui imite les mucines des larmes et aide à garder un film lacrymal stable : vision de qualité et moins de sensation de fatigue oculaire devant les écrans. Jamais battue en confort sur 27 études cliniques, filtre UV classe 1, le plus haut niveau de protection UVA et UVB. Lentille de contact la plus vendue au monde.",
      "Silicone hydrogel contact lens (senofilcon A) replaced every 2 weeks. HYDRACLEAR® PLUS Technology embeds a wetting agent (PVP) that mimics tear mucins and helps keep a stable tear film: excellent quality of vision and less feeling of tired eyes when using digital screens. Never beaten in comfort across 27 clinical studies, Class 1 UV blocking, the highest level of UV-A and UV-B protection. The #1 selling contact lens in the world.",
    ],
    fiche: [
      ["Type : lentille à remplacement fréquent (2 semaines), sphérique", "Matériau : senofilcon A (silicone hydrogel)", "Technologie d'hydratation : HYDRACLEAR® PLUS",
        "Teneur en eau : 38 %", "Transmissibilité à l'oxygène (Dk/t) : 147 x 10⁻⁹ (lentille -3,00 D, corrigée bord et limite)",
        "Flux d'oxygène (disponible pour la cornée) : 98 % yeux ouverts, 96 % yeux fermés", "Rayon de courbure : 8,4 mm ; 8,8 mm", "Diamètre : 14,0 mm",
        "Épaisseur au centre : 0,07 mm (lentille -3,00 D)",
        "Puissances : -0,50 D à -6,00 D (pas de 0,25 D) ; -6,50 D à -12,00 D (pas de 0,50 D) ; +0,50 D à +6,00 D (pas de 0,25 D) ; +6,50 D à +8,00 D (pas de 0,50 D) ; lentille plan disponible pour usage thérapeutique",
        "Filtre UV : classe 1 (plus de 99,9 % des UVB, 96,1 % des UVA)", "Aides à la manipulation : teinte de visibilité, indicateur d'inversion « 123 »",
        "Renouvellement : port journalier, toutes les 2 semaines ; port prolongé, chaque semaine", "Conditionnement : boîte de 6 lentilles",
        "Lentille d'essai recommandée : 8,4 / 14,0 (alternative plus serrée : 8,8 / 14,0)"],
      ["Type : frequent replacement lens (2 weeks), spherical", "Material : senofilcon A (silicone hydrogel)", "Wetting technology : HYDRACLEAR® PLUS",
        "Water content : 38%", "Oxygen transmissibility (Dk/t) : 147 x 10⁻⁹ (-3.00D lens, boundary and edge corrected)",
        "Oxygen flux (available to cornea) : 98% open eye, 96% closed eye", "Base curve : 8.4 mm, 8.8 mm", "Diameter : 14.0 mm",
        "Centre thickness : 0.07 mm (-3.00D lens)",
        "Power range : -0.50D to -6.00D (0.25D steps); -6.50D to -12.00D (0.50D steps); +0.50D to +6.00D (0.25D steps); +6.50D to +8.00D (0.50D steps); plano lens available for therapeutic use",
        "UV blocking : Class 1 (>99.9% UVB, 96.1% UVA)", "Handling features : visibility tint, '123' inversion indicator",
        "Replacement : daily wear, every 2 weeks; extended wear, every week", "Pack : box of 6 lenses",
        "Recommended trial lens : 8.4 / 14.0 (steeper alternative: 8.8 / 14.0)"],
    ],
  },
  {
    key: "oasys-astigmatism", slug: "acuvue-oasys-for-astigmatism", ref: "ACUVUE-OASYS-2W-ASTIG",
    nom: ["ACUVUE® OASYS for ASTIGMATISM", "ACUVUE® OASYS for ASTIGMATISM"],
    desc: [
      "Lentille de contact torique en silicone hydrogel (senofilcon A) à remplacement toutes les 2 semaines, pour les patients astigmates qui veulent une vision claire et stable. L'EYELID STABILISED DESIGN s'oriente en quelques minutes et se réaligne à chaque clignement, même lors des mouvements de tête et des yeux, sans prisme vertical dans la zone optique. Technologie HYDRACLEAR® PLUS, jamais battue en confort sur 27 études cliniques, filtre UV classe 1.",
      "Toric silicone hydrogel contact lens (senofilcon A) replaced every 2 weeks, for astigmatic patients who need clear, stable vision. The EYELID STABILISED DESIGN orients within minutes and realigns with every blink, even with extensive head and eye movements, with no vertical prism in the optic zone. HYDRACLEAR® PLUS Technology, never beaten in comfort across 27 clinical studies, Class 1 UV blocking.",
    ],
    fiche: [
      ["Type : lentille à remplacement fréquent (2 semaines), torique", "Matériau : senofilcon A (silicone hydrogel)",
        "Géométrie : EYELID STABILISED DESIGN (stabilisation par les paupières)", "Technologie d'hydratation : HYDRACLEAR® PLUS", "Teneur en eau : 38 %",
        "Transmissibilité à l'oxygène (Dk/t) : 129 x 10⁻⁹ (lentille -3,00 D, corrigée bord et limite)",
        "Flux d'oxygène (disponible pour la cornée) : 98 % yeux ouverts, 95 % yeux fermés",
        "Rayon de courbure : 8,6 mm", "Diamètre : 14,5 mm", "Épaisseur au centre : 0,080 mm (lentille -3,00 D)",
        "Plan à -6,00 D (pas de 0,25 D) : cylindres -0,75 / -1,25 / -1,75 D, axes 10° à 180° (pas de 10°) ; cylindres -2,25 / -2,75 D, axes 70°-110° et 20°-160° (pas de 10°)",
        "-6,50 D à -9,00 D (pas de 0,50 D) : cylindres -0,75 / -1,25 D, axes 10° à 180° (pas de 10°) ; cylindres -1,75 / -2,25 / -2,75 D, axes 20°-160° (pas de 10°)",
        "+0,25 D à +6,00 D (pas de 0,25 D) : cylindres -0,75 / -1,25 / -1,75 D, axes 70°-110° et 20°-160° (pas de 10°)",
        "Filtre UV : classe 1 (plus de 99,9 % des UVB, 96,1 % des UVA)", "Repères d'orientation : traits verticaux à 6 h et 12 h", "Aide à la manipulation : teinte de visibilité",
        "Renouvellement : port journalier, toutes les 2 semaines ; port prolongé, chaque semaine", "Conditionnement : boîte de 6 lentilles",
        "Aide à l'adaptation : calculateur ACUVUE® pour astigmatisme (jnjvisioncare.ae/contact-lens-astigmatism-calculator)"],
      ["Type : frequent replacement lens (2 weeks), toric", "Material : senofilcon A (silicone hydrogel)",
        "Lens design : EYELID STABILISED DESIGN", "Wetting technology : HYDRACLEAR® PLUS", "Water content : 38%",
        "Oxygen transmissibility (Dk/t) : 129 x 10⁻⁹ (-3.00D lens, boundary and edge corrected)",
        "Oxygen flux (available to cornea) : 98% open eye, 95% closed eye",
        "Base curve : 8.6 mm", "Diameter : 14.5 mm", "Centre thickness : 0.080 mm (-3.00D lens)",
        "Plano to -6.00D (0.25D steps) : -0.75 / -1.25 / -1.75 DC, axes 10-180 (10° steps); -2.25 / -2.75 DC, axes 70-110 and 20-160 (10° steps)",
        "-6.50D to -9.00D (0.50D steps) : -0.75 / -1.25 DC, axes 10-180 (10° steps); -1.75 / -2.25 / -2.75 DC, axes 20-160 (10° steps)",
        "+0.25D to +6.00D (0.25D steps) : -0.75 / -1.25 / -1.75 DC, axes 70-110 and 20-160 (10° steps)",
        "UV blocking : Class 1 (>99.9% UVB, 96.1% UVA)", "Orientation marks : vertical single lines at 6 and 12 o'clock", "Handling feature : visibility tint",
        "Replacement : daily wear, every 2 weeks; extended wear, every week", "Pack : box of 6 lenses",
        "Fitting aid : ACUVUE® Astigmatism Fitting Calculator (jnjvisioncare.ae/contact-lens-astigmatism-calculator)"],
    ],
  },
];

const PRODUCTS = P.map((p, i) => ({
  id: pid(i + 1), slug: p.slug, ref: p.ref, key: p.key, sort: i + 1,
  fr: { nom: p.nom[0], description: p.desc[0], fiche_technique: [MFR[0], ...p.fiche[0]].join("\n") },
  en: { nom: p.nom[1], description: p.desc[1], fiche_technique: [MFR[1], ...p.fiche[1]].join("\n") },
}));
const NEW_IDS = PRODUCTS.map((p) => p.id);
const media = (p) => [1, 2].map((n) => ({
  id: `${p.id}-m106-${n}`, type: "image", url: pimg(p.key, n), alt_text: p.fr.nom, title: p.fr.nom, sort_order: n - 1, is_primary: n === 1 }));

const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const TXT = ["nom", "description", "fiche_technique"];

// ACUVUE products of J&J Vision (other than ours): name or reference contains ACUVUE, or in Contactologie.
async function oldAcuvue() {
  return prisma.products.findMany({
    where: { id: { notIn: NEW_IDS }, OR: [{ partner_id: PARTNER_ID }, { constructeur: CONSTRUCTEUR }],
      AND: [{ OR: [{ reference_fournisseur: { contains: "ACUVUE", mode: "insensitive" } }, { categories: { slug: CATEGORY_SLUG } },
        { product_translations: { some: { nom: { contains: "ACUVUE", mode: "insensitive" } } } }] }] },
    include: { product_translations: { where: { language_code: "fr" } } },
  });
}

async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const rows = await oldAcuvue();
  const partner = await prisma.partners.findUnique({ where: { id: PARTNER_ID } });
  const out = { taken_at: now().toISOString(), partner: { id: PARTNER_ID, default_pdf_url: partner.default_pdf_url },
    products: Object.fromEntries(rows.map((p) => [p.id, { ref: p.reference_fournisseur, slug: p.slug, nom: p.product_translations[0]?.nom, status: p.status }])) };
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${rows.length} ACUVUE products + partner pdf -> ${BEFORE_FILE}`);
}

async function apply(BEFORE) {
  for (const f of [PDF, ...PRODUCTS.flatMap((p) => media(p).map((m) => m.url))]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);

  // A: archive the old ACUVUE products (those of the snapshot + any found now)
  const rows = await oldAcuvue();
  const unknown = rows.filter((r) => !BEFORE.products[r.id]);
  if (unknown.length) console.log(`  [NOT IN SNAPSHOT, left alone] ${unknown.map((r) => r.reference_fournisseur).join(", ")}`);
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) { console.log(`  [MISSING] ${b.ref}`); continue; }
    if (p.status === "archived") { console.log(`  [SKIP] ${b.ref} « ${b.nom} » already archived`); continue; }
    console.log(`  archive ${b.ref} « ${b.nom} »: ${p.status} -> archived`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }

  // B: the 4 brochure lenses
  const cat = await prisma.categories.findUnique({ where: { slug: CATEGORY_SLUG } });
  if (!cat) throw new Error(`category ${CATEGORY_SLUG} not found`);
  for (const p of PRODUCTS) {
    const dup = await prisma.products.findFirst({ where: { id: { not: p.id }, OR: [{ reference_fournisseur: p.ref }, { slug: p.slug }] } });
    if (dup) { console.log(`  [DUPLICATE] ${p.slug} [${p.ref}] already used by ${dup.slug} -- skipped`); continue; }
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const m = media(p);
    if (!row) {
      console.log(`  + product ${p.slug} [${p.ref}] « ${p.fr.nom} »`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: cat.id, constructeur: CONSTRUCTEUR, partner_id: PARTNER_ID,
        status: "active", sort_order: p.sort, pdf_brochure_url: PDF, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: m } } });
      continue;
    }
    const data = {};
    for (const [k, v] of [["category_id", cat.id], ["status", "active"], ["sort_order", p.sort], ["pdf_brochure_url", PDF],
      ["reference_fournisseur", p.ref], ["constructeur", CONSTRUCTEUR], ["partner_id", PARTNER_ID], ["slug", p.slug]]) if (row[k] !== v) data[k] = v;
    const tr = ["fr", "en"].filter((lang) => { const t = row.product_translations.find((x) => x.language_code === lang); return !t || TXT.some((k) => !same(t[k], p[lang][k])); });
    const mediaOk = row.product_media.length === m.length && m.every((x) => row.product_media.some((y) => y.url === x.url && y.is_primary === x.is_primary && y.sort_order === x.sort_order && y.alt_text === x.alt_text));
    if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${p.slug}`); continue; }
    console.log(`  product ${p.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : " photos"}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: `${p.id}-${lang}`, product_id: p.id, language_code: lang, ...p[lang] } });
      if (!mediaOk) { await tx.product_media.deleteMany({ where: { product_id: p.id } }); for (const x of m) await tx.product_media.create({ data: { ...x, product_id: p.id } }); }
    });
  }

  // C: partner catalogue = the new brochure
  const partner = await prisma.partners.findUnique({ where: { id: PARTNER_ID } });
  if (partner.default_pdf_url === PDF) console.log("  [SKIP] partner pdf");
  else {
    console.log(`  partner ${partner.slug} default_pdf_url ${partner.default_pdf_url} -> ${PDF}`);
    if (WRITE) await prisma.partners.update({ where: { id: PARTNER_ID }, data: { default_pdf_url: PDF, updated_at: now() } });
  }
}

async function revert(BEFORE) {
  const n = await prisma.products.deleteMany({ where: { id: { in: NEW_IDS } } });
  console.log(`  - deleted ${n.count} new products`);
  for (const [id, b] of Object.entries(BEFORE.products)) {
    if (id === VITA) { console.log(`  [SKIP] ${b.ref} (owned by script 104)`); continue; }
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p || p.status === b.status) continue;
    console.log(`  ${b.ref}: ${p.status} -> ${b.status}`);
    await prisma.products.update({ where: { id }, data: { status: b.status, updated_at: now() } });
  }
  const partner = await prisma.partners.findUnique({ where: { id: PARTNER_ID } });
  if (partner.default_pdf_url !== BEFORE.partner.default_pdf_url) {
    console.log(`  partner pdf ${partner.default_pdf_url} -> ${BEFORE.partner.default_pdf_url}`);
    await prisma.partners.update({ where: { id: PARTNER_ID }, data: { default_pdf_url: BEFORE.partner.default_pdf_url, updated_at: now() } });
  }
}

(async () => {
  if (SNAPSHOT) return snapshot();
  const BEFORE = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  return REVERT ? revert(BEFORE) : apply(BEFORE);
})()
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
