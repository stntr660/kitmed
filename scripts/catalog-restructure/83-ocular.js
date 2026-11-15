const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- Lot D, OCULAR Instruments catalogue (« CATALOGUE OCULAR.pdf », 73 p.).
 *
 * Ophtalmologie > Appareillage > « Verres ophtalmiques » (verres-ophtalmoscope-et-skeepens)
 * only held 3 OCULAR placeholder rows (« Lentilles pour Laser Ophtalmologique »,
 * « Verres d'Examen Ophtalmologique », « Accessoires pour Verres d'Examen Oculaire »).
 * It is rebuilt from the catalogue as 8 sub-categories following the catalogue's sections:
 *
 *   Verres laser argon / diode        p.4-13
 *   Verres laser YAG                  p.14-16
 *   Verres de diagnostic              p.17-23  (3-4 miroirs, gonio, fond d'œil)
 *   Verres indirects (MaxField / MaxLight)  p.24-33
 *   Systèmes grand angle chirurgicaux p.34-39
 *   Verres chirurgicaux               p.39-48
 *   Tonomètres                        p.51-52
 *   Modèles d'œil et accessoires      p.49-57  (SLO, recherche, modèles d'œil, étuis, collerettes)
 *
 * One product per lens family (41 products); every catalogue code of the family is
 * listed with its differences in the fiche technique (FR + EN). Each product gets its
 * photo cropped from the catalogue (ocular-*.jpg), the catalogue PDF
 * (/uploads/pdfs/ocular-catalogue-produits.pdf, images recompressed) and partner OCULAR.
 * The 3 placeholder rows are archived (never deleted); the 8 OCULAR rows already
 * archived stay archived. The parent's FR/EN description (« Verres d'essai, montures
 * et ophtalmoscopes ») is replaced by one matching its new content.
 *
 * REVERT POINT: 83-before.json = the parent category (+ translations) and the 11 OCULAR
 * placeholder products (row, translations, media) as of 2026-11-15. --revert writes them
 * back, deletes the 41 new products and the 8 new sub-categories.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 83-ocular.js <app>:/tmp/83.js ; docker cp 83-before.json <app>:/tmp/83-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/83.js [--snapshot|--apply|--revert]
 * The ocular-*.jpg photos (products/), ocular-tile-*.jpg tiles (categories/) and the
 * catalogue PDF (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "83-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();

const PARENT = "verres-ophtalmoscope-et-skeepens";
const OCULAR = "316d7982-4ea8-49d6-b82a-230b1357ed7c";
const PDF = "/uploads/pdfs/ocular-catalogue-produits.pdf";
const pimg = (n) => `/uploads/products/ocular-${n}.jpg`;
const cimg = (n) => `/uploads/categories/ocular-tile-${n}.jpg`;
const PARENT_DESC = {
  fr: "Verres d'examen, de laser et de chirurgie Ocular Instruments",
  en: "Ocular Instruments examination, laser and surgical lenses",
};

// the 3 active placeholders (archived here) + the 8 already archived (kept archived)
const ARCHIVE = ["oph-1768243484701-sb8kiqzte", "oph-1768243484414-q3txdxrw9", "oph-1768243484955-evah0e3ek"];
const KEEP_ARCHIVED = [
  "oph-1768243484828-flbb75w0v", "oph-1768243485086-1i97bfznh", "oph-1768243485214-keolanyua", "oph-1768243485463-irg4j5esi",
  "oph-1768243485341-3im66hf4b", "oph-1768243482568-2ebuvyhca", "oph-1768243484530-63j802q5j", "oph-1768243485629-eoszk662l",
];

// ---------------------------------------------------------------- categories
const cid = (n) => `c83a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const CATS = [
  { slug: "ocular-verres-laser-argon-diode", fr: "Verres laser argon / diode", en: "Argon / diode laser lenses",
    dfr: "Verres de contact Ocular pour photocoagulation laser argon et diode : rétine, panfundoscopie, gonioscopie, iridotomie et suturolyse.",
    den: "Ocular contact lenses for argon and diode laser photocoagulation: retina, panfundoscopy, gonioscopy, iridotomy and suture lysis." },
  { slug: "ocular-verres-laser-yag", fr: "Verres laser YAG", en: "YAG laser lenses",
    dfr: "Verres Ocular pour laser Nd:YAG : iridotomie, capsulotomie, trabéculoplastie sélective (SLT) et traitement du vitré.",
    den: "Ocular lenses for Nd:YAG laser: iridotomy, capsulotomy, selective laser trabeculoplasty (SLT) and vitreous treatment." },
  { slug: "ocular-verres-diagnostic", fr: "Verres de diagnostic", en: "Diagnostic lenses",
    dfr: "Verres de diagnostic Ocular : trois miroirs, gonioscopes 1, 2 et 4 miroirs, gonioprismes et verres de fond d'œil.",
    den: "Ocular diagnostic lenses: three mirror lenses, one, two and four mirror gonio lenses, gonioprisms and fundus lenses." },
  { slug: "ocular-verres-indirects", fr: "Verres indirects (MaxField / MaxLight)", en: "Indirect lenses (MaxField / MaxLight)",
    dfr: "Loupes asphériques Ocular MaxLight (CR-39), MaxField (verre) et MaxAC (autoclavables) pour ophtalmoscopie indirecte et lampe à fente.",
    den: "Ocular MaxLight (CR-39), MaxField (glass) and MaxAC (autoclavable) aspheric lenses for indirect ophthalmoscopy and slit lamp." },
  { slug: "ocular-systemes-grand-angle", fr: "Systèmes grand angle chirurgicaux", en: "Wide angle surgical systems",
    dfr: "Verres de vitrectomie grand angle Landers et Woldoff, inverseur IVS et système de visualisation SVS.",
    den: "Landers and Woldoff wide angle vitrectomy lenses, IVS inverter and SVS surgical viewing system." },
  { slug: "ocular-verres-chirurgicaux", fr: "Verres chirurgicaux", en: "Surgical lenses",
    dfr: "Verres de vitrectomie (jetables, à infusion, sets Landers, pédiatriques), anneaux, gonioprismes chirurgicaux et kératoprothèses temporaires.",
    den: "Vitrectomy lenses (disposable, infusion, Landers sets, pediatric), lens rings, surgical gonioprisms and temporary keratoprostheses." },
  { slug: "ocular-tonometres", fr: "Tonomètres", en: "Tonometers",
    dfr: "Tonomètres Barraquer de bloc opératoire (principe d'aplanation de Maklakov).",
    den: "Barraquer operating room tonometers (Maklakov applanation principle)." },
  { slug: "ocular-modeles-oeil-accessoires", fr: "Modèles d'œil et accessoires", en: "Eye models and accessories",
    dfr: "Verres SLO et de recherche, modèles d'œil pédagogiques, étuis, boîtes de stérilisation, collerettes et accessoires Ocular.",
    den: "SLO and research lenses, teaching eye models, cases, sterilization trays, flanges and Ocular accessories." },
].map((c, i) => ({ ...c, id: cid(i + 1), sort: i + 1, image: c.slug.replace(/^ocular-(verres-)?/, "").replace("systemes-", "").replace("modeles-oeil-", "modeles-") }));
// tiles: laser-argon-diode, laser-yag, diagnostic, indirects, grand-angle, chirurgicaux, tonometres, modeles-accessoires

// ---------------------------------------------------------------- spec helpers
const LBL = {
  im: ["grandissement image", "image mag."], ls: ["grandissement spot laser", "laser spot mag."], gm: ["grandissement gonio", "gonio mag."],
  cd: ["diamètre de contact", "contact diam."], h: ["hauteur", "lens height"], rd: ["diamètre de l'anneau", "ring diam."],
  hl: ["longueur du manche", "handle length"], fl: ["diamètre de collerette", "flange diam."], sf: ["champ statique", "static FOV"],
  df: ["champ dynamique", "dynamic FOV"], gf: ["champ gonio statique", "static gonio FOV"], wd: ["distance de travail", "working distance"],
  ca: ["ouverture utile", "clear aperture"], w: ["poids", "weight"], p: ["puissance", "power"], u: ["usage", "use"],
};
const UNIT = { cd: " mm", h: " mm", rd: " mm", hl: " mm", fl: " mm", wd: " mm", ca: " mm", w: " g", sf: "°", df: "°", gf: "°" };
const num = (v, lang) => (lang === "fr" ? String(v).replace(/(\d)\.(\d)/g, "$1,$2").replace(/^\./, "0,") : String(v).replace(/^\./, "0."));
// r(code, [labelFr, labelEn] | null, {fields}, noMethylcellulose)
const r = (code, label, f = {}, nm = false) => ({ code, label, f, nm });
const line = (x, lang) => {
  const i = lang === "fr" ? 0 : 1;
  const parts = Object.entries(x.f).map(([k, v]) => {
    const val = Array.isArray(v) ? v[i] : num(v, lang) + (UNIT[k] || "");
    return `${LBL[k][i]} ${val}`;
  });
  if (x.nm) parts.push(lang === "fr" ? "sans méthylcellulose" : "no methylcellulose required");
  const head = x.label ? `${x.code} — ${x.label[i]}` : x.code;
  return parts.length ? `${head}${lang === "fr" ? " : " : ": "}${parts.join(", ")}` : head;
};
const fiche = (rows, notes, lang) => [
  lang === "fr" ? "Fabricant : Ocular Instruments" : "Manufacturer: Ocular Instruments",
  lang === "fr" ? "Références :" : "Product codes:",
  ...rows.map((x) => line(x, lang)),
  ...(notes || []).map((n) => n[lang === "fr" ? 0 : 1]),
].join("\n");
const LL = ["Traitement antireflet Laserlight®.", "Laserlight® anti-reflective coating."];
const LLHD = ["Traitement antireflet Laserlight® HD disponible.", "Laserlight® HD anti-reflective coating available."];
const RINGS = ["Bague de maintien disponible en rouge, bleu, vert, or, violet ou noir.", "Holding ring available in red, blue, green, gold, purple or black."];
const x = (s) => [s, s.replace(/(\d),(\d)/g, "$1.$2")]; // same label in both languages

// ---------------------------------------------------------------- products
const pid = (n) => `d83a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const P = [];
const add = (cat, key, ref, fr, en, rows, notes) => P.push({ cat, key, ref, fr, en, rows, notes });

// === Verres laser argon / diode
add("ocular-verres-laser-argon-diode", "reichel-mainster", "ORMR-1X / ORMR-2X / OPR-120",
  { nom: "Verres rétine Reichel-Mainster 1X / 2X et ProRetina 120 PB", description: "Verres de contact rétine à haute résolution pour le diagnostic et la photocoagulation focale, en grille et panrétinienne (thermothérapie transpupillaire, thérapie photodynamique, néovascularisation choroïdienne, rétinopathie diabétique, occlusions veineuses). Le Reichel-Mainster 2X garde une excellente image à travers des milieux troubles ; le ProRetina 120 PB, de forme tubulaire asphérique, facilite le traitement des patients à arcade sourcilière proéminente et l'accès à la périphérie rétinienne. Le modèle ORMR-1X-P a un diamètre de contact réduit pour l'enfant." },
  { nom: "Reichel-Mainster 1X / 2X and ProRetina 120 PB retina lenses", description: "High resolution retina contact lenses for diagnosis and focal, grid and panretinal photocoagulation (transpupillary thermotherapy, photodynamic therapy, choroidal neovascularization, diabetic retinopathy, retinal vascular occlusion). The Reichel-Mainster 2X keeps an outstanding image through hazy media; the tubular aspheric ProRetina 120 PB simplifies treatment of patients with prominent brows and access to the retinal periphery. The ORMR-1X-P has a smaller contact diameter for pediatric patients." },
  [r("ORMR-1X", x("Reichel-Mainster 1X"), { im: ".95x", ls: "1.05x", cd: "16.5", h: "30", sf: 102, df: 133 }),
   r("ORMR-1X-2", x("Reichel-Mainster 1X NMR"), { im: ".95x", ls: "1.05x", cd: "15", h: "29.5", sf: 102, df: 133 }, true),
   r("ORMR-1X-P", ["Reichel-Mainster 1X pédiatrique", "Reichel-Mainster 1X pediatric"], { im: "1.08x", ls: ".93x", cd: "15", h: "31", sf: 98, df: 126 }),
   r("ORMR-2X", x("Reichel-Mainster 2X"), { im: ".50x", ls: "2.00x", cd: "16.5", h: "27.5", sf: 117, df: 142 }),
   r("ORMR-2X-2", x("Reichel-Mainster 2X NMR"), { im: ".50x", ls: "2.00x", cd: "15.5", h: "27", sf: 117, df: 142 }, true),
   r("OPR-120", x("ProRetina 120 PB"), { im: ".50x", ls: "2.00x", cd: "16", h: "35.5", sf: 120, df: 136 }),
   r("OPR-120-2", x("ProRetina 120 PB NMR"), { im: ".50x", ls: "2.00x", cd: "14", h: "35", sf: 120, df: 136 }, true)],
  [LL, LLHD]);
add("ocular-verres-laser-argon-diode", "mainster", "OMRA-PRP 165 / OMRA-WF / OMRA-S / OMRA-HM / OPDT",
  { nom: "Verres rétine Mainster (PRP 165, Wide Field, Focal/Grid, High Mag) et PDT 1.6X", description: "Gamme de verres de contact Mainster pour la photocoagulation rétinienne : PRP 165 (le plus grand champ pour la panphotocoagulation, collerette Securefit®), Wide Field (panphotocoagulation de la rétinopathie diabétique proliférante), Focal/Grid ex-Standard (traitement focal et en grille du pôle postérieur à la moyenne périphérie, œdème maculaire), High Magnification (fort grandissement pour la macula) et PDT 1.6X (dégénérescence maculaire, grande zone de traitement). Chaque verre existe en version standard et en version NMR (-2) sans méthylcellulose." },
  { nom: "Mainster retina lenses (PRP 165, Wide Field, Focal/Grid, High Mag) and PDT 1.6X", description: "Range of Mainster contact lenses for retinal photocoagulation: PRP 165 (widest field for panretinal photocoagulation, Securefit® flange), Wide Field (panretinal photocoagulation in proliferative diabetic retinopathy), Focal/Grid formerly Standard (focal and grid treatment from the posterior pole to the mid-periphery, macular edema), High Magnification (very high magnification for the macula) and PDT 1.6X (macular degeneration, larger treatment area). Each lens comes in a standard and an NMR (-2) no-methylcellulose version." },
  [r("OMRA-PRP 165", x("Mainster PRP 165"), { im: ".51x", ls: "1.96x", cd: "17.5", h: "28.1", sf: 165, df: 180 }),
   r("OMRA-PRP-165-2", x("Mainster PRP 165 NMR"), { im: ".51x", ls: "1.96x", cd: "16.5", h: "27.7", sf: 165, df: 180 }, true),
   r("OMRA-WF", x("Mainster Wide Field"), { im: ".68x", ls: "1.50x", cd: "15.5", h: "28", sf: 118, df: 127 }),
   r("OMRA-WF-2", x("Mainster Wide Field NMR"), { im: ".68x", ls: "1.50x", cd: "12", h: "26.5", sf: 118, df: 127 }, true),
   r("OMRA-S", x("Mainster (Standard) Focal/Grid"), { im: ".96x", ls: "1.05x", cd: "15.5", h: "32.5", sf: 90, df: 121 }),
   r("OMRA-S-2", x("Mainster (Standard) Focal/Grid NMR"), { im: ".96x", ls: "1.05x", cd: "12", h: "31", sf: 90, df: 121 }, true),
   r("OMRA-HM", x("Mainster High Magnification"), { im: "1.25x", ls: ".80x", cd: "15.5", h: "27.5", sf: 75, df: 88 }),
   r("OMRA-HM-2", x("Mainster High Magnification NMR"), { im: "1.25x", ls: ".80x", cd: "12", h: "26.5", sf: 75, df: 88 }, true),
   r("OPDT", x("PDT 1.6X"), { im: ".63x", ls: "1.60x", cd: "15.5", h: "32.5", sf: 120, df: 133 }),
   r("OPDT-2", x("PDT 1.6X NMR"), { im: ".63x", ls: "1.60x", cd: "12", h: "31", sf: 120, df: 133 }, true)],
  [LL, ["Taille du spot rétinien = réglage du spot laser x facteur de grandissement du spot laser.", "Retinal spot size = laser spot setting x laser spot magnification factor."]]);
add("ocular-verres-laser-argon-diode", "trois-miroirs-laser", "OG3MA / OJKA",
  { nom: "Verres laser trois miroirs universels et Karickhoff", description: "Verre « Goldmann » trois miroirs (59°, 67° et 73°) pour la visualisation et le traitement laser du fond d'œil et de l'angle irido-cornéen, le pôle postérieur étant vu par le centre du verre ; nombreuses hauteurs et diamètres disponibles. Le Karickhoff ajoute quatre miroirs (62°, 67°, 76°, 80°) repérés par des « points de profondeur » à une vue axiale centrale, pour une vue complète de l'intérieur de l'œil. Grandissement gonio 0,80x, spot laser gonio 1,25x." },
  { nom: "Universal three mirror and Karickhoff laser lenses", description: "Classic « Goldmann » three mirror lens (59°, 67° and 73°) for viewing and laser treatment of the fundus and the anterior chamber angle, the posterior pole being viewed through the centre of the lens; many heights and diameters available. The Karickhoff adds four mirrors (62°, 67°, 76°, 80°) marked with « depth dots » to a central axis view, for a complete view of the interior of the eye. Gonio mag. 0.80x, gonio laser spot mag. 1.25x." },
  [r("OG3MA", x("Universal"), { im: ".93x", ls: "1.08x", cd: "18", h: "32", gf: 140 }),
   r("OG3MA-2", x("NMR"), { im: ".93x", ls: "1.08x", cd: "16", h: "32", gf: 140 }, true),
   r("OG3MFA", ["avec collerette", "with flange"], { im: ".93x", ls: "1.08x", cd: "20", h: "33", gf: 140 }),
   r("OG3MIA", x("15 mm"), { im: ".93x", ls: "1.08x", cd: "15", h: "28", gf: 140 }),
   r("OG3MPA", x("17 mm"), { im: ".93x", ls: "1.08x", cd: "17", h: "26", gf: 140 }),
   r("OG3MSA", ["petit", "small"], { im: ".93x", ls: "1.08x", cd: "18", h: "24", gf: 140 }),
   r("OG3MSA-2", ["NMR petit", "NMR small"], { im: ".93x", ls: "1.08x", cd: "16", h: "23", gf: 140 }, true),
   r("OG3MA-13", ["NMR petite fente palpébrale", "NMR small fissure"], { im: ".93x", ls: "1.08x", cd: "13", h: "28", gf: 140 }, true),
   r("OJKA", x("Karickhoff"), { im: ".93x", ls: "1.08x", cd: "18", h: "32", gf: 140 }),
   r("OJKFA", ["Karickhoff avec collerette", "Karickhoff with flange"], { im: ".93x", ls: "1.08x", cd: "20", h: "32.5", gf: 140 })],
  [LL]);
add("ocular-verres-laser-argon-diode", "gonio-laser", "OSMGA / O2MA / O4GFA / OT4MGA / ORTA",
  { nom: "Verres laser gonioscopiques et de trabéculoplastie", description: "Verres pour la gonioscopie et la trabéculoplastie laser : Single Mirror (un miroir de 62°, bague moletée compacte), Two Mirror (deux miroirs opposés de 62°, vue complète de l'angle avec une rotation de 180°), Four Mirror Mini (quatre miroirs de 62°, petite collerette pour fentes palpébrales étroites, petite ou grande bague), Thorpe (quatre miroirs de 62° avec vue du pôle postérieur) et Ritch Trabeculoplasty (deux miroirs de 59° et deux de 64°, boutons grossissants 1,4x qui réduisent le spot de 30 %). Les versions -2 / NMR-K s'utilisent sans méthylcellulose. Pour le Magna View, voir les verres de diagnostic." },
  { nom: "Gonio and trabeculoplasty laser lenses", description: "Lenses for gonioscopy and laser trabeculoplasty: Single Mirror (one 62° mirror, compact knurled ring), Two Mirror (two opposing 62° mirrors, complete view of the angle with a 180° rotation), Four Mirror Mini (four 62° mirrors, small flange for small palpebral fissures, small or large ring), Thorpe (four 62° mirrors with posterior pole view) and Ritch Trabeculoplasty (two 59° and two 64° mirrors, 1.4x magnifying buttons reducing the spot by 30%). The -2 / NMR-K versions are used without methylcellulose. For the Magna View, see diagnostic lenses." },
  [r("OSMGA", x("Single Mirror Gonio"), { gm: ".80x", ls: "1.25x", cd: "15", h: "21", gf: 170 }),
   r("OSMGA-2", ["Single Mirror Gonio NMR-K", "Single Mirror Gonio NMR-K"], { gm: ".80x", ls: "1.25x", cd: "15", h: "21", gf: 170 }, true),
   r("O2MA", x("Two Mirror Gonio"), { gm: ".80x", ls: "1.25x", cd: "15", h: "21", gf: 170 }),
   r("O2MA-2", ["Two Mirror Gonio NMR-K (ex-O2MGA)", "Two Mirror Gonio NMR-K (formerly O2MGA)"], { gm: ".80x", ls: "1.25x", cd: "15", h: "21", gf: 170 }, true),
   r("O4GFA", ["Four Mirror Mini Gonio, petite bague", "Four Mirror Mini Gonio, small ring"], { gm: ".80x", ls: "1.25x", cd: "15", h: "23.5", rd: "23.5", gf: 120 }, true),
   r("O4GFA-LR", ["Four Mirror Mini Gonio, grande bague", "Four Mirror Mini Gonio, large ring"], { gm: ".80x", ls: "1.25x", cd: "15", h: "27", rd: "32.5", gf: 120 }, true),
   r("OT4MGA", x("Thorpe Four Mirror Gonio"), { gm: ".80x", ls: "1.25x", cd: "18", h: "32", gf: 150 }),
   r("ORTA", x("Ritch Trabeculoplasty"), { gm: "1.40x", ls: ".71x", cd: "18", h: "23", gf: 80 })],
  [LL]);
add("ocular-verres-laser-argon-diode", "fundus-laser", "OGFA / OYFA",
  { nom: "Verres laser fond d'œil Fundus et Yannuzzi", description: "Verres « Goldmann » de fond d'œil pour la visualisation et le traitement laser du pôle postérieur. La version NMR-K (Kapetansky) permet l'examen et le laser sans méthylcellulose ; le Yannuzzi possède une large collerette sclérale pour mieux contrôler le globe." },
  { nom: "Fundus and Yannuzzi fundus laser lenses", description: "« Goldmann » type fundus lenses for viewing and laser treatment of the posterior pole. The NMR-K (Kapetansky) version allows examination and laser without methylcellulose; the Yannuzzi has a large scleral flange for greater control of the globe." },
  [r("OGFA", x("Fundus Laser"), { im: ".93x", ls: "1.08x", cd: "15.5", h: "16.5", sf: 36 }),
   r("OGFA-2", x("Fundus Laser NMR-K"), { im: ".93x", ls: "1.02x", cd: "15.5", h: "16.5", sf: 36 }, true),
   r("OYFA", x("Yannuzzi Fundus"), { im: ".93x", ls: "1.08x", cd: "20", h: "16.5", sf: 36 })],
  [LL]);
add("ocular-verres-laser-argon-diode", "iridotomie-suturolyse", "OAIA / OWISA / OHSA / OMSLA / ORNSA",
  { nom: "Verres d'iridotomie et de suturolyse laser", description: "Abraham Iridectomy (lentille grossissante de 66 D, densité de puissance sur l'iris multipliée par 2,5 par rapport à un verre plan) et Wise Iridotomy-Sphincterotomy (lentille de 103 D de 9 mm, densité de puissance 2,7 fois celle de l'Abraham, laser argon, diode ou Nd:YAG). Hoskins, Mandelkorn et Ritch : verres de suturolyse laser après trabéculectomie ou chirurgie de la cataracte, qui compriment les vaisseaux conjonctivaux pour une vue nette des sutures." },
  { nom: "Iridotomy and laser suture lysis lenses", description: "Abraham Iridectomy (66D magnifying lens, power density at the iris increased 2.5x compared with a flat lens) and Wise Iridotomy-Sphincterotomy (9 mm 103D lens, power density 2.7x that of the Abraham, argon, diode or Nd:YAG laser). Hoskins, Mandelkorn and Ritch: lenses for laser suture lysis after trabeculectomy or cataract surgery, compressing conjunctival vessels for a clear view of the sutures." },
  [r("OAIA", x("Abraham Iridectomy"), { im: "1.60x", ls: ".63x", cd: "15.5", h: "16.5" }),
   r("OWISA", x("Wise Iridotomy-Sphincterotomy"), { im: "2.60x", ls: ".38x", cd: "15.5", h: "15" }),
   r("OHSA", ["Hoskins Nylon Suture (avec manche)", "Hoskins Nylon Suture (with handle)"], { im: "1.20x", ls: ".83x", cd: "3", hl: "79" }),
   r("OMSLA", x("Mandelkorn Suture Lysis"), { im: "1.32x", ls: ".76x", cd: "5.6", h: "21" }),
   r("ORNSA", ["Ritch Nylon Suture (cône avec collerette)", "Ritch Nylon Suture (cone with flange)"], { im: "1.00x", ls: "1.00x", cd: "5.7", h: "25.5" })],
  [LL]);

// === Verres laser YAG
add("ocular-verres-laser-yag", "yag-segment-anterieur", "OAIY / OAYA / OPYG-12/12 / OMIC / OPIG / OLSLT",
  { nom: "Verres YAG iridotomie, capsulotomie et trabéculoplastie SLT", description: "Verres pour laser Nd:YAG du segment antérieur : Abraham Iridectomy et Abraham Capsulotomy (bouton grossissant de 66 D, 10 mm), Peyman G. Capsulotomy (surface antérieure de 14 mm, distance de travail un peu plus grande), Mandelkorn Iridotomy/Capsulotomy (argon, diode ou YAG), Pollack Iridotomy/Gonio (deux boutons pour iridotomie et gonioscopie sans changer de verre) et Latina SLT (conçu pour la trabéculoplastie laser sélective, grandissement 1,0x, miroir de 63°, collerette Securefit® en option)." },
  { nom: "YAG iridotomy, capsulotomy and SLT lenses", description: "Lenses for anterior segment Nd:YAG laser: Abraham Iridectomy and Abraham Capsulotomy (10 mm 66D magnifying button), Peyman G. Capsulotomy (14 mm anterior surface, slightly greater working distance), Mandelkorn Iridotomy/Capsulotomy (argon, diode or YAG), Pollack Iridotomy/Gonio (two buttons for iridotomy and gonioscopy without changing lenses) and Latina SLT (designed for selective laser trabeculoplasty, 1.0x magnification, 63° mirror, optional Securefit® flange)." },
  [r("OAIY", x("Abraham Iridectomy YAG"), { im: "1.5x", ls: ".67x", cd: "15.5", h: "16.5" }),
   r("OAYA", x("Abraham Capsulotomy"), { im: "1.8x", ls: ".56x", cd: "15.5", h: "16.5" }),
   r("OPYG-12/12", x("Peyman G. Capsulotomy"), { im: "1.8x", ls: ".56x", cd: "15.5", h: "16.5" }),
   r("OMIC", x("Mandelkorn Iridotomy/Capsulotomy"), { im: "1.2x", ls: ".83x", cd: "15.5", h: "16.5" }),
   r("OPIG", x("Pollack Iridotomy/Gonio"), { im: "1.5x", ls: ".65x", cd: "15", h: "21" }),
   r("OLSLT", x("Latina SLT Gonio Laser"), { gm: "1.0x", ls: "1.0x", cd: "14.5", h: "24", gf: 130 }),
   r("OLSLTF", ["Latina SLT avec collerette", "Latina SLT with flange"], { gm: "1.0x", ls: "1.0x", cd: "18", h: "25", gf: 130 })],
  [LL]);
add("ocular-verres-laser-yag", "yag-vitre", "OJKPY-25 / OJKY-21 / OPY",
  { nom: "Verres YAG du vitré (Karickhoff, Peyman Wide Field)", description: "Verres pour le traitement laser YAG du vitré et des corps flottants. Karickhoff Off-Axis : la rotation du verre permet de rechercher les corps flottants sans que le patient bouge l'œil ; Karickhoff 21 mm : petite collerette et petit diamètre pour les fentes palpébrales étroites. Peyman Wide Field : trois verres pour le vitré antérieur (12,5 mm), moyen (18 mm) et postérieur (25 mm)." },
  { nom: "YAG vitreous lenses (Karickhoff, Peyman Wide Field)", description: "Lenses for YAG laser treatment of the vitreous and floaters. Karickhoff Off-Axis: rotating the lens allows looking for floaters without the patient moving the eye; Karickhoff 21 mm: small flange and small diameter for small lid fissures. Peyman Wide Field: three lenses for the anterior (12.5 mm), mid (18 mm) and posterior (25 mm) vitreous." },
  [r("OJKPY-25", x("Karickhoff Off-Axis Vitreous"), { im: "1.36x", ls: ".74x", cd: "15.5", h: "16.5" }),
   r("OJKY-21", x("Karickhoff 21 mm Vitreous"), { im: "1.39x", ls: ".72x", cd: "15.5", h: "16" }),
   r("OPY-12.5", ["Peyman Wide Field, vitré antérieur 12,5 mm", "Peyman Wide Field, anterior vitreous 12.5 mm"], { im: "1.40x", ls: ".71x", cd: "15.5", h: "16.5" }),
   r("OPY-18", ["Peyman Wide Field, vitré moyen 18 mm", "Peyman Wide Field, mid-vitreous 18 mm"], { im: "1.41x", ls: ".71x", cd: "15.5", h: "16.5" }),
   r("OPY-25", ["Peyman Wide Field, vitré postérieur 25 mm", "Peyman Wide Field, posterior vitreous 25 mm"], { im: "1.36x", ls: ".74x", cd: "16", h: "14.7" })],
  [LL]);

// === Verres de diagnostic
add("ocular-verres-diagnostic", "trois-miroirs-diagnostic", "OG3M / OG3M-10",
  { nom: "Verres trois miroirs universels de diagnostic", description: "Verre « Goldmann » trois miroirs (59°, 67°, 73°) pour l'examen de la périphérie du fond d'œil et de l'angle irido-cornéen ; 36° du pôle postérieur sont visibles par le centre du verre. Nombreuses hauteurs et diamètres. Le Three Mirror 10 mm Gonio (miroirs 64°, 67°, 73°) a une petite surface de contact pour une utilisation sans méthylcellulose. Grandissement gonio 0,80x." },
  { nom: "Universal three mirror diagnostic lenses", description: "Classic « Goldmann » three mirror lens (59°, 67°, 73°) for examining the peripheral fundus and the anterior chamber angle; 36° of the posterior pole can be viewed through the centre of the lens. Many heights and diameters. The Three Mirror 10 mm Gonio (64°, 67°, 73° mirrors) has a small contact surface for use without methylcellulose. Gonio mag. 0.80x." },
  [r("OG3M", x("Universal"), { im: ".93x", cd: "18", h: "32", gf: 140 }),
   r("OG3M-2", x("NMR"), { im: ".93x", cd: "16", h: "32", gf: 140 }, true),
   r("OG3MF", ["avec collerette", "with flange"], { im: ".93x", cd: "20", h: "33", gf: 140 }),
   r("OG3MI", x("15 mm"), { im: ".93x", cd: "15", h: "28", gf: 140 }),
   r("OG3MP", x("17 mm"), { im: ".93x", cd: "17", h: "26", gf: 140 }),
   r("OG3MS", ["petit", "small"], { im: ".93x", cd: "18", h: "24", gf: 140 }),
   r("OG3MS-2", ["NMR petit", "NMR small"], { im: ".93x", cd: "16", h: "23", gf: 140 }, true),
   r("OG3M-13", ["NMR petite fente palpébrale", "NMR small fissure"], { im: ".93x", cd: "13", h: "28", gf: 140 }, true),
   r("OG3M-10", x("Three Mirror 10 mm Gonio"), { im: ".93x", cd: "10", h: "25", gf: 140 }, true)]);
add("ocular-verres-diagnostic", "trois-miroirs-hd-autoclavable", "OG3MHD / OG3MAC",
  { nom: "Verres trois miroirs haute définition et autoclavables", description: "Verres trois miroirs en verre à haut indice : un miroir gonio de 64° et deux miroirs de fond d'œil de 73° et 67° dont les images se recouvrent (pas d'angle mort). Le High Definition reçoit le traitement Laserlight® HD et convient au diagnostic comme au laser (visible et proche infrarouge) ; l'Autoclavable est stérilisable à la vapeur, ses miroirs travaillant en réflexion totale sans revêtement. Les versions -15 et -17 sont le verre de 10 mm équipé de la collerette OACF-15 ou OACF-17 (recommandées pour le laser)." },
  { nom: "High definition and autoclavable three mirror lenses", description: "High index glass three mirror lenses: one 64° gonio mirror and two 73° and 67° fundus mirrors whose images overlap (no blind spot). The High Definition has the Laserlight® HD coating and suits diagnosis as well as laser (visible and near infrared); the Autoclavable is steam sterilizable, its mirrors working by total internal reflection without coating. The -15 and -17 versions are the 10 mm lens fitted with the OACF-15 or OACF-17 flange (recommended for laser)." },
  [r("OG3MHD-10", x("High Definition"), { im: ".65x", ls: "1.54x", cd: "10", h: "25.0", gf: 150 }, true),
   r("OG3MHD-15", ["High Definition + collerette OACF-15", "High Definition + OACF-15 flange"], { im: ".65x", ls: "1.54x", cd: "15", h: "26.5", gf: 150 }, true),
   r("OG3MHD-17", ["High Definition + collerette OACF-17 (méthylcellulose recommandée)", "High Definition + OACF-17 flange (methylcellulose recommended)"], { im: ".65x", ls: "1.54x", cd: "17", h: "27.5", gf: 150 }),
   r("OG3MAC-10", x("Autoclavable"), { im: ".65x", cd: "10", h: "25", gf: 150 }, true),
   r("OG3MAC-15", ["Autoclavable + collerette OACF-15", "Autoclavable + OACF-15 flange"], { im: ".65x", cd: "15", h: "26.5", gf: 150 }, true),
   r("OG3MAC-17", ["Autoclavable + collerette OACF-17 (méthylcellulose recommandée)", "Autoclavable + OACF-17 flange (methylcellulose recommended)"], { im: ".65x", cd: "17", h: "27.5", gf: 150 })],
  [["Grandissement gonio de l'Autoclavable : 0,61x. Collerettes vendues aussi séparément.", "Autoclavable gonio mag.: 0.61x. Flanges also sold separately."]]);
add("ocular-verres-diagnostic", "fundus-karickhoff-diagnostic", "OGF / OJK",
  { nom: "Verres de diagnostic Fundus et Karickhoff", description: "Fundus Diagnostic : verre « Goldmann » à face antérieure plane donnant une image directe du pôle postérieur, en version méthylcellulose ou NMR-K sans méthylcellulose. Karickhoff Diagnostic : quatre miroirs (62°, 67°, 76°, 80°) repérés par des « points de profondeur » et une vue axiale centrale pour une vue complète de l'intérieur de l'œil ; grandissement gonio 0,80x." },
  { nom: "Fundus and Karickhoff diagnostic lenses", description: "Fundus Diagnostic: « Goldmann » type lens whose flat front surface gives a direct image of the posterior pole, in methylcellulose or NMR-K no-methylcellulose design. Karickhoff Diagnostic: four mirrors (62°, 67°, 76°, 80°) marked with « depth dots » plus a central axis view for a complete view of the interior of the eye; gonio mag. 0.80x." },
  [r("OGF", x("Fundus Diagnostic"), { im: ".93x", cd: "15.5", h: "16.5", sf: 36 }),
   r("OGF-2", x("Fundus Diagnostic NMR-K"), { im: ".97x", cd: "15.5", h: "16.5", sf: 35 }, true),
   r("OJK", x("Karickhoff Diagnostic"), { im: ".93x", cd: "18", h: "32.0", gf: 140 }),
   r("OJKF", ["Karickhoff Diagnostic avec collerette", "Karickhoff Diagnostic with flange"], { im: ".93x", cd: "20", h: "32.5", gf: 140 })]);
add("ocular-verres-diagnostic", "gonioscopes", "OMVGL / OSMG / O2M / O4GF / OT4MG / OK4DG",
  { nom: "Gonioscopes 1, 2 et 4 miroirs (Magna View, Thorpe, Khaw 4D)", description: "Verres de gonioscopie : Magna View (un miroir de 62°, face antérieure inclinée corrigeant l'astigmatisme de l'image et du faisceau laser, adapté aussi au laser argon, diode ou YAG et à la photographie de l'angle), Single Mirror (62°, bague moletée), Two Mirror (deux miroirs opposés de 62°), Four Mirror Mini (quatre miroirs de 62°, petite ou grande bague), Thorpe Four Mirror (vue du pôle postérieur par le centre) et Khaw 4D Direct View (vue de l'angle correctement orientée sur 360°, sans méthylcellulose)." },
  { nom: "One, two and four mirror gonio lenses (Magna View, Thorpe, Khaw 4D)", description: "Gonioscopy lenses: Magna View (one 62° mirror, tilted anterior surface correcting image and laser beam astigmatism, also suitable for argon, diode or YAG laser and angle photography), Single Mirror (62°, knurled ring), Two Mirror (two opposing 62° mirrors), Four Mirror Mini (four 62° mirrors, small or large ring), Thorpe Four Mirror (posterior pole viewed through the centre) and Khaw 4D Direct View (properly oriented 360° view of the angle, no methylcellulose)." },
  [r("OMVGL", x("Magna View Gonio"), { gm: "1.3x", cd: "15", h: "23.5", gf: 160 }),
   r("OMVGLF", ["Magna View Gonio avec collerette Securefit®", "Magna View Gonio with Securefit® flange"], { gm: "1.3x", cd: "18", h: "24.5", gf: 160 }),
   r("OSMG", x("Single Mirror Gonio"), { gm: ".80x", cd: "15", h: "19.5", gf: 170 }),
   r("OSMG-2", x("Single Mirror Gonio NMR-K"), { gm: ".80x", cd: "15", h: "19.5", gf: 170 }, true),
   r("O2M", x("Two Mirror Gonio"), { gm: ".80x", cd: "15", h: "19.5", gf: 170 }),
   r("O2M-2", ["Two Mirror Gonio NMR-K (ex-O2MG)", "Two Mirror Gonio NMR-K (formerly O2MG)"], { gm: ".80x", cd: "15", h: "19.5", gf: 170 }, true),
   r("O4GF", ["Four Mirror Mini Gonio, petite bague", "Four Mirror Mini Gonio, small ring"], { gm: ".80x", cd: "15", h: "22.5", rd: "23.5", gf: 120 }, true),
   r("O4GF-LR", ["Four Mirror Mini Gonio, grande bague", "Four Mirror Mini Gonio, large ring"], { gm: ".80x", cd: "15", h: "26", rd: "32.5", gf: 120 }, true),
   r("OT4MG", x("Thorpe Four Mirror Gonio"), { gm: ".80x", cd: "18", h: "32", gf: 150 }),
   r("OK4DG", x("Khaw 4D Direct View Gonio"), { gm: ".80x", cd: "10", h: "24", rd: "28.5", gf: 170 }, true)]);
add("ocular-verres-diagnostic", "maxfield-ac-4-miroirs", "O4MAC",
  { nom: "Gonioscope quatre miroirs MaxField® AC autoclavable", description: "Gonioscope quatre miroirs de 64° en verre à haut indice : réflexion totale même avec du liquide au contact des miroirs, sans perte de lumière par un revêtement, pour une image de l'angle plus lumineuse et plus nette. Stérilisable à la vapeur ; solution gonioscopique non nécessaire. Petite ou grande bague de maintien, ou manche ergonomique dont le verre se détache pour le nettoyage. Étui autoclavable à commander séparément (OLV-C4)." },
  { nom: "MaxField® AC autoclavable four mirror gonio lens", description: "Four mirror (64°) gonio lens in high refractive index glass: total internal reflection even with fluid in contact with the mirrors, with no light loss through a coating, for a brighter and clearer image of the angle. Steam sterilizable; no gonioscopic solution needed. Small or large holding ring, or ergonomic handle from which the lens detaches for cleaning. Autoclavable case ordered separately (OLV-C4)." },
  [r("O4MAC", ["petite bague", "small ring"], { gm: ".61x", cd: "8.5", h: "22", rd: "24.5", gf: ["90°+", "90°+"] }, true),
   r("O4MAC-15", ["petite bague + collerette OACF4-15", "small ring + OACF4-15 flange"], { gm: ".61x", cd: "15", h: "24.5", rd: "24.5", gf: ["90°+", "90°+"] }, true),
   r("O4MAC-17", ["petite bague + collerette OACF4-17 (méthylcellulose recommandée)", "small ring + OACF4-17 flange (methylcellulose recommended)"], { gm: ".61x", cd: "17", h: "25.5", rd: "24.5", gf: ["90°+", "90°+"] }),
   r("O4MAC-LR", ["grande bague", "large ring"], { gm: ".61x", cd: "8.5", h: "28", rd: "31.5", gf: ["90°+", "90°+"] }, true),
   r("O4MAC-LR-15", ["grande bague + collerette OACF4-15", "large ring + OACF4-15 flange"], { gm: ".61x", cd: "15", h: "30", rd: "31.5", gf: ["90°+", "90°+"] }, true),
   r("O4MAC-LR-17", ["grande bague + collerette OACF4-17 (méthylcellulose recommandée)", "large ring + OACF4-17 flange (methylcellulose recommended)"], { gm: ".61x", cd: "17", h: "31", rd: "31.5", gf: ["90°+", "90°+"] }),
   r("O4MAC-H", ["avec manche ergonomique", "with ergonomic handle"], { gm: ".61x", cd: "8.5", h: "18", gf: ["90°+", "90°+"] }, true)],
  [["Nettoyage : méthode 3. Collerettes vendues aussi séparément.", "Cleaning: method 3. Flanges also sold separately."]]);
add("ocular-verres-diagnostic", "gaasterland", "OG4MG",
  { nom: "Gonioscope quatre miroirs Gaasterland", description: "Gonioscope quatre miroirs de 64° en verre à haut indice avec traitement antireflet Laserlight® HD sur la face antérieure. Réflexion totale même avec du liquide au contact des miroirs ; le champ plus large évite de tourner le verre pour voir tout l'angle. Petite ou grande bague, ou manche ergonomique ; solution gonioscopique non nécessaire." },
  { nom: "Gaasterland four mirror gonio lens", description: "Four mirror (64°) gonio lens in high refractive index glass with Laserlight® HD anti-reflective coating on the anterior surface. Total internal reflection even with fluid in contact with the mirrors; the larger field means no need to rotate the lens to see the whole angle. Small or large holding ring, or ergonomic handle; no gonioscopic solution needed." },
  [r("OG4MG", ["petite bague", "small ring"], { gm: ".61x", cd: "8.5", h: "22", rd: "24.5", gf: ["90°+", "90°+"] }, true),
   r("OG4MG-15", ["petite bague + collerette OACF4-15", "small ring + OACF4-15 flange"], { gm: ".61x", cd: "15", h: "24.5", rd: "24.5", gf: ["90°+", "90°+"] }, true),
   r("OG4MG-17", ["petite bague + collerette OACF4-17 (méthylcellulose recommandée)", "small ring + OACF4-17 flange (methylcellulose recommended)"], { gm: ".61x", cd: "17", h: "25.5", rd: "24.5", gf: ["90°+", "90°+"] }),
   r("OG4MG-LR", ["grande bague", "large ring"], { gm: ".61x", cd: "8.5", h: "28", rd: "31.5", gf: ["90°+", "90°+"] }, true),
   r("OG4MG-LR-15", ["grande bague + collerette OACF4-15", "large ring + OACF4-15 flange"], { gm: ".61x", cd: "15", h: "30", rd: "31.5", gf: ["90°+", "90°+"] }, true),
   r("OG4MG-LR-17", ["grande bague + collerette OACF4-17 (méthylcellulose recommandée)", "large ring + OACF4-17 flange (methylcellulose recommended)"], { gm: ".61x", cd: "17", h: "31", rd: "31.5", gf: ["90°+", "90°+"] }),
   r("OG4MG-H", ["avec manche ergonomique", "with ergonomic handle"], { gm: ".61x", cd: "8.5", h: "18", gf: ["90°+", "90°+"] }, true)],
  [["Collerettes vendues aussi séparément.", "Flanges also sold separately."]]);
add("ocular-verres-diagnostic", "posner-sussman-koeppe", "OPDSG / OS4M / OKL / OKM / OKS",
  { nom: "Gonioprismes Posner et Sussman, verres Koeppe", description: "Posner (diagnostique et chirurgical) : quatre miroirs de 64°, choix de trois manches inclinés à 17°. Sussman : gonioscope quatre miroirs de 64° tenu directement à la main, petite ou grande bague. Les deux ont une petite surface de contact permettant la gonioscopie statique ou dynamique sans méthylcellulose et un revêtement polymère multicouche protégeant les miroirs ; manche ou bague rouge, bleu, vert, or, violet ou noir. Koeppe : verre de gonioscopie directe grossissant, en appui sur la collerette sclérale, en trois tailles." },
  { nom: "Posner and Sussman gonioprisms, Koeppe lenses", description: "Posner (diagnostic and surgical): four 64° mirrors, choice of three handles set at 17°. Sussman: hand-held four mirror (64°) gonioscope, small or large ring. Both have a small contact surface allowing static or dynamic gonioscopy without methylcellulose and a multi-layer polymer coating protecting the mirrors; red, blue, green, gold, purple or black handle or ring. Koeppe: magnifying direct gonioscopy lens resting on the scleral flange, in three sizes." },
  [r("OPDSG", ["Posner, manche rond", "Posner, round handle"], { gm: ".80x", cd: "9", h: "13", hl: "78.8", gf: 80 }, true),
   r("OPDSG-2", ["Posner, manche hexagonal", "Posner, hexagonal handle"], { gm: ".80x", cd: "9", h: "13", hl: "72.2", gf: 80 }, true),
   r("OPDSG-3", ["Posner, manche ergonomique", "Posner, ergonomic handle"], { gm: ".80x", cd: "9", h: "13", hl: "92.8", gf: 80 }, true),
   r("OS4M", ["Sussman, petite bague", "Sussman, small ring"], { gm: ".80x", cd: "9", h: "24.5", rd: "25", gf: 80 }, true),
   r("OS4M-2", ["Sussman, grande bague", "Sussman, large ring"], { gm: ".80x", cd: "9", h: "28.5", rd: "31.5", gf: 80 }, true),
   r("OKL", ["Koeppe grand", "Koeppe large"], { im: "1.50x", cd: "19", gf: 160 }),
   r("OKM", ["Koeppe moyen", "Koeppe medium"], { im: "1.50x", cd: "18", gf: 160 }),
   r("OKS", ["Koeppe petit", "Koeppe small"], { im: "1.60x", cd: "17", gf: 160 })]);

// === Verres indirects
const bio = (code, lbl, im, ls, sf, wd, ca, w) => r(code, x(lbl), { im, ls, sf, wd, ca, w });
const sl = (code, lbl, im, ls, sf, df, wd, ca, w) => r(code, Array.isArray(lbl) ? lbl : x(lbl), { im, ls, sf, df, wd, ca, w });
add("ocular-verres-indirects", "maxlight-bio", "OI-14 / OI-20 / OI-222 / OI-28",
  { nom: "Loupes d'ophtalmoscopie indirecte MaxLight® (CR-39)", description: "Loupes asphériques en CR-39 pour l'ophtalmoscope indirect binoculaire (B.I.O.) : 14 D (fort grandissement pour la macula et la papille), 20 D (la plus utilisée en B.I.O.), Triple Two Panfundus 22 D (grand diamètre, grandissement et très large champ) et 28 D (polyvalente, petit diamètre, appréciée pour l'enfant)." },
  { nom: "MaxLight® indirect ophthalmoscopy lenses (CR-39)", description: "CR-39 aspheric lenses for the binocular indirect ophthalmoscope (B.I.O.): 14D (high magnification for macula and optic disc), 20D (most common B.I.O. lens), Triple Two Panfundus 22D (large diameter, magnification and very wide field) and 28D (general purpose, small diameter, popular for children)." },
  [bio("OI-14", "MaxLight® 14D", "4.29x", ".23x", 37, "72", "52", "34"), bio("OI-20", "MaxLight® 20D", "2.97x", ".34x", 50, "47", "48", "39"),
   bio("OI-222", "MaxLight® Triple Two Panfundus 22D", "2.72x", ".37x", 60, "39", "52", "48"), bio("OI-28", "MaxLight® 28D", "2.13x", ".47x", 58, "29", "38.2", "22")],
  [LL, RINGS]);
add("ocular-verres-indirects", "maxfield-bio", "OI-14M / OI-20M / OI-22M / OI-28M",
  { nom: "Loupes d'ophtalmoscopie indirecte MaxField® (verre)", description: "Loupes asphériques en verre à haute transmission pour l'ophtalmoscope indirect binoculaire, de conception optimisée par ordinateur pour la résolution et le champ : 14 D (fort grandissement), 20 D (la plus utilisée en B.I.O.), 22 D et 28 D (polyvalente, petit diamètre, appréciée pour l'enfant). Traitement Laserlight® HD disponible." },
  { nom: "MaxField® indirect ophthalmoscopy lenses (glass)", description: "High transmittance glass aspheric lenses for the binocular indirect ophthalmoscope, computer optimized for resolution and field of view: 14D (high magnification), 20D (most common B.I.O. lens), 22D and 28D (general purpose, small diameter, popular for children). Laserlight® HD coating available." },
  [bio("OI-14M", "MaxField® 14D", "4.17x", ".24x", 38, "72", "52", "57"), bio("OI-20M", "MaxField® 20D", "2.97x", ".34x", 50, "47", "48", "56"),
   bio("OI-22M", "MaxField® 22D", "2.73x", ".37x", 60, "39", "52", "73"), bio("OI-28M", "MaxField® 28D", "2.11x", ".47x", 58, "27", "38.2", "39")],
  [LLHD, RINGS]);
add("ocular-verres-indirects", "maxac", "OI-20A / OI-28A / OI-LSA",
  { nom: "Loupes indirectes autoclavables MaxAC™ 20 D et 28 D", description: "Loupes asphériques en verre stérilisables à la vapeur, pour l'ophtalmoscope indirect binoculaire en consultation ou au bloc opératoire ; non traitées pour rester compatibles avec la stérilisation. Le support MaxAC™ maintient la loupe ou son boîtier sur la tranche pendant l'autoclave pour limiter les traces d'eau. Boîte de stérilisation à commander séparément (OI-ST)." },
  { nom: "MaxAC™ autoclavable indirect lenses 20D and 28D", description: "Steam autoclavable glass aspheric lenses for the binocular indirect ophthalmoscope in the clinic or the operating room; uncoated for sterilization compatibility. The MaxAC™ lens stand holds the lens or its case on edge during autoclaving to minimize water spots. Sterilizing tray ordered separately (OI-ST)." },
  [r("OI-20A", x("MaxAC™ 20D"), { im: "3.03x", ls: ".33x", sf: 50, wd: "47", ca: "48", w: "51" }),
   r("OI-28A", x("MaxAC™ 28D"), { im: "2.15x", ls: ".47x", sf: 59, wd: "28", ca: "38.2", w: "36" }),
   r("OI-LSA", ["support d'autoclave MaxAC™", "MaxAC™ autoclavable lens stand"])],
  [["Nettoyage : méthode 3.", "Cleaning: method 3."]]);
add("ocular-verres-indirects", "maxlight-lampe-fente", "OI-UM / OI-HM / OI-STD",
  { nom: "Loupes lampe à fente MaxLight® (CR-39)", description: "Loupes asphériques en CR-39 pour l'examen du fond d'œil sans contact à la lampe à fente : Ultra Mag 60 (examen détaillé de la macula et de la papille), High Mag 78 (grandissement et champ, haute résolution) et Standard 90 (la puissance la plus utilisée), cette dernière avec petite ou grande bague." },
  { nom: "MaxLight® slit lamp lenses (CR-39)", description: "CR-39 aspheric lenses for non-contact slit lamp fundus examination: Ultra Mag 60 (detailed examination of macula and optic disc), High Mag 78 (magnification and field, high resolution) and Standard 90 (the most popular power), the latter with small or large ring." },
  [sl("OI-UM", "MaxLight® Ultra Mag 60", "1.15x", ".87x", 76, 131, "11", "30", "17"), sl("OI-HM", "MaxLight® High Mag 78", ".93x", "1.07x", 84, 139, "8", "29.1", "17"),
   sl("OI-STD", "MaxLight® Standard 90", ".75x", "1.34x", 94, 153, "5", "19.2", "6"), sl("OI-STD-LR", ["MaxLight® Standard 90, grande bague", "MaxLight® Standard 90, large ring"], ".75x", "1.34x", 94, 153, "5", "19.2", "15")],
  [LL, RINGS]);
add("ocular-verres-indirects", "maxfield-54-78", "OI-54M / OI-60M / OI-66M / OI-72M / OI-HM-78M / OI-78M",
  { nom: "Loupes lampe à fente MaxField® 54 D à 78 D", description: "Loupes asphériques en verre pour l'examen du fond d'œil à la lampe à fente : 54 D (macula et papille), 60 D (image 1:1 du fond d'œil), 66 D (champ statique jusqu'aux arcades), 72 D (comme une 78 D avec un peu plus de grandissement), High Mag 78 D (double asphérique optimisée par front d'onde) et Osher 78 D (ex-Osher Panfundus, verre à haut indice, champ plus large qu'une 78 D classique, fonctionne aussi sous microscope opératoire)." },
  { nom: "MaxField® slit lamp lenses 54D to 78D", description: "Glass aspheric lenses for slit lamp fundus examination: 54D (macula and disc), 60D (one to one fundus image), 66D (static field to the arcades), 72D (like a 78D with a little more magnification), High Mag 78D (wavefront optimized double aspheric) and Osher 78D (formerly Osher Panfundus, high index glass, wider field than a regular 78D, also works with the surgical microscope)." },
  [sl("OI-54M", "MaxField® 54D", "1.10x", ".90x", 86, 137, "10", "29.1", "25"), sl("OI-60M", "MaxField® 60D", "1.00x", "1.00x", 85, 154, "9.8", "29.1", "32"),
   sl("OI-66M", "MaxField® 66D", ".91x", "1.10x", 91, 144, "8", "27", "25"), sl("OI-72M", "MaxField® 72D", ".83x", "1.20x", 102, 155, "7", "27", "21"),
   sl("OI-HM-78M", "MaxField® High Mag 78D", ".98x", "1.02x", 88, 154, "10", "29.1", "32"), sl("OI-78M", "Osher MaxField® 78D", ".77x", "1.30x", 98, 155, "7", "27", "21")],
  [LLHD, RINGS]);
add("ocular-verres-indirects", "maxfield-84-132", "OI-84M / OI-STDM / OI-100M / OI-120M / OI-SP",
  { nom: "Loupes lampe à fente MaxField® 84 D à 132 D", description: "Loupes asphériques en verre pour l'examen du fond d'œil à la lampe à fente : 84 D (plus de champ qu'une 90 D classique), Standard 90 (puissance la plus utilisée, petite ou grande bague), 100 D (dépistage, petites pupilles), 120 D (champ très large, 80° à travers une pupille de 2 mm) et Ultra View Small Pupil 132 D (pupilles peu ou non dilatées, 85° à travers une pupille de 2 mm)." },
  { nom: "MaxField® slit lamp lenses 84D to 132D", description: "Glass aspheric lenses for slit lamp fundus examination: 84D (more field than a traditional 90D), Standard 90 (most popular power, small or large ring), 100D (screening, small pupils), 120D (extremely wide field, 80° through a 2 mm pupil) and Ultra View Small Pupil 132D (poorly dilated or undilated pupils, 85° through a 2 mm pupil)." },
  [sl("OI-84M", "MaxField® 84D", ".71x", "1.40x", 105, 158, "5", "27", "28"), sl("OI-STDM", "MaxField® Standard 90", ".75x", "1.34x", 94, 153, "5", "19.2", "9"),
   sl("OI-STDM-LR", ["MaxField® Standard 90, grande bague", "MaxField® Standard 90, large ring"], ".75x", "1.34x", 94, 153, "5", "19.2", "18"),
   sl("OI-100M", "MaxField® 100D", ".60x", "1.67x", 110, 146, "4", "29.1", "18"), sl("OI-120M", "MaxField® 120D", ".50x", "2.00x", 120, 173, "4", "21", "19"),
   sl("OI-SP", "Ultra View Small Pupil 132D", ".45x", "2.22x", 99, 158, "4", "16", "8.5")],
  [LLHD, ["Bague de couleur au choix (sauf OI-SP).", "Coloured holding ring available (except OI-SP)."]]);

// === Systèmes grand angle chirurgicaux
add("ocular-systemes-grand-angle", "landers-woldoff", "OLIV-WF / OLIV-EQ-2 / OWIV-HM / ORVCS",
  { nom: "Verres de vitrectomie grand angle Landers et Woldoff", description: "Verres de vitrectomie grand angle à image inversée, compatibles avec tous les systèmes inverseurs : Landers Wide Field 155 D (vue panoramique de la périphérie rétinienne extrême, œil rempli de liquide ou de gaz), Landers Equatorial II 91 D (du pôle postérieur à l'équateur) et Woldoff High Magnification 66 D (chirurgie maculaire : trou maculaire, membranes épirétiniennes). Versions autoclavables ou monobloc non autoclavables (NA). Manche OLIV-H et système de contact visqueux Reichel (ORVCS, pour seringue de 5 ml non fournie) en complément." },
  { nom: "Landers and Woldoff wide angle vitrectomy lenses", description: "Inverted image wide angle vitrectomy lenses, compatible with all inverting systems: Landers Wide Field 155D (panoramic view of the far peripheral retina, fluid or gas filled eye), Landers Equatorial II 91D (posterior pole to the equator) and Woldoff High Magnification 66D (macular surgery: macular hole, epiretinal membranes). Autoclavable or single-piece non-autoclavable (NA) versions. OLIV-H handle and Reichel Viscous Contact System (ORVCS, for a 5 ml syringe not included) as complements." },
  [r("OLIV-WF", ["Landers Wide Field 155 D, autoclavable", "Landers Wide Field 155D, autoclavable"], { im: ".38x", h: "12", sf: 130, df: 146 }),
   r("OLIV-EQ-2", ["Landers Equatorial II 91 D, autoclavable", "Landers Equatorial II 91D, autoclavable"], { im: ".65x", h: "14.5", sf: 101, df: 131 }),
   r("OWIV-HM", ["Woldoff High Magnification 66 D, autoclavable", "Woldoff High Magnification 66D, autoclavable"], { im: ".90x", h: "13.5", sf: 57, df: 100 }),
   r("OLIV-WFNA", ["Landers Wide Field non autoclavable", "Landers Wide Field non-autoclavable"], { im: ".38x", h: "12", sf: 130, df: 146 }),
   r("OLIV-EQNA", ["Landers Equatorial non autoclavable", "Landers Equatorial non-autoclavable"], { im: ".65x", h: "14.5", sf: 101, df: 131 }),
   r("OWIV-HMNA", ["Woldoff High Magnification non autoclavable", "Woldoff High Magnification non-autoclavable"], { im: ".90x", h: "13.5", sf: 57, df: 100 }),
   r("OLIV-H", ["manche pour verres Wide Field et Equatorial", "handle for Wide Field and Equatorial lenses"]),
   r("ORVCS", ["système de contact visqueux Reichel", "Reichel Viscous Contact System"])]);
add("ocular-systemes-grand-angle", "ivs", "OIVSL / OIVSZ",
  { nom: "Inverseur de vitrectomie IVS (Leica / Zeiss)", description: "Inverseur d'image pour microscopes Zeiss et de type Zeiss (Topcon, Moeller…) ou Leica (Wild). Bouton stérilisable à la vapeur, profil court compatible avec tous les oculaires fixes et inclinables, pas de perte de lumière en mode droit et quasiment pas de décalage d'image entre les modes. Compatible avec tous les verres de vitrectomie grand angle inversants. Livré avec bouton de réglage caoutchouc (OIVS-K), tournevis (OIVS-SD) et mallette (OIVS-C). Disponible en sets avec verres Wide Field (W), Equatorial (E), High Mag (H), versions NA, manche et anneau." },
  { nom: "IVS inverter vitrectomy system (Leica / Zeiss)", description: "Image inverter for Zeiss and Zeiss type (Topcon, Moeller, etc.) or Leica (Wild) microscopes. Steam sterilizable knob, short profile for all fixed and inclinable eyepieces, no light loss in upright mode and virtually no image shift between modes. Compatible with all wide angle inverting vitrectomy lenses. Supplied with rubber adjustment knob (OIVS-K), screwdriver (OIVS-SD) and carrying case (OIVS-C). Available in sets with Wide Field (W), Equatorial (E), High Mag (H) lenses, NA versions, handle and ring." },
  [r("OIVSL", ["IVS pour microscopes Leica (Wild)", "IVS for Leica (Wild) microscopes"]),
   r("OIVSZ", ["IVS pour microscopes Zeiss et type Zeiss", "IVS for Zeiss and Zeiss type microscopes"]),
   r("OIVSL-WE / OIVSL-EH / OIVSL-WH / OIVSL-WEH", ["sets Leica avec verres autoclavables (Wide Field, Equatorial II, High Mag), manche et anneau", "Leica sets with autoclavable lenses (Wide Field, Equatorial II, High Mag), handle and ring"]),
   r("OIVSL-WENA / OIVSL-EHNA / OIVSL-WHNA / OIVSL-WEHNA", ["sets Leica avec verres non autoclavables, manche et anneau", "Leica sets with non-autoclavable lenses, handle and ring"]),
   r("OIVSZ-WE / OIVSZ-EH / OIVSZ-WH / OIVSZ-WEH", ["sets Zeiss avec verres autoclavables, manche et anneau", "Zeiss sets with autoclavable lenses, handle and ring"]),
   r("OIVSZ-WENA / OIVSZ-EHNA / OIVSZ-WHNA / OIVSZ-WEHNA", ["sets Zeiss avec verres non autoclavables, manche et anneau", "Zeiss sets with non-autoclavable lenses, handle and ring"]),
   r("OIVS-K / OIVS-SD / OIVS-C", ["bouton de réglage stérilisable, tournevis 3/16\", mallette (inclus)", "steam sterilizable knob, 3/16\" screwdriver, carrying case (included)"])],
  [["Tous les éléments des sets sont aussi vendus séparément.", "All set items are also available separately."]]);
add("ocular-systemes-grand-angle", "svs", "OSVS / OUV 132-2 / OIV 132",
  { nom: "Système de visualisation chirurgicale grand angle Landers (SVS) et verres 132 D", description: "Système de vitrectomie sans contact : un bras flexible, fixé au repose-poignets ou à la table, positionne le verre grand angle et s'escamote du champ opératoire, libérant les mains du chirurgien et de l'aide. Avec le verre Peyman-Wessels-Landers 132 D Upright, image droite et non inversée sans inverseur sur le microscope ; avec le verre 132 D Indirect, utilisation avec un inverseur IVS. Boîtiers de stérilisation inclus avec les verres." },
  { nom: "Landers wide angle surgical viewing system (SVS) and 132D lenses", description: "Non-contact vitrectomy system: a flexible arm clamped to the wrist rest or surgical bed positions the wide angle lens and swings out of the surgical field, freeing the surgeon's and the assistant's hands. With the Peyman-Wessels-Landers 132D Upright lens, upright non-reversed image without a microscope-mounted inverter; with the 132D Indirect lens, use with an IVS inverter. Sterilizable cases included with the lenses." },
  [r("OSVS", ["système SVS : bras rainuré, pinces de bras et de cadre, liens mâle/femelle, montants, collier, mallette, clé, molettes", "SVS system: slotted arm, arm and frame clamps, male/female links, posts, support collar, case, wrench, knobs"]),
   r("OUV 132-2", ["verre Peyman-Wessels-Landers 132 D Upright", "Peyman-Wessels-Landers 132D Upright lens"], { im: ".45x", sf: 100, df: 135 }),
   r("OUV-H132-2", ["support de verre 132 D Upright", "132D Upright lens holder"]),
   r("OIV 132", ["verre 132 D Indirect", "132D Indirect lens"], { im: ".45x", sf: 99, df: 135 }),
   r("OIV-H132", ["support de verre 132 D Indirect", "132D Indirect lens holder"]),
   r("OSVS-U132-2", ["set SVS + verre Upright 132 D + support + boîtier", "SVS set + 132D Upright lens + holder + case"]),
   r("OSVS-I132", ["set SVS + verre Indirect 132 D + support + boîtier", "SVS set + 132D Indirect lens + holder + case"])],
  [["Tous les éléments des sets sont aussi vendus séparément. Nettoyage : méthode 3 (OUV 132-2 : méthode 1).", "All set items are also available separately. Cleaning: method 3 (OUV 132-2: method 1)."]]);

// === Verres chirurgicaux
add("ocular-verres-chirurgicaux", "vitrectomie-jetables", "ODVB / ODVF / ODVM / ODVW / ODV3P",
  { nom: "Verres de vitrectomie jetables", description: "Verres de vitrectomie à usage unique en PMMA haute résolution, avec collerette en silicone pour la stabilité (remplace l'anneau suturé). Emballés individuellement en sachet stérile, vendus par boîte de 10." },
  { nom: "Disposable vitrectomy lenses", description: "Single-use high resolution PMMA vitrectomy lenses with a silicone flange for stability (replaces the suture-down ring). Individually packed in a sterile peel pack, sold in a box of 10." },
  [r("ODVB", ["biconcave 83 D, cavité vitréenne remplie d'air", "83D biconcave, air-filled vitreous cavity"]),
   r("ODVF", ["plan, champ de 36° du pôle postérieur, idéal pour la photographie", "flat, 36° field of the posterior pole, ideal for photography"]),
   r("ODVM", ["grossissant, manipulation fine des membranes rétiniennes", "magnifying, minute manipulation of retinal membranes"]),
   r("ODVW", ["grand champ, champ de 48°", "wide field, 48° field of view"]),
   r("ODV3P", ["prisme 30°, périphérie au-delà de l'équateur", "30° prism, periphery beyond the equator"])],
  [["Boîte de 10 verres stériles.", "Box of 10 sterile lenses."]]);
add("ocular-verres-chirurgicaux", "landers-hri", "OLVS-HRI",
  { nom: "Set de verres de vitrectomie Landers HRI (haut indice)", description: "Verres de vitrectomie en verre à haut indice de réfraction : champ plus large, moins de distorsion et de reflets, images plus nettes de la rétine périphérique et postérieure, donc moins de changements de verre pendant l'intervention. Le set comprend cinq verres, l'anneau Landers Tall Notched (sans montants, facilite l'indentation sclérale), l'occluseur Landers, la pince à verres et une boîte autoclavable." },
  { nom: "Landers HRI (high refractive index) vitrectomy lens set", description: "High refractive index glass vitrectomy lenses: wider field, less distortion and reflections, sharper peripheral and posterior retinal images, hence fewer lens changes during surgery. The set includes five lenses, the Landers Tall Notched lens ring (no struts, easier scleral depression), the Landers Occluder, lens forceps and an autoclavable case." },
  [r("OLVS-HRI", ["set complet", "complete set"]),
   r("OLV-2 HRI", ["biconcave 90 D (œil rempli d'air)", "90D biconcave (air-filled eye)"], { im: "0.78x", sf: 28 }),
   r("OLV-3 HRI", ["grossissant", "magnifying"], { im: "1.49x", sf: 34 }),
   r("OLV-4 HRI", ["grand champ", "wide field"], { im: "0.58x", sf: 48 }),
   r("OLV-6 HRI", ["prisme 20°", "20° prism"], { im: "0.58x", sf: 44 }),
   r("OLV-7 HRI", ["prisme 30°", "30° prism"], { im: "0.58x", sf: 38 }),
   r("OLV-1/TN", ["anneau Landers Tall Notched", "Landers Tall Notched lens ring"]),
   r("OLV-OC", ["occluseur Landers", "Landers Occluder"]),
   r("OLV-FCP", ["pince à verres Landers", "Landers lens forceps"])],
  [["Éléments du set vendus aussi séparément. Nettoyage : méthode 3.", "Set items also available separately. Cleaning: method 3."]]);
add("ocular-verres-chirurgicaux", "landers-anneau-quartz", "OLVS-3 / OLVS-3N",
  { nom: "Système de verres de vitrectomie Landers à anneau", description: "Système de vitrectomie Landers avec, au choix, l'anneau à deux montants à suturer (OLVS-3) ou l'anneau Tall Notched sans montants (OLVS-3N) ; comprend l'occluseur Landers, sept verres de vitrectomie, la pince à verres et une boîte autoclavable. Verres Machemer Plus (verre plan avec collerette silicone) et Landers prisme 50° disponibles en complément." },
  { nom: "Landers vitrectomy lens ring system", description: "Landers vitrectomy system with either the two-strut suture-down ring (OLVS-3) or the Tall Notched ring without struts (OLVS-3N); includes the Landers Occluder, seven vitrectomy lenses, lens forceps and an autoclavable case. Machemer Plus (flat lens with silicone flange) and Landers 50° prism lenses also available." },
  [r("OLVS-3", ["système avec anneau Landers OLV-1 (deux montants)", "system with Landers OLV-1 ring (two struts)"]),
   r("OLVS-3N", ["système avec anneau Tall Notched OLV-1/TN", "system with OLV-1/TN Tall Notched ring"]),
   r("OLV-2", ["Landers biconcave 83 D", "Landers biconcave 83D"], { im: "0.80x", sf: 25 }),
   r("OLV-3", ["Machemer grossissant", "Machemer magnifying"], { im: "1.49x", sf: 30 }),
   r("OLV-4", ["Peyman grand champ", "Peyman wide field"], { im: "0.49x", sf: 48 }),
   r("OLV-5", ["Machemer plan", "Machemer flat"], { im: "0.58x", sf: 36 }),
   r("OLV-6", ["Tolentino prisme 20°", "Tolentino 20° prism"], { im: "1.02x", sf: 36 }),
   r("OLV-7", ["Tolentino prisme 30°", "Tolentino 30° prism"], { im: "1.02x", sf: 33 }),
   r("OLV-9", ["Woldoff biconcave prismatique", "Woldoff prismatic biconcave"], { im: "0.40x", sf: 18 }),
   r("OLV-5SR", ["Machemer Plus : OLV-5 avec collerette silicone", "Machemer Plus: OLV-5 with silicone flange"], { im: "1.02x", sf: 36 }),
   r("OLV-8", ["Landers prisme 50°", "Landers 50° prism"], { im: "1.02x", sf: 22 })],
  [["Grandissements et champs : tableau des verres de vitrectomie en quartz du catalogue. Éléments des sets vendus aussi séparément.", "Magnification and fields: catalogue quartz vitrectomy lens table. Set items also available separately."]]);
add("ocular-verres-chirurgicaux", "anneaux-vitrectomie", "OLV-1 / OLV-1S / OLV-1/4P / OTN-R",
  { nom: "Anneaux de vitrectomie, occluseur et pince", description: "Anneaux de maintien des verres de vitrectomie : Landers à deux montants, Tall Notched (trois encoches pour les sutures), silicone souple (sans suture, idéal en 25 gauge, sachet de 4), Four Post (deux sutures sur un montant de chaque côté), versions d'irrigation (port d'irrigation, tubulure Luer de rechange OLTA) et anneau Tano (une seule suture circonférentielle). Occluseur et pince Landers en complément." },
  { nom: "Vitrectomy lens rings, occluder and forceps", description: "Vitrectomy lens holding rings: Landers two-strut, Tall Notched (three notches for sutures), flexible silicone (no sutures, ideal for 25 gauge, package of 4), Four Post (two sutures over one post on each side), irrigating versions (irrigation port, replacement OLTA Luer tube) and Tano ring (a single circumferential suture). Landers occluder and forceps as complements." },
  [r("OLV-1", ["anneau Landers, deux montants à suturer", "Landers ring, two suture-down struts"]),
   r("OLV-1/TN", ["anneau Landers Tall Notched", "Landers Tall Notched ring"]),
   r("OLV-1S", ["anneau silicone Landers (4 par sachet)", "Landers silicone ring (four per package)"]),
   r("OLV-1/4P", ["anneau Landers Four Post", "Landers Four Post ring"]),
   r("OLV-1/IN", ["anneau Landers à encoches avec irrigation", "Landers irrigating notched ring"]),
   r("OLV-1 IR", ["anneau Landers avec irrigation", "Landers irrigating ring"]),
   r("OTN-R", ["anneau de vitrectomie Tano", "Tano vitrectomy lens ring"]),
   r("OLV-OC", ["occluseur Landers (bloque la lumière du microscope)", "Landers Occluder (blocks microscope light)"]),
   r("OLV-FCP", ["pince à verres Landers, acier inoxydable", "Landers lens forceps, stainless steel"])]);
add("ocular-verres-chirurgicaux", "pediatrique", "OPV-S / OPPWV",
  { nom: "Verres de vitrectomie pédiatriques", description: "Set pédiatrique pour la rétinopathie du prématuré et les anomalies congénitales (persistance du vitré primitif) : verres de 8 mm donnant une vue claire de toute la rétine et du nerf optique tout en évitant la séparation verre/cornée fréquente avec les verres adultes ; une rainure permet la fixation par fil orthopédique 3.0. Le set comprend trois verres, l'anneau, la pince et une boîte autoclavable. Peyman Pediatric Wide Field : verre deux pièces autoclavable pour la vue panoramique de la périphérie chez le prématuré comme chez l'adulte (image indirecte, à utiliser avec un inverseur)." },
  { nom: "Pediatric vitrectomy lenses", description: "Pediatric set for retinopathy of prematurity and congenital anomalies (persistent hyperplastic primary vitreous): 8 mm lenses giving a clear view of the entire retina and optic nerve while preventing the lens/cornea separation common with adult lenses; a groove allows fixation with 3.0 orthopedic suture wire. The set includes three lenses, ring, forceps and an autoclavable case. Peyman Pediatric Wide Field: two-piece autoclavable lens for panoramic viewing of the periphery in premature infants and adults (indirect image, to be used with an inverter)." },
  [r("OPV-S", ["set pédiatrique complet", "complete pediatric set"]),
   r("OPV-B", ["biconcave 92 D (œil rempli d'air)", "92D biconcave (air-filled eye)"], { im: "1.03x", sf: 25 }),
   r("OPV-F", ["plan (œil rempli de liquide)", "flat (fluid-filled eye)"], { im: "1.02x", sf: 36 }),
   r("OPV-P", ["prisme, au-delà de l'équateur", "prism, beyond the equator"], { im: "1.02x", sf: 33 }),
   r("OPV-R", ["anneau pédiatrique à deux montants", "pediatric ring with two struts"]),
   r("OPV-FCP", ["pince pédiatrique, acier inoxydable", "pediatric forceps, stainless steel"]),
   r("OPPWV", x("Peyman Pediatric Wide Field"), { gm: ".50x", cd: "7", sf: 94 })]);
add("ocular-verres-chirurgicaux", "vitrectomie-infusion", "OHFVE / OBVI / OFVI / OMVI / OPGVI / OPVI-3",
  { nom: "Verres de vitrectomie à infusion", description: "Verres de vitrectomie avec manche d'infusion. Hexagonal : manche hexagonal ergonomique avec embout Luer femelle, anneau qui garde la canule hors du champ même incliné, quatre styles, stérilisables à la vapeur (tubulure OLTA-2). Manches de couleur pour l'identification : Landers biconcave 83 D (rouge), plan et plan pédiatrique (violet), Machemer grossissant (bleu), Peyman-Green Fluid Cell (vert, surface antérieure en retrait de 3 mm), et Peyman III grand champ 60 D (tubulure de rechange OLTA)." },
  { nom: "Infusion vitrectomy lenses", description: "Vitrectomy lenses with infusion handle. Hexagonal: ergonomic hexagonal handle with built-in female Luer hub, ring keeping the cannula out of the field even at steep tilt, four styles, steam sterilizable (OLTA-2 tube). Colour-coded handles: Landers biconcave 83D (red), flat and pediatric flat (purple), Machemer magnifying (blue), Peyman-Green Fluid Cell (green, anterior surface recessed 3 mm), and Peyman III wide field 60D (replacement OLTA tube)." },
  [r("OHFVE", ["hexagonal plan", "hexagonal flat"], { im: ["1,02x (liquide)", "1.02x (fluid)"], cd: "11.8", sf: 36 }),
   r("OHMVE", ["hexagonal grossissant", "hexagonal magnifying"], { im: ["1,47x (liquide)", "1.47x (fluid)"], cd: "11.8", sf: 30 }),
   r("OHBVE", ["hexagonal biconcave", "hexagonal biconcave"], { im: ["0,80x (air)", "0.80x (air)"], cd: "11.8", sf: 24 }),
   r("OHWVE", ["hexagonal grand champ", "hexagonal wide field"], { im: ["0,49x (liquide) / 1,12x (air)", "0.49x (fluid) / 1.12x (air)"], cd: "11.8", sf: 48 }),
   r("OBVI", ["Landers biconcave, manche rouge", "Landers biconcave, red handle"], { im: ["0,80x (air)", "0.80x (air)"], cd: "9", sf: 24 }),
   r("OFVI", ["plan, manche violet", "flat, purple handle"], { im: ["1,02x (liquide)", "1.02x (fluid)"], cd: "10", sf: 36 }),
   r("OPFVI", ["plan pédiatrique, manche violet", "pediatric flat, purple handle"], { im: ["1,02x (liquide)", "1.02x (fluid)"], cd: "7", sf: 36 }),
   r("OMVI", ["Machemer grossissant, manche bleu", "Machemer magnifying, blue handle"], { im: ["1,47x (liquide)", "1.47x (fluid)"], cd: "10", sf: 30 }),
   r("OPGVI", ["Peyman-Green Fluid Cell, manche vert", "Peyman-Green Fluid Cell, green handle"], { im: ["1,02x (liquide)", "1.02x (fluid)"], cd: "12", sf: 36 }),
   r("OPVI-3", ["Peyman III grand champ", "Peyman III wide field"], { im: ["0,49x (liquide) / 1,12x (air)", "0.49x (fluid) / 1.12x (air)"], cd: "12", sf: 48 })],
  [["Tubulures Luer de rechange : OLTA (manches simples), OLTA-2 (hexagonaux).", "Replacement Luer tube assemblies: OLTA (standard handles), OLTA-2 (hexagonal)."]]);
add("ocular-verres-chirurgicaux", "gonio-chirurgicaux", "OHSG / OKSG / OSJAG / OTSG / OHBG",
  { nom: "Gonioprismes chirurgicaux et verres de goniotomie", description: "Verres pour la goniotomie et la gonioscopie peropératoire : Hill (collerette étendue pour fixer le globe, versions main gauche et main droite), Khaw (anneau de fixation et manche), Swan Jacob autoclavable (petite taille, adulte et enfant, manche en aluminium anodisé), Thorpe (sous microscope ou loupe, contrôle d'un implant de chambre antérieure) et Hoskins-Barkan (goniotomie transverse ; tailles nourrisson, prématuré et adulte)." },
  { nom: "Surgical gonioprisms and goniotomy lenses", description: "Lenses for goniotomy and intra-operative gonioscopy: Hill (extended flange to fixate the globe, left and right hand versions), Khaw (fixation ring and handle), autoclavable Swan Jacob (small size, adult and pediatric, anodized aluminium handle), Thorpe (with operating microscope or loupe, checking an anterior chamber IOL) and Hoskins-Barkan (transverse goniotomy; infant, premature and adult sizes)." },
  [r("OHSG/LH", ["Hill, main gauche", "Hill, left hand"], { gm: "1.20x", cd: "9", sf: 90 }),
   r("OHSG/RH", ["Hill, main droite", "Hill, right hand"], { gm: "1.20x", cd: "9", sf: 90 }),
   r("OKSG", x("Khaw Surgical Gonioprism"), { im: "1.40x", cd: "11.5", hl: "88.4" }),
   r("OSJAG", ["Swan Jacob autoclavable", "Swan Jacob autoclavable"], { gm: "1.20x", cd: "10", hl: "77.6" }),
   r("OTSG", x("Thorpe Surgical Gonioscope"), { gm: "1.10x", cd: "10", hl: "32.5" }),
   r("OHBG-1", ["Hoskins-Barkan nourrisson, 10 mm", "Hoskins-Barkan infant, 10 mm"], { gm: "1.30x" }),
   r("OHBG-2", ["Hoskins-Barkan prématuré, 9 mm", "Hoskins-Barkan premature, 9 mm"], { gm: "1.30x" }),
   r("OHBG-3", ["Hoskins-Barkan adulte, 11,5 mm", "Hoskins-Barkan adult, 11.5 mm"], { gm: "1.30x" })]);
add("ocular-verres-chirurgicaux", "keratoprotheses", "OCTK-6.5 / OLTK",
  { nom: "Kératoprothèses temporaires Cobo et Landers", description: "Cobo : cône tronqué en quartz autoclavable, rainure supérieure pour la fixation par suture et manche d'infusion en acier inoxydable pour l'injection de liquide ou de gaz (tamponnement en cas d'hémorragie peropératoire) ; face antérieure plane pour voir le pôle postérieur. Landers Wide Field : face antérieure convexe de 32 D pour la rétine périphérique et le pôle postérieur, 6 trous de suture, deux tailles pour trépanations de 7,0 ou 8,0 ; des verres de vitrectomie peuvent être posés dessus." },
  { nom: "Cobo and Landers temporary keratoprostheses", description: "Cobo: autoclavable truncated quartz cone, superior groove for suture fixation and stainless steel infusion handle for injecting fluid or gas (tamponade in case of intraoperative hemorrhage); plano anterior surface to view the posterior pole. Landers Wide Field: 32D convex anterior surface for the peripheral retina and posterior pole, 6 suture holes, two sizes for 7.0 or 8.0 trephinations; vitrectomy lenses may be placed on top." },
  [r("OCTK-6.5", x("Cobo"), { cd: "6.5", hl: "40" }),
   r("OLTK-7.2", ["Landers Wide Field, trépan 7,0", "Landers Wide Field, 7.0 trephine"], { im: "2.29x", cd: "7.2", sf: 28 }),
   r("OLTK-8.2", ["Landers Wide Field, trépan 8,0", "Landers Wide Field, 8.0 trephine"], { im: "2.29x", cd: "8.2", sf: 30 })],
  [["Produits non certifiés CE selon le catalogue (Landers et Cobo).", "Not certified products according to the catalogue (Landers and Cobo)."]]);
add("ocular-verres-chirurgicaux", "kit-osher", "OSVK / OOSGP",
  { nom: "Kit de visualisation chirurgicale Osher", description: "Combinaison de verres à garder sous la main pendant la chirurgie de la cataracte : le verre Osher Surgical Gonio Posterior Pole (deux miroirs gonio de 60°, vue de l'angle sur 360° par rotation du manche et vue grossie du pôle postérieur, autoclavable) et la loupe Osher MaxField® 78 D (vue large du fond d'œil sans contact avec un minimum de réglage du microscope)." },
  { nom: "Osher surgical viewing kit", description: "Combination of lenses to have on hand during cataract surgery: the Osher Surgical Gonio Posterior Pole lens (two 60° gonio mirrors, 360° angle view by rotating the handle and magnified posterior pole view, steam autoclavable) and the Osher MaxField® 78D lens (wide-field non-contact view of the retina with minimal microscope adjustment)." },
  [r("OSVK", ["kit Osher (OOSGP + OI-78M)", "Osher kit (OOSGP + OI-78M)"]),
   r("OOSGP", x("Osher Surgical Gonio Posterior Pole"), { gm: ".84x", cd: "14", sf: 38 }),
   r("OI-78M", x("Osher MaxField® 78D"), { im: ".77x", ls: "1.30x", sf: 98, df: 155, wd: "7", ca: "27", w: "21" })],
  [["Verres du kit vendus aussi séparément.", "Kit lenses also available separately."]]);

// === Tonomètres
add("ocular-tonometres", "tonometres-barraquer", "OBT / OBBT / OBVT",
  { nom: "Tonomètres Barraquer de bloc opératoire", description: "Tonomètres fondés sur le principe d'aplanation de Maklakov : au contact de la cornée, l'anneau de ménisque permet d'estimer la pression intraoculaire. Barraquer 10-15 et 15-21 à double échelle de Terry (le 15-21 est utile en chirurgie vitréo-rétinienne lors de l'échange liquide-gaz), Barraquer 65 et 65/90 et Barraquer Varley 90 pour le LASIK, Barron Barraquer 65/90 pour le microkératome Barron. Anneau silicone de rechange." },
  { nom: "Barraquer operating room tonometers", description: "Tonometers based on Maklakov's applanation principle: by direct corneal contact, the meniscus ring indicates the intraocular pressure. Barraquer 10-15 and 15-21 with Terry dual calibration scale (the 15-21 is useful in vitreoretinal surgery during gas-fluid exchange), Barraquer 65 and 65/90 and Barraquer Varley 90 for LASIK, Barron Barraquer 65/90 for the Barron microkeratome. Replacement silicone ring." },
  [r("OBT-TC-10-15", ["Barraquer 10-15 mm Hg", "Barraquer 10-15 mm Hg"], { cd: "10", h: "23.5" }),
   r("OBT-TC-15-21", ["Barraquer 15-21 mm Hg", "Barraquer 15-21 mm Hg"], { cd: "10", h: "23.5" }),
   r("OBT-65", ["Barraquer 65 mm Hg (LASIK)", "Barraquer 65 mm Hg (LASIK)"], { cd: "10", h: "47" }),
   r("OBT-65/90", ["Barraquer 65/90 mm Hg (LASIK)", "Barraquer 65/90 mm Hg (LASIK)"], { cd: "8", h: "72" }),
   r("OBBT", ["Barron Barraquer 65/90 mm Hg", "Barron Barraquer 65/90 mm Hg"], { cd: "8", h: "67" }),
   r("OBVT", ["Barraquer Varley 90 mm Hg", "Barraquer Varley 90 mm Hg"], { cd: "8", h: "56" }),
   r("OBT-O", ["anneau silicone de rechange (paquet de 5)", "replacement silicone ring (package of 5)"])],
  [["Nettoyage : méthode 4.", "Cleaning: method 4."]]);

// === Modèles d'œil et accessoires
add("ocular-modeles-oeil-accessoires", "slo", "OSR230 / OSLO60-2",
  { nom: "Verres SLO (ophtalmoscope laser à balayage)", description: "Staurenghi 230 SLO Retina : verre de contact pour ophtalmoscope laser confocal à balayage, optimisé pour l'angiographie grand champ à la fluorescéine et au vert d'indocyanine et les images en réflectance verte et infrarouge. Lee-Mainster SLO : verre sans contact qui double le champ du Heidelberg Engineering HRA2 (le réglage 30° donne 60°), optique traitée pour réduire les reflets." },
  { nom: "SLO (scanning laser ophthalmoscope) lenses", description: "Staurenghi 230 SLO Retina: contact lens for confocal scanning laser ophthalmoscopes, optimized for wide-field fluorescein and indocyanine green angiography and green and infrared reflectance images. Lee-Mainster SLO: non-contact lens doubling the field of view of the Heidelberg Engineering HRA2 (30° setting gives 60°), coated optics to reduce reflections." },
  [r("OSR230", x("Staurenghi 230 SLO Retina"), { cd: "19", sf: 150, im: ".23x" }),
   r("OSLO60-2", x("Lee-Mainster SLO"), { im: ".50x" })]);
add("ocular-modeles-oeil-accessoires", "recherche", "OFA5.4 / OGP2 / OK2MA / OKSMA / OHLA20",
  { nom: "Verres de recherche (animaux de laboratoire)", description: "Verres pour la recherche animale : Fundus 5.4 Laser (fond d'œil et pôle postérieur du rat), gonioprisme 2 mm (angle irido-cornéen de la souris et du rat, gonio-photographie, avec ou sans manche), Kaufman Laser (rétine de toutes espèces de singe, un miroir de 64° ou deux miroirs de 67° et 76°, traitement Laserlight®) et adaptateur HRA 20 D (vue grand champ de la rétine du rat avec le HRA)." },
  { nom: "Research lenses (laboratory animals)", description: "Lenses for animal research: Fundus 5.4 Laser (rat fundus and posterior pole), 2 mm gonioprism (anterior chamber angle of mice and rats, goniophotography, with or without handle), Kaufman Laser (retina of all monkey species, one 64° mirror or two 67° and 76° mirrors, Laserlight® coating) and HRA 20D lens adapter (wide-field view of the rat retina with the HRA)." },
  [r("OFA5.4", x("Fundus 5.4 Laser"), { cd: "5.4", h: "5.8", hl: "78.8" }),
   r("OGP2", ["gonioprisme 2 mm", "2 mm gonioprism"], { cd: "2", h: "8.6" }),
   r("OGP2H", ["gonioprisme 2 mm avec manche", "2 mm gonioprism with handle"], { cd: "2", h: "8.6", hl: "78.8" }),
   r("OK2MA", ["Kaufman 2 miroirs (67° / 76°)", "Kaufman two mirror (67° / 76°)"], { cd: "13", h: "19.5" }),
   r("OKSMA", ["Kaufman 1 miroir (64°)", "Kaufman single mirror (64°)"], { cd: "13", h: "19.5" }),
   r("OHLA20", ["adaptateur HRA 20 D", "HRA 20D lens adapter"])],
  [["Nettoyage : méthode 1.", "Cleaning: method 1."]]);
add("ocular-modeles-oeil-accessoires", "modeles-oeil", "OEM-F / OEMI-7",
  { nom: "Modèles d'œil pédagogiques", description: "Modèles d'œil pour l'enseignement de la biomicroscopie à la lampe à fente, de l'ophtalmoscopie et de l'imagerie : décollement de rétine avec déchirure, corps étranger, papille et vaisseaux, ligne équatoriale à 180°. Fundus Eye Model en pupille 8 mm ou 2 mm (la 2 mm permet aussi la gonioscopie) ; Imaging Eye Model avec chambre antérieure, cristallin et éléments fluorescents pour simuler l'angiographie. Support pour la mentonnière de la lampe à fente, support de table et kit de remplissage." },
  { nom: "Teaching eye models", description: "Eye models for teaching slit lamp biomicroscopy, ophthalmoscopy and imaging: retinal detachment with tear, foreign body, optic disc and blood vessels, equator line at 180°. Fundus Eye Model with 8 mm or 2 mm pupil (the 2 mm also allows gonioscopy); Imaging Eye Model with anterior chamber, crystalline lens and fluorescent features to simulate angiography. Bracket for the slit lamp chin rest, table top holder and fill kit." },
  [r("OEM-F", ["modèle de fond d'œil, pupille 8 mm", "fundus eye model, 8 mm pupil"]),
   r("OEM-F2", ["modèle de fond d'œil, pupille 2 mm", "fundus eye model, 2 mm pupil"]),
   r("OEMI-7", ["modèle d'œil d'imagerie, 7 mm", "imaging eye model, 7 mm"]),
   r("OEMB1", ["support pour montant de mentonnière de lampe à fente", "bracket for the slit lamp chin rest post"]),
   r("OEMB2", ["support de table (œil incliné à 52°, rotation libre)", "table top holder (eye held at 52°, free rotation)"]),
   r("OEMFK", ["kit de remplissage : seringue 3 cc, aiguille mousse 21 G, clé hexagonale 1/16, huile minérale", "fill kit: 3 cc syringe, 21 gauge blunt needle, 1/16 hex key, mineral oil"])]);
add("ocular-modeles-oeil-accessoires", "etuis", "OCC / OLSC4 / OIVS-C / OSVS-C",
  { nom: "Étuis de rangement pour verres", description: "Étuis en noyer fabriqués à la demande (trois tailles standard, autres tailles sur demande), étui souple en cuir noir à intérieur microfibre pour le transport entre salles d'examen, et mallettes en plastique noir à mousse découpée pour les systèmes grand angle IVS et SVS." },
  { nom: "Lens storage cases", description: "Walnut lens cases built to order (three standard sizes, other sizes on request), black leather soft case with microfiber lining for carrying a lens between exam rooms, and black plastic cases with custom cut foam for the IVS and SVS wide angle systems." },
  [r("OCC-1", ["noyer, 2 verres, 2\" x 3\" bas", "walnut, 2 lenses, 2\" x 3\" short"]),
   r("OCC-2", ["noyer, 2 verres, 2\" x 3\" haut", "walnut, 2 lenses, 2\" x 3\" tall"]),
   r("OCC-3", ["noyer, 3 à 6 verres, 4\" x 6\"", "walnut, 3-6 lenses, 4\" x 6\""]),
   r("OLSC4", ["étui souple en cuir 4\"", "4\" leather soft case"]),
   r("OIVS-C", ["mallette du système IVS", "IVS carrying case"]),
   r("OSVS-C", ["mallette du système SVS", "SVS carrying case"])]);
add("ocular-modeles-oeil-accessoires", "sterilisation", "OI-ST / OLV-C",
  { nom: "Boîtes de stérilisation pour verres", description: "Plateau de stérilisation empilable pour loupes d'ophtalmoscopie indirecte (oxyde d'éthylène et stérilisation à froid) et boîtes de stérilisation / rangement pour verres de vitrectomie, compatibles avec l'autoclave, l'oxyde d'éthylène et la stérilisation à froid, en plusieurs tailles." },
  { nom: "Lens sterilization cases", description: "Stackable sterilizing tray for indirect ophthalmoscopy lenses (ethylene oxide and cold sterilization) and sterilization / storage cases for vitrectomy lenses, suitable for autoclave, ethylene oxide and cold sterilization, in several sizes." },
  [r("OI-ST", ["plateau de stérilisation pour loupes indirectes", "indirect lens sterilizing tray"]),
   r("OLV-C", ["boîte 8 verres", "8 lens case"]),
   r("OLV-C2", ["boîte 2 verres", "2 lens case"]),
   r("OLV-C3", ["boîte 10 verres", "10 lens case"]),
   r("OLV-C3 HRI", ["boîte 10 verres HRI", "10 lens HRI case"]),
   r("OLV-C4", ["boîte autoclavable pour O4MAC et O4MAC-LR", "autoclavable case for O4MAC and O4MAC-LR"])]);
add("ocular-modeles-oeil-accessoires", "collerettes-anneaux", "OACF / OACF4 / OLPR",
  { nom: "Collerettes et anneaux de protection pour verres", description: "Collerettes en polymère médical résistant à monter sur les verres en verre autoclavables (trois miroirs OG3MAC-10 et OG3MHD-10 ; quatre miroirs O4MAC, O4MAC-LR, OG4MG, OG4MG-LR), amovibles pour le nettoyage et compatibles avec la stérilisation à la vapeur : elles évitent d'acheter des verres à collerette dédiée. Anneaux de protection moletés qui se glissent sur le verre contre les rayures." },
  { nom: "Lens flanges and protection rings", description: "Durable medical polymer flanges fitted on the autoclavable glass lenses (three mirror OG3MAC-10 and OG3MHD-10; four mirror O4MAC, O4MAC-LR, OG4MG, OG4MG-LR), removable for cleaning and steam sterilizable: no need to buy additional lenses with dedicated flanges. Knurled protection rings slip over the lens to guard against scratches." },
  [r("OACF-15", ["collerette trois miroirs", "three mirror flange"], { fl: "15" }),
   r("OACF-17", ["collerette trois miroirs", "three mirror flange"], { fl: "17" }),
   r("OACF4-15", ["collerette quatre miroirs", "four mirror flange"], { fl: "15" }),
   r("OACF4-17", ["collerette quatre miroirs", "four mirror flange"], { fl: "17" }),
   r("OLPR-L", ["anneau de protection, grand verre", "protection ring, large lens"]),
   r("OLPR-M", ["anneau de protection, verre moyen", "protection ring, medium lens"]),
   r("OLPR-S", ["anneau de protection, petit verre", "protection ring, small lens"]),
   r("OLPR-RIT", ["anneau de protection, Ritch Trabeculoplasty", "protection ring, Ritch Trabeculoplasty"]),
   r("OLPR-SUS", ["anneau de protection, Sussman", "protection ring, Sussman"]),
   r("OLPR-SUS-2", ["anneau de protection, Sussman grande bague", "protection ring, Sussman large ring"])]);
add("ocular-modeles-oeil-accessoires", "accessoires-entretien", "OLCC / OGSH / OKWB21 / OLTA / OI-SRG520",
  { nom: "Accessoires pour verres Ocular", description: "Chiffons de nettoyage en microfibre (avec étui vinyle, version autoclavable), support de flacon de solution gonioscopique en PMMA (limite les bulles d'air), bain d'eau Kapetansky pour la biomicroscopie ultrasonore (autoclavable), tubulures Luer de rechange pour verres de vitrectomie à infusion, et grille rétinienne Saxena 520 (fil monofilament à 5,20 mm, repère de la taille de la papille) qui se fixe sur les loupes indirectes Ocular 20 D." },
  { nom: "Ocular lens accessories", description: "Microfiber lens cleaning cloths (with vinyl case, autoclavable version), heavy PMMA gonioscopic solution holder (minimizes air bubbles), Kapetansky water bath for ultrasound biomicroscopy (autoclavable), replacement Luer tube assemblies for infusion vitrectomy lenses, and Saxena Retinal Grid 520 (monofilament line at 5.20 mm spacing, optic disc size reference) fitting on Ocular 20D indirect lenses." },
  [r("OLCC", ["chiffon de nettoyage bleu", "blue cleaning cloth"]),
   r("OLCCA", ["chiffon de nettoyage blanc, autoclavable", "white cleaning cloth, autoclavable"]),
   r("OGSH", ["support de solution gonioscopique", "gonioscopic solution holder"]),
   r("OKWB21", ["bain d'eau Kapetansky", "Kapetansky water bath"]),
   r("OLTA", ["tubulure Luer pour OBVI, OFVI, OPFVI, OMVI, OPGVI, OPVI-3, OLV-1/IN, OLV-1 IR", "Luer tube for OBVI, OFVI, OPFVI, OMVI, OPGVI, OPVI-3, OLV-1/IN, OLV-1 IR"]),
   r("OLTA-2", ["tubulure Luer pour OHBVE, OHFVE, OHMVE, OHWVE", "Luer tube for OHBVE, OHFVE, OHMVE, OHWVE"]),
   r("OI-SRG520", ["grille rétinienne Saxena 520 (loupes 20 D vendues séparément)", "Saxena Retinal Grid 520 (20D lenses sold separately)"])]);

const PRODUCTS = P.map((p, i) => {
  const fr = { ...p.fr, fiche_technique: fiche(p.rows, p.notes, "fr") };
  const en = { ...p.en, fiche_technique: fiche(p.rows, p.notes, "en") };
  return { id: pid(i + 1), slug: `ocular-${p.key}`, ref: p.ref, cat: p.cat, img: p.key, sort: i + 1, fr, en };
});

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const cat = await prisma.categories.findUnique({ where: { slug: PARENT }, include: { category_translations: true } });
  const products = await prisma.products.findMany({ where: { id: { in: [...ARCHIVE, ...KEEP_ARCHIVED] } }, include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  const out = { taken_at: new Date().toISOString(), categories: {}, products: {} };
  const { category_translations, ...row } = cat;
  out.categories[cat.slug] = { row, translations: category_translations };
  for (const p of products) { const { product_translations, product_media, ...r } = p; out.products[p.id] = { row: r, translations: product_translations, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: 1 category, ${products.length} products -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);

async function apply() {
  if (!exists(PDF)) console.log(`  [MISSING FILE] ${PDF}`);
  const parent = await prisma.categories.findUnique({ where: { slug: PARENT }, include: { category_translations: true } });
  for (const lang of ["fr", "en"]) {
    const t = parent.category_translations.find((x) => x.language_code === lang);
    if (t && t.description === PARENT_DESC[lang]) { console.log(`  [SKIP] ${PARENT} description ${lang}`); continue; }
    console.log(`  ${PARENT} description ${lang}: « ${t?.description} » -> « ${PARENT_DESC[lang]} »`);
    if (WRITE) await prisma.category_translations.update({ where: { category_id_language_code: { category_id: parent.id, language_code: lang } }, data: { description: PARENT_DESC[lang] } });
  }

  for (const c of CATS) {
    if (!exists(cimg(c.image))) console.log(`  [MISSING FILE] ${cimg(c.image)}`);
    const row = await prisma.categories.findUnique({ where: { id: c.id }, include: { category_translations: true } });
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, description: c.dfr, parent_id: parent.id, sort_order: c.sort,
        is_active: true, type: parent.type, image_url: cimg(c.image), updated_at: now(),
        category_translations: { create: [
          { id: `${c.id}-fr`, language_code: "fr", name: c.fr, description: c.dfr },
          { id: `${c.id}-en`, language_code: "en", name: c.en, description: c.den }] } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== parent.id) data.parent_id = parent.id;
    if (row.sort_order !== c.sort) data.sort_order = c.sort;
    if (row.image_url !== cimg(c.image)) data.image_url = cimg(c.image);
    if (!row.is_active) data.is_active = true;
    if (row.name !== c.fr) data.name = c.fr;
    if (row.description !== c.dfr) data.description = c.dfr;
    const tr = ["fr", "en"].filter((lang) => {
      const t = row.category_translations.find((x) => x.language_code === lang);
      return !t || t.name !== c[lang] || t.description !== c[lang === "fr" ? "dfr" : "den"];
    });
    if (!Object.keys(data).length && !tr.length) { console.log(`  [SKIP] category ${c.slug}`); continue; }
    console.log(`  category ${c.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}`);
    if (!WRITE) continue;
    if (Object.keys(data).length) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
    for (const lang of tr) await prisma.category_translations.upsert({
      where: { category_id_language_code: { category_id: c.id, language_code: lang } },
      update: { name: c[lang], description: c[lang === "fr" ? "dfr" : "den"] },
      create: { id: `${c.id}-${lang}`, category_id: c.id, language_code: lang, name: c[lang], description: c[lang === "fr" ? "dfr" : "den"] } });
  }

  const catId = Object.fromEntries(CATS.map((c) => [c.slug, c.id]));
  for (const p of PRODUCTS) {
    if (!exists(pimg(p.img))) console.log(`  [MISSING FILE] ${pimg(p.img)}`);
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = { id: `${p.id}-m83`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    if (!row) {
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat}`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat],
        constructeur: "ocular", partner_id: OCULAR, status: "active", sort_order: p.sort, pdf_brochure_url: PDF, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    if (row.category_id !== catId[p.cat]) data.category_id = catId[p.cat];
    if (row.status !== "active") data.status = "active";
    if (row.sort_order !== p.sort) data.sort_order = p.sort;
    if (row.pdf_brochure_url !== PDF) data.pdf_brochure_url = PDF;
    if (row.reference_fournisseur !== p.ref) data.reference_fournisseur = p.ref;
    if (row.slug !== p.slug) data.slug = p.slug;
    if (row.constructeur !== "ocular") data.constructeur = "ocular";
    if (row.partner_id !== OCULAR) data.partner_id = OCULAR;
    const tr = ["fr", "en"].filter((lang) => {
      const t = row.product_translations.find((x) => x.language_code === lang);
      return !t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k]));
    });
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary && row.product_media[0].alt_text === media.alt_text;
    if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${p.slug}`); continue; }
    console.log(`  product ${p.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : " photo"}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({
        where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: `${p.id}-${lang}`, product_id: p.id, language_code: lang, ...p[lang] } });
      if (!mediaOk) {
        await tx.product_media.deleteMany({ where: { product_id: p.id } });
        await tx.product_media.create({ data: { ...media, product_id: p.id } });
      }
    });
  }

  for (const id of [...ARCHIVE, ...KEEP_ARCHIVED]) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${id}`); continue; }
    if (row.status === "archived") { console.log(`  [SKIP] archived ${row.slug}`); continue; }
    console.log(`  archive ${row.slug} [${row.reference_fournisseur}]`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  product ${b.row.slug} -> ${b.row.status}`);
    await prisma.$transaction(async (tx) => {
      await tx.products.update({ where: { id }, data: { ...row, updated_at: now() } });
      for (const t of b.translations) {
        const { id: tid, product_id, language_code, ...fields } = t;
        await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: id, language_code } }, update: fields, create: t });
      }
      await tx.product_media.deleteMany({ where: { product_id: id } });
      for (const m of b.media) await tx.product_media.create({ data: m });
    });
  }
  const n = await prisma.products.deleteMany({ where: { id: { in: PRODUCTS.map((p) => p.id) } } });
  console.log(`  - deleted ${n.count} new products`);
  for (const [slug, b] of Object.entries(BEFORE.categories)) {
    const { id, created_at, ...row } = b.row;
    console.log(`  category ${slug}`);
    await prisma.categories.update({ where: { id }, data: { ...row, updated_at: now() } });
    for (const t of b.translations) {
      const { id: tid, category_id, language_code, ...fields } = t;
      await prisma.category_translations.update({ where: { category_id_language_code: { category_id, language_code } }, data: fields });
    }
  }
  for (const c of CATS) {
    if (!(await prisma.categories.findUnique({ where: { id: c.id } }))) continue;
    const k = await prisma.products.count({ where: { category_id: c.id } });
    if (k) { console.log(`  [KEEP] ${c.slug} has ${k} products`); continue; }
    console.log(`  - delete category ${c.slug}`);
    await prisma.categories.delete({ where: { id: c.id } });
  }
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
