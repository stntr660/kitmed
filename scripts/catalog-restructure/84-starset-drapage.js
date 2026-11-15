const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- Lot D: Star-Set (Turkey) sterile single-use drapes, gowns and procedure packs,
 * built from the client catalogue « CATALOGUE STARSET.pdf » (34 pages, image only).
 *
 * Fills the root category « Drapage » (slug drapage, created empty by script 79) with
 * 15 sub-categories (slug prefix starset-) and 84 products, partner Star-set:
 *
 *   Chirurgie générale (6 sets SGC, incl. thyroid SGC 116R2)   Cœlioscopie (SLP x2)
 *   Chirurgie cardiovasculaire (SBP x3, SKP)                   Cardiologie / angiographie (SAN x5)
 *   Orthopédie (SAR x4, SKL x2, SVR, SET)                      Neurochirurgie (SBC x4)
 *   Urologie (SSI, STU x2, SPR + TUR drape)                    Gynécologie-obstétrique (SDG x2, SIV x3, SSZ x3)
 *   Ophtalmologie (SGZ x4 + 3 eye drapes)                      ORL (SKB x2)    Dentaire / implantologie (SCC x2)
 *   Casaques chirurgicales (standard, renforcée)               Champs et accessoires à l'unité (13)
 *   Tenues non stériles (8)                                    Protection et hygiène, non stérile (8)
 *
 * One product per set reference (ref = « SGC 137R6 » exactly as printed), its bill of materials in
 * the fiche technique (qty x item (code) — size — material, carton quantity, material legend from
 * the catalogue's material guide). Single items sold in sizes are one product with the codes listed;
 * their ref is the list of codes. Photos are crops of the catalogue drawings (starset-*.jpg).
 *
 * The 4 archived Star-set rows (402516 plain, 426116 adhesive, 432516 fenestrated, 452516 adhesive
 * fenestrated; wrongly filed under ophthalmology) are reused for the 4 drape families: texts,
 * photo, category, status active. Every product gets the catalogue PDF as brochure; the partner
 * gets it as default_pdf_url. The root « drapage » row itself is not modified.
 *
 * REVERT POINT: 84-before.json (taken by --snapshot) holds the 4 reused products (row,
 * translations, media), the partner row and the drapage row. --revert writes them back, deletes
 * the 80 created products and the 15 sub-categories.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 84-starset-drapage.js <app>:/tmp/84.js
 *   docker cp 84-before.json <app>:/tmp/84-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/84.js --snapshot   # once
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/84.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/84.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/84.js --revert
 * The starset-*.jpg photos (products/), starset-tile-*.jpg tiles (categories/) and
 * starset-catalogue-2023.pdf (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "84-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();

const ROOT = "drapage";
const PARTNER = "3e36b3f4-67b3-4cdd-8563-f1cec7789f47"; // Star-set
const CONSTRUCTEUR = "Star-set";
const PDF = "/uploads/pdfs/starset-catalogue-2023.pdf";
const pimg = (n) => `/uploads/products/${n}.jpg`;
const cimg = (n) => `/uploads/categories/${n}`;
const cid = (n) => `c84a0001-0000-4000-8000-${String(n).padStart(12, "0")}`;
const pid = (n) => `d84a0001-0000-4000-8000-${String(n).padStart(12, "0")}`;

// ---------------------------------------------------------------- data (generated from the catalogue)
const DATA = {
 "categories": [
  {
   "key": "generale",
   "slug": "starset-chirurgie-generale",
   "fr": "Chirurgie générale",
   "en": "General surgery",
   "image": "starset-tile-chirurgie-generale.jpg"
  },
  {
   "key": "coelioscopie",
   "slug": "starset-coelioscopie",
   "fr": "Cœlioscopie",
   "en": "Laparoscopy",
   "image": "starset-tile-coelioscopie.jpg"
  },
  {
   "key": "cardiovasculaire",
   "slug": "starset-chirurgie-cardiovasculaire",
   "fr": "Chirurgie cardiovasculaire",
   "en": "Cardiovascular surgery",
   "image": "starset-tile-chirurgie-cardiovasculaire.jpg"
  },
  {
   "key": "angiographie",
   "slug": "starset-cardiologie-angiographie",
   "fr": "Cardiologie / angiographie",
   "en": "Cardiology / angiography",
   "image": "starset-tile-cardiologie-angiographie.jpg"
  },
  {
   "key": "orthopedie",
   "slug": "starset-orthopedie",
   "fr": "Orthopédie",
   "en": "Orthopaedics",
   "image": "starset-tile-orthopedie.jpg"
  },
  {
   "key": "neurochirurgie",
   "slug": "starset-neurochirurgie",
   "fr": "Neurochirurgie",
   "en": "Neurosurgery",
   "image": "starset-tile-neurochirurgie.jpg"
  },
  {
   "key": "urologie",
   "slug": "starset-urologie",
   "fr": "Urologie",
   "en": "Urology",
   "image": "starset-tile-urologie.jpg"
  },
  {
   "key": "gyneco",
   "slug": "starset-gynecologie-obstetrique",
   "fr": "Gynécologie-obstétrique",
   "en": "Obstetrics & gynaecology",
   "image": "starset-tile-gynecologie-obstetrique.jpg"
  },
  {
   "key": "ophtalmologie",
   "slug": "starset-ophtalmologie",
   "fr": "Ophtalmologie",
   "en": "Ophthalmology",
   "image": "starset-tile-ophtalmologie.jpg"
  },
  {
   "key": "orl",
   "slug": "starset-orl",
   "fr": "ORL",
   "en": "E.N.T.",
   "image": "starset-tile-orl.jpg"
  },
  {
   "key": "dentaire",
   "slug": "starset-dentaire-implantologie",
   "fr": "Dentaire / implantologie",
   "en": "Dental / implantology",
   "image": "starset-tile-dentaire-implantologie.jpg"
  },
  {
   "key": "casaques",
   "slug": "starset-casaques-chirurgicales",
   "fr": "Casaques chirurgicales",
   "en": "Surgical gowns",
   "image": "starset-tile-casaques-chirurgicales.jpg"
  },
  {
   "key": "unite",
   "slug": "starset-champs-accessoires",
   "fr": "Champs et accessoires à l'unité",
   "en": "Single drapes and accessories",
   "image": "starset-tile-champs-accessoires.jpg"
  },
  {
   "key": "tenues",
   "slug": "starset-tenues-non-steriles",
   "fr": "Tenues non stériles",
   "en": "Non-sterile gowns and wear",
   "image": "starset-tile-tenues-non-steriles.jpg"
  },
  {
   "key": "protection",
   "slug": "starset-protection-hygiene",
   "fr": "Protection et hygiène (non stérile)",
   "en": "Protection and hygiene (non-sterile)",
   "image": "starset-tile-protection-hygiene.jpg"
  }
 ],
 "products": [
  {
   "key": "SGC 137R6",
   "ref": "SGC 137R6",
   "slug": "starset-sgc-137r6-universal-surgery-set",
   "cat": "generale",
   "img": "starset-sgc-137r6",
   "fr": {
    "nom": "Set de chirurgie générale SGC 137R6",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 137R6), 7 références / 11 pièces : champ d'anesthésie avec bande adhésive x 1, champ inférieur avec bande adhésive x 1, champ latéral avec bande adhésive x 2, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'anesthésie avec bande adhésive (424416A) — 150 x 240 cm — ST16\n1 x Champ inférieur avec bande adhésive (424316A) — 150 x 180 cm — ST16\n2 x Champ latéral avec bande adhésive (422916A) — 75 x 90 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 16 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Universal surgery set SGC 137R6",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 137R6), 7 items / 11 pieces: anesthesia drape with adhesive tape x 1, bottom drape with adhesive tape x 1, side drape with adhesive tape x 2, op-tape x 1, mayo stand cover x 1, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Anesthesia drape with adhesive tape (424416A) — 150 x 240 cm — ST16\n1 x Bottom drape with adhesive tape (424316A) — 150 x 180 cm — ST16\n2 x Side drape with adhesive tape (422916A) — 75 x 90 cm — ST16\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 16 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGC 101",
   "ref": "SGC 101",
   "slug": "starset-sgc-101-universal-surgery-set",
   "cat": "generale",
   "img": "starset-sgc-101",
   "fr": {
    "nom": "Set de chirurgie générale SGC 101",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 101), 7 références / 11 pièces : champ d'anesthésie avec bande adhésive x 1, champ inférieur avec bande adhésive x 1, champ latéral avec bande adhésive x 2, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'anesthésie avec bande adhésive (424420) — 150 x 240 cm — ST20\n1 x Champ inférieur avec bande adhésive (424320) — 150 x 180 cm — ST20\n2 x Champ latéral avec bande adhésive (422920) — 75 x 90 cm — ST20\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Universal surgery set SGC 101",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 101), 7 items / 11 pieces: anesthesia drape with adhesive tape x 1, bottom drape with adhesive tape x 1, side drape with adhesive tape x 2, op-tape x 1, mayo stand cover x 1, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Anesthesia drape with adhesive tape (424420) — 150 x 240 cm — ST20\n1 x Bottom drape with adhesive tape (424320) — 150 x 180 cm — ST20\n2 x Side drape with adhesive tape (422920) — 75 x 90 cm — ST20\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGC 118",
   "ref": "SGC 118",
   "slug": "starset-sgc-118-universal-surgery-set",
   "cat": "generale",
   "img": "starset-sgc-118",
   "fr": {
    "nom": "Set de chirurgie générale SGC 118",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 118), 7 références / 11 pièces : champ d'anesthésie avec bande adhésive x 1, champ inférieur avec bande adhésive x 1, champ latéral avec bande adhésive x 2, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'anesthésie avec bande adhésive (424416) — 150 x 240 cm — ST16\n1 x Champ inférieur avec bande adhésive (424316) — 150 x 180 cm — ST16\n2 x Champ latéral avec bande adhésive (422916) — 75 x 90 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Universal surgery set SGC 118",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 118), 7 items / 11 pieces: anesthesia drape with adhesive tape x 1, bottom drape with adhesive tape x 1, side drape with adhesive tape x 2, op-tape x 1, mayo stand cover x 1, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Anesthesia drape with adhesive tape (424416) — 150 x 240 cm — ST16\n1 x Bottom drape with adhesive tape (424316) — 150 x 180 cm — ST16\n2 x Side drape with adhesive tape (422916) — 75 x 90 cm — ST16\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGC 128R1",
   "ref": "SGC 128R1",
   "slug": "starset-sgc-128r1-universal-surgery-set",
   "cat": "generale",
   "img": "starset-sgc-128r1",
   "fr": {
    "nom": "Set de chirurgie générale SGC 128R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 128R1), 9 références / 13 pièces : champ d'anesthésie avec bande adhésive x 1, champ inférieur avec bande adhésive x 1, champ latéral avec bande adhésive x 2, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, casaque chirurgicale standard x 1, casaque chirurgicale renforcée x 1, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'anesthésie avec bande adhésive (424416) — 150 x 240 cm — ST16\n1 x Champ inférieur avec bande adhésive (424316) — 150 x 180 cm — ST16\n2 x Champ latéral avec bande adhésive (422916) — 75 x 90 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Casaque chirurgicale standard (110418) — XL — ST18\n1 x Casaque chirurgicale renforcée (120419) — XL — ST19\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Universal surgery set SGC 128R1",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 128R1), 9 items / 13 pieces: anesthesia drape with adhesive tape x 1, bottom drape with adhesive tape x 1, side drape with adhesive tape x 2, op-tape x 1, mayo stand cover x 1, standard surgical gown x 1, reinforced surgical gown x 1, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Anesthesia drape with adhesive tape (424416) — 150 x 240 cm — ST16\n1 x Bottom drape with adhesive tape (424316) — 150 x 180 cm — ST16\n2 x Side drape with adhesive tape (422916) — 75 x 90 cm — ST16\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Standard surgical gown (110418) — XL — ST18\n1 x Reinforced surgical gown (120419) — XL — ST19\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGC 108R1",
   "ref": "SGC 108R1",
   "slug": "starset-sgc-108r1-universal-surgery-set-large-pack",
   "cat": "generale",
   "img": "starset-sgc-108r1",
   "fr": {
    "nom": "Grand set de chirurgie générale SGC 108R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 108R1), 9 références / 22 pièces : champ avec bande adhésive x 2, champ avec bande adhésive x 5, champ simple x 1, bande adhésive non tissée (op-tape) x 2, housse de table Mayo x 1, casaque chirurgicale renforcée x 4, essuie-mains x 4, champ de table d'instruments x 2, feuille de stérilisation x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n2 x Champ avec bande adhésive (426616) — 100 x 150 cm — ST16\n5 x Champ avec bande adhésive (424316) — 150 x 180 cm — ST16\n1 x Champ simple (4010916) — 150 x 160 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (6316120) — 10 x 30 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n4 x Casaque chirurgicale renforcée (120419) — XL — ST19\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n2 x Champ de table d'instruments (5621916) — 200 x 200 cm — ST16\n1 x Feuille de stérilisation (913313) — 100 x 100 cm — ST13\nConditionnement : 6 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Universal surgery set (large pack) SGC 108R1",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 108R1), 9 items / 22 pieces: adhesive tape drape x 2, adhesive tape drape x 5, plain drape x 1, op-tape x 2, mayo stand cover x 1, reinforced surgical gown x 4, towel x 4, instrument table cover x 2, sterilization wrap x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n2 x Adhesive tape drape (426616) — 100 x 150 cm — ST16\n5 x Adhesive tape drape (424316) — 150 x 180 cm — ST16\n1 x Plain drape (4010916) — 150 x 160 cm — ST16\n2 x Op-tape (6316120) — 10 x 30 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n4 x Reinforced surgical gown (120419) — XL — ST19\n4 x Towel (761583) — 40 x 40 cm — ST83\n2 x Instrument table cover (5621916) — 200 x 200 cm — ST16\n1 x Sterilization wrap (913313) — 100 x 100 cm — ST13\nPacking: 6 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SLP 102R5",
   "ref": "SLP 102R5",
   "slug": "starset-slp-102r5-laparoscopy-set",
   "cat": "coelioscopie",
   "img": "starset-slp-102r5",
   "fr": {
    "nom": "Set de cœlioscopie SLP 102R5",
    "description": "Set stérile à usage unique Star-Set pour la cœlioscopie (réf. SLP 102R5), 7 références / 9 pièces : champ de cœlioscopie x 1, bande adhésive non tissée (op-tape) x 1, set d'aspiration x 1, housse de table Mayo x 1, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de cœlioscopie (465316) — 200 x 300 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Set d'aspiration (168001) — 180\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Laparoscopy set SLP 102R5",
    "description": "Star-Set sterile single-use set for laparoscopy (ref. SLP 102R5), 7 items / 9 pieces: laparoscopy drape x 1, op-tape x 1, suction set x 1, mayo stand cover x 1, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Laparoscopy drape (465316) — 200 x 300 cm — ST16\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Suction set (168001) — 180\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGC 116R2",
   "ref": "SGC 116R2",
   "slug": "starset-sgc-116r2-thyroid-set",
   "cat": "generale",
   "img": "starset-sgc-116r2",
   "fr": {
    "nom": "Set thyroïde SGC 116R2",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie générale (réf. SGC 116R2), 6 références / 10 pièces : champ thyroïde x 1, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 2, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ thyroïde (457016) — 240 x 320 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (6316120) — 10 x 30 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 8 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Thyroid set SGC 116R2",
    "description": "Star-Set sterile single-use set for general surgery (ref. SGC 116R2), 6 items / 10 pieces: thyroid drape x 1, op-tape x 1, mayo stand cover x 1, reinforced surgical gown x 2, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Thyroid drape (457016) — 240 x 320 cm — ST16\n1 x Op-tape (6316120) — 10 x 30 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Reinforced surgical gown (120419) — XL — ST19\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 8 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SLP 100R1",
   "ref": "SLP 100R1",
   "slug": "starset-slp-100r1-laparoscopy-set",
   "cat": "coelioscopie",
   "img": "starset-slp-100r1",
   "fr": {
    "nom": "Set de cœlioscopie SLP 100R1",
    "description": "Set stérile à usage unique Star-Set pour la cœlioscopie (réf. SLP 100R1), 3 références / 3 pièces : champ de cœlioscopie x 1, essuie-mains x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de cœlioscopie (465316) — 200 x 300 cm — ST16\n1 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Laparoscopy set SLP 100R1",
    "description": "Star-Set sterile single-use set for laparoscopy (ref. SLP 100R1), 3 items / 3 pieces: laparoscopy drape x 1, towel x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Laparoscopy drape (465316) — 200 x 300 cm — ST16\n1 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBP 119R2",
   "ref": "SBP 119R2",
   "slug": "starset-sbp-119r2-by-pass-set",
   "cat": "cardiovasculaire",
   "img": "starset-sbp-119r2",
   "fr": {
    "nom": "Set pontage coronarien (by-pass) SBP 119R2",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie cardiovasculaire (réf. SBP 119R2), 8 références / 13 pièces : champ de pontage (by-pass) x 1, champ fendu en U x 1, bande adhésive non tissée (op-tape) x 2, poche plastique x 2, essuie-mains x 4, housse de table Mayo x 1, couvre-pieds (paire) x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de pontage (by-pass) (545416) — 240 x 306 cm — ST16\n1 x Champ fendu en U (495216) — 200 x 260 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Poche plastique (651946) — 28 x 33 cm — ST46\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Couvre-pieds (paire) (805020) — 25 x 40 cm — ST20\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "By-pass set SBP 119R2",
    "description": "Star-Set sterile single-use set for cardiovascular surgery (ref. SBP 119R2), 8 items / 13 pieces: by-pass drape x 1, u-slotted drape x 1, op-tape x 2, plastic pouches x 2, towel x 4, mayo stand cover x 1, foot cover (pair) x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x By-pass drape (545416) — 240 x 306 cm — ST16\n1 x U-slotted drape (495216) — 200 x 260 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Plastic pouches (651946) — 28 x 33 cm — ST46\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Foot cover (pair) (805020) — 25 x 40 cm — ST20\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBP 105R3",
   "ref": "SBP 105R3",
   "slug": "starset-sbp-105r3-by-pass-set",
   "cat": "cardiovasculaire",
   "img": "starset-sbp-105r3",
   "fr": {
    "nom": "Set pontage coronarien (by-pass) SBP 105R3",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie cardiovasculaire (réf. SBP 105R3), 8 références / 13 pièces : champ de pontage (by-pass) x 1, champ fendu en U x 1, bande adhésive non tissée (op-tape) x 2, poche plastique x 2, essuie-mains x 4, housse de table Mayo x 1, couvre-pieds (paire) x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de pontage (by-pass) (5425816A) — 240 x 330 cm — ST16\n1 x Champ fendu en U (495216) — 200 x 260 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Poche plastique (651946) — 28 x 33 cm — ST46\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Couvre-pieds (paire) (805020) — 25 x 40 cm — ST20\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "By-pass set SBP 105R3",
    "description": "Star-Set sterile single-use set for cardiovascular surgery (ref. SBP 105R3), 8 items / 13 pieces: by-pass drape x 1, u-slotted drape x 1, op-tape x 2, plastic pouches x 2, towel x 4, mayo stand cover x 1, foot cover (pair) x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x By-pass drape (5425816A) — 240 x 330 cm — ST16\n1 x U-slotted drape (495216) — 200 x 260 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Plastic pouches (651946) — 28 x 33 cm — ST46\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Foot cover (pair) (805020) — 25 x 40 cm — ST20\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBP 117R1",
   "ref": "SBP 117R1",
   "slug": "starset-sbp-117r1-by-pass-set",
   "cat": "cardiovasculaire",
   "img": "starset-sbp-117r1",
   "fr": {
    "nom": "Set pontage coronarien (by-pass) SBP 117R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie cardiovasculaire (réf. SBP 117R1), 9 références / 15 pièces : champ de pontage (by-pass) x 1, champ fendu en U x 1, bande adhésive non tissée (op-tape) x 2, poche plastique x 2, essuie-mains x 4, housse de table Mayo x 1, casaque chirurgicale renforcée x 2, couvre-pieds (paire) x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de pontage (by-pass) (545416) — 240 x 306 cm — ST16\n1 x Champ fendu en U (495216) — 200 x 260 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Poche plastique (651946) — 28 x 33 cm — ST46\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n1 x Couvre-pieds (paire) (805020) — 25 x 40 cm — ST20\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "By-pass set SBP 117R1",
    "description": "Star-Set sterile single-use set for cardiovascular surgery (ref. SBP 117R1), 9 items / 15 pieces: by-pass drape x 1, u-slotted drape x 1, op-tape x 2, plastic pouches x 2, towel x 4, mayo stand cover x 1, reinforced surgical gown x 2, foot cover (pair) x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x By-pass drape (545416) — 240 x 306 cm — ST16\n1 x U-slotted drape (495216) — 200 x 260 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Plastic pouches (651946) — 28 x 33 cm — ST46\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Reinforced surgical gown (120419) — XL — ST19\n1 x Foot cover (pair) (805020) — 25 x 40 cm — ST20\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SKP 108R2",
   "ref": "SKP 108R2",
   "slug": "starset-skp-108r2-valve-replacement-set",
   "cat": "cardiovasculaire",
   "img": "starset-skp-108r2",
   "fr": {
    "nom": "Set remplacement valvulaire SKP 108R2",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie cardiovasculaire (réf. SKP 108R2), 6 références / 11 pièces : champ de pontage (by-pass) x 1, bande adhésive non tissée (op-tape) x 2, poche plastique x 2, essuie-mains x 4, housse de table Mayo x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de pontage (by-pass) (545416) — 240 x 306 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Poche plastique (651946) — 28 x 33 cm — ST46\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 18 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Valve replacement set SKP 108R2",
    "description": "Star-Set sterile single-use set for cardiovascular surgery (ref. SKP 108R2), 6 items / 11 pieces: by-pass drape x 1, op-tape x 2, plastic pouches x 2, towel x 4, mayo stand cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x By-pass drape (545416) — 240 x 306 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Plastic pouches (651946) — 28 x 33 cm — ST46\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 18 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAN 110R1",
   "ref": "SAN 110R1",
   "slug": "starset-san-110r1-angiography-set",
   "cat": "angiographie",
   "img": "starset-san-110r1",
   "fr": {
    "nom": "Set d'angiographie SAN 110R1",
    "description": "Set stérile à usage unique Star-Set pour la cardiologie interventionnelle et l'angiographie (réf. SAN 110R1), 11 références / 24 pièces : champ d'angiographie x 1, housse de fluoroscopie x 1, cupule à solution x 1, cupule à solution x 1, haricot x 1, bassin pour guide x 1, éponge de badigeonnage x 1, compresses de gaze x 10, casaque chirurgicale standard x 2, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'angiographie (4712716) — 150 x 300 cm — ST16\n1 x Housse de fluoroscopie (645040) — Ø 85 cm — ST40\n1 x Cupule à solution (116001) — 250cc\n1 x Cupule à solution (118001) — 500cc\n1 x Haricot (140001) — 700cc\n1 x Bassin pour guide (120004) — 2500cc\n1 x Éponge de badigeonnage (940001)\n10 x Compresses de gaze (770002) — 7,5 x 7,5 cm — ST88\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 6 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST40 = PE transparent antistatique 40 µ (laize 90 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m² ; ST88 = gaze textile"
   },
   "en": {
    "nom": "Angiography set SAN 110R1",
    "description": "Star-Set sterile single-use set for interventional cardiology and angiography (ref. SAN 110R1), 11 items / 24 pieces: angiography drape x 1, fluoroscopy cover x 1, solution bowl x 1, solution bowl x 1, kidney bowl x 1, guide wire bowl x 1, painting sponge x 1, textile gauze x 10, standard surgical gown x 2, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Angiography drape (4712716) — 150 x 300 cm — ST16\n1 x Fluoroscopy cover (645040) — Ø 85 cm — ST40\n1 x Solution bowl (116001) — 250cc\n1 x Solution bowl (118001) — 500cc\n1 x Kidney bowl (140001) — 700cc\n1 x Guide wire bowl (120004) — 2500cc\n1 x Painting sponge (940001)\n10 x Textile gauze (770002) — 7,5 x 7,5 cm — ST88\n2 x Standard surgical gown (110418) — XL — ST18\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 6 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST40 = anti-static transparent PE 40 µ (90 cm) ; ST83 = lint-free towel, 63 gsm ; ST88 = textile gauze"
   }
  },
  {
   "key": "SAN 155R2",
   "ref": "SAN 155R2",
   "slug": "starset-san-155r2-radial-angiography-set",
   "cat": "angiographie",
   "img": "starset-san-155r2",
   "fr": {
    "nom": "Set d'angiographie radiale SAN 155R2",
    "description": "Set stérile à usage unique Star-Set pour la cardiologie interventionnelle et l'angiographie (réf. SAN 155R2), 9 références / 18 pièces : champ d'angiographie radiale x 1, housse de fluoroscopie x 1, bassin pour guide x 1, housse de panneau x 1, alèse x 1, champ avec bande adhésive x 1, casaque chirurgicale standard x 2, essuie-mains x 8, champ de table d'instruments x 2. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'angiographie radiale (4725820) — 240 x 330 cm — ST20\n1 x Housse de fluoroscopie (643743) — Ø 120 cm — ST43\n1 x Bassin pour guide (120004) — 2500cc\n1 x Housse de panneau (6719940) — 120 x 140 cm — ST40\n1 x Alèse (4061145) — 60 x 90 cm — ST145\n1 x Champ avec bande adhésive (422525) — 50 x 50 cm — ST25\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n8 x Essuie-mains (761583) — 40 x 40 cm — ST83\n2 x Champ de table d'instruments (564016) — 140 x 150 cm — ST16\nConditionnement : 6 sets par carton\nMatières : ST145 = champ bébé coton très absorbant ; ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST25 = matériau très absorbant, 104 g/m² ; ST40 = PE transparent antistatique 40 µ (laize 90 cm) ; ST43 = PE transparent antistatique 40 µ (laize 120 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Radial angiography set SAN 155R2",
    "description": "Star-Set sterile single-use set for interventional cardiology and angiography (ref. SAN 155R2), 9 items / 18 pieces: radial angiography drape x 1, fluoroscopy cover x 1, guide wire bowl x 1, panel drape x 1, underpad x 1, adhesive tape drape x 1, standard surgical gown x 2, towel x 8, instrument table cover x 2. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Radial angiography drape (4725820) — 240 x 330 cm — ST20\n1 x Fluoroscopy cover (643743) — Ø 120 cm — ST43\n1 x Guide wire bowl (120004) — 2500cc\n1 x Panel drape (6719940) — 120 x 140 cm — ST40\n1 x Underpad (4061145) — 60 x 90 cm — ST145\n1 x Adhesive tape drape (422525) — 50 x 50 cm — ST25\n2 x Standard surgical gown (110418) — XL — ST18\n8 x Towel (761583) — 40 x 40 cm — ST83\n2 x Instrument table cover (564016) — 140 x 150 cm — ST16\nPacking: 6 sets per carton\nMaterials: ST145 = high absorbent cotton baby drape ; ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST20 = viscose + PE film, 56 gsm ; ST25 = high absorbent material, 104 gsm ; ST40 = anti-static transparent PE 40 µ (90 cm) ; ST43 = anti-static transparent PE 40 µ (120 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAN 114R1",
   "ref": "SAN 114R1",
   "slug": "starset-san-114r1-angiography-set",
   "cat": "angiographie",
   "img": "starset-san-114r1",
   "fr": {
    "nom": "Set d'angiographie SAN 114R1",
    "description": "Set stérile à usage unique Star-Set pour la cardiologie interventionnelle et l'angiographie (réf. SAN 114R1), 6 références / 8 pièces : champ d'angiographie x 1, éponge de badigeonnage x 1, casaque chirurgicale standard x 2, essuie-mains x 2, housse de fluoroscopie x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'angiographie (4712716A) — 150 x 300 cm — ST16\n1 x Éponge de badigeonnage (940001)\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de fluoroscopie (643343) — Ø 100 cm — ST43\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST43 = PE transparent antistatique 40 µ (laize 120 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Angiography set SAN 114R1",
    "description": "Star-Set sterile single-use set for interventional cardiology and angiography (ref. SAN 114R1), 6 items / 8 pieces: angiography drape x 1, painting sponge x 1, standard surgical gown x 2, towel x 2, fluoroscopy cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Angiography drape (4712716A) — 150 x 300 cm — ST16\n1 x Painting sponge (940001)\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Fluoroscopy cover (643343) — Ø 100 cm — ST43\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST43 = anti-static transparent PE 40 µ (120 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAN 100R2",
   "ref": "SAN 100R2",
   "slug": "starset-san-100r2-angiography-set",
   "cat": "angiographie",
   "img": "starset-san-100r2",
   "fr": {
    "nom": "Set d'angiographie SAN 100R2",
    "description": "Set stérile à usage unique Star-Set pour la cardiologie interventionnelle et l'angiographie (réf. SAN 100R2), 4 références / 5 pièces : champ d'angiographie x 1, essuie-mains x 2, housse de fluoroscopie x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'angiographie (474416) — 150 x 240 cm — ST16\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de fluoroscopie (645040) — Ø 85 cm — ST40\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 30 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST40 = PE transparent antistatique 40 µ (laize 90 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Angiography set SAN 100R2",
    "description": "Star-Set sterile single-use set for interventional cardiology and angiography (ref. SAN 100R2), 4 items / 5 pieces: angiography drape x 1, towel x 2, fluoroscopy cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Angiography drape (474416) — 150 x 240 cm — ST16\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Fluoroscopy cover (645040) — Ø 85 cm — ST40\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 30 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST40 = anti-static transparent PE 40 µ (90 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAN 134R4",
   "ref": "SAN 134R4",
   "slug": "starset-san-134r4-angiography-set",
   "cat": "angiographie",
   "img": "starset-san-134r4",
   "fr": {
    "nom": "Set d'angiographie SAN 134R4",
    "description": "Set stérile à usage unique Star-Set pour la cardiologie interventionnelle et l'angiographie (réf. SAN 134R4), 5 références / 5 pièces : champ d'angiographie x 1, éponge de badigeonnage x 1, essuie-mains x 1, housse de fluoroscopie x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'angiographie (475316) — 200 x 300 cm — ST16\n1 x Éponge de badigeonnage (940001)\n1 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de fluoroscopie (645040) — Ø 85 cm — ST40\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST40 = PE transparent antistatique 40 µ (laize 90 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Angiography set SAN 134R4",
    "description": "Star-Set sterile single-use set for interventional cardiology and angiography (ref. SAN 134R4), 5 items / 5 pieces: angiography drape x 1, painting sponge x 1, towel x 1, fluoroscopy cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Angiography drape (475316) — 200 x 300 cm — ST16\n1 x Painting sponge (940001)\n1 x Towel (761583) — 40 x 40 cm — ST83\n1 x Fluoroscopy cover (645040) — Ø 85 cm — ST40\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST40 = anti-static transparent PE 40 µ (90 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAR 105R2",
   "ref": "SAR 105R2",
   "slug": "starset-sar-105r2-arthroscopy-set",
   "cat": "orthopedie",
   "img": "starset-sar-105r2",
   "fr": {
    "nom": "Set d'arthroscopie SAR 105R2",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SAR 105R2), 6 références / 7 pièces : champ d'arthroscopie avec poche de recueil des liquides x 1, jersey tubulaire x 1, bande adhésive non tissée (op-tape) x 2, bande élastique x 1, housse de caméra x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'arthroscopie avec poche de recueil des liquides (598216) — 200 x 320 cm — ST16\n1 x Jersey tubulaire (726516) — 36 x 75 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Bande élastique (112001) — 15 x 150 cm\n1 x Housse de caméra (665045) — 13,5 x 200 cm — ST45\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 16 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m²"
   },
   "en": {
    "nom": "Arthroscopy set SAR 105R2",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SAR 105R2), 6 items / 7 pieces: arthroscopy drape L.C.P. x 1, stockinet x 1, op-tape x 2, elastic bandage x 1, camera cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Arthroscopy drape L.C.P. (598216) — 200 x 320 cm — ST16\n1 x Stockinet (726516) — 36 x 75 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Elastic bandage (112001) — 15 x 150 cm\n1 x Camera cover (665045) — 13,5 x 200 cm — ST45\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 16 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm"
   }
  },
  {
   "key": "SAR 122R6",
   "ref": "SAR 122R6",
   "slug": "starset-sar-122r6-arthroscopy-set",
   "cat": "orthopedie",
   "img": "starset-sar-122r6",
   "fr": {
    "nom": "Set d'arthroscopie SAR 122R6",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SAR 122R6), 5 références / 5 pièces : champ genou x 1, jersey tubulaire x 1, bande élastique x 1, bande adhésive non tissée (op-tape) x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ genou (585316) — 200 x 300 cm — ST16\n1 x Jersey tubulaire (721616) — 40 x 60 cm — ST16\n1 x Bande élastique (112001) — 15 x 150 cm\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m²"
   },
   "en": {
    "nom": "Arthroscopy set SAR 122R6",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SAR 122R6), 5 items / 5 pieces: knee drape x 1, stockinet x 1, elastic bandage x 1, op-tape x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Knee drape (585316) — 200 x 300 cm — ST16\n1 x Stockinet (721616) — 40 x 60 cm — ST16\n1 x Elastic bandage (112001) — 15 x 150 cm\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm"
   }
  },
  {
   "key": "SAR 124R3",
   "ref": "SAR 124R3",
   "slug": "starset-sar-124r3-arthroscopy-set",
   "cat": "orthopedie",
   "img": "starset-sar-124r3",
   "fr": {
    "nom": "Set d'arthroscopie SAR 124R3",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SAR 124R3), 8 références / 11 pièces : champ d'arthroscopie avec poche de recueil des liquides x 1, jersey tubulaire x 1, bande élastique x 1, bande adhésive non tissée (op-tape) x 2, housse de caméra x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ d'arthroscopie avec poche de recueil des liquides (598216) — 200 x 320 cm — ST16\n1 x Jersey tubulaire (726516) — 36 x 75 cm — ST16\n1 x Bande élastique (112001) — 15 x 150 cm\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de caméra (665045) — 13,5 x 200 cm — ST45\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Arthroscopy set SAR 124R3",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SAR 124R3), 8 items / 11 pieces: arthroscopy drape L.C.P. x 1, stockinet x 1, elastic bandage x 1, op-tape x 2, camera cover x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Arthroscopy drape L.C.P. (598216) — 200 x 320 cm — ST16\n1 x Stockinet (726516) — 36 x 75 cm — ST16\n1 x Elastic bandage (112001) — 15 x 150 cm\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Camera cover (665045) — 13,5 x 200 cm — ST45\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SAR 115R3",
   "ref": "SAR 115R3",
   "slug": "starset-sar-115r3-arthroscopy-set",
   "cat": "orthopedie",
   "img": "starset-sar-115r3",
   "fr": {
    "nom": "Set d'arthroscopie SAR 115R3",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SAR 115R3), 7 références / 9 pièces : champ genou x 1, jersey tubulaire x 1, bande élastique x 1, bande adhésive non tissée (op-tape) x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ genou (585316) — 200 x 300 cm — ST16\n1 x Jersey tubulaire (721616) — 40 x 60 cm — ST16\n1 x Bande élastique (112001) — 15 x 150 cm\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Arthroscopy set SAR 115R3",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SAR 115R3), 7 items / 9 pieces: knee drape x 1, stockinet x 1, elastic bandage x 1, op-tape x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Knee drape (585316) — 200 x 300 cm — ST16\n1 x Stockinet (721616) — 40 x 60 cm — ST16\n1 x Elastic bandage (112001) — 15 x 150 cm\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SKL 107R3",
   "ref": "SKL 107R3",
   "slug": "starset-skl-107r3-hip-set",
   "cat": "orthopedie",
   "img": "starset-skl-107r3",
   "fr": {
    "nom": "Set hanche SKL 107R3",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SKL 107R3), 5 références / 5 pièces : champ fendu en U x 1, champ avec bande adhésive x 1, housse de jambe x 1, bande élastique x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ fendu en U (494516) — 150 x 250 cm — ST16\n1 x Champ avec bande adhésive (424316) — 150 x 180 cm — ST16\n1 x Housse de jambe (612416) — 60 x 115 cm — ST16\n1 x Bande élastique (112001) — 15 x 150 cm\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 16 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m²"
   },
   "en": {
    "nom": "Hip set SKL 107R3",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SKL 107R3), 5 items / 5 pieces: u-slotted drape x 1, adhesive tape drape x 1, leg cover x 1, elastic bandage x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x U-slotted drape (494516) — 150 x 250 cm — ST16\n1 x Adhesive tape drape (424316) — 150 x 180 cm — ST16\n1 x Leg cover (612416) — 60 x 115 cm — ST16\n1 x Elastic bandage (112001) — 15 x 150 cm\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 16 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm"
   }
  },
  {
   "key": "SVR 101R1",
   "ref": "SVR 101R1",
   "slug": "starset-svr-101r1-vertebral-set",
   "cat": "orthopedie",
   "img": "starset-svr-101r1",
   "fr": {
    "nom": "Set rachis (vertébral) SVR 101R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SVR 101R1), 8 références / 10 pièces : champ rachis (vertébral) x 1, champ avec bande adhésive x 1, champ simple x 1, marqueur chirurgical et réglette x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, housse de table Mayo x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ rachis (vertébral) (4611416) — 200 x 350 cm — ST16\n1 x Champ avec bande adhésive (424216) — 150 x 200 cm — ST16\n1 x Champ simple (403516) — 100 x 150 cm — ST16\n1 x Marqueur chirurgical et réglette (109001)\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Vertebral set SVR 101R1",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SVR 101R1), 8 items / 10 pieces: vertebral drape x 1, adhesive tape drape x 1, plain drape x 1, marker pen & ruler x 1, reinforced surgical gown x 2, towel x 2, mayo stand cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Vertebral drape (4611416) — 200 x 350 cm — ST16\n1 x Adhesive tape drape (424216) — 150 x 200 cm — ST16\n1 x Plain drape (403516) — 100 x 150 cm — ST16\n1 x Marker pen & ruler (109001)\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SKL 111R4",
   "ref": "SKL 111R4",
   "slug": "starset-skl-111r4-hip-set",
   "cat": "orthopedie",
   "img": "starset-skl-111r4",
   "fr": {
    "nom": "Set hanche SKL 111R4",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SKL 111R4), 7 références / 9 pièces : champ fendu en U x 1, champ avec bande adhésive x 1, housse de jambe x 1, bande élastique x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ fendu en U (494516) — 150 x 250 cm — ST16\n1 x Champ avec bande adhésive (424316) — 150 x 180 cm — ST16\n1 x Housse de jambe (612416) — 60 x 115 cm — ST16\n1 x Bande élastique (112001) — 15 x 150 cm\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Hip set SKL 111R4",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SKL 111R4), 7 items / 9 pieces: u-slotted drape x 1, adhesive tape drape x 1, leg cover x 1, elastic bandage x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x U-slotted drape (494516) — 150 x 250 cm — ST16\n1 x Adhesive tape drape (424316) — 150 x 180 cm — ST16\n1 x Leg cover (612416) — 60 x 115 cm — ST16\n1 x Elastic bandage (112001) — 15 x 150 cm\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SET 104R1",
   "ref": "SET 104R1",
   "slug": "starset-set-104r1-upper-extremity-set",
   "cat": "orthopedie",
   "img": "starset-set-104r1",
   "fr": {
    "nom": "Set membre supérieur SET 104R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie orthopédique (réf. SET 104R1), 9 références / 11 pièces : champ épaule x 1, champ avec bande adhésive x 1, champ avec bande adhésive x 1, poche plastique x 1, bande adhésive non tissée (op-tape) x 2, essuie-mains x 2, jersey tubulaire x 1, housse de caméra x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ épaule (585316) — 200 x 300 cm — ST16\n1 x Champ avec bande adhésive (423316) — 100 x 100 cm — ST16\n1 x Champ avec bande adhésive (424316) — 150 x 180 cm — ST16\n1 x Poche plastique (651646) — 40 x 60 cm — ST46\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Jersey tubulaire (728816) — 20 x 60 cm — ST16\n1 x Housse de caméra (665045) — 13,5 x 240 cm — ST45\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Upper extremity set SET 104R1",
    "description": "Star-Set sterile single-use set for orthopaedic surgery (ref. SET 104R1), 9 items / 11 pieces: shoulder drape x 1, adhesive tape drape x 1, adhesive tape drape x 1, plastic pouches x 1, op-tape x 2, towel x 2, stockinet x 1, camera cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Shoulder drape (585316) — 200 x 300 cm — ST16\n1 x Adhesive tape drape (423316) — 100 x 100 cm — ST16\n1 x Adhesive tape drape (424316) — 150 x 180 cm — ST16\n1 x Plastic pouches (651646) — 40 x 60 cm — ST46\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Stockinet (728816) — 20 x 60 cm — ST16\n1 x Camera cover (665045) — 13,5 x 240 cm — ST45\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBC 113R3",
   "ref": "SBC 113R3",
   "slug": "starset-sbc-113r3-craniotomy-set",
   "cat": "neurochirurgie",
   "img": "starset-sbc-113r3",
   "fr": {
    "nom": "Set craniotomie SBC 113R3",
    "description": "Set stérile à usage unique Star-Set pour la neurochirurgie (réf. SBC 113R3), 7 références / 9 pièces : champ de craniotomie avec poche de recueil des liquides x 1, champ avec bande adhésive x 2, champ simple x 1, poche plastique x 1, housse de table Mayo x 1, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de craniotomie avec poche de recueil des liquides (6822516) — 300 x 400 cm — ST16\n2 x Champ avec bande adhésive (426316) — 100 x 125 cm — ST16\n1 x Champ simple (403516) — 100 x 150 cm — ST16\n1 x Poche plastique (651946) — 28 x 33 cm — ST46\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Craniotomy set SBC 113R3",
    "description": "Star-Set sterile single-use set for neurosurgery (ref. SBC 113R3), 7 items / 9 pieces: craniotomy drape L.C.P. x 1, adhesive tape drape x 2, plain drape x 1, plastic pouches x 1, mayo stand cover x 1, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Craniotomy drape L.C.P. (6822516) — 300 x 400 cm — ST16\n2 x Adhesive tape drape (426316) — 100 x 125 cm — ST16\n1 x Plain drape (403516) — 100 x 150 cm — ST16\n1 x Plastic pouches (651946) — 28 x 33 cm — ST46\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBC 107R1",
   "ref": "SBC 107R1",
   "slug": "starset-sbc-107r1-spinal-neurosurgery-set",
   "cat": "neurochirurgie",
   "img": "starset-sbc-107r1",
   "fr": {
    "nom": "Set neurochirurgie rachidienne SBC 107R1",
    "description": "Set stérile à usage unique Star-Set pour la neurochirurgie (réf. SBC 107R1), 7 références / 9 pièces : champ rachis (vertébral) x 1, bande adhésive non tissée (op-tape) x 2, champ avec bande adhésive x 1, poche plastique x 1, housse de table Mayo x 1, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ rachis (vertébral) (4615616) — 200 x 400 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Champ avec bande adhésive (4221616) — 60 x 100 cm — ST16\n1 x Poche plastique (651946) — 28 x 33 cm — ST46\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Spinal neurosurgery set SBC 107R1",
    "description": "Star-Set sterile single-use set for neurosurgery (ref. SBC 107R1), 7 items / 9 pieces: vertebral drape x 1, op-tape x 2, adhesive tape drape x 1, plastic pouches x 1, mayo stand cover x 1, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Vertebral drape (4615616) — 200 x 400 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Adhesive tape drape (4221616) — 60 x 100 cm — ST16\n1 x Plastic pouches (651946) — 28 x 33 cm — ST46\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBC 106R1",
   "ref": "SBC 106R1",
   "slug": "starset-sbc-106r1-craniotomy-set",
   "cat": "neurochirurgie",
   "img": "starset-sbc-106r1",
   "fr": {
    "nom": "Set craniotomie SBC 106R1",
    "description": "Set stérile à usage unique Star-Set pour la neurochirurgie (réf. SBC 106R1), 8 références / 11 pièces : champ de craniotomie avec poche de recueil des liquides x 1, champ avec bande adhésive x 2, champ simple x 1, poche plastique x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de craniotomie avec poche de recueil des liquides (6822516) — 300 x 400 cm — ST16\n2 x Champ avec bande adhésive (426316) — 100 x 125 cm — ST16\n1 x Champ simple (403516) — 100 x 150 cm — ST16\n1 x Poche plastique (651946) — 28 x 33 cm — ST46\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 8 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Craniotomy set SBC 106R1",
    "description": "Star-Set sterile single-use set for neurosurgery (ref. SBC 106R1), 8 items / 11 pieces: craniotomy drape L.C.P. x 1, adhesive tape drape x 2, plain drape x 1, plastic pouches x 1, mayo stand cover x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Craniotomy drape L.C.P. (6822516) — 300 x 400 cm — ST16\n2 x Adhesive tape drape (426316) — 100 x 125 cm — ST16\n1 x Plain drape (403516) — 100 x 150 cm — ST16\n1 x Plastic pouches (651946) — 28 x 33 cm — ST46\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 8 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SBC 112R1",
   "ref": "SBC 112R1",
   "slug": "starset-sbc-112r1-spinal-neurosurgery-set",
   "cat": "neurochirurgie",
   "img": "starset-sbc-112r1",
   "fr": {
    "nom": "Set neurochirurgie rachidienne SBC 112R1",
    "description": "Set stérile à usage unique Star-Set pour la neurochirurgie (réf. SBC 112R1), 8 références / 11 pièces : champ rachis (vertébral) x 1, bande adhésive non tissée (op-tape) x 2, champ avec bande adhésive x 1, poche plastique x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ rachis (vertébral) (4615616) — 200 x 400 cm — ST16\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Champ avec bande adhésive (4221616) — 60 x 100 cm — ST16\n1 x Poche plastique (651946) — 28 x 33 cm — ST46\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Spinal neurosurgery set SBC 112R1",
    "description": "Star-Set sterile single-use set for neurosurgery (ref. SBC 112R1), 8 items / 11 pieces: vertebral drape x 1, op-tape x 2, adhesive tape drape x 1, plastic pouches x 1, mayo stand cover x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Vertebral drape (4615616) — 200 x 400 cm — ST16\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Adhesive tape drape (4221616) — 60 x 100 cm — ST16\n1 x Plastic pouches (651946) — 28 x 33 cm — ST46\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SSI 103R1",
   "ref": "SSI 103R1",
   "slug": "starset-ssi-103r1-cystoscopy-set",
   "cat": "urologie",
   "img": "starset-ssi-103r1",
   "fr": {
    "nom": "Set cystoscopie SSI 103R1",
    "description": "Set stérile à usage unique Star-Set pour l'urologie (réf. SSI 103R1), 4 références / 4 pièces : champ de cystoscopie x 1, champ simple x 1, housse de jambe x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de cystoscopie (4323116) — 75 x 150 cm — ST16\n1 x Champ simple (402916) — 75 x 90 cm — ST16\n1 x Housse de jambe (622416) — 60 x 115 cm — ST16\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 40 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m²"
   },
   "en": {
    "nom": "Cystoscopy set SSI 103R1",
    "description": "Star-Set sterile single-use set for urology (ref. SSI 103R1), 4 items / 4 pieces: cystoscopy drape x 1, plain drape x 1, leg cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Cystoscopy drape (4323116) — 75 x 150 cm — ST16\n1 x Plain drape (402916) — 75 x 90 cm — ST16\n1 x Leg cover (622416) — 60 x 115 cm — ST16\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 40 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm"
   }
  },
  {
   "key": "STU 109",
   "ref": "STU 109",
   "slug": "starset-stu-109-tur-set",
   "cat": "urologie",
   "img": "starset-stu-109",
   "fr": {
    "nom": "Set TUR (résection transurétrale) STU 109",
    "description": "Set stérile à usage unique Star-Set pour l'urologie (réf. STU 109), 4 références / 6 pièces : champ TUR avec poche de recueil des liquides x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ TUR avec poche de recueil des liquides (5312420) — 180 x 240 cm — ST20\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "TUR set STU 109",
    "description": "Star-Set sterile single-use set for urology (ref. STU 109), 4 items / 6 pieces: tur drape L.C.P. x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Tur drape L.C.P. (5312420) — 180 x 240 cm — ST20\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "STU 108",
   "ref": "STU 108",
   "slug": "starset-stu-108-tur-set",
   "cat": "urologie",
   "img": "starset-stu-108",
   "fr": {
    "nom": "Set TUR (résection transurétrale) STU 108",
    "description": "Set stérile à usage unique Star-Set pour l'urologie (réf. STU 108), 3 références / 3 pièces : champ TUR avec poche de recueil des liquides x 1, essuie-mains x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ TUR avec poche de recueil des liquides (5312420) — 180 x 240 cm — ST20\n1 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "TUR set STU 108",
    "description": "Star-Set sterile single-use set for urology (ref. STU 108), 3 items / 3 pieces: tur drape L.C.P. x 1, towel x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Tur drape L.C.P. (5312420) — 180 x 240 cm — ST20\n1 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SPR 101R3",
   "ref": "SPR 101R3",
   "slug": "starset-spr-101r3-percutaneous-set",
   "cat": "urologie",
   "img": "starset-spr-101r3",
   "fr": {
    "nom": "Set percutané SPR 101R3",
    "description": "Set stérile à usage unique Star-Set pour l'urologie (réf. SPR 101R3), 7 références / 10 pièces : champ percutané avec poche de recueil des liquides x 1, housse de caméra x 1, housse d'amplificateur de brillance (C-Scopy) x 1, bande adhésive non tissée (op-tape) x 2, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ percutané avec poche de recueil des liquides (6012716) — 150 x 300 cm — ST16\n1 x Housse de caméra (665045) — 13,5 x 200 cm — ST45\n1 x Housse d'amplificateur de brillance (C-Scopy) (6715750) — 85 x 170 cm — ST50\n2 x Bande adhésive non tissée (op-tape) (6316120) — 10 x 30 cm — ST20\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (765383) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST50 = PE transparent antistatique 50 µ (85 x 170 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Percutaneous set SPR 101R3",
    "description": "Star-Set sterile single-use set for urology (ref. SPR 101R3), 7 items / 10 pieces: percutaneous drape L.C.P. x 1, camera cover x 1, c Scopy cover x 1, op-tape x 2, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Percutaneous drape L.C.P. (6012716) — 150 x 300 cm — ST16\n1 x Camera cover (665045) — 13,5 x 200 cm — ST45\n1 x C Scopy cover (6715750) — 85 x 170 cm — ST50\n2 x Op-tape (6316120) — 10 x 30 cm — ST20\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (765383) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST20 = viscose + PE film, 56 gsm ; ST50 = anti-static transparent PE 50 µ (85 x 170 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SDG 100R6",
   "ref": "SDG 100R6",
   "slug": "starset-sdg-100r6-delivery-set",
   "cat": "gyneco",
   "img": "starset-sdg-100r6",
   "fr": {
    "nom": "Set d'accouchement SDG 100R6",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SDG 100R6), 5 références / 5 pièces : champ alèse patient x 1, housses de jambe (paire) x 1, champ abdominal x 1, champ bébé x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ alèse patient (407616) — 75 x 100 cm — ST16\n1 x Housses de jambe (paire) (623016) — 75 x 120 cm — ST16\n1 x Champ abdominal (427716) — 75 x 160 cm — ST16\n1 x Champ bébé (4061145) — 60 x 90 cm — ST145\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 25 sets par carton\nMatières : ST145 = champ bébé coton très absorbant ; ST16 = non-tissé absorbant + film PE, 54 g/m²"
   },
   "en": {
    "nom": "Delivery set SDG 100R6",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SDG 100R6), 5 items / 5 pieces: patient underpad drape x 1, leg cover (pair) x 1, abdominal drape x 1, baby drape x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Patient underpad drape (407616) — 75 x 100 cm — ST16\n1 x Leg cover (pair) (623016) — 75 x 120 cm — ST16\n1 x Abdominal drape (427716) — 75 x 160 cm — ST16\n1 x Baby drape (4061145) — 60 x 90 cm — ST145\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 25 sets per carton\nMaterials: ST145 = high absorbent cotton baby drape ; ST16 = absorbent nonwoven + PE film, 54 gsm"
   }
  },
  {
   "key": "SIV 100R1",
   "ref": "SIV 100R1",
   "slug": "starset-siv-100r1-ivf-set",
   "cat": "gyneco",
   "img": "starset-siv-100r1",
   "fr": {
    "nom": "Set FIV SIV 100R1",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SIV 100R1), 9 références / 11 pièces : champ O.P.U. (ponction ovocytaire) x 1, champ simple x 1, champ simple x 1, housse de sonde d'échographie x 1, housses de jambe (paire) x 1, casaque chirurgicale renforcée x 1, casaque chirurgicale standard x 1, essuie-mains x 3, feuille de stérilisation x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ O.P.U. (ponction ovocytaire) (455816) — 150 x 170 cm — ST16\n1 x Champ simple (403316) — 100 x 100 cm — ST16\n1 x Champ simple (406616) — 150 x 150 cm — ST16\n1 x Housse de sonde d'échographie (668840) — 15 x 100 cm — ST40\n1 x Housses de jambe (paire) (626116) — 60 x 90 cm — ST16\n1 x Casaque chirurgicale renforcée (120419) — XL — ST19\n1 x Casaque chirurgicale standard (110418) — XL — ST18\n3 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Feuille de stérilisation (913319) — 100 x 100 cm — ST19\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST19 = SSMMS, 35 g/m² ; ST40 = PE transparent antistatique 40 µ (laize 90 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "IVF set SIV 100R1",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SIV 100R1), 9 items / 11 pieces: o.P.U. drape x 1, plain drape x 1, plain drape x 1, ultrasound cover x 1, leg cover (pair) x 1, reinforced surgical gown x 1, standard surgical gown x 1, towel x 3, sterilization wrap x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x O.P.U. drape (455816) — 150 x 170 cm — ST16\n1 x Plain drape (403316) — 100 x 100 cm — ST16\n1 x Plain drape (406616) — 150 x 150 cm — ST16\n1 x Ultrasound cover (668840) — 15 x 100 cm — ST40\n1 x Leg cover (pair) (626116) — 60 x 90 cm — ST16\n1 x Reinforced surgical gown (120419) — XL — ST19\n1 x Standard surgical gown (110418) — XL — ST18\n3 x Towel (761583) — 40 x 40 cm — ST83\n1 x Sterilization wrap (913319) — 100 x 100 cm — ST19\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST19 = SSMMS, 35 gsm ; ST40 = anti-static transparent PE 40 µ (90 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SSZ 111R6",
   "ref": "SSZ 111R6",
   "slug": "starset-ssz-111r6-caesarean-set",
   "cat": "gyneco",
   "img": "starset-ssz-111r6",
   "fr": {
    "nom": "Set césarienne SSZ 111R6",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SSZ 111R6), 6 références / 8 pièces : champ de césarienne avec poche de recueil des liquides x 1, champ bébé x 1, bande adhésive non tissée (op-tape) x 2, housse de table Mayo x 1, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de césarienne avec poche de recueil des liquides (527016) — 240 x 320 cm — ST16\n1 x Champ bébé (4061145) — 60 x 90 cm — ST145\n2 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 14 sets par carton\nMatières : ST145 = champ bébé coton très absorbant ; ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Caesarean set SSZ 111R6",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SSZ 111R6), 6 items / 8 pieces: caesarean drape L.C.P. x 1, baby drape x 1, op-tape x 2, mayo stand cover x 1, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Caesarean drape L.C.P. (527016) — 240 x 320 cm — ST16\n1 x Baby drape (4061145) — 60 x 90 cm — ST145\n2 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 14 sets per carton\nMaterials: ST145 = high absorbent cotton baby drape ; ST16 = absorbent nonwoven + PE film, 54 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SDG 100R3",
   "ref": "SDG 100R3",
   "slug": "starset-sdg-100r3-delivery-set",
   "cat": "gyneco",
   "img": "starset-sdg-100r3",
   "fr": {
    "nom": "Set d'accouchement SDG 100R3",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SDG 100R3), 9 références / 11 pièces : champ sous-fessier x 1, champ abdominal supérieur patient x 1, champ bébé x 1, housses de jambe (paire) x 1, poire d'aspiration x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1, feuille de stérilisation x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ sous-fessier (523416) — 100 x 130 cm — ST16\n1 x Champ abdominal supérieur patient (427616) — 75 x 100 cm — ST16\n1 x Champ bébé (4061145) — 60 x 90 cm — ST145\n1 x Housses de jambe (paire) (6224516) — 60 x 110 cm — ST16\n1 x Poire d'aspiration (170001) — 2 oz. / 60 ml\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\n1 x Feuille de stérilisation (913319) — 100 x 100 cm — ST19\nConditionnement : 14 sets par carton\nMatières : ST145 = champ bébé coton très absorbant ; ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Delivery set SDG 100R3",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SDG 100R3), 9 items / 11 pieces: underbuttock drape x 1, abdominal patient top drape x 1, baby drape x 1, leg cover (pair) x 1, bulb syringe x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1, sterilization wrap x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Underbuttock drape (523416) — 100 x 130 cm — ST16\n1 x Abdominal patient top drape (427616) — 75 x 100 cm — ST16\n1 x Baby drape (4061145) — 60 x 90 cm — ST145\n1 x Leg cover (pair) (6224516) — 60 x 110 cm — ST16\n1 x Bulb syringe (170001) — 2 oz. / 60 ml\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\n1 x Sterilization wrap (913319) — 100 x 100 cm — ST19\nPacking: 14 sets per carton\nMaterials: ST145 = high absorbent cotton baby drape ; ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SIV 104R1",
   "ref": "SIV 104R1",
   "slug": "starset-siv-104r1-embryo-transfer-set",
   "cat": "gyneco",
   "img": "starset-siv-104r1",
   "fr": {
    "nom": "Set transfert d'embryon SIV 104R1",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SIV 104R1), 4 références / 13 pièces : champ fenêtré adhésif x 1, compresses de gaze x 10, champ simple x 1, feuille de stérilisation x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ fenêtré adhésif (452716) — 75 x 75 cm — ST16\n10 x Compresses de gaze (770001) — 5 x 5 cm — ST88\n1 x Champ simple (403316) — 100 x 100 cm — ST16\n1 x Feuille de stérilisation (912519) — 50 x 50 cm — ST19\nConditionnement : 100 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST88 = gaze textile"
   },
   "en": {
    "nom": "Embryo transfer set SIV 104R1",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SIV 104R1), 4 items / 13 pieces: surgical drape with adhesive fenestration x 1, textile gauze x 10, plain drape x 1, sterilization wrap x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Surgical drape with adhesive fenestration (452716) — 75 x 75 cm — ST16\n10 x Textile gauze (770001) — 5 x 5 cm — ST88\n1 x Plain drape (403316) — 100 x 100 cm — ST16\n1 x Sterilization wrap (912519) — 50 x 50 cm — ST19\nPacking: 100 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST88 = textile gauze"
   }
  },
  {
   "key": "SSZ 104",
   "ref": "SSZ 104",
   "slug": "starset-ssz-104-caesarean-set",
   "cat": "gyneco",
   "img": "starset-ssz-104",
   "fr": {
    "nom": "Set césarienne SSZ 104",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SSZ 104), 8 références / 10 pièces : champ de césarienne avec poche de recueil des liquides x 1, champ bébé x 1, haricot x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 1, casaque chirurgicale standard x 1, essuie-mains x 3, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de césarienne avec poche de recueil des liquides (525316) — 200 x 300 cm — ST16\n1 x Champ bébé (4061145) — 60 x 90 cm — ST145\n1 x Haricot (140002) — 700cc\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Casaque chirurgicale renforcée (120419) — XL — ST19\n1 x Casaque chirurgicale standard (110418) — XL — ST18\n3 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 10 sets par carton\nMatières : ST145 = champ bébé coton très absorbant ; ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST19 = SSMMS, 35 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Caesarean set SSZ 104",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SSZ 104), 8 items / 10 pieces: caesarean drape L.C.P. x 1, baby drape x 1, kidney bowl x 1, mayo stand cover x 1, reinforced surgical gown x 1, standard surgical gown x 1, towel x 3, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Caesarean drape L.C.P. (525316) — 200 x 300 cm — ST16\n1 x Baby drape (4061145) — 60 x 90 cm — ST145\n1 x Kidney bowl (140002) — 700cc\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Reinforced surgical gown (120419) — XL — ST19\n1 x Standard surgical gown (110418) — XL — ST18\n3 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 10 sets per carton\nMaterials: ST145 = high absorbent cotton baby drape ; ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST19 = SSMMS, 35 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SSZ 108R6",
   "ref": "SSZ 108R6",
   "slug": "starset-ssz-108r6-caesarean-set",
   "cat": "gyneco",
   "img": "starset-ssz-108r6",
   "fr": {
    "nom": "Set césarienne SSZ 108R6",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SSZ 108R6), 7 références / 12 pièces : champ de césarienne avec poche de recueil des liquides x 1, champ bébé x 1, bande adhésive non tissée (op-tape) x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 3, essuie-mains x 4, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ de césarienne avec poche de recueil des liquides (525316A) — 200 x 300 cm — ST16-25\n1 x Champ bébé (403316) — 100 x 100 cm — ST16\n1 x Bande adhésive non tissée (op-tape) (631220) — 10 x 50 cm — ST20\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n3 x Casaque chirurgicale renforcée (120419) — XL — ST19\n4 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (564216) — 150 x 200 cm — ST16\nConditionnement : 8 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST25 = matériau très absorbant, 104 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Caesarean set SSZ 108R6",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SSZ 108R6), 7 items / 12 pieces: caesarean drape L.C.P. x 1, baby drape x 1, op-tape x 1, mayo stand cover x 1, reinforced surgical gown x 3, towel x 4, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Caesarean drape L.C.P. (525316A) — 200 x 300 cm — ST16-25\n1 x Baby drape (403316) — 100 x 100 cm — ST16\n1 x Op-tape (631220) — 10 x 50 cm — ST20\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n3 x Reinforced surgical gown (120419) — XL — ST19\n4 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (564216) — 150 x 200 cm — ST16\nPacking: 8 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST20 = viscose + PE film, 56 gsm ; ST25 = high absorbent material, 104 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SIV 110R1",
   "ref": "SIV 110R1",
   "slug": "starset-siv-110r1-gynecology-abdominal-set",
   "cat": "gyneco",
   "img": "starset-siv-110r1",
   "fr": {
    "nom": "Set gynécologie abdominale SIV 110R1",
    "description": "Set stérile à usage unique Star-Set pour la gynécologie-obstétrique (réf. SIV 110R1), 6 références / 8 pièces : champ gynécologie / abdominal x 1, champ simple x 1, housse de sonde d'échographie x 1, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ gynécologie / abdominal (5312416-4) — 180 x 240 cm — ST16\n1 x Champ simple (4015016) — 90 x 90 cm — ST16\n1 x Housse de sonde d'échographie (955056) — 6 x 16 x 112 cm — ST56\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 12 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Gynecology abdominal set SIV 110R1",
    "description": "Star-Set sterile single-use set for obstetrics and gynaecology (ref. SIV 110R1), 6 items / 8 pieces: gynecology / Abdominal drape x 1, plain drape x 1, ultrasound cover x 1, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Gynecology / Abdominal drape (5312416-4) — 180 x 240 cm — ST16\n1 x Plain drape (4015016) — 90 x 90 cm — ST16\n1 x Ultrasound cover (955056) — 6 x 16 x 112 cm — ST56\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 12 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGZ 115",
   "ref": "SGZ 115",
   "slug": "starset-sgz-115-eye-set",
   "cat": "ophtalmologie",
   "img": "starset-sgz-115",
   "fr": {
    "nom": "Set ophtalmique SGZ 115",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ophtalmique (réf. SGZ 115), 5 références / 6 pièces : champ ophtalmique avec poche de recueil des liquides x 1, champ simple x 1, champ simple x 1, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ophtalmique avec poche de recueil des liquides (503518) — 100 x 150 cm — ST18\n1 x Champ simple (403618) — 100 x 160 cm — ST18\n1 x Champ simple (4013318) — 80 x 120 cm — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 25 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Eye set SGZ 115",
    "description": "Star-Set sterile single-use set for ophthalmic surgery (ref. SGZ 115), 5 items / 6 pieces: eye drape L.C.P. x 1, plain drape x 1, plain drape x 1, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Eye drape L.C.P. (503518) — 100 x 150 cm — ST18\n1 x Plain drape (403618) — 100 x 160 cm — ST18\n1 x Plain drape (4013318) — 80 x 120 cm — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 25 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGZ 102R1",
   "ref": "SGZ 102R1",
   "slug": "starset-sgz-102r1-eye-set",
   "cat": "ophtalmologie",
   "img": "starset-sgz-102r1",
   "fr": {
    "nom": "Set ophtalmique SGZ 102R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ophtalmique (réf. SGZ 102R1), 6 références / 8 pièces : champ ophtalmique avec poche de recueil des liquides x 1, champ simple x 1, champ avec bande adhésive x 1, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ophtalmique avec poche de recueil des liquides (503516) — 100 x 150 cm — ST16\n1 x Champ simple (403516) — 100 x 150 cm — ST16\n1 x Champ avec bande adhésive (423016) — 75 x 120 cm — ST16\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 16 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Eye set SGZ 102R1",
    "description": "Star-Set sterile single-use set for ophthalmic surgery (ref. SGZ 102R1), 6 items / 8 pieces: eye drape L.C.P. x 1, plain drape x 1, adhesive tape drape x 1, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Eye drape L.C.P. (503516) — 100 x 150 cm — ST16\n1 x Plain drape (403516) — 100 x 150 cm — ST16\n1 x Adhesive tape drape (423016) — 75 x 120 cm — ST16\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 16 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGZ 105",
   "ref": "SGZ 105",
   "slug": "starset-sgz-105-eye-set",
   "cat": "ophtalmologie",
   "img": "starset-sgz-105",
   "fr": {
    "nom": "Set ophtalmique SGZ 105",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ophtalmique (réf. SGZ 105), 6 références / 8 pièces : champ ophtalmique avec poche de recueil des liquides x 1, champ simple x 1, champ avec bande adhésive x 1, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ophtalmique avec poche de recueil des liquides (503518) — 100 x 150 cm — ST18\n1 x Champ simple (403618) — 100 x 160 cm — ST18\n1 x Champ avec bande adhésive (4213318) — 80 x 120 cm — ST18\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Eye set SGZ 105",
    "description": "Star-Set sterile single-use set for ophthalmic surgery (ref. SGZ 105), 6 items / 8 pieces: eye drape L.C.P. x 1, plain drape x 1, adhesive tape drape x 1, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Eye drape L.C.P. (503518) — 100 x 150 cm — ST18\n1 x Plain drape (403618) — 100 x 160 cm — ST18\n1 x Adhesive tape drape (4213318) — 80 x 120 cm — ST18\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SGZ 123R1",
   "ref": "SGZ 123R1",
   "slug": "starset-sgz-123r1-eye-set",
   "cat": "ophtalmologie",
   "img": "starset-sgz-123r1",
   "fr": {
    "nom": "Set ophtalmique SGZ 123R1",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ophtalmique (réf. SGZ 123R1), 4 références / 6 pièces : champ ophtalmique à double poche de recueil des liquides x 1, casaque chirurgicale standard x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ophtalmique à double poche de recueil des liquides (514420) — 150 x 240 cm — ST20\n2 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 18 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST20 = viscose + film PE, 56 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Eye set SGZ 123R1",
    "description": "Star-Set sterile single-use set for ophthalmic surgery (ref. SGZ 123R1), 4 items / 6 pieces: eye drape double L.C.P. x 1, standard surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Eye drape double L.C.P. (514420) — 150 x 240 cm — ST20\n2 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 18 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST20 = viscose + PE film, 56 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SKB 100R2",
   "ref": "SKB 100R2",
   "slug": "starset-skb-100r2-e-n-t-set",
   "cat": "orl",
   "img": "starset-skb-100r2",
   "fr": {
    "nom": "Set ORL SKB 100R2",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ORL (réf. SKB 100R2), 4 références / 4 pièces : champ ORL x 1, champ avec bande adhésive x 1, housse de table Mayo x 1, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ORL (494516) — 150 x 250 cm — ST16\n1 x Champ avec bande adhésive (422916) — 75 x 90 cm — ST16\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 25 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m²"
   },
   "en": {
    "nom": "E.N.T. set SKB 100R2",
    "description": "Star-Set sterile single-use set for E.N.T. surgery (ref. SKB 100R2), 4 items / 4 pieces: e.N.T. drape x 1, adhesive tape drape x 1, mayo stand cover x 1, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x E.N.T. drape (494516) — 150 x 250 cm — ST16\n1 x Adhesive tape drape (422916) — 75 x 90 cm — ST16\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 25 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm"
   }
  },
  {
   "key": "SCC 100",
   "ref": "SCC 100",
   "slug": "starset-scc-100-implant-surgery-set",
   "cat": "dentaire",
   "img": "starset-scc-100",
   "fr": {
    "nom": "Set chirurgie implantaire SCC 100",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie implantaire dentaire (réf. SCC 100), 7 références / 19 pièces : champ supérieur patient x 1, housse de réflecteur x 2, sac à déchets x 1, housse de tuyau x 2, essuie-mains x 2, compresses de gaze x 10, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ supérieur patient (422916) — 75 x 90 cm — ST16\n2 x Housse de réflecteur (428618) — 15 x 15 cm — ST18\n1 x Sac à déchets (651946) — 28 x 33 cm — ST46\n2 x Housse de tuyau (666944) — 8 x 122 cm — ST44\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n10 x Compresses de gaze (770001) — 5 x 5 cm\n1 x Champ de table d'instruments (562716) — 75 x 75 cm — ST16\nConditionnement : 60 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST44 = PE transparent antistatique 50 µ (laize 8 cm) ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "Implant surgery set SCC 100",
    "description": "Star-Set sterile single-use set for dental implant surgery (ref. SCC 100), 7 items / 19 pieces: patient top drape x 1, reflector drape x 2, waste pouches x 1, hose cover x 2, towel x 2, textile gauze x 10, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Patient top drape (422916) — 75 x 90 cm — ST16\n2 x Reflector drape (428618) — 15 x 15 cm — ST18\n1 x Waste pouches (651946) — 28 x 33 cm — ST46\n2 x Hose cover (666944) — 8 x 122 cm — ST44\n2 x Towel (761583) — 40 x 40 cm — ST83\n10 x Textile gauze (770001) — 5 x 5 cm\n1 x Instrument table cover (562716) — 75 x 75 cm — ST16\nPacking: 60 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST44 = anti-static transparent PE 50 µ (8 cm) ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SKB 102R3",
   "ref": "SKB 102R3",
   "slug": "starset-skb-102r3-e-n-t-set",
   "cat": "orl",
   "img": "starset-skb-102r3",
   "fr": {
    "nom": "Set ORL SKB 102R3",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie ORL (réf. SKB 102R3), 6 références / 8 pièces : champ ORL x 1, champ avec bande adhésive x 1, housse de table Mayo x 1, casaque chirurgicale renforcée x 2, essuie-mains x 2, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ ORL (494516) — 150 x 250 cm — ST16\n1 x Champ avec bande adhésive (422916) — 75 x 90 cm — ST16\n1 x Housse de table Mayo (578137) — 80 x 150 cm — ST37\n2 x Casaque chirurgicale renforcée (120419) — XL — ST19\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n1 x Champ de table d'instruments (563516) — 100 x 150 cm — ST16\nConditionnement : 20 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST19 = SSMMS, 35 g/m² ; ST83 = essuie-mains non pelucheux, 63 g/m²"
   },
   "en": {
    "nom": "E.N.T. set SKB 102R3",
    "description": "Star-Set sterile single-use set for E.N.T. surgery (ref. SKB 102R3), 6 items / 8 pieces: e.N.T. drape x 1, adhesive tape drape x 1, mayo stand cover x 1, reinforced surgical gown x 2, towel x 2, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x E.N.T. drape (494516) — 150 x 250 cm — ST16\n1 x Adhesive tape drape (422916) — 75 x 90 cm — ST16\n1 x Mayo stand cover (578137) — 80 x 150 cm — ST37\n2 x Reinforced surgical gown (120419) — XL — ST19\n2 x Towel (761583) — 40 x 40 cm — ST83\n1 x Instrument table cover (563516) — 100 x 150 cm — ST16\nPacking: 20 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST19 = SSMMS, 35 gsm ; ST83 = lint-free towel, 63 gsm"
   }
  },
  {
   "key": "SCC 106",
   "ref": "SCC 106",
   "slug": "starset-scc-106-implant-surgery-set",
   "cat": "dentaire",
   "img": "starset-scc-106",
   "fr": {
    "nom": "Set chirurgie implantaire SCC 106",
    "description": "Set stérile à usage unique Star-Set pour la chirurgie implantaire dentaire (réf. SCC 106), 8 références / 20 pièces : champ supérieur patient x 1, housse de réflecteur x 2, sac à déchets x 1, housse de tuyau x 2, casaque chirurgicale standard x 1, essuie-mains x 2, compresses de gaze x 10, champ de table d'instruments x 1. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Composition (quantité x élément (code) — taille — matière) :\n1 x Champ supérieur patient (422916) — 75 x 90 cm — ST16\n2 x Housse de réflecteur (428618) — 15 x 15 cm — ST18\n1 x Sac à déchets (651946) — 28 x 33 cm — ST46\n2 x Housse de tuyau (666944) — 8 x 122 cm — ST44\n1 x Casaque chirurgicale standard (110418) — XL — ST18\n2 x Essuie-mains (761583) — 40 x 40 cm — ST83\n10 x Compresses de gaze (770001) — 5 x 5 cm — ST88\n1 x Champ de table d'instruments (562716) — 75 x 75 cm — ST16\nConditionnement : 30 sets par carton\nMatières : ST16 = non-tissé absorbant + film PE, 54 g/m² ; ST18 = SSMMS, 43 g/m² ; ST44 = PE transparent antistatique 50 µ (laize 8 cm) ; ST46 = PE transparent antistatique 50 µ (28 x 33 cm) ; ST83 = essuie-mains non pelucheux, 63 g/m² ; ST88 = gaze textile"
   },
   "en": {
    "nom": "Implant surgery set SCC 106",
    "description": "Star-Set sterile single-use set for dental implant surgery (ref. SCC 106), 8 items / 20 pieces: patient top drape x 1, reflector drape x 2, waste pouches x 1, hose cover x 2, standard surgical gown x 1, towel x 2, textile gauze x 10, instrument table cover x 1. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Composition (quantity x item (code) — size — material):\n1 x Patient top drape (422916) — 75 x 90 cm — ST16\n2 x Reflector drape (428618) — 15 x 15 cm — ST18\n1 x Waste pouches (651946) — 28 x 33 cm — ST46\n2 x Hose cover (666944) — 8 x 122 cm — ST44\n1 x Standard surgical gown (110418) — XL — ST18\n2 x Towel (761583) — 40 x 40 cm — ST83\n10 x Textile gauze (770001) — 5 x 5 cm — ST88\n1 x Instrument table cover (562716) — 75 x 75 cm — ST16\nPacking: 30 sets per carton\nMaterials: ST16 = absorbent nonwoven + PE film, 54 gsm ; ST18 = SSMMS, 43 gsm ; ST44 = anti-static transparent PE 50 µ (8 cm) ; ST46 = anti-static transparent PE 50 µ (28 x 33 cm) ; ST83 = lint-free towel, 63 gsm ; ST88 = textile gauze"
   }
  },
  {
   "key": "gown-std",
   "ref": "110218 / 110318 / 110418 / 110518",
   "slug": "starset-casaque-standard",
   "cat": "casaques",
   "img": "starset-casaque-standard",
   "fr": {
    "nom": "Casaque chirurgicale standard stérile",
    "description": "Casaque chirurgicale stérile à usage unique Star-Set en SSMMS (ST18), poignets tricotés, du M au XXL extra long. Le SSMMS, à cinq couches hydrofuges dont des couches meltblown, ne laisse pas passer les liquides et reste confortable pour l'utilisateur. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Matière : ST18 (SSMMS, 43 g/m²)\n110218 : taille M — longueur 120 cm, largeur 145 cm, manche 55 cm — 60 pièces par carton\n110318 : taille L — longueur 125 cm, largeur 150 cm, manche 60 cm — 60 pièces par carton\n110418 : taille XL — longueur 130 cm, largeur 155 cm, manche 65 cm — 60 pièces par carton\n110518 : taille XXL — longueur 135 cm, largeur 160 cm, manche 68 cm — 50 pièces par carton\n110518 : taille XXL extra long — longueur 150 cm, largeur 160 cm, manche 70 cm — 50 pièces par carton\nLe catalogue imprime le même code pour XXL et XXL extra long."
   },
   "en": {
    "nom": "Standard sterile surgical gown",
    "description": "Star-Set sterile single-use surgical gown in SSMMS (ST18), knitted cuffs, sizes M to XXL extra long. The five water-repellent SSMMS layers, including melt-blown layers, do not allow liquid through and keep the wearer comfortable. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Material: ST18 (SSMMS, 43 gsm)\n110218: size M — length 120 cm, width 145 cm, sleeve 55 cm — 60 pcs per carton\n110318: size L — length 125 cm, width 150 cm, sleeve 60 cm — 60 pcs per carton\n110418: size XL — length 130 cm, width 155 cm, sleeve 65 cm — 60 pcs per carton\n110518: size XXL — length 135 cm, width 160 cm, sleeve 68 cm — 50 pcs per carton\n110518: size XXL extra long — length 150 cm, width 160 cm, sleeve 70 cm — 50 pcs per carton\nThe catalogue prints the same code for XXL and XXL extra long."
   }
  },
  {
   "key": "gown-rf",
   "ref": "120219 / 120319 / 120419 / 120519",
   "slug": "starset-casaque-renforcee",
   "cat": "casaques",
   "img": "starset-casaque-renforcee",
   "fr": {
    "nom": "Casaque chirurgicale renforcée stérile",
    "description": "Casaque chirurgicale stérile à usage unique Star-Set en SSMMS (ST19), avec renfort avant et sur les avant-bras, poignets tricotés, du M au XXL extra long. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Matière : ST19 (SSMMS, 35 g/m²), renforts avant et avant-bras\n120219 : taille M — longueur 120 cm, largeur 145 cm, manche 55 cm — 50 pièces par carton\n120319 : taille L — longueur 125 cm, largeur 150 cm, manche 60 cm — 50 pièces par carton\n120419 : taille XL — longueur 130 cm, largeur 155 cm, manche 65 cm — 50 pièces par carton\n120519 : taille XXL — longueur 135 cm, largeur 160 cm, manche 68 cm — 50 pièces par carton\n120519 : taille XXL extra long — longueur 150 cm, largeur 160 cm, manche 70 cm — 40 pièces par carton\nLe catalogue imprime le même code pour XXL et XXL extra long."
   },
   "en": {
    "nom": "Reinforced sterile surgical gown",
    "description": "Star-Set sterile single-use surgical gown in SSMMS (ST19) with front and forearm reinforcement, knitted cuffs, sizes M to XXL extra long. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Material: ST19 (SSMMS, 35 gsm), front and forearm reinforcement\n120219: size M — length 120 cm, width 145 cm, sleeve 55 cm — 50 pcs per carton\n120319: size L — length 125 cm, width 150 cm, sleeve 60 cm — 50 pcs per carton\n120419: size XL — length 130 cm, width 155 cm, sleeve 65 cm — 50 pcs per carton\n120519: size XXL — length 135 cm, width 160 cm, sleeve 68 cm — 50 pcs per carton\n120519: size XXL extra long — length 150 cm, width 160 cm, sleeve 70 cm — 40 pcs per carton\nThe catalogue prints the same code for XXL and XXL extra long."
   }
  },
  {
   "key": "plain",
   "ref": null,
   "slug": "starset-champ-simple",
   "cat": "unite",
   "img": "starset-champ-simple",
   "fr": {
    "nom": "Champ opératoire simple stérile",
    "description": "Champ opératoire simple stérile à usage unique Star-Set, en 11 dimensions de 50 x 50 à 200 x 200 cm, en ST16 ou ST20. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension\n402516 / 402520 : 50 x 50 cm\n409716 / 409720 : 50 x 75 cm\n406116 / 406120 : 60 x 90 cm\n402716 / 402720 : 75 x 75 cm\n402916 / 402920 : 75 x 90 cm\n403316 / 403320 : 100 x 100 cm\n409416 / 409420 : 100 x 120 cm\n403516 / 403520 : 100 x 150 cm\n404016 / 404020 : 140 x 150 cm\n404316 / 404320 : 150 x 180 cm\n4021916 / 4021920 : 200 x 200 cm\nCodes en …16 : ST16 (non-tissé absorbant + film PE, 54 g/m²) ; codes en …20 : ST20 (viscose + film PE, 56 g/m²)"
   },
   "en": {
    "nom": "Sterile surgical plain drape",
    "description": "Star-Set sterile single-use plain surgical drape, 11 sizes from 50 x 50 to 200 x 200 cm, in ST16 or ST20. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size\n402516 / 402520: 50 x 50 cm\n409716 / 409720: 50 x 75 cm\n406116 / 406120: 60 x 90 cm\n402716 / 402720: 75 x 75 cm\n402916 / 402920: 75 x 90 cm\n403316 / 403320: 100 x 100 cm\n409416 / 409420: 100 x 120 cm\n403516 / 403520: 100 x 150 cm\n404016 / 404020: 140 x 150 cm\n404316 / 404320: 150 x 180 cm\n4021916 / 4021920: 200 x 200 cm\nCodes ending …16: ST16 (absorbent nonwoven + PE film, 54 gsm); codes ending …20: ST20 (viscose + PE film, 56 gsm)"
   },
   "reuse": "ab2457e9-76e7-424a-8739-6db1af87469c"
  },
  {
   "key": "adh",
   "ref": null,
   "slug": "starset-champ-adhesif",
   "cat": "unite",
   "img": "starset-champ-adhesif",
   "fr": {
    "nom": "Champ opératoire avec bande adhésive stérile",
    "description": "Champ opératoire stérile à usage unique Star-Set avec bande adhésive anti-allergique pour la fixation au site opératoire, en 11 dimensions de 60 x 90 à 200 x 240 cm, en ST16 ou ST20. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension\n426116 / 426120 : 60 x 90 cm\n422716 / 422720 : 75 x 75 cm\n422916 / 422920 : 75 x 90 cm\n423316 / 423320 : 100 x 100 cm\n429416 / 429420 : 100 x 120 cm\n423516 / 423520 : 100 x 150 cm\n424316 / 424320 : 150 x 180 cm\n424416 / 424420 : 150 x 240 cm\n4212716 / 4212720 : 150 x 300 cm\n4221916 / 4221920 : 200 x 200 cm\n4220916 / 4220920 : 200 x 240 cm\nCodes en …16 : ST16 (non-tissé absorbant + film PE, 54 g/m²) ; codes en …20 : ST20 (viscose + film PE, 56 g/m²)"
   },
   "en": {
    "nom": "Sterile surgical drape with adhesive tape",
    "description": "Star-Set sterile single-use surgical drape with anti-allergic adhesive tape to fix it to the operating site, 11 sizes from 60 x 90 to 200 x 240 cm, in ST16 or ST20. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size\n426116 / 426120: 60 x 90 cm\n422716 / 422720: 75 x 75 cm\n422916 / 422920: 75 x 90 cm\n423316 / 423320: 100 x 100 cm\n429416 / 429420: 100 x 120 cm\n423516 / 423520: 100 x 150 cm\n424316 / 424320: 150 x 180 cm\n424416 / 424420: 150 x 240 cm\n4212716 / 4212720: 150 x 300 cm\n4221916 / 4221920: 200 x 200 cm\n4220916 / 4220920: 200 x 240 cm\nCodes ending …16: ST16 (absorbent nonwoven + PE film, 54 gsm); codes ending …20: ST20 (viscose + PE film, 56 gsm)"
   },
   "reuse": "f1ac0af6-cffa-4686-9854-443f1956155c"
  },
  {
   "key": "fen",
   "ref": null,
   "slug": "starset-champ-fenetre",
   "cat": "unite",
   "img": "starset-champ-fenetre",
   "fr": {
    "nom": "Champ opératoire fenêtré stérile",
    "description": "Champ opératoire fenêtré stérile à usage unique Star-Set, en 8 dimensions de 50 x 50 à 150 x 200 cm avec ouverture ronde, ovale ou carrée, en ST16 ou ST20. La taille de l'ouverture est à préciser à la commande. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — ouverture\n432516 / 432520 : 50 x 50 cm — ouverture Ø 6 cm\n439716 / 439720 : 50 x 75 cm — ouverture 5 x 7 (ovale) cm\n432716 / 432720 : 75 x 75 cm — ouverture Ø 8 cm\n432916 / 432920 : 75 x 90 cm — ouverture 10 x 10 (carrée) cm\n433316 / 433320 : 100 x 100 cm — ouverture Ø 10 cm\n439416 / 439420 : 100 x 120 cm — ouverture 10 x 16 (ovale) cm\n433516 / 433520 : 100 x 150 cm — ouverture 11 x 12 (carrée) cm\n434216 / 434220 : 150 x 200 cm — ouverture 14 x 15 (carrée) cm\nCodes en …16 : ST16 (non-tissé absorbant + film PE, 54 g/m²) ; codes en …20 : ST20 (viscose + film PE, 56 g/m²)\nPréciser la taille de l'ouverture à la commande"
   },
   "en": {
    "nom": "Sterile surgical fenestrated drape",
    "description": "Star-Set sterile single-use fenestrated surgical drape, 8 sizes from 50 x 50 to 150 x 200 cm with round, oval or square aperture, in ST16 or ST20. Please specify the hole size when ordering. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — aperture\n432516 / 432520: 50 x 50 cm — aperture Ø 6 cm\n439716 / 439720: 50 x 75 cm — aperture 5 x 7 (oval) cm\n432716 / 432720: 75 x 75 cm — aperture Ø 8 cm\n432916 / 432920: 75 x 90 cm — aperture 10 x 10 (square) cm\n433316 / 433320: 100 x 100 cm — aperture Ø 10 cm\n439416 / 439420: 100 x 120 cm — aperture 10 x 16 (oval) cm\n433516 / 433520: 100 x 150 cm — aperture 11 x 12 (square) cm\n434216 / 434220: 150 x 200 cm — aperture 14 x 15 (square) cm\nCodes ending …16: ST16 (absorbent nonwoven + PE film, 54 gsm); codes ending …20: ST20 (viscose + PE film, 56 gsm)\nPlease specify the hole size when ordering"
   },
   "reuse": "1db88eb4-543a-4988-aa31-c9b4713abb3d"
  },
  {
   "key": "afen",
   "ref": null,
   "slug": "starset-champ-fenetre-adhesif",
   "cat": "unite",
   "img": "starset-champ-fenetre-adhesif",
   "fr": {
    "nom": "Champ opératoire fenêtré adhésif stérile",
    "description": "Champ opératoire stérile à usage unique Star-Set avec ouverture adhésive, en 8 dimensions de 50 x 50 à 150 x 200 cm, ouverture ronde, ovale ou carrée, en ST16 ou ST20. La taille de l'ouverture est à préciser à la commande. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — ouverture\n452516 / 452520 : 50 x 50 cm — ouverture Ø 6 cm\n459716 / 459720 : 50 x 75 cm — ouverture 5 x 7 (ovale) cm\n452716 / 452720 : 75 x 75 cm — ouverture Ø 8 cm\n452916 / 452920 : 75 x 90 cm — ouverture 10 x 10 (carrée) cm\n453316 / 453320 : 100 x 100 cm — ouverture Ø 10 cm\n459416 / 459420 : 100 x 120 cm — ouverture 10 x 16 (ovale) cm\n453516 / 453520 : 100 x 150 cm — ouverture 11 x 12 (carrée) cm\n454216 / 454220 : 150 x 200 cm — ouverture 14 x 15 (carrée) cm\nCodes en …16 : ST16 (non-tissé absorbant + film PE, 54 g/m²) ; codes en …20 : ST20 (viscose + film PE, 56 g/m²)\nPréciser la taille de l'ouverture à la commande"
   },
   "en": {
    "nom": "Sterile surgical drape with adhesive fenestration",
    "description": "Star-Set sterile single-use surgical drape with adhesive aperture, 8 sizes from 50 x 50 to 150 x 200 cm, round, oval or square aperture, in ST16 or ST20. Please specify the hole size when ordering. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — aperture\n452516 / 452520: 50 x 50 cm — aperture Ø 6 cm\n459716 / 459720: 50 x 75 cm — aperture 5 x 7 (oval) cm\n452716 / 452720: 75 x 75 cm — aperture Ø 8 cm\n452916 / 452920: 75 x 90 cm — aperture 10 x 10 (square) cm\n453316 / 453320: 100 x 100 cm — aperture Ø 10 cm\n459416 / 459420: 100 x 120 cm — aperture 10 x 16 (oval) cm\n453516 / 453520: 100 x 150 cm — aperture 11 x 12 (square) cm\n454216 / 454220: 150 x 200 cm — aperture 14 x 15 (square) cm\nCodes ending …16: ST16 (absorbent nonwoven + PE film, 54 gsm); codes ending …20: ST20 (viscose + PE film, 56 gsm)\nPlease specify the hole size when ordering"
   },
   "reuse": "0c6d3580-6a3b-49d1-b432-5463ce05e0c7"
  },
  {
   "key": "eye1",
   "ref": "503518",
   "slug": "starset-champ-oph-503518",
   "cat": "ophtalmologie",
   "img": "starset-champ-oph-503518",
   "fr": {
    "nom": "Champ ophtalmique avec poche de recueil 503518",
    "description": "Champ ophtalmique stérile à usage unique Star-Set avec une poche de recueil des liquides (L.C.P.), 100 x 150 cm, en SSMMS (ST18). Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : 503518\nDimension : 100 x 150 cm\nMatière : ST18 (SSMMS, 43 g/m²)\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Eye drape with single L.C.P. 503518",
    "description": "Star-Set sterile single-use eye drape with one liquid collection pouch (L.C.P.), 100 x 150 cm, in SSMMS (ST18). Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: 503518\nSize: 100 x 150 cm\nMaterial: ST18 (SSMMS, 43 gsm)\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "eye2",
   "ref": "513716",
   "slug": "starset-champ-oph-513716",
   "cat": "ophtalmologie",
   "img": "starset-champ-oph-513716",
   "fr": {
    "nom": "Champ ophtalmique à double poche de recueil 513716",
    "description": "Champ ophtalmique stérile à usage unique Star-Set avec deux poches de recueil des liquides (L.C.P.), 120 x 120 cm, en ST16. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : 513716\nDimension : 120 x 120 cm\nMatière : ST16 (non-tissé absorbant + film PE, 54 g/m²)\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Eye drape with double L.C.P. 513716",
    "description": "Star-Set sterile single-use eye drape with two liquid collection pouches (L.C.P.), 120 x 120 cm, in ST16. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: 513716\nSize: 120 x 120 cm\nMaterial: ST16 (absorbent nonwoven + PE film, 54 gsm)\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "eye3",
   "ref": "5118039",
   "slug": "starset-champ-oph-5118039",
   "cat": "ophtalmologie",
   "img": "starset-champ-oph-5118039",
   "fr": {
    "nom": "Champ ophtalmique transparent à double poche de recueil 5118039",
    "description": "Champ ophtalmique transparent stérile à usage unique Star-Set avec deux poches de recueil des liquides, 65 x 110 cm, en PE gaufré antistatique (ST39), matériau qui n'est pas affecté par les particules au bloc opératoire. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : 5118039\nDimension : 65 x 110 cm\nMatière : ST39 (PE gaufré antistatique, 40 µ)\nConditionnement : 250 pièces par carton"
   },
   "en": {
    "nom": "Transparent eye drape with double L.C.P. 5118039",
    "description": "Star-Set sterile single-use transparent eye drape with two liquid collection pouches, 65 x 110 cm, in embossed anti-static PE (ST39), a material not affected by particles in the operating room. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: 5118039\nSize: 65 x 110 cm\nMaterial: ST39 (embossed anti-static PE, 40 µ)\nPacking: 250 pcs per carton"
   }
  },
  {
   "key": "tur",
   "ref": "5312420",
   "slug": "starset-champ-tur-5312420",
   "cat": "urologie",
   "img": "starset-champ-tur-5312420",
   "fr": {
    "nom": "Champ TUR avec poche de recueil 5312420",
    "description": "Champ stérile à usage unique Star-Set pour résection transurétrale (TUR), avec poche de recueil des liquides, 180 x 240 cm, en viscose + film PE (ST20). Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : 5312420\nDimension : 180 x 240 cm\nMatière : ST20 (viscose + film PE, 56 g/m²)\nConditionnement : 30 pièces par carton"
   },
   "en": {
    "nom": "TUR drape with L.C.P. 5312420",
    "description": "Star-Set sterile single-use drape for transurethral resection (TUR), with liquid collection pouch, 180 x 240 cm, in viscose + PE film (ST20). Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: 5312420\nSize: 180 x 240 cm\nMaterial: ST20 (viscose + PE film, 56 gsm)\nPacking: 30 pcs per carton"
   }
  },
  {
   "key": "cam",
   "ref": "665045",
   "slug": "starset-housse-camera",
   "cat": "unite",
   "img": "starset-housse-camera",
   "fr": {
    "nom": "Housse de caméra stérile",
    "description": "Housse de caméra stérile à usage unique Star-Set, 13,5 x 240 cm. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n665045 : 13.5 x 240 cm — ST45 — 125"
   },
   "en": {
    "nom": "Sterile camera cover",
    "description": "Star-Set sterile single-use camera cover, 13.5 x 240 cm. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n665045: 13.5 x 240 cm — ST45 — 125"
   }
  },
  {
   "key": "scopy",
   "ref": "6721743 / 6715750 / 6717540",
   "slug": "starset-housse-scopy",
   "cat": "unite",
   "img": "starset-housse-scopy",
   "fr": {
    "nom": "Housse de scopie (C-arm) stérile",
    "description": "Housse stérile à usage unique Star-Set pour amplificateur de brillance (scopie), en PE transparent antistatique, en 3 dimensions. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n6721743 : 120 x 280 cm — ST43 (PE transparent antistatique 40 µ (laize 120 cm)) — 50\n6715750 : 85 x 170 cm — ST50 (PE transparent antistatique 50 µ (85 x 170 cm)) — 100\n6717540 : 80 x 105 cm — ST40 (PE transparent antistatique 40 µ (laize 90 cm)) — 100"
   },
   "en": {
    "nom": "Sterile scopy cover",
    "description": "Star-Set sterile single-use scopy (C-arm) cover in anti-static transparent PE, 3 sizes. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n6721743: 120 x 280 cm — ST43 (anti-static transparent PE 40 µ (120 cm)) — 50\n6715750: 85 x 170 cm — ST50 (anti-static transparent PE 50 µ (85 x 170 cm)) — 100\n6717540: 80 x 105 cm — ST40 (anti-static transparent PE 40 µ (90 cm)) — 100"
   }
  },
  {
   "key": "fluo",
   "ref": "645040 / 643343 / 643743",
   "slug": "starset-housse-fluoroscopie",
   "cat": "unite",
   "img": "starset-housse-fluoroscopie",
   "fr": {
    "nom": "Housse de fluoroscopie stérile",
    "description": "Housse de fluoroscopie stérile à usage unique Star-Set, élastiquée, en PE transparent antistatique, diamètres 85, 100 et 120 cm. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n645040 : Ø 85 cm — ST40 (PE transparent antistatique 40 µ (laize 90 cm)) — 100\n643343 : Ø 100 cm — ST43 (PE transparent antistatique 40 µ (laize 120 cm)) — 100\n643743 : Ø 120 cm — ST43 (PE transparent antistatique 40 µ (laize 120 cm)) — 100"
   },
   "en": {
    "nom": "Sterile fluoroscopy cover",
    "description": "Star-Set sterile single-use elasticated fluoroscopy cover in anti-static transparent PE, diameters 85, 100 and 120 cm. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n645040: Ø 85 cm — ST40 (anti-static transparent PE 40 µ (90 cm)) — 100\n643343: Ø 100 cm — ST43 (anti-static transparent PE 40 µ (120 cm)) — 100\n643743: Ø 120 cm — ST43 (anti-static transparent PE 40 µ (120 cm)) — 100"
   }
  },
  {
   "key": "table",
   "ref": "553536 / 564216",
   "slug": "starset-champ-table-instruments",
   "cat": "unite",
   "img": "starset-champ-table-instruments",
   "fr": {
    "nom": "Champ de table d'instruments stérile",
    "description": "Champ stérile à usage unique Star-Set pour table d'instruments, 100 x 150 cm (avec zone renforcée, ST36) ou 150 x 200 cm (ST16). Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n553536 : 100 x 150 cm — ST36 — 150\n564216 : 150 x 200 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 80"
   },
   "en": {
    "nom": "Sterile instrument table cover",
    "description": "Star-Set sterile single-use instrument table cover, 100 x 150 cm (with reinforced area, ST36) or 150 x 200 cm (ST16). Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n553536: 100 x 150 cm — ST36 — 150\n564216: 150 x 200 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 80"
   }
  },
  {
   "key": "mayo",
   "ref": "578137",
   "slug": "starset-housse-table-mayo",
   "cat": "unite",
   "img": "starset-housse-table-mayo",
   "fr": {
    "nom": "Housse de table Mayo stérile",
    "description": "Housse stérile à usage unique Star-Set pour table Mayo, 80 x 150 cm, avec zone renforcée. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n578137 : 80 x 150 cm — ST37 — 100"
   },
   "en": {
    "nom": "Sterile Mayo stand cover",
    "description": "Star-Set sterile single-use Mayo stand cover, 80 x 150 cm, with reinforced area. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n578137: 80 x 150 cm — ST37 — 100"
   }
  },
  {
   "key": "foot",
   "ref": "805020",
   "slug": "starset-couvre-pieds",
   "cat": "unite",
   "img": "starset-couvre-pieds",
   "fr": {
    "nom": "Couvre-pieds stérile (paire)",
    "description": "Paire de couvre-pieds stériles à usage unique Star-Set, 25 x 40 cm, en viscose + film PE (ST20). Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n805020 : 25 x 40 cm — ST20 (viscose + film PE, 56 g/m²) — 75"
   },
   "en": {
    "nom": "Sterile foot cover (pair)",
    "description": "Star-Set pair of sterile single-use foot covers, 25 x 40 cm, in viscose + PE film (ST20). Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n805020: 25 x 40 cm — ST20 (viscose + PE film, 56 gsm) — 75"
   }
  },
  {
   "key": "leg1",
   "ref": "6122316 / 612416 / 613016",
   "slug": "starset-housse-jambe",
   "cat": "unite",
   "img": "starset-housse-jambe",
   "fr": {
    "nom": "Housse de jambe stérile (sachet unitaire)",
    "description": "Housse de jambe stérile à usage unique Star-Set, conditionnée à l'unité, en 3 dimensions, en ST16. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n6122316 : 36 x 85 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 150\n612416 : 60 x 115 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 80\n613016 : 75 x 120 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 75"
   },
   "en": {
    "nom": "Sterile leg cover (single pack)",
    "description": "Star-Set sterile single-use leg cover, single pack, 3 sizes, in ST16. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n6122316: 36 x 85 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 150\n612416: 60 x 115 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 80\n613016: 75 x 120 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 75"
   }
  },
  {
   "key": "leg2",
   "ref": "622316 / 622416 / 623016",
   "slug": "starset-housses-jambe-paire",
   "cat": "unite",
   "img": "starset-housses-jambe-paire",
   "fr": {
    "nom": "Housses de jambe stériles (paire)",
    "description": "Paire de housses de jambe stériles à usage unique Star-Set, en 3 dimensions, en ST16. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n622316 : 37 x 80 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 100\n622416 : 60 x 115 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 50\n623016 : 75 x 120 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 50"
   },
   "en": {
    "nom": "Sterile leg covers (double pack)",
    "description": "Star-Set pair of sterile single-use leg covers, 3 sizes, in ST16. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n622316: 37 x 80 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 100\n622416: 60 x 115 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 50\n623016: 75 x 120 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 50"
   }
  },
  {
   "key": "stock",
   "ref": "726516 / 728516 / 7222316",
   "slug": "starset-jersey-tubulaire",
   "cat": "unite",
   "img": "starset-jersey-tubulaire",
   "fr": {
    "nom": "Jersey tubulaire stérile (stockinet)",
    "description": "Jersey tubulaire stérile à usage unique Star-Set pour membre, en 3 dimensions, en ST16. Stérile (oxyde d'éthylène, EN ISO 11135), à usage unique ; non-tissés conformes à la norme EN 13795.",
    "fiche_technique": "Code : dimension — matière — pièces par carton\n726516 : 36 x 75 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 80\n728516 : 32 x 120 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 60\n7222316 : 36 x 85 cm — ST16 (non-tissé absorbant + film PE, 54 g/m²) — 80"
   },
   "en": {
    "nom": "Sterile stockinet",
    "description": "Star-Set sterile single-use limb stockinet, 3 sizes, in ST16. Sterile (ethylene oxide, EN ISO 11135), single use; nonwovens conforming to EN 13795.",
    "fiche_technique": "Code: size — material — pcs per carton\n726516: 36 x 75 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 80\n728516: 32 x 120 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 60\n7222316: 36 x 85 cm — ST16 (absorbent nonwoven + PE film, 54 gsm) — 80"
   }
  },
  {
   "key": "pg",
   "ref": "215013",
   "slug": "starset-blouse-patient",
   "cat": "tenues",
   "img": "starset-blouse-patient",
   "fr": {
    "nom": "Blouse patient",
    "description": "Blouse patient Star-Set à manches courtes, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 215013\nDimension : XL\nMatière : ST13\nConditionnement : 125 pièces par carton"
   },
   "en": {
    "nom": "Patient gown",
    "description": "Star-Set short-sleeve patient gown, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 215013\nSize: XL\nMaterial: ST13\nPacking: 125 pcs per carton"
   }
  },
  {
   "key": "pgl",
   "ref": "225013",
   "slug": "starset-blouse-patient-manches-longues",
   "cat": "tenues",
   "img": "starset-blouse-patient-manches-longues",
   "fr": {
    "nom": "Blouse patient manches longues",
    "description": "Blouse patient Star-Set à manches longues, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 225013\nDimension : XL\nMatière : ST13\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Patient gown, long sleeve",
    "description": "Star-Set long-sleeve patient gown, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 225013\nSize: XL\nMaterial: ST13\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "vg",
   "ref": "205013",
   "slug": "starset-blouse-visiteur",
   "cat": "tenues",
   "img": "starset-blouse-visiteur",
   "fr": {
    "nom": "Blouse visiteur",
    "description": "Blouse visiteur Star-Set, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 205013\nDimension : XL\nMatière : ST13\nConditionnement : 125 pièces par carton"
   },
   "en": {
    "nom": "Visitor gown",
    "description": "Star-Set visitor gown, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 205013\nSize: XL\nMaterial: ST13\nPacking: 125 pcs per carton"
   }
  },
  {
   "key": "chemo",
   "ref": "320419",
   "slug": "starset-blouse-chimiotherapie",
   "cat": "tenues",
   "img": "starset-blouse-chimiotherapie",
   "fr": {
    "nom": "Blouse de chimiothérapie",
    "description": "Blouse de chimiothérapie Star-Set en SSMMS (ST19) avec renfort avant et avant-bras, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 320419\nDimension : XL\nMatière : ST19 (SSMMS, 35 g/m²)\nConditionnement : 75 pièces par carton"
   },
   "en": {
    "nom": "Chemotherapy gown",
    "description": "Star-Set chemotherapy gown in SSMMS (ST19) with front and forearm reinforcement, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 320419\nSize: XL\nMaterial: ST19 (SSMMS, 35 gsm)\nPacking: 75 pcs per carton"
   }
  },
  {
   "key": "shirt",
   "ref": "330418",
   "slug": "starset-tunique",
   "cat": "tenues",
   "img": "starset-tunique",
   "fr": {
    "nom": "Tunique",
    "description": "Tunique Star-Set en SSMMS (ST18), taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 330418\nDimension : XL\nMatière : ST18 (SSMMS, 43 g/m²)\nConditionnement : 150 pièces par carton"
   },
   "en": {
    "nom": "Shirt",
    "description": "Star-Set shirt in SSMMS (ST18), size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 330418\nSize: XL\nMaterial: ST18 (SSMMS, 43 gsm)\nPacking: 150 pcs per carton"
   }
  },
  {
   "key": "shirtpants",
   "ref": "350418",
   "slug": "starset-tunique-pantalon",
   "cat": "tenues",
   "img": "starset-tunique-pantalon",
   "fr": {
    "nom": "Ensemble tunique et pantalon",
    "description": "Ensemble tunique et pantalon Star-Set en SSMMS (ST18), taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 350418\nDimension : XL\nMatière : ST18 (SSMMS, 43 g/m²)\nConditionnement : 75 pièces par carton"
   },
   "en": {
    "nom": "Shirt and pants set",
    "description": "Star-Set shirt and pants set in SSMMS (ST18), size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 350418\nSize: XL\nMaterial: ST18 (SSMMS, 43 gsm)\nPacking: 75 pcs per carton"
   }
  },
  {
   "key": "colop",
   "ref": "360418",
   "slug": "starset-pantalon-coloscopie",
   "cat": "tenues",
   "img": "starset-pantalon-coloscopie",
   "fr": {
    "nom": "Pantalon de coloscopie",
    "description": "Pantalon de coloscopie Star-Set en SSMMS (ST18) avec ouverture arrière, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 360418\nDimension : XL\nMatière : ST18 (SSMMS, 43 g/m²)\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Colonoscopy pants",
    "description": "Star-Set colonoscopy pants in SSMMS (ST18) with rear opening, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 360418\nSize: XL\nMaterial: ST18 (SSMMS, 43 gsm)\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "colos",
   "ref": "390418",
   "slug": "starset-short-coloscopie",
   "cat": "tenues",
   "img": "starset-short-coloscopie",
   "fr": {
    "nom": "Short de coloscopie",
    "description": "Short de coloscopie Star-Set en SSMMS (ST18) avec ouverture arrière, taille XL. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 390418\nDimension : XL\nMatière : ST18 (SSMMS, 43 g/m²)\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Colonoscopy shorts",
    "description": "Star-Set colonoscopy shorts in SSMMS (ST18) with rear opening, size XL. Non-sterile single-use product.",
    "fiche_technique": "Code: 390418\nSize: XL\nMaterial: ST18 (SSMMS, 43 gsm)\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "pillow",
   "ref": "849003",
   "slug": "starset-taie-oreiller",
   "cat": "protection",
   "img": "starset-taie-oreiller",
   "fr": {
    "nom": "Taie d'oreiller",
    "description": "Taie d'oreiller Star-Set en spunbond blanc (ST03), 50 x 70 cm. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 849003\nDimension : 50 x 70 cm\nMatière : ST03 (spunbond blanc, 50 g/m²)\nConditionnement : 100 pièces par carton"
   },
   "en": {
    "nom": "Pillow cover",
    "description": "Star-Set pillow cover in white spunbond (ST03), 50 x 70 cm. Non-sterile single-use product.",
    "fiche_technique": "Code: 849003\nSize: 50 x 70 cm\nMaterial: ST03 (white spunbond, 50 gsm)\nPacking: 100 pcs per carton"
   }
  },
  {
   "key": "linen",
   "ref": "9322103",
   "slug": "starset-parure-de-lit",
   "cat": "protection",
   "img": "starset-parure-de-lit",
   "fr": {
    "nom": "Parure de lit (nevresim)",
    "description": "Parure de lit Star-Set en spunbond blanc (ST03), 160 x 200 cm. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 9322103\nDimension : 160 x 200 cm\nMatière : ST03 (spunbond blanc, 50 g/m²)\nConditionnement : 50 pièces par carton"
   },
   "en": {
    "nom": "Linens",
    "description": "Star-Set linens in white spunbond (ST03), 160 x 200 cm. Non-sterile single-use product.",
    "fiche_technique": "Code: 9322103\nSize: 160 x 200 cm\nMaterial: ST03 (white spunbond, 50 gsm)\nPacking: 50 pcs per carton"
   }
  },
  {
   "key": "laser",
   "ref": "860001",
   "slug": "starset-masque-laser",
   "cat": "protection",
   "img": "starset-masque-laser",
   "fr": {
    "nom": "Masque oculaire laser",
    "description": "Masque de protection oculaire laser Star-Set. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 860001\nConditionnement : 150 pièces par carton"
   },
   "en": {
    "nom": "Laser eye mask",
    "description": "Star-Set laser eye mask. Non-sterile single-use product.",
    "fiche_technique": "Code: 860001\nPacking: 150 pcs per carton"
   }
  },
  {
   "key": "laseruv",
   "ref": "860002",
   "slug": "starset-masque-laser-uv",
   "cat": "protection",
   "img": "starset-masque-laser-uv",
   "fr": {
    "nom": "Masque oculaire laser U.V.",
    "description": "Masque de protection oculaire laser U.V. Star-Set. Produit non stérile à usage unique.",
    "fiche_technique": "Code : 860002\nConditionnement : 150 pièces par carton"
   },
   "en": {
    "nom": "Laser eye mask U.V.",
    "description": "Star-Set laser eye mask U.V. Non-sterile single-use product.",
    "fiche_technique": "Code: 860002\nPacking: 150 pcs per carton"
   }
  },
  {
   "key": "stretcher",
   "ref": "8718103 / 8712103",
   "slug": "starset-drap-brancard",
   "cat": "protection",
   "img": "starset-drap-brancard",
   "fr": {
    "nom": "Drap de brancard",
    "description": "Drap de brancard Star-Set en spunbond blanc (ST03), 80 x 190 ou 80 x 220 cm. Produit non stérile à usage unique.",
    "fiche_technique": "Matière : ST03 (spunbond blanc, 50 g/m²)\n8718103 : 80 x 190 cm — 75 pièces par carton\n8712103 : 80 x 220 cm — 75 pièces par carton"
   },
   "en": {
    "nom": "Stretcher cover",
    "description": "Star-Set stretcher cover in white spunbond (ST03), 80 x 190 or 80 x 220 cm. Non-sterile single-use product.",
    "fiche_technique": "Material: ST03 (white spunbond, 50 gsm)\n8718103: 80 x 190 cm — 75 pcs per carton\n8712103: 80 x 220 cm — 75 pcs per carton"
   }
  },
  {
   "key": "wrap",
   "ref": "9113407 / 913707 / 913307 / 912707 / 912507",
   "slug": "starset-feuille-sterilisation",
   "cat": "protection",
   "img": "starset-feuille-sterilisation",
   "fr": {
    "nom": "Feuille de stérilisation",
    "description": "Feuille de stérilisation Star-Set en non-tissé (ST07, 60 g/m²) : grâce à sa structure non tissée, elle garde les produits emballés stériles pendant une durée déterminée, jusqu'à l'ouverture au bloc opératoire. 5 dimensions de 50 x 50 à 130 x 150 cm. Produit non stérile à usage unique.",
    "fiche_technique": "Matière : ST07 (non-tissé de stérilisation, 60 g/m²)\n9113407 : 130 x 150 cm\n913707 : 120 x 120 cm\n913307 : 100 x 100 cm\n912707 : 75 x 75 cm\n912507 : 50 x 50 cm"
   },
   "en": {
    "nom": "Sterilization wrap",
    "description": "Star-Set nonwoven sterilization wrap (ST07, 60 gsm): its nonwoven structure keeps the wrapped products sterile for a set period, until the wrap is opened in the operating room. 5 sizes from 50 x 50 to 130 x 150 cm. Non-sterile single-use product.",
    "fiche_technique": "Material: ST07 (sterilization wrap nonwoven, 60 gsm)\n9113407: 130 x 150 cm\n913707: 120 x 120 cm\n913307: 100 x 100 cm\n912707: 75 x 75 cm\n912507: 50 x 50 cm"
   }
  },
  {
   "key": "mask",
   "ref": "985001 / 985002",
   "slug": "starset-masque-chirurgical",
   "cat": "protection",
   "img": "starset-masque-chirurgical",
   "fr": {
    "nom": "Masque chirurgical 3 plis type IIR",
    "description": "Masque chirurgical Star-Set 3 plis de type IIR, testé selon la norme EN 14683 : barrette nasale en aluminium ajustable, élastiques souples, couche intérieure et extérieure SMMS, couche filtrante meltblown haute densité, sans latex, très faible peluchage, fabriqué et emballé en zone contrôlée. Dimensions 175 x 95 mm. Code 985002 : version meltblown. Produit non stérile à usage unique.",
    "fiche_technique": "Codes : 985001 ; 985002 (meltblown)\nType IIR, testé selon EN 14683\nCouches : SMMS / meltblown haute densité / SMMS\nPoids matière : 75 g\nDimensions : 9,5 x 17,5 cm\nBoîte de 50 : 1600 masques par carton ; boîte de 10 : 1000 masques par carton\nSans latex"
   },
   "en": {
    "nom": "3-layer surgical mask type IIR",
    "description": "Star-Set 3-layer type IIR surgical mask, tested to EN 14683: adjustable aluminium nose piece, soft ear loops, SMMS inner and outer layers, high-density meltblown filter layer, latex free, ultra-low lint, produced and packed in a controlled area. Dimensions 175 x 95 mm. Code 985002: meltblown version. Non-sterile single-use product.",
    "fiche_technique": "Codes: 985001; 985002 (meltblown)\nType IIR, tested to EN 14683\nLayers: SMMS / high-density meltblown / SMMS\nMaterial weight: 75 g\nDimensions: 9.5 x 17.5 cm\nBox of 50: 1600 masks per carton; box of 10: 1000 masks per carton\nLatex free"
   }
  },
  {
   "key": "shield",
   "ref": "FS1050",
   "slug": "starset-visiere",
   "cat": "protection",
   "img": "starset-visiere",
   "fr": {
    "nom": "Visière de protection faciale",
    "description": "Visière de protection Star-Set : protection du visage à 180°, anti-buée, sans latex, bandeau mousse et serre-tête, transmission lumineuse de 99 %, légère, se porte facilement avec des lunettes, résistante aux liquides. Dimensions 30 x 24 cm. Produit non stérile à usage unique.",
    "fiche_technique": "Code : FS1050\nDimensions : 30 x 24 cm\nProtection à 180°, anti-buée, sans latex\nBandeau mousse et serre-tête\nTransmission lumineuse : 99 %\nConditionnement : 150 pièces par carton"
   },
   "en": {
    "nom": "Face shield",
    "description": "Star-Set face shield: 180° full face protection, anti-fog, latex free, foam tape and headband, 99% light transmittance, lightweight, easily worn with glasses, liquid resistant. Dimensions 30 x 24 cm. Non-sterile single-use product.",
    "fiche_technique": "Code: FS1050\nDimensions: 30 x 24 cm\n180° protection, anti-fog, latex free\nFoam tape and headband\nLight transmittance: 99%\nPacking: 150 pcs per carton"
   }
  }
 ]
};

const CATS = DATA.categories.map((c, i) => ({ ...c, id: cid(i + 1), sort: i + 1 }));
const catId = Object.fromEntries(CATS.map((c) => [c.key, c.id]));
let n = 0;
const sortIn = {};
const PRODUCTS = DATA.products.map((p) => {
  sortIn[p.cat] = (sortIn[p.cat] || 0) + 1;
  return { ...p, id: p.reuse || pid(++n), sort: sortIn[p.cat] };
});
const REUSED = PRODUCTS.filter((p) => p.reuse).map((p) => p.id);

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const out = { taken_at: new Date().toISOString(), categories: {}, products: {}, partner: null };
  const root = await prisma.categories.findUnique({ where: { slug: ROOT }, include: { category_translations: true } });
  { const { category_translations, ...row } = root; out.categories[ROOT] = { row, translations: category_translations }; }
  const products = await prisma.products.findMany({ where: { id: { in: REUSED } }, include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  out.partner = await prisma.partners.findUnique({ where: { id: PARTNER } });
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: 1 category, ${products.length} products, partner -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);

async function apply() {
  const root = await prisma.categories.findUnique({ where: { slug: ROOT } });
  if (!root) throw new Error("root category drapage missing (script 79)");
  if (!exists(PDF)) console.log(`  [MISSING FILE] ${PDF}`);

  // refs / slugs must not collide with rows outside this script
  const ours = new Set(PRODUCTS.map((p) => p.id));
  const clash = await prisma.products.findMany({ where: { OR: [
    { reference_fournisseur: { in: PRODUCTS.filter((p) => p.ref).map((p) => p.ref) } },
    { slug: { in: PRODUCTS.map((p) => p.slug) } } ] }, select: { id: true, slug: true, reference_fournisseur: true } });
  const bad = clash.filter((c) => !ours.has(c.id));
  if (bad.length) { console.log("  [CONFLICT]", bad); throw new Error("ref/slug conflict"); }

  for (const c of CATS) {
    if (!exists(cimg(c.image))) console.log(`  [MISSING FILE] ${cimg(c.image)}`);
    const row = await prisma.categories.findUnique({ where: { id: c.id }, include: { category_translations: true } });
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » / « ${c.en} » (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, parent_id: root.id, sort_order: c.sort,
        is_active: true, type: "category", image_url: cimg(c.image), updated_at: now(),
        category_translations: { create: [{ id: `${c.id}-fr`, language_code: "fr", name: c.fr }, { id: `${c.id}-en`, language_code: "en", name: c.en }] } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== root.id) data.parent_id = root.id;
    if (row.sort_order !== c.sort) data.sort_order = c.sort;
    if (row.image_url !== cimg(c.image)) data.image_url = cimg(c.image);
    if (!row.is_active) data.is_active = true;
    if (row.name !== c.fr) data.name = c.fr;
    const trOk = ["fr", "en"].every((l) => row.category_translations.find((t) => t.language_code === l)?.name === c[l]);
    if (!Object.keys(data).length && trOk) { console.log(`  [SKIP] category ${c.slug}`); continue; }
    console.log(`  category ${c.slug} ${JSON.stringify(data)}${trOk ? "" : " names"}`);
    if (!WRITE) continue;
    await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
    for (const l of ["fr", "en"]) await prisma.category_translations.upsert({ where: { category_id_language_code: { category_id: c.id, language_code: l } },
      update: { name: c[l] }, create: { id: `${c.id}-${l}`, category_id: c.id, language_code: l, name: c[l] } });
  }

  for (const p of PRODUCTS) {
    if (!exists(pimg(p.img))) console.log(`  [MISSING FILE] ${pimg(p.img)}`);
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = { id: `${p.id}-m84`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    if (!row) {
      if (p.reuse) { console.log(`  [MISSING PRODUCT] ${p.id}`); continue; }
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat}`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat],
        constructeur: CONSTRUCTEUR, partner_id: PARTNER, status: "active", sort_order: p.sort, pdf_brochure_url: PDF, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    if (row.category_id !== catId[p.cat]) data.category_id = catId[p.cat];
    if (row.status !== "active") data.status = "active";
    if (row.sort_order !== p.sort) data.sort_order = p.sort;
    if (row.pdf_brochure_url !== PDF) data.pdf_brochure_url = PDF;
    if (p.ref && row.reference_fournisseur !== p.ref) data.reference_fournisseur = p.ref;
    if (row.constructeur !== CONSTRUCTEUR) data.constructeur = CONSTRUCTEUR;
    if (row.partner_id !== PARTNER) data.partner_id = PARTNER;
    if (p.reuse && row.slug !== p.slug) data.slug = p.slug;
    const tr = [];
    for (const lang of ["fr", "en"]) {
      const t = row.product_translations.find((x) => x.language_code === lang);
      if (!t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k]))) tr.push(lang);
    }
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary;
    if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${row.slug}`); continue; }
    const fr = row.product_translations.find((x) => x.language_code === "fr");
    console.log(`  product ${row.slug.padEnd(44)} « ${fr?.nom?.trim()} » -> « ${p.fr.nom} »`);
    console.log(`      ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : ` photo ${media.url} (replaces ${row.product_media.length})`}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({
        where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: crypto.randomUUID(), product_id: p.id, language_code: lang, ...p[lang] } });
      if (!mediaOk) {
        await tx.product_media.deleteMany({ where: { product_id: p.id } });
        await tx.product_media.create({ data: { ...media, product_id: p.id } });
      }
    });
  }

  const partner = await prisma.partners.findUnique({ where: { id: PARTNER } });
  const pdata = {};
  if (partner.status !== "active") pdata.status = "active";
  if (partner.default_pdf_url !== PDF) pdata.default_pdf_url = PDF;
  if (!Object.keys(pdata).length) console.log("  [SKIP] partner Star-set");
  else { console.log(`  partner Star-set ${JSON.stringify(pdata)}`); if (WRITE) await prisma.partners.update({ where: { id: PARTNER }, data: { ...pdata, updated_at: now() } }); }
}

// ---------------------------------------------------------------- revert
async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  product ${b.row.slug} -> ${b.row.category_id} ${b.row.status}`);
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
  const del = await prisma.products.deleteMany({ where: { id: { in: PRODUCTS.map((p) => p.id).filter((id) => !BEFORE.products[id]) } } });
  console.log(`  - deleted ${del.count} new products`);
  { const { id, created_at, ...row } = BEFORE.partner; console.log("  partner Star-set"); await prisma.partners.update({ where: { id }, data: { ...row, updated_at: now() } }); }
  for (const [slug, b] of Object.entries(BEFORE.categories)) {
    const { id, created_at, ...row } = b.row;
    console.log(`  category ${slug}`);
    await prisma.categories.update({ where: { id }, data: { ...row, updated_at: now() } });
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
