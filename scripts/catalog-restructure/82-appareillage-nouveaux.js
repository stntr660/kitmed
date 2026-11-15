const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- Lot D « Appareillage : nouveaux modèles » + « Couteaux Corza (Stylus) ».
 *
 * 1. New devices, ADDED next to the existing models of their tile (nothing removed), each with
 *    its photo cropped from the client brochure (app82-*.jpg) and the brochure PDF (app82-*.pdf):
 *      retinographes    NIDEK AFC-1 (rétinographe non mydriatique, slit scan)
 *      oct-et-imagerie  NIDEK RSD-1 Duo (OCT + rétinographe) + plateforme EyeLink
 *      frontofocometre  NIDEK LM-1PD / LM-1P / LM-1 (one product, 3 versions)
 *      perimetres       HAAG-STREIT Octopus 910
 *      echographes      KEELER Accutome 4Sight (A-scan, B-scan, UBM, pachymètre), part 24-8000.
 *                       Partner ACCUTOME stays inactive (script 67): linked to partner KEELER.
 *    Renamed: NT-1 -> « Tonomètre / pachymètre sans contact NT-1 / NT-1e / NT-1p » (+ pachymetry
 *    sentence from the client brochure), MP-3 -> « Micropérimètre MP-3 / MP-3S » (+ MP-3S sentence).
 *
 * 2. Consommables > Couteaux: Uniquetech knives became Corza (Stylus). 17 products, one per family
 *    of the Stylus catalogue (90 codes), constructeur « CORZA (Stylus) », partner
 *    surgicalspecialities-corza (activated, renamed « CORZA (Surgical Specialties) », the partner
 *    name is shown on the product page), codes listed in the fiche technique AND in the
 *    description (the public product page does not render fiche_technique). UNIQUETECH-COUTEAUX is
 *    archived and partner Uniquetech set inactive (no other product). The inactive Corza
 *    « Couteaux microsensibles » row and the archived Keeler Cryo II probes are left untouched.
 *
 * --snapshot writes 82-before.json (refuses to overwrite); dry-run by default; --apply; --revert
 * restores the snapshot rows exactly and deletes the created products.
 *   docker cp 82-appareillage-nouveaux.js <app>:/tmp/82.js ; docker cp 82-before.json <app>:/tmp/
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/82.js [--snapshot|--apply|--revert]
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "82-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();
const L = (...lines) => lines.join("\n");
const pimg = (n) => `/uploads/products/app82-${n}.jpg`;
const pdf = (n) => `/uploads/pdfs/app82-${n}.pdf`;

