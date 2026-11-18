const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: « the products you added are in English, not French ».
 * Audit of every ACTIVE product (1333) and category (product_translations /
 * category_translations, language fr). The FR descriptions and technical sheets were
 * French almost everywhere; what was left in English (or calqued word for word from
 * English) is fixed here, FR only. EN fields are kept, except the PSL Classic EN sheet
 * that was in Spanish.
 *   A) FR titles (product_translations.nom): English words or English word order
 *      (ACUVUE « for ASTIGMATISM », NITROCARE « Quatre Moteurs Lit de Soins Intensifs »,
 *      « Patient Chaise de Transport Height Adjustable », Ray-Vision « Verre D'essai
 *      Ensemble », « Opération Microscope », « Lampe a Fente », PRIM « Bande Ceinture »,
 *      NIDEK « Meuleuse Intelligente » for a blocker, titles identical to EN such as
 *      « Eyesi Surgical Simulator », « Kitaro Kit », « Symphony Q Series »...).
 *      Brand names, model codes and trademarks are kept (ACUVUE®, OASYS, MOIST,
 *      HYDRACLEAR®, EYELID STABILISED DESIGN, Stylus™, Full Compact, Serra, Sante...).
 *   B) FR descriptions / technical sheets: KEELER KSL, PSL Classic, Cryomatic MK II
 *      (technical sheets were scraped English / Spanish fragments), ACUVUE toric
 *      descriptions, NIDEK refractors (« Intelligent Refractor », « phoropter »),
 *      Ray-Vision TB-V300, NIDEK OT-6400, CORZA Stylus (« blade and tip »).
 *   C) FR category descriptions written without accents (active categories).
 * Slugs, references, categories, images are not touched.
 *
 * REVERT POINT: 108-before.json (written by the first --apply, never overwritten)
 * holds the previous value of every field changed. --revert writes it back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 108-traductions-fr.js <app>:/tmp/108.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/108.js           # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/108.js --apply
 *   docker cp <app>:/tmp/108-before.json scripts/catalog-restructure/108-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/108.js --revert  # needs /tmp/108-before.json
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE_FILE = path.join(__dirname, "108-before.json");

