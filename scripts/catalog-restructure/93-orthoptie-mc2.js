const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-16 -- client (WhatsApp): « Dans ORTHOPTIE mettre la gamme MC2 uniquement,
 * ne pas répéter les catégories de l'ophtalmologie » + « regarde si tu as le catalogue MC2 ».
 * Source: « MC2 catalogue.pdf » (MC2 - Le Matériel Professionnel, Lambesc, 36 p.).
 *
 * New top-level category « Orthoptie » (slug orthoptie, EN « Orthoptics »), placed right
 * after Ophtalmologie (sort_order 2; the following top-level categories move down by one,
 * as in the homepage mockup order). Its content is ONLY the « Orthoptie » section of the
 * MC2 catalogue (p.25-32); the Consultation / Réfraction / Basse vision / Consommables
 * sections are ophthalmology categories already on the site and are not repeated.
 * Six sub-categories follow the catalogue's own orthoptics families:
 *
 *   Synoptophore et tables                         p.25
 *   Échelles d'acuité visuelle                     p.26-28
 *   Tests de vision binoculaire                    p.29-30 (stéréo, Worth, Malett, Vectogram)
 *   Vision des couleurs, Amsler et coordimètre     p.30
 *   Faces, Maddox et prismes                       p.31
 *   Occlusion et traitement de l'amblyopie         p.32
 *
 * One product per catalogue entry (57); entries grouped on one catalogue line (e.g. the
 * plastic charts T1-T10, Opticlude EC 200 / EC 201) are one product. Not created: « Test du
 * Renne », « Livrets de traitement » and « Matériels divers » (no photo in the catalogue).
 * Each product: FR/EN name, description and fiche from the catalogue, photo extracted from
 * the catalogue (mc2-*.jpg), partner MC2 (created, logo cut from the cover), the catalogue
 * PDF (/uploads/pdfs/mc2-catalogue-produits.pdf). The INAMI « Synoptophore LED » already
 * in Ophtalmologie is another brand and is not touched.
 *
 * REVERT POINT: 93-before.json (--snapshot, refuses to overwrite) = sort_order of every
 * top-level category before the insert. --revert puts those back and deletes the 57
 * products, the 7 categories and the MC2 partner (all created with fixed ids).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 93-orthoptie-mc2.js <app>:/tmp/93.js ; docker cp 93-before.json <app>:/tmp/93-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/93.js [--snapshot|--apply|--revert]
 * The mc2-*.jpg photos (products/), mc2-tile-*.jpg + q93-orthoptie.jpg (categories/),
 * mc2-logo.png (partners/) and the catalogue PDF (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "93-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();

const PDF = "/uploads/pdfs/mc2-catalogue-produits.pdf";
const pimg = (n) => `/uploads/products/mc2-${n}.jpg`;
const cimg = (n) => `/uploads/categories/mc2-tile-${n}.jpg`;

const PARTNER = {
  id: "a93a0001-0000-4000-8000-000000000001", slug: "mc2", name: "MC2", website: "http://www.mc2medical.com",
  logo: "/uploads/partners/mc2-logo.png",
  fr: "MC2 - Le Matériel Professionnel : fabricant et distributeur français de matériel d'ophtalmologie et d'orthoptie (échelles d'acuité, tests de vision binoculaire, synoptophore, prismes, occlusion), partenaire des orthoptistes depuis 1989.",
  en: "MC2 - Le Matériel Professionnel: French maker and distributor of ophthalmology and orthoptics equipment (visual acuity charts, binocular vision tests, synoptophore, prisms, occlusion), working with orthoptists since 1989.",
};

const ROOT = {
  id: "c93a0001-0000-4000-8000-000000000000", slug: "orthoptie", sort: 2, image: "/uploads/categories/q93-orthoptie.jpg",
  fr: "Orthoptie", en: "Orthoptics",
  dfr: "Matériel d'orthoptie MC2 : échelles d'acuité, tests de vision binoculaire et des couleurs, synoptophore, prismes, Maddox et occlusion.",
  den: "MC2 orthoptics equipment: acuity charts, binocular and colour vision tests, synoptophore, prisms, Maddox and occlusion.",
};

// ---------------------------------------------------------------- categories
const cid = (n) => `c93a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const CATS = [
  { slug: "mc2-synoptophore-tables", tile: "synoptophore-tables", fr: "Synoptophore et tables", en: "Synoptophore and tables",
    dfr: "Synoptophore MC2 pour l'analyse des déviations et de la vision binoculaire, et tables électriques d'orthoptie.",
    den: "MC2 synoptophore for the analysis of deviations and binocular vision, and electric orthoptics tables." },
  { slug: "mc2-echelles-acuite-visuelle", tile: "echelles-acuite", fr: "Échelles d'acuité visuelle", en: "Visual acuity charts",
    dfr: "Échelles d'acuité visuelle de loin (VL) et de près (VP) : Monoyer, Parinaud, Rossano, Pigassou, Galinet, Théophane, contrastes.",
    den: "Distance and near visual acuity charts: Monoyer, Parinaud, Rossano, Pigassou, Galinet, Théophane, contrast." },
  { slug: "mc2-tests-vision-binoculaire", tile: "tests-binoculaires", fr: "Tests de vision binoculaire", en: "Binocular vision tests",
    dfr: "Tests de vision du relief et de vision binoculaire (Mouche, TNO, Lang, Randot, Worth), disparité de fixation (Malett) et entraînement visuel.",
    den: "Stereo and binocular vision tests (Fly, TNO, Lang, Randot, Worth), fixation disparity (Mallett) and vision training." },
  { slug: "mc2-couleurs-amsler-coordimetre", tile: "couleurs-amsler-coordimetre", fr: "Vision des couleurs, Amsler et coordimètre", en: "Colour vision, Amsler and coordimeter",
    dfr: "Tests de vision des couleurs (Ishihara, Farnsworth), grille d'Amsler, coordimètre de Weiss et torche de Kratz.",
    den: "Colour vision tests (Ishihara, Farnsworth), Amsler grid, Weiss coordimeter and Kratz torch." },
  { slug: "mc2-faces-maddox-prismes", tile: "faces-maddox-prismes", fr: "Faces, Maddox et prismes", en: "Flippers, Maddox and prisms",
    dfr: "Petit matériel d'examen : faces de verres, Bagolini, Maddox, coffrets et règles de prismes, cylindres croisés, Mawas, cube de Lang.",
    den: "Small examination equipment: lens flippers, Bagolini, Maddox, prism sets and bars, cross cylinders, Mawas, Lang cube." },
  { slug: "mc2-occlusion-amblyopie", tile: "occlusion-amblyopie", fr: "Occlusion et traitement de l'amblyopie", en: "Occlusion and amblyopia treatment",
    dfr: "Caches, pansements oculaires, filtres Bangerter, Filmo, Press-on et lunettes de dépistage pour le traitement de l'amblyopie.",
    den: "Eye patches, occluders, Bangerter foils, Filmo, Press-on prisms and screening glasses for amblyopia treatment." },
].map((c, i) => ({ ...c, id: cid(i + 1), sort: i + 1 }));

// ---------------------------------------------------------------- products
// add(cat, key, ref, [nomFr, nomEn], [descFr, descEn], [ficheFr, ficheEn] lines)
const pid = (n) => `d93a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const P = [];
const add = (cat, key, ref, nom, desc, fiche = [[], []]) => P.push({ cat, key, ref, nom, desc, fiche });

// === Synoptophore et tables (p.25)
add("mc2-synoptophore-tables", "synoptophore", "MC2-SYNOPTOPHORE", ["Synoptophore", "Synoptophore"],
  ["Le synoptophore donne une analyse complète de tous les angles de déviation. Il permet de superposer les images de chaque œil afin d'obtenir une seule image.",
   "The synoptophore gives a complete analysis of all angles of deviation. It superimposes the images seen by each eye to obtain a single image."],
  [["Projection dans l'espace libre", "Post-image / flashing automatique", "Réglage de l'intensité lumineuse", "Cyclophorie / hyperphorie", "Diaphragme à iris", "Livré avec 9 paires de mires", "Option : houppes de Haidinger"],
   ["Free-space projection", "After-image / automatic flashing", "Adjustable light intensity", "Cyclophoria / hyperphoria", "Iris diaphragm", "Supplied with 9 pairs of slides", "Option: Haidinger brushes"]]);
add("mc2-synoptophore-tables", "tables-electriques", "MC2-TABLES-ELECTRIQUES", ["Tables électriques d'orthoptie", "Electric orthoptics tables"],
  ["Tables électriques réglables en hauteur pour synoptophore et instruments d'orthoptie.", "Height-adjustable electric tables for the synoptophore and orthoptics instruments."],
  [["Colonne centrale ou latérale", "Avec ou sans roulettes", "Choix de dimensions de plateaux"], ["Central or side column", "With or without castors", "Choice of top sizes"]]);

// === Échelles d'acuité visuelle (p.26-28)
const E = "mc2-echelles-acuite-visuelle";
add(E, "echelles-plastique", "MC2-T1/T2/T5/T6/T7/T8/T9/T10", ["Échelles d'acuité visuelle sur plastique (T1 à T10)", "Plastic visual acuity charts (T1 to T10)"],
  ["Échelles d'acuité visuelle de loin sur plastique : Monoyer, Armaignac, Landolt, enfants et chiffres, en lecture directe ou inversée.",
   "Plastic distance visual acuity charts: Monoyer, Armaignac, Landolt, children and numbers, direct or reversed reading."],
  [["T1 : Monoyer directe, lecture à 5 m", "T2 : Monoyer inversée, lecture à 2,5 m", "T5 : Monoyer directe, lecture à 3 m", "T6 : Armaignac, lecture à 5 m ou 2,5 m", "T7 : Landolt, lecture à 5 m ou 2,5 m", "T8 : enfants, lecture à 5 m ou 2,5 m", "T9 : chiffres, lecture à 5 m", "T10 : chiffres inversée, lecture à 2,5 m", "Dimensions : 3 panneaux de 180 x 241 mm (H x l)"],
   ["T1: Monoyer direct, read at 5 m", "T2: Monoyer reversed, read at 2.5 m", "T5: Monoyer direct, read at 3 m", "T6: Armaignac, read at 5 m or 2.5 m", "T7: Landolt, read at 5 m or 2.5 m", "T8: children, read at 5 m or 2.5 m", "T9: numbers, read at 5 m", "T10: numbers reversed, read at 2.5 m", "Size: 3 panels of 180 x 241 mm (H x W)"]]);
add(E, "echelle-parinaud", "MC2-EL", ["Échelle à main de Parinaud (EL)", "Parinaud hand-held chart (EL)"],
  ["Échelle de lecture de près, recto verso, avec textes de taille décroissante et impression en gris pour évaluer rapidement la sensibilité au contraste.",
   "Double-sided near reading chart with text of decreasing size, printed in grey to quickly assess contrast sensitivity."]);
add(E, "echelle-enfants-illettres", "MC2-EI", ["Échelle à main pour enfants illettrés (EI)", "Hand-held chart for non-reading children (EI)"],
  ["Échelle de vision de près à main, recto verso, pour les enfants qui ne savent pas lire.", "Double-sided hand-held near vision chart for children who cannot read."]);
add(E, "echelle-ddass", "MC2-T15", ["Échelle pour enfants DDASS (T15)", "DDASS children's chart (T15)"],
  ["Échelle d'acuité visuelle à dessins pour le dépistage chez l'enfant.", "Picture visual acuity chart for screening children."]);
add(E, "echelle-pigassou", "MC2-T20", ["Échelle de Pigassou (T20)", "Pigassou chart (T20)"],
  ["Échelle d'acuité visuelle à dessins pour l'enfant, lecture à 2,5 m, fournie avec un test d'appariement.", "Picture visual acuity chart for children, read at 2.5 m, supplied with a matching test."]);
add(E, "cadran-parent", "MC2-CP1/CP2", ["Cadran fixe de Parent (CP1 / CP2 inversé)", "Parent fixed astigmatic dial (CP1 / CP2 reversed)"],
  ["Cadran horaire de Parent pour la recherche de l'astigmatisme, en version directe (CP1) ou inversée (CP2).", "Parent clock dial for astigmatism testing, direct (CP1) or reversed (CP2)."]);
add(E, "echelles-rossano", "MC2-ROSSANO", ["Échelles de Rossano (Weiss VP, VL, 3 échelles VL)", "Rossano charts (Weiss near, distance, set of 3 distance)"],
  ["Échelles à dessins de Rossano pour l'enfant : Rossano Weiss VP (lignes de dessins et de E), Rossano VL et jeu de 3 échelles Rossano VL, recto verso.",
   "Rossano picture charts for children: Rossano Weiss near (rows of pictures and E), Rossano distance and set of 3 Rossano distance charts, double-sided."],
  [["Rossano Weiss VP : recto verso, lignes de dessins et de E", "Rossano VL : recto verso, utilisation à 5 m, acuités 1 ; 1,25 ; 1,5 ; 2 ; 3 ; 4 ; 5 ; 6 ; 8 et 10/10", "3 échelles Rossano VL : recto verso, utilisation à 5 m, mêmes acuités"],
   ["Rossano Weiss near: double-sided, rows of pictures and E", "Rossano distance: double-sided, used at 5 m, acuities 1, 1.25, 1.5, 2, 3, 4, 5, 6, 8 and 10/10", "Set of 3 Rossano distance charts: double-sided, used at 5 m, same acuities"]]);
add(E, "echelle-hrw", "MC2-HRW", ["Échelle de HRW", "HRW chart"],
  ["Test de vision de près pour les très jeunes enfants, recto verso.", "Near vision test for very young children, double-sided."],
  [["Distance d'examen : 33 cm", "4 dessins par acuité visuelle en VP"], ["Test distance: 33 cm", "4 pictures per near visual acuity"]]);
add(E, "echelle-gracis", "MC2-GRACIS-ECHELLE", ["Échelle transparente de Gracis", "Gracis transparent chart"],
  ["Échelle transparente à dessins pour la vision de près : on peut observer les yeux du sujet pendant la lecture.", "Transparent picture chart for near vision: the examiner can watch the subject's eyes while reading."],
  [["Dimensions : 18 x 25 cm"], ["Size: 18 x 25 cm"]]);
add(E, "echelle-contrastes", "MC2-CONTRASTES-VP-VL", ["Échelle vision des contrastes VP et VL", "Near and distance contrast vision chart"],
  ["Échelle de vision des contrastes pour le dépistage des pathologies (DMLA, rétinite, cataracte). En VP : adaptation des verres progressifs ; en VL : vieillissement des lentilles, efficacité de l'antireflet sur les contrastes faibles.",
   "Contrast vision chart for screening (AMD, retinitis, cataract). Near: progressive lens fitting; distance: lens ageing, anti-reflective coating efficiency at low contrast."],
  [["Support cartonné, quadri au recto et une couleur au verso, plastifié", "Dimensions : 30 x 21 cm ouvert, 15 x 21 cm fermé"], ["Card, four colours on the front and one colour on the back, laminated", "Size: 30 x 21 cm open, 15 x 21 cm closed"]]);
add(E, "echelle-galinet", "MC2-GALINET", ["Échelle Galinet (haute vision, basse vision, VP)", "Galinet chart (high vision, low vision, near)"],
  ["Échelles logarithmiques Galinet pour la haute vision, la basse vision et la vision de près.", "Galinet logarithmic charts for high vision, low vision and near vision."],
  [["Haute vision (recto, 46 x 63 cm) : acuités de 5/10 à 20/10 à 5 m", "Basse vision (recto verso, 46 x 63 cm) : acuités de 1/10 à 4/10 à 5 m, lecture possible à 1 et 2 m", "VP (recto verso, 33,8 x 21 cm) : acuités de 1/10 à 20/10 à 40 cm"],
   ["High vision (front, 46 x 63 cm): acuities 5/10 to 20/10 at 5 m", "Low vision (double-sided, 46 x 63 cm): acuities 1/10 to 4/10 at 5 m, can be read at 1 and 2 m", "Near (double-sided, 33.8 x 21 cm): acuities 1/10 to 20/10 at 40 cm"]]);
add(E, "echelle-theophane-1", "MC2-THEOPHANE-1", ["Échelle Théophane 1", "Théophane 1 chart"],
  ["Échelle à progression logarithmique, fort et faible contraste, recto verso, pour la basse vision et la clinique courante.", "Logarithmic chart, high and low contrast, double-sided, for low vision and routine clinical use."],
  [["Basse vision : 5 m ou 2,5 m", "Clinique courante ou haute performance : 5 m", "Dimensions : 80 x 115 cm"], ["Low vision: 5 m or 2.5 m", "Routine or high performance use: 5 m", "Size: 80 x 115 cm"]]);
add(E, "echelle-theophane-2", "MC2-THEOPHANE-2", ["Échelle Théophane 2", "Théophane 2 chart"],
  ["Échelle à progression logarithmique, fort et faible contraste, avec 4 plages horizontales d'utilisation distinctes.", "Logarithmic chart, high and low contrast, with 4 separate horizontal test areas."],
  [["Utilisation classique à 5 m, possible à 5 ; 2,5 et 1,25 m", "Dimensions : 70 x 70 cm"], ["Standard use at 5 m, also at 5, 2.5 and 1.25 m", "Size: 70 x 70 cm"]]);
add(E, "bilan-vp", "MC2-BILAN-VP", ["Bilan VP", "Near vision assessment chart (Bilan VP)"],
  ["Planche de bilan de la vision de près : au recto test à 40 cm avec cordon, test rouge-vert et croix de Jackson ; au verso test de Howell pour la recherche des phories.",
   "Near vision assessment card: front, 40 cm test with cord, red-green test and Jackson cross; back, Howell test for phorias."]);

// === Tests de vision binoculaire (p.29-30)
const B = "mc2-tests-vision-binoculaire";
add(B, "test-mouche", "MC2-TEST-MOUCHE", ["Test de la Mouche (Papillon)", "Fly (Butterfly) stereo test"],
  ["Test de vision stéréoscopique à 40 cm avec points de Wirth, utilisé avec lunettes polarisées.", "Stereo vision test at 40 cm with Wirth dots, used with polarised glasses."]);
add(B, "test-tno", "MC2-TEST-TNO", ["Test TNO", "TNO test"],
  ["Évaluation précise de la vision du relief, à 40 cm avec lunettes rouge-vert.", "Accurate assessment of stereo vision, at 40 cm with red-green glasses."]);
add(B, "test-lang", "MC2-TEST-LANG", ["Test de Lang I et II", "Lang I and II test"],
  ["Tests stéréoscopiques à points aléatoires, utilisés à 40 cm, sans lunettes.", "Random-dot stereo tests, used at 40 cm, without glasses."]);
add(B, "test-randot", "MC2-TEST-RANDOT", ["Test de Randot", "Randot test"],
  ["Évaluation précise de la vision du relief, avec lunettes polarisées.", "Accurate assessment of stereo vision, with polarised glasses."]);
add(B, "test-random-dot", "MC2-TEST-RANDOM-DOT", ["Test Random Dot", "Random Dot test"],
  ["Stéréotest vectographique à points aléatoires, très valide et fiable, avec plusieurs niveaux de test. Utilisation à 50 cm chez l'enfant et l'adulte, avec lunettes polarisées.",
   "Vectographic random-dot stereotest, highly valid and reliable, with several test levels. Used at 50 cm for children and adults, with polarised glasses."]);
add(B, "test-chat", "MC2-TEST-CHAT", ["Test du Chat", "Cat test"],
  ["Test de vision binoculaire avec lunettes rouge-vert, utilisable à 5 m comme à 50 cm.", "Binocular vision test with red-green glasses, usable at 5 m and at 50 cm."],
  [["Dimensions : 38 x 27 cm"], ["Size: 38 x 27 cm"]]);
add(B, "test-worth-vp", "MC2-TEST-WORTH-VP", ["Test de Worth VP", "Worth near test"],
  ["Lampe de Worth de près : teste les 2 premiers degrés de la vision binoculaire par projection d'une image sur la rétine à 33 cm, avec lunettes rouge-vert.",
   "Near Worth torch: tests the first 2 degrees of binocular vision by projecting an image on the retina at 33 cm, with red-green glasses."]);
add(B, "test-worth-vl", "MC2-TEST-WORTH-VL", ["Test de Worth VL", "Worth distance test"],
  ["Test de Worth de loin : projection à 6 m d'une image sur la rétine, avec lunettes rouge-vert.", "Distance Worth test: projection of an image on the retina at 6 m, with red-green glasses."]);
add(B, "test-malett-vp", "MC2-MALETT-VP", ["Test de Malett VP", "Mallett near unit"],
  ["Test de disparité de fixation de près, livré avec face polarisée.", "Near fixation disparity test, supplied with polarised flipper."]);
add(B, "test-malett-vl", "MC2-MALETT-VL", ["Test de Malett VL", "Mallett distance unit"],
  ["Test de disparité de fixation de loin, télécommande fournie.", "Distance fixation disparity test, remote control supplied."]);
add(B, "vectogram", "MC2-VECTOGRAM", ["Vectogram (entraînement visuel)", "Vectogram (vision training)"],
  ["Vectogrammes d'entraînement visuel pour la correction des anomalies, la coordination de l'œil et le développement de la vision simultanée. Plusieurs images disponibles.",
   "Vision training vectograms for correcting anomalies, eye coordination and developing simultaneous vision. Several images available."]);

// === Vision des couleurs, Amsler et coordimètre (p.30)
const C = "mc2-couleurs-amsler-coordimetre";
add(C, "test-ishihara", "MC2-ISHIHARA", ["Test d'Ishihara", "Ishihara test"],
  ["Test de dépistage des dyschromatopsies (protanomalie et deutéranomalie).", "Screening test for colour vision deficiencies (protanomaly and deuteranomaly)."],
  [["Existe en 10, 14, 24 et 38 planches"], ["Available in 10, 14, 24 and 38 plates"]]);
add(C, "test-farnsworth", "MC2-FARNSWORTH", ["Test de Farnsworth", "Farnsworth test"],
  ["Test de vision des couleurs composé de 2 plumiers de 15 pions chacun (1 saturé et 1 désaturé), utilisé avec lunettes bleues.", "Colour vision test with 2 trays of 15 caps each (1 saturated, 1 desaturated), used with blue glasses."]);
add(C, "amsler", "MC2-AMSLER", ["Test et grille d'Amsler", "Amsler test and grid"],
  ["Détection précoce des maladies rétiniennes, en particulier la DMLA.", "Early detection of retinal disease, especially AMD."]);
add(C, "coordimetre-weiss", "MC2-COORDIMETRE-WEISS", ["Coordimètre de Weiss", "Weiss coordimeter"],
  ["Écran mural recto verso qui reflète la déviation subjective du patient, avec torche et filtres rouge et vert.", "Double-sided wall screen showing the patient's subjective deviation, with torch and red and green filters."],
  [["Dimensions : H x l = 77 x 74 cm"], ["Size: H x W = 77 x 74 cm"]]);
add(C, "torche-kratz", "MC2-TORCHE-KRATZ", ["Torche de Kratz", "Kratz torch"],
  ["Torche d'examen pour coordimètre et examen orthoptique, livrée en étui.", "Examination torch for coordimeter and orthoptic testing, supplied in a case."]);

// === Faces, Maddox et prismes (p.31)
const F = "mc2-faces-maddox-prismes";
add(F, "face-monoculaire", "MC2-FACE-MONO", ["Face monoculaire", "Monocular flipper"],
  ["Face à main monoculaire, ±0,25 et ±0,50.", "Monocular hand-held flipper, ±0.25 and ±0.50."]);
add(F, "face-binoculaire", "MC2-FACE-BINO", ["Face binoculaire", "Binocular flipper"],
  ["Face à main binoculaire, ±0,25 et ±0,50.", "Binocular hand-held flipper, ±0.25 and ±0.50."]);
add(F, "face-polarisee-rouge-vert", "MC2-FACE-POL-RV", ["Face polarisée / Face rouge-vert", "Polarised / red-green flipper"],
  ["Faces à main équipées de filtres polarisés ou rouge-vert pour les tests de vision binoculaire.", "Hand-held flippers with polarised or red-green filters for binocular vision tests."]);
add(F, "face-bagolini", "MC2-BAGOLINI", ["Face à main de Bagolini", "Bagolini hand-held lenses"],
  ["Verres striés de Bagolini sur face à main, pour l'étude de la correspondance rétinienne et de la neutralisation.", "Bagolini striated lenses on a hand-held frame, for retinal correspondence and suppression testing."]);
add(F, "flipper-test", "MC2-FLIPPER", ["Flipper test", "Flipper test"],
  ["Flipper d'examen pour les tests d'accommodation.", "Examination flipper for accommodation testing."]);
add(F, "face-nue-4-verres", "MC2-FACE-NUE-4V", ["Face nue / Face 4 verres (0,25 à 2,00)", "Empty flipper / 4-lens flipper (0.25 to 2.00)"],
  ["Face nue à équiper, ou face 4 verres de 0,25 à 2,00.", "Empty flipper to fit, or 4-lens flipper from 0.25 to 2.00."]);
add(F, "maddox-sur-manche", "MC2-MADDOX-MANCHE", ["Maddox et filtres sur manche", "Maddox rod and filters on handle"],
  ["Maddox rouge sur manche, filtre rouge sur manche, Maddox filtre rouge et Maddox cache-œil noir.", "Red Maddox rod on handle, red filter on handle, red filter Maddox and black occluder Maddox."]);
add(F, "croix-aile-maddox", "MC2-CROIX-AILE-MADDOX", ["Croix et aile de Maddox", "Maddox cross and wing"],
  ["Croix de Maddox et aile de Maddox pour la mesure des déviations.", "Maddox cross and Maddox wing for measuring deviations."]);
add(F, "biprisme-gracis", "MC2-BIPRISME-GRACIS", ["Biprisme et lunette de Gracis", "Gracis biprism and spectacle"],
  ["Biprisme et lunette de Gracis pour l'examen orthoptique.", "Gracis biprism and spectacle for orthoptic examination."]);
add(F, "coffret-prismes", "MC2-COFFRET-PRISMES", ["Coffret de prismes (16 ou 22 prismes)", "Prism set (16 or 22 prisms)"],
  ["Coffret de prismes pour la mesure des déviations, avec un filtre rouge.", "Prism set for measuring deviations, with a red filter."],
  [["16 prismes : 1/2, 1, 2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45 et 50 D", "22 prismes : 1/2, 1 à 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45 et 50 D"],
   ["16 prisms: 1/2, 1, 2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45 and 50 PD", "22 prisms: 1/2, 1 to 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45 and 50 PD"]]);
add(F, "regles-prisme", "MC2-REGLES-PRISME", ["Règles à prisme", "Prism bars"],
  ["Règles à prismes verticale et horizontale pour la mesure des phories et des tropies.", "Vertical and horizontal prism bars for measuring phorias and tropias."],
  [["Verticale : 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 25 D", "Horizontale : 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40 D"],
   ["Vertical: 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 25 PD", "Horizontal: 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40 PD"]]);
add(F, "coffret-cylindres-croises", "MC2-CYLINDRES-CROISES", ["Coffret cylindres croisés", "Cross cylinder set"],
  ["Coffret de cylindres croisés ±0,25 et ±0,50 pour la recherche de l'astigmatisme.", "Set of ±0.25 and ±0.50 cross cylinders for astigmatism testing."]);
add(F, "plaquettes-mawas", "MC2-MAWAS", ["Plaquettes de Mawas", "Mawas plates"],
  ["Plaquettes pour l'examen et le traitement de la neutralisation.", "Plates for the examination and treatment of suppression."]);
add(F, "cube-lang", "MC2-CUBE-LANG", ["Cube de Lang", "Lang fixation cube"],
  ["Cube de fixation pour les petits enfants, plusieurs motifs.", "Fixation cube for young children, several patterns."]);

// === Occlusion et traitement de l'amblyopie (p.32)
const O = "mc2-occlusion-amblyopie";
add(O, "filmo", "MC2-FILMO", ["Filmo Lux Cristal et Filmo Matt", "Filmo Lux Cristal and Filmo Matt"],
  ["Feuilles adhésives de pénalisation pour le traitement de l'amblyopie. Filmo Lux Cristal : vision des formes sans les détails (amblyopie ou neutralisation). Filmo Matt : passage de la lumière sans les formes.",
   "Adhesive penalisation foils for amblyopia treatment. Filmo Lux Cristal: shapes seen without details (amblyopia or suppression). Filmo Matt: light passes without shapes."],
  [["Feuilles au format 15 x 20 cm"], ["Sheets 15 x 20 cm"]]);
add(O, "cache-oeil", "MC2-CACHE-OEIL", ["Cache-œil (blanc, noir, élastique noir)", "Occluders (white, black, black elastic)"],
  ["Cache-œil blanc, cache-œil noir et cache-œil noir à élastique.", "White occluder, black occluder and black elastic eye patch."]);
add(O, "lunette-depistage", "MC2-LUNETTE-DEPISTAGE", ["Lunette de dépistage", "Screening spectacles"],
  ["Dépistage de l'amblyopie chez l'enfant : monture réversible avec un côté obturé.", "Amblyopia screening in children: reversible frame with one side occluded."]);
add(O, "clips-deux-gorges", "MC2-CLIPS-DEUX-GORGES", ["Clips deux gorges", "Two-groove clips"],
  ["Clips à deux gorges pour fixer verres d'essai ou filtres sur une monture.", "Two-groove clips to hold trial lenses or filters on a frame."]);
add(O, "palette-bernell", "MC2-PALETTE-BERNELL", ["Palette de Bernell", "Bernell paddle"],
  ["Palette de Bernell pour l'examen orthoptique.", "Bernell paddle for orthoptic examination."]);
add(O, "ecran-spielmann", "MC2-ECRAN-SPIELMANN", ["Écran translucide de Spielmann", "Spielmann translucent occluder"],
  ["Étude de la position de l'œil en monoculaire ou en binoculaire et traitement de l'amblyopie. Fourni par deux ; disponible en cache-œil avec élastique.",
   "Study of eye position, monocular or binocular, and amblyopia treatment. Supplied in pairs; also available as an elastic eye patch."]);
add(O, "feuilles-bangerter", "MC2-BANGERTER", ["Feuilles d'occlusion selon Bangerter", "Bangerter occlusion foils"],
  ["Filtres d'occlusion graduée pour le traitement de l'amblyopie.", "Graded occlusion foils for amblyopia treatment."],
  [["De 1/10 à 4/10 par pas de 1", "De 4/10 à 10/10 par pas de 2", "Inférieure à 1/10, opaque et perception lumineuse"], ["1/10 to 4/10 in steps of 1", "4/10 to 10/10 in steps of 2", "Below 1/10, opaque and light perception"]]);
add(O, "press-on-prismes", "MC2-PRESS-ON-3M", ["Press-on prismes 3M", "3M Press-on prisms"],
  ["Prismes souples adhésifs (à l'unité) pour traiter différents troubles de la mobilité oculaire, y compris le strabisme.", "Adhesive flexible prisms (single) to treat ocular motility disorders, including strabismus."],
  [["Valeurs : de 1 à 10 D par pas de 1 ; 12, 15, 20, 25, 30 et 35 D"], ["Powers: 1 to 10 PD in steps of 1; 12, 15, 20, 25, 30 and 35 PD"]]);
add(O, "opticlude", "MC2-EC200/EC201", ["Pansements oculaires Opticlude (EC 200 / EC 201)", "Opticlude eye patches (EC 200 / EC 201)"],
  ["Pansements oculaires adhésifs Opticlude pour l'occlusion.", "Opticlude adhesive eye patches for occlusion."],
  [["EC 200 : taille adulte, boîte de 20", "EC 201 : taille junior, boîte de 20"], ["EC 200: adult size, box of 20", "EC 201: junior size, box of 20"]]);
add(O, "orthopads", "MC2-ORTHOPADS", ["Orthopads", "Ortopad eye patches"],
  ["Pansements oculaires adhésifs pour l'occlusion, adulte et junior, unis ou à dessins.", "Adhesive occlusion eye patches, adult and junior, plain or with designs."],
  [["Boîte de 20 : adulte et junior, chair", "Boîte de 40 : adulte et junior, blanc et coloré", "Boîte de 50 : garçons et filles, dessins"], ["Box of 20: adult and junior, skin colour", "Box of 40: adult and junior, white and coloured", "Box of 50: boys and girls, designs"]]);
add(O, "obturateur-ventouse", "MC2-OB100/OB105", ["Obturateur à ventouse (OB 100 / OB 105)", "Suction-cup occluder (OB 100 / OB 105)"],
  ["Obturateur à ventouse pour verre de lunette, à l'unité.", "Suction-cup occluder for spectacle lenses, single."],
  [["OB 100 : avec aération, enfant", "OB 105 : grand modèle, adulte"], ["OB 100: ventilated, child", "OB 105: large model, adult"]]);

const fiche = (p, i) => [
  i === 0 ? "Fabricant : MC2 - Le Matériel Professionnel (France)" : "Manufacturer: MC2 - Le Matériel Professionnel (France)",
  ...p.fiche[i],
].join("\n");
const PRODUCTS = P.map((p, i) => ({
  id: pid(i + 1), slug: `mc2-${p.key}`, ref: p.ref, cat: p.cat, img: p.key, sort: i + 1,
  fr: { nom: p.nom[0], description: p.desc[0], fiche_technique: fiche(p, 0) },
  en: { nom: p.nom[1], description: p.desc[1], fiche_technique: fiche(p, 1) },
}));

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const top = await prisma.categories.findMany({ where: { parent_id: null }, select: { id: true, slug: true, sort_order: true }, orderBy: { sort_order: "asc" } });
  fs.writeFileSync(BEFORE_FILE, JSON.stringify({ taken_at: new Date().toISOString(), top_level: top }, null, 1));
  console.log(`snapshot: ${top.length} top-level categories -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const TXT = ["nom", "description", "fiche_technique"];

async function upsertCategory(c, parentId, type) {
  if (!exists(c.image)) console.log(`  [MISSING FILE] ${c.image}`);
  const row = await prisma.categories.findUnique({ where: { id: c.id }, include: { category_translations: true } });
  if (!row) {
    console.log(`  + category ${c.slug} « ${c.fr} » (sort ${c.sort})`);
    if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, description: c.dfr, parent_id: parentId, sort_order: c.sort,
      is_active: true, type, image_url: c.image, updated_at: now(),
      category_translations: { create: [
        { id: `${c.id}-fr`, language_code: "fr", name: c.fr, description: c.dfr },
        { id: `${c.id}-en`, language_code: "en", name: c.en, description: c.den }] } } });
    return;
  }
  const data = {};
  for (const [k, v] of [["parent_id", parentId], ["sort_order", c.sort], ["image_url", c.image], ["is_active", true], ["name", c.fr], ["description", c.dfr], ["slug", c.slug]]) if (row[k] !== v) data[k] = v;
  const tr = ["fr", "en"].filter((lang) => { const t = row.category_translations.find((x) => x.language_code === lang); return !t || t.name !== c[lang] || t.description !== c[lang === "fr" ? "dfr" : "den"]; });
  if (!Object.keys(data).length && !tr.length) { console.log(`  [SKIP] category ${c.slug}`); return; }
  console.log(`  category ${c.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}`);
  if (!WRITE) return;
  if (Object.keys(data).length) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
  for (const lang of tr) await prisma.category_translations.upsert({
    where: { category_id_language_code: { category_id: c.id, language_code: lang } },
    update: { name: c[lang], description: c[lang === "fr" ? "dfr" : "den"] },
    create: { id: `${c.id}-${lang}`, category_id: c.id, language_code: lang, name: c[lang], description: c[lang === "fr" ? "dfr" : "den"] } });
}

async function apply() {
  for (const f of [PDF, PARTNER.logo]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);

  // partner
  if (await prisma.partners.findUnique({ where: { id: PARTNER.id } })) console.log(`  [SKIP] partner ${PARTNER.slug}`);
  else {
    console.log(`  + partner ${PARTNER.slug}`);
    if (WRITE) await prisma.partners.create({ data: {
      id: PARTNER.id, name: PARTNER.name, slug: PARTNER.slug, website_url: PARTNER.website, logo_url: PARTNER.logo, default_pdf_url: PDF,
      type: "manufacturer", is_featured: false, sort_order: 99, status: "active", created_at: now(), updated_at: now(),
      partner_translations: { create: [
        { id: `${PARTNER.id}-fr`, language_code: "fr", name: PARTNER.name, description: PARTNER.fr },
        { id: `${PARTNER.id}-en`, language_code: "en", name: PARTNER.name, description: PARTNER.en }] } } });
  }

  // top-level order: Orthoptie right after Ophtalmologie, the others (as snapshotted) move down by one
  for (const t of BEFORE.top_level) {
    const target = t.sort_order >= ROOT.sort ? t.sort_order + 1 : t.sort_order;
    const row = await prisma.categories.findUnique({ where: { id: t.id } });
    if (!row) { console.log(`  [MISSING CATEGORY] ${t.slug}`); continue; }
    if (row.sort_order === target) continue;
    console.log(`  sort ${t.slug}: ${row.sort_order} -> ${target}`);
    if (WRITE) await prisma.categories.update({ where: { id: t.id }, data: { sort_order: target, updated_at: now() } });
  }
  await upsertCategory(ROOT, null, "discipline");
  for (const c of CATS) await upsertCategory({ ...c, image: cimg(c.tile) }, ROOT.id, "equipment");

  // products
  const catId = Object.fromEntries(CATS.map((c) => [c.slug, c.id]));
  for (const p of PRODUCTS) {
    if (!exists(pimg(p.img))) console.log(`  [MISSING FILE] ${pimg(p.img)}`);
    const dup = await prisma.products.findFirst({ where: { id: { not: p.id }, OR: [{ reference_fournisseur: p.ref }, { slug: p.slug }] } });
    if (dup) { console.log(`  [DUPLICATE] ${p.slug} [${p.ref}] already used by ${dup.slug} -- skipped`); continue; }
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = { id: `${p.id}-m93`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    if (!row) {
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat} « ${p.fr.nom} »`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat], constructeur: "mc2", partner_id: PARTNER.id,
        status: "active", sort_order: p.sort, pdf_brochure_url: PDF, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    for (const [k, v] of [["category_id", catId[p.cat]], ["status", "active"], ["sort_order", p.sort], ["pdf_brochure_url", PDF],
      ["reference_fournisseur", p.ref], ["constructeur", "mc2"], ["partner_id", PARTNER.id], ["slug", p.slug]]) if (row[k] !== v) data[k] = v;
    const tr = ["fr", "en"].filter((lang) => { const t = row.product_translations.find((x) => x.language_code === lang); return !t || TXT.some((k) => !same(t[k], p[lang][k])); });
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary && row.product_media[0].alt_text === media.alt_text;
    if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${p.slug}`); continue; }
    console.log(`  product ${p.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${mediaOk ? "" : " photo"}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: `${p.id}-${lang}`, product_id: p.id, language_code: lang, ...p[lang] } });
      if (!mediaOk) { await tx.product_media.deleteMany({ where: { product_id: p.id } }); await tx.product_media.create({ data: { ...media, product_id: p.id } }); }
    });
  }
}