const P = {
  NIDEK: "3b9ab70b-80d7-4130-a4db-f1196ce8e1d1",
  HAAG: "bc6c494f-bfd1-488b-aabe-91bdfe65e519",
  KEELER: "a7ed36de-b687-4c74-a499-f6c817815355",
  CORZA: "dfc94859-9703-48c9-9206-b45fd2d57b68",
  UNIQUETECH: "a4dd17b5-a630-4fcd-8dbb-7bd820459570",
};
const NT1 = "40fca373-375e-48c6-be14-4a70125b30c5";
const MP3 = "16a900cb-4ff6-48a4-b2d9-0686d3590603";
const UNIQUETECH_KNIVES = "430c53db-bf47-4368-a759-26fb90309426";
const pid = (n) => `d82a0001-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;

// ---------------------------------------------------------------- 1. devices
const DEVICES = [
  { id: pid(1), slug: "app82-nidek-afc-1", ref: "AFC-1", cat: "retinographes", sort: 2, img: "nidek-afc-1", pdf: pdf("nidek-afc-1"),
    constructeur: "nidek", partner: P.NIDEK,
    fr: { nom: "Rétinographe non mydriatique automatique AFC-1",
      description: "Rétinographe couleur non mydriatique entièrement automatique NIDEK, basé sur la technologie de balayage par fente (slit scan) : images du fond d'œil à haut contraste et haute définition, avec moins d'artefacts et d'ombres, et un meilleur taux de réussite malgré l'éclairage de la salle, la cataracte ou une petite pupille (ø 2,0 mm min.). Champ de 50° (74° mesuré au centre de l'œil), conservé en mode petite pupille. Le mode panorama PanView assemble automatiquement de 2 à 7 clichés, jusqu'à 98° (145° au centre de l'œil). Cinq fonctions automatiques (détection de la pupille et alignement, passage en mode petite pupille, mise au point, prise de vue, passage à l'autre œil), avec reprise manuelle au joystick à tout moment. Photographie couleur du segment antérieur, mesure papille / excavation (rapport C/D), réglage du contraste, gamma, luminosité et couleur. Écran inclinable et pivotant pour une installation contre un mur ou dans un coin. Impression directe, DICOM direct et plateforme EyeLink (vendue séparément).",
      fiche_technique: L(
        "Type : rétinographe couleur non mydriatique",
        "Principe de capture : balayage par fente (slit scan)",
        "Caméra : CMOS 12 mégapixels intégrée",
        "Source lumineuse : LED (rouge / vert / bleu)",
        "Diamètre pupillaire minimum : ø 2,0 mm (mode petite pupille)",
        "Angle de champ : jusqu'à 50° ; panorama PanView jusqu'à 98° (2 à 7 clichés)",
        "Distance de travail : 24,9 mm (fond d'œil), 58,7 mm (image couleur du segment antérieur)",
        "Compensation dioptrique : -20 à +20 D au total",
        "Point de fixation interne : LED",
        "Course de l'appareil : 87 mm (droite / gauche), 32 mm (haut / bas), 46 mm (avant / arrière)",
        "Mentonnière : 62 mm (haut / bas, motorisée)",
        "Alignement automatique : détection de la pupille, directions X-Y-Z ; prise de vue automatique",
        "Réseau : PC externe, DICOM",
        "Écran : LCD couleur 10,1\" inclinable, 1280 x 800 pixels (WXGA)",
        "Alimentation : 100 à 240 V CA, 50/60 Hz ; consommation 220 VA",
        "Dimensions / poids : 303 (L) x 519 (P) x 566 (H) mm / 25 kg",
        "Accessoire en option : point de fixation externe") },
    en: { nom: "AFC-1 Non-mydriatic Auto Fundus Camera",
      description: "NIDEK fully automatic non-mydriatic colour fundus camera based on slit-scan technology: high-contrast, high-definition fundus images with fewer artifacts and shadows, and a higher imaging success rate despite room light, cataracts or small pupils (min. ø2.0 mm). 50° angle of view (74° at the centre of the eye), kept in small pupil mode. PanView panorama mode automatically combines 2 to 7 shots, up to 98° (145° at the centre of the eye). Five auto functions (pupil detection and alignment, small pupil mode, focus and optimizing, image capture, shift to the other eye), with manual joystick override at any time. Colour imaging of the anterior eye segment, disc / cup measurement (C/D ratio), adjustable contrast, gamma, brightness and colour. Tiltable / swivelling screen for installation against a wall or in a corner. Direct print, direct DICOM and EyeLink platform (sold separately).",
      fiche_technique: L(
        "Type: non-mydriatic fundus camera, colour",
        "Capture principle: slit scan",
        "Camera: built-in 12-megapixel CMOS camera",
        "Light source: LED (red / green / blue)",
        "Minimum pupil diameter: ø2.0 mm (small pupil mode)",
        "Angle of view: up to 50°; PanView panorama up to 98° (2 to 7 shots)",
        "Working distance: 24.9 mm (fundus camera), 58.7 mm (colour anterior eye image)",
        "Dioptric compensation: -20 to +20 D total",
        "Internal fixation lamp: LED",
        "Device movement range: 87 mm (right / left), 32 mm (up / down), 46 mm (forth / back)",
        "Chinrest movement: 62 mm (up / down, motorized)",
        "Auto alignment: pupil detection, X-Y-Z directions; auto shot",
        "Networking: external PC, DICOM",
        "Display: tiltable 10.1-inch colour LCD, 1280 x 800 pixels (WXGA)",
        "Power supply: 100 to 240 V AC, 50/60 Hz; power consumption 220 VA",
        "Dimensions / mass: 303 (W) x 519 (D) x 566 (H) mm / 25 kg",
        "Optional accessory: external fixation lamp") } },

  { id: pid(2), slug: "app82-nidek-rsd-1-duo", ref: "RSD-1-DUO", cat: "oct-et-imagerie", sort: 1, img: "nidek-rsd-1-duo", pdf: pdf("nidek-rsd-1-duo"),
    constructeur: "nidek", partner: P.NIDEK,
    fr: { nom: "OCT / rétinographe RSD-1 Duo + plateforme EyeLink",
      description: "Système NIDEK associant un OCT spectral domain et un rétinographe couleur non mydriatique à balayage par fente, entièrement automatisé : OCT et photo du fond d'œil sont capturés à la suite, avec passage automatique en mode petite pupille (ø 2,0 mm min. pour le fond d'œil). B-scan large et profond (ligne maculaire 16,5 mm, profondeur 3,0 mm), carte rétine 15 x 10 mm couvrant papille et macula en un seul cliché, débruitage d'un B-scan sélectionné par apprentissage profond, base normative grand axe (LAL-RDB) avec compensation de la longueur axiale pour le glaucome du myope, OCT-angiographie (option), autofluorescence (FAF, modèle FAF), segment antérieur avec l'adaptateur en option (carte pachymétrique, carte épithéliale, angle irido-cornéen). Panorama PanView jusqu'à 98°. Fonctionne seul (rapports d'analyse de base, impression, DICOM direct sans PC) ou avec EyeLink, la plateforme NIDEK de gestion des données (serveur / postes clients) et son logiciel Retina Viewer pour les analyses avancées : segmentation par apprentissage profond, carte de normalité structurelle (SN Map), suivi avec recalage automatique, densité vasculaire (VAD) et zone avasculaire fovéolaire (FAZ) en OCT-A, analyse bilatérale du glaucome. EyeLink et Retina Viewer sont vendus séparément.",
      fiche_technique: L(
        "OCT : spectral domain ; résolution optique Z 7 µm, X-Y 20 µm",
        "Largeur de balayage : ligne jusqu'à 16,5 mm (X) / 15,0 mm (Y) ; carte jusqu'à 15,0 x 10,0 mm",
        "Profondeur de balayage : 3,0 mm ; source SLD 880 nm ; 70 000 A-scans/s",
        "Moyennage : jusqu'à 30 images (ligne maculaire), 50 images (ligne ACA)",
        "Diamètre pupillaire minimum OCT : ø 2,5 mm (ø 3,0 mm ou plus recommandé)",
        "Protocoles : ligne, multi et radial maculaires, cartes macula / papille / rétine ; en option cartes angio macula / papille, cornée radiale, ligne ACA",
        "Analyses : segmentation de 4 couches rétiniennes, correction de largeur de balayage, cartes d'épaisseur rétine totale / GCC / RNFL, cartes percentiles RDB / LAL-RDB",
        "Rétinographe : couleur non mydriatique, FAF (modèle FAF), balayage par fente, caméra CMOS 12 Mpx, LED rouge / vert / bleu, ø 2,0 mm min. (mode petite pupille), jusqu'à 50°",
        "Distance de travail : 24,9 mm (OCT / fond d'œil), 20,0 mm (OCT antérieur), 58,7 mm (image couleur du segment antérieur)",
        "Compensation dioptrique : -20 à +20 D au total ; mentonnière motorisée 62 mm",
        "Alignement et prise de vue automatiques ; réseau PC externe, DICOM",
        "Écran : LCD couleur 10,1\" inclinable, 1280 x 800 pixels (WXGA)",
        "Alimentation : 100 à 240 V CA, 50/60 Hz ; 220 VA",
        "Dimensions / poids : 303 (L) x 519 (P) x 566 (H) mm / 28 kg",
        "Options : adaptateur segment antérieur, point de fixation externe, dongle OCT-A",
        "EyeLink (vendu séparément) : serveur et clients, licences DICOM et HL7, Retina Viewer avec licences de débruitage B-scan et OCT-A ; Windows 11 Pro / IoT Enterprise / Enterprise, écran 1920 x 1080 ou plus") },
    en: { nom: "RSD-1 Duo OCT / fundus camera + EyeLink platform",
      description: "NIDEK system combining a spectral-domain OCT and a slit-scan non-mydriatic colour fundus camera, fully automated: OCT and fundus images are captured in sequence, with automatic switch to small pupil mode (min. ø2.0 mm for the fundus). Wide and deep B-scan (16.5 mm macula line, 3.0 mm depth), 15 x 10 mm retina map capturing disc and macula in one shot, deep-learning denoising of a selected B-scan, long axial length reference database (LAL-RDB) with axial length compensation for glaucoma in myopic eyes, OCT-Angiography (optional), fundus autofluorescence (FAF model), anterior segment with the optional adapter (pachy map, epithelium map, anterior chamber angle). PanView panorama up to 98°. Works standalone (basic analysis reports, direct print, direct DICOM without a PC) or with EyeLink, the NIDEK eye-care data management platform (server / clients) and its Retina Viewer software for advanced analysis: deep-learning segmentation, Structural Normality Map (SN Map), follow-up with automatic registration, vessel area density (VAD) and foveal avascular zone (FAZ) in OCT-A, bilateral glaucoma analysis. EyeLink and Retina Viewer are sold separately.",
      fiche_technique: L(
        "OCT: spectral domain; optical resolution Z 7 µm, X-Y 20 µm",
        "Scan width: line up to 16.5 mm (X) / 15.0 mm (Y); map up to 15.0 x 10.0 mm",
        "Scan depth: 3.0 mm; SLD light source 880 nm; 70,000 A-scans/s",
        "Image averaging: up to 30 images (macula line), 50 images (ACA line)",
        "Minimum pupil diameter (OCT): ø2.5 mm (ø3.0 mm or larger recommended)",
        "Scan patterns: macula line, multi and radial, macula / disc / retina maps; optional macula / disc angio maps, cornea radial, ACA line",
        "Analysis: segmentation of 4 retinal layers, scan width correction, full retina / GCC / RNFL thickness maps, RDB / LAL-RDB percentile maps",
        "Fundus camera: non-mydriatic colour, FAF (FAF model), slit scan, 12-megapixel CMOS, red / green / blue LED, min. ø2.0 mm (small pupil mode), up to 50°",
        "Working distance: 24.9 mm (OCT / fundus), 20.0 mm (anterior OCT), 58.7 mm (colour anterior eye image)",
        "Dioptric compensation: -20 to +20 D total; motorized chinrest 62 mm",
        "Auto alignment and auto shot; networking external PC, DICOM",
        "Display: tiltable 10.1-inch colour LCD, 1280 x 800 pixels (WXGA)",
        "Power supply: 100 to 240 V AC, 50/60 Hz; 220 VA",
        "Dimensions / mass: 303 (W) x 519 (D) x 566 (H) mm / 28 kg",
        "Options: anterior segment adapter, external fixation lamp, OCT-A dongle",
        "EyeLink (sold separately): server and clients, DICOM and HL7 licences, Retina Viewer with B-scan and OCT-A denoise licences; Windows 11 Pro / IoT Enterprise / Enterprise, 1920 x 1080 display or higher") } },

  { id: pid(3), slug: "app82-nidek-lm-1pd-lm-1p-lm-1", ref: "LM-1PD, LM-1P, LM-1", cat: "frontofocometre", sort: 2, img: "nidek-lm-1", pdf: pdf("nidek-lm-1pd-lm-1p-lm-1"),
    constructeur: "nidek", partner: P.NIDEK,
    fr: { nom: "Frontofocomètre automatique LM-1PD / LM-1P / LM-1",
      description: "Frontofocomètre automatique NIDEK à écran tactile couleur 7\" et icônes repensées. Capteur de Hartmann à 161 points de mesure simultanés dans le porte-verre, avec un algorithme qui facilite la mesure de la zone de vision de près des verres progressifs de faible puissance. Lumière de mesure verte 531 ± 12 nm proche de la norme ISO (sans compensation du nombre d'Abbe), détection automatique du type de verre, mesure de transmittance UV (400 nm), lumière bleue et verte avec comparaison de deux verres, contrôle de distorsion, fonction d'implantation du prisme, encre de marquage compatible avec les traitements hydrophobes. RS-232C, LAN et USB en standard (carte Eye Care en option). Trois versions : LM-1PD (imprimante et mesure de l'écart pupillaire avec curseur PD), LM-1P (imprimante, sans curseur PD) et LM-1 (sans imprimante).",
      fiche_technique: L(
        "Versions : LM-1PD (imprimante + mesure PD), LM-1P (imprimante), LM-1 (sans imprimante)",
        "Sphère : -25,00 à +25,00 D (verres de lunettes) ; -20,00 à +20,00 D, BC 6,00 à 9,00 (lentilles de contact) ; pas 0,01 / 0,06 / 0,12 / 0,25 D",
        "Cylindre : 0,00 à ±10,00 D (-, MIX, +) ; axe 0 à 180° (pas de 1°)",
        "Addition : +0,40 à +10,00 D (1re et 2e addition)",
        "Prisme : 0,00 à 20,00 Δ ; modes Δ, base interne / externe, base haute / basse",
        "Mesure PD (LM-1PD) : 0,0 à 49,5 mm (monoculaire), PD unifocal et PD de loin des verres progressifs ; PD approximatif en mode échelle sur toute la série",
        "Transmittance : 0 à 100 % (pas de 1 ou 5 %), longueurs d'onde centrales 400–410 nm (UV-A), 449–465 nm (bleu), 519–543 nm (vert)",
        "Temps de mesure : 0,08 s ±10 % (minimum)",
        "Diamètre de verre mesurable : ø 20 à 120 mm (lunettes) ; supérieur à ø 5 mm (lentilles)",
        "Compensation pour verres à haut indice : nombre d'Abbe réglable de 20 à 60",
        "Marqueur : cartouche d'encre, tampon encreur en option",
        "Longueur d'onde de référence : raie e (546,07 nm) ou d (587,56 nm) ; 161 points de mesure",
        "Écran : TFT-LCD couleur 7\", 800 x 480 points, rétroéclairage LED",
        "Imprimante (LM-1PD / LM-1P) : thermique à ligne avec coupe automatique, papier 58 mm",
        "Interfaces : USB, RS-232C, LAN (1 port chacun)",
        "Alimentation : 100 à 240 V CA, 50/60 Hz, 50 VA",
        "Dimensions / poids : 198 (L) x 249 (P) x 405 (H) mm ; 4,40 kg (LM-1PD), 4,35 kg (LM-1P), 4,05 kg (LM-1)",
        "Accessoires standard : cordon d'alimentation, housse, papier d'impression (LM-1PD / LM-1P), porte-verre pour lentilles de contact, guide de mesure des verres progressifs",
        "Options : câble RS-232C, pédale, EyeCa-RW2, carte Eye Care, tampon encreur, stylos marqueurs rouge / bleu") },
    en: { nom: "LM-1PD / LM-1P / LM-1 Auto Lensmeter",
      description: "NIDEK auto lensmeter with a 7-inch colour touch screen and refined icons. Hartmann sensor with 161 simultaneous measurement points within the nosepiece, with an algorithm that makes it easier to measure the near-vision area of low-power progressive lenses. 531 ± 12 nm green measurement light similar to the ISO standard (no Abbe number compensation needed), automatic lens type detection, UV (400 nm), blue and green light transmittance measurement with two-lens comparison, distortion check, prism layout function, marking ink compatible with water-repellent coatings. RS-232C, LAN and USB as standard (optional Eye Care card). Three versions: LM-1PD (printer and PD measurement with PD slider), LM-1P (printer, no PD slider) and LM-1 (no printer).",
      fiche_technique: L(
        "Versions: LM-1PD (printer + PD measurement), LM-1P (printer), LM-1 (no printer)",
        "Sphere: -25.00 to +25.00 D (spectacle lenses); -20.00 to +20.00 D, BC 6.00 to 9.00 (contact lenses); 0.01 / 0.06 / 0.12 / 0.25 D increments",
        "Cylinder: 0.00 to ±10.00 D (-, MIX, +); axis 0 to 180° (1° increments)",
        "ADD: +0.40 to +10.00 D (first add, second add)",
        "Prism: 0.00 to 20.00 Δ; Δ, base in / out, base up / down modes",
        "PD measurement (LM-1PD): 0.0 to 49.5 mm (monocular), single vision PD and progressive lens far vision PD; approximate PD with scale mode on the whole series",
        "Transmittance: 0 to 100% (1 or 5% increments), central wavelengths 400–410 nm (UV-A), 449–465 nm (blue), 519–543 nm (green)",
        "Measurement time: 0.08 s ±10% (minimum)",
        "Measurable lens diameter: ø20 to 120 mm (spectacle lenses); larger than ø5 mm (contact lenses)",
        "Compensation for high index lenses: Abbe number changeable from 20 to 60",
        "Lens marker: ink cartridge type, optional ink pad type",
        "Reference wavelength: e-line (546.07 nm) or d-line (587.56 nm); 161 measuring points",
        "Display: 7-inch colour TFT-LCD, 800 x 480 dots, LED backlight",
        "Printer (LM-1PD / LM-1P): thermal line printer with auto cutter, 58 mm paper",
        "Interface: USB, RS-232C, LAN (1 port each)",
        "Power supply: 100 to 240 V AC, 50/60 Hz, 50 VA",
        "Dimensions / mass: 198 (W) x 249 (D) x 405 (H) mm; 4.40 kg (LM-1PD), 4.35 kg (LM-1P), 4.05 kg (LM-1)",
        "Standard accessories: power cord, dust cover, printer paper (LM-1PD / LM-1P), nosepiece for contact lenses, instructions for progressive lens measurement",
        "Options: RS-232C cable, foot switch, EyeCa-RW2, Eye Care card, ink pad marker, red / blue marker pens") } },

  { id: pid(4), slug: "app82-haag-streit-octopus-910", ref: "HAAG-OCTOPUS-910", cat: "perimetres", sort: 5, img: "octopus-910", pdf: pdf("haag-streit-octopus-910"),
    constructeur: "haag-streit", partner: P.HAAG,
    fr: { nom: "Périmètre Octopus 910",
      description: "Périmètre à projection à coupole entièrement LED, champ complet, conçu pour la prise en charge du glaucome et au-delà, fort de plus de 80 ans d'expertise Haag-Streit en périmétrie. De la périmétrie standard automatisée (SAP) à la périmétrie spécialisée : analyse par clusters (Cluster Analysis) pour les atteintes glaucomateuses précoces et stimulus V avec données normatives pour les stades avancés, analyse polaire (Polar Analysis) pour la corrélation structure / fonction avec l'OCT, programmes G et M ciblés. Import des champs visuels HFA et des autres périmètres Octopus pour suivre la progression dans une vue combinée. Guidage intelligent du patient et de l'examinateur : porte-verre d'essai motorisé avec Autovertex, occulteur intégré (sans cache-œil), mentonnière et appui-front uniques, positionnement automatique de la pupille, guidage vocal (option), suivi actif de l'œil avec pause automatique, voyant d'état multicolore visible de trois côtés. Logiciel EyeSuite pour l'intégration réseau.",
      fiche_technique: L(
        "Principe : périmètre à projection à coupole entièrement LED",
        "Étendue du champ visuel : 180° horizontal, 60° supérieur, 70° inférieur",
        "Distance d'examen : 30 cm",
        "Éclairage de fond : 0, 4, 31,4, 314 asb",
        "Durée du stimulus : 100, 200, 500, 1000 ms ou au choix",
        "Intensité du stimulus : 0,2 à 10 000 asb ; taille Goldmann I à V ; intervalle 2 s, 3 s, 4 s ou adaptatif ; plage dynamique 50 dB",
        "Écran tactile intégré 15,6\" inclinable ; voyant d'état (progression, pulsé, fixe ; blanc, vert, bleu, orange, rouge)",
        "Données normatives selon l'âge ; occulteur intégré, cache-œil",
        "Méthodes d'examen : blanc sur blanc (SAP), bleu sur jaune (SWAP), flicker, bleu et vert sur blanc, rouge sur blanc",
        "Stratégies : TOP (2 à 4 min), dynamique (6 à 8 min), normale (10 à 12 min), basse vision, 2 niveaux, 1 niveau, dépistage 1 minute",
        "Programmes : centraux F, M, 10-2, G, 24-2, 24-2C, 32, 30-2, S28 ; périphériques 07, C40, C64, C76, C80 ; conduite Esterman (mono / binoculaire), EDT ; BT, BG, N1, D1, B ; examen personnalisé",
        "Analyse : indices globaux (MD, DD, LD, sLV, CsLV), indices de fiabilité (FP, FN, RF), VFS, GCT, stadification Brusini et HPA, courbe de défaut, tendance cluster et polaire",
        "Assistance : porte-verre motorisé, mentonnière / appui-front motorisés, positionnement automatique de la pupille et du porte-verre, Autovertex, contrôle de fixation, vidéo de l'œil, détection de la pupille, des clignements et de la tête, repositionnement automatique ; guidage vocal en option",
        "Réseau : DICOM, DME, commande à distance, export statistique, import des champs visuels (Octopus 101, 123, 300, 600, 900, HFA II et HFA3) ; USB, Ethernet, DisplayPort",
        "Dimensions (L x P x H) : 660 x 464 x 689 mm ; poids 21 kg",
        "Alimentation : 100–240 V CA ; consommation 90 VA",
        "Versions Basic et Pro (selon les fonctions)") },
    en: { nom: "Octopus 910 Perimeter",
      description: "All-LED full-field cupola projection perimeter designed for glaucoma management and beyond, backed by more than 80 years of Haag-Streit expertise in perimetry. From standard automated perimetry (SAP) to specialized perimetry: Cluster Analysis for early glaucomatous changes and Stimulus V testing with normative data for late stages, Polar Analysis for structure / function comparison with OCT, targeted G and M patterns. Visual field import from HFA and other Octopus perimeters to follow progression in a combined view. Smart guidance of patient and examiner: motorized trial lens holder with Autovertex, integrated occluder (no eye patch), single chin and forehead rest, automated pupil positioning, voice guidance (optional), active eye tracking with automatic pause, multi-colour status light visible from three sides. EyeSuite software for network integration.",
      fiche_technique: L(
        "Operating principle: all-LED cupola projection perimeter",
        "Visual field extent: 180° horizontal, 60° superior, 70° inferior",
        "Testing distance: 30 cm",
        "Background illumination: 0, 4, 31.4, 314 asb",
        "Stimulus duration: 100, 200, 500, 1000 ms or freely selectable",
        "Stimulus intensity: 0.2 to 10,000 asb; size Goldmann I to V; interval 2 s, 3 s, 4 s or adaptive; dynamic range 50 dB",
        "Integrated tiltable 15.6\" touch display; status light (progression, pulsating, static; white, green, blue, orange, red)",
        "Age-matched normative database; integrated occluder, eye patch",
        "Test methods: white-on-white (SAP), blue-on-yellow (SWAP), flicker, blue and green-on-white, red-on-white",
        "Strategies: TOP (2–4 min), dynamic (6–8 min), normal (10–12 min), low vision, 2-level, 1-level, 1 minute screening",
        "Test library: central F, M, 10-2, G, 24-2, 24-2C, 32, 30-2, S28; peripheral 07, C40, C64, C76, C80; driving Esterman (monocular, binocular), EDT; BT, BG, N1, D1, B; custom test",
        "Analysis: global indices (MD, DD, LD, sLV, CsLV), reliability indices (FP, FN, RF), VFS, GCT, Brusini and HPA staging, defect curve, cluster and polar trend",
        "Examination support: motorized trial lens holder, motorized chin and forehead rest, automatic pupil and trial lens positioning, Autovertex, fixation control, video eye monitoring, pupil, blink and head detection, automatic repositioning; optional voice guide",
        "Networking: DICOM, EMR, remote control, statistical export, visual field import (Octopus 101, 123, 300, 600, 900, HFA II and HFA3); USB, Ethernet, DisplayPort",
        "Dimensions (W x D x H): 660 x 464 x 689 mm; weight 21 kg",
        "Power: 100–240 V AC; consumption 90 VA",
        "Basic and Pro versions (depending on features)") } },

  { id: pid(5), slug: "app82-keeler-accutome-4sight", ref: "24-8000", cat: "echographes", sort: 2, img: "keeler-accutome-4sight", pdf: pdf("keeler-accutome-4sight"),
    constructeur: "KEELER", partner: P.KEELER,
    fr: { nom: "Échographe ophtalmique 4Sight (A-scan, B-scan, UBM, pachymètre)",
      description: "Plateforme Keeler Accutome « quatre en un » de diagnostic ophtalmique par ultrasons : A-scan, B-scan, UBM (biomicroscopie ultrasonore du segment antérieur) et pachymètre réunis dans une seule unité portable à écran tactile, fabriquée aux États-Unis. Les données patient passent d'un module à l'autre, DICOM Worklist intégré, rapports transmis par DME, e-mail ou imprimante ; les sondes B-scan et UBM fonctionnent aussi sur un ordinateur Windows. A-scan : modes immersion ou contact, détection automatique de l'alignement et reconnaissance de la sclère, formules Hoffer Q, Holladay I, SRK/T, Haigis, SRK II, Binkhorst II et méthodes post-chirurgie réfractive. B-scan : résolution 0,015 mm, zoom 2x, boucles vidéo illimitées, 12 outils de mesure. UBM 48 MHz : cornée, iris, corps ciliaire, zonules, cristallin et implant, mesure sulcus à sulcus, profondeur de chambre antérieure et angle. Pachymètre : précision ± 5 µm, 9 zones de mesure par œil, correction automatique de la PIO. Référence 24-8000.",
      fiche_technique: L(
        "Unité 4Sight (réf. 24-8000) : 3,18 kg ; 381 x 50,8 x 279,4 mm ; écran tactile ; béquille",
        "Connexions : HDMI et Ethernet ; 5 ports USB ; DICOM Worklist intégré ; connexions des sondes A-scan et pachymètre",
        "A-scan : 10 MHz ; sonde 2,23 g, 44,45 x 5,08 mm ; immersion ou contact ; capture automatique ou manuelle ; résolution électronique 0,016 mm ; précision clinique 0,01 mm ; 4096 points par onde",
        "A-scan, types d'œil : phaque, cataracte dense, rempli de silicone, pseudophaque PMMA / silicone / acrylique, aphaque (types personnalisables) ; mesures ACD, épaisseur du cristallin, VCD, longueur axiale",
        "A-scan, formules : Hoffer Q, Holladay I, SRK/T, Haigis, SRK II, Binkhorst II ; post-chirurgie réfractive : historique clinique, lentille de contact, Shammas clinique, saisie",
        "B-scan : 12 ou 15 MHz ; sonde 0,17 kg, 177,8 x 31,75 mm ; résolution axiale 0,015 mm, latérale 0,085 mm ; angle de balayage 60° ; 2048 points par ligne ; gain TGC ; zoom 2x ; 256 images max. par séquence ; 12 compas de mesure",
        "UBM : 48 MHz ; sonde 0,17 kg, 177,8 x 31,75 mm ; résolution axiale 0,015 mm, latérale 0,05 mm ; angle de balayage 30° ; 2048 points par ligne ; gain TGC ; zoom 2x ; 12 compas de mesure ; câble USB avec isolateur",
        "Pachymètre : sonde 19 g, 44,45 x 5,08 mm (ø 2,5 mm) ; précision ± 5 µm ; échantillonnage 65 MHz ; plage 300–999 µm ; ajustement automatique de la PIO",
        "Export des rapports / images : PDF, JPEG, PNG, GIF, TIFF, BITMAP ; gamma réglable (linéaire, courbe en S, log, couleur)",
        "Accessoires fournis : souris et clavier sans fil, porte-sondes (au dos de l'unité), alimentation, coque d'immersion A-scan, manuel, guide de référence rapide, blocs de test A-scan, pédale",
        "Options : porte-sondes de table B-scan et UBM, bras de fixation Ergotron (mur ou table)") },
    en: { nom: "4Sight ophthalmic ultrasound (A-scan, B-scan, UBM, pachymeter)",
      description: "Keeler Accutome four-in-one ophthalmic ultrasound diagnostics platform: A-scan, B-scan, UBM (ultrasound biomicroscopy of the anterior segment) and pachymeter combined in one portable touchscreen unit, made in the USA. Patient data is passed between modalities, integrated DICOM Worklist, reports shared via EMR, email or printer; the B-scan and UBM probes also work with a Windows PC. A-scan: immersion or contact modes, automatic alignment detection and sclera recognition, Hoffer Q, Holladay I, SRK/T, Haigis, SRK II, Binkhorst II formulas and post-refractive methods. B-scan: 0.015 mm resolution, 2x zoom, unlimited film loops, 12 measuring calipers. 48 MHz UBM: cornea, iris, ciliary body, zonules, crystalline lens and IOL, sulcus-to-sulcus, anterior chamber depth and angle measurement. Pachymeter: ±5 µm accuracy, 9 measurement areas per eye, automated IOP adjustment. Part number 24-8000.",
      fiche_technique: L(
        "4Sight unit (part 24-8000): 3.18 kg; 381 x 50.8 x 279.4 mm; touchscreen; kickstand",
        "Connections: HDMI and Ethernet; 5 USB ports; integrated DICOM Worklist; A-scan and pachymeter probe connections",
        "A-scan: 10 MHz; probe 2.23 g, 44.45 x 5.08 mm; immersion or contact; automatic or manual capture; electronic resolution 0.016 mm; clinical accuracy 0.01 mm; 4096 data points per waveform",
        "A-scan eye types: phakic, dense cataract, silicone filled, pseudo PMMA / silicone / acrylic, aphakic (custom types possible); measures ACD, lens thickness, VCD, axial length",
        "A-scan formulas: Hoffer Q, Holladay I, SRK/T, Haigis, SRK II, Binkhorst II; post-refractive: clinical history, contact lens, Shammas clinical, entered",
        "B-scan: 12 or 15 MHz; probe 0.17 kg, 177.8 x 31.75 mm; axial resolution 0.015 mm, lateral 0.085 mm; 60° scanning angle; 2048 points per line; time gain control; 2x zoom; up to 256 frames per scan; 12 measuring calipers",
        "UBM: 48 MHz; probe 0.17 kg, 177.8 x 31.75 mm; axial resolution 0.015 mm, lateral 0.05 mm; 30° scanning angle; 2048 points per line; time gain control; 2x zoom; 12 measuring calipers; USB cable with power isolator",
        "Pachymeter: probe 19 g, 44.45 x 5.08 mm (ø2.5 mm); accuracy ±5 µm; 65 MHz sample rate; range 300–999 µm; automated IOP adjustment",
        "Report / image export: PDF, JPEG, PNG, GIF, TIFF, BITMAP; adjustable gamma (linear, S-curve, log, colour)",
        "Supplied accessories: wireless mouse and keyboard, probe holders (back of the unit), power supply, A-scan immersion shell, manual, quick reference guide, A-scan test blocks, foot switch",
        "Options: B-scan and UBM table-top probe holders, Ergotron mounting arm (wall or table)") } },
];

// ---------------------------------------------------------------- renamed existing products
const RENAMES = [
  { id: NT1,
    fr: { nom: "Tonomètre / pachymètre sans contact NT-1 / NT-1e / NT-1p",
      description: "Tonomètre sans contact NIDEK NT-1, entièrement automatisé ; la version NT-1p est un tonomètre-pachymètre sans contact. La mesure démarre automatiquement dès que le patient pose le menton sur la mentonnière, grâce à la caméra de détection oculaire. La technologie APC (Automatic Puff Control) ajuste automatiquement la puissance du jet d'air en fonction de la pression intraoculaire du patient, pour plus de confort et moins de bruit. Sur le NT-1p, la pachymétrie sans contact mesure l'épaisseur cornéenne centrale et la PIO est automatiquement compensée en fonction de cette épaisseur. Guidage vocal disponible en 9 langues. Modèles : NT-1e (mesure manuelle), NT-1 (automatique), NT-1p (tonomètre-pachymètre)." },
    en: { nom: "Non-contact tonometer / pachymeter NT-1 / NT-1e / NT-1p",
      description: "NIDEK NT-1 fully automated non-contact tonometer; the NT-1p version is a non-contact tonometer / pachymeter. Measurement starts automatically when the patient places their chin on the chinrest, thanks to the eye detection camera. APC (Automatic Puff Control) technology automatically adjusts the air puff power to the patient's intraocular pressure, for more comfort and less noise. On the NT-1p, non-contact pachymetry measures the central corneal thickness and the IOP is automatically compensated for it. Voice guidance available in 9 languages. Models: NT-1e (manual measurement), NT-1 (automatic), NT-1p (tonometer / pachymeter)." } },
  { id: MP3,
    fr: { nom: "Micropérimètre MP-3 / MP-3S",
      description: "Le NIDEK MP-3 est un micropérimètre avancé mesurant la sensibilité rétinienne locale avec intégration d'une caméra de fond d'œil de 12 mégapixels. Caractéristiques : large plage de mesure (0-34 dB), auto-tracking et auto-alignement 3D, analyse de fixation et mode de réhabilitation visuelle. Les résultats peuvent être affichés sur des images couleur du fond d'œil pour corrélation anatomo-fonctionnelle. Le modèle MP-3S (scotopique) permet en plus les examens en milieu scotopique grâce à sa coque sombre, son écran de luminosité adaptée et sa luminance de fond réduite à 0,003 asb : la sensibilité des bâtonnets est évaluée spécifiquement (DMLA, certaines rétinites pigmentaires). Il dispose des mêmes fonctionnalités que le MP-3." },
    en: { nom: "MP-3 / MP-3S Microperimeter",
      description: "NIDEK MP-3 is an advanced microperimeter measuring local retinal sensitivity with 12-megapixel fundus camera integration. Features wide measurement range (0-34 dB), 3D auto-tracking and auto-alignment, fixation analysis, and visual rehabilitation mode. Results can be displayed over color fundus images for anatomical-functional correlation. The MP-3S (scotopic) model also performs examinations in scotopic conditions thanks to its dark housing, adapted screen brightness and background luminance reduced to 0.003 asb: rod sensitivity is evaluated specifically (AMD, some forms of retinitis pigmentosa). It has the same features as the MP-3." } },
];

// ---------------------------------------------------------------- 2. Stylus knives (Corza)
const fr = (s) => s
  .replace(/(\d)\.(\d)/g, "$1,$2").replace(/(\d)mm/g, "$1 mm").replace(/(\d)cm/g, "$1 cm")
  .replace(/Angled right, full handle/g, "coudé à droite, manche complet")
  .replace(/(?:F|f)ull handle/g, "manche complet")
  .replace(/(?:B|b)lade and tip/g, "lame et embout")
  .replace(/with ([\d,]+ mm) width indicator/g, "avec indicateur de largeur $1")
  .replace(/with ([\d,]+ mm) depth indicator/g, "avec indicateur de profondeur $1")
  .replace(/with depth markings/g, "avec repères de profondeur")
  .replace(/([\d,]+ mm) restricted blade depth/g, "profondeur de lame limitée à $1")
  .replace(/double[- ]bevel/g, "double biseau").replace(/bevel[- ]up/g, "biseau vers le haut").replace(/bevel down/g, "biseau vers le bas")
  .replace(/320° cutting edge/g, "tranchant sur 320°")
  .replace(/Paracentesis knife/g, "couteau à paracentèse")
  .replace(/Mini-Crescent, angled/g, "mini-croissant, coudé")
  .replace(/Micro-blade/g, "Micro-lame")
  .replace(/Angled|angled/g, "coudé").replace(/Straight|straight/g, "droit")
  .replace(/(\d+)g, /g, "$1 G, ").replace(/µm, /g, " µm, ")
  .replace(/^([\d,]+ cm) Length$/, "Longueur $1");
const STAB = [["52-1501","15°, Full handle"],["52-2201","22.5°, Full handle"],["52-3001","30°, Full handle"],["52-4501","45°, Full handle"],["52-1502","15°, Blade and tip"],["52-2202","22.5°, Blade and tip"],["52-4502","45°, Blade and tip"],["52-1531","15°, Full handle, 3.0mm restricted blade depth"],["52-1551","15°, Full handle, 5.0mm restricted blade depth"],["52-3036","30°, Full handle, 3.5mm restricted blade depth"],["52-1512","15°, Blade and tip, 1.5mm restricted blade depth"],["52-1532","15°, Blade and tip, 3.0mm restricted blade depth"],["52-1552","15°, Blade and tip, 5.0mm restricted blade depth"],["52-1591","15°, Angled right, full handle"]];
// guarded / specialty lines are written by hand in French (fr3 = explicit FR text)
const KNIVES = [
  { key: "stab", fr: "Couteaux de ponction (stab) Stylus™", en: "Stylus™ stab knives",
    dFr: "Couteaux de ponction Stylus™ trempés à chaud pour une pointe solide et droite, qui pénètre facilement lors des incisions de ponction initiales. Manche complet ou lame et embout (blade and tip), angles de 15° à 45°, versions à profondeur de lame limitée.",
    dEn: "Stylus™ stab knives are heat-tempered to provide a strong, true point for easy penetration during initial stab incisions. Full handle or blade and tip, 15° to 45°, restricted blade depth versions.",
    codes: STAB },
  { key: "depth", fr: "Couteaux de précision à profondeur calibrée Stylus™", en: "Stylus™ precision depth knives",
    dFr: "Couteaux Stylus™ à profondeur de précision, conçus pour les incisions en rainure et les incisions relaxantes limbiques. Leur conception monobloc garantit une profondeur précise.",
    dEn: "Stylus™ precision depth knives are designed to create groove and limbal relaxation incisions. Single formed design ensures precision accuracy.",
    codes: [["52-3503","350µm, Straight, full handle"],["52-5503","550µm, Straight, full handle"]] },
  { key: "clear-corneal", fr: "Couteaux pour cornée claire Stylus™", en: "Stylus™ clear corneal knives",
    dFr: "Couteaux Stylus™ conçus spécifiquement pour les incisions en cornée claire. Les repères de profondeur à 1,5 mm, 1,75 mm et 2,0 mm donnent un repère visuel simple pour les incisions near-clear et à charnière.",
    dEn: "Stylus™ Clear Corneal knives have been designed specifically for clear corneal incisions. Depth markings of 1.5 mm, 1.75 mm and 2.0 mm provide easy visual reference for near-clear and hinge incisions.",
    codes: [["52-1661","1.6mm, Angled, full handle with 1.4mm width indicator"],["52-1761","1.7mm, Angled, full handle with 1.4mm width indicator"],["52-1863","1.8mm, Angled, full handle with 1.5mm depth indicator"],["52-2663","2.65mm, Angled, full handle with depth markings"],["52-2763","2.75mm, Angled, full handle with depth markings"],["52-2863","2.85mm, Angled, full handle with depth markings"],["52-3061","3.0mm, Angled, full handle with depth markings"]] },
  { key: "clear-corneal-parallel", fr: "Couteaux pour cornée claire double biseau à côtés parallèles Stylus™", en: "Stylus™ clear corneal knives, double bevel parallel sides",
    dFr: "Couteaux Stylus™ pour cornée claire à côtés parallèles, conçus spécifiquement pour les incisions en cornée claire. Les repères de profondeur à 1,5 mm, 1,75 mm et 2,0 mm donnent un repère visuel simple pour les incisions near-clear et à charnière.",
    dEn: "Stylus™ Clear Corneal knives with parallel sides have been designed specifically for clear corneal incisions. Depth markings of 1.5 mm, 1.75 mm and 2.0 mm provide easy visual reference for near-clear and hinge incisions.",
    codes: [["52-2634","2.65mm, Straight, full handle with depth markings"],["52-2635","2.65mm, Angled, full handle with depth markings"],["52-2735","2.75mm, Angled, full handle with depth markings"],["52-2835","2.85mm, Angled, full handle with depth markings"],["52-3035","3.0mm, Angled, full handle with depth markings"],["52-3235","3.2mm, Angled, full handle with depth markings"]] },
  { key: "cleartrap", fr: "Couteaux trapézoïdaux ClearTrap™ cornée claire / implant Stylus™", en: "Stylus™ ClearTrap™ trapezoid clear corneal / implant knives",
    dFr: "Couteaux trapézoïdaux Stylus™ ClearTrap™ conçus pour les incisions en cornée claire. Leur double fonction permet de réaliser l'incision en cornée claire et l'incision d'implantation avec un seul couteau.",
    dEn: "Stylus™ ClearTrap™ trapezoid clear corneal / implant knives have been designed specifically for clear corneal incisions. Dual-purpose design provides the ability to accomplish clear corneal and implant incisions with one knife.",
    codes: [["55-1214","1.2 - 1.4mm, Angled, full handle with depth markings"],["55-2022","2.0 - 2.2mm, Angled, full handle with depth markings"],["55-2724","2.75 - 3.2mm, Angled, full handle with depth markings"],["55-2825","2.85 - 3.5mm, Angled, full handle with depth markings"],["55-2826","2.85 - 3.75mm, Angled, full handle with depth markings"],["55-3226","3.2 - 3.75mm, Angled, full handle with depth markings"]] },
  { key: "pilot-tip", fr: "Couteau d'implantation Pilot Tip™ Stylus™", en: "Stylus™ Pilot Tip™ implant knife",
    dFr: "Couteau d'implantation Stylus™ Pilot Tip™ conçu pour suivre facilement l'incision du couteau à fente, tandis que ses bords tranchants créent une ouverture précise pour l'insertion de l'implant.",
    dEn: "Stylus™ unique Pilot Tip™ implant knives are designed to follow the slit blade incision easily while the cutting edges create a precise opening for lens insertion.",
    codes: [["56-3461","3.5mm, Angled, full handle, bevel up"]] },
  { key: "implant", fr: "Couteaux d'implantation Stylus™", en: "Stylus™ implant knives",
    dFr: "Couteaux d'implantation standard Stylus™, conçus pour créer une incision précise pour l'insertion de l'implant.",
    dEn: "Stylus™ standard implant knives are designed to create a precise incision for lens insertion.",
    codes: [["56-4001","4.0mm, Straight, full handle"],["56-5201","5.2mm, Straight, full handle"]] },
  { key: "slit", fr: "Couteaux à fente (slit) Stylus™", en: "Stylus™ slit knives",
    dFr: "Couteaux à fente de précision Stylus™ : ils pénètrent facilement tout en réalisant une incision de largeur exacte, pour un ajustement optimal à l'embout de phacoémulsification.",
    dEn: "Stylus™ precision slit knives penetrate easily while making an accurate width incision for optimal fit to the phacoemulsification tip.",
    codes: [["52-2801","2.85mm, Straight, full handle"],["52-2901","3.0mm, Straight, full handle"]] },
  { key: "slit-bevel-up", fr: "Couteaux à fente biseau vers le haut Stylus™", en: "Stylus™ slit knives, bevel-up",
    dFr: "Couteaux à fente Stylus™ coudés, biseau vers le haut : ils pénètrent facilement tout en réalisant une incision de largeur exacte, pour un ajustement optimal à l'embout de phacoémulsification.",
    dEn: "Stylus™ angled, bevel up knives penetrate easily while creating an accurate width incision for optimal fit to the phacoemulsification tip.",
    codes: [["52-1861","1.8mm, Angled, full handle, bevel up"],["52-2261","2.2mm, Angled, full handle, bevel up"],["52-2461","2.4mm, Angled, full handle, bevel up"],["52-2561","2.5mm, Angled, full handle, bevel up"],["52-2661","2.65mm, Angled, full handle, bevel up"],["52-2761","2.75mm, Angled, full handle, bevel up"],["52-2861","2.85mm, Angled, full handle, bevel up"],["52-2961","3.0mm, Angled, full handle, bevel up"],["52-3261","3.2mm, Angled, full handle, bevel up"],["52-4561","4.5mm, Angled, full handle, bevel up"],["52-2562","2.5mm, Angled, blade and tip, bevel up"],["52-2662","2.65mm, Angled, blade and tip, bevel up"],["52-2862","2.85mm, Angled, blade and tip, bevel up"],["52-3262","3.2mm, Angled, blade and tip, bevel up"]] },
  { key: "slit-double-bevel", fr: "Couteaux à fente double biseau Stylus™", en: "Stylus™ slit knives, double bevel",
    dFr: "Couteaux à fente Stylus™ double biseau : pénétration droite et douce, sans traction sur les tissus.",
    dEn: "Stylus™ double bevel slit knives allow straight, smooth penetration without tissue drag.",
    codes: [["52-1831","1.8mm, Angled, full handle, double bevel"],["52-2231","2.2mm, Angled, full handle, double bevel"],["52-2431","2.4mm, Angled, full handle, double bevel"],["52-2531","2.5mm, Angled, full handle, double bevel"],["52-2631","2.65mm, Angled, full handle, double bevel"],["52-2831","2.8mm, Angled, full handle, double bevel"],["52-2632","2.65mm, Angled, blade and tip, double bevel"],["52-2832","2.8mm, Angled, blade and tip, double bevel"]] },
  { key: "slit-parallel", fr: "Couteaux à fente à côtés parallèles Stylus™", en: "Stylus™ slit knives, parallel sides",
    dFr: "Couteaux à fente Stylus™ à côtés parallèles, conçus pour maintenir les tissus à la largeur voulue à l'entrée et à la sortie de l'incision.",
    dEn: "Stylus™ slit knives with parallel sides are designed to hold tissue at the desired width while entering and exiting the wound.",
    codes: [["52-2911","3.0mm, Straight, full handle"],["52-3212","3.2mm, Angled, full handle, bevel up"],["52-2913","3.0mm, Angled, blade and tip, bevel up"]] },
  { key: "sharptome", fr: "Couteaux croissant Sharptome™ Stylus™", en: "Stylus™ Sharptome™ crescent design knives",
    dFr: "Couteaux croissant Stylus™ Sharptome™ au tranchant constant, qui élimine presque toute traction sur les tissus. Idéals pour créer un tunnel scléral régulier favorisant une incision autoétanche.",
    dEn: "Stylus™ Sharptome™ crescent knives provide consistent sharpness, which nearly eliminates tissue drag. Ideal knives for creating a smooth scleral shelf to promote a self-sealing wound.",
    codes: [["54-5000","2.0mm, Straight, blade and tip"],["54-1010","2.0mm, Angled, full handle, bevel up"],["54-1020","2.0mm, Angled, full handle, bevel down"],["54-1031","2.0mm, Angled, full handle, double bevel"],["54-6910","1.25mm, Mini-Crescent, angled, full handle"]] },
  { key: "spoon", fr: "Couteaux cuillère Stylus™", en: "Stylus™ spoon knives",
    dFr: "Couteaux cuillère Stylus™ : surface de coupe unique sur 320° et lame ultrafine pour une coupe précise lorsque des techniques multidirectionnelles sont utilisées.",
    dEn: "Stylus™ unique 320° cutting surface and ultra-thin blade enhance precision cutting capabilities where multi-directional techniques are used.",
    codes: [["54-2261","2.2mm, Angled, full handle, double bevel, 320° cutting edge"],["54-3061","3.0mm, Angled, full handle, double bevel, 320° cutting edge"]] },
  { key: "vitrectomy", fr: "Couteaux de vitrectomie Stylus™", en: "Stylus™ vitrectomy knives",
    dFr: "Couteaux de vitrectomie Stylus™ : petites incisions d'accès précises qui aident à prévenir les fuites autour des sondes et des autres instruments du segment postérieur.",
    dEn: "Stylus™ vitrectomy knives create small, precise access incisions which help prevent leakage around probes and other posterior segment instruments.",
    codes: [["51-1901","19g, Full handle"],["51-2001","20g, Full handle"],["51-2061","20g, Angled, full handle"]] },
  { key: "specialty", fr: "Couteaux spéciaux Stylus™ (paracentèse, micro-lame)", en: "Stylus™ specialty knives (paracentesis, micro-blade)",
    dFr: "Couteaux spéciaux Stylus™, disponibles en différentes formes et tailles pour répondre aux besoins de techniques et d'interventions particulières.",
    dEn: "Stylus™ specialty knives are available in a variety of shapes and sizes to meet the unique needs of various techniques and procedures.",
    codes: [["52-1001","1.0mm, Paracentesis knife, straight, full handle"],["58-6900","Micro-blade, straight, blade and tip"]] },
  { key: "handles", fr: "Manche pour lames « blade and tip » Stylus™", en: "Stylus™ blade and tip handle",
    dFr: "Manche Stylus™ pour lames à embout fileté (blade and tip). Le filetage intérieur est standardisé et accepte aussi les mandrins et les lames à embout fileté d'autres fabricants.",
    dEn: "Stylus™ blade and tip handles fit the threaded tips of Stylus blades. The inner threads are standardized to also fit the collets and blades with threaded tips from other manufacturers.",
    codes: [["52-9003","16.5cm Length"]] },
  { key: "guarded", fr: "Couteaux protégés Stylus™ (gaine coulissante)", en: "Stylus™ guarded knives",
    dFr: "Couteaux Stylus™ protégés : la lame Stylus™ avec la sécurité d'une gaine protectrice coulissante. Disponibles dans de nombreux styles de lame : paracentèse, fente, cornée claire et croissant.",
    dEn: "Stylus™ guarded knife features the Stylus™ blade with the security of a sliding protective sheath. Available in a wide variety of blade styles including paracentesis, slit, clear corneal and crescent designs.",
    codes: [["52-1501G","15° Stab, Straight, guarded","15°, ponction (stab), droit, protégé"],["52-2763G","2.75mm, Clear Corneal, angled, double-bevel, guarded","2,75 mm, cornée claire, coudé, double biseau, protégé"],["52-2863G","2.85mm, Clear Corneal, angled, double-bevel, guarded","2,85 mm, cornée claire, coudé, double biseau, protégé"],["52-2231G","2.2mm, Slit angled, double-bevel, guarded","2,2 mm, fente, coudé, double biseau, protégé"],["52-2431G","2.4mm, Slit angled, double-bevel, guarded","2,4 mm, fente, coudé, double biseau, protégé"],["52-2561G","2.5mm, Slit angled, bevel-up, guarded","2,5 mm, fente, coudé, biseau vers le haut, protégé"],["52-2661G","2.65mm, Slit angled, bevel-up, guarded","2,65 mm, fente, coudé, biseau vers le haut, protégé"],["52-2761G","2.75mm, Slit angled, bevel-up, guarded","2,75 mm, fente, coudé, biseau vers le haut, protégé"],["52-2861G","2.85mm, Slit angled, bevel-up, guarded","2,85 mm, fente, coudé, biseau vers le haut, protégé"],["52-2961G","3.0mm, Slit angled, bevel-up, guarded","3,0 mm, fente, coudé, biseau vers le haut, protégé"],["54-1010G","2.0mm, Crescent, angled, bevel-up, guarded","2,0 mm, croissant, coudé, biseau vers le haut, protégé"],["58-2010G","1.1mm ClearPort™ paracentesis, angled, guarded","1,1 mm, paracentèse ClearPort™, coudé, protégé"]] },
];
const enLine = (s) => s.replace(/(\d)mm/g, "$1 mm").replace(/(\d)cm/g, "$1 cm").replace(/(\d)µm/g, "$1 µm").replace(/(\d)g, /g, "$1 G, ");
const KNIFE_PRODUCTS = KNIVES.map((k, i) => {
  const frl = k.codes.map(([c, en, f]) => [c, f || fr(en)]);
  const enl = k.codes.map(([c, en]) => [c, enLine(en)]);
  const n = k.codes.length;
  return {
    id: pid(11 + i), slug: `app82-corza-stylus-${k.key}`, ref: k.codes.map((c) => c[0]).join(", "),
    cat: "couteaux", sort: i + 1, img: `stylus-${k.key}`, pdf: pdf("corza-stylus-couteaux-catalogue"),
    constructeur: "CORZA (Stylus)", partner: P.CORZA,
    fr: { nom: k.fr,
      description: `${k.dFr} Couteaux ophtalmiques Stylus™ (Surgical Specialties, aujourd'hui Corza), qui remplacent la gamme Uniquetech. ${n > 1 ? `${n} références` : "Référence"} : ${frl.map(([c, d]) => `${c} (${d})`).join(" ; ")}.`,
      fiche_technique: L(`Références Stylus™ (${n}) :`, ...frl.map(([c, d]) => `${c} — ${d}`)) },
    en: { nom: k.en,
      description: `${k.dEn} Stylus™ ophthalmic knives (Surgical Specialties, now Corza), replacing the Uniquetech range. ${n > 1 ? `${n} references` : "Reference"}: ${enl.map(([c, d]) => `${c} (${d})`).join("; ")}.`,
      fiche_technique: L(`Stylus™ references (${n}):`, ...enl.map(([c, d]) => `${c} — ${d}`)) },
  };
});