// ---------------------------------------------------------------- A) FR titles
// product id: [current FR title, new FR title]
const TITLES = {
  "f95430b0-1881-435d-96c0-44b85c822695": ["Eyesi Surgical Simulator", "Simulateur de chirurgie ophtalmique Eyesi Surgical"],
  "6b60008e-c95e-4111-9164-a5e1c5ff2c24": ["Kitaro Kit", "Kit d'entraînement Kitaro"],
  "94c24822-9375-45e9-87e8-600905e56eca": ["Scansys TA-517", "Analyseur du segment antérieur Scansys TA-517"],
  "08db48bc-1358-4287-9bcf-1a9554fa5a45": ["Ocuflex 2 - Monofocal Asphérique Hydrophile", "Ocuflex 2 - Implant monofocal asphérique hydrophile"],
  "67cc4c48-1d9d-4842-9d8c-8370417f5141": ["Acriol Pre-loaded - Monofocal Hydrophobe Precharge", "Acriol Pre-loaded - Implant monofocal hydrophobe préchargé"],
  "0edd91be-7111-4bcf-8a0f-992bb6db40b8": ["Tonoref III", "Auto-réfracto-kératomètre / tonomètre Tonoref III"],
  "bb456ebd-2fb6-457e-a635-50a2d87c9a63": ["877PA / 877PAY Implant Hydrophobe Precharge", "877PA / 877PAY Implant hydrophobe préchargé"],
  "70c7e7e7-5ea5-4cb2-81ef-4e5535a3580a": ["TS-310", "Table de réfraction TS-310"],
  "5c4d6a28-60fb-4eb3-ab7e-351cab61cd39": ["TS-610", "Table de réfraction motorisée TS-610"],
  "dd937278-52fe-4ab3-abfe-333b9e33f1ce": ["Symphony Q Series", "Lampe à fente Symphony Q Series"],
  "3afe2546-bbe9-4b4b-8885-36d52ff36537": ["BI 900 Lampe a Fente", "Lampe à fente BI 900"],
  "dcb45e18-26c4-43fd-b37e-beb867aae20a": ["Lampe à Fente", "Lampe à fente KSL"],
  "a1033956-d016-42d6-9c46-35e89ce5ff77": ["TL-L15 Verre D'essai Ensemble", "Boîte de verres d'essai TL-L15"],
  "75690617-aeca-43a2-9cec-e15bbef5be56": ["TF-K65 Monture D'essai", "Monture d'essai TF-K65"],
  "nitro-1768234615820-wyetrnn6d": ["NITRO HB 4410 Quatre Moteurs Lit de Soins Intensifs", "Lit de soins intensifs 4 moteurs NITRO HB 4410"],
  "641873cf-f8cf-4609-a830-874f589ca4ea": ["TF-E40 Monture D'essai", "Monture d'essai TF-E40"],
  "nitro-1768234615956-c27v6du3y": ["Happy Fauteuil de Dialyse", "Fauteuil de dialyse Happy"],
  "nitro-1768234615857-k8gdo8twa": ["NITRO HB 1120 Manuel Lit Patient", "Lit patient manuel NITRO HB 1120"],
  "nitro-1768234615847-4husrqyc0": ["NITRO HB 2220 Deux Moteurs Lit Patient", "Lit patient 2 moteurs NITRO HB 2220"],
  "nitro-1768234615853-sdujvm3qm": ["NITRO HB 2310 Deux Moteurs Lit Patient", "Lit patient 2 moteurs NITRO HB 2310"],
  "nitro-1768234615829-hjj4og5y6": ["NITRO HB 3110 Trois Moteurs Lit Patient", "Lit patient 3 moteurs NITRO HB 3110"],
  "nitro-1768234615980-qf6jvb4ps": ["NTHM 116 Medicine Storage Chariot", "Chariot de stockage de médicaments NTHM 116"],
  "nitro-1768234615991-mtnppiqk3": ["NTHM 118 Chariot de Pansement", "Chariot de pansement NTHM 118"],
  "nitro-1768234615967-g08h2gyj9": ["NTHM 113 Medicine Et Treatment Chariot", "Chariot de médicaments et de soins NTHM 113"],
  "nitro-1768234615963-zh49vtmtp": ["NTHM 112 Chariot Urgence", "Chariot d'urgence NTHM 112"],
  "nitro-1768234615824-bwha8ldg8": ["NITRO HB 4430 P Quatre Moteurs Pediatric Lit de Soins Intensifs", "Lit de soins intensifs pédiatrique 4 moteurs NITRO HB 4430 P"],
  "06a787a1-f9ce-4976-ba86-f2b31b213536": ["OM-V50 Opération Microscope", "Microscope opératoire OM-V50"],
  "b6eb72dc-a45a-4689-b08a-b282b4a43174": ["TL-V20 Verre D'essai Ensemble", "Boîte de verres d'essai TL-V20"],
  "d106a001-0000-4000-8000-000000000002": ["1-DAY ACUVUE® MOIST for ASTIGMATISM", "1-DAY ACUVUE® MOIST pour astigmatisme"],
  "d106a001-0000-4000-8000-000000000004": ["ACUVUE® OASYS for ASTIGMATISM", "ACUVUE® OASYS pour astigmatisme"],
  "nitro-1768234615834-6z9hhyuao": ["NITRO HB 3130 Trois Moteurs Lit Patient", "Lit patient 3 moteurs NITRO HB 3130"],
  "nitro-1768234615842-rxwq9wjd0": ["NITRO HB 3320 Trois Moteurs Lit Patient", "Lit patient 3 moteurs NITRO HB 3320"],
  "nitro-1768234615809-1b0nljmq3": ["NITRO HB 4220 Quatre Moteurs Lit de Soins Intensifs", "Lit de soins intensifs 4 moteurs NITRO HB 4220"],
  "nitro-1768234615814-61ynri9tz": ["NITRO HB 4310 Quatre Moteurs Lit de Soins Intensifs", "Lit de soins intensifs 4 moteurs NITRO HB 4310"],
  "nitro-1768234616080-lmpcq0kvt": ["JMM 03 Gynaecological Table Examen", "Table d'examen gynécologique JMM 03"],
  "nitro-1768234616026-k7619rsyl": ["JMM 01 Gynaecological Table Examen", "Table d'examen gynécologique JMM 01"],
  "nitro-1768234615941-rfibwth2b": ["NHS 900 Fauteuil de Dialyse", "Fauteuil de dialyse NHS 900"],
  "nitro-1768234615759-2tjj9f4l8": ["NITRO HB 5110 Cinq Moteurs Lateral Modele Colonne Lit de Soins Intensifs", "Lit de soins intensifs à colonne, 5 moteurs avec inclinaison latérale NITRO HB 5110"],
  "nitro-1768234615792-j418nj55x": ["NITRO HB 5130 Quatre Moteurs Balance Modele Colonne Lit de Soins Intensifs", "Lit de soins intensifs à colonne, 4 moteurs avec pesée NITRO HB 5130"],
  "nitro-1768234615799-qy0rjiwjd": ["NITRO HB 5220 Quatre Moteurs Modele Colonne Lit de Soins Intensifs", "Lit de soins intensifs à colonne, 4 moteurs NITRO HB 5220"],
  "nitro-1768234615805-xafncoiku": ["NITRO HB 5230 Quatre Moteurs Modele Colonne Lit de Soins Intensifs", "Lit de soins intensifs à colonne, 4 moteurs NITRO HB 5230"],
  "nitro-1768234615748-10kpa46dv": ["NITRO HB 6220 Lit Hopital Bariatrique", "Lit d'hôpital bariatrique NITRO HB 6220"],
  "nitro-1768234615753-7xdpp0llc": ["NITRO HB 6240 Quatre Moteurs Lit de Soins Intensifs", "Lit de soins intensifs 4 moteurs NITRO HB 6240"],
  "nitro-1768234615558-5wqf9o1c6": ["NITRO HB 7000 W Quatre Moteurs Lit de Soins a Domicile", "Lit de soins à domicile 4 moteurs NITRO HB 7000 W"],
  "nitro-1768234615565-qre9zazb5": ["NITRO HB 7240 Serra Quatre Moteurs Lit de Soins a Domicile", "Lit de soins à domicile 4 moteurs NITRO HB 7240 Serra"],
  "nitro-1768234615733-hpmofa1ho": ["NITRO HB 7250 Trois Moteurs Lit de Soins Patient", "Lit de soins patient 3 moteurs NITRO HB 7250"],
  "nitro-1768234615738-kz931hoxf": ["NITRO HB 7260 Serra Quatre Moteurs Lit de Soins a Domicile", "Lit de soins à domicile 4 moteurs NITRO HB 7260 Serra"],
  "nitro-1768234615743-ir7egark0": ["NITRO HB 7260 F Serra Quatre Moteurs Lit de Soins a Domicile", "Lit de soins à domicile 4 moteurs NITRO HB 7260 F Serra"],
  "nitro-1768234615232-o2cm2wqhh": ["NITRO HB 8000 Sante Quatre Moteurs Lit de Soins Intensifs", "Lit de soins intensifs 4 moteurs NITRO HB 8000 Sante"],
  "nitro-1768234615524-hryhlhzqe": ["NITRO HB 8000 B Quatre Moteurs Lit de Soins Intensifs Bariatrique", "Lit de soins intensifs bariatrique 4 moteurs NITRO HB 8000 B"],
  "nitro-1768234615532-i023jv6xk": ["NITRO HB 8000 T Quatre Moteurs Lit de Soins Intensifs avec Balance", "Lit de soins intensifs 4 moteurs avec pesée NITRO HB 8000 T"],
  "nitro-1768234615543-zpe2htjtt": ["NITRO HB 8130 Sante Trois Moteurs Lit Patient", "Lit patient 3 moteurs NITRO HB 8130 Sante"],
  "nitro-1768234615550-cykifae9z": ["NITRO HB 8140 ELC Quatre Moteurs Lit de Soins Intensifs Lit Bas", "Lit de soins intensifs bas 4 moteurs NITRO HB 8140 ELC"],
  "nitro-1768234615936-r058tcgsf": ["NHS 870 Dialysis Brancard", "Brancard de dialyse NHS 870"],
  "nitro-1768234615976-v9pj81akj": ["NTHM 115 Medicine Et Treatment Chariot", "Chariot de médicaments et de soins NTHM 115"],
  "nitro-1768234616101-7tij06h9k": ["OLHD 1007 Compact Table de Chevet", "Table de chevet compacte OLHD 1007"],
  "nitro-1768234616108-mk0xz4ac3": ["OLHD 1009 Table de Chevet", "Table de chevet OLHD 1009"],
  "nitro-1768234616113-pfx33huor": ["OLHD 1011 Full Compact Table de Chevet", "Table de chevet Full Compact OLHD 1011"],
  "nitro-1768234616105-a91ht2k4j": ["OLHD 1008 Full Compact Table de Chevet", "Table de chevet Full Compact OLHD 1008"],
  "nitro-1768234615931-7v1cpf0qt": ["NTS X12 Bariatric Chaise de Transport", "Fauteuil de transport bariatrique NTS X12"],
  "nitro-1768234615913-b7h5nruvy": ["NTS X7 Fauteuil Donneur de Sang", "Fauteuil de donneur de sang NTS X7"],
  "nitro-1768234615927-yhgpkxbz6": ["NTS X11 Deux Moteurs Fauteuil Donneur de Sang", "Fauteuil de donneur de sang 2 moteurs NTS X11"],
  "nitro-1768234615909-r6a8zl8w5": ["NTS X6 Patient Chaise de Transport", "Fauteuil de transport patient NTS X6"],
  "nitro-1768234615903-vng13tat7": ["NTS X5 Patient Chaise de Transport", "Fauteuil de transport patient NTS X5"],
  "nitro-1768234615923-5xqwsopds": ["NTS X10 Patient Chaise de Transport", "Fauteuil de transport patient NTS X10"],
  "nitro-1768234615918-mta9bwbvs": ["NTS X8 Patient Chaise de Transport Height Adjustable", "Fauteuil de transport patient réglable en hauteur NTS X8"],
  "nitro-1768234615897-4uuoxusv4": ["NTCR SIGMA C-Arm Brancard", "Brancard compatible arceau (C-Arm) NTCR SIGMA"],
  "nitro-1768234615893-h0etcgbtv": ["NTCR SD 15 Hydraulique Brancard Urgence", "Brancard d'urgence hydraulique NTCR SD 15"],
  "nitro-1768234615878-fjf6lbqcn": ["NTCR SD 04 Brancard Urgence", "Brancard d'urgence NTCR SD 04"],
  "nitro-1768234615889-m8gnet1h5": ["NTCR SD 06 Patient Brancard de Transfert", "Brancard de transfert patient NTCR SD 06"],
  "522caa8c-2bf6-400d-ae35-65fa9f08cb69": ["TL-S30 Verre D'essai Ensemble", "Boîte de verres d'essai TL-S30"],
  "b9a1e926-0f95-4f68-859f-f351b62f5401": ["Réfracteur Intelligent RT-6100", "Réfracteur intelligent RT-6100"],
  "4f3d44ac-9571-417e-b68f-6706893e9c76": ["TL-R60 Verre D'essai Ensemble", "Boîte de verres d'essai TL-R60"],
  "c632cb82-b68c-439c-a615-ab0fe070cdb8": ["Meuleuse Intelligente ICE-1500", "Centreur-bloqueur intelligent ICE-1500"],
  "346ead44-916f-4005-8f99-b419ec4cb2e6": ["BM 900 Lampe a Fente", "Lampe à fente BM 900"],
  "c033cf79-22de-4260-ad89-e16efae1393a": ["Auto-Refracto-Keratometre ARK-1s / 1a / 1", "Auto-réfracto-kératomètre ARK-1s / 1a / 1"],
  "21198d6f-a2aa-4468-bfda-b6c66d2d480b": ["Réfracteur Intelligent RT-3100", "Réfracteur intelligent RT-3100"],
  "607649aa-053d-43e1-9da5-6e135b4556bf": ["S390I Lampe a Fente", "Lampe à fente S390I"],
  "6c4b7a2f-8bd7-418d-98d9-0f050156f4ab": ["Meuleuse Intelligente ICE-1", "Centreur-bloqueur intelligent ICE-1"],
  "cbfb450b-f463-4751-a9eb-e10301932291": ["BQ 900 Lampe a Fente", "Lampe à fente BQ 900"],
  "ca934681-323e-4c15-86ce-47ee54712178": ["Biometre Optique Lenstar LS 900", "Biomètre optique Lenstar LS 900"],
  "84765f90-4465-4174-b14a-fc06918b0832": ["ELARA 900 / BA 904 Lampe a Fente", "Lampe à fente ELARA 900 / BA 904"],
  "646bf4cb-d334-4975-9623-7e6a3d1788a4": ["METIS 900 Centre de Contrôle Chirurgical", "Centre de contrôle chirurgical METIS 900"],
  "prod-1768072845770-jupcx6p0x": ["Sophi A", "Système de phacoémulsification Sophi A"],
  "nitro-1768234616093-g9vxasoyr": ["BK 04 Neo Berceau Bebe", "Berceau pour bébé BK 04 Neo"],
  "nitro-1768234616089-c935o7eml": ["BK 02 Berceau Bebe", "Berceau pour bébé BK 02"],
  "nitro-1768234616018-3bo7cj3fj": ["CARET 502 Patient Table Examen", "Table d'examen patient CARET 502"],
  "nitro-1768234616120-rx0dm6zl3": ["BST 01 Compact Table de Lit", "Table de lit compacte BST 01"],
  "nitro-1768234615984-aqtmv2mmk": ["NTHM 117 Medicine Storage Chariot", "Chariot de stockage de médicaments NTHM 117"],
  "nitro-1768234615994-tmu3gzio2": ["NTHM 118 B Medicine Chariot Avec Barcode", "Chariot à médicaments avec code-barres NTHM 118 B"],
  "nitro-1768234616097-st3wr3bp1": ["OLHD 1006 Compact Table de Chevet", "Table de chevet compacte OLHD 1006"],
  "nitro-1768234615866-sagd4xikn": ["NTCR SD 01 Brancard de Traitement Patient", "Brancard de soins NTCR SD 01"],
  "nitro-1768234615873-zss2imcaf": ["NTCR SD 01 P Pediatric Transport Brancard", "Brancard de transport pédiatrique NTCR SD 01 P"],
  "nitro-1768234615884-79fnoahxh": ["NTCR SD 05 Brancard Urgence", "Brancard d'urgence NTCR SD 05"],
  "8d919400-9fcd-467a-ad72-80a145f3b973": ["TL-G40 Verre D'essai Ensemble", "Boîte de verres d'essai TL-G40"],
  "e352f02a-6200-446c-b4ba-07d631216de0": ["TL-E80 Verre D'essai Ensemble", "Boîte de verres d'essai TL-E80"],
  "668f9ff1-8bd5-46ab-9e78-2fda4390a03d": ["TF-P50 Monture D'essai", "Monture d'essai TF-P50"],
  "a7b7fee1-ff03-49eb-88d5-831998e7ef16": ["TF-K30 Monture D'essai", "Monture d'essai TF-K30"],
  "nitro-1768234615971-3p4cwlinf": ["NTHM 114 Medicine Et Treatment Chariot", "Chariot de médicaments et de soins NTHM 114"],
  "prim-1768238723181-46y25lggp": ["Bande Ceinture PRS607", "Ceinture de soutien abdominal PRS607"],
  "prim-1768238723184-1xs5hlbxu": ["Bande Ceinture PRS602BG", "Ceinture de soutien abdominal PRS602BG"],
  "prim-1768238723145-y6mpncp5a": ["Bande Ceinture PRS600", "Ceinture de soutien abdominal PRS600"],
  "prim-1768238723190-2uf6f4pm5": ["Bande Ceinture PRS604BG", "Ceinture de soutien abdominal PRS604BG"],
  "prim-1768238723148-y9v3ff17t": ["Bande Ceinture PRS601", "Ceinture de soutien abdominal PRS601"],
  "prim-1768238723150-hswbx14i6": ["Bande Ceinture PRS606", "Ceinture de soutien abdominal PRS606"],
  "prim-1768238723187-k9wd0icce": ["Bande Ceinture PRS603BG", "Ceinture de soutien abdominal PRS603BG"],
  "f5b84c2a-9ed1-420b-be63-5527aa65f6ab": ["Instruments vitreoretinal Rumex", "Instruments vitréorétiniens Rumex"],
  "cbb895e0-b314-48fc-bfd1-80f980129c7a": ["Lampe a Fente Portable PSL Classic", "Lampe à fente portable PSL Classic"],
  "ed939d0c-c518-42ca-9b5f-7f5a3922adb5": ["Console Cryochirurgicale Cryomatic MK II", "Console de cryochirurgie Cryomatic MK II"],
  "509127fd-2898-4e84-a897-b596bbd59526": ["Unite Synetic 2/3 instruments", "Unité Synetic 2/3 instruments"],
  "medi-1768239951881-ihcv9ruq2": ["1stQ AddOn - Implant Supplementaire Sulcus", "1stQ AddOn - Implant additionnel sulcus"],
  "53317b26-7693-40c9-bc5f-5ec7f55407ce": ["Enclavation Aiguille", "Aiguille d'enclavation"],};