// ---------------------------------------------------------------- revert
async function revert() {
  const n = await prisma.products.deleteMany({ where: { id: { in: PRODUCTS.map((p) => p.id) } } });
  console.log(`  - deleted ${n.count} products`);
  for (const c of [...CATS, ROOT]) {
    if (!(await prisma.categories.findUnique({ where: { id: c.id } }))) continue;
    const k = await prisma.products.count({ where: { category_id: c.id } });
    if (k) { console.log(`  [KEEP] ${c.slug} has ${k} products`); continue; }
    console.log(`  - delete category ${c.slug}`);
    await prisma.category_translations.deleteMany({ where: { category_id: c.id } });
    await prisma.categories.delete({ where: { id: c.id } });
  }
  for (const t of BEFORE.top_level) {
    const row = await prisma.categories.findUnique({ where: { id: t.id } });
    if (!row || row.sort_order === t.sort_order) continue;
    console.log(`  sort ${t.slug}: ${row.sort_order} -> ${t.sort_order}`);
    await prisma.categories.update({ where: { id: t.id }, data: { sort_order: t.sort_order, updated_at: now() } });
  }
  const others = await prisma.products.count({ where: { partner_id: PARTNER.id } });
  if (others) console.log(`  [KEEP] partner mc2 has ${others} other products`);
  else {
    await prisma.partner_translations.deleteMany({ where: { partner_id: PARTNER.id } });
    const d = await prisma.partners.deleteMany({ where: { id: PARTNER.id } });
    console.log(`  - delete partner mc2: ${d.count}`);
  }
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
