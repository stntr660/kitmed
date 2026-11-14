const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-14 -- client note « ORL — À refaire ».
 *
 * ORL (orl-oto-rhino-laryngologie) is rebuilt from the 19 client brochures
 * (« BROCHURE ORL »: 18 Happersberger Otopront + Carl Zeiss OPMI pico, an option
 * of the SMART / BASIC PLUS units). The single sub-category « Exploration ORL »
 * (ent-exploration, 20 products whose names did not match their ref/slug) is
 * replaced by 13 sub-categories, one product per brochure product line:
 *
 *   Unités de consultation ORL  BASIC PLUS 450/550/700, SMART, SMART WINGS
 *   Fauteuils ORL               SIT 4 (+ SIT 4 Eco)
 *   Endoscopie                  rigid endoscopes 0° / 30° / 70°, 0° 50 mm, naso-pharyngoscope
 *   Laryngoscopie               Slim Line (pédiatrique), Berci Ward, télé-laryngo-pharyngoscope
 *   Vidéo-endoscopie            PES Pilot HDpro
 *   Stroboscopie                PES Pilot HDpro Stroboscope
 *   Microscopie                 OPMI pico (constructeur ZEISS, no partner)
 *   Éclairage                   LED headlight, fibre-optic headlights (standard, Binner, légère, CLAR)
 *   Audiologie                  AUDIO, Maxi Sound Shelter
 *   Tympanométrie               TYMP
 *   Exploration vestibulaire    VARIO, VARIO DRY, VNG
 *   Rhinologie                  RHINO-SYS
 *   Diagnostic sinusien         DIGITAL 5
 *
 * 13 existing products are reused (renamed / re-described, their ref kept unless
 * the brochure gives the Art. No.), 14 are created with fixed ids, 6 with no
 * brochure match are archived (endoscope 45°, endoscopes 90°, PES Eco HD caméra,
 * « Centre de Traitement PROFESSIONAL » and the two stubs ref « 00 » / « 000 »).
 * Every product gets its photo cropped from its brochure (orl-*.jpg) and its
 * brochure PDF. ent-exploration is set inactive once empty.
 *
 * REVERT POINT: 78-before.json is the exact state on 2026-11-14 of the ORL
 * categories and of the 20 ent-exploration products (row, fr/en translations,
 * media). --revert writes it back, deletes the 14 new products and the 13 new
 * sub-categories. (--snapshot wrote 78-before.json; it refuses to overwrite.)
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 78-orl-rebuild.js <app>:/tmp/78.js
 *   docker cp 78-before.json <app>:/tmp/78-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/78.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/78.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/78.js --revert
 * The orl-*.jpg photos (products/), the orl-tile-*.jpg tiles (categories/) and the kitmed-2026-11-*
 * brochures (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "78-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();

const ORL = "orl-oto-rhino-laryngologie";
const OLD_SUB = "ent-exploration";
const OTOPRONT = "d4b45aad-3a0a-4925-ae56-a38a535b28cb";
const pimg = (n) => `/uploads/products/orl-${n}.jpg`;
const cimg = (n) => `/uploads/categories/orl-tile-${n}.jpg`; // 3:1 tiles (the discipline grid crops to ~3:1)
const pdf = (n) => `/uploads/pdfs/kitmed-2026-11-${n}.pdf`;

// ---------------------------------------------------------------- categories
const cid = (n) => `c78a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const CATS = [
  { slug: "orl-unites-consultation", fr: "Unités de consultation ORL", en: "ENT treatment units", image: "basic-plus" },
  { slug: "orl-fauteuils", fr: "Fauteuils ORL", en: "ENT chairs", image: "sit-4" },
  { slug: "orl-endoscopie", fr: "Endoscopie", en: "Endoscopy", image: "endoscope-30" },
  { slug: "orl-laryngoscopie", fr: "Laryngoscopie", en: "Laryngoscopy", image: "telelaryngo" },
  { slug: "orl-video-endoscopie", fr: "Vidéo-endoscopie", en: "Video endoscopy", image: "pes-pilot-hdpro" },
  { slug: "orl-stroboscopie", fr: "Stroboscopie", en: "Stroboscopy", image: "pes-pilot-strobo" },
  { slug: "orl-microscopie", fr: "Microscopie", en: "Microscopy", image: "opmi-pico-2" },
  { slug: "orl-eclairage", fr: "Éclairage", en: "Lighting", image: "lampe-led" },
  { slug: "orl-audiologie", fr: "Audiologie", en: "Audiology", image: "audio" },
  { slug: "orl-tympanometrie", fr: "Tympanométrie", en: "Tympanometry", image: "tymp" },
  { slug: "orl-exploration-vestibulaire", fr: "Exploration vestibulaire", en: "Vestibular testing", image: "vng" },
  { slug: "orl-rhinologie", fr: "Rhinologie", en: "Rhinology", image: "rhino-sys" },
  { slug: "orl-diagnostic-sinusien", fr: "Diagnostic sinusien", en: "Sinus diagnostics", image: "digital-5" },
].map((c, i) => ({ ...c, id: cid(i + 1), sort: i + 1 }));

// ---------------------------------------------------------------- products
// id: existing id (reused) or fixed new id; ref: null = keep the existing ref.
const pid = (n) => `d78a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const L = (...lines) => lines.join("\n");
const BR = {
  basic: pdf("otopront-basic-plus"), smart: pdf("otopront-smart"), wings: pdf("otopront-smart-wings"),
  sit: pdf("otopront-sit-4"), endo: pdf("otopront-endoscopes"), laryngo: pdf("otopront-laryngoscopes"),
  pilot: pdf("otopront-pes-pilot-hdpro"), strobo: pdf("otopront-pes-pilot-hdpro-stroboscope"),
  pico: pdf("zeiss-opmi-pico"), led: pdf("otopront-lampe-frontale-led"), fo: pdf("otopront-lampes-frontales"),
  audio: pdf("otopront-audio"), shelter: pdf("otopront-maxi-sound-shelter"), tymp: pdf("otopront-tymp"),
  vario: pdf("otopront-vario"), varioDry: pdf("otopront-vario-dry"), vng: pdf("otopront-vng"),
  rhino: pdf("otopront-rhino-sys"), digital: pdf("otopront-digital-5"),
};
const ENDO_FR = "Tube à système de lentilles innovant assurant un maximum de luminosité et une netteté exceptionnelle. Endoscope en acier inoxydable, autoclavable jusqu'à 134 °C.";
const ENDO_EN = "Tube with an innovative lens system for maximum brightness and exceptional sharpness. Stainless-steel endoscope, autoclavable up to 134 °C.";
const endoSpec = (angle, len, lang) => lang === "fr"
  ? L(`Champ de vision : ${angle}`, "Diamètre : 2,7 mm ou 4 mm", `Longueur : ${len} mm`, "Autoclavable : 134 °C / 273 °F", "Acier inoxydable")
  : L(`Direction of view: ${angle}`, "Diameter: 2.7 mm or 4 mm", `Length: ${len} mm`, "Autoclavable: 134 °C / 273 °F", "Stainless steel");
const FO_FR = "Lampe frontale Otopront à transmission de la lumière par fibre optique, avec câble de lumière, à raccorder à une source de lumière froide (par exemple celle de l'unité ORL).";
const FO_EN = "Otopront headlight with fibre-optic light transmission and light cable, to be connected to a cold light source (for example the one of the ENT unit).";

const PRODUCTS = [
  // --- Unités de consultation ORL
  { id: "3cf6aab3-0f62-49bb-9618-a9cf4ca3c0cd", cat: "orl-unites-consultation", sort: 1, img: "basic-plus", pdf: BR.basic,
    fr: { nom: "Unité de consultation ORL BASIC PLUS (450 / 550 / 700)",
      description: "Unité de consultation ORL complète, fruit de plus de 25 ans de développement continu, disponible en trois largeurs : BASIC PLUS 450 (la plus compacte, 45 cm, 82 cm de largeur totale avec la partie technique), 550 (55 cm) et 700 (70 cm, avec un 3e niveau d'instruments). Fabrication modulable selon les besoins : aspiration, lavage d'oreilles à 38 °C, air comprimé, centre d'endoscopie avec sources de lumière LED et/ou halogène, logements de désinfection à flotteur, système de documentation EDDO. Peut recevoir un microscope (Carl Zeiss OPMI pico ou Kaps) et le système de vidéo-endoscopie PES Pilot HDpro, avec ou sans stroboscope.",
      fiche_technique: L(
        "Modèles : BASIC PLUS 450 (largeur 450 mm), 550 (550 mm), 700 (720 mm)",
        "Aspiration de base anti-vibrations : 58 l/min, 91 % de vide max. ; en option pompe à membrane 72 l (91 %) ou pompe à piston 55 l (93 %, utilisation continue 24 h)",
        "Rinçage du tuyau d'aspiration, vidange automatique du bocal, bocal et tuyaux à usage unique utilisables",
        "Lavage d'oreilles à l'eau chaude 38 °C avec filtre anti-bactérien autoclavable (pores < 0,2 µm)",
        "Air comprimé 0–4 bar réglable avec manomètre, pièce à main autoclavable, 3 flacons avec canules",
        "Sources de lumière : 2 ou 4 halogènes 150 W ou LED (CRI > 95 %, > 1800 lm) ; LED Superbright (> 2600 lm) en option",
        "Logements pour endoscopes : 2 ou 4 préchauffés, 2 ou 4 de désinfection, 2 pour optiques flexibles, système de flotteur",
        "Système d'évacuation de fumée commutable (laser / électrochirurgie), filtres ULPA",
        "Rail normalisé DRÄGER 25 x 10 mm ou 35 x 10 mm",
        "Structure acier, coloris RAL au choix ; 4 roulettes antistatiques",
        "Poids : 90 à 125 kg ; alimentation 230 V~ / 50 Hz ; consommation 1800 W max.",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "BASIC PLUS ENT treatment unit (450 / 550 / 700)",
      description: "Complete ENT treatment unit, the result of more than 25 years of continuous development, available in three widths: BASIC PLUS 450 (the most compact, 45 cm, 82 cm overall width including the technical part), 550 (55 cm) and 700 (70 cm, with a third instrument level). Modular build to suit each practice: suction, 38 °C ear irrigation, compressed air, endoscopy centre with LED and/or halogen light sources, float-type disinfection quivers, EDDO documentation system. Can take a microscope (Carl Zeiss OPMI pico or Kaps) and the PES Pilot HDpro video endoscopy system, with or without stroboscope.",
      fiche_technique: L(
        "Models: BASIC PLUS 450 (width 450 mm), 550 (550 mm), 700 (720 mm)",
        "Vibration-free basic suction: 58 l/min, 91% max. vacuum; optional diaphragm pump 72 l (91%) or piston pump 55 l (93%, 24 h continuous operation)",
        "Suction hose rinsing, automatic suction jar emptying, disposable jars and hoses usable",
        "38 °C warm-water ear irrigation with autoclavable antibacterial filter (pores < 0.2 µm)",
        "Compressed air 0–4 bar adjustable with gauge, autoclavable handpiece, 3 spray bottles with cannulas",
        "Light sources: 2 or 4 halogen 150 W or LED (CRI > 95%, > 1800 lm); optional Superbright LED (> 2600 lm)",
        "Endoscope quivers: 2 or 4 preheated, 2 or 4 disinfection, 2 for flexible optics, float system",
        "Switchable smoke evacuation (laser / electrosurgery), ULPA filters",
        "DRÄGER standard rail 25 x 10 mm or 35 x 10 mm",
        "Steel body, RAL colour of choice; 4 antistatic castors",
        "Weight: 90 to 125 kg; power 230 V~ / 50 Hz; consumption 1800 W max.",
        "CE marked according to directive 93/42/EEC") } },
  { id: "7280bce6-3c61-48f4-9ce2-38a2f22cfe50", cat: "orl-unites-consultation", sort: 2, img: "smart", pdf: BR.smart,
    fr: { nom: "Unité de traitement ORL compacte SMART",
      description: "Unité de traitement ORL compacte, mince et mobile, réinterprétation de la première unité Otopront « Saule ». Malgré ses petites dimensions, elle peut être entièrement équipée : aspiration chirurgicale haute performance sans vibrations pour une utilisation de 24 heures, eau chaude avec rinçage, air comprimé, jusqu'à 3 sources de lumière LED à commutation automatique, intégration de systèmes de radiofréquence, d'endoscopie (PES Pilot HDpro sur bras pivotant) ou de microscope (Carl Zeiss ou Kaps). Montée sur roulettes pour la chirurgie ambulatoire, le chevet du patient ou plusieurs salles ; extensible en centre de consultation complet avec la table à instruments SMART S ou l'armoire à instruments SMART L.",
      fiche_technique: L(
        "Aspiration de base anti-vibrations : 58 l/min, 91 % de vide max. ; en option pompe à membrane 72 l (91 %) ou pompe à piston 55 l (93 %, utilisation continue 24 h)",
        "Rinçage du tuyau d'aspiration, vidange automatique du bocal, double sécurité de trop-plein",
        "Lavage d'oreilles à l'eau chaude 38 °C avec filtre anti-bactérien autoclavable",
        "Air comprimé 0–4 bar réglable avec manomètre, 3 flacons de pulvérisation",
        "2 ou 3 sources de lumière froide LED (CRI > 95 %) ou halogène 150 W ; LED Superbright pour endoscopes flexibles en option",
        "Logements : 2 de désinfection, 2 pour optiques flexibles, 2 préchauffés",
        "Système d'évacuation de fumée commutable, filtres ULPA",
        "Rail normalisé DRÄGER 25 x 10 mm ou 35 x 10 mm",
        "Options : table à instruments SMART S, armoire à instruments SMART L, microscope avec support",
        "Poids : 55 à 85 kg ; alimentation 230 V~ / 50 Hz ; consommation 1300 W max.",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "SMART compact ENT treatment unit",
      description: "Compact, slim and mobile ENT treatment unit, a reinterpretation of the first Otopront « Saule » unit. Despite its small size it can be fully equipped: vibration-free high-performance surgical suction for 24-hour operation, warm water with rinsing, compressed air, up to 3 automatically switched LED light sources, integration of radiofrequency, endoscopy (PES Pilot HDpro on swivel arm) or microscope systems (Carl Zeiss or Kaps). On castors for ambulatory surgery, bedside use or several rooms; extends into a complete ENT workstation with the SMART S instrument table or the SMART L instrument cabinet.",
      fiche_technique: L(
        "Vibration-free basic suction: 58 l/min, 91% max. vacuum; optional diaphragm pump 72 l (91%) or piston pump 55 l (93%, 24 h continuous operation)",
        "Suction hose rinsing, automatic suction jar emptying, double overflow protection",
        "38 °C warm-water ear irrigation with autoclavable antibacterial filter",
        "Compressed air 0–4 bar adjustable with gauge, 3 spray bottles",
        "2 or 3 cold light sources LED (CRI > 95%) or halogen 150 W; optional Superbright LED for flexible endoscopes",
        "Quivers: 2 disinfection, 2 for flexible optics, 2 preheated",
        "Switchable smoke evacuation, ULPA filters",
        "DRÄGER standard rail 25 x 10 mm or 35 x 10 mm",
        "Options: SMART S instrument table, SMART L instrument cabinet, microscope with stand",
        "Weight: 55 to 85 kg; power 230 V~ / 50 Hz; consumption 1300 W max.",
        "CE marked according to directive 93/42/EEC") } },
  { id: pid(1), slug: "otopront-smart-wings", ref: "OTOPRONT-SMART-WINGS", cat: "orl-unites-consultation", sort: 3, img: "smart-wings", pdf: BR.wings,
    fr: { nom: "Poste de travail ORL mobile SMART WINGS",
      description: "Poste de travail ORL complet et mobile au design mince et compact. Il associe les fonctions éprouvées de l'unité de traitement SMART (aspiration, air comprimé, lavage à l'eau chaude, sources de lumière pour l'endoscopie) au module WINGS qui apporte le rangement des instruments et la poubelle. Idéal pour les petites salles ou une utilisation flexible en plusieurs endroits. Peut être équipé en option d'un microscope Carl Zeiss OPMI pico tout en restant facilement déplaçable.",
      fiche_technique: L(
        "Module WINGS : deux plateaux à instruments antibactériens avec huit bacs mobiles sur deux niveaux, couvercle en plexiglas rabattable en option",
        "Grand tiroir de rangement, poubelle à pédale, support pour lampe frontale",
        "Bras pivotant en option (sur le tube du microscope ou à gauche) pour moniteurs ou diagnostic complémentaire",
        "Aspiration : pompe de base 58 l/min (91 %), ou pompe à membrane 72 l/min (91 %), ou pompe à double piston 55 l/min (93 %, fonctionnement continu)",
        "Air comprimé 0–4 bar réglable avec manomètre, 3 flacons de pulvérisation",
        "Lavage d'oreilles à dosage fin, chaudière sans entartrage",
        "2 sources de lumière LED (CRI > 95 %, > 1800 lm, réglables, blanc chaud)",
        "Logements : 2 préchauffés amovibles, 2 de rinçage, 2 pour optiques flexibles",
        "Évacuation de fumée commutable en option, filtre ULPA",
        "5 roulettes antistatiques, pieds de positionnement réglables",
        "Poids : 85 à 115 kg ; alimentation 220–240 V~ (100–127 V~) 50/60 Hz ; 1000 W max.",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "SMART WINGS mobile ENT workstation",
      description: "Complete, mobile ENT workstation with a slim and compact design. It combines the proven features of the SMART treatment unit (suction, compressed air, warm-water rinsing, endoscopy light sources) with the WINGS module for instrument storage and the waste bin. Ideal for smaller rooms or flexible use in several locations. Can optionally be equipped with a Carl Zeiss OPMI pico microscope while remaining easy to move.",
      fiche_technique: L(
        "WINGS module: two antibacterial instrument trays with eight movable trays on two levels, optional foldable Plexiglass cover",
        "Large storage drawer, foot-control waste bin, headlight holder",
        "Optional swivel arm (on the microscope tube or left side) for monitors or additional diagnostics",
        "Suction: basic pump 58 l/min (91%), or diaphragm pump 72 l/min (91%), or twin piston pump 55 l/min (93%, continuous operation)",
        "Compressed air 0–4 bar adjustable with gauge, 3 spray bottles",
        "Fine-dosing ear irrigation, scale-free boiler system",
        "2 LED light sources (CRI > 95%, > 1800 lm, dimmable, warm white)",
        "Quivers: 2 removable preheating, 2 rinsing, 2 for flexible optics",
        "Optional switchable smoke evacuation, ULPA filter",
        "5 antistatic castors, height-adjustable positioning feet",
        "Weight: 85 to 115 kg; power 220–240 V~ (100–127 V~) 50/60 Hz; 1000 W max.",
        "CE marked according to directive 93/42/EEC") } },
  // --- Fauteuils ORL
  { id: "b5593bfd-ab32-49e3-80c8-71aa989df9d8", cat: "orl-fauteuils", sort: 1, img: "sit-4", pdf: BR.sit,
    fr: { nom: "Fauteuil d'examen et de traitement ORL SIT 4 (SIT 4 / SIT 4 Eco)",
      description: "Fauteuil d'examen et de traitement ORL qui combine une forme élancée et des fonctions ergonomiques complètes, fruit de 15 ans de développement. Sa colonne télescopique inclinée amène automatiquement le patient vers le médecin lors de la montée. Accoudoirs et repose-jambes suivent le dossier jusqu'à la position horizontale ; mise en position de Trendelenburg à -10° en cas de malaise ; rotation sur 360° avec cran à 90°. Version SIT 4 Eco allégée (réglage électrique de la hauteur, dossier inclinable manuel) et version fauteuil rotatoire programmable pour les examens vestibulaires. Tabouret médecin BELMONT en complément.",
      fiche_technique: L(
        "Réglage électrique de la hauteur : levage 20 cm (hauteur d'assise 55–75 cm) ou 30 cm en option (55–85 cm), pédale intégrée au socle",
        "Rotation libre sur 360° avec cran à 90° et frein de blocage ; en option rotation électrique 350° par pédale ou télécommande",
        "Assise pivotante 90° gauche / droite en option",
        "Dossier : de –10° à la position horizontale, manuel ou motorisé, accoudoirs et repose-jambes synchronisés",
        "Appui-tête de base (réglage en hauteur 15 cm) ou appui-tête chirurgical réglable, motorisation en option",
        "Fauteuil rotatoire : rotation électrique commandée par télécommande, programmation libre (examens 5, 10, 20 s)",
        "Rembourrage en cuir synthétique résistant aux désinfectants, assise amovible (Velcro®), cuir véritable sur demande",
        "Construction acier, double couche de peinture, coloris RAL au choix ; roulettes escamotables en option",
        "Poids : 105 à 120 kg ; alimentation 230 V~, 50 Hz, 550 W",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "SIT 4 ENT examination and treatment chair (SIT 4 / SIT 4 Eco)",
      description: "ENT examination and treatment chair combining a slim shape with complete ergonomic functions, the result of 15 years of development. Its inclined telescopic column automatically brings the patient towards the doctor as the chair rises. Armrests and leg rest follow the backrest down to the horizontal position; Trendelenburg position at -10° in case of collapse; 360° rotation with a 90° stop. Lighter SIT 4 Eco version (electric height adjustment, manually reclining backrest) and a programmable rotary chair version for vestibular testing. BELMONT physician stool available as a complement.",
      fiche_technique: L(
        "Electric height adjustment: 20 cm lift (seat height 55–75 cm) or optional 30 cm (55–85 cm), foot switch integrated in the base",
        "Free 360° rotation with 90° stop and locking brake; optional electric 350° rotation by foot switch or remote control",
        "Optional seat swivelling 90° left / right",
        "Backrest: from –10° to horizontal, manual or motorised, armrests and leg rest synchronised",
        "Basic headrest (15 cm height adjustment) or adjustable surgical headrest, optional motorisation",
        "Rotary chair: electric rotation by remote control, freely programmable (5, 10, 20 s tests)",
        "Synthetic leather upholstery resistant to disinfectants, removable seat (Velcro®), genuine leather on request",
        "Steel construction, two-layer paint, RAL colour of choice; optional retractable castors",
        "Weight: 105 to 120 kg; power 230 V~, 50 Hz, 550 W",
        "CE marked according to directive 93/42/EEC") } },
  // --- Endoscopie
  { id: "c98d8b69-f80c-400c-a853-12d9867b36b9", cat: "orl-endoscopie", sort: 1, img: "endoscope-0", pdf: BR.endo,
    fr: { nom: "Endoscope rigide ORL 0° (180 mm)", description: ENDO_FR + " Vision directe 0°, longueur 180 mm, diamètre 2,7 mm ou 4 mm.", fiche_technique: endoSpec("0°", 180, "fr") },
    en: { nom: "Rigid ENT endoscope 0° (180 mm)", description: ENDO_EN + " 0° straight view, 180 mm length, 2.7 mm or 4 mm diameter.", fiche_technique: endoSpec("0°", 180, "en") } },
  { id: "a1e9d120-f1e4-43e7-b927-d2052b4b2d1f", cat: "orl-endoscopie", sort: 2, img: "endoscope-30", pdf: BR.endo,
    fr: { nom: "Endoscope rigide ORL 30° (180 mm)", description: ENDO_FR + " Vision oblique 30°, longueur 180 mm, diamètre 2,7 mm ou 4 mm.", fiche_technique: endoSpec("30°", 180, "fr") },
    en: { nom: "Rigid ENT endoscope 30° (180 mm)", description: ENDO_EN + " 30° forward-oblique view, 180 mm length, 2.7 mm or 4 mm diameter.", fiche_technique: endoSpec("30°", 180, "en") } },
  { id: "9442066d-f5b9-4399-b864-3f46d8b43c67", cat: "orl-endoscopie", sort: 3, img: "endoscope-70", pdf: BR.endo,
    fr: { nom: "Endoscope rigide ORL 70° (180 mm)", description: ENDO_FR + " Vision latérale 70°, longueur 180 mm, diamètre 2,7 mm ou 4 mm.", fiche_technique: endoSpec("70°", 180, "fr") },
    en: { nom: "Rigid ENT endoscope 70° (180 mm)", description: ENDO_EN + " 70° lateral view, 180 mm length, 2.7 mm or 4 mm diameter.", fiche_technique: endoSpec("70°", 180, "en") } },
  { id: pid(2), slug: "otopront-endoscope-rigide-0-50mm", ref: "OTOPRONT-ENDOSCOPE-0-50MM", cat: "orl-endoscopie", sort: 4, img: "endoscope-otoscope", pdf: BR.endo,
    fr: { nom: "Endoscope rigide court 0° (50 mm) pour l'otoscopie", description: ENDO_FR + " Version courte 0°, longueur 50 mm, diamètre 2,7 mm ou 4 mm, adaptée à l'examen du conduit auditif.", fiche_technique: endoSpec("0°", 50, "fr") },
    en: { nom: "Short rigid endoscope 0° (50 mm) for otoscopy", description: ENDO_EN + " Short 0° version, 50 mm length, 2.7 mm or 4 mm diameter, suited to examining the ear canal.", fiche_technique: endoSpec("0°", 50, "en") } },
  { id: pid(3), slug: "otopront-naso-pharyngoscope", ref: "OTOPRONT-NASO-PHARYNGOSCOPE", cat: "orl-endoscopie", sort: 5, img: "naso-pharyngoscope", pdf: BR.endo,
    fr: { nom: "Naso-pharyngoscope flexible",
      description: "Naso-pharyngoscope flexible Otopront de 3,8 mm de diamètre (ou 2,7 mm), longueur utile 300 mm, oculaire réglable, angle de champ 85° et béquillage haut / bas de 150°. Livré avec câble de lumière et mallette de transport.",
      fiche_technique: L("Diamètre : 3,8 mm (ou 2,7 mm)", "Longueur utile : 300 mm", "Oculaire réglable", "Angle de champ : 85°", "Béquillage haut / bas : 150°", "Inclus : câble de lumière et mallette de transport") },
    en: { nom: "Flexible naso-pharyngoscope",
      description: "Otopront flexible naso-pharyngoscope, 3.8 mm diameter (or 2.7 mm), 300 mm working length, adjustable eyepiece, 85° field of view and 150° up / down deflection. Supplied with light cable and carrying case.",
      fiche_technique: L("Diameter: 3.8 mm (or 2.7 mm)", "Working length: 300 mm", "Adjustable eyepiece", "Field of view: 85°", "Up / down deflection: 150°", "Included: light cable and carrying case") } },
  // --- Laryngoscopie
  { id: pid(4), slug: "otopront-laryngoscope-slim-line", ref: "OTOPRONT-SLIM-LINE-LARYNGOSCOPE", cat: "orl-laryngoscopie", sort: 1, img: "laryngo-slim-line", pdf: BR.laryngo,
    fr: { nom: "Laryngoscope Slim Line (pédiatrique)", description: "Laryngoscope Otopront Slim Line pour la pédiatrie : endoscope 70° avec poignée.", fiche_technique: L("Usage : pédiatrique", "Optique : endoscope 70°", "Poignée intégrée") },
    en: { nom: "Slim Line laryngoscope (paediatric)", description: "Otopront Slim Line laryngoscope for paediatric use: 70° endoscope with handle.", fiche_technique: L("Use: paediatric", "Optic: 70° endoscope", "Integrated handle") } },
  { id: pid(5), slug: "otopront-laryngoscope-berci-ward", ref: "OTOPRONT-BERCI-WARD", cat: "orl-laryngoscopie", sort: 2, img: "laryngo-berci-ward", pdf: BR.laryngo,
    fr: { nom: "Laryngoscope Berci Ward", description: "Laryngoscope Otopront Berci Ward avec canal pour l'insufflation d'air.", fiche_technique: L("Canal pour l'insufflation d'air", "Poignée intégrée") },
    en: { nom: "Berci Ward laryngoscope", description: "Otopront Berci Ward laryngoscope with a channel for air insufflation.", fiche_technique: L("Channel for air insufflation", "Integrated handle") } },
  { id: "a2e71699-5aa9-4327-88f1-c82d91449fa2", cat: "orl-laryngoscopie", sort: 3, img: "telelaryngo", pdf: BR.laryngo,
    fr: { nom: "Télé-laryngo-pharyngoscope", description: "Télé-laryngo-pharyngoscope Otopront pour l'examen du larynx et du pharynx : grossissement 4x, transmission de la lumière par fibre optique et mise au point réglable.", fiche_technique: L("Grossissement : 4x", "Transmission de la lumière par fibre optique", "Mise au point réglable") },
    en: { nom: "Tele-laryngo-pharyngoscope", description: "Otopront tele-laryngo-pharyngoscope for examining the larynx and pharynx: 4x magnification, fibre-optic light transmission and adjustable focus.", fiche_technique: L("Magnification: 4x", "Fibre-optic light transmission", "Adjustable focus") } },
  // --- Vidéo-endoscopie
  { id: "337796e4-d4a5-437e-8633-1a56bdbd9cab", cat: "orl-video-endoscopie", sort: 1, img: "pes-pilot-hdpro", pdf: BR.pilot,
    fr: { nom: "Système de vidéo-endoscopie PES Pilot HDpro (écran 9\" ou 15,6\")",
      description: "Système de vidéo-endoscopie portable avec écran tactile frontal et caméra à capteur C-MOS d'une résolution supérieure au Full HD (1920 x 1200). Assez compact pour être posé directement sur l'unité ORL, il donne accès à toutes les fonctions sans grands mouvements : photo et vidéo par écran tactile ou pédale, marquage du résultat « au doigt sur l'image », comparaison de 4 images. Deux écrans supplémentaires (praticien et patient) et une deuxième caméra (par exemple pour le microscope) peuvent être raccordés. Intégration au logiciel du cabinet par GDT, et au SIH / PACS via HL7 et DICOM.",
      fiche_technique: L(
        "Modèles : écran tactile 9 pouces ou 15,6 pouces, capacitif, utilisable avec des gants, inclinable d'env. 45°",
        "Écran : 1920 x 1200, 400 cd/m², contraste 700:1, angle de vue 178°",
        "Caméra : capteur C-MOS 1/2\", 1920 x 1200 (2,23 MP), Global Shutter, jusqu'à 180 images/s, objectif 40 mm, monture C",
        "Enregistrement : vidéo MPEG et photo JPEG Full HD ; SSD 128 GB (jusqu'à 500 GB), env. 15 h de vidéo ou 10 000 photos",
        "Interfaces : 2 caméras, 2 sorties DVI/HDMI, 2 LAN, USB, souris et clavier",
        "Communication : GDT (Medistar, Turbomed, Albis, tomedo…), HL7, DICOM, Worklists DICOM",
        "Boîtier : 310 x 210 x 45 mm, tôle d'acier laquée (RAL) ; poids 4,2 kg (9\") / 6,5 kg (15\")",
        "Alimentation : 110–230 V, 50/60 Hz, 60 W ; pièce d'application de type BF",
        "Marquage selon la directive 93/42/CEE") },
    en: { nom: "PES Pilot HDpro video endoscopy system (9\" or 15.6\" screen)",
      description: "Portable video endoscopy system with a front touchscreen and a C-MOS camera with better-than-Full-HD resolution (1920 x 1200). Compact enough to sit directly on the ENT unit, it gives access to every function without large movements: photo and video by touchscreen or foot switch, marking findings with a finger on the image, comparison of 4 images. Two additional monitors (doctor and patient) and a second camera (for example on the microscope) can be connected. Integration with the practice software via GDT, and with HIS / PACS via HL7 and DICOM.",
      fiche_technique: L(
        "Models: 9-inch or 15.6-inch capacitive touchscreen, usable with gloves, tilts approx. 45°",
        "Display: 1920 x 1200, 400 cd/m², 700:1 contrast, 178° viewing angle",
        "Camera: 1/2\" C-MOS sensor, 1920 x 1200 (2.23 MP), Global Shutter, up to 180 frames/s, 40 mm lens, C-mount",
        "Recording: Full HD MPEG video and JPEG photos; 128 GB SSD (up to 500 GB), approx. 15 h of video or 10,000 photos",
        "Interfaces: 2 cameras, 2 DVI/HDMI outputs, 2 LAN, USB, mouse and keyboard",
        "Communication: GDT (Medistar, Turbomed, Albis, tomedo…), HL7, DICOM, DICOM worklists",
        "Housing: 310 x 210 x 45 mm, lacquered sheet steel (RAL); weight 4.2 kg (9\") / 6.5 kg (15\")",
        "Power: 110–230 V, 50/60 Hz, 60 W; type BF applied part",
        "Marked according to directive 93/42/EEC") } },
  // --- Stroboscopie
  { id: "ad09b724-1852-4c20-8e77-528b32c94f28", ref: "OTOPRONT-PES-PILOT-HDPRO-STROBOSCOPE", cat: "orl-stroboscopie", sort: 1, img: "pes-pilot-strobo", pdf: BR.strobo,
    fr: { nom: "Vidéo-stroboscope PES Pilot HDpro Stroboscope",
      description: "Stroboscope compact pour les phoniatres et ORL, qui joue dans la gamme des colonnes stroboscopiques professionnelles : système de vidéo-endoscopie PES Pilot HDpro 15 pouces (écran tactile et ordinateur) complété par une source de lumière stroboscopique LED développée par Otopront. Ses temps d'exposition très courts, couplés à la caméra Full HD, donnent des images nettes du mouvement des cordes vocales. Analyse image par image, ralenti réglable, extraction de photos avec les données dB et Hz, conformité DICOM. En option : vidéo-naso-pharyngoscope Chip-on-the-tip et chariot Strobo-Cart.",
      fiche_technique: L(
        "Base : système de vidéo-endoscopie PES Pilot HDpro 15 pouces, capture d'image et de vidéo Full HD",
        "Commande par écran tactile ou pédale ; ralenti de lecture réglable ; amplificateur de netteté avec mode boost",
        "Affichage des valeurs Hz et dB à l'écran ; analyse image par image, extraction d'image unique ; montage vidéo en option",
        "Source de lumière stroboscopique LED : cellule photoélectrique anti-éblouissement, température de couleur 4000 K, CRI > 92 %, durée de vie min. 10 000 h, très silencieuse",
        "Microphone intégré à la tête de caméra en option (70 à 12 500 Hz), haut-parleur intégré",
        "Option : naso-fibroscope Chip-on-the-tip Ø 3,9 mm, capteur CCD 500 x 582 (291 000 pixels)",
        "Option : chariot Strobo-Cart configurable") },
    en: { nom: "PES Pilot HDpro Stroboscope video stroboscope",
      description: "Compact stroboscope for phoniatricians and ENT specialists, in the range of professional stroboscopy towers: a 15-inch PES Pilot HDpro video endoscopy system (touchscreen and computer) completed by an LED stroboscopic light source developed by Otopront. Its very short exposure times, combined with the Full HD camera, give sharp images of vocal fold movement. Frame-by-frame analysis, adjustable slow motion, still extraction with dB and Hz data, DICOM conformance. Options: Chip-on-the-tip video naso-pharyngoscope and Strobo-Cart trolley.",
      fiche_technique: L(
        "Base: 15-inch PES Pilot HDpro video endoscopy system, Full HD image and video capture",
        "Operation by touchscreen or foot switch; adjustable playback slow motion; sharpness enhancer with boost mode",
        "Hz and dB values on screen; frame-by-frame analysis, single-image extraction; optional video editing",
        "LED stroboscopic light source: photoelectric anti-glare cell, colour temperature 4000 K, CRI > 92%, min. 10,000 h lifetime, very quiet",
        "Optional microphone integrated in the camera head (70 to 12,500 Hz), integrated speaker",
        "Option: Chip-on-the-tip naso-fiberscope Ø 3.9 mm, CCD sensor 500 x 582 (291,000 pixels)",
        "Option: configurable Strobo-Cart trolley") } },
  // --- Microscopie
  { id: pid(6), slug: "zeiss-opmi-pico-orl", ref: "ZEISS-OPMI-PICO-ORL", constructeur: "ZEISS", partner: null, cat: "orl-microscopie", sort: 1, img: "opmi-pico-2", pdf: BR.pico,
    fr: { nom: "Microscope de diagnostic ORL ZEISS OPMI® pico",
      description: "Microscope de diagnostic Carl Zeiss OPMI® pico pour l'ORL, petit, compact et maniable. Optique grand angle, changeur de grossissement apochromatique à cinq échelons et éclairage coaxial à lumière froide par fibre optique pour des images lumineuses et contrastées, avec une bonne perception du relief dans les conduits étroits. Tube d'observation ergonomique, oculaires pour porteurs de lunettes, objectifs interchangeables. Caméra vidéo intégrée et adaptateur Endoport™ pour caméra endoscopique en option. Statif S100 de sol, de plafond ou mural ; peut être intégré aux unités ORL Otopront (SMART, SMART WINGS, BASIC PLUS).",
      fiche_technique: L(
        "Éclairage : coaxial à lumière froide 12 V 100 W transmis par fibre optique, changeur de lampe rapide",
        "Distance de travail : 200 à 400 mm par paliers de 50 mm, objectifs interchangeables ; objectifs de mise au point f = 200 / 250 mm (accessoires)",
        "Tube d'observation : tube droit grand angle avec oculaires 10x ou 12,5x pour porteurs de lunettes, ou tube inclinable à 180°",
        "Changeur de grossissement apochromatique à 5 échelons (facteurs 0,4 / 0,6 / 1 / 1,6 / 2,5)",
        "Exemple f = 250 mm / oculaires 10x : grossissements 2,7x / 4,1x / 6,8x / 10,9x / 17x ; champ visuel 76 / 50 / 30 / 19 / 12 mm",
        "Caméra vidéo (option) : mono-CCD 1/4\", Y/C (S-vidéo) et composite, 752 x 582 pixels (PAL) / 768 x 494 (NTSC)",
        "Endoport® : sortie optique pour caméra endoscopique",
        "Statifs S100 : sol, plafond ou fixation murale",
        "Conformité : DIN EN ISO 9001, EN 46001, ISO 13485") },
    en: { nom: "ZEISS OPMI® pico ENT diagnostic microscope",
      description: "Carl Zeiss OPMI® pico diagnostic microscope for ENT, small, compact and easy to handle. Wide-angle optics, five-step apochromatic magnification changer and fibre-optic coaxial cold-light illumination for bright, high-contrast images with good depth perception in narrow canals. Ergonomic observation tube, eyepieces for spectacle wearers, interchangeable objectives. Optional integrated video camera and Endoport™ adapter for an endoscopic camera. S100 floor, ceiling or wall stand; can be integrated into Otopront ENT units (SMART, SMART WINGS, BASIC PLUS).",
      fiche_technique: L(
        "Illumination: 12 V 100 W coaxial cold light via fibre optics, quick lamp changer",
        "Working distance: 200 to 400 mm in 50 mm steps, interchangeable objectives; focusing objectives f = 200 / 250 mm (accessories)",
        "Observation tube: straight wide-angle tube with 10x or 12.5x eyepieces for spectacle wearers, or 180° inclinable tube",
        "5-step apochromatic magnification changer (factors 0.4 / 0.6 / 1 / 1.6 / 2.5)",
        "Example f = 250 mm / 10x eyepieces: magnifications 2.7x / 4.1x / 6.8x / 10.9x / 17x; field of view 76 / 50 / 30 / 19 / 12 mm",
        "Video camera (option): 1/4\" single CCD, Y/C (S-video) and composite, 752 x 582 pixels (PAL) / 768 x 494 (NTSC)",
        "Endoport®: optical port for an endoscopic camera",
        "S100 stands: floor, ceiling or wall mount",
        "Conformity: DIN EN ISO 9001, EN 46001, ISO 13485") } },
  // --- Éclairage
  { id: "4e57487f-c32c-4f03-90bb-52c658759038", cat: "orl-eclairage", sort: 1, img: "lampe-led", pdf: BR.led,
    fr: { nom: "Lampe frontale LED haute puissance",
      description: "Lampe frontale LED ultra-lumineuse et compacte offrant un éclairage coaxial puissant de 50 000 lux en lumière blanche (6250 K). Ne pèse que 70 g pour un grand confort même après de longues heures d'utilisation. Diamètre du spot et intensité réglables en continu ; alimentation sur secteur ou batterie ; fixation possible de loupes binoculaires HR / HRP et d'un prisme pour la vidéo ; ventilateur de refroidissement silencieux ; filtre jaune en option.",
      fiche_technique: L(
        "Éclairement : 50 000 lux à 250 mm de distance de travail",
        "Température de couleur : 6250 K",
        "LED haute puissance 1 W, durée de vie 50 000 h",
        "Spot réglable en continu (iris) de 20 à 100 mm (champ éclairé à 500 mm)",
        "Angle de déclinaison entièrement réglable ; rhéostat sur le bandeau, interrupteur OFF, témoin ON, régulateur de tension intégré",
        "Optique en verre multicouche",
        "Autonomie : 10 h avec mPack Li-ion, 4 h avec mPack UNPLUGGED, illimitée sur secteur",
        "Alimentations : transformateur à fiche, mPack, EN 50, mPack UNPLUGGED, EN 50 UNPLUGGED",
        "Poids : 70 g") },
    en: { nom: "High-power LED headlight",
      description: "Ultra-bright, compact LED headlight delivering powerful 50,000 lux coaxial white light (6,250 K). Weighs only 70 g for great comfort even after long hours of use. Continuously adjustable spot diameter and intensity; mains or battery power; HR / HRP binocular loupes and a video prism can be attached; silent cooling fan; optional yellow filter.",
      fiche_technique: L(
        "Illumination: 50,000 lux at 250 mm working distance",
        "Colour temperature: 6,250 K",
        "1 W high-power LED, 50,000 h lifetime",
        "Spot continuously adjustable (iris) from 20 to 100 mm (illuminated field at 500 mm)",
        "Fully adjustable declination angle; rheostat on the headband, OFF switch, ON indicator, integrated voltage regulator",
        "Multi-coated glass optics",
        "Operating time: 10 h with mPack Li-ion, 4 h with mPack UNPLUGGED, unlimited on mains",
        "Power sources: plug-in transformer, mPack, EN 50, mPack UNPLUGGED, EN 50 UNPLUGGED",
        "Weight: 70 g") } },
  { id: pid(7), slug: "otopront-lampe-frontale-fibre-optique-standard", ref: "325.080", cat: "orl-eclairage", sort: 2, img: "lampe-fo-standard", pdf: BR.fo,
    fr: { nom: "Lampe frontale à fibre optique Otopront standard (Art. 325.080)", description: FO_FR, fiche_technique: L("Art. No. 325.080", "Transmission de la lumière par fibre optique", "Câble de lumière inclus") },
    en: { nom: "Otopront standard fibre-optic headlight (Art. 325.080)", description: FO_EN, fiche_technique: L("Art. No. 325.080", "Fibre-optic light transmission", "Light cable included") } },
  { id: "fc13dbf0-4689-41a6-8ace-9a0806c06571", ref: "325.059", cat: "orl-eclairage", sort: 3, img: "lampe-fo-binner", pdf: BR.fo,
    fr: { nom: "Lampe frontale à fibre optique Otopront type Binner (Art. 325.059)", description: FO_FR, fiche_technique: L("Art. No. 325.059", "Type Binner", "Transmission de la lumière par fibre optique", "Câble de lumière inclus") },
    en: { nom: "Otopront Binner-type fibre-optic headlight (Art. 325.059)", description: FO_EN, fiche_technique: L("Art. No. 325.059", "Binner type", "Fibre-optic light transmission", "Light cable included") } },
  { id: pid(8), slug: "otopront-lampe-frontale-fibre-optique-legere", ref: "325.058", cat: "orl-eclairage", sort: 4, img: "lampe-fo-legere", pdf: BR.fo,
    fr: { nom: "Lampe frontale à fibre optique version légère (Art. 325.058)", description: FO_FR, fiche_technique: L("Art. No. 325.058", "Version légère", "Transmission de la lumière par fibre optique", "Câble de lumière inclus") },
    en: { nom: "Lightweight fibre-optic headlight (Art. 325.058)", description: FO_EN, fiche_technique: L("Art. No. 325.058", "Lightweight version", "Fibre-optic light transmission", "Light cable included") } },
  { id: "b2aea94d-4e29-4ac5-945b-97f2242c0e40", ref: "325.050 / 325.051", cat: "orl-eclairage", sort: 5, img: "lampe-fo-clar-2", pdf: BR.fo,
    fr: { nom: "Lampes frontales type CLAR (CLAR 73 / CLAR 55)",
      description: "Lampes frontales Otopront type CLAR : CLAR 73 à fibre optique (Art. 325.050) et CLAR 55 pour basse tension, livrée avec cordon et ampoule de rechange (Art. 325.051).",
      fiche_technique: L("CLAR 73 : lampe frontale à fibre optique, Art. No. 325.050", "CLAR 55 : lampe frontale basse tension avec cordon et ampoule de rechange, Art. No. 325.051") },
    en: { nom: "CLAR-type headlights (CLAR 73 / CLAR 55)",
      description: "Otopront CLAR-type headlights: fibre-optic CLAR 73 (Art. 325.050) and low-voltage CLAR 55 supplied with cord and spare bulb (Art. 325.051).",
      fiche_technique: L("CLAR 73: fibre-optic headlight, Art. No. 325.050", "CLAR 55: low-voltage headlight with cord and spare bulb, Art. No. 325.051") } },
  // --- Audiologie
  { id: pid(9), slug: "otopront-audio-audiometre", ref: "OTOPRONT-AUDIO", cat: "orl-audiologie", sort: 1, img: "audio", pdf: BR.audio,
    fr: { nom: "Audiomètre de diagnostic AUDIO",
      description: "Audiomètre haut de gamme pour tous les diagnostics quotidiens en clinique et en cabinet : audiométrie tonale par voie aérienne et osseuse et audiométrie vocale. Panneau convivial, boutons à cran magnétique sans usure pour un réglage précis du niveau sonore. Compatible avec les logiciels NOAH, CONNEXX et Avantgarde (interface GDT sur demande).",
      fiche_technique: L(
        "Configuration de base : audiomètre avec microphone et alimentation intégrés, casque, vibreur (conduction osseuse), commutateur de réponse patient ; coloris blanc ou argent",
        "Tests : audiométrie tonale, SISI avec compteur intégré (20 incréments de 5, 3, 2 et 1 dB), ABLB en alternance (pas de 1 ou 5 dB)",
        "Fréquences : 125 à 8000 Hz ; hautes fréquences 12,5 kHz ; option audiométrie hautes fréquences 9 à 16 kHz",
        "Dynamique : conduction osseuse –10 / 70 dB HL ; conduction aérienne –10 / 120 dB HL ; champ libre 10 / 100 dB HL (haut-parleurs actifs) ou 10 / 85 dB HL (passifs)",
        "Masquage : bruit à bande étroite, bruit à bande large pour la voix",
        "Sorties : casque Sennheiser HDA 280 (options Holmco PD-95 / PD-81, Beyerdynamic DT-48, Telephonics TDH 39), vibreur B 71, amplificateur champ libre",
        "Options : test vocal en langue nationale, lecteur CD, haut-parleurs champ libre, microphone externe, microphone patient",
        "Interface USB vers PC ; entrées CD / magnétophone, microphone vocal, microphone patient",
        "Alimentation : 110 / 230 V ± 10 %, 50/60 Hz ; EN 60601 classe 2, EN 60645-1 catégorie B-E",
        "Dimensions : 135 x 480 x 390 mm (H x L x P), env. 4 kg") },
    en: { nom: "AUDIO diagnostic audiometer",
      description: "High-end audiometer for all daily diagnostics in clinics and practices: pure-tone air and bone conduction audiometry and speech audiometry. User-friendly panel, wear-free magnetic detent knobs for precise level control. Compatible with NOAH, CONNEXX and Avantgarde software (GDT interface on request).",
      fiche_technique: L(
        "Basic configuration: audiometer with built-in microphone and power supply, headphones, bone vibrator, patient response switch; white or silver",
        "Tests: pure-tone audiometry, SISI with built-in counter (20 increments of 5, 3, 2 and 1 dB), alternating ABLB (1 or 5 dB steps)",
        "Frequencies: 125 to 8000 Hz; high frequency 12.5 kHz; optional high-frequency audiometry 9 to 16 kHz",
        "Range: bone conduction –10 / 70 dB HL; air conduction –10 / 120 dB HL; free field 10 / 100 dB HL (active speakers) or 10 / 85 dB HL (passive)",
        "Masking: narrow-band noise, broad-band noise for speech",
        "Outputs: Sennheiser HDA 280 headphones (options Holmco PD-95 / PD-81, Beyerdynamic DT-48, Telephonics TDH 39), B 71 bone vibrator, free-field amplifier",
        "Options: speech test in the national language, CD player, free-field speakers, external microphone, patient microphone",
        "USB interface to PC; inputs CD / tape, speech microphone, patient microphone",
        "Power: 110 / 230 V ± 10%, 50/60 Hz; EN 60601 class 2, EN 60645-1 category B-E",
        "Dimensions: 135 x 480 x 390 mm (H x W x D), approx. 4 kg") } },
  { id: pid(10), slug: "otopront-maxi-sound-shelter", ref: "OTOPRONT-MAXI-SOUND-SHELTER", cat: "orl-audiologie", sort: 2, img: "sound-shelter", pdf: BR.shelter,
    fr: { nom: "Cabine d'audiologie MAXI SOUND SHELTER",
      description: "Cabine d'audiologie offrant un environnement acoustique calibré pour les examens audiologiques et la recherche psychologique, selon vos exigences de qualité de test, d'espace et de budget. Idéale pour l'audiométrie tonale liminaire (voie aérienne et osseuse), l'audiométrie vocale au casque et l'enregistrement de données psychologiques. Joint magnétique Noise-Lock et ventilation forcée silencieuse.",
      fiche_technique: L(
        "Joint magnétique Noise-Lock",
        "Système de ventilation forcée silencieux",
        "Étagère extérieure 405 x 810 mm possible",
        "Réduction du bruit à 500 Hz (centre d'octave) : 38 dB",
        "Niveaux extérieurs admissibles : env. 70 dBA (ANSI) ; 60 dBA (ISO)",
        "Dimensions intérieures : 894 x 2000 x 948 mm (L x H x P)",
        "Dimensions extérieures : 1000 x 2250 x 1070 mm (L x H x P)",
        "Poids net : 350 kg") },
    en: { nom: "MAXI SOUND SHELTER audiology booth",
      description: "Audiology booth providing a calibrated acoustic environment for audiological examinations and psychological research, matching your requirements for test quality, space and budget. Ideal for pure-tone threshold audiometry (air and bone), speech audiometry via headphones and recording psychological data. Noise-Lock magnetic seal and silent forced ventilation.",
      fiche_technique: L(
        "Noise-Lock magnetic seal",
        "Silent forced ventilation system",
        "Optional external shelf 405 x 810 mm",
        "Noise reduction at 500 Hz (octave centre): 38 dB",
        "Permissible outside levels: approx. 70 dBA (ANSI); 60 dBA (ISO)",
        "Inside dimensions: 894 x 2000 x 948 mm (W x H x D)",
        "Outside dimensions: 1000 x 2250 x 1070 mm (W x H x D)",
        "Net weight: 350 kg") } },
  // --- Tympanométrie
  { id: "23952c1c-380e-4e4b-af77-02e2bf484458", cat: "orl-tympanometrie", sort: 1, img: "tymp", pdf: BR.tymp,
    fr: { nom: "Tympanomètre TYMP",
      description: "Tympanomètre pour le diagnostic de l'oreille moyenne par tympanométrie et réflexe stapédien. Mesure entièrement automatisée lancée depuis une interface tactile en verre, hygiénique et inclinable, à écran très contrasté. La recherche de compliance ne dure que 2 secondes, idéale pour les enfants et les patients agités ; réflexe ipsi- ou controlatéral ; compensation automatique de la pression en cas d'anomalie de l'oreille moyenne. Résultats imprimés sur l'imprimante thermique intégrée ou exportés vers un PC par USB.",
      fiche_technique: L(
        "Système contrôlé par microprocesseur",
        "Ton sonde : 226 Hz à 85 dB SPL",
        "Plage de pression : +200 à –400 daPa",
        "Durée du test de compliance : 2 s",
        "Niveaux de test du réflexe : 500, 1000, 2000, 4000 Hz à 85, 95 et 105 dB ; reconnaissance automatique des réflexes, ipsi ou controlatéral",
        "Calibration automatique de la pression ; changement de côté automatique ou manuel",
        "Pompe à piston très silencieuse ; imprimante thermique intégrée ; interface USB 1.1",
        "Dimensions : 11 x 40 x 38 cm ; poids 10 kg",
        "Alimentation : 110–240 V, 50/60 Hz ; CE selon MDD 93/42/CEE",
        "Accessoires : une sonde, 30 embouts de 5 tailles, casque pour test controlatéral (option)") },
    en: { nom: "TYMP tympanometer",
      description: "Tympanometer for middle-ear diagnosis by tympanometry and stapedial reflex. Fully automated measurement started from a hygienic, tilting glass touch interface with a very high-contrast screen. The compliance test takes only 2 seconds, ideal for children and restless patients; ipsilateral or contralateral reflex; automatic pressure compensation in case of abnormal middle-ear pressure. Results printed on the built-in thermal printer or exported to a PC via USB.",
      fiche_technique: L(
        "Microprocessor-controlled system",
        "Probe tone: 226 Hz at 85 dB SPL",
        "Pressure range: +200 to –400 daPa",
        "Compliance test time: 2 s",
        "Reflex test levels: 500, 1000, 2000, 4000 Hz at 85, 95 and 105 dB; automatic reflex detection, ipsi or contralateral",
        "Automatic pressure calibration; automatic or manual side change",
        "Very quiet piston pump; built-in thermal printer; USB 1.1 interface",
        "Dimensions: 11 x 40 x 38 cm; weight 10 kg",
        "Power: 110–240 V, 50/60 Hz; CE according to MDD 93/42/EEC",
        "Accessories: one probe, 30 ear tips in 5 sizes, headphone for contralateral test (option)") } },
  // --- Exploration vestibulaire
  { id: pid(11), slug: "otopront-vario-irrigateur-calorique", ref: "OTOPRONT-VARIO", cat: "orl-exploration-vestibulaire", sort: 1, img: "vario", pdf: BR.vario,
    fr: { nom: "Irrigateur calorique à eau VARIO",
      description: "Irrigateur calorique pour l'examen vestibulaire à l'hôpital comme au cabinet. Minuterie et logique d'utilisation prédéfinissent les temps de repos et de comptage ; l'irrigation s'arrête automatiquement à la fin du temps réglé. Température très stable grâce à une régulation PID par trois processeurs ; elle est mesurée par une sonde PTC dans la pièce à main et correspond à celle de l'eau expulsée. Circuit semi-fermé économe en eau et en énergie (env. 200 ml en circulation, sans dépôt calcaire). Écran en film PE ou verre, inclinable.",
      fiche_technique: L(
        "Principe : circuit semi-fermé avec chauffe-eau",
        "Mesure de la température : sonde PTC dans la pièce à main, variation linéaire < 0,1 °C / 100 °C, affichage LCD",
        "Débit de la pièce à main : 10–650 ml/min ; circulation d'eau 800 ml/min",
        "Intervalle de temps : 1–99 s réglable, avec signal acoustique",
        "Tolérance de température : < ± 0,3 °C",
        "Arrivée et évacuation d'eau : 3/8\", raccord rapide",
        "Dimensions : 320 x 140 x 400 mm (L x H x P) ; poids 10 kg",
        "Alimentation : 110–230 V~, 50/60 Hz, 1500 VA max.",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "VARIO water caloric irrigator",
      description: "Caloric irrigator for vestibular testing in hospitals and practices. A timer and operating logic preset rest and counting times; irrigation stops automatically at the end of the set time. Very stable temperature thanks to PID control by three processors; it is measured by a PTC sensor in the handpiece and matches the temperature of the water delivered. Semi-closed circuit saving water and energy (approx. 200 ml circulating, no limescale build-up). PE-film or glass screen, tilting.",
      fiche_technique: L(
        "Principle: semi-closed circuit with water heater",
        "Temperature measurement: PTC sensor in the handpiece, linear variation < 0.1 °C / 100 °C, LCD display",
        "Handpiece flow: 10–650 ml/min; water circulation 800 ml/min",
        "Time interval: 1–99 s adjustable, with acoustic signal",
        "Temperature tolerance: < ± 0.3 °C",
        "Water inlet and outlet: 3/8\", quick coupling",
        "Dimensions: 320 x 140 x 400 mm (W x H x D); weight 10 kg",
        "Power: 110–230 V~, 50/60 Hz, 1500 VA max.",
        "CE marked according to directive 93/42/EEC") } },
  { id: pid(12), slug: "otopront-vario-dry-stimulateur-calorique-air", ref: "OTOPRONT-VARIO-DRY", cat: "orl-exploration-vestibulaire", sort: 2, img: "vario-dry", pdf: BR.varioDry,
    fr: { nom: "Stimulateur calorique à air VARIO DRY",
      description: "Stimulateur calorique par air pour l'examen vestibulaire. Contrôlé par microprocesseur, il délivre un flux d'air à température constante introduit précisément dans le conduit auditif externe par une pièce à main ergonomique en inox, qui commande aussi le lancement de l'examen et du comptage. Trois températures présélectionnées (27 °C, 44 °C et froid) ou température libre avec la touche Vario. Chauffage, mesure et régulation dans la pièce à main ; pompe à air très silencieuse ; écran inclinable.",
      fiche_technique: L(
        "Système indépendant contrôlé par microprocesseur",
        "Températures : 27 °C, 44 °C, 38 °C, froid, Vario réglable",
        "Intervalle de temps : 1 à 99 s",
        "Sonde de température intégrée dans la pièce à main ; précision < ± 0,3 °C",
        "Débit d'air : 5 l/min",
        "Alimentation : 230 V / 50 Hz",
        "Dimensions : 320 x 140 x 400 mm (L x H x P) ; poids 8 kg") },
    en: { nom: "VARIO DRY air caloric stimulator",
      description: "Air caloric stimulator for vestibular testing. Microprocessor-controlled, it delivers a constant-temperature airflow precisely into the external ear canal through an ergonomic stainless-steel handpiece, which also starts the test and the count. Three preset temperatures (27 °C, 44 °C and cold) or a free temperature with the Vario key. Heating, measurement and control in the handpiece; very quiet air pump; tilting screen.",
      fiche_technique: L(
        "Independent microprocessor-controlled system",
        "Temperatures: 27 °C, 44 °C, 38 °C, cold, adjustable Vario",
        "Time interval: 1 to 99 s",
        "Temperature sensor integrated in the handpiece; accuracy < ± 0.3 °C",
        "Air flow: 5 l/min",
        "Power: 230 V / 50 Hz",
        "Dimensions: 320 x 140 x 400 mm (W x H x D); weight 8 kg") } },
  { id: pid(13), slug: "otopront-vng-videonystagmographie", ref: "OTOPRONT-VNG-SYSTEM", cat: "orl-exploration-vestibulaire", sort: 3, img: "vng", pdf: BR.vng,
    fr: { nom: "Système de vidéonystagmographie VNG",
      description: "Système de vidéonystagmographie qui mesure les mouvements oculaires grâce à des caméras vidéo infrarouges miniatures intégrées au masque, sans électrodes. Compact : unité d'analyse, masque ergonomique à visière et logiciel CNG Analyseur ou Vestlab. La version de base permet les épreuves spontanées, caloriques et définies par l'utilisateur ; avec le système Vidéo Objectif en option, stimulation optocinétique, poursuite et saccades. S'intègre facilement aux stimulateurs caloriques ; avec le fauteuil rotatoire, complète la série de tests vestibulaires pour le diagnostic des vertiges.",
      fiche_technique: L(
        "Caméras vidéo infrarouges : standard CCIR, résolution 352 x 288, 50 balayages/s par canal, 12 V",
        "Infrarouge : longueur d'onde 950 nm, luminance sous l'EMP selon EN 60825",
        "Unité d'analyse CNG : interface RS 232C, isolation 4 kV, basculement caméras droite / gauche, sorties +12 V / +5 V ; 360 x 296 x 60 mm",
        "Logiciel CNG Analyseur : épreuves spontanées, caloriques, définies par l'utilisateur (p. ex. positionnelles)",
        "Logiciel Vestlab : idem + optocinétique, poursuite, saccades, rotatoires, posturographie") },
    en: { nom: "VNG videonystagmography system",
      description: "Videonystagmography system measuring eye movements with miniature infrared video cameras built into the goggles, without electrodes. Compact: analysis unit, ergonomic goggles with visor and CNG Analyser or Vestlab software. The basic version covers spontaneous, caloric and user-defined tests; with the optional Video Objective system, optokinetic stimulation, smooth pursuit and saccades. Integrates easily with caloric stimulators; with the rotary chair it completes the vestibular test series for diagnosing dizziness and vertigo.",
      fiche_technique: L(
        "Infrared video cameras: CCIR standard, 352 x 288 resolution, 50 scans/s per channel, 12 V",
        "Infrared: 950 nm wavelength, luminance below MPE according to EN 60825",
        "CNG analysis unit: RS 232C interface, 4 kV isolation, right / left camera switching, +12 V / +5 V outputs; 360 x 296 x 60 mm",
        "CNG Analyser software: spontaneous, caloric, user-defined tests (e.g. positional)",
        "Vestlab software: same + optokinetic, pursuit, saccades, rotatory tests, posturography") } },
  // --- Rhinologie
  { id: "9f2532f5-c56a-4409-8346-91bf93a1acdd", cat: "orl-rhinologie", sort: 1, img: "rhino-sys", pdf: BR.rhino,
    fr: { nom: "Système de diagnostic de la respiration nasale RHINO-SYS",
      description: "Système complet à 3 composants pour le diagnostic fonctionnel de la respiration nasale : rhinomanométrie et rhinorésistométrie (station centrale RHINO-BASE avec ordinateur portable), rhinométrie acoustique (RHINO-ACOUSTIC, section des fosses nasales dans les 5 premiers centimètres) et rhinoflowmétrie longue durée sur 24 heures (enregistreur portable RHINO-MOVE, avec fréquence cardiaque). Débit mesuré par un masque à buse ultrasensible avec filtre à usage unique, pression choanale par adaptateur nasal autocollant. Logiciel développé avec le Prof. Mlynski (Université de Greifswald). Chariot RHINO-CART en option.",
      fiche_technique: L(
        "Méthode : mesure de la résistance à l'écoulement de l'air dans les fosses nasales, pneumotachographe, buse de Fleischer chauffée à compensation de température",
        "Rhinoflowmétrie longue durée : signal respiratoire sur 24 h et fréquence cardiaque",
        "Rhinométrie acoustique : mesure par réflexion filtrée, évaluation numérique ; tube acoustique découplé",
        "Protection : type BF selon IEC / EN 60601-1 ; IPX0 ; classe I ; isolation galvanique de l'interface RHINO-BASE",
        "RHINO-BASE : 70 x 370 x 200 mm (L x H x P), 4 kg ; boîtier à accessoires inclus",
        "Alimentation : 110–240 V~, 50/60 Hz, 15 VA",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "RHINO-SYS nasal breathing diagnostic system",
      description: "Complete 3-component system for functional diagnosis of nasal breathing: rhinomanometry and rhinoresistometry (RHINO-BASE central station with laptop), acoustic rhinometry (RHINO-ACOUSTIC, cross-section of the nasal cavity over the first 5 cm) and 24-hour long-term rhinoflowmetry (RHINO-MOVE portable recorder, with heart rate). Flow measured through a mask with an ultra-sensitive nozzle and disposable filter, choanal pressure through a self-adhesive nasal adapter. Software developed with Prof. Mlynski (University of Greifswald). Optional RHINO-CART trolley.",
      fiche_technique: L(
        "Method: measurement of airflow resistance in the nasal passages, pneumotachograph, heated Fleischer nozzle with temperature compensation",
        "Long-term rhinoflowmetry: 24 h breathing signal and heart rate",
        "Acoustic rhinometry: filtered reflection measurement, digital evaluation; acoustically decoupled tube",
        "Protection: type BF according to IEC / EN 60601-1; IPX0; class I; galvanic isolation of the RHINO-BASE interface",
        "RHINO-BASE: 70 x 370 x 200 mm (W x H x D), 4 kg; accessory box included",
        "Power: 110–240 V~, 50/60 Hz, 15 VA",
        "CE marked according to directive 93/42/EEC") } },
  // --- Diagnostic sinusien
  { id: pid(14), slug: "otopront-digital-5-echoscope-sinus", ref: "OTOPRONT-DIGITAL-5", cat: "orl-diagnostic-sinusien", sort: 1, img: "digital-5", pdf: BR.digital,
    fr: { nom: "Échoscope sinusien mode A DIGITAL 5",
      description: "Appareil d'échographie mode A destiné à l'examen des sinus et à l'établissement des diagnostics correspondants. Grande sensibilité et fonctionnement très silencieux ; amplification réglable au bouton rotatif, autres commandes au clavier à membrane ou à la pédale. Affichage d'une image individuelle ou comparaison de jusqu'à quatre échogrammes ; documentation sur imprimante thermique intégrée ou imprimante réseau (options). Écran plat TFT inclinable.",
      fiche_technique: L(
        "Méthode échographique : mode A",
        "Sonde : 4,25 MHz, Ø 10 mm, focalisation linéaire 2 à 6 cm",
        "Amplification : 65 à 120 dB, réglable en continu ; compensation TGC en fonction de la profondeur",
        "Mémoire numérique pour 4 images, commande par pédale ; image individuelle ou comparative",
        "Extension d'image : 40 à 100 mm",
        "Écran plat TFT haute résolution, inclinable ; clavier à membrane",
        "Documentation : imprimante thermique intégrée ou réseau LAN (options, isolation selon IEC 60601-1)",
        "Boîtier acier, couleurs RAL ; 24,5 x 21 x 29 cm (L x H x P) ; 5 kg",
        "Alimentation : 110–230 V~, 50/60 Hz, 25 W",
        "Marquage CE selon la directive 93/42/CEE") },
    en: { nom: "DIGITAL 5 A-mode sinus echoscope",
      description: "A-mode ultrasound unit for examining the sinuses and establishing the corresponding diagnoses. High sensitivity and very quiet operation; gain adjustable with a rotary knob, other controls via membrane keyboard or foot switch. Single-image display or comparison of up to four echograms; documentation on the optional built-in thermal printer or a network printer. Tilting TFT flat screen.",
      fiche_technique: L(
        "Ultrasound method: A-mode",
        "Probe: 4.25 MHz, Ø 10 mm, linear focusing 2 to 6 cm",
        "Gain: 65 to 120 dB, continuously adjustable; depth-dependent TGC compensation",
        "Digital memory for 4 images, foot-switch control; single or comparative display",
        "Image range: 40 to 100 mm",
        "High-resolution tilting TFT flat screen; membrane keyboard",
        "Documentation: built-in thermal printer or LAN network (options, isolation according to IEC 60601-1)",
        "Steel housing, RAL colours; 24.5 x 21 x 29 cm (W x H x D); 5 kg",
        "Power: 110–230 V~, 50/60 Hz, 25 W",
        "CE marked according to directive 93/42/EEC") } },
];

// no brochure match -> archived (never deleted)
const ARCHIVE = [
  "abb64199-1ed5-49c4-9f32-0ad50175f7a3", // « Endoscope Rigide 45° » (325164): no 45° in the brochure
  "ae85e587-f604-4d5c-99e6-4f4c283636d3", // rigid-endoscopes-90: no 90° in the brochure
  "34a3e417-1dcb-4ba4-91c0-dfa976830163", // pes-eco-hd-cam-ra-syst-me: no PES Eco brochure
  "fe023ac0-c525-411a-b109-40843b0a9e42", // endoscopy-accessoires-components « Centre de Traitement PROFESSIONAL »
  "96d9bf5b-f85b-4621-b824-06ace14b50fa", // stub ref « 000 » (SMART duplicate)
  "1270e704-08c5-4357-bf9e-2f8be1c3c951", // stub ref « 00 » (BASIC PLUS duplicate)
];

// ---------------------------------------------------------------- snapshot
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const cats = await prisma.categories.findMany({ where: { slug: { in: [ORL, OLD_SUB] } }, include: { category_translations: true } });
  const sub = cats.find((c) => c.slug === OLD_SUB);
  const products = await prisma.products.findMany({ where: { category_id: sub.id }, include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  const out = { taken_at: new Date().toISOString(), categories: {}, products: {} };
  for (const c of cats) { const { category_translations, ...row } = c; out.categories[c.slug] = { row, translations: category_translations }; }
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${cats.length} categories, ${products.length} products -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);

async function apply() {
  const orl = await prisma.categories.findUnique({ where: { slug: ORL } });
  const oldSub = await prisma.categories.findUnique({ where: { slug: OLD_SUB } });
  for (const c of CATS) {
    if (!exists(cimg(c.image))) console.log(`  [MISSING FILE] ${cimg(c.image)}`);
    const row = await prisma.categories.findUnique({ where: { id: c.id } });
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, parent_id: orl.id, sort_order: c.sort,
        is_active: true, type: oldSub.type, image_url: cimg(c.image), updated_at: now(),
        category_translations: { create: [{ id: `${c.id}-fr`, language_code: "fr", name: c.fr }, { id: `${c.id}-en`, language_code: "en", name: c.en }] } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== orl.id) data.parent_id = orl.id;
    if (row.sort_order !== c.sort) data.sort_order = c.sort;
    if (row.image_url !== cimg(c.image)) data.image_url = cimg(c.image);
    if (!row.is_active) data.is_active = true;
    if (row.name !== c.fr) data.name = c.fr;
    if (!Object.keys(data).length) { console.log(`  [SKIP] category ${c.slug}`); continue; }
    console.log(`  category ${c.slug} ${JSON.stringify(data)}`);
    if (WRITE) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
  }

  const catId = Object.fromEntries(CATS.map((c) => [c.slug, c.id]));
  for (const p of PRODUCTS) {
    for (const f of [pimg(p.img), p.pdf]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = { id: `${p.id}-m78`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    if (!row) {
      if (BEFORE.products[p.id]) { console.log(`  [MISSING PRODUCT] ${p.id}`); continue; }
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat}`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat],
        constructeur: p.constructeur || "otopront", partner_id: p.partner === null ? null : OTOPRONT,
        status: "active", sort_order: p.sort, pdf_brochure_url: p.pdf, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    // reused product (or a product created by an earlier --apply)
    const data = {};
    if (row.category_id !== catId[p.cat]) data.category_id = catId[p.cat];
    if (row.status !== "active") data.status = "active";
    if (row.sort_order !== p.sort) data.sort_order = p.sort;
    if (row.pdf_brochure_url !== p.pdf) data.pdf_brochure_url = p.pdf;
    if (p.ref && row.reference_fournisseur !== p.ref) data.reference_fournisseur = p.ref;
    const constructeur = p.constructeur || "otopront", partner = p.partner === null ? null : OTOPRONT;
    if (row.constructeur !== constructeur) data.constructeur = constructeur;
    if (row.partner_id !== partner) data.partner_id = partner;
    const tr = [];
    for (const lang of ["fr", "en"]) {
      const t = row.product_translations.find((x) => x.language_code === lang);
      if (!t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k]))) tr.push(lang);
    }
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary;
    if (!Object.keys(data).length && !tr.length && mediaOk) { console.log(`  [SKIP] product ${row.slug}`); continue; }
    const fr = row.product_translations.find((x) => x.language_code === "fr");
    console.log(`  product ${row.slug.padEnd(36)} « ${fr?.nom?.trim()} » -> « ${p.fr.nom} »`);
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

  for (const id of ARCHIVE) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${id}`); continue; }
    if (row.status === "archived") { console.log(`  [SKIP] archive ${row.slug}`); continue; }
    console.log(`  archive ${row.slug} [${row.reference_fournisseur}]`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }

  const left = await prisma.products.count({ where: { category_id: oldSub.id, status: "active" } });
  const leaving = WRITE ? 0 : Object.values(BEFORE.products).filter((b) => b.row.status === "active").length;
  if (left - leaving > 0) console.log(`  [KEEP] ${OLD_SUB} still has ${left} active products`);
  else if (!oldSub.is_active) console.log(`  [SKIP] hide ${OLD_SUB}`);
  else { console.log(`  hide ${OLD_SUB}`); if (WRITE) await prisma.categories.update({ where: { id: oldSub.id }, data: { is_active: false, updated_at: now() } }); }
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
  const n = await prisma.products.deleteMany({ where: { id: { in: PRODUCTS.map((p) => p.id).filter((id) => !BEFORE.products[id]) } } });
  console.log(`  - deleted ${n.count} new products`);
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