// ---------------------------------------------------------------- B) FR texts
// whole-field rewrites: { id: { lang: { field: newValue } } }
const FIELDS = {
  // KEELER KSL slit lamp (3020-P-2139)
  "dcb45e18-26c4-43fd-b37e-beb867aae20a": { fr: {
    description: "Lampe à fente Keeler KSL (réf. 3020-P-2139). Lampe à fente à grossissement multi-étapes, éclairage LED à température de couleur de 3800 K et durée de vie supérieure à 10 000 heures. Jeu de filtres installés en permanence : densité neutre, anérythre, diffuseur, bleu cobalt, jaune et filtre anticalorique infrarouge. Construction de précision en aluminium, conçue pour un usage clinique quotidien intensif. L'optique Keeler offre une image nette et contrastée des structures du segment antérieur.",
    fiche_technique: "Référence : 3020-P-2139\nGrossissement : multi-étapes\nÉclairage : LED, température de couleur 3800 K, durée de vie supérieure à 10 000 h\nFiltres intégrés : densité neutre, anérythre, diffuseur, bleu cobalt, jaune, anticalorique infrarouge\nConstruction : aluminium de précision\nLogiciel Keeler Konnect : gestion des dossiers patients, outils de mesure et de retouche d'images ; installation par clé USB",
  } },
  // KEELER PSL Classic (3010-P-2000) -- the EN sheet was in Spanish too
  "cbb895e0-b314-48fc-bfd1-80f980129c7a": {
    fr: {
      description: "Lampe à fente portable Keeler PSL Classic (réf. 3010-P-2000). Biomicroscope portable qui associe l'optique de précision Keeler à une construction robuste, pour un usage fiable en déplacement. Largeur de fente variable et éclairage réglable pour un examen complet du segment antérieur. Sa conception compacte et ergonomique reste confortable lors des examens prolongés. Adaptée aux visites à domicile, aux tournées en service hospitalier, aux urgences et à toutes les situations où une lampe à fente sur table n'est pas disponible.",
      fiche_technique: "Référence : 3010-P-2000\nOptique : grossissements 10x et 16x\nÉclairage : réglable du maximum à zéro\nOuverture carrée de 1 mm pour l'évaluation de l'uvéite\nFente : largeur variable\nFabrication : britannique (Keeler)",
    },
    en: {
      fiche_technique: "Reference: 3010-P-2000\nOptics: 10x and 16x magnification\nIllumination: adjustable from maximum to zero\n1 mm square aperture for uveitis assessment\nSlit: variable width\nManufacturing: British (Keeler)",
    },
  },
  // KEELER Cryomatic MK II (2509-P-1010)
  "ed939d0c-c518-42ca-9b5f-7f5a3922adb5": { fr: {
    description: "Console de cryochirurgie Keeler Cryomatic MK II (réf. 2509-P-1010). Système de cryochirurgie ophtalmique polyvalent, équipé d'un écran numérique rétroéclairé de 3,5 pouces et de commandes intuitives. Il détecte automatiquement le type de sonde (à usage unique ou réutilisable) et ajuste en conséquence la pression de gaz interne, sans adaptateur. Compatible CO2 et N2O, selon les préférences cliniques. Haut-parleurs intégrés : signaux sonores pour le temps de congélation et l'état de la bouteille de gaz. Opérationnel en quelques minutes. Conforme aux normes de sécurité EN 60601-1 et UL 60601-1.",
    fiche_technique: "Référence : 2509-P-1010\nÉcran : numérique rétroéclairé, 3,5 pouces\nGaz : CO2 et N2O\nSondes : détection automatique du type de sonde (usage unique ou réutilisable), sans adaptateur\nSignaux sonores : temps de congélation et état de la bouteille de gaz\nIndication : traitement du décollement de rétine en une seule étape\nFourni avec : tuyau d'échappement avec silencieux, clé de 13 mm, 2 fusibles secteur de rechange\nNormes : EN 60601-1, UL 60601-1",
  } },
};