const PRODUCTS = [...DEVICES, ...KNIFE_PRODUCTS];

// ---------------------------------------------------------------- partners
const CORZA_NAME = "CORZA (Surgical Specialties)";
const PARTNERS = [
  { id: P.CORZA, data: { name: CORZA_NAME, status: "active", default_pdf_url: pdf("corza-stylus-couteaux-catalogue") },
    tr: { fr: { name: CORZA_NAME, description: "Surgical Specialties Corporation fait partie de Corza Medical. Fabricant des couteaux ophtalmiques Stylus™ (ponction, cornée claire, fente, implantation, croissant, vitrectomie, couteaux protégés), qui remplacent la gamme Uniquetech." },
          en: { name: CORZA_NAME, description: "Surgical Specialties Corporation is part of Corza Medical. Manufacturer of Stylus™ ophthalmic knives (stab, clear corneal, slit, implant, crescent, vitrectomy, guarded knives), replacing the Uniquetech range." } } },
  { id: P.UNIQUETECH, data: { status: "inactive" } },
];
const ARCHIVE = [UNIQUETECH_KNIVES];

// ---------------------------------------------------------------- snapshot
const TOUCHED = [NT1, MP3, UNIQUETECH_KNIVES];
async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const out = { taken_at: new Date().toISOString(), products: {}, partners: {} };
  const products = await prisma.products.findMany({ where: { id: { in: [...TOUCHED, ...PRODUCTS.map((p) => p.id)] } }, include: { product_translations: true, product_media: true } });
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  const partners = await prisma.partners.findMany({ where: { id: { in: PARTNERS.map((p) => p.id) } }, include: { partner_translations: true } });
  for (const p of partners) { const { partner_translations, ...row } = p; out.partners[p.id] = { row, translations: partner_translations }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${products.length} products, ${partners.length} partners -> ${BEFORE_FILE}`);
}

// ---------------------------------------------------------------- apply
const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);
const TXT = ["nom", "description", "fiche_technique"];

async function apply() {
  const cats = await prisma.categories.findMany({ where: { slug: { in: [...new Set(PRODUCTS.map((p) => p.cat))] } } });
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  for (const p of PRODUCTS) {
    if (!catId[p.cat]) throw new Error(`category ${p.cat} not found`);
    for (const f of [pimg(p.img), p.pdf]) if (!exists(f)) console.log(`  [MISSING FILE] ${f}`);
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = { id: `${p.id}-m82`, type: "image", url: pimg(p.img), alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true };
    if (!row) {
      console.log(`  + product ${p.slug} [${p.ref.length > 40 ? p.ref.slice(0, 40) + "…" : p.ref}] -> ${p.cat} « ${p.fr.nom} »`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: catId[p.cat], constructeur: p.constructeur, partner_id: p.partner,
        status: "active", sort_order: p.sort, pdf_brochure_url: p.pdf, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    for (const [k, v] of [["category_id", catId[p.cat]], ["status", "active"], ["sort_order", p.sort], ["pdf_brochure_url", p.pdf],
      ["reference_fournisseur", p.ref], ["constructeur", p.constructeur], ["partner_id", p.partner], ["slug", p.slug]]) if (row[k] !== v) data[k] = v;
    const tr = ["fr", "en"].filter((lang) => { const t = row.product_translations.find((x) => x.language_code === lang); return !t || TXT.some((k) => !same(t[k], p[lang][k])); });
    const mediaOk = row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary;
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

  for (const r of RENAMES) {
    const row = await prisma.products.findUnique({ where: { id: r.id }, include: { product_translations: true } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${r.id}`); continue; }
    for (const lang of ["fr", "en"]) {
      const t = row.product_translations.find((x) => x.language_code === lang);
      const diff = Object.keys(r[lang]).filter((k) => !same(t?.[k], r[lang][k]));
      if (!diff.length) { console.log(`  [SKIP] rename ${row.slug} ${lang}`); continue; }
      console.log(`  rename ${row.slug} ${lang}: « ${t?.nom} » -> « ${r[lang].nom} » (${diff.join(", ")})`);
      if (WRITE) await prisma.product_translations.upsert({ where: { product_id_language_code: { product_id: r.id, language_code: lang } },
        update: r[lang], create: { id: crypto.randomUUID(), product_id: r.id, language_code: lang, ...r[lang] } });
    }
  }

  for (const id of ARCHIVE) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row) { console.log(`  [MISSING PRODUCT] ${id}`); continue; }
    if (row.status === "archived") { console.log(`  [SKIP] archive ${row.slug}`); continue; }
    console.log(`  archive ${row.slug} [${row.reference_fournisseur}]`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }

  for (const pt of PARTNERS) {
    const row = await prisma.partners.findUnique({ where: { id: pt.id }, include: { partner_translations: true } });
    if (!row) { console.log(`  [MISSING PARTNER] ${pt.id}`); continue; }
    if (pt.id === P.UNIQUETECH) {
      const others = await prisma.products.count({ where: { partner_id: pt.id, status: "active", id: { notIn: ARCHIVE } } });
      if (others) { console.log(`  [KEEP] partner ${row.slug} has ${others} other active products`); continue; }
    }
    const data = Object.fromEntries(Object.entries(pt.data).filter(([k, v]) => row[k] !== v));
    const tr = Object.keys(pt.tr || {}).filter((lang) => { const t = row.partner_translations.find((x) => x.language_code === lang); return !t || Object.keys(pt.tr[lang]).some((k) => !same(t[k], pt.tr[lang][k])); });
    if (!Object.keys(data).length && !tr.length) { console.log(`  [SKIP] partner ${row.slug}`); continue; }
    console.log(`  partner ${row.slug} ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.partners.update({ where: { id: pt.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.partner_translations.upsert({ where: { partner_id_language_code: { partner_id: pt.id, language_code: lang } },
        update: pt.tr[lang], create: { id: crypto.randomUUID(), partner_id: pt.id, language_code: lang, ...pt.tr[lang] } });
    });
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
  const n = await prisma.products.deleteMany({ where: { id: { in: PRODUCTS.map((p) => p.id).filter((id) => !BEFORE.products[id]) } } });
  console.log(`  - deleted ${n.count} new products`);
  for (const [id, b] of Object.entries(BEFORE.partners)) {
    const { id: _id, created_at, ...row } = b.row;
    console.log(`  partner ${b.row.slug} -> ${b.row.status}`);
    await prisma.$transaction(async (tx) => {
      await tx.partners.update({ where: { id }, data: { ...row, updated_at: now() } });
      for (const t of b.translations) {
        const { id: tid, partner_id, language_code, ...fields } = t;
        await tx.partner_translations.upsert({ where: { partner_id_language_code: { partner_id: id, language_code } }, update: fields, create: t });
      }
    });
  }
}

(SNAPSHOT ? snapshot() : REVERT ? revert() : apply())
  .then(async () => { console.log(SNAPSHOT ? "=== SNAPSHOT ===" : WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
