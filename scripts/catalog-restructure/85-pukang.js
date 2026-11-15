const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const MAIN = require.main === module;
const prisma = MAIN ? new (require("@prisma/client").PrismaClient)() : null;

/**
 * 2026-11-15 -- Lot D « Literie et mobilier médical » (mobilier-et-literie-hospitaliers):
 * complete the PUKANG range from the 2026 manufacturer catalogue
 * (« CATALOGUE PUKANG.pdf », Hebei Pukang Medical Instruments, printed 2026.6).
 *
 * The 39 active PUKANG products already on the site are kept as they are, except:
 *   - DB-40 (« Équipement Médical PUKANG DB-40 », in literie-hospitaliere) is an
 *     electric examination bed: renamed, moved to tables-medicales, re-described
 *     with its two catalogue variants DB-40 (C1) / DB-40 (C2), new slug, photos of
 *     both variants;
 *   - every existing PUKANG product whose code is in the catalogue gets the
 *     catalogue PDF as pdf_brochure_url (when it has none);
 *   - the PUKANG partner gets the catalogue as default_pdf_url.
 * Foshan and Nitrocare products are not touched.
 *
 * Every catalogue model not yet on the site is created (one product per model
 * code; configuration variants of one model -- A-1 (A1/C1/C3), B-6 (A1/C1/C3),
 * B-40 / B-40 (C3) -- are one product), with its photo cropped from the
 * catalogue (pukang-85-*.jpg), FR/EN name, description and technical sheet taken
 * from the catalogue tables, partner PUKANG, the catalogue PDF attached.
 * Two sub-categories are created for products that fit no existing one:
 *   pukang-accessoires-lit  « Accessoires de lit » (bed IV poles, lifting pole,
 *                           dining board, basket, rack, O2 holder, bracket, transfer board)
 *   pukang-mobilier-soins   « Mobilier de soins » (screen, footstools, stools, overbed tables)
 *
 * REVERT POINT: 85-before.json (--snapshot, refuses to overwrite) holds the exact
 * state of the PUKANG partner, of the sub-tree categories and of every PUKANG
 * product of the sub-tree (row, fr/en translations, media). --revert writes it
 * back, deletes the created products and the two created sub-categories.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 85-pukang.js <app>:/tmp/85.js
 *   docker cp 85-before.json <app>:/tmp/85-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/85.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/85.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/85.js --revert
 * The pukang-85-*.jpg photos (products/), pukang-85-tile-*.jpg tiles (categories/)
 * and pukang-catalogue-2026.pdf (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "85-before.json");
const BEFORE = SNAPSHOT || !MAIN ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();

const ROOT = "mobilier-et-literie-hospitaliers";
const PUKANG = "8e928e51-8b4a-424d-b0d2-8182411dc002";
const PDF = "/uploads/pdfs/pukang-catalogue-2026.pdf";
const pimg = (n) => `/uploads/products/pukang-85-${n}.jpg`;
const cimg = (n) => `/uploads/categories/pukang-85-tile-${n}.jpg`;
const DB40 = "61f996b0-4ae8-48c9-8e07-facc10b026cb";
const L = (...lines) => lines.filter(Boolean).join("\n");

// existing sub-categories (by slug) + the two created here
const NEWCATS = [
  { id: "c85a0001-0000-4000-8000-000000000001", slug: "pukang-accessoires-lit", fr: "Accessoires de lit", en: "Bed accessories", image: "accessoires-lit", sort: 9 },
  { id: "c85a0001-0000-4000-8000-000000000002", slug: "pukang-mobilier-soins", fr: "Mobilier de soins", en: "Care furniture", image: "mobilier-soins", sort: 10 },
];

// ---------------------------------------------------------------- spec labels
const LAB = {
  ext: ["Dimensions extérieures", "External dimensions"],
  extFold: ["Dimensions extérieures (plié)", "External dimensions (folded)"],
  extUnfold: ["Dimensions extérieures (déplié)", "External dimensions (unfolded)"],
  gc: ["Hauteur du plan de couchage (min.-max.)", "Mattress platform ground clearance (min.-max.)"],
  gc1: ["Hauteur du plan de couchage", "Mattress platform ground clearance"],
  seatGc: ["Hauteur d'assise (min.-max.)", "Seat platform ground clearance (min.-max.)"],
  plat: ["Dimensions du plan de couchage", "Mattress platform dimensions"],
  range: ["Course de réglage en hauteur", "Height adjustable range"],
  sr: ["Hauteur des barrières", "Height of siderail"],
  back: ["Relève-buste", "Backrest"],
  backDown: ["Dossier vers le bas", "Backrest downward"],
  knee: ["Relève-jambes", "Kneerest"],
  lknee: ["Relève-jambe gauche", "Left kneerest"],
  rknee: ["Relève-jambe droit", "Right kneerest"],
  foot: ["Repose-pieds", "Footrest"],
  footDown: ["Repose-pieds vers le bas", "Footrest downward"],
  legDown: ["Repose-jambes vers le bas", "Leg rest downward"],
  tr: ["Trendelenburg", "Trendelenburg"],
  atr: ["Anti-Trendelenburg", "Anti-Trendelenburg"],
  lat: ["Inclinaison latérale", "Lateral tilt"],
  seg: ["Segments verticaux", "Vertical segments"],
  upright: ["Angle de verticalisation", "Upright angle"],
  extLen: ["Extension de longueur du lit", "Bed-length extension"],
  mat: ["Dimensions du matelas", "Mattress dimensions"],
  matLen: ["Longueur totale du matelas", "Overall mattress length"],
  matW: ["Largeur du matelas", "Mattress width"],
  matT: ["Épaisseur du matelas (dos + assise)", "Mattress thickness (back + seat)"],
  matTLeg: ["Épaisseur du matelas (jambes)", "Mattress thickness (leg)"],
  frame: ["Hauteur du cadre orthopédique", "Height of orthopaedic frame"],
  latTrans: ["Translation latérale", "Lateral translation"],
  height: ["Hauteur", "Height"],
  hadj: ["Réglage en hauteur", "Height adjustment"],
  bassinet: ["Inclinaison du berceau (anti-Trendelenburg)", "Bassinet ATR tilt"],
  armH: ["Hauteur des accoudoirs", "Height of armrests"],
  armAdj: ["Réglage des accoudoirs en hauteur", "Armrest height adjustment"],
  armLR: ["Réglage gauche/droite des accoudoirs", "Armrest left/right adjustment"],
  worktop: ["Dimensions du plan de travail", "Worktop dimensions"],
  base: ["Dimensions de la base", "Base dimensions"],
  monitor: ["Taille d'écran compatible", "Compatible monitor size"],
  mTilt: ["Inclinaison de l'écran", "Monitor tilt"],
  mSwivel: ["Pivotement de l'écran", "Monitor swivel"],
  mRot: ["Rotation de l'écran", "Monitor rotation"],
  wtAdj: ["Réglage en hauteur du plan de travail", "Worktop height adjustment"],
  medUnit: ["Dimensions des modules à médicaments", "Medication unit dimensions"],
  drS: ["Tiroir de rangement (petit)", "Storage drawer (small)"],
  drB: ["Tiroir de rangement (grand)", "Storage drawer (big)"],
  tray: ["Support de plateau", "Tray holder"],
  ivBag: ["Panier à poches de perfusion", "IV bag basket"],
  body: ["Dimensions du corps principal", "Main body dimensions"],
  sideDist: ["Entraxe des barrières", "Siderail centre distance"],
  castor: ["Diamètre des roulettes", "Dia. of castor"],
  castorBig: ["Diamètre des roulettes (grandes)", "Dia. of castor (big)"],
  castorSmall: ["Diamètre des roulettes (petites)", "Dia. of castor (small)"],
  castorDir: ["Diamètre de la roulette directionnelle", "Dia. of directional driving castor"],
  swl: ["Charge maximale d'utilisation", "Safe working load"],
};
// spec = [key, value] (value string, or [fr, en]) or ["#", fr, en] for a free line
function fiche(spec, lang) {
  const i = lang === "fr" ? 0 : 1;
  return spec.map((s) => {
    if (s[0] === "#") return s[1 + i];
    const v = Array.isArray(s[1]) ? s[1][i] : s[1];
    const lab = LAB[s[0]];
    if (!lab) throw new Error(`unknown label ${s[0]}`);
    return `${lab[i]} : ${v}`.replace(" : ", lang === "fr" ? " : " : ": ");
  }).join("\n");
}
const D = (l, w, h) => (h ? `L${l} x l${w} x H${h} mm` : `L${l} x l${w} mm`);
const DE = (l, w, h) => (h ? `L${l} x W${w} x H${h} mm` : `L${l} x W${w} mm`);
const dim = (l, w, h) => [D(l, w, h), DE(l, w, h)];
const mm = (v) => `${v} mm`;
const kg = (v) => `${v} kg`;
const pm = (a, t = 5) => `${a} (±${t}°)`;
const POS3 = ["3 positions : 0°, 26°, 52°", "3 positions: 0°, 26°, 52°"];

// standard bed blocks
const bedBase = (o) => [
  ["ext", dim(o.L, o.W)],
  [o.gc && o.gc.includes("-") ? "gc" : "gc1", mm(o.gc)],
  o.plat && ["plat", dim(o.plat[0], o.plat[1])],
  o.range && ["range", mm(o.range)],
  o.sr && ["sr", mm(o.sr)],
  o.back && ["back", o.back],
  o.knee && ["knee", o.knee],
].filter(Boolean);
const tail = (o) => [
  o.castor && ["castor", mm(o.castor)],
  o.swl && ["swl", kg(o.swl)],
].filter(Boolean);

// ---------------------------------------------------------------- products
const pid = (n) => `d85a0001-0000-4000-8000-${String(n).padStart(12, "0")}`;
const C = {
  lit: "literie-hospitaliere", ped: "equipement-pediatrique", bra: "brancards", tab: "tables-medicales",
  mob: "mobilite-et-soutien", cha: "chariots", arm: "armoires-et-rangement", fau: "fauteuils-patients",
  acc: "pukang-accessoires-lit", soin: "pukang-mobilier-soins",
};

const P = []; // filled below
let n = 0;
function add(p) { n += 1; P.push({ id: pid(n), ...p }); }

// ===== Lits électriques (literie-hospitaliere) ==========================
const EL_FR = "Lit d'hôpital électrique PUKANG";
const EL_EN = "PUKANG electric hospital bed";
add({ ref: "DA-91", slug: "pukang-lit-electrique-da-91", cat: C.lit, img: ["da-91"],
  fr: { nom: "Lit électrique DA-91", description: `${EL_FR} haut de gamme de soins intensifs à 6 moteurs linéaires, avec pèse-personne intégré, panneaux de commande sur les barrières et écran tactile, et système de matelas à air piloté par le lit (compresseurs et soufflerie). Fonctions : relève-buste, relève-jambes, repose-pieds, hauteur variable, Trendelenburg et anti-Trendelenburg (dont Trendelenburg progressif à une touche), extension de longueur, position fauteuil, position de sortie du lit, plicature automatique, RCP électrique et RCP au pied, commande au pied, alarme de sortie de lit à trois niveaux, alarme frein non serré, éclairage nocturne, freinage centralisé, appel infirmière en option. Modes du matelas à air : retournement latéral gauche/droite, rotation latérale continue (CLRT), percussion et vibration, microclimat, déflation de la zone du bassin, mode confort, sommeil et gonflage maximal.` },
  en: { nom: "Electric bed DA-91", description: `High-end ${EL_EN} for intensive care with 6 linear motors, integrated weight scale, siderail control panels and touchscreen, and a bed-driven air mattress system (air compressors and blower). Functions: backrest, kneerest, footrest, height adjustment, Trendelenburg and anti-Trendelenburg (including one-button gradual Trendelenburg), bed-length extension, chair position, bed exit position, auto contour, electric CPR and foot CPR, foot controller, three-level bed exit alarm, brake-not-set alarm, night light, central braking, optional nurse call. Air mattress modes: left/right lateral turning, continuous lateral rotation (CLRT), percussion and vibration, microclimate, hip section deflation, comfort, sleep and maximum inflation.` },
  spec: [...bedBase({ L: 2240, W: 1030, gc: "420-890", plat: [1870, 855], range: 470, sr: 435, back: "0-70° (+2°, -5°)", knee: pm("0-30°", 3) }),
    ["foot", pm("0-70°", 3)], ["atr", "≥ 13°"], ["tr", "≥ 12°"], ["extLen", mm(255)], ["mat", dim(2150, 920, 210)], ...tail({ castor: 150, swl: 250 })] });
add({ ref: "DA-71", slug: "pukang-lit-electrique-da-71", cat: C.lit, img: ["da-71"],
  fr: { nom: "Lit électrique DA-71", description: `${EL_FR} de soins intensifs sur 2 moteurs à colonne et 2 moteurs linéaires, avec pèse-personne et alarme de sortie de lit. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, radiographie (support de cassette), double plicature anti-glissement, RCP manuelle et électrique, extension de longueur, plan de couchage amovible, anti-recul de la section genoux, indicateurs d'angle, position fauteuil, position de sortie du lit, verrouillage des fonctions, affichage batterie, éclairage nocturne, freinage centralisé. Livré avec panneau infirmière, commandes intérieures et extérieures sur les barrières, 3e barrière et plan de couchage rallongé.` },
  en: { nom: "Electric bed DA-71", description: `${EL_EN} for intensive care on 2 column motors and 2 linear motors, with weight scale and bed exit alarm. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, X-ray (cassette holder), double auto-regression, manual and electric CPR, bed-length extension, detachable mattress platform, knee-section anti-reverse, angle indicators, chair position, bed exit position, function lock, battery display, night light, central braking. Supplied with nurse control panel, inner and outer siderail control panels, 3rd siderail and extended mattress platform.` },
  spec: [...bedBase({ L: 2235, W: 1050, gc: "480-880", plat: [1965, 920], sr: 440, back: pm("0-70°"), knee: pm("0-30°") }),
    ["tr", "≥ 12°"], ["atr", "≥ 12°"], ["extLen", mm(220)], ...tail({ castor: 150, swl: 260 })] });
add({ ref: "DA-72", slug: "pukang-lit-electrique-da-72", cat: C.lit, img: ["da-72"],
  fr: { nom: "Lit électrique DA-72", description: `${EL_FR} sur 2 moteurs à colonne et 2 moteurs linéaires, avec repose-pieds inclinable vers le bas pour la position fauteuil. Fonctions : relève-buste, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, repose-pieds, radiographie, plicature anti-glissement, RCP manuelle et électrique, indicateurs d'angle, position fauteuil, position de sortie du lit, verrouillage des fonctions, affichage batterie, éclairage nocturne, freinage centralisé. Livré avec panneau infirmière, commandes intérieures et extérieures sur les barrières et support de cassette radiographique.` },
  en: { nom: "Electric bed DA-72", description: `${EL_EN} on 2 column motors and 2 linear motors, with a footrest that tilts downward for the chair position. Functions: backrest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, footrest, X-ray, back auto-regression, manual and electric CPR, angle indicators, chair position, bed exit position, function lock, battery display, night light, central braking. Supplied with nurse control panel, inner and outer siderail control panels and X-ray cassette holder.` },
  spec: [...bedBase({ L: 2270, W: 1050, gc: "480-880", plat: [1945, 900], sr: 370, back: pm("0-70°") }),
    ["footDown", pm("0-60°")], ["tr", "≥ 12°"], ["atr", "≥ 12°"], ...tail({ castor: 125, swl: 260 })] });
const DA2X_FR = "Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, radiographie, RCP manuelle et électrique, position fauteuil, position de sortie du lit, extension de longueur, plan de couchage amovible, plicature anti-glissement, anti-recul de la section genoux, indicateurs d'angle, verrouillage des fonctions, affichage batterie, éclairage nocturne, freinage centralisé.";
const DA2X_EN = "Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, X-ray, manual and electric CPR, chair position, bed exit position, bed-length extension, detachable mattress platform, back auto-regression, knee-section anti-reverse, angle indicators, function lock, battery display, night light, central braking.";
add({ ref: "DA-21", slug: "pukang-lit-electrique-da-21", cat: C.lit, img: ["da-21"],
  fr: { nom: "Lit électrique DA-21", description: `${EL_FR} à 4 moteurs linéaires, avec panneau infirmière, commandes intérieures et extérieures sur les barrières et batterie. ${DA2X_FR}` },
  en: { nom: "Electric bed DA-21", description: `${EL_EN} with 4 linear motors, nurse control panel, inner and outer siderail control panels and battery. ${DA2X_EN}` },
  spec: [...bedBase({ L: 2200, W: 1035, gc: "465-800", plat: [1925, 900], sr: 370, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ["extLen", mm(220)], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-22", slug: "pukang-lit-electrique-da-22", cat: C.lit, img: ["da-22"],
  fr: { nom: "Lit électrique DA-22", description: `${EL_FR} à 4 moteurs linéaires, avec pèse-personne et alarme de sortie de lit, panneau infirmière et commandes sur les barrières. ${DA2X_FR}` },
  en: { nom: "Electric bed DA-22", description: `${EL_EN} with 4 linear motors, weight scale and bed exit alarm, nurse control panel and siderail controls. ${DA2X_EN}` },
  spec: [...bedBase({ L: 2200, W: 1040, gc: "475-725", plat: [1925, 900], sr: 370, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ["extLen", mm(220)], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-23", slug: "pukang-lit-electrique-da-23", cat: C.lit, img: ["da-23"],
  fr: { nom: "Lit électrique DA-23", description: `${EL_FR} à 5 moteurs linéaires avec inclinaison latérale (≥ 30°) et barrières en 3 segments, pèse-personne en option et alarme de sortie de lit. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, inclinaison latérale, RCP électrique et manuelle, position fauteuil, position de sortie du lit, double plicature anti-glissement, verrouillage des fonctions, affichage batterie, éclairage nocturne, indicateurs d'angle, freinage centralisé.` },
  en: { nom: "Electric bed DA-23", description: `${EL_EN} with 5 linear motors, lateral tilt (≥ 30°) and 3-segment siderails, optional weight scale and bed exit alarm. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, lateral tilt, electric and manual CPR, chair position, bed exit position, double auto-regression, function lock, battery display, night light, angle indicators, central braking.` },
  spec: [...bedBase({ L: 2215, W: 1050, gc: "540-835", plat: [1915, 895], sr: 345, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ["lat", "≥ 30°"], ["seg", ["3 segments", "3 segments"]], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-24", slug: "pukang-lit-electrique-da-24", cat: C.lit, img: ["da-24"],
  fr: { nom: "Lit électrique DA-24", description: `${EL_FR} à 4 moteurs linéaires avec télécommande, têtes de lit ABS et barrières latérales en aluminium. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, RCP manuelle, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Electric bed DA-24", description: `${EL_EN} with 4 linear motors and remote control, ABS head/foot boards and aluminium siderails. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, manual CPR, central braking, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2100, W: 990, gc: "410-710", plat: [1900, 900], sr: 360, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-25", slug: "pukang-lit-electrique-da-25", cat: C.lit, img: ["da-25"],
  fr: { nom: "Lit électrique DA-25", description: `${EL_FR} à 4 moteurs linéaires avec télécommande et barrières latérales ABS. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, RCP manuelle, indicateurs d'angle du dossier et de Trendelenburg, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Electric bed DA-25", description: `${EL_EN} with 4 linear motors, remote control and ABS siderails. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, manual CPR, backrest and TR/ATR angle indicators, central braking, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2100, W: 990, gc: "410-710", plat: [1900, 900], sr: 370, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-26", slug: "pukang-lit-electrique-verticalisateur-da-26", cat: C.lit, img: ["da-26"],
  fr: { nom: "Lit électrique verticalisateur DA-26", description: `${EL_FR} à 6 moteurs linéaires qui amène le patient de la position allongée à la position debout (angle de verticalisation 80°), avec appui de verticalisation, sangles de maintien et pèse-personne en option. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, fonction verticale/à plat, RCP électrique et manuelle, position fauteuil, position de sortie du lit, verrouillage des fonctions, affichage batterie, éclairage nocturne, indicateurs d'angle, freinage centralisé.` },
  en: { nom: "Electric standing bed DA-26", description: `${EL_EN} with 6 linear motors that brings the patient from lying to standing (upright angle 80°), with standing support shelf, fasten belts and optional weight scale. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, upright/flat function, electric and manual CPR, chair position, bed exit position, function lock, battery display, night light, angle indicators, central braking.` },
  spec: [...bedBase({ L: 2210, W: 1055, gc: "530-830", plat: [1960, 900], sr: 370, back: pm("0-70°"), knee: pm("0-25°") }),
    ["atr", "≥ 12°"], ["tr", "≥ 12°"], ["upright", "80°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-32", slug: "pukang-lit-electrique-da-32", cat: C.lit, img: ["da-32"],
  fr: { nom: "Lit électrique DA-32", description: `${EL_FR} à 3 moteurs linéaires avec télécommande, têtes de lit ABS et barrières latérales en aluminium. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, RCP électrique, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Electric bed DA-32", description: `${EL_EN} with 3 linear motors and remote control, ABS head/foot boards and aluminium siderails. Functions: backrest, kneerest, auto contour, height adjustment, electric CPR, central braking, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2180, W: 990, gc: "310-690", plat: [1960, 900], sr: 400, back: pm("0-72°"), knee: pm("0-30°") }), ...tail({ castor: 125, swl: 260 })] });
add({ ref: "DA-12", slug: "pukang-lit-electrique-da-12", cat: C.lit, img: ["da-12"],
  fr: { nom: "Lit électrique DA-12", description: `${EL_FR} à 2 moteurs linéaires avec télécommande et barrières latérales ABS. Fonctions : relève-buste, relève-jambes, plicature automatique, indicateurs d'angle, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Electric bed DA-12", description: `${EL_EN} with 2 linear motors, remote control and ABS siderails. Functions: backrest, kneerest, auto contour, angle indicators, central braking, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2180, W: 1040, gc: "500", plat: [1960, 900], sr: 370, back: pm("0-70°"), knee: pm("0-25°") }), ...tail({ castor: 125, swl: 260 })] });

// ===== Lits manuels =====================================================
const MAN_FR = "Lit d'hôpital manuel PUKANG à manivelles (vis-mères avec protection contre la surcharge)";
const MAN_EN = "PUKANG manual hospital bed with cranks (leading screws with overload protection)";
add({ ref: "S-2", slug: "pukang-lit-manuel-s-2", cat: C.lit, img: ["s-2"],
  fr: { nom: "Lit manuel S-2", description: `${MAN_FR}, 3 manivelles et sélecteur Trendelenburg/anti-Trendelenburg/hauteur, barrières latérales en aluminium. Fonctions : relève-buste, relève-jambes, repose-pieds, hauteur variable, Trendelenburg et anti-Trendelenburg, frein individuel, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed S-2", description: `${MAN_EN}, 3 cranks and TR/ATR/height adjustment switch, aluminium siderails. Functions: backrest, kneerest, footrest, height adjustment, Trendelenburg and anti-Trendelenburg, individual brake, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2100, W: 990, gc: "510-790", plat: [1900, 900], sr: 375, back: pm("0-75°"), knee: pm("0-45°") }), ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "S-3", slug: "pukang-lit-manuel-s-3", cat: C.lit, img: ["s-3"],
  fr: { nom: "Lit manuel S-3", description: `${MAN_FR}, 3 manivelles, barrières latérales ABS et pédale de freinage centralisé ABS. Fonctions : relève-buste, relève-jambes, repose-pieds, hauteur variable, Trendelenburg et anti-Trendelenburg, indicateurs d'angle du dossier et de Trendelenburg, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed S-3", description: `${MAN_EN}, 3 cranks, ABS siderails and ABS central braking pedal. Functions: backrest, kneerest, footrest, height adjustment, Trendelenburg and anti-Trendelenburg, back and TR/ATR angle indicators, central braking, IV pole holes, roller bumpers.` },
  spec: [...bedBase({ L: 2100, W: 990, gc: "510-790", plat: [1900, 900], sr: 370, back: pm("0-75°"), knee: pm("0-45°") }), ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "S-4", slug: "pukang-lit-hydraulique-s-4", cat: C.lit, img: ["s-4"],
  fr: { nom: "Lit hydraulique S-4", description: "Lit d'hôpital PUKANG à système hydraulique et vérins à gaz, barrières latérales en aluminium et freinage centralisé ABS. Fonctions : relève-buste, relève-jambes, hauteur variable, Trendelenburg et anti-Trendelenburg, extension de longueur, freinage centralisé, tablette à linge, sangles, butée de matelas, indicateur d'angle du dossier, orifice universel pour potence de perfusion ou perroquet, pare-chocs." },
  en: { nom: "Hydraulic bed S-4", description: "PUKANG hospital bed with hydraulic system and gas springs, aluminium siderails and ABS central braking. Functions: backrest, kneerest, height adjustment, Trendelenburg and anti-Trendelenburg, bed-length extension, central braking, linen shelf, belt holder, mattress restrictor, back angle indicator, universal hole for IV pole or lifting pole, roller bumpers." },
  spec: [...bedBase({ L: 2210, W: 980, gc: "465-820", plat: [1900, 900], sr: 405, back: pm("0-70°"), knee: pm("0-40°") }),
    ["tr", pm("0-17°", 3)], ["atr", pm("0-19°", 3)], ["extLen", mm(200)], ...tail({ castor: 125, swl: 250 })] });
add({ ref: "A-1", slug: "pukang-lit-manuel-a-1", cat: C.lit, img: ["a-1-c3", "a-1-a1", "a-1-c1"],
  fr: { nom: "Lit manuel A-1 (A1 / C1 / C3)", description: `${MAN_FR}, 3 manivelles, têtes de lit et barrières ABS, pédale de freinage centralisé ABS. Trois versions : A1 et C1 (barrières de 370 mm, indicateur d'angle du dossier ; A1 en largeur 1020 mm) et C3 (barrières de 340 mm). Fonctions : relève-buste, relève-jambes, repose-pieds, hauteur variable, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed A-1 (A1 / C1 / C3)", description: `${MAN_EN}, 3 cranks, ABS head/foot boards and siderails, ABS central braking pedal. Three versions: A1 and C1 (370 mm siderails, backrest angle indicator; A1 is 1020 mm wide) and C3 (340 mm siderails). Functions: backrest, kneerest, footrest, height adjustment, central braking, IV pole holes, roller bumpers.` },
  spec: [["ext", ["L2180 x l1020 mm (A1) ; L2180 x l990 mm (C1, C3)", "L2180 x W1020 mm (A1); L2180 x W990 mm (C1, C3)"]], ["gc", mm("490-690")], ["plat", dim(1960, 900)],
    ["sr", ["370 mm (A1, C1) ; 340 mm (C3)", "370 mm (A1, C1); 340 mm (C3)"]], ["back", pm("0-75°")], ["knee", pm("0-45°")], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "B-6", slug: "pukang-lit-manuel-b-6", cat: C.lit, img: ["b-6-a1", "b-6-c1", "b-6-c3"],
  fr: { nom: "Lit manuel B-6 (A1 / C1 / C3)", description: `${MAN_FR}, 2 manivelles, têtes de lit et barrières ABS, pédale de freinage centralisé ABS. Trois versions : A1 et C1 (barrières de 370 mm, indicateur d'angle du dossier ; A1 en largeur 1020 mm) et C3 (barrières de 340 mm). Fonctions : relève-buste, relève-jambes, repose-pieds, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed B-6 (A1 / C1 / C3)", description: `${MAN_EN}, 2 cranks, ABS head/foot boards and siderails, ABS central braking pedal. Three versions: A1 and C1 (370 mm siderails, backrest angle indicator; A1 is 1020 mm wide) and C3 (340 mm siderails). Functions: backrest, kneerest, footrest, central braking, IV pole holes, roller bumpers.` },
  spec: [["ext", ["L2180 x l1020 mm (A1) ; L2180 x l990 mm (C1, C3)", "L2180 x W1020 mm (A1); L2180 x W990 mm (C1, C3)"]], ["gc1", mm(500)], ["plat", dim(1960, 900)],
    ["sr", ["370 mm (A1, C1) ; 340 mm (C3)", "370 mm (A1, C1); 340 mm (C3)"]], ["back", pm("0-75°")], ["knee", pm("0-45°")], ...tail({ castor: 125, swl: 260 })] });
const B1X = (L_, sr, extra) => [...bedBase({ L: L_, W: 980, gc: "500", plat: [L_ === 2190 ? 1960 : 1900, 900], sr, back: pm("0-75°"), knee: extra === "noknee" ? null : pm("0-45°") }), ...tail({ castor: 125, swl: 260 })];
add({ ref: "B-10", slug: "pukang-lit-manuel-b-10", cat: C.lit, img: ["b-10"],
  fr: { nom: "Lit manuel B-10", description: `${MAN_FR}, 2 manivelles, barrières latérales en aluminium et pédale de freinage centralisé ABS. Fonctions : relève-buste, relève-jambes, repose-pieds, freinage centralisé, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed B-10", description: `${MAN_EN}, 2 cranks, aluminium siderails and ABS central braking pedal. Functions: backrest, kneerest, footrest, central braking, IV pole holes, roller bumpers.` },
  spec: B1X(2190, 355) });
add({ ref: "B-11", slug: "pukang-lit-manuel-b-11", cat: C.lit, img: ["b-11"],
  fr: { nom: "Lit manuel B-11", description: `${MAN_FR}, 2 manivelles, barrières latérales en aluminium et roulettes à frein individuel. Fonctions : relève-buste, relève-jambes, frein individuel, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed B-11", description: `${MAN_EN}, 2 cranks, aluminium siderails and individual brake castors. Functions: backrest, kneerest, individual brake, IV pole holes, roller bumpers.` },
  spec: B1X(2110, 355) });
add({ ref: "B-12", slug: "pukang-lit-manuel-b-12", cat: C.lit, img: ["b-12"],
  fr: { nom: "Lit manuel B-12", description: `${MAN_FR}, 2 manivelles, barrières latérales en aluminium, tablette repas pliante et roulettes à frein individuel. Fonctions : relève-buste, relève-jambes, repose-pieds, tablette repas pliante, frein individuel, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed B-12", description: `${MAN_EN}, 2 cranks, aluminium siderails, foldable dining table and individual brake castors. Functions: backrest, kneerest, footrest, foldable dining table, individual brake, IV pole holes, roller bumpers.` },
  spec: (() => { const s = B1X(2110, 355); s[0] = ["ext", dim(2170, 980)]; return s; })() });
add({ ref: "B-21-1", slug: "pukang-lit-manuel-b-21-1", cat: C.lit, img: ["b-21-1"],
  fr: { nom: "Lit manuel B-21-1", description: `${MAN_FR}, 1 manivelle (relève-buste), barrières latérales en aluminium et roulettes à frein individuel. Fonctions : relève-buste, frein individuel, trous pour potence, pare-chocs.` },
  en: { nom: "Manual bed B-21-1", description: `${MAN_EN}, 1 crank (backrest), aluminium siderails and individual brake castors. Functions: backrest, individual brake, IV pole holes, roller bumpers.` },
  spec: B1X(2110, 355, "noknee") });
const B3X = (back) => [["ext", dim(2030, 900)], ["gc1", mm(530)], ["plat", dim(1900, 900)], back && ["back", pm("0-75°")], ["swl", kg(260)]].filter(Boolean);
add({ ref: "B-31", slug: "pukang-lit-manuel-b-31", cat: C.lit, img: ["b-31"],
  fr: { nom: "Lit manuel B-31", description: "Lit d'hôpital PUKANG simple à une manivelle (relève-buste, vis-mère avec protection contre la surcharge), structure en acier peint sur pieds. Trous pour potence de perfusion et trous de fixation de barrières, 2 crochets de drainage." },
  en: { nom: "Manual bed B-31", description: "Simple PUKANG hospital bed with one crank (backrest, leading screw with overload protection), painted steel frame on legs. IV pole holes and siderail installation holes, 2 drainage hooks." },
  spec: B3X(true) });
add({ ref: "B-32", slug: "pukang-lit-manuel-b-32", cat: C.lit, img: ["b-32"],
  fr: { nom: "Lit manuel B-32", description: "Lit d'hôpital PUKANG simple à une manivelle (relève-buste, vis-mère avec protection contre la surcharge), têtes de lit en acier inoxydable, sur pieds. Trous pour potence de perfusion et trous de fixation de barrières, 2 crochets de drainage." },
  en: { nom: "Manual bed B-32", description: "Simple PUKANG hospital bed with one crank (backrest, leading screw with overload protection), stainless steel head/foot boards, on legs. IV pole holes and siderail installation holes, 2 drainage hooks." },
  spec: B3X(true) });
add({ ref: "B-33", slug: "pukang-lit-plat-b-33", cat: C.lit, img: ["b-33"],
  fr: { nom: "Lit plat B-33", description: "Lit d'hôpital PUKANG plat (sans relève-buste), têtes de lit en acier inoxydable, sur pieds. Trous pour potence de perfusion et trous de fixation de barrières, 2 crochets de drainage." },
  en: { nom: "Flat bed B-33", description: "Flat PUKANG hospital bed (no backrest), stainless steel head/foot boards, on legs. IV pole holes and siderail installation holes, 2 drainage hooks." },
  spec: B3X(false) });
add({ ref: "B-34", slug: "pukang-lit-plat-b-34", cat: C.lit, img: ["b-34"],
  fr: { nom: "Lit plat B-34", description: "Lit d'hôpital PUKANG plat (sans relève-buste), structure en acier peint, sur pieds. Trous pour potence de perfusion et trous de fixation de barrières, 2 crochets de drainage." },
  en: { nom: "Flat bed B-34", description: "Flat PUKANG hospital bed (no backrest), painted steel frame, on legs. IV pole holes and siderail installation holes, 2 drainage hooks." },
  spec: B3X(false) });

// ===== Lits orthopédiques ================================================
add({ ref: "C-4", slug: "pukang-lit-orthopedique-c-4", cat: C.lit, img: ["c-4"],
  fr: { nom: "Lit orthopédique C-4", description: "Lit d'hôpital orthopédique PUKANG à 4 manivelles (vis-mères avec protection contre la surcharge) et cadre de traction orthopédique. Fonctions : relève-buste, relève-jambe gauche et droit indépendants, repose-pieds, Trendelenburg et anti-Trendelenburg, traction, frein individuel, trous pour potence, pare-chocs." },
  en: { nom: "Orthopaedic bed C-4", description: "PUKANG orthopaedic hospital bed with 4 cranks (leading screws with overload protection) and orthopaedic traction frame. Functions: backrest, independent left and right kneerest, footrest, Trendelenburg and anti-Trendelenburg, traction, individual brake, IV pole holes, roller bumpers." },
  spec: [["ext", dim(2170, 980)], ["gc1", mm(520)], ["frame", mm(1840)], ["plat", dim(1900, 900)], ["sr", mm(355)], ["back", pm("0-75°")], ["lknee", pm("0-45°")], ["rknee", pm("0-45°")], ["atr", "≥ 3°"], ["tr", "≥ 3°"], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "C-5", slug: "pukang-lit-orthopedique-c-5", cat: C.lit, img: ["c-5"],
  fr: { nom: "Lit orthopédique C-5", description: "Lit d'hôpital orthopédique PUKANG à 2 manivelles (vis-mères avec protection contre la surcharge) et cadre de traction orthopédique. Fonctions : relève-buste, relève-jambes, repose-pieds, traction, frein individuel, trous pour potence, pare-chocs." },
  en: { nom: "Orthopaedic bed C-5", description: "PUKANG orthopaedic hospital bed with 2 cranks (leading screws with overload protection) and orthopaedic traction frame. Functions: backrest, kneerest, footrest, traction, individual brake, IV pole holes, roller bumpers." },
  spec: [["ext", dim(2200, 980)], ["gc1", mm(500)], ["plat", dim(1900, 900)], ["frame", mm(2040)], ["sr", mm(350)], ["back", pm("0-75°")], ["knee", pm("0-45°")], ...tail({ castor: 125, swl: 260 })] });

// ===== Lits d'accouchement / gynécologiques ===============================
const GY_FR = "Lit d'examen gynécologique et d'accouchement PUKANG, structure en acier inoxydable, dossier sur vérin à gaz, repose-jambes réglable vers le bas en 3 positions, porte-jambes réglables en hauteur, matelas mousse, bassin en acier inoxydable et 2 poignées.";
const GY_EN = "PUKANG gynaecological examination and delivery bed, stainless steel frame, gas-spring backrest, leg rest adjustable downward in 3 positions, height-adjustable leg holders, foam mattress, stainless steel basin and 2 handrails.";
const GY = (w) => [["ext", dim(1680, w)], ["gc1", mm(810)], ["plat", dim(1680, 600)], ["back", pm("0-55°")], ["legDown", POS3], ["swl", kg(170)]];
add({ ref: "B-42", slug: "pukang-lit-accouchement-b-42", cat: C.lit, img: ["b-42"],
  fr: { nom: "Lit d'accouchement B-42", description: GY_FR }, en: { nom: "Delivery bed B-42", description: GY_EN }, spec: GY(780) });
add({ ref: "B-43", slug: "pukang-lit-accouchement-b-43", cat: C.lit, img: ["b-43"],
  fr: { nom: "Lit d'accouchement B-43", description: GY_FR }, en: { nom: "Delivery bed B-43", description: GY_EN }, spec: GY(720) });
add({ ref: "B-47", slug: "pukang-lit-accouchement-b-47", cat: C.lit, img: ["b-47"],
  fr: { nom: "Lit d'accouchement B-47", description: "Lit d'accouchement PUKANG à pompe hydraulique et vérins à gaz, structure en acier inoxydable, section pieds amovible et escamotable. Fonctions : relève-buste, hauteur variable, réglage en hauteur de la section pieds, Trendelenburg et anti-Trendelenburg, RCP manuelle, verrouillage des fonctions, poignées réglables, freinage centralisé et frein individuel, trous pour potence, pare-chocs. Livré avec porte-jambes, bassin et matelas." },
  en: { nom: "Delivery bed B-47", description: "PUKANG delivery bed with hydraulic pump and gas springs, stainless steel frame, removable and hidden foot section. Functions: backrest, height adjustment, foot section height adjustment, Trendelenburg and anti-Trendelenburg, manual CPR, function lock, adjustable handrails, central braking and individual brake, IV pole holes, roller bumpers. Supplied with leg holders, basin and mattress." },
  spec: [["ext", dim(2240, 1020)], ["gc", mm("650-850")], ["plat", dim(2030, 940)], ["sr", mm(340)], ["matLen", mm(2040)], ["matW", mm(920)], ["matT", mm("90/120")], ["matTLeg", mm(150)], ["back", pm("60°")], ["atr", "≥ 10°"], ["tr", "≥ 5°"], ...tail({ castor: 125, swl: 200 })] });

// ===== Matelas (literie) =================================================
add({ ref: "H-2", slug: "pukang-matelas-2-sections-h-2", cat: C.lit, img: ["h-2"],
  fr: { nom: "Matelas 2 sections H-2", description: "Matelas d'hôpital PUKANG en deux sections, pour lits médicaux à relève-buste." },
  en: { nom: "2-section mattress H-2", description: "PUKANG two-section hospital mattress, for medical beds with backrest." },
  spec: [["ext", dim(1970, 900, 80)]] });
add({ ref: "H-4", slug: "pukang-matelas-jambes-separees-h-4", cat: C.lit, img: ["h-4"],
  fr: { nom: "Matelas à jambes séparées H-4", description: "Matelas d'hôpital PUKANG à section jambes séparée (split-leg), pour lits à relève-buste et relève-jambes." },
  en: { nom: "Split-leg mattress H-4", description: "PUKANG split-leg hospital mattress, for beds with backrest and kneerest." },
  spec: [["ext", dim(1970, 900, 80)]] });
add({ ref: "PUKANG-MATELAS-RETOURNEMENT", slug: "pukang-matelas-lit-retournement-lateral", cat: C.lit, img: ["pk-lateral-mattress"],
  fr: { nom: "Matelas pour lit à retournement latéral", description: "Matelas PUKANG multi-sections destiné aux lits à retournement latéral du patient." },
  en: { nom: "Mattress for lateral turning bed", description: "PUKANG multi-section mattress for lateral turning beds." },
  spec: [["ext", dim(1970, 900, 80)]] });
add({ ref: "H-13", slug: "pukang-matelas-haute-resilience-memoire-h-13", cat: C.lit, img: ["h-13"],
  fr: { nom: "Matelas haute résilience et mousse à mémoire H-13", description: "Matelas d'hôpital PUKANG en mousse haute résilience et mousse à mémoire de forme, disponible en trois épaisseurs (100, 120 ou 140 mm)." },
  en: { nom: "High resilience and memory sponge mattress H-13", description: "PUKANG hospital mattress in high resilience sponge and memory sponge, available in three thicknesses (100, 120 or 140 mm)." },
  spec: [["ext", ["L1970 x l900 x H100/120/140 mm", "L1970 x W900 x H100/120/140 mm"]]] });
add({ ref: "H-15", slug: "pukang-matelas-anti-escarres-statique-h-15", cat: C.lit, img: ["h-15"],
  fr: { nom: "Matelas anti-escarres non motorisé H-15", description: "Matelas anti-escarres PUKANG sans moteur (statique), disponible en trois épaisseurs (100, 120 ou 140 mm)." },
  en: { nom: "Non-powered anti-decubitus mattress H-15", description: "PUKANG non-powered (static) anti-decubitus mattress, available in three thicknesses (100, 120 or 140 mm)." },
  spec: [["ext", ["L1970 x l900 x H100/120/140 mm", "L1970 x W900 x H100/120/140 mm"]]] });
add({ ref: "PUKANG-MATELAS-ANTI-ESCARRES", slug: "pukang-matelas-anti-escarres-air", cat: C.lit, img: ["pk-ad-2", "pk-ad-3"],
  fr: { nom: "Matelas anti-escarres à air (2 ou 3 canaux)", description: "Matelas anti-escarres PUKANG à cellules d'air alternées, en version 2 canaux (hauteur 95 mm) ou 3 canaux (hauteur 110 mm)." },
  en: { nom: "Anti-decubitus air mattress (2 or 3 channels)", description: "PUKANG anti-decubitus mattress with alternating air cells, in a 2-channel (95 mm high) or 3-channel (110 mm high) version." },
  spec: [["ext", ["2 canaux : L2000 x l860 x H95 mm ; 3 canaux : L2000 x l860 x H110 mm", "2 channels: L2000 x W860 x H95 mm; 3 channels: L2000 x W860 x H110 mm"]]] });
add({ ref: "H-5", slug: "pukang-matelas-brancard-h-5", cat: C.lit, img: ["h-5"],
  fr: { nom: "Matelas de brancard H-5", description: "Matelas de brancard PUKANG avec poignées de transport." },
  en: { nom: "Stretcher mattress H-5", description: "PUKANG stretcher mattress with carrying handles." },
  spec: [["ext", dim(1800, 580, 30)]] });
add({ ref: "PUKANG-MATELAS-BRANCARD", slug: "pukang-matelas-brancard", cat: C.lit, img: ["pk-stretcher-mattress"],
  fr: { nom: "Matelas de brancard", description: "Matelas de brancard PUKANG." },
  en: { nom: "Stretcher mattress", description: "PUKANG stretcher mattress." },
  spec: [["ext", dim(1920, 650, 80)]] });

// ===== Pédiatrie ========================================================
add({ ref: "FT-V20", slug: "pukang-lit-enfant-electrique-ft-v20", cat: C.ped, img: ["ft-v20"],
  fr: { nom: "Lit enfant électrique FT-V20", description: "Lit d'hôpital pédiatrique électrique PUKANG à 4 moteurs linéaires, barrières hautes (620 mm), pèse-personne, alarme de sortie de lit et support de cassette radiographique. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, RCP électrique et manuelle, position fauteuil, position de sortie du lit, verrouillage des fonctions, éclairage nocturne, affichage batterie, freinage centralisé (pédale ABS), trous pour potence, pare-chocs." },
  en: { nom: "Electric children bed FT-V20", description: "PUKANG electric paediatric hospital bed with 4 linear motors, high siderails (620 mm), weight scale, bed exit alarm and X-ray cassette. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, electric and manual CPR, chair position, bed exit position, function lock, night light, battery display, central braking (ABS pedal), IV pole holes, roller bumpers." },
  spec: [["ext", dim(1980, 980)], ["gc", mm("445-745")], ["plat", ["1725 x 780 mm", "1725 x 780 mm"]], ["sr", mm(620)], ["back", pm("0-70°")], ["knee", pm("0-30°")], ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 220 })] });
add({ ref: "FT-V10", slug: "pukang-lit-enfant-electrique-ft-v10", cat: C.ped, img: ["ft-v10"],
  fr: { nom: "Lit enfant électrique FT-V10", description: "Lit d'hôpital pédiatrique électrique PUKANG à 4 moteurs linéaires, barrières hautes (620 mm), panneau infirmière et batterie. Fonctions : relève-buste, relève-jambes, plicature automatique, hauteur variable, Trendelenburg et anti-Trendelenburg, RCP électrique et manuelle, position fauteuil, position de sortie du lit, verrouillage des fonctions, éclairage nocturne, affichage batterie, freinage centralisé (pédale ABS), trous pour potence, pare-chocs." },
  en: { nom: "Electric children bed FT-V10", description: "PUKANG electric paediatric hospital bed with 4 linear motors, high siderails (620 mm), nurse control panel and battery. Functions: backrest, kneerest, auto contour, height adjustment, Trendelenburg and anti-Trendelenburg, electric and manual CPR, chair position, bed exit position, function lock, night light, battery display, central braking (ABS pedal), IV pole holes, roller bumpers." },
  spec: [["ext", dim(1945, 980)], ["gc", mm("445-745")], ["plat", ["1725 x 780 mm", "1725 x 780 mm"]], ["sr", mm(620)], ["back", pm("0-70°")], ["knee", pm("0-30°")], ["atr", "≥ 12°"], ["tr", "≥ 12°"], ...tail({ castor: 125, swl: 220 })] });
add({ ref: "B-61", slug: "pukang-lit-enfant-b-61", cat: C.ped, img: ["b-61"],
  fr: { nom: "Lit d'hôpital enfant B-61", description: "Lit d'hôpital pédiatrique manuel PUKANG à 2 manivelles (vis-mères avec protection contre la surcharge), barrières de 395 mm. Fonctions : relève-buste, relève-jambes, freinage centralisé, trous pour potence, pare-chocs." },
  en: { nom: "Children hospital bed B-61", description: "PUKANG manual paediatric hospital bed with 2 cranks (leading screws with overload protection), 395 mm siderails. Functions: backrest, kneerest, central braking, IV pole holes, roller bumpers." },
  spec: [["ext", dim(2125, 975)], ["gc1", mm(500)], ["plat", dim(1900, 820)], ["sr", mm(395)], ["back", pm("0-70°")], ["knee", pm("0-25°")], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "B-62", slug: "pukang-lit-enfant-b-62", cat: C.ped, img: ["b-62"],
  fr: { nom: "Lit d'hôpital enfant B-62", description: "Lit d'hôpital pédiatrique manuel PUKANG à barreaux hauts (560 mm), une manivelle (relève-buste, vis-mère avec protection contre la surcharge), roulettes à frein individuel et trous pour potence." },
  en: { nom: "Children hospital bed B-62", description: "PUKANG manual paediatric hospital cot with high bars (560 mm), one crank (backrest, leading screw with overload protection), individual brake castors and IV pole holes." },
  spec: [["ext", dim(1660, 830)], ["gc1", mm(650)], ["plat", dim(1550, 720)], ["sr", mm(560)], ["back", pm("0-70°")], ...tail({ castor: 100, swl: 100 })] });
add({ ref: "B-63", slug: "pukang-lit-enfant-b-63", cat: C.ped, img: ["b-63"],
  fr: { nom: "Lit d'hôpital enfant B-63", description: "Lit d'hôpital pédiatrique manuel PUKANG en acier inoxydable, une manivelle (relève-buste, vis-mère avec protection contre la surcharge), barrières de 280 mm, roulettes à frein individuel et trous pour potence." },
  en: { nom: "Children hospital bed B-63", description: "PUKANG manual paediatric hospital bed in stainless steel, one crank (backrest, leading screw with overload protection), 280 mm siderails, individual brake castors and IV pole holes." },
  spec: [["ext", dim(1880, 880)], ["gc1", mm(530)], ["plat", dim(1800, 800)], ["sr", mm(280)], ["back", pm("0-70°")], ...tail({ castor: 125, swl: 260 })] });
add({ ref: "B-65", slug: "pukang-lit-enfant-b-65", cat: C.ped, img: ["b-65"],
  fr: { nom: "Lit d'hôpital enfant B-65", description: "Lit d'hôpital pédiatrique manuel PUKANG à barrières hautes (620 mm), 2 manivelles (vis-mères avec protection contre la surcharge) et frein centralisé ABS. Fonctions : relève-buste, relève-jambes, freinage centralisé, trous pour potence, pare-chocs." },
  en: { nom: "Children hospital bed B-65", description: "PUKANG manual paediatric hospital bed with high siderails (620 mm), 2 cranks (leading screws with overload protection) and ABS central brake. Functions: backrest, kneerest, central braking, IV pole holes, roller bumpers." },
  spec: [["ext", dim(1945, 980)], ["gc1", mm(500)], ["plat", dim(1685, 780)], ["sr", mm(620)], ["back", pm("0-70°")], ["knee", pm("0-25°")], ...tail({ castor: 125, swl: 220 })] });
add({ ref: "B-37", slug: "pukang-lit-nourrisson-b-37", cat: C.ped, img: ["b-37"],
  fr: { nom: "Lit pour nourrisson B-37", description: "Berceau d'hôpital PUKANG à bac transparent inclinable (anti-Trendelenburg) sur vérin à gaz, 2 paniers de rangement, matelas et roulettes à frein individuel." },
  en: { nom: "Infant bed B-37", description: "PUKANG hospital infant bed with transparent bassinet tilting (ATR) on gas spring, 2 storage baskets, mattress and individual brake castors." },
  spec: [["ext", dim(850, 510)], ["height", mm(845)], ["bassinet", pm("0-12°", 3)], ...tail({ castor: 100, swl: 20 })] });
add({ ref: "B-38", slug: "pukang-lit-nourrisson-cododo-b-38", cat: C.ped, img: ["b-38"],
  fr: { nom: "Lit pour nourrisson cododo B-38", description: "Berceau PUKANG réglable en hauteur pour se placer au-dessus du lit de la mère (overbed), bac transparent inclinable vers l'avant et en anti-Trendelenburg, levage et inclinaison sur vérins à gaz, compartiment de rangement moulé, poignée de poussée, matelas et roulettes à frein individuel." },
  en: { nom: "Overbed infant bed B-38", description: "Height-adjustable PUKANG overbed infant bed that fits over the mother's bed, transparent bassinet with forward and ATR tilt, gas-spring lifting and tilting, molded storage compartment, push handle, mattress and individual brake castors." },
  spec: [["ext", dim(920, 560)], ["hadj", mm("915-1215")], ["bassinet", pm("0-15°", 3)], ...tail({ castor: 65, swl: 20 })] });
add({ ref: "PUKANG-MATELAS-NOURRISSON", slug: "pukang-matelas-lit-nourrisson", cat: C.ped, img: ["pk-infant-mattress"],
  fr: { nom: "Matelas pour lit de nourrisson", description: "Matelas PUKANG pour berceau d'hôpital (lits de nourrisson B-36, B-37, B-38, B-46)." },
  en: { nom: "Mattress for infant bed", description: "PUKANG mattress for hospital infant beds (B-36, B-37, B-38, B-46 infant beds)." },
  spec: [["ext", dim(760, 410, 40)]] });

// ===== Brancards ========================================================
add({ ref: "E-10", slug: "pukang-brancard-hydraulique-e-10", cat: C.bra, img: ["e-10"],
  fr: { nom: "Brancard hydraulique E-10", description: "Brancard de transfert PUKANG à 2 vérins hydrauliques et levage par vérin à gaz, plateau radiotransparent pour radiographie du corps entier avec support de cassette. Fonctions : relève-buste, relève-jambes, hauteur variable, Trendelenburg et anti-Trendelenburg, roue directionnelle (5e roue), freinage centralisé, protection contre la surcharge, potence, tablette à instruments, poignées de poussée repliables, pare-chocs et bandes de protection, matelas." },
  en: { nom: "Hydraulic stretcher E-10", description: "PUKANG transfer stretcher with 2 hydraulic cylinders and gas-spring lifting, radiolucent platform for full-body X-ray with cassette holder. Functions: backrest, kneerest, height adjustment, Trendelenburg and anti-Trendelenburg, directional fifth wheel, central braking, overload protection, IV pole, instrument shelf, foldable push handles, roller bumpers and bumper strips, mattress." },
  spec: [["ext", dim(2110, 760)], ["gc", mm("580-900")], ["sr", mm(270)], ["back", pm("0-75°")], ["knee", pm("0-30°")], ["atr", pm("0-16°", 3)], ["tr", pm("0-16°", 3)], ...tail({ castor: 200, swl: 260 })] });
add({ ref: "E-1-1", slug: "pukang-brancard-hydraulique-e-1-1", cat: C.bra, img: ["e-1-1"],
  fr: { nom: "Brancard hydraulique E-1-1", description: "Brancard PUKANG à 2 vérins hydrauliques, levage par vérin à gaz, barrières et têtes ABS. Fonctions : relève-buste, hauteur variable, inclinaison Trendelenburg et anti-Trendelenburg, roue directionnelle (5e roue), freinage centralisé, trous pour potence, pare-chocs, matelas." },
  en: { nom: "Hydraulic stretcher E-1-1", description: "PUKANG stretcher with 2 hydraulic cylinders, gas-spring lifting, ABS siderails and boards. Functions: backrest, height adjustment, TR and ATR tilt, directional fifth wheel, central braking, IV pole holes, roller bumpers, mattress." },
  spec: [["ext", dim(1960, 670)], ["gc", mm("650-915")], ["sr", mm(340)], ["back", pm("0-80°")], ["tr", "≥ 12°"], ["atr", "≥ 12°"], ...tail({ castor: 150, swl: 260 })] });
add({ ref: "E-7", slug: "pukang-brancard-transfert-inox-e-7", cat: C.bra, img: ["e-7"],
  fr: { nom: "Brancard de transfert inox E-7", description: "Brancard de transfert PUKANG en acier inoxydable composé d'une base de chariot, d'un chariot-brancard et d'un brancard de transfert patient, avec système d'accouplement/désaccouplement entre base et chariot (3 verrous). Fonctions : relève-buste, hauteur variable (vis-mères et vérin à gaz), protection contre la surcharge, châssis et plateau séparables, frein individuel (8 roulettes), potence et trous pour potence, matelas." },
  en: { nom: "Stainless steel connecting stretcher E-7", description: "PUKANG stainless steel connecting stretcher made of a main trolley base, a stretcher cart and a patient transfer stretcher, with docking/undocking system between base and cart (3 locking devices). Functions: backrest, height adjustment (leading screws and gas spring), overload protection, separable frame and body, individual brake (8 castors), IV pole and IV pole holes, mattress." },
  spec: [["ext", dim(3500, 675)], ["gc", mm("750-950")], ["sr", mm(170)], ["back", pm("0-10°", 2)], ...tail({ castor: 125, swl: 260 })] });

// ===== Tables d'examen ==================================================
add({ ref: "DB-41", slug: "pukang-table-examen-electrique-db-41", cat: C.tab, img: ["db-41"],
  fr: { nom: "Table d'examen électrique DB-41", description: "Table d'examen électrique PUKANG à 4 moteurs linéaires et commande au pied, avec translation latérale du plateau (0-300 mm) et changeur automatique de drap d'examen jetable (pleine largeur ou demi-largeur). Fonctions : relève-buste, hauteur variable, Trendelenburg et anti-Trendelenburg, RCP et Trendelenburg à une touche, freinage centralisé, batterie, matelas mousse." },
  en: { nom: "Electric examination bed DB-41", description: "PUKANG electric examination bed with 4 linear motors and foot pedal, lateral translation of the top (0-300 mm) and automated disposable bed sheet changer (full or half width). Functions: backrest, height adjustment, Trendelenburg and anti-Trendelenburg, one-button CPR and one-button Trendelenburg, central braking, battery, foam mattress." },
  spec: [["ext", dim(2080, 720)], ["gc", mm("495-795")], ["plat", dim(1940, 630)], ["back", pm("0-70°")], ["atr", "≥ 12°"], ["tr", "≥ 12°"], ["latTrans", mm("0-300")], ...tail({ castor: 125, swl: 200 })] });
add({ ref: "B-40", slug: "pukang-table-examen-b-40", cat: C.tab, img: ["b-40", "b-40-c3"],
  fr: { nom: "Table d'examen B-40", description: "Table d'examen PUKANG en acier inoxydable avec matelas mousse. Deux versions : B-40, dossier réglable par manivelle (vis-mère avec protection contre la surcharge), et B-40 (C3), dossier sur charnière de levage avec déverrouillage et porte-rouleau de papier." },
  en: { nom: "Examination bed B-40", description: "PUKANG stainless steel examination bed with foam mattress. Two versions: B-40, backrest adjusted by crank (leading screw with overload protection), and B-40 (C3), backrest on lift hinge with release and paper roller holder." },
  spec: [["ext", dim(1920, 630)], ["gc1", mm(750)], ["plat", dim(1920, 630)], ["back", pm("0-70°")], ["swl", kg(260)]] });

// ===== Lève-malades (mobilite-et-soutien) ==================================
const LIFT_FR = "Lève-malade électrique PUKANG avec télécommande, chargeur, batterie, arrêt d'urgence, palonnier et sangle patient";
const LIFT_EN = "PUKANG electric patient lift with remote control, charger, battery, emergency stop, spreader bar and patient sling";
add({ ref: "DE-1C1", slug: "pukang-leve-malade-electrique-de-1c1", cat: C.mob, img: ["de-1c1"],
  fr: { nom: "Lève-malade électrique DE-1C1", description: `${LIFT_FR}. 2 moteurs linéaires : levage du bras et écartement motorisé de la base. Affichage batterie, arrêt, descente manuelle de secours, roulettes à frein individuel.` },
  en: { nom: "Electric patient lift DE-1C1", description: `${LIFT_EN}. 2 linear motors: boom lift and motorized base widening. Battery display, stop, manual lowering, individual brake castors.` },
  spec: [["ext", dim(1300, 670)], ["hadj", mm("830-1860")], ...tail({ castor: 75, swl: 170 })] });
add({ ref: "DE-1C2", slug: "pukang-leve-malade-electrique-de-1c2", cat: C.mob, img: ["de-1c2"],
  fr: { nom: "Lève-malade électrique DE-1C2", description: `${LIFT_FR}. 1 moteur linéaire pour le levage du bras, base à écartement réglable. Affichage batterie, arrêt, descente manuelle de secours, roulettes à frein individuel.` },
  en: { nom: "Electric patient lift DE-1C2", description: `${LIFT_EN}. 1 linear motor for the boom lift, base widening. Battery display, stop, manual lowering, individual brake castors.` },
  spec: [["ext", dim(1140, 640)], ["hadj", mm("540-1460")], ...tail({ castor: 75, swl: 170 })] });
add({ ref: "DE-1C3", slug: "pukang-verticalisateur-electrique-de-1c3", cat: C.mob, img: ["de-1c3"],
  fr: { nom: "Lève-malade verticalisateur électrique DE-1C3", description: `${LIFT_FR}, pour le transfert en position debout : 1 moteur linéaire, appui-genoux rembourré, repose-pieds, poignée de poussée et poignées de maintien. Affichage batterie, arrêt.` },
  en: { nom: "Electric stand-up patient lift DE-1C3", description: `${LIFT_EN}, for standing transfers: 1 linear motor, leg-blocking soft pad, foot pedal, push handle and handrail. Battery display, stop.` },
  spec: [["ext", dim(990, 560)], ["hadj", mm("790-1265")], ["castorBig", mm(75)], ["castorSmall", mm(50)], ["swl", kg(170)]] });

// ===== Chariots ==========================================================
const T2 = (l, w, h, c) => [["ext", dim(l, w, h)], ["castor", mm(c)]];
const WOW = [
  ["F-01", "pukang-poste-de-travail-mobile-f-01", "Poste de travail mobile F-01", "Workstation on wheels F-01",
    "Poste informatique mobile PUKANG pour écran jusqu'à 22 pouces, plan de travail réglable en hauteur par levier, écran inclinable, pivotant et orientable, compartiment pour ordinateur portable verrouillable, tablette coulissante pour souris, clavier, poignées avant et arrière, roulettes doubles à frein individuel.",
    "PUKANG mobile computer workstation for monitors up to 22 inches, worktop height adjusted by lever, monitor tilt, swivel and rotation, lockable laptop compartment, slide-out mouse tray, keyboard and mouse assembly, front and rear handles, twin-wheel castors with individual brake.",
    [["ext", ["L750 x l530 x H1200-1400 mm", "L750 x W530 x H1200-1400 mm"]], ["worktop", dim(527, 485)], ["base", dim(570, 515)], ["monitor", ["≤ 22 pouces", "≤ 22 inches"]], ["mTilt", "25°"], ["mSwivel", "180°"], ["mRot", "90°"], ["castor", mm(100)], ["swl", kg(80)]]],
  ["F-02", "pukang-poste-de-travail-mobile-f-02", "Poste de travail mobile F-02", "Workstation on wheels F-02",
    "Poste informatique mobile PUKANG avec ordinateur tout-en-un, interface d'écran à démontage rapide, plan de travail à levage électrique (course 500 mm), écran inclinable et orientable, tablette clavier, compartiment pour ordinateur portable verrouillable, tablette coulissante pour souris, poignée de poussée, roulettes doubles à frein individuel.",
    "PUKANG mobile computer workstation with all-in-one PC, quick-release monitor interface, electric worktop lift (500 mm travel), monitor tilt and rotation, keyboard tray, lockable laptop compartment, slide-out mouse tray, push handle, twin-wheel castors with individual brake.",
    [["ext", ["L610 x l495 x H1250-1750 mm", "L610 x W495 x H1250-1750 mm"]], ["worktop", dim(530, 465)], ["base", ["460 x 515 mm", "460 x 515 mm"]], ["monitor", ["≤ 22 pouces", "≤ 22 inches"]], ["mTilt", "25°"], ["wtAdj", mm(500)], ["mRot", "90°"], ["castor", mm(100)], ["swl", kg(80)]]],
  ["F-03", "pukang-poste-de-travail-mobile-f-03", "Poste de travail mobile à médicaments F-03", "Workstations on wheels F-03",
    "Poste informatique mobile PUKANG combiné à un chariot de soins : support pour ordinateur tout-en-un (écran jusqu'à 22 pouces, inclinable et orientable), 8 modules à médicaments, tiroirs de rangement petits et grands, 2 supports de plateau, panier à poches de perfusion, compartiment pour ordinateur portable verrouillable, tablette coulissante pour souris, poubelle, poignée de poussée, roulettes doubles à frein individuel.",
    "PUKANG mobile computer workstation combined with a care trolley: all-in-one PC mount (monitor up to 22 inches, tilt and rotation), 8 medication units, small and big storage drawers, 2 tray holders, IV bag basket, lockable laptop compartment, slide-out mouse tray, waste bin, push handle, twin-wheel castors with individual brake.",
    [["ext", dim(950, 570, 1600)], ["worktop", dim(527, 485)], ["base", dim(570, 515)], ["monitor", ["≤ 22 pouces", "≤ 22 inches"]], ["mTilt", "25°"], ["mRot", "90°"], ["medUnit", ["99 x 337 x 54 mm", "99 x 337 x 54 mm"]], ["drS", ["396 x 340 x 75 mm", "396 x 340 x 75 mm"]], ["drB", ["396 x 340 x 150 mm", "396 x 340 x 150 mm"]], ["tray", ["330 x 260 mm", "330 x 260 mm"]], ["ivBag", ["380 x 160 x 510 mm", "380 x 160 x 510 mm"]], ["body", ["490 x 400 x 680 mm", "490 x 400 x 680 mm"]], ["castor", mm(125)], ["swl", kg(100)]]],
];
for (const [ref, slug, fr, en, dfr, den, spec] of WOW) add({ ref, slug, cat: C.cha, img: [ref.toLowerCase()], fr: { nom: fr, description: dfr }, en: { nom: en, description: den }, spec });
const TROL = [
  // ref, slug, frName, enName, frDesc, enDesc, L, W, H, castor
  ["F-42", "chariot-urgence-f-42", "Chariot d'urgence F-42", "Emergency trolley F-42", "Chariot d'urgence PUKANG en ABS avec 2 tiroirs, armoire à 2 portes, module à médicaments, potence, poubelle, poignée de poussée, butoirs d'angle et roulettes à frein individuel.", "PUKANG ABS emergency trolley with 2 drawers, 2-door cabinet, medication unit, IV pole, waste bin, push handle, corner bumpers and individual brake castors.", 800, 490, 950, 125],
  ["F-43", "chariot-urgence-f-43", "Chariot d'urgence F-43", "Emergency trolley F-43", "Chariot d'urgence PUKANG en ABS avec rambarde sur 3 côtés, 5 tiroirs à verrouillage centralisé, potence, cassette à dossiers, 2 poubelles, collecteur d'aiguilles, planche de RCP, 2 poignées de poussée, multiprise et roulettes à frein individuel.", "PUKANG ABS emergency trolley with 3-sided railing, 5 drawers with central lock, IV pole, file cassette, 2 waste bins, needle disposal container, CPR board, 2 push handles, power strip and individual brake castors.", 820, 525, 985, 125],
  ["F-48", "chariot-urgence-f-48", "Chariot d'urgence F-48", "Emergency trolley F-48", "Chariot d'urgence PUKANG en ABS avec 5 tiroirs à verrouillage centralisé (scellés plastiques jetables), tablette de travail coulissante, potence, tablette pour défibrillateur, cassette à dossiers, 2 poubelles, collecteur d'aiguilles, planche de RCP, multiprise, butoirs d'angle et roulettes à frein individuel.", "PUKANG ABS emergency trolley with 5 drawers with central lock (disposable plastic seals), sliding working table, IV pole, defibrillator shelf, file cassette, 2 waste bins, needle disposal container, CPR board, power strip, corner bumpers and individual brake castors.", 815, 540, 980, 125],
  ["F-60", "chariot-anesthesie-f-60", "Chariot d'anesthésie F-60", "Anesthesia trolley F-60", "Chariot d'anesthésie PUKANG en ABS avec 5 tiroirs de couleur à verrouillage centralisé, tapis de dessus en PVC, tablette de travail coulissante, 2 poubelles, collecteur d'aiguilles, support de désinfectant, pare-chocs de 100 mm et roulettes à frein individuel.", "PUKANG ABS anesthesia trolley with 5 coloured drawers with central lock, PVC top mat, sliding working table, 2 waste bins, needle disposal container, disinfectant holder, 100 mm roller bumpers and individual brake castors.", 685, 555, 1020, 125],
  ["F-61", "chariot-anesthesie-f-61", "Chariot d'anesthésie F-61", "Anesthesia trolley F-61", "Chariot d'anesthésie PUKANG en ABS avec rambarde sur 3 côtés, 6 tiroirs à verrouillage centralisé, potence, support de bouteille d'oxygène, poubelle, poignée de poussée, butoirs d'angle et roulettes à frein individuel.", "PUKANG ABS anesthesia trolley with 3-sided railing, 6 drawers with central lock, IV pole, oxygen cylinder holder, waste bin, push handle, corner bumpers and individual brake castors.", 650, 420, 1020, 125],
  ["F-62", "chariot-anesthesie-inox-f-62", "Chariot d'anesthésie inox F-62", "Anesthesia trolley F-62 (stainless steel)", "Chariot d'anesthésie PUKANG en acier inoxydable avec rambarde, 6 tiroirs à verrouillage centralisé, tablette de travail coulissante, poubelle, poignée de poussée, butoirs d'angle et roulettes à frein individuel.", "PUKANG stainless steel anesthesia trolley with railing, 6 drawers with central lock, sliding working table, waste bin, push handle, corner bumpers and individual brake castors.", 650, 420, 1020, 125],
  ["F-63", "chariot-anesthesie-f-63", "Chariot d'anesthésie F-63", "Anesthesia trolley F-63", "Chariot d'anesthésie PUKANG en ABS avec 5 tiroirs à verrouillage centralisé, tablette de travail coulissante, étagère à médicaments surélevée, 2 poubelles, collecteur d'aiguilles, multiprise et support, butoirs d'angle et roulettes à frein individuel.", "PUKANG ABS anesthesia trolley with 5 drawers with central lock, sliding working table, raised medication rack, 2 waste bins, needle disposal container, power strip and holder, corner bumpers and individual brake castors.", 815, 540, 980, 125],
  ["F-16", "chariot-soins-f-16", "Chariot de soins F-16", "Treatment trolley F-16", "Chariot de soins PUKANG à 2 plateaux ABS avec rambardes sur structure inox, tiroir avec module à médicaments, cuvette en acier inoxydable, poubelle, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG treatment trolley with 2 ABS worktops with railing on stainless frame, drawer with medication unit, stainless steel basin, waste bin, 2 individual brake castors and 2 castors without braking.", 740, 470, 975, 100],
  ["F-17", "chariot-soins-f-17", "Chariot de soins F-17", "Treatment trolley F-17", "Chariot de soins PUKANG à 2 plateaux avec rambardes, tiroir (sans module à médicaments), cuvette en acier inoxydable, poubelle, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG treatment trolley with 2 worktops with railing, drawer (without medication unit), stainless steel basin, waste bin, 2 individual brake castors and 2 castors without braking.", 660, 470, 975, 100],
  ["F-18", "chariot-soins-f-18", "Chariot de soins F-18", "Treatment trolley F-18", "Chariot de soins PUKANG en ABS avec 2 tiroirs à verrouillage centralisé (scellés plastiques jetables), tapis de dessus en PVC, plateau inférieur, tablette de travail coulissante, 2 poubelles, poignée de poussée, pare-chocs de 100 mm et roulettes à frein individuel.", "PUKANG ABS treatment trolley with 2 drawers with central lock (disposable plastic seals), PVC top mat, base platform, sliding working table, 2 waste bins, push handle, 100 mm roller bumpers and individual brake castors.", 685, 555, 1020, 125],
  ["F-19", "chariot-soins-f-19", "Chariot de soins F-19", "Treatment trolley F-19", "Chariot de soins PUKANG en ABS avec 2 tiroirs à verrouillage centralisé, tapis de dessus en PVC, plateau inférieur, tablette de travail coulissante, 2 poubelles, collecteur d'aiguilles, support de désinfectant, pare-chocs de 100 mm et roulettes à frein individuel.", "PUKANG ABS treatment trolley with 2 drawers with central lock, PVC top mat, base platform, sliding working table, 2 waste bins, needle disposal container, disinfectant holder, 100 mm roller bumpers and individual brake castors.", 620, 500, 1020, 125],
  ["F-24", "chariot-inox-f-24", "Chariot inox pour appareils F-24", "Stainless steel trolley for appliance F-24", "Chariot PUKANG en acier inoxydable à 2 plateaux avec rambardes, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with 2 worktops with railing, 2 individual brake castors and 2 castors without braking.", 660, 440, 880, 100],
  ["F-28", "chariot-inox-f-28", "Chariot inox pour appareils F-28", "Stainless steel trolley for appliance F-28", "Chariot PUKANG en acier inoxydable à 2 plateaux avec rambardes et 2 poubelles, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with 2 worktops with railing and 2 waste bins, 2 individual brake castors and 2 castors without braking.", 670, 470, 970, 100],
  ["F-30", "chariot-linge-sale-inox-f-30", "Chariot inox à linge sale F-30", "Stainless steel trolley for waste F-30", "Chariot PUKANG en acier inoxydable avec sac à linge, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with linen bag, 2 individual brake castors and 2 castors without braking.", 805, 530, 905, 100],
  ["F-31", "chariot-dechets-inox-f-31", "Chariot inox à déchets F-31", "Stainless steel trolley for waste F-31", "Chariot PUKANG en acier inoxydable avec 2 sacs à couvercle (bleu et jaune) ouverts par pédales, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with 2 linen bags with cover (blue and yellow) opened by foot pedals, 2 individual brake castors and 2 castors without braking.", 905, 455, 905, 100],
  ["F-70", "chariot-dossiers-f-70", "Chariot à dossiers médicaux F-70", "Record trolley F-70", "Chariot à dossiers PUKANG en ABS, 50 emplacements pour dossiers patients avec verrous individuels, tiroir, tablette de travail coulissante, pare-chocs et roulettes à frein individuel.", "PUKANG ABS record trolley with 50 chart slots and individual locks, drawer, sliding working table, roller bumpers and individual brake castors.", 685, 555, 1145, 125],
  ["F-71", "chariot-dossiers-f-71", "Chariot à dossiers médicaux F-71", "Record trolley F-71", "Chariot à dossiers PUKANG à deux colonnes, 50 emplacements pour dossiers patients, 2 tiroirs, 2 verrous, poignée de poussée et roulettes à frein individuel.", "PUKANG two-column record trolley with 50 chart slots, 2 drawers, 2 individual locks, push handle and individual brake castors.", 650, 400, 1030, 100],
  ["F-72", "chariot-dossiers-f-72", "Chariot à dossiers médicaux F-72", "Record trolley F-72", "Chariot à dossiers PUKANG à une colonne, 25 emplacements pour dossiers patients, tiroir avec verrou, poignée de poussée et roulettes à frein individuel.", "PUKANG single-column record trolley with 25 chart slots, drawer with lock, push handle and individual brake castors.", 350, 400, 1030, 100],
  ["F-75", "chariot-dossiers-inox-f-75", "Chariot à dossiers médicaux inox F-75", "Stainless steel record trolley F-75", "Chariot à dossiers PUKANG en acier inoxydable, 50 emplacements pour dossiers patients, tiroir, verrous individuels, poignée de poussée, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel record trolley with 50 chart slots, drawer, individual locks, push handle, 2 individual brake castors and 2 castors without braking.", 665, 390, 1020, 100],
  ["F-80", "chariot-inox-tiroir-f-80", "Chariot inox pour appareils F-80", "Stainless steel trolley for appliance F-80", "Chariot PUKANG en acier inoxydable à 2 plateaux avec rambardes et un tiroir, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with 2 worktops with railing and one drawer, 2 individual brake castors and 2 castors without braking.", 665, 475, 995, 100],
  ["F-84", "table-de-travail-inox-f-84", "Table de travail inox F-84", "Stainless steel working table F-84", "Table de travail mobile PUKANG en acier inoxydable, en arc, à 2 plateaux avec rambardes et 4 roulettes à frein individuel.", "PUKANG mobile stainless steel working table, arc-shaped, with 2 worktops with railing and 4 individual brake castors.", 1390, 620, 830, 100],
  ["F-91", "chariot-grille-inox-f-91", "Chariot à paniers inox type III F-91", "Stainless steel wire mesh trolley type III F-91", "Chariot de rangement PUKANG en acier inoxydable avec paniers grillagés, 2 tiroirs et 2 crochets, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel storage trolley with wire mesh baskets, 2 drawers and 2 hooks, 2 individual brake castors and 2 castors without braking.", 910, 500, 1990, 125],
  ["F-92", "chariot-grille-inox-f-92", "Chariot à paniers inox type I F-92", "Stainless steel wire mesh trolley type I F-92", "Chariot de rangement PUKANG en acier inoxydable avec 3 paniers grillagés et 2 plateaux à médicaments, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel storage trolley with 3 wire mesh baskets and 2 medication trays, 2 individual brake castors and 2 castors without braking.", 560, 470, 1980, 100],
  ["F-93", "chariot-grille-inox-f-93", "Chariot à paniers inox type I F-93", "Stainless steel wire mesh trolley type I F-93", "Chariot de rangement PUKANG en acier inoxydable à paniers grillagés disposés de part et d'autre d'un mât central, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel storage trolley with wire mesh baskets on both sides of a central post, 2 individual brake castors and 2 castors without braking.", 800, 560, 1980, 100],
  ["F-95", "chariot-inox-paniers-f-95", "Chariot inox pour appareils F-95", "Stainless steel trolley for appliance F-95", "Chariot PUKANG en acier inoxydable avec plateau, tiroir, 2 paniers grillagés, poubelle et poignée de poussée, 2 roulettes à frein individuel et 2 roulettes libres.", "PUKANG stainless steel trolley with worktop, drawer, 2 wire mesh baskets, waste bin and push handle, 2 individual brake castors and 2 castors without braking.", 780, 460, 1030, 100],
];
for (const [ref, slug, fr, en, dfr, den, l, w, h, c] of TROL) add({ ref, slug: `pukang-${slug}`, cat: C.cha, img: [ref.toLowerCase()], fr: { nom: fr, description: dfr }, en: { nom: en, description: den }, spec: T2(l, w, h, c) });
add({ ref: "F-82", slug: "pukang-table-mayo-inox-f-82", cat: C.cha, img: ["f-82"],
  fr: { nom: "Table Mayo inox F-82", description: "Table Mayo PUKANG en acier inoxydable réglable en hauteur, plateau inox amovible sur support, base sur roulettes dont 2 à frein individuel." },
  en: { nom: "Stainless steel Mayo trolley F-82", description: "Height-adjustable PUKANG stainless steel Mayo trolley, removable stainless tray on holder, base on castors including 2 individual brake castors." },
  spec: [["ext", ["L600 x l400 x H850-1000 mm", "L600 x W400 x H850-1000 mm"]], ["castor", mm(50)]] });
add({ ref: "F-83", slug: "pukang-table-mayo-inox-f-83", cat: C.cha, img: ["f-83"],
  fr: { nom: "Table Mayo inox F-83", description: "Table Mayo PUKANG en acier inoxydable réglable en hauteur, plateau inox amovible sur support, 2 roulettes à frein individuel et 2 roulettes libres." },
  en: { nom: "Stainless steel Mayo trolley F-83", description: "Height-adjustable PUKANG stainless steel Mayo trolley, removable stainless tray on holder, 2 individual brake castors and 2 castors without braking." },
  spec: [["ext", ["L740 x l450 x H825-1140 mm", "L740 x W450 x H825-1140 mm"]], ["castor", mm(100)]] });
add({ ref: "F-85", slug: "pukang-chariots-gigognes-inox-f-85", cat: C.cha, img: ["f-85"],
  fr: { nom: "Chariots gigognes inox F-85", description: "Ensemble de 3 chariots PUKANG en acier inoxydable qui s'emboîtent (grand, moyen, petit), chacun avec plateaux, 2 roulettes à frein individuel et 2 roulettes libres." },
  en: { nom: "Stainless steel nesting trolley F-85", description: "Set of 3 nesting PUKANG stainless steel trolleys (big, middle, small), each with worktops, 2 individual brake castors and 2 castors without braking." },
  spec: [["#", "Grand chariot : L1010 x l510 x H960 mm", "Big trolley: L1010 x W510 x H960 mm"], ["#", "Chariot moyen : L860 x l490 x H860 mm", "Middle trolley: L860 x W490 x H860 mm"], ["#", "Petit chariot : L720 x l460 x H800 mm", "Small trolley: L720 x W460 x H800 mm"], ["castor", mm(100)]] });

// ===== Armoires et rangement ==============================================
add({ ref: "G-13", slug: "pukang-armoire-injection-inox-g-13", cat: C.arm, img: ["g-13"],
  fr: { nom: "Armoire à injections inox G-13", description: "Armoire PUKANG en acier inoxydable : partie haute vitrée à 2 portes, plan de travail intermédiaire avec 2 tiroirs, partie basse à 2 portes." },
  en: { nom: "Stainless steel injection cupboard G-13", description: "PUKANG stainless steel cupboard: glazed upper part with 2 doors, intermediate worktop with 2 drawers, lower part with 2 doors." },
  spec: [["ext", ["L1100 x l400/700 x H1750 mm", "L1100 x W400/700 x H1750 mm"]]] });
const BSC = [
  ["D-13", "Table de chevet D-13", "Bedside cabinet D-13", "Table de chevet PUKANG avec tiroir et porte, montants latéraux en aluminium, sur roulettes.", "PUKANG bedside cabinet with drawer and door, aluminium side posts, on castors.", [["ext", dim(530, 500, 800)], ["castor", mm(50)]]],
  ["D-14", "Table de chevet D-14", "Bedside cabinet D-14", "Table de chevet PUKANG finition bois avec tiroir, niche ouverte et porte, montants latéraux en aluminium.", "PUKANG wood-finish bedside cabinet with drawer, open shelf and door, aluminium side posts.", [["ext", dim(530, 500, 790)]]],
  ["D-18", "Table de chevet D-18", "Bedside cabinet D-18", "Table de chevet PUKANG avec tiroir, niche ouverte, porte et porte-serviettes latéral, sur roulettes.", "PUKANG bedside cabinet with drawer, open shelf, door and side towel rail, on castors.", [["ext", dim(615, 500, 885)], ["castor", mm(50)]]],
  ["D-23", "Table de chevet ABS D-23", "Bedside cabinet D-23", "Table de chevet PUKANG en ABS finition bois, avec tiroir et porte, sur roulettes.", "PUKANG ABS bedside cabinet in wood finish, with drawer and door, on castors.", [["ext", dim(475, 475, 765)], ["castor", mm(50)]]],
  ["D-24", "Table de chevet ABS D-24", "Bedside cabinet D-24", "Table de chevet PUKANG en ABS blanc, avec tiroir et porte, sur roulettes.", "PUKANG white ABS bedside cabinet, with drawer and door, on castors.", [["ext", dim(475, 475, 765)], ["castor", mm(50)]]],
  ["D-25", "Table de chevet ABS D-25", "Bedside cabinet D-25", "Table de chevet PUKANG en ABS bleu, avec tiroir et porte, sur roulettes.", "PUKANG blue ABS bedside cabinet, with drawer and door, on castors.", [["ext", dim(475, 475, 765)], ["castor", mm(50)]]],
];
for (const [ref, fr, en, dfr, den, spec] of BSC) add({ ref, slug: `pukang-table-de-chevet-${ref.toLowerCase()}`, cat: C.arm, img: [ref.toLowerCase()], fr: { nom: fr, description: dfr }, en: { nom: en, description: den }, spec });

// ===== Fauteuils =========================================================
add({ ref: "Y-51", slug: "pukang-fauteuil-dialyse-electrique-y-51", cat: C.fau, img: ["y-51"],
  fr: { nom: "Fauteuil de dialyse électrique Y-51", description: "Fauteuil de dialyse et de prélèvement PUKANG à 3 moteurs avec télécommande, accoudoirs réglables, appui-tête, potence et poignée de poussée. Fonctions : dossier, repose-pieds, plicature automatique, hauteur variable, position fauteuil, levier de RCP manuelle, trous pour potence, frein individuel." },
  en: { nom: "Electric dialysis chair Y-51", description: "PUKANG dialysis and blood collection chair with 3 motors and remote control, adjustable armrests, headrest, IV pole and push handle. Functions: backrest, footrest, auto contour, height adjustment, chair position, manual CPR lever, IV pole holes, individual brake." },
  spec: [["extFold", dim(1370, 795, 1270)], ["extUnfold", dim(1950, 795, 700)], ["back", ["-10° à 70° (±5°)", "-10° to 70° (±5°)"]], ["knee", ["7° à -65° (±5°)", "7° to -65° (±5°)"]], ["seatGc", mm("450-650")], ["armH", mm(670)], ["armAdj", "0-110° (±10°)"], ["armLR", pm("0-20°")], ...tail({ castor: 100, swl: 150 })] });
add({ ref: "Y-44", slug: "pukang-fauteuil-accompagnant-pliant-y-44", cat: C.fau, img: ["y-44"],
  fr: { nom: "Fauteuil accompagnant pliant Y-44", description: "Fauteuil PUKANG pour accompagnant qui se déplie en lit d'appoint, sur roulettes, avec roulette directionnelle." },
  en: { nom: "Foldable accompany chair Y-44", description: "PUKANG chair for the patient's companion that unfolds into a bed, on castors, with directional driving castor." },
  spec: [["extFold", dim(810, 665, 975)], ["extUnfold", dim(1945, 665, 415)], ["castor", mm(80)], ["castorDir", mm(50)]] });

// ===== Accessoires de lit ===================================================
const POLE = (ref, h, w) => ({ ref, slug: `pukang-tige-perfusion-lit-${ref.toLowerCase()}`, cat: C.acc, img: [ref.toLowerCase()],
  fr: { nom: `Tige à perfusion pour lit ${ref}`, description: "Tige à perfusion PUKANG télescopique à crochets, à fixer dans les trous pour potence des lits et brancards." },
  en: { nom: `IV pole ${ref}`, description: "PUKANG telescopic IV pole with hooks, fitted in the IV pole holes of beds and stretchers." },
  spec: [["ext", [`L${w} x l${w} x H${h} mm`, `L${w} x W${w} x H${h} mm`]]] });
add(POLE("R-4", "1120-1910", 230));
add(POLE("R-5", "1110-1690", 210));
add(POLE("R-6", "1060-1610", 230));
add({ ref: "LS-1", slug: "pukang-perroquet-ls-1", cat: C.acc, img: ["ls-1"],
  fr: { nom: "Perroquet (potence de levage) LS-1", description: "Potence de levage PUKANG avec sangle et poignée, à fixer sur le lit pour aider le patient à se redresser." },
  en: { nom: "Lifting pole LS-1", description: "PUKANG lifting pole with strap and handle, mounted on the bed to help the patient sit up." },
  spec: [["ext", dim(912, 32, 1427)]] });
add({ ref: "FJ-1", slug: "pukang-tablette-repas-extensible-fj-1", cat: C.acc, img: ["fj-1"],
  fr: { nom: "Tablette repas extensible FJ-1", description: "Tablette repas PUKANG extensible, à accrocher sur les barrières latérales du lit." },
  en: { nom: "Hanging extendable dining board FJ-1", description: "Extendable PUKANG dining board that hangs on the bed siderails." },
  spec: [["ext", ["L868-1107 x l330 x H25 mm", "L868-1107 x W330 x H25 mm"]], ["sideDist", mm("814-1053")]] });
add({ ref: "FJ-2", slug: "pukang-panier-rangement-fj-2", cat: C.acc, img: ["fj-2"],
  fr: { nom: "Panier de rangement FJ-2", description: "Panier grillagé de rangement PUKANG pour lit d'hôpital." },
  en: { nom: "Storage basket FJ-2", description: "PUKANG wire storage basket for hospital beds." },
  spec: [["ext", dim(750, 600, 45)]] });
add({ ref: "FJ-3", slug: "pukang-etagere-sous-lit-fj-3", cat: C.acc, img: ["fj-3"],
  fr: { nom: "Étagère sous le lit FJ-3", description: "Étagère de rangement PUKANG à fixer sous le plan de couchage du lit." },
  en: { nom: "Under-bed storage rack FJ-3", description: "PUKANG storage rack fitted under the bed's mattress platform." },
  spec: [["ext", dim(335, 730, 45)]] });
add({ ref: "FJ-4", slug: "pukang-support-bouteille-oxygene-fj-4", cat: C.acc, img: ["fj-4"],
  fr: { nom: "Support de bouteille d'oxygène FJ-4", description: "Support PUKANG à accrocher pour bouteille d'oxygène, pour lits et brancards." },
  en: { nom: "Hanging oxygen cylinder holder FJ-4", description: "PUKANG hanging oxygen cylinder holder, for beds and stretchers." },
  spec: [["ext", dim(220, 138, 320)]] });
add({ ref: "PUKANG-SUPPORT-INSTRUMENTS", slug: "pukang-support-instruments-lit", cat: C.acc, img: ["pk-bracket"],
  fr: { nom: "Support d'instruments pour lit", description: "Support PUKANG à fixer en pied de lit pour poser un appareil ou un moniteur." },
  en: { nom: "Instrument bracket", description: "PUKANG bracket fitted at the foot end of the bed to hold a device or a monitor." },
  spec: [["ext", dim(357, 467, 359)]] });
add({ ref: "PUKANG-PLANCHE-TRANSFERT", slug: "pukang-planche-de-transfert", cat: C.acc, img: ["pk-transfer-board"],
  fr: { nom: "Planche d'aide au transfert", description: "Planche PUKANG pour faire glisser le patient d'un lit ou d'un brancard à l'autre." },
  en: { nom: "Transfer assistant board", description: "PUKANG board for sliding the patient from one bed or stretcher to another." },
  spec: [["ext", dim(1720, 500, 20)]] });

// ===== Mobilier de soins =====================================================
add({ ref: "Y-20", slug: "pukang-paravent-medical-y-20", cat: C.soin, img: ["y-20"],
  fr: { nom: "Paravent médical Y-20", description: "Paravent médical PUKANG à 4 volets en tissu sur cadre en acier inoxydable, sur roulettes." },
  en: { nom: "Medical screen Y-20", description: "PUKANG 4-panel medical screen with fabric on stainless steel frame, on castors." },
  spec: [["ext", dim(2400, 525, 1800)], ["castor", mm(50)]] });
add({ ref: "Y-30", slug: "pukang-marchepied-deux-marches-y-30", cat: C.soin, img: ["y-30"],
  fr: { nom: "Marchepied deux marches Y-30", description: "Marchepied PUKANG à deux marches antidérapantes sur structure en acier inoxydable." },
  en: { nom: "Two-step footstool Y-30", description: "PUKANG two-step footstool with non-slip steps on stainless steel frame." },
  spec: [["ext", ["L600 x l415 x H205/405 mm", "L600 x W415 x H205/405 mm"]]] });
add({ ref: "Y-31", slug: "pukang-marchepied-une-marche-y-31", cat: C.soin, img: ["y-31"],
  fr: { nom: "Marchepied une marche Y-31", description: "Marchepied PUKANG à une marche antidérapante sur structure en acier inoxydable." },
  en: { nom: "One-step footstool Y-31", description: "PUKANG one-step footstool with non-slip step on stainless steel frame." },
  spec: [["ext", dim(530, 280, 220)]] });
add({ ref: "Y-32", slug: "pukang-tabouret-avec-dossier-y-32", cat: C.soin, img: ["y-32"],
  fr: { nom: "Tabouret médical à dossier Y-32", description: "Tabouret médical PUKANG réglable en hauteur, avec dossier, sur base à roulettes." },
  en: { nom: "Nurse stool Y-32", description: "Height-adjustable PUKANG nurse stool with backrest, on castor base." },
  spec: [["ext", ["L650 x l650 x H700-840 mm", "L650 x W650 x H700-840 mm"]], ["castor", mm(50)]] });
add({ ref: "Y-33", slug: "pukang-tabouret-inox-y-33", cat: C.soin, img: ["y-33"],
  fr: { nom: "Tabouret inox Y-33", description: "Tabouret PUKANG en acier inoxydable à assise réglable en hauteur, sur pieds avec repose-pieds circulaire." },
  en: { nom: "Nurse stool Y-33", description: "PUKANG stainless steel stool with height-adjustable seat, on legs with circular footrest." },
  spec: [["ext", ["L460 x l460 x H515-650 mm", "L460 x W460 x H515-650 mm"]]] });
add({ ref: "Y-34", slug: "pukang-tabouret-medical-y-34", cat: C.soin, img: ["y-34"],
  fr: { nom: "Tabouret médical Y-34", description: "Tabouret médical PUKANG réglable en hauteur, sur base à roulettes." },
  en: { nom: "Nurse stool Y-34", description: "Height-adjustable PUKANG nurse stool, on castor base." },
  spec: [["ext", ["L530 x l530 x H500-560 mm", "L530 x W530 x H500-560 mm"]], ["castor", mm(50)]] });
const OBT = [["T-30", 920, 455, "745-1130", 40], ["T-31", 880, 460, "845-1125", 50], ["T-33", 800, 420, "680-980", 50], ["T-34", 900, 455, "745-1130", 30]];
for (const [ref, l, w, h, c] of OBT) add({ ref, slug: `pukang-table-de-lit-mobile-${ref.toLowerCase()}`, cat: C.soin, img: [ref.toLowerCase()],
  fr: { nom: `Table de lit mobile ${ref}`, description: "Table de lit PUKANG réglable en hauteur, sur base à roulettes, qui se glisse au-dessus du lit pour les repas ou les soins." },
  en: { nom: `Movable overbed table ${ref}`, description: "Height-adjustable PUKANG overbed table on castor base, slides over the bed for meals or care." },
  spec: [["ext", [`L${l} x l${w} x H${h} mm`, `L${l} x W${w} x H${h} mm`]], ["castor", mm(c)]] });

// ===== DB-40 (existing row, fixed) =============================================
const DB40_FIX = { id: DB40, ref: "DB-40", slug: "pukang-table-examen-electrique-db-40", cat: C.tab, img: ["db-40-c1", "db-40-c2"],
  fr: { nom: "Table d'examen électrique DB-40 (C1 / C2)", description: "Table d'examen électrique PUKANG à moteur linéaire et commande au pied, dossier sur vérin à gaz inclinable vers le haut et vers le bas, batterie, roulettes à frein individuel et matelas mousse. Deux versions : DB-40 (C1) et DB-40 (C2), plus large, avec changeur automatique de drap d'examen jetable (pleine largeur ou demi-largeur, moteur d'enroulement du papier). Fonctions : dossier vers le haut et vers le bas, hauteur variable, frein individuel, pédale de commande." },
  en: { nom: "Electric examination bed DB-40 (C1 / C2)", description: "PUKANG electric examination bed with linear motor and foot pedal, gas-spring backrest tilting up and down, battery, individual brake castors and foam mattress. Two versions: DB-40 (C1) and the wider DB-40 (C2) with automated disposable bed sheet changer (full or half width, paper rolling motor). Functions: backrest up and down, height adjustment, individual brake, foot pedal." },
  spec: [["ext", ["L1940 x l630 mm (C1) ; L2010 x l715 mm (C2)", "L1940 x W630 mm (C1); L2010 x W715 mm (C2)"]], ["gc", mm("545-775")], ["plat", dim(1940, 630)],
    ["back", ["0-45° (±5°) (C1) ; 0-60° (±5°) (C2)", "0-45° (±5°) (C1); 0-60° (±5°) (C2)"]], ["backDown", pm("0-30°")], ...tail({ castor: 125, swl: 200 })] };

for (const p of P) { p.fr.fiche_technique = fiche(p.spec, "fr"); p.en.fiche_technique = fiche(p.spec, "en"); }
DB40_FIX.fr.fiche_technique = fiche(DB40_FIX.spec, "fr"); DB40_FIX.en.fiche_technique = fiche(DB40_FIX.spec, "en");

module.exports = { P, DB40_FIX, NEWCATS, pimg }; // used by the local checks (images / slugs)
if (!MAIN) return;

// ---------------------------------------------------------------- snapshot
async function subtree() {
  const root = await prisma.categories.findUnique({ where: { slug: ROOT } });
  const subs = await prisma.categories.findMany({ where: { parent_id: root.id } });
  return { root, subs };
}
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const { root, subs } = await subtree();
  const ids = [root.id, ...subs.map((c) => c.id)];
  const cats = await prisma.categories.findMany({ where: { id: { in: ids } }, include: { category_translations: true } });
  const products = await prisma.products.findMany({ where: { category_id: { in: ids }, partner_id: PUKANG }, include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  const partner = await prisma.partners.findUnique({ where: { id: PUKANG } });
  const out = { taken_at: new Date().toISOString(), partner, categories: {}, products: {} };
  for (const c of cats) { const { category_translations, ...row } = c; out.categories[c.slug] = { row, translations: category_translations }; }
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: partner, ${cats.length} categories, ${products.length} PUKANG products -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const CODE_RE = /^([A-Z]{1,2}-[0-9A-Z]+(?:-1)?)/;

async function apply() {
  if (!exists(PDF)) console.log(`  [MISSING FILE] ${PDF}`);
  const { root, subs } = await subtree();
  const catId = Object.fromEntries(subs.map((c) => [c.slug, c.id]));
  const equipType = subs.find((c) => c.slug === "literie-hospitaliere").type;

  // partner default pdf
  const partner = await prisma.partners.findUnique({ where: { id: PUKANG } });
  if (partner.default_pdf_url !== PDF || partner.status !== "active") {
    console.log(`  partner PUKANG default_pdf_url -> ${PDF}${partner.status !== "active" ? ", status active" : ""}`);
    if (WRITE) await prisma.partners.update({ where: { id: PUKANG }, data: { default_pdf_url: PDF, status: "active", updated_at: now() } });
  } else console.log("  [SKIP] partner PUKANG");

  // new sub-categories
  for (const c of NEWCATS) {
    if (!exists(cimg(c.image))) console.log(`  [MISSING FILE] ${cimg(c.image)}`);
    catId[c.slug] = c.id;
    const row = await prisma.categories.findUnique({ where: { id: c.id } });
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » / « ${c.en} » (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, parent_id: root.id, sort_order: c.sort,
        is_active: true, type: equipType, image_url: cimg(c.image), updated_at: now(),
        category_translations: { create: [{ id: `${c.id}-fr`, language_code: "fr", name: c.fr }, { id: `${c.id}-en`, language_code: "en", name: c.en }] } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== root.id) data.parent_id = root.id;
    // image_url, name and sort_order are managed by later scripts (87 tiles / accents): never overwritten here
    if (!row.is_active) data.is_active = true;
    if (!Object.keys(data).length) { console.log(`  [SKIP] category ${c.slug}`); continue; }
    console.log(`  category ${c.slug} ${JSON.stringify(data)}`);
    if (WRITE) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
  }

  // created products + DB-40 fix
  let created = 0, updated = 0, skipped = 0;
  for (const p of [...P, DB40_FIX]) {
    for (const im of p.img) if (!exists(pimg(im))) console.log(`  [MISSING FILE] ${pimg(im)}`);
    const media = p.img.map((im, i) => ({ id: `${p.id}-m85-${i}`, type: "image", url: pimg(im), alt_text: p.fr.nom, title: p.fr.nom, sort_order: i, is_primary: i === 0 }));
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    if (!row) {
      if (BEFORE.products[p.id]) { console.log(`  [MISSING PRODUCT] ${p.id}`); continue; }
      const clash = await prisma.products.findFirst({ where: { OR: [{ slug: p.slug }, { reference_fournisseur: p.ref }] } });
      if (clash) { console.log(`  [CLASH] ${p.ref} / ${p.slug} already used by ${clash.id} (${clash.reference_fournisseur} / ${clash.slug})`); continue; }
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat} (${media.length} photo${media.length > 1 ? "s" : ""})`);
      created += 1;
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat],
        constructeur: "pukang", partner_id: PUKANG, status: "active", sort_order: 99, pdf_brochure_url: PDF, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, nom: p[lang].nom, description: p[lang].description, fiche_technique: p[lang].fiche_technique })) },
        product_media: { create: media } } });
      continue;
    }
    const data = {};
    if (row.category_id !== catId[p.cat]) data.category_id = catId[p.cat];
    if (row.status !== "active") data.status = "active";
    if (row.slug !== p.slug) data.slug = p.slug;
    if (row.reference_fournisseur !== p.ref) data.reference_fournisseur = p.ref;
    if (row.pdf_brochure_url !== PDF) data.pdf_brochure_url = PDF;
    if (row.partner_id !== PUKANG) data.partner_id = PUKANG;
    if (row.constructeur !== "pukang") data.constructeur = "pukang";
    const tr = [];
    for (const lang of ["fr", "en"]) {
      const t = row.product_translations.find((x) => x.language_code === lang);
      if (!t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k]))) tr.push(lang);
    }
    const mediaOk = row.product_media.length === media.length && media.every((m) => row.product_media.some((x) => x.url === m.url && x.is_primary === m.is_primary && x.sort_order === m.sort_order));
    if (!Object.keys(data).length && !tr.length && mediaOk) { skipped += 1; continue; }
    updated += 1;
    const fr = row.product_translations.find((x) => x.language_code === "fr");
    console.log(`  product ${row.slug} « ${fr?.nom?.trim()} » -> « ${p.fr.nom} »`);
    console.log(`      ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : ` photos ${media.map((m) => m.url).join(", ")} (replace ${row.product_media.length})`}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) {
        const f = { nom: p[lang].nom, description: p[lang].description, fiche_technique: p[lang].fiche_technique };
        await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: p.id, language_code: lang } }, update: f, create: { id: crypto.randomUUID(), product_id: p.id, language_code: lang, ...f } });
      }
      if (!mediaOk) {
        await tx.product_media.deleteMany({ where: { product_id: p.id } });
        for (const m of media) await tx.product_media.create({ data: { ...m, product_id: p.id } });
      }
    });
  }
  console.log(`  products: ${created} to create, ${updated} to update, ${skipped} unchanged`);

  // catalogue PDF on the existing PUKANG products whose code is in the catalogue
  const inCatalogue = new Set(["DA-2", "DA-3", "DA-7", "DA-11", "A-5", "B-16", "B-23", "B-36", "B-45", "B-46", "B-48", "H-3", "H-12", "R-1", "R-2", "R-3",
    "E-2", "E-3", "E-4", "E-5", "E-6", "E-8", "E-9", "F-20", "F-21", "F-32", "F-45", "F-46", "F-47", "F-50", "F-51", "F-52", "F-53", "G-9", "G-11"]);
  const ours = new Set([...P.map((p) => p.id), DB40]);
  const existing = await prisma.products.findMany({ where: { partner_id: PUKANG, category_id: { in: Object.values(catId) }, status: "active" } });
  for (const row of existing) {
    if (ours.has(row.id)) continue;
    const code = (row.reference_fournisseur.match(CODE_RE) || [])[1];
    if (!inCatalogue.has(code)) { console.log(`  [KEEP] ${row.reference_fournisseur} ${row.slug}: not in the 2026 catalogue, no PDF`); continue; }
    if (row.pdf_brochure_url) { console.log(`  [SKIP] pdf ${row.reference_fournisseur}`); continue; }
    console.log(`  pdf -> ${row.reference_fournisseur} ${row.slug}`);
    if (WRITE) await prisma.products.update({ where: { id: row.id }, data: { pdf_brochure_url: PDF, updated_at: now() } });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  product ${b.row.slug}`);
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
  const del = await prisma.products.deleteMany({ where: { id: { in: P.map((p) => p.id).filter((id) => !BEFORE.products[id]) } } });
  console.log(`  - deleted ${del.count} created products`);
  for (const c of NEWCATS) {
    if (!(await prisma.categories.findUnique({ where: { id: c.id } }))) continue;
    const k = await prisma.products.count({ where: { category_id: c.id } });
    if (k) { console.log(`  [KEEP] ${c.slug} has ${k} products`); continue; }
    console.log(`  - delete category ${c.slug}`);
    await prisma.categories.delete({ where: { id: c.id } });
  }
  const { id, created_at, ...prow } = BEFORE.partner;
  console.log("  partner PUKANG");
  await prisma.partners.update({ where: { id }, data: { ...prow, updated_at: now() } });
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