// in-place replacements in FR text fields: { id: [[field, from, to], ...] }
const REPLACES = {
  "d106a001-0000-4000-8000-000000000002": [["description", "L'EYELID STABILISED DESIGN utilise", "La géométrie EYELID STABILISED DESIGN (stabilisation par les paupières) utilise"]],
  "d106a001-0000-4000-8000-000000000004": [["description", "L'EYELID STABILISED DESIGN s'oriente", "La géométrie EYELID STABILISED DESIGN (stabilisation par les paupières) s'oriente"]],
  "b9a1e926-0f95-4f68-859f-f351b62f5401": [["description", "est un système de phoropter automatique piloté par console avec des capacités de réfraction avancées", "est une tête de réfraction automatisée (phoroptère) pilotée par console, aux fonctions de réfraction avancées"]],
  "21198d6f-a2aa-4468-bfda-b6c66d2d480b": [["description", "Le NIDEK RT-3100 Intelligent Refractor est un système de phoropter automatisé conçu pour améliorer le flux de travail de réfraction subjective.", "Le réfracteur intelligent NIDEK RT-3100 est une tête de réfraction automatisée (phoroptère) conçue pour fluidifier la réfraction subjective."]],
  "d6427d02-d53a-48b6-b5c9-f09ffefd19d0": [["description", "un bras phoropter translatable", "un bras de réfracteur translatable"]],
  "3850e5ef-c868-4249-8812-ad6dee8b057b": [["description", "les phoropters,", "les réfracteurs (phoroptères),"]],
  "d82a0001-0000-4000-8000-000000000011": [["description", "Manche complet ou lame et embout (blade and tip),", "Manche complet ou lame et embout,"]],
  "d82a0001-0000-4000-8000-000000000026": [["description", "lames à embout fileté (blade and tip).", "lames à embout fileté."]],
};

// ---------------------------------------------------------------- C) FR category descriptions
// category slug: [current FR description, new FR description]
const CATEGORIES = {
  "mobilier-et-literie-hospitaliers": ["Mobilier medical, literie et equipements hospitaliers", "Mobilier médical, literie et équipements hospitaliers"],
  "ophtalmologie": ["Equipements et dispositifs pour le diagnostic, le traitement et la chirurgie ophtalmologique", "Équipements et dispositifs pour le diagnostic, le traitement et la chirurgie ophtalmologiques"],
  "orl-oto-rhino-laryngologie": ["Equipements pour l'oto-rhino-laryngologie", "Équipements pour l'oto-rhino-laryngologie"],
  "orthopedics": ["Equipements et dispositifs orthopediques", "Équipements et dispositifs orthopédiques"],
  "implant-et-visco": ["Implants intraoculaires et solutions viscoelastiques", "Implants intraoculaires et solutions viscoélastiques"],
  "ceintures-lombaires": ["Ceintures lombaires, bandes et ortheses lombo-sacrees", "Ceintures lombaires, bandes et orthèses lombo-sacrées"],
  "microscopie-speculaire": ["Microscopes speculaires pour l'analyse endotheliale corneenne", "Microscopes spéculaires pour l'analyse endothéliale cornéenne"],
  "table-motorisee": ["Tables de refraction motorisees", "Tables de réfraction motorisées"],
  "phaco": ["Systemes de phacoemulsification pour la chirurgie de la cataracte", "Systèmes de phacoémulsification pour la chirurgie de la cataracte"],
  "tonometres-pachymetres": ["Tonometres et pachymetres pour la mesure de la pression intraoculaire et de l'epaisseur corneenne", "Tonomètres et pachymètres pour la mesure de la pression intraoculaire et de l'épaisseur cornéenne"],
  "lampe-a-fente": ["Lampes a fente pour l'examen biomicroscopique", "Lampes à fente pour l'examen biomicroscopique"],
  "microscope-operatoire": ["Microscopes operatoires pour la chirurgie ophtalmique", "Microscopes opératoires pour la chirurgie ophtalmique"],
  "frontofocometre": ["Frontofocometre pour la mesure des verres correcteurs", "Frontofocomètres pour la mesure des verres correcteurs"],
  "table-de-consultation": ["Unites et tables de consultation ophtalmologique", "Unités et tables de consultation ophtalmologique"],
  "oph-contactology": ["Lentilles de contact et equipements de contactologie", "Lentilles de contact et équipements de contactologie"],
  "traitement-et-diagnostique-secheresse-oculaire": ["Dispositifs IPL et LLLT pour le traitement de la secheresse oculaire", "Dispositifs IPL et LLLT pour le traitement de la sécheresse oculaire"],
  "oct-et-imagerie": ["OCT, retinographes et systemes d'imagerie retinienne", "OCT, rétinographes et systèmes d'imagerie rétinienne"],
  "laser-photocoagulateurs": ["Lasers photocoagulateurs pour le traitement retinien", "Lasers photocoagulateurs pour le traitement rétinien"],
  "genouilleres-chevillieres": ["Genouilleres, chevillieres et coudieres elastiques", "Genouillères, chevillères et coudières élastiques"],
  "ecran-optotype": ["Ecrans et projecteurs d'optotypes pour tests d'acuite visuelle", "Écrans et projecteurs d'optotypes pour tests d'acuité visuelle"],
  "biometrie-contact-sans-contact-et-echographie": ["Biometres optiques et ultrasonores, echographes ophtalmiques", "Biomètres optiques et ultrasonores, échographes ophtalmiques"],
  "schirmer-fluorescein-et-bleu-vision": ["Bandelettes diagnostiques Schirmer et fluoresceine", "Bandelettes diagnostiques Schirmer et fluorescéine"],
  "topographie": ["Topographes et analyseurs du segment anterieur", "Topographes et analyseurs du segment antérieur"],
  "simulateur": ["Simulateurs de chirurgie et kits d'entrainement", "Simulateurs de chirurgie et kits d'entraînement"],
  "literie-hospitaliere": ["Lits d'hopital, lits de soins intensifs, lits bariatriques", "Lits d'hôpital, lits de soins intensifs, lits bariatriques"],
  "ortheses-cervicales": ["Colliers cervicaux et ortheses de cou", "Colliers cervicaux et orthèses cervicales"],
  "chariots": ["Chariots d'urgence, de pansement, a medicaments et instruments", "Chariots d'urgence, de pansement, à médicaments et à instruments"],
  "mobilite-et-soutien": ["Fauteuils roulants, deambulateurs, bequilles", "Fauteuils roulants, déambulateurs, béquilles"],
  "fauteuils-patients": ["Fauteuils de dialyse, chimiotherapie, prelevement et geriatrie", "Fauteuils de dialyse, chimiothérapie, prélèvement et gériatrie"],
  "coussins-anti-escarres": ["Coussins de prevention des escarres", "Coussins de prévention des escarres"],
  "equipement-pediatrique": ["Berceaux, tables chauffantes, phototherapie neonatale", "Berceaux, tables chauffantes, photothérapie néonatale"],
  "chaussures-protections": ["Chaussures post-operatoires, protecteurs plantaires et hallux valgus", "Chaussures postopératoires, protecteurs plantaires et hallux valgus"],
  "tables-medicales": ["Tables d'examen, d'operation, gynecologiques et autopsie", "Tables d'examen, d'opération, gynécologiques et d'autopsie"],
  "armoires-et-rangement": ["Armoires a instruments, pharmacie, tables de chevet et casiers", "Armoires à instruments, pharmacie, tables de chevet et casiers"],
};

// ---------------------------------------------------------------- plan
// every change = { table, rowId, field, label, from, to }
async function plan() {
  const changes = [];
  const ids = [...new Set([...Object.keys(TITLES), ...Object.keys(FIELDS), ...Object.keys(REPLACES)])];
  const trs = await prisma.product_translations.findMany({ where: { product_id: { in: ids } } });
  const tr = (pid, lang) => trs.find((t) => t.product_id === pid && t.language_code === lang);
  const missing = [];
  for (const [pid, [from, to]] of Object.entries(TITLES)) {
    const t = tr(pid, "fr");
    if (!t) { missing.push(`title ${pid}`); continue; }
    if (t.nom === to) continue; // already done
    if (t.nom !== from) { console.log(`  [SKIP changed] ${pid} nom = « ${t.nom} »`); continue; }
    changes.push({ table: "product_translations", rowId: t.id, field: "nom", label: `${pid} fr.nom`, from: t.nom, to });
  }
  for (const [pid, langs] of Object.entries(FIELDS)) {
    for (const [lang, fields] of Object.entries(langs)) {
      const t = tr(pid, lang);
      if (!t) { missing.push(`${lang} ${pid}`); continue; }
      for (const [field, to] of Object.entries(fields)) {
        if (t[field] === to) continue;
        changes.push({ table: "product_translations", rowId: t.id, field, label: `${pid} ${lang}.${field}`, from: t[field], to });
      }
    }
  }
  for (const [pid, reps] of Object.entries(REPLACES)) {
    const t = tr(pid, "fr");
    if (!t) { missing.push(`replace ${pid}`); continue; }
    for (const [field, from, to] of reps) {
      const cur = t[field] || "";
      if (cur.includes(to) && !cur.includes(from)) continue; // already done
      if (!cur.includes(from)) { console.log(`  [SKIP not found] ${pid} ${field}: « ${from} »`); continue; }
      const prev = changes.find((c) => c.rowId === t.id && c.field === field);
      if (prev) prev.to = prev.to.replace(from, to);
      else changes.push({ table: "product_translations", rowId: t.id, field, label: `${pid} fr.${field}`, from: cur, to: cur.replace(from, to) });
    }
  }
  const cats = await prisma.categories.findMany({ where: { slug: { in: Object.keys(CATEGORIES) } }, include: { category_translations: true } });
  for (const [slug, [from, to]] of Object.entries(CATEGORIES)) {
    const c = cats.find((x) => x.slug === slug);
    const t = c && c.category_translations.find((x) => x.language_code === "fr");
    if (!t) { missing.push(`category ${slug}`); continue; }
    if (t.description === to) continue;
    if (t.description !== from) { console.log(`  [SKIP changed] category ${slug} = « ${t.description} »`); continue; }
    changes.push({ table: "category_translations", rowId: t.id, field: "description", label: `category ${slug} fr.description`, from, to });
  }
  if (missing.length) console.log(`  [MISSING] ${missing.join(", ")}`);
  return changes;
}

async function write(table, rowId, field, value) {
  await prisma[table].update({ where: { id: rowId }, data: { [field]: value } });
}

async function apply() {
  const changes = await plan();
  const short = (s) => (s || "").replace(/\n/g, " / ").slice(0, 110);
  for (const c of changes) console.log(`  ${c.label}\n     - ${short(c.from)}\n     + ${short(c.to)}`);
  console.log(`\n${changes.length} field(s) to change`);
  if (!APPLY || !changes.length) return;
  let before = fs.existsSync(BEFORE_FILE) ? JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8")) : { taken_at: new Date().toISOString(), fields: [] };
  for (const c of changes) {
    if (!before.fields.find((f) => f.table === c.table && f.rowId === c.rowId && f.field === c.field)) {
      before.fields.push({ table: c.table, rowId: c.rowId, field: c.field, label: c.label, value: c.from });
    }
  }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(before, null, 1)); // snapshot first, then write
  for (const c of changes) await write(c.table, c.rowId, c.field, c.to);
  const pids = [...new Set(changes.filter((c) => c.table === "product_translations").map((c) => c.label.split(" ")[0]))];
  console.log(`applied ${changes.length} change(s) on ${pids.length} product(s); snapshot ${BEFORE_FILE} (${before.fields.length} field(s))`);
}

async function revert() {
  if (!fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} missing`);
  const before = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
  for (const f of before.fields) await write(f.table, f.rowId, f.field, f.value);
  console.log(`reverted ${before.fields.length} field(s) from ${BEFORE_FILE}`);
}

(REVERT ? revert() : apply())
  .then(async () => { console.log(REVERT ? "=== REVERTED ===" : APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)"); await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
