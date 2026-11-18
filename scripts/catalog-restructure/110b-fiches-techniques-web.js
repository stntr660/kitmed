const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-18 -- owner: every product must have a technical sheet (fiche technique); the
 * sheets will later feed a vector database / search engine, so they must be accurate,
 * structured and consistent.
 * Scope (110b): ACTIVE products whose FR fiche_technique is empty/short (< 20 chars) AND
 * which have NO brochure PDF (products.pdf_brochure_url empty). Products WITH a brochure
 * are handled by 110a -- not touched here.
 * Every value below comes from an official manufacturer source (manufacturer website,
 * official catalogue / datasheet PDF, or a Wayback Machine copy of the manufacturer site);
 * the sources are listed per product. Nothing is guessed: products with no reliable source
 * are listed in EMPTY with the reason and left untouched.
 * Format (machine-readable): one spec per line, « Libellé : valeur » (FR) /
 * « Label: value » (EN), first line Référence / Reference, units normalised.
 * Also sets products.pdf_brochure_url when an official brochure/datasheet PDF was found
 * and copied to /root/docker-volumes/kitmed-staging/public/uploads/pdfs/ (= /app/public/uploads/pdfs).
 *
 * Writes ONLY fields that are still empty (fiche_technique < 20 chars, pdf_brochure_url empty):
 * idempotent, never overwrites a sheet written meanwhile by someone else.
 * Titles, descriptions, images, categories are not touched.
 *
 * REVERT POINT: 110b-before.json (written by the first --apply, never overwritten)
 * holds the previous value of every field changed. --revert writes it back.
 * DB backup before the run: /root/kitmed-staging-before-110b-20261118.dump
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 110b-fiches-techniques-web.js <app>:/tmp/110b.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/110b.js           # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/110b.js --apply
 *   docker cp <app>:/tmp/110b-before.json scripts/catalog-restructure/110b-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/110b.js --revert  # needs /tmp/110b-before.json
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE_FILE = path.join(__dirname, "110b-before.json");
const PUBLIC = "/app/public"; // brochure urls are /uploads/... under it
const MIN = 20; // a sheet shorter than this counts as empty

// product id: { fr, en, brochure: "/uploads/pdfs/x.pdf" | null, sources: [...] }
const SHEETS = {
 "58fb64d6-6358-4887-a130-9359920e1216": {
  "brand": "foshan",
  "ref": "FS932",
  "fr": "Référence : FS932\nCatégorie : aide à la marche\nHauteur réglable : 74–97 cm\nPoids net : 0,67 kg\nConditionnement : 10 pièces par carton de 72 × 26 × 35 cm, poids brut 7,7 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS932\nCategory: walking aid\nHeight adjustment: 74–97 cm\nNet weight: 0.67 kg\nPackaging: 10 pcs per carton 72 × 26 × 35 cm, gross weight 7.7 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 53)"
  ]
 },
 "91048c47-0bfd-4ff8-b27d-d148f6d3245c": {
  "brand": "foshan",
  "ref": "FS9361L",
  "fr": "Référence : FS9361L\nCatégorie : aide à la marche\nHauteur : 120 cm\nPoids net : 0,3 kg\nConditionnement : 20 pièces par carton de 38 × 12 × 30 cm, poids brut 6,4 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9361L\nCategory: walking aid\nHeight: 120 cm\nNet weight: 0.3 kg\nPackaging: 20 pcs per carton 38 × 12 × 30 cm, gross weight 6.4 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "f6fee349-3d4e-4169-97ed-393dd1eb29ca": {
  "brand": "foshan",
  "ref": "FS923L",
  "fr": "Référence : FS923L\nCatégorie : aide à la marche\nHauteur réglable : 86–117 cm\nPoids net : 0,52 kg\nConditionnement : 20 pièces par carton de 86 × 26 × 29 cm, poids brut 11,3 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS923L\nCategory: walking aid\nHeight adjustment: 86–117 cm\nNet weight: 0.52 kg\nPackaging: 20 pcs per carton 86 × 26 × 29 cm, gross weight 11.3 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "c3d8322f-4fd5-4b2a-b135-e4226125790e": {
  "brand": "foshan",
  "ref": "FS928L",
  "fr": "Référence : FS928L\nCatégorie : aide à la marche\nHauteur réglable : 77–100 cm\nPoids net : 0,35 kg\nConditionnement : 20 pièces par carton de 79 × 29 × 18 cm, poids brut 7,9 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS928L\nCategory: walking aid\nHeight adjustment: 77–100 cm\nNet weight: 0.35 kg\nPackaging: 20 pcs per carton 79 × 29 × 18 cm, gross weight 7.9 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "8b37bd9a-4f04-4b6a-b81a-879982480850": {
  "brand": "foshan",
  "ref": "FS9280L",
  "fr": "Référence : FS9280L\nCatégorie : aide à la marche\nHauteur réglable : 75–98 cm\nPoids net : 0,33 kg\nConditionnement : 20 pièces par carton de 68 × 35 × 18 cm, poids brut 7,4 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9280L\nCategory: walking aid\nHeight adjustment: 75–98 cm\nNet weight: 0.33 kg\nPackaging: 20 pcs per carton 68 × 35 × 18 cm, gross weight 7.4 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "8871a37b-f31c-4ce5-8f31-2d2fa32049a1": {
  "brand": "foshan",
  "ref": "FS9301L",
  "fr": "Référence : FS9301L\nCatégorie : aide à la marche\nHauteur réglable : 71–94 cm\nPoids net : 0,35 kg\nConditionnement : 20 pièces par carton de 65 × 15 × 28 cm, poids brut 7,6 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9301L\nCategory: walking aid\nHeight adjustment: 71–94 cm\nNet weight: 0.35 kg\nPackaging: 20 pcs per carton 65 × 15 × 28 cm, gross weight 7.6 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "59e09ea3-df47-40d7-bd2b-92e7bcd9774d": {
  "brand": "foshan",
  "ref": "FS9251L",
  "fr": "Référence : FS9251L\nCatégorie : aide à la marche\nHauteur réglable : 115–135 cm\nPoids net : 0,81 kg\nConditionnement : 20 pièces par carton de 120 × 33 × 30 cm, poids brut 17,5 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9251L\nCategory: walking aid\nHeight adjustment: 115–135 cm\nNet weight: 0.81 kg\nPackaging: 20 pcs per carton 120 × 33 × 30 cm, gross weight 17.5 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 54)"
  ]
 },
 "de7a6873-5e47-4656-8d7b-fd5ad3b0e11c": {
  "brand": "foshan",
  "ref": "FS9207LW-2",
  "fr": "Référence : FS9207LW-2\nType : canne en aluminium à base tripode (3 embouts caoutchouc)\nHauteur réglable : 720–950 mm\nLongueur de la poignée : 130 mm\nEncombrement de la base : 90 × 90 mm\nCharge statique maximale : 100 kg\nMatériau : aluminium\nConditionnement : 20 pièces par carton de 66 × 31 × 26 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9207LW-2\nType: aluminium walking stick with tripod base (3 rubber tips)\nHeight adjustment: 720–950 mm\nHandle length: 130 mm\nBase footprint: 90 × 90 mm\nMaximum static load: 100 kg\nMaterial: aluminium\nPackaging: 20 pcs per carton 66 × 31 × 26 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-orthopedic-cane.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 52)"
  ]
 },
 "8e6c31bd-40f0-4bc0-8811-fde3d43b6f4e": {
  "brand": "foshan",
  "ref": "FS936L",
  "fr": "Référence : FS936L\nType : canne blanche pliante (canne d'aveugle)\nHauteur : 120 cm\nLongueur de la poignée : 200 mm\nDiamètre (largeur) : 22 mm\nPoids net : 0,3 kg\nMatériau : alliage d'aluminium léger, poignée et embout en plastique\nNorme de référence : ISO 11334-1\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS936L\nType: foldable white cane (blind stick)\nHeight: 120 cm\nHandle length: 200 mm\nWidth (diameter): 22 mm\nNet weight: 0.3 kg\nMaterial: lightweight aluminium alloy, plastic handle and tip\nReference standard: ISO 11334-1\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-light-bline-quad-cane-base.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "d7cdb5e2-21bc-460a-acee-142219e901d7": {
  "brand": "foshan",
  "ref": "FS924L",
  "fr": "Référence : FS924L\nType : canne quadripode en aluminium\nHauteur réglable : 65–88 cm (10 positions)\nLongueur de la poignée : 12,2 cm\nEncombrement de la base : 24 × 16,5 cm\nCharge maximale : 100 kg\nPoids net : 0,52 kg\nMatériau : tubes en aluminium anodisé (Ø 22 / 19 / 16 mm, ép. 1,2 mm), base en PP, embouts caoutchouc antidérapants\nNorme de référence : ISO 11334-4\nConditionnement : 10 pièces par carton de 72 × 30 × 34 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS924L\nType: aluminium quad cane\nHeight adjustment: 65–88 cm (10 positions)\nHandle length: 12.2 cm\nBase footprint: 24 × 16.5 cm\nMaximum load: 100 kg\nNet weight: 0.52 kg\nMaterial: anodised aluminium tubes (Ø 22 / 19 / 16 mm, 1.2 mm wall), PP base plate, non-slip rubber tips\nReference standard: ISO 11334-4\nPackaging: 10 pcs per carton 72 × 30 × 34 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-walking-cane-with-four-feet-for-elderly.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 53)"
  ]
 },
 "ef919a6d-a9ef-40f6-86ff-1f136262cff9": {
  "brand": "foshan",
  "ref": "FS937L",
  "fr": "Référence : FS937L\nType : béquille d'avant-bras (canne anglaise) en aluminium\nHauteur réglable : 95–119 cm (utilisateurs de 1,50 à 1,85 m)\nEncombrement : 20 × 10 cm\nLongueur de la poignée : 12 cm\nStabilité : intérieure > 1,5°, extérieure > 4,0°\nCharge maximale : 100 kg\nPoids net : 0,55 kg\nMatériau : tube aluminium Ø 22 mm, ép. 1,2 mm ; appui-coude en plastique technique\nNorme de référence : ISO 11334-1\nConditionnement : 20 pièces par carton de 100 × 30 × 30 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS937L\nType: aluminium elbow (forearm) crutch\nHeight adjustment: 95–119 cm (users 1.50 to 1.85 m)\nFootprint: 20 × 10 cm\nHandle length: 12 cm\nStability: inward > 1.5°, outward > 4.0°\nMaximum load: 100 kg\nNet weight: 0.55 kg\nMaterial: aluminium tube Ø 22 mm, 1.2 mm wall; engineering-plastic elbow support\nReference standard: ISO 11334-1\nPackaging: 20 pcs per carton 100 × 30 × 30 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-walking-with-one-crutch.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 51)"
  ]
 },
 "d0d6145d-65aa-40af-8fa2-dae00aed35f5": {
  "brand": "foshan",
  "ref": "FS9634L",
  "fr": "Référence : FS9634L\nType : déambulateur en aluminium combiné chaise percée\nDimensions hors tout (L × l) : 48 × 44 cm\nHauteur réglable : 82–100 cm\nFonctions : pliable, réglable en hauteur, utilisable comme chaise percée\nMatériau : aluminium\nConditionnement : 2 pièces par carton de 57 × 19 × 86 cm, poids net 5,1 kg, poids brut 6,4 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS9634L\nType: aluminium walker combined with commode chair\nOverall dimensions (L × W): 48 × 44 cm\nHeight adjustment: 82–100 cm\nFunctions: foldable, height adjustable, usable as a commode\nMaterial: aluminium\nPackaging: 2 pcs per carton 57 × 19 × 86 cm, net weight 5.1 kg, gross weight 6.4 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-hemiplegic-walker.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 46)"
  ]
 },
 "992d2f63-aa44-449d-8f5f-bfc5783bdaee": {
  "brand": "foshan",
  "ref": "FS912L",
  "fr": "Référence : FS912L\nDimensions hors tout (L × l) : 50 × 44 cm\nHauteur réglable : 77–94 cm\nConditionnement : 2 pièces par carton de 57 × 18 × 80 cm, poids net 4,8 kg, poids brut 5,8 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS912L\nOverall dimensions (L × W): 50 × 44 cm\nHeight adjustment: 77–94 cm\nPackaging: 2 pcs per carton 57 × 18 × 80 cm, net weight 4.8 kg, gross weight 5.8 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 48)"
  ]
 },
 "28c8671b-6491-4903-ab3e-2756ffcdd183": {
  "brand": "foshan",
  "ref": "FS961L",
  "fr": "Référence : FS961L\nDimensions hors tout (L × l) : 49 × 44 cm\nHauteur d'assise : 43–61 cm\nHauteur réglable : 74–92 cm\nConditionnement : 2 pièces par carton de 57 × 19 × 79 cm, poids net 6,7 kg, poids brut 7,7 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS961L\nOverall dimensions (L × W): 49 × 44 cm\nSeat height: 43–61 cm\nHeight adjustment: 74–92 cm\nPackaging: 2 pcs per carton 57 × 19 × 79 cm, net weight 6.7 kg, gross weight 7.7 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 46)"
  ]
 },
 "76d5845b-824b-4360-abe9-2ab7c15c14aa": {
  "brand": "foshan",
  "ref": "FS913L",
  "fr": "Référence : FS913L\nType : cadre de marche (déambulateur) en aluminium\nDimensions hors tout (L × l) : 47 × 46 cm\nHauteur réglable : 75–93 cm\nFonctions : pliable, réglable en hauteur, côtés articulés indépendamment (boutons-poussoirs)\nMatériau : aluminium, poignées vinyle\nConditionnement : 2 pièces par carton de 52 × 16 × 79 cm, poids net 4,8 kg, poids brut 5,7 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS913L\nType: aluminium walking frame\nOverall dimensions (L × W): 47 × 46 cm\nHeight adjustment: 75–93 cm\nFunctions: foldable, height adjustable, independently articulating sides (push buttons)\nMaterial: aluminium, vinyl hand grips\nPackaging: 2 pcs per carton 52 × 16 × 79 cm, net weight 4.8 kg, gross weight 5.7 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-indoor-walker.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 47)"
  ]
 },
 "73e8a904-70bf-4502-89e7-32f1af6ec00a": {
  "brand": "foshan",
  "ref": "FS965LH",
  "fr": "Référence : FS965LH\nType : rollator avec siège\nDimensions hors tout (L × l) : 68 × 46 cm\nHauteur d'assise : 53 cm\nHauteur réglable : 78–90 cm\nPoids net : 7,4 kg\nConditionnement : 1 pièce par carton de 62 × 24 × 84 cm, poids brut 9 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS965LH\nType: rollator with seat\nOverall dimensions (L × W): 68 × 46 cm\nSeat height: 53 cm\nHeight adjustment: 78–90 cm\nNet weight: 7.4 kg\nPackaging: 1 pc per carton 62 × 24 × 84 cm, gross weight 9 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 45)"
  ]
 },
 "d6bbfc9c-efdc-44a4-a260-cb2e5bdc5311": {
  "brand": "foshan",
  "ref": "FS899",
  "fr": "Référence : FS899\nType : chaise percée pliante\nChâssis : acier, pliable\nAssise et accoudoirs : plastique\nSeau : amovible, avec couvercle anti-éclaboussures\nMontage : sans outil\nUsage : chaise percée de chevet ou rehausseur de WC avec accoudoirs\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS899\nType: folding commode chair\nFrame: steel, foldable\nSeat and armrests: plastic\nPail: removable, with splash-guard lid\nAssembly: tool-free\nUse: bedside commode or toilet seat riser with handles\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.fsdfmed.com/product-bedside-commode.html"
  ]
 },
 "590a4739-6bf5-4526-a71b-2da3a50a572e": {
  "brand": "foshan",
  "ref": "FS609U",
  "fr": "Référence : FS609U\nType : fauteuil roulant avec chaise percée\nDimensions hors tout (L × l × H) : 105 × 64 × 87 cm\nLargeur d'assise : 44 cm\nHauteur d'assise : 50 cm\nHauteur du dossier : 37 cm\nRoues avant : Ø 20 cm, pleines\nRoues arrière : Ø 58 cm (24″), pleines\nCharge maximale : 100 kg\nPoids net : 19 kg\nChâssis : acier chromé, pliable\nÉquipements : assise percée en U, accoudoirs et repose-pieds fixes, seau amovible\nConditionnement : 92 × 29 × 89 cm, poids brut 21,3 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS609U\nType: commode wheelchair\nOverall dimensions (L × W × H): 105 × 64 × 87 cm\nSeat width: 44 cm\nSeat height: 50 cm\nBackrest height: 37 cm\nFront castors: Ø 20 cm, solid\nRear wheels: Ø 58 cm (24″), solid\nMaximum load: 100 kg\nNet weight: 19 kg\nFrame: chromed steel, foldable\nFeatures: U-shaped commode seat, fixed armrests and footrests, removable pail\nPackaging: 92 × 29 × 89 cm, gross weight 21.3 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-bariatric-commode.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 35)"
  ]
 },
 "b2697472-5af3-4469-9c84-d76c6ad7e045": {
  "brand": "foshan",
  "ref": "FS696",
  "fr": "Référence : FS696\nType : chaise percée à roulettes\nChâssis : acier chromé, pliable\nHauteur d'assise : réglable (bouton-poussoir)\nRoues : 4 roulettes de 3″\nSeau : amovible, avec couvercle anti-éclaboussures\nMontage : sans outil\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS696\nType: commode chair on castors\nFrame: chromed steel, foldable\nSeat height: adjustable (push button)\nWheels: 4 × 3″ castors\nPail: removable, with splash-guard lid\nAssembly: tool-free\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.fsdfmed.com/product-potty-chairs-for-adults.html"
  ]
 },
 "a45ddd82-5b84-4e9b-8159-3edb94b787f5": {
  "brand": "foshan",
  "ref": "FS894",
  "fr": "Référence : FS894\nType : chaise percée\nDimensions hors tout (L × l) : 48 × 45 cm\nHauteur d'assise : 44–45 cm\nHauteur : 78–88 cm\nPoids net : 6 kg\nConditionnement : 1 pièce par carton de 50 × 21 × 76 cm, poids brut 7 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS894\nType: commode chair\nOverall dimensions (L × W): 48 × 45 cm\nSeat height: 44–45 cm\nHeight: 78–88 cm\nNet weight: 6 kg\nPackaging: 1 pc per carton 50 × 21 × 76 cm, gross weight 7 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 39)"
  ]
 },
 "8bd47f52-7cf8-48ed-8c14-1c56b477c63c": {
  "brand": "foshan",
  "ref": "FS980LA-35",
  "fr": "Référence : FS980LA-35\nType : fauteuil roulant pédiatrique en aluminium\nDimensions hors tout (L × l × H) : 97 × 52,5 × 89 cm\nLargeur pliée : 29 cm\nLargeur d'assise : 35 cm\nProfondeur d'assise : 36 cm\nHauteur d'assise : 47 cm\nHauteur du dossier : 44 cm\nRoues avant : Ø 15 cm, pleines\nRoues arrière : Ø 58 cm, pneumatiques\nCharge maximale : 100 kg\nPoids net : 13 kg\nChâssis : aluminium, peinture poudre\nÉquipements : accoudoirs relevables, repose-pieds fixes, poignées de poussée rabattables\nConditionnement : 87 × 29 × 69 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS980LA-35\nType: paediatric aluminium wheelchair\nOverall dimensions (L × W × H): 97 × 52.5 × 89 cm\nFolded width: 29 cm\nSeat width: 35 cm\nSeat depth: 36 cm\nSeat height: 47 cm\nBackrest height: 44 cm\nFront castors: Ø 15 cm, solid\nRear wheels: Ø 58 cm, pneumatic\nMaximum load: 100 kg\nNet weight: 13 kg\nFrame: aluminium, powder coated\nFeatures: flip-up armrests, fixed footrests, drop-back push handles\nPackaging: 87 × 29 × 69 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-drive-lightweight-expedition-transport-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 13)"
  ]
 },
 "025c20e7-cd01-4072-b345-07ee5cee57b9": {
  "brand": "foshan",
  "ref": "FS958LBCGPY",
  "fr": "Référence : FS958LBCGPY\nType : fauteuil roulant manuel à dossier haut inclinable et assise basculante\nDimensions hors tout (L × l × H) : 1120 × 535 × 1040–1200 mm\nLargeur pliée : 310 mm\nLargeur d'assise : 380 mm\nProfondeur d'assise : 360 mm\nHauteur d'assise : 550 mm\nHauteur du dossier : 420 mm\nHauteur des accoudoirs : 170–200 mm\nÉcart entre accoudoirs : 380 mm\nInclinaison assise/sol : 0–40° (vérins à gaz 2 × 60 N)\nAngle assise/dossier : 95–160° (vérins à gaz 2 × 150 N)\nRoues avant : 8″ (200 mm), pleines\nRoues arrière : 20″ (510 mm), mag PU, avec anti-bascule\nCharge maximale : 75 kg\nPoids net : 22,5 kg\nChâssis : aluminium haute résistance, peinture poudre\nÉquipements : appui-tête réglable, cales latérales et pommeau d'abduction réglables, accoudoirs amovibles réglables en hauteur, repose-jambes amovibles et élevables, freins aluminium, ceinture de sécurité\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS958LBCGPY\nType: high-back reclining manual wheelchair with tilting seat\nOverall dimensions (L × W × H): 1120 × 535 × 1040–1200 mm\nFolded width: 310 mm\nSeat width: 380 mm\nSeat depth: 360 mm\nSeat height: 550 mm\nBackrest height: 420 mm\nArmrest height: 170–200 mm\nDistance between armrests: 380 mm\nSeat tilt to floor: 0–40° (gas springs 2 × 60 N)\nSeat-to-back angle: 95–160° (gas springs 2 × 150 N)\nFront castors: 8″ (200 mm), solid\nRear wheels: 20″ (510 mm), PU mag, with anti-tipper\nMaximum load: 75 kg\nNet weight: 22.5 kg\nFrame: high-strength aluminium, powder coated\nFeatures: adjustable headrest, adjustable lateral pads and abduction pad, detachable height-adjustable armrests, detachable elevating legrests, aluminium brakes, safety belt\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.fsdfmed.com/product-high-back-manual-wheelchair.html"
  ]
 },
 "302d97f6-f6fb-4b3e-962d-eab0d9cd3b5a": {
  "brand": "foshan",
  "ref": "FS952LCQ",
  "fr": "Référence : FS952LCQ\nType : fauteuil roulant manuel en aluminium\nDimensions hors tout (L × l × H) : 109 × 67 × 91 cm\nLargeur d'assise : 46 cm\nHauteur d'assise : 52 cm\nHauteur du dossier : 38 cm\nRoues avant : Ø 20 cm, pleines\nRoues arrière : Ø 61 cm, pneumatiques à démontage rapide\nCharge maximale : 100 kg\nPoids net : 17,3 kg\nChâssis : aluminium\nÉquipements : accoudoirs relevables réglables en hauteur, repose-jambes élevables, anti-bascule\nConditionnement : 80 × 34 × 93 cm, poids brut 20,1 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS952LCQ\nType: aluminium manual wheelchair\nOverall dimensions (L × W × H): 109 × 67 × 91 cm\nSeat width: 46 cm\nSeat height: 52 cm\nBackrest height: 38 cm\nFront castors: Ø 20 cm, solid\nRear wheels: Ø 61 cm, quick-release pneumatic\nMaximum load: 100 kg\nNet weight: 17.3 kg\nFrame: aluminium\nFeatures: flip-up height-adjustable armrests, elevating legrests, anti-tippers\nPackaging: 80 × 34 × 93 cm, gross weight 20.1 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-aluminum-lightweight-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 6)"
  ]
 },
 "9b9663c8-7760-42ad-b8a2-cebe01003ef0": {
  "brand": "foshan",
  "ref": "FS903LAJPQF9",
  "fr": "Référence : FS903LAJPQF9\nType : fauteuil roulant manuel léger en aluminium\nDimensions hors tout (L × l × H) : 102 × 69 × 92 cm\nLargeur pliée : 37 cm\nLargeur d'assise : 46 cm\nProfondeur d'assise : 40 cm\nHauteur d'assise : 47 cm\nHauteur du dossier : 44 cm\nRoues avant : Ø 15 cm (6″), pleines\nRoues arrière : Ø 56 cm (22″), PU à démontage rapide ; 2 roues de transit 8″\nCharge maximale : 100 kg\nPoids net : 14,5 kg\nChâssis : alliage d'aluminium, double croisillon\nÉquipements : accoudoirs relevables et amovibles (manchettes PU), repose-pieds amovibles réglables en hauteur, poignées rabattables, frein combiné, ceinture réglable\nConditionnement : 73 × 37 × 80 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS903LAJPQF9\nType: lightweight aluminium manual wheelchair\nOverall dimensions (L × W × H): 102 × 69 × 92 cm\nFolded width: 37 cm\nSeat width: 46 cm\nSeat depth: 40 cm\nSeat height: 47 cm\nBackrest height: 44 cm\nFront castors: Ø 15 cm (6″), solid\nRear wheels: Ø 56 cm (22″), quick-release PU; 2 × 8″ transit wheels\nMaximum load: 100 kg\nNet weight: 14.5 kg\nFrame: aluminium alloy, double cross-brace\nFeatures: flip-up detachable armrests (PU pads), detachable height-adjustable footrests, drop-back handles, united brake, adjustable seat belt\nPackaging: 73 × 37 × 80 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-lightweight-manual-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 7)"
  ]
 },
 "f651c0fe-3c7d-4467-ae0a-8782f82619d3": {
  "brand": "foshan",
  "ref": "FS958LBPYF8",
  "fr": "Référence : FS958LBPYF8\nType : fauteuil roulant pédiatrique de positionnement en aluminium\nDimensions hors tout (L × l × H) : 75 × 52 × 98–120 cm\nLargeur d'assise : 25–32 cm\nHauteur d'assise : 38–66 cm\nHauteur du dossier : 32 cm\nAngle assise/dossier : 95–180°\nAngle du repose-pieds : 90–180°\nRoues avant : Ø 15 cm (6″), caoutchouc plein\nRoues arrière : Ø 30 cm (12″), PU\nCharge maximale : 35 kg\nPoids net : 24 kg\nChâssis : aluminium soudé\nÉquipements : assise basculante, dossier inclinable, appui-tête réglable (360°), accoudoirs amovibles à écartement réglable, poignée de poussée amovible et pliable, freins à pied, harnais papillon, tablette en option\nConditionnement : 86 × 53 × 45 cm, poids brut 27 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS958LBPYF8\nType: paediatric aluminium positioning wheelchair\nOverall dimensions (L × W × H): 75 × 52 × 98–120 cm\nSeat width: 25–32 cm\nSeat height: 38–66 cm\nBackrest height: 32 cm\nSeat-to-back angle: 95–180°\nFootrest angle: 90–180°\nFront castors: Ø 15 cm (6″), solid rubber\nRear wheels: Ø 30 cm (12″), PU\nMaximum load: 35 kg\nNet weight: 24 kg\nFrame: welded aluminium\nFeatures: tilting seat, reclining back, adjustable headrest (360°), detachable armrests with adjustable spacing, removable foldable push handle, foot-operated brakes, butterfly harness, optional tray\nPackaging: 86 × 53 × 45 cm, gross weight 27 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-lightweight-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 13)"
  ]
 },
 "d0fd05bc-0925-4f41-aa4c-d187c146cf90": {
  "brand": "foshan",
  "ref": "FS908LAJPF21",
  "fr": "Référence : FS908LAJPF21\nType : fauteuil roulant manuel en aluminium\nDimensions hors tout (L × l × H) : 100 × 63 × 89 cm\nLargeur pliée : 27 cm\nLargeur d'assise : 46 cm\nProfondeur d'assise : 40 cm\nHauteur d'assise : 51 cm\nHauteur du dossier : 37 cm\nRoues avant : Ø 150 mm, PU pleines, fourches aluminium\nRoues arrière : Ø 560 mm, 36 rayons, mains courantes aluminium\nCharge maximale : 100 kg\nPoids net : 13 kg\nChâssis : tube aluminium Ø 22 mm, ép. 2 mm, pliable\nÉquipements : accoudoirs relevables, repose-pieds amovibles, poignées rabattables, frein combiné avec blocage\nConditionnement : 80 × 28 × 90 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS908LAJPF21\nType: aluminium manual wheelchair\nOverall dimensions (L × W × H): 100 × 63 × 89 cm\nFolded width: 27 cm\nSeat width: 46 cm\nSeat depth: 40 cm\nSeat height: 51 cm\nBackrest height: 37 cm\nFront castors: Ø 150 mm, solid PU, aluminium forks\nRear wheels: Ø 560 mm, 36 spokes, aluminium hand rims\nMaximum load: 100 kg\nNet weight: 13 kg\nFrame: aluminium tube Ø 22 mm, 2 mm wall, foldable\nFeatures: flip-up armrests, detachable footrests, drop-back handles, united brake with parking lock\nPackaging: 80 × 28 × 90 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-aluminum-wheelchairs.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 7)"
  ]
 },
 "64b79d69-e981-4144-99e7-d47f6db6f38d": {
  "brand": "foshan",
  "ref": "FS980LQF8",
  "fr": "Référence : FS980LQF8\nType : fauteuil roulant pédiatrique évolutif en aluminium\nDimensions hors tout (L × l × H) : max. 88 × 59,5 × 91,5 cm\nLargeur pliée : 38 cm\nLargeur d'assise : 25, 30 ou 35 cm (3 réglages)\nProfondeur d'assise : 25, 30 ou 35 cm (3 réglages)\nHauteur du dossier : 36, 38,5 ou 41 cm (3 réglages)\nHauteur d'assise (avant) : 50, 52,5 ou 55 cm\nHauteur d'assise (arrière) : 47, 49,5 ou 52 cm\nHauteur des accoudoirs (depuis l'assise) : 13, 15, 17 ou 19 cm\nDistance repose-pieds / assise : 19–34 cm (pas de 2,5 cm)\nRoues avant : Ø 10 cm (4″), pleines\nRoues arrière : Ø 52 cm (20″), pneumatiques à démontage rapide\nCharge maximale : 75 kg\nPoids net : 14,3 kg\nÉquipements : accoudoirs relevables, repose-pieds fixe à palette réglable en hauteur\nConditionnement : 76 × 39 × 90 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS980LQF8\nType: adjustable paediatric aluminium wheelchair\nOverall dimensions (L × W × H): max. 88 × 59.5 × 91.5 cm\nFolded width: 38 cm\nSeat width: 25, 30 or 35 cm (3 settings)\nSeat depth: 25, 30 or 35 cm (3 settings)\nBackrest height: 36, 38.5 or 41 cm (3 settings)\nSeat height (front): 50, 52.5 or 55 cm\nSeat height (rear): 47, 49.5 or 52 cm\nArmrest height (above seat): 13, 15, 17 or 19 cm\nFootrest-to-seat distance: 19–34 cm (2.5 cm steps)\nFront castors: Ø 10 cm (4″), solid\nRear wheels: Ø 52 cm (20″), quick-release pneumatic\nMaximum load: 75 kg\nNet weight: 14.3 kg\nFeatures: flip-up armrests, fixed footrest with height-adjustable footplate\nPackaging: 76 × 39 × 90 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-ultralight-manual-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 13)"
  ]
 },
 "e4402b49-3318-413f-b9b2-4172e8e417b8": {
  "brand": "foshan",
  "ref": "FS875",
  "fr": "Référence : FS875\nType : fauteuil roulant manuel en acier\nDimensions hors tout (L × l × H) : 105 × 65 × 86,5 cm\nLargeur d'assise : 46 cm\nHauteur d'assise : 50 cm\nHauteur du dossier : 38 cm\nRoues avant : Ø 20 cm, pleines\nRoues arrière : Ø 58 cm, pleines\nCharge maximale : 100 kg\nPoids net : 15,9 kg\nChâssis : acier, peinture poudre\nÉquipements : accoudoirs fixes, repose-pieds fixes\nConditionnement : 94 × 28 × 89 cm, poids brut 18,6 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS875\nType: steel manual wheelchair\nOverall dimensions (L × W × H): 105 × 65 × 86.5 cm\nSeat width: 46 cm\nSeat height: 50 cm\nBackrest height: 38 cm\nFront castors: Ø 20 cm, solid\nRear wheels: Ø 58 cm, solid\nMaximum load: 100 kg\nNet weight: 15.9 kg\nFrame: steel, powder coated\nFeatures: fixed armrests, fixed footrests\nPackaging: 94 × 28 × 89 cm, gross weight 18.6 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 30)"
  ]
 },
 "36cba98a-688f-4cca-aa80-98cc6a9edd71": {
  "brand": "foshan",
  "ref": "FS809B",
  "fr": "Référence : FS809B\nType : fauteuil roulant manuel standard en acier\nDimensions hors tout (L × l × H) : 1060 × 650 × 890 mm\nLargeur pliée : 240 mm\nLargeur d'assise : 460 mm\nProfondeur d'assise : 400 mm\nHauteur d'assise : 490 mm\nHauteur du dossier : 390 mm\nHauteur des accoudoirs : 280 mm\nÉcart entre accoudoirs : 455 mm\nRoues avant : 8″ (200 mm), pleines\nRoues arrière : 24″, mag pleines, mains courantes acier\nCharge maximale : 100 kg\nPoids net : 17,2 kg\nChâssis : acier chromé, pliable\nÉquipements : accoudoirs fixes (manchettes PVC), repose-pieds fixes à palettes aluminium, sellerie PVC\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS809B\nType: standard steel manual wheelchair\nOverall dimensions (L × W × H): 1060 × 650 × 890 mm\nFolded width: 240 mm\nSeat width: 460 mm\nSeat depth: 400 mm\nSeat height: 490 mm\nBackrest height: 390 mm\nArmrest height: 280 mm\nDistance between armrests: 455 mm\nFront castors: 8″ (200 mm), solid\nRear wheels: 24″, solid mag, steel hand rims\nMaximum load: 100 kg\nNet weight: 17.2 kg\nFrame: chromed steel, foldable\nFeatures: fixed armrests (PVC pads), fixed footrests with aluminium footplates, PVC upholstery\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-manual-wheelchairs.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 31)"
  ]
 },
 "5c59d58f-fc44-40fc-90b4-b6b66d1ce6e5": {
  "brand": "foshan",
  "ref": "FS951B-56",
  "fr": "Référence : FS951B-56\nType : fauteuil roulant manuel bariatrique en acier, assise large\nDimensions hors tout (L × l × H) : 110 × 73 × 93 cm\nLargeur d'assise : 56 cm (22″)\nHauteur d'assise : 54 cm\nHauteur du dossier : 41 cm\nRoues avant : Ø 200 mm (8″), pleines\nRoues arrière : Ø 620 mm (24″), mag pneumatiques, avec main courante\nCharge maximale : 125 kg\nPoids net : 21 kg\nRayon de braquage minimal : ≤ 850 mm\nLargeur de demi-tour minimale : ≤ 1500 mm\nChâssis : acier, peinture poudre\nÉquipements : accoudoirs relevables, repose-pieds amovibles réglables en hauteur, sellerie nylon Oxford\nConditionnement : 83 × 33 × 93 cm, poids brut 24,1 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS951B-56\nType: bariatric wide-seat steel manual wheelchair\nOverall dimensions (L × W × H): 110 × 73 × 93 cm\nSeat width: 56 cm (22″)\nSeat height: 54 cm\nBackrest height: 41 cm\nFront castors: Ø 200 mm (8″), solid\nRear wheels: Ø 620 mm (24″), pneumatic mag, with hand rim\nMaximum load: 125 kg\nNet weight: 21 kg\nMinimum turning radius: ≤ 850 mm\nMinimum turnaround width: ≤ 1500 mm\nFrame: steel, powder coated\nFeatures: flip-up armrests, detachable height-adjustable footrests, Oxford nylon upholstery\nPackaging: 83 × 33 × 93 cm, gross weight 24.1 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-wheelchair-steel-heavy-duty.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 27)"
  ]
 },
 "31f09883-b092-4a65-87cf-e8e4f89bb9a1": {
  "brand": "foshan",
  "ref": "FS123",
  "fr": "Référence : FS123\nType : fauteuil roulant électrique\nDimensions hors tout (L × l × H) : 109 × 63 × 97 cm\nLargeur d'assise : 46 cm\nProfondeur d'assise : 46 cm\nHauteur d'assise : 52 cm\nHauteur du dossier : 42 cm\nHauteur des accoudoirs : 23–29 cm\nÉcart entre accoudoirs : 41–44 cm\nHauteur des repose-pieds : 13–22 cm\nRoues avant : Ø 20 cm, mousse caoutchouc\nRoues arrière (motrices) : Ø 32 cm\nVoie : 49,5 cm\nMoteurs : 2 × 200 W\nBatteries : 2 × 28 Ah (plomb)\nAutonomie : 20 km\nVitesse : 1–6 km/h\nPente franchissable : 12°\nContrôleur : PG\nCharge maximale : 110 kg\nPoids net : 64,2 kg\nChâssis : acier, peinture poudre\nÉquipements : dossier inclinable, manchettes réglables, panneaux latéraux amovibles, repose-pieds amovibles, feux de sécurité, mode manuel / électrique\nConditionnement : 73 × 62 × 75 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS123\nType: power wheelchair\nOverall dimensions (L × W × H): 109 × 63 × 97 cm\nSeat width: 46 cm\nSeat depth: 46 cm\nSeat height: 52 cm\nBackrest height: 42 cm\nArmrest height: 23–29 cm\nDistance between armrests: 41–44 cm\nFootrest height: 13–22 cm\nFront castors: Ø 20 cm, rubber foam\nRear (drive) wheels: Ø 32 cm\nTrack width: 49.5 cm\nMotors: 2 × 200 W\nBatteries: 2 × 28 Ah (lead acid)\nRange: 20 km\nSpeed: 1–6 km/h\nClimbing ability: 12°\nController: PG\nMaximum load: 110 kg\nNet weight: 64.2 kg\nFrame: steel, powder coated\nFeatures: angle-adjustable backrest, adjustable armrest pads, detachable side panels, detachable footrests, safety lamps, manual / power mode\nPackaging: 73 × 62 × 75 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-electric-wheelchair.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 18)"
  ]
 },
 "b4fa6f6c-2a32-47e9-aa87-238fd505d0ef": {
  "brand": "foshan",
  "ref": "FS123GC",
  "fr": "Référence : FS123GC\nType : fauteuil roulant électrique à dossier inclinable\nDimensions hors tout (L × l × H) : 123 × 67 × 93–126 cm\nLargeur d'assise : 43 cm\nHauteur d'assise : 58 cm\nHauteur du dossier : 47 cm\nRoues avant : Ø 23 cm, mousse caoutchouc\nRoues arrière (motrices) : Ø 35 cm, mousse caoutchouc\nMoteurs : 2 × 200 W\nBatterie : 40 Ah\nAutonomie : 25 km\nVitesse : 1–8 km/h\nPente franchissable : 12°\nCharge maximale : 125 kg\nPoids net : 81 kg\nChâssis : acier, peinture poudre\nÉquipements : dossier inclinable, appui-tête réglable, accoudoirs amovibles à manchettes réglables, repose-jambes élevables, feux de sécurité\nConditionnement : 78 × 68 × 69 cm, poids brut 88 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS123GC\nType: reclining power wheelchair\nOverall dimensions (L × W × H): 123 × 67 × 93–126 cm\nSeat width: 43 cm\nSeat height: 58 cm\nBackrest height: 47 cm\nFront castors: Ø 23 cm, rubber foam\nRear (drive) wheels: Ø 35 cm, rubber foam\nMotors: 2 × 200 W\nBattery: 40 Ah\nRange: 25 km\nSpeed: 1–8 km/h\nClimbing ability: 12°\nMaximum load: 125 kg\nNet weight: 81 kg\nFrame: steel, powder coated\nFeatures: angle-adjustable backrest, adjustable headrest, detachable armrests with adjustable pads, elevating legrests, safety lamps\nPackaging: 78 × 68 × 69 cm, gross weight 88 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 18)"
  ]
 },
 "bd527f1f-1d78-47d0-b68d-a3aa951072ac": {
  "brand": "foshan",
  "ref": "FS141",
  "fr": "Référence : FS141\nType : scooter électrique de mobilité\nDimensions hors tout (L × l × H) : 123 × 58 × 129–139 cm\nLargeur d'assise : 48 cm\nHauteur d'assise : 58 cm\nHauteur du dossier : 56 cm\nRoues avant : Ø 22 cm, mousse caoutchouc\nRoues arrière : Ø 26 cm, mousse\nMoteur : 400 W\nBatterie : 33 Ah\nAutonomie : 30–40 km\nVitesse : 1–10 km/h\nPente franchissable : 12°\nCharge maximale : 100 kg\nPoids net : 78 kg\nÉquipements : siège confort pivotant, accoudoirs relevables, phare\nConditionnement : 124 × 59 × 80 cm, poids brut 90,5 kg\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS141\nType: electric mobility scooter\nOverall dimensions (L × W × H): 123 × 58 × 129–139 cm\nSeat width: 48 cm\nSeat height: 58 cm\nBackrest height: 56 cm\nFront wheels: Ø 22 cm, rubber foam\nRear wheels: Ø 26 cm, foam\nMotor: 400 W\nBattery: 33 Ah\nRange: 30–40 km\nSpeed: 1–10 km/h\nClimbing ability: 12°\nMaximum load: 100 kg\nNet weight: 78 kg\nFeatures: comfortable swivel seat, flip-up armrests, driving lamp\nPackaging: 124 × 59 × 80 cm, gross weight 90.5 kg\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 19)"
  ]
 },
 "1f9c7036-1dd7-4f92-baae-4fab8b7a4e3a": {
  "brand": "foshan",
  "ref": "FS3239WZF4",
  "fr": "Référence : FS3239WZF4\nType : lit d'hôpital électrique 5 fonctions\nDimensions hors tout : 2280 × 1080 mm\nHauteur réglable : 460–740 mm\nRelève-buste : 0–80°\nRelève-jambes : 0–40°\nTrendelenburg / Anti-Trendelenburg : 0–12°\nCharge maximale (SWL) : 175 kg\nPlan de couchage : panneaux ABS plats\nBarrières : ABS, relevables\nPanneaux tête et pied : ABS, amovibles\nRoues : freinage centralisé\nMatériau : châssis en acier doux, peinture poudre\nConditionnement : 224 × 104 × 49 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS3239WZF4\nType: 5-function electric hospital bed\nOverall dimensions: 2280 × 1080 mm\nHeight adjustment: 460–740 mm\nBackrest angle: 0–80°\nKnee break angle: 0–40°\nTrendelenburg / Reverse Trendelenburg: 0–12°\nSafe working load: 175 kg\nMattress platform: flat ABS panels\nSide rails: ABS, elevating\nHead and foot boards: ABS, detachable\nCastors: central locking\nMaterial: powder-coated mild steel frame\nPackaging: 224 × 104 × 49 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-hospital-bed.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 56)"
  ]
 },
 "a6a46dd7-2070-4466-ac45-d3afb287e3cc": {
  "brand": "foshan",
  "ref": "FS3020W",
  "fr": "Référence : FS3020W\nType : lit d'hôpital manuel 2 fonctions\nDimensions hors tout : 2120 × 960 mm\nHauteur du plan de couchage : 450 mm\nRelève-buste : 0–70°\nRelève-jambes : 0–30°\nCharge maximale (SWL) : 125 kg\nPlan de couchage : sommier grillagé métallique\nBarrières : aluminium, rabattables\nPanneaux tête et pied : ABS, amovibles\nRoues : frein à pédale\nMatériau : châssis acier, peinture poudre\nConditionnement : 209 × 102 × 28 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS3020W\nType: 2-function manual hospital bed\nOverall dimensions: 2120 × 960 mm\nPlatform height: 450 mm\nBackrest angle: 0–70°\nKnee break angle: 0–30°\nSafe working load: 125 kg\nMattress platform: metal mesh\nSide rails: aluminium, foldable\nHead and foot boards: ABS, detachable\nCastors: pedal locking\nMaterial: powder-coated steel frame\nPackaging: 209 × 102 × 28 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-adjustable-hospital-beds.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 61)"
  ]
 },
 "e7f7ac93-fc0e-4912-87f0-e4cf9ea939a0": {
  "brand": "foshan",
  "ref": "FS3230WZ",
  "fr": "Référence : FS3230WZ\nType : lit d'hôpital électrique 3 fonctions\nDimensions hors tout : 2120 × 960 mm\nHauteur réglable : 450–780 mm\nRelève-buste : 0–80°\nRelève-jambes : 0–40°\nCharge maximale (SWL) : 175 kg\nPlan de couchage : sommier grillagé métallique\nBarrières : aluminium, rabattables\nPanneaux tête et pied : ABS, amovibles\nRoues : freinage centralisé\nMatériau : châssis en acier doux, peinture poudre\nOption : table de lit\nConditionnement : 210 × 102 × 51 cm\nFabricant : Foshan Dongfang Medical Equipment Manufactory Ltd. (Chine)",
  "en": "Reference: FS3230WZ\nType: 3-function electric hospital bed\nOverall dimensions: 2120 × 960 mm\nHeight adjustment: 450–780 mm\nBackrest angle: 0–80°\nKnee break angle: 0–40°\nSafe working load: 175 kg\nMattress platform: metal mesh\nSide rails: aluminium, foldable\nHead and foot boards: ABS, detachable\nCastors: central locking\nMaterial: powder-coated mild steel frame\nOption: over-bed table\nPackaging: 210 × 102 × 51 cm\nManufacturer: Foshan Dongfang Medical Equipment Manufactory Ltd. (China)",
  "brochure": "/uploads/pdfs/foshan-dongfang-e-catalog-2023.pdf",
  "sources": [
   "https://www.fsdfmed.com/product-medical-bed.html",
   "https://img.waimaoniu.net/2088/E-catalog.pdf (e-catalogue officiel, page PDF 56)"
  ]
 },
 "a3e2d935-c5bb-4630-afb0-43b6a2874d83": {
  "brand": "heine",
  "ref": "C-011.28.388, C-010.28.388, C-261.28.388, C-144.28.388",
  "fr": "Référence : C-011.28.388, C-010.28.388, C-261.28.388, C-144.28.388\nComposition : ophtalmoscope + manche rechargeable BETA4 USB avec câble USB et alimentation enfichable ; étui rigide (C-144.28.388, C-261.28.388) ou sans étui (C-011.28.388, C-010.28.388)\nModèle d'ophtalmoscope : BETA 200 LED (C-144.28.388, C-011.28.388) ; BETA 200S LED (C-261.28.388, C-010.28.388)\nÉclairage : LED HQ 3,5 V\nLentilles : 27 lentilles, −35 D à +40 D (BETA 200 LED) ; 28 lentilles, 74 pas de 1 D, −36 D à +38 D (BETA 200S LED)\nDiaphragmes : 6 + filtre anérythre séparé (BETA 200 LED) ; 7 dont trou sténopéique + filtre anérythre séparé (BETA 200S LED)\nÉclairement : typ. 600 lx ± 150 lx à 200 mm\nTempérature de couleur : 3500 K ± 500 K\nIndice de rendu des couleurs : IRC ≥ 90\nPoids de la tête : 73 g (BETA 200 LED) ; 75 g (BETA 200S LED)\nDimensions de la tête : 98 × 48 × 28 mm (H × l × P)\nAutonomie : env. 7 h (manche rechargeable Li-ion)\nGarantie : 5 ans\nFabricant : HEINE Optotechnik (Allemagne)",
  "en": "Reference: C-011.28.388, C-010.28.388, C-261.28.388, C-144.28.388\nContents: ophthalmoscope + BETA4 USB rechargeable handle with USB cord and plug-in power supply; hard case (C-144.28.388, C-261.28.388) or without case (C-011.28.388, C-010.28.388)\nOphthalmoscope model: BETA 200 LED (C-144.28.388, C-011.28.388); BETA 200S LED (C-261.28.388, C-010.28.388)\nIllumination: LED HQ 3.5 V\nLenses: 27 lenses, −35 D to +40 D (BETA 200 LED); 28 lenses, 74 single-diopter steps, −36 D to +38 D (BETA 200S LED)\nApertures: 6 + separate red-free filter (BETA 200 LED); 7 incl. pinhole + separate red-free filter (BETA 200S LED)\nIlluminance: typ. 600 lx ± 150 lx at 200 mm\nColour temperature: 3500 K ± 500 K\nColour rendering index: CRI ≥ 90\nHead weight: 73 g (BETA 200 LED); 75 g (BETA 200S LED)\nHead dimensions: 98 × 48 × 28 mm (H × W × D)\nOperating time: approx. 7 h (Li-ion rechargeable handle)\nWarranty: 5 years\nManufacturer: HEINE Optotechnik (Germany)",
  "brochure": "/uploads/pdfs/heine-ophthalmoscopes-catalogue-2023.pdf",
  "sources": [
   "https://www.heine.com/fileadmin/en_GB/Documents/Catalogue/2023/sections/EN/HEINE-02-ophthalmoscopes-2023-EN.pdf (pp. 4–5: sets C-261/C-010/C-144/C-011)",
   "https://www.heine.com/fileadmin/data/Documents/HEINE-BETA-LED-ophthalmoscopes-product-data-sheet.pdf"
  ]
 },
 "17a11d68-2725-4c4d-acf1-6fc5abbe0d57": {
  "brand": "heine",
  "ref": "C-001.30.100, C-008.30.100, C-011.10.118, C-011.28.388, C-144.10.118, C-144.24.420, C-144.28.388, C-008.30.120, C-010.28.388, C-261.10.118, C-261.24.420, C-261.28.388",
  "fr": "Référence : C-001.30.100, C-008.30.100, C-011.10.118, C-011.28.388, C-144.10.118, C-144.24.420, C-144.28.388, C-008.30.120, C-010.28.388, C-261.10.118, C-261.24.420, C-261.28.388\nÉclairage : LED HQ 3,5 V | 2,5 V\nLentilles : 27 lentilles, −35 D à +40 D\nDiaphragmes : fente, étoile de fixation à coordonnées polaires, filtre bleu cobalt, grand spot, petit spot, demi-spot ; filtre anérythre séparé\nÉclairement : typ. 600 lx ± 150 lx à 200 mm\nTempérature de couleur : 3500 K ± 500 K\nIndice de rendu des couleurs : IRC ≥ 90\nPoids : 73 g (tête)\nDimensions : 98 × 48 × 28 mm (H × l × P)\nAlimentation : manches rechargeables HEINE 3,5 V (3,0–3,7 V CC, max. 350 mA), manches à piles HEINE 2,5 V, transformateur mural EN 200\nAutonomie : env. 7 h (manche rechargeable Li-ion)\nConditions d'utilisation : +10 à +35 °C, 30–75 % HR\nClassification : classe I (UE) ; ISO 10942 groupe B ; ISO 15004-2 groupe 2\nGarantie : 5 ans\nFabricant : HEINE Optotechnik (Allemagne)",
  "en": "Reference: C-001.30.100, C-008.30.100, C-011.10.118, C-011.28.388, C-144.10.118, C-144.24.420, C-144.28.388, C-008.30.120, C-010.28.388, C-261.10.118, C-261.24.420, C-261.28.388\nIllumination: LED HQ 3.5 V | 2.5 V\nLenses: 27 lenses, −35 D to +40 D\nApertures: slit, fixation star with polar coordinates, cobalt blue filter, large spot, small spot, hemispot; separate red-free filter\nIlluminance: typ. 600 lx ± 150 lx at 200 mm\nColour temperature: 3500 K ± 500 K\nColour rendering index: CRI ≥ 90\nWeight: 73 g (head)\nDimensions: 98 × 48 × 28 mm (H × W × D)\nPower supply: HEINE 3.5 V rechargeable handles (3.0–3.7 V DC, max. 350 mA), HEINE 2.5 V battery handles, EN 200 wall transformer\nOperating time: approx. 7 h (Li-ion rechargeable handle)\nOperating conditions: +10 to +35 °C, 30–75 % RH\nClassification: class I (EU); ISO 10942 group B; ISO 15004-2 group 2\nWarranty: 5 years\nManufacturer: HEINE Optotechnik (Germany)",
  "brochure": "/uploads/pdfs/heine-beta-200-200s-led-ophthalmoscopes-datasheet.pdf",
  "sources": [
   "https://www.heine.com/fileadmin/data/Documents/HEINE-BETA-LED-ophthalmoscopes-product-data-sheet.pdf",
   "https://www.heine.com/fileadmin/en_GB/Documents/Catalogue/2023/sections/EN/HEINE-02-ophthalmoscopes-2023-EN.pdf (pp. 5, 12)"
  ]
 },
 "custom-1776447208289-eb3bef0a": {
  "brand": "heine",
  "ref": "HEINE-BETA-200S-LED",
  "fr": "Référence : HEINE BETA 200S LED (tête seule : C-008.30.120)\nÉclairage : LED HQ 3,5 V | 2,5 V\nLentilles : 28 lentilles, 74 pas de 1 D, −36 D à +38 D\nDiaphragmes : filtre bleu cobalt, étoile de fixation à coordonnées polaires, grand spot, petit spot, trou sténopéique, fente, demi-spot ; filtre anérythre séparé\nÉclairement : typ. 600 lx ± 150 lx à 200 mm\nTempérature de couleur : 3500 K ± 500 K\nIndice de rendu des couleurs : IRC ≥ 90\nPoids : 75 g (tête)\nDimensions : 98 × 48 × 28 mm (H × l × P)\nAlimentation : manches rechargeables HEINE 3,5 V (3,0–3,7 V CC, max. 350 mA), manches à piles HEINE 2,5 V, transformateur mural EN 200\nAutonomie : env. 7 h (manche rechargeable Li-ion)\nConditions d'utilisation : +10 à +35 °C, 30–75 % HR\nClassification : classe I (UE) ; ISO 10942 groupe B ; ISO 15004-2 groupe 2\nGarantie : 5 ans\nFabricant : HEINE Optotechnik (Allemagne)",
  "en": "Reference: HEINE BETA 200S LED (head only: C-008.30.120)\nIllumination: LED HQ 3.5 V | 2.5 V\nLenses: 28 lenses, 74 single-diopter steps, −36 D to +38 D\nApertures: cobalt blue filter, fixation star with polar coordinates, large spot, small spot, pinhole, slit, hemispot; separate red-free filter\nIlluminance: typ. 600 lx ± 150 lx at 200 mm\nColour temperature: 3500 K ± 500 K\nColour rendering index: CRI ≥ 90\nWeight: 75 g (head)\nDimensions: 98 × 48 × 28 mm (H × W × D)\nPower supply: HEINE 3.5 V rechargeable handles (3.0–3.7 V DC, max. 350 mA), HEINE 2.5 V battery handles, EN 200 wall transformer\nOperating time: approx. 7 h (Li-ion rechargeable handle)\nOperating conditions: +10 to +35 °C, 30–75 % RH\nClassification: class I (EU); ISO 10942 group B; ISO 15004-2 group 2\nWarranty: 5 years\nManufacturer: HEINE Optotechnik (Germany)",
  "brochure": "/uploads/pdfs/heine-beta-200-200s-led-ophthalmoscopes-datasheet.pdf",
  "sources": [
   "https://www.heine.com/fileadmin/data/Documents/HEINE-BETA-LED-ophthalmoscopes-product-data-sheet.pdf",
   "https://www.heine.com/fileadmin/en_GB/Documents/Catalogue/2023/sections/EN/HEINE-02-ophthalmoscopes-2023-EN.pdf (p. 12)"
  ]
 },
 "ad0edaa4-cfb9-4b54-84c9-ff8d4545f29e": {
  "brand": "heine",
  "ref": "D-001.71.120, D-002.71.120, D-008.71.120, D-008.71.220, D-886.11.021, D-886.11.022",
  "fr": "Référence : D-001.71.120, D-002.71.120, D-008.71.120, D-008.71.220, D-886.11.021, D-886.11.022\nComposition : D-008.71.120 = ophtalmoscope mini 3000 LED + manche à piles mini 3000 avec piles, sans étui ; D-886.11.021 = ophtalmoscope + otoscope F.O. mini 3000 LED, 2 manches à piles avec piles, 4 spéculums réutilisables, 10 spéculums AllSpec 4 mm, étui rigide\nÉclairage : LED HQ 2,5 V\nLentilles : 18 lentilles, −20 D à +20 D\nDiaphragmes : grand spot, petit spot, demi-spot\nFiltres : étoile de fixation avec filtre gris, filtre anérythre\nChamp visuel : 11,3°\nÉclairement : typ. 470 lx à 200 mm\nTempérature de couleur : 4000 K ± 500 K\nIndice de rendu des couleurs : IRC typ. 92\nPoids : 40 g (tête)\nDimensions : 69 × 34 × 24 mm (tête)\nAlimentation : manche à piles mini 3000 (piles AA), 2,5 V, max. 450 mA\nAutonomie : typ. 10 h (manche à piles)\nFabricant : HEINE Optotechnik (Allemagne)",
  "en": "Reference: D-001.71.120, D-002.71.120, D-008.71.120, D-008.71.220, D-886.11.021, D-886.11.022\nContents: D-008.71.120 = mini 3000 LED ophthalmoscope + mini 3000 battery handle with batteries, without case; D-886.11.021 = mini 3000 LED ophthalmoscope + F.O. otoscope, 2 battery handles with batteries, 4 reusable specula, 10 AllSpec 4 mm specula, hard case\nIllumination: LED HQ 2.5 V\nLenses: 18 lenses, −20 D to +20 D\nApertures: large spot, small spot, hemispot\nFilters: fixation star with grey filter, red-free filter\nField of view: 11.3°\nIlluminance: typ. 470 lx at 200 mm\nColour temperature: 4000 K ± 500 K\nColour rendering index: CRI typ. 92\nWeight: 40 g (head)\nDimensions: 69 × 34 × 24 mm (head)\nPower supply: mini 3000 battery handle (AA batteries), 2.5 V, max. 450 mA\nOperating time: typ. 10 h (battery handle)\nManufacturer: HEINE Optotechnik (Germany)",
  "brochure": "/uploads/pdfs/heine-mini-3000-led-ophthalmoscope-datasheet.pdf",
  "sources": [
   "https://www.heine.com/fileadmin/data/Documents/HEINE-mini-3000-LED-Ophthalmoscope-product-data-sheet.pdf",
   "https://www.heine.com/fileadmin/en_GB/Documents/Catalogue/2023/sections/EN/HEINE-02-ophthalmoscopes-2023-EN.pdf (pp. 10–11)"
  ]
 },
 "9f59a846-94a2-4841-b03e-20847d57b575": {
  "brand": "heine",
  "ref": "C-283.10.330, C-283.10.335, C-284.10.330, C-284.10.335, C-008.33.530, C-008.33.535",
  "fr": "Référence : C-283.10.330, C-283.10.335, C-284.10.330, C-284.10.335, C-008.33.530, C-008.33.535\nÉclairage : LED HQ, 6 V, 1 W\nÉclairement : typ. 500 lx à 400 mm\nTempérature de couleur : typ. 4000 K ; IRC > 90\nDistance de travail : 400 mm\nChamp éclairé à 400 mm : Ø 62,5 mm (grand spot) ; Ø 33 mm (spot moyen) ; Ø 16,5 mm (petit spot)\nConvergence et parallaxe : réglage synchronisé\nFiltres : bleu cobalt, anérythre, jaune, diffuseur\nOculaires : lentilles +2 D ou 0 D\nPoids : 470 g (instrument sans source d'alimentation)\nDimensions : 142 × 96 × 54 mm\nAlimentation : rhéostat de serre-tête HC 50L ; mPack, mPack UNPLUGGED, EN 50, EN 50 UNPLUGGED ou transformateur enfichable\nAutonomie : typ. 13 h (mPack) ; typ. 7 h (mPack UNPLUGGED)\nComposition C-008.33.535 : OMEGA 500 UNPLUGGED, rhéostat HC 50L, transformateur enfichable UNPLUGGED, 1 mPack UNPLUGGED\nFabricant : HEINE Optotechnik (Allemagne)",
  "en": "Reference: C-283.10.330, C-283.10.335, C-284.10.330, C-284.10.335, C-008.33.530, C-008.33.535\nIllumination: LED HQ, 6 V, 1 W\nIlluminance: typ. 500 lx at 400 mm\nColour temperature: typ. 4000 K; CRI > 90\nWorking distance: 400 mm\nIlluminated field at 400 mm: Ø 62.5 mm (large spot); Ø 33 mm (medium spot); Ø 16.5 mm (small spot)\nConvergence and parallax: synchronized adjustment\nFilters: cobalt blue, red-free, yellow, diffuser\nEyepieces: +2 D or 0 D lenses\nWeight: 470 g (instrument without power source)\nDimensions: 142 × 96 × 54 mm\nPower supply: HC 50L headband rheostat; mPack, mPack UNPLUGGED, EN 50, EN 50 UNPLUGGED or plug-in transformer\nOperating time: typ. 13 h (mPack); typ. 7 h (mPack UNPLUGGED)\nContents of C-008.33.535: OMEGA 500 UNPLUGGED, HC 50L headband rheostat, UNPLUGGED plug-in transformer, 1 mPack UNPLUGGED\nManufacturer: HEINE Optotechnik (Germany)",
  "brochure": "/uploads/pdfs/heine-omega-500-led-datasheet.pdf",
  "sources": [
   "https://www.heine.com/fileadmin/data/Documents/HEINE-OMEGA-500-LED-Indirect-Ophthalmoscope-product-data-sheet.pdf",
   "https://www.heine.com/fileadmin/en_GB/Documents/Catalogue/2023/sections/EN/HEINE-02-ophthalmoscopes-2023-EN.pdf (pp. 21, 23)"
  ]
 },
 "5a8aba58-c1b9-4ec0-9edd-d58f32f28835": {
  "brand": "keeler",
  "ref": "24-3000/24-3000-V",
  "fr": "Référence : 24-3000 / 24-3000-V\nVariantes : 24-3000 (usage humain) ; 24-3000-V (AccuPen Vet, usage vétérinaire)\nType : tonomètre à aplanation portable, jauge de micro-contrainte, compensation de gravité\nPlage de mesure : 5–60 mmHg\nPrécision : ± 2 mmHg (par rapport au tonomètre de Goldmann)\nTransducteur : Ø 1,0 mm\nPoids : 85 g (3,0 oz)\nDimensions : 184 × 32 mm (7¼ × 1¼ in)\nAlimentation : pile lithium 3,6 V ; autonomie 4–6 mois\nMémoire : moyenne de 9 mesures enregistrées\nFonctions : correction de la PIO selon l'épaisseur cornéenne\nAccessoires fournis : étui de transport rigide, cordon\nFabricant : Keeler",
  "en": "Reference: 24-3000 / 24-3000-V\nVariants: 24-3000 (human use); 24-3000-V (AccuPen Vet, veterinary use)\nType: handheld applanation tonometer, micro-strain gauge, gravity offset technology\nMeasurement range: 5–60 mmHg\nAccuracy: ± 2 mmHg (compared to Goldmann tonometer)\nTransducer: Ø 1.0 mm\nWeight: 85 g (3.0 oz)\nDimensions: 184 × 32 mm (7¼ × 1¼ in)\nPower source: 3.6 V lithium battery; battery life 4–6 months\nMemory: stores and averages 9 measurements\nFunctions: IOP correction for corneal thickness\nSupplied accessories: heavy-duty travelling case, lanyard\nManufacturer: Keeler",
  "brochure": "/uploads/brochures/keeler-product-catalog-060220--lowres--1765375796312-028da80e.pdf",
  "sources": [
   "https://www.keelerusa.com/products/diagnostic/tonometry/handheld-contact-tonometers/accupen-handheld-tonometer.html",
   "ref/keeler-catalog-2020.pdf (catalogue Keeler USA rev. 060220, p. 22)"
  ]
 },
 "4aa63549-d0a0-41f5-9b64-605a18bd00e1": {
  "brand": "KEELER",
  "ref": "2414-P-2030 / 2414-P-2040",
  "fr": "Référence : 2414-P-2030 (type T) / 2414-P-2040 (type R)\nType : tonomètre à aplanation mécanique, sans pile\nPrincipe : méthode de Goldmann, aplanation d'une zone constante de 3,06 mm de la cornée\nPlage de mesure : 0–80 mmHg (0–10,64 kPa)\nMontage : type T – sur plaque de guidage dans l'axe optique (lampes à fente à éclairage en tour), amovible ; type R – sur tige fixée au corps optique du microscope\nTempérature d'utilisation : 10–35 °C\nForce de mesure : par poids à levier\nPrécision de mesure : ≤ 0,49 mN\nPoids net : 0,41 kg (type T) ; 0,69 kg (type R), sans accessoires\nFourni avec : prisme doubleur réutilisable, bras de calibration, plaque de guidage (type T)\nFabricant : Keeler Ltd (Royaume-Uni)",
  "en": "Reference: 2414-P-2030 (T-type) / 2414-P-2040 (R-type)\nType: mechanical applanation tonometer, non-battery powered\nPrinciple: Goldmann method, applanation of a constant 3.06 mm area of the cornea\nMeasurement range: 0–80 mmHg (0–10.64 kPa)\nMounting: T-type – on guide plate on the optical axis (tower illumination slit lamps), removable; R-type – on a post fitted to the microscope optical body\nOperating temperature: 10–35 °C\nMeasurement force: by leverage weight\nMeasurement accuracy: ≤ 0.49 mN\nNet weight: 0.41 kg (T-type); 0.69 kg (R-type), without accessories\nSupplied with: reusable doubling prism, calibration arm, guide plate (T-type)\nManufacturer: Keeler Ltd (United Kingdom)",
  "brochure": "/uploads/brochures/keeler-product-catalog-060220--lowres--1765375796312-028da80e.pdf",
  "sources": [
   "ref/keeler-catalog-2020.pdf (catalogue Keeler USA rev. 060220, pp. 20–21)",
   "https://www.keelerglobal.com/product/kat-t-takeaway-applanation-tonometer/"
  ]
 },
 "683027a2-f527-485c-86dc-44cfe93f2d70": {
  "brand": "KEELER",
  "ref": "2414-P-2032 / 2414-P-2042",
  "fr": "Référence : 2414-P-2032 (type T) / 2414-P-2042 (type R)\nType : tonomètre à aplanation numérique\nPrincipe : méthode de Goldmann, aplanation d'une zone constante de 3,06 mm de la cornée\nPlage de mesure : 0–80 mmHg (0–10,64 kPa)\nMontage : type T – sur plaque de guidage dans l'axe optique (lampes à fente à éclairage en tour), amovible ; type R – sur tige fixée au corps optique du microscope\nTempérature d'utilisation : 10–35 °C\nAffichage : LED, lecture à 1 décimale\nAlimentation : pile AA\nFourni avec : prisme réutilisable, bras de calibration, plaque de guidage (type T), pile AA\nFabricant : Keeler Ltd (Royaume-Uni)",
  "en": "Reference: 2414-P-2032 (T-type) / 2414-P-2042 (R-type)\nType: digital applanation tonometer\nPrinciple: Goldmann method, applanation of a constant 3.06 mm area of the cornea\nMeasurement range: 0–80 mmHg (0–10.64 kPa)\nMounting: T-type – on guide plate on the optical axis (tower illumination slit lamps), removable; R-type – on a post fitted to the microscope optical body\nOperating temperature: 10–35 °C\nDisplay: LED, reading to 1 decimal place\nPower supply: AA battery\nSupplied with: reusable prism, calibration arm, guide plate (T-type), AA battery\nManufacturer: Keeler Ltd (United Kingdom)",
  "brochure": "/uploads/brochures/keeler-product-catalog-060220--lowres--1765375796312-028da80e.pdf",
  "sources": [
   "ref/keeler-catalog-2020.pdf (catalogue Keeler USA rev. 060220, pp. 20–21)",
   "https://www.keelerglobal.com/product/d-kat-t-takeaway-applanation-tonometer/"
  ]
 },
 "e3e31895-9be0-47cf-a96d-4ae1e70bf183": {
  "brand": "KEELER",
  "ref": "2418-P-2000",
  "fr": "Référence : 2418-P-2000\nType : tonomètre sans contact portable, avec station d'accueil\nPlage de mesure : 5–50 mmHg\nDistance de mesure : env. 11 mm de l'œil\nNorme : BS EN ISO 8612\nCorrection selon l'épaisseur cornéenne : oui\nInterface PC : USB\nTension d'entrée : 100–240 V, 50/60 Hz\nPuissance : 4,6–7,4 VA\nUnité portable : 136 mm (l) × 220 mm (H) × 206 mm (P) ; 1,0 kg\nStation d'accueil : 155 mm (l) × 183 mm (P) × 153 mm (H)\nSécurité électrique : classe II ; IPX0 ; EN 60601-1, UL 60601-1\nConditions d'utilisation : +10 à +35 °C ; 30–90 % HR\nFabricant : Keeler Ltd (Royaume-Uni)",
  "en": "Reference: 2418-P-2000\nType: handheld non-contact tonometer, with docking station\nMeasurement range: 5–50 mmHg\nMeasurement distance: approx. 11 mm from the eye\nStandard: BS EN ISO 8612\nCorneal thickness correction: yes\nPC interface: USB\nInput voltage: 100–240 V, 50/60 Hz\nPower rating: 4.6–7.4 VA\nHand unit: 136 mm (W) × 220 mm (H) × 206 mm (D); 1.0 kg\nDocking station: 155 mm (W) × 183 mm (D) × 153 mm (H)\nElectrical safety: class II; IPX0; EN 60601-1, UL 60601-1\nOperating conditions: +10 to +35 °C; 30–90 % RH\nManufacturer: Keeler Ltd (United Kingdom)",
  "brochure": "/uploads/brochures/keeler-product-catalog-060220--lowres--1765375796312-028da80e.pdf",
  "sources": [
   "ref/keeler-catalog-2020.pdf (catalogue Keeler USA rev. 060220, p. 17)",
   "http://web.archive.org/web/20231210202707/https://www.keeler.co.uk/tonocare-wireless-non-contact-tonometer.html"
  ]
 },
 "d68162c8-76f4-4a54-b3bb-62fb894ec1d9": {
  "brand": "KEELER",
  "ref": "2417-P-2000",
  "fr": "Référence : 2417-P-2000\nType : tonomètre sans contact de table, avec mentonnière\nPlage calibrée : 5–50 mmHg\nAffichage : 1 décimale (ex. 12,3) ; écran alphanumérique 1 ligne, 16 caractères\nDistance de travail : 20 mm\nDimensions : 475 × 410 × 245 mm (H × P × l)\nPoids : 16 kg\nAlimentation : bloc à découpage 110–240 V, 50/60 Hz ; sortie 30 VA (12 V CC, 2,5 A)\nImprimante : thermique intégrée\nNormes : BS EN 60601-1:2006, EN 60601-1-2:2007, ISO 15004-1:2006, ISO 15004-2:2007\nFabricant : Keeler Ltd (Royaume-Uni)",
  "en": "Reference: 2417-P-2000\nType: desktop non-contact tonometer, with chinrest\nCalibrated range: 5–50 mmHg\nDisplay: 1 decimal place (e.g. 12.3); single-line 16-character alphanumeric display\nWorking distance: 20 mm\nDimensions: 475 × 410 × 245 mm (H × D × W)\nWeight: 16 kg\nPower supply: switch mode 110–240 V, 50/60 Hz; output 30 VA (12 V DC, 2.5 A)\nPrinter: built-in thermal line printer\nStandards: BS EN 60601-1:2006, EN 60601-1-2:2007, ISO 15004-1:2006, ISO 15004-2:2007\nManufacturer: Keeler Ltd (United Kingdom)",
  "brochure": "/uploads/brochures/keeler-product-catalog-060220--lowres--1765375796312-028da80e.pdf",
  "sources": [
   "ref/keeler-catalog-2020.pdf (catalogue Keeler USA rev. 060220, pp. 18–19)",
   "https://www.keelerglobal.com/product/pulsair-desktop/"
  ]
 },
 "67cc4c48-1d9d-4842-9d8c-8370417f5141": {
  "brand": "CARE GROUP",
  "ref": "ACRIOL-PRELOADED",
  "fr": "Référence : AS-6P (Acriol Pre-Loaded)\nType : implant intraoculaire monofocal hydrophobe préchargé, micro-incision\nMatériau : acrylique hydrophobe (clair)\nPuissances : +10,0 à +27,0 D (pas de 0,5 D)\nDiamètre optique : 6,00 mm\nLongueur totale : 13,00 mm\nType d'optique : asphérique, bord carré\nAngulation des haptiques : 0° (plan)\nConfiguration des haptiques : C-L modifiée\nIndice de réfraction : 1,53\nConstante A : 118,52 (SRK/T, biométrie ultrasonore) ; 119,0 (SRK/T, biométrie optique)\nFabrication : moulage par coulée synchronisée (Synchronised Cast Molding)\nFabricant : Care Group Sight Solution Pvt. Ltd. (Inde)",
  "en": "Reference: AS-6P (Acriol Pre-Loaded)\nType: preloaded hydrophobic monofocal intraocular lens, micro-incision\nMaterial: hydrophobic acrylic (clear)\nPowers: +10.0 to +27.0 D (0.5 D steps)\nOptic diameter: 6.00 mm\nOverall length: 13.00 mm\nOptic type: aspheric, square edge\nHaptic angulation: 0° (plano)\nHaptic configuration: modified C-L\nRefractive index: 1.53\nA-constant: 118.52 (SRK/T, ultrasound biometry); 119.0 (SRK/T, optical biometry)\nManufacturing: Synchronised Cast Molding\nManufacturer: Care Group Sight Solution Pvt. Ltd. (India)",
  "brochure": null,
  "sources": [
   "https://caregroupiol.com/product/acriol-pre-loaded/",
   "https://caregroupiol.com/wp-content/uploads/2025/01/Acriol-Preloaded.pdf"
  ]
 },
 "08db48bc-1358-4287-9bcf-1a9554fa5a45": {
  "brand": "CARE GROUP",
  "ref": "OCUFLEX-2",
  "fr": "Référence : Ocuflex (modèles ANU6, ANU6-AS, RYCF, RYCF6)\nType : implant intraoculaire monofocal pliable monobloc, biconvexe\nMatériau : acrylique hydrophile non ionique, filtre UV intégré\nPuissances : 0,0 à +40,0 D (pas de 0,5 D)\nDiamètre optique : 6,00 mm\nLongueur totale : 12,50 mm\nType d'optique : sphérique ou asphérique selon le modèle\nAngulation des haptiques : 0° (plan)\nConfiguration des haptiques : C-L modifiée ou double haptique\nIndice de réfraction : 1,465\nConstante A : 118,0 (biométrie ultrasonore)\nCompatibilité laser YAG : oui\nFabricant : Care Group Sight Solution Pvt. Ltd. (Inde)",
  "en": "Reference: Ocuflex (models ANU6, ANU6-AS, RYCF, RYCF6)\nType: foldable single-piece monofocal intraocular lens, biconvex\nMaterial: non-ionic hydrophilic acrylic, UV blocker incorporated\nPowers: 0.0 to +40.0 D (0.5 D steps)\nOptic diameter: 6.00 mm\nOverall length: 12.50 mm\nOptic type: spherical or aspheric depending on model\nHaptic angulation: 0° (plano)\nHaptic configuration: modified C-L or double haptic\nRefractive index: 1.465\nA-constant: 118.0 (ultrasound biometry)\nYAG laser compatible: yes\nManufacturer: Care Group Sight Solution Pvt. Ltd. (India)",
  "brochure": null,
  "sources": [
   "https://caregroupiol.com/product/ocuflex-2/"
  ]
 },
 "066a53f1-2aa7-4e5b-90c9-0587c616fa4d": {
  "brand": "INAMI",
  "ref": "L-2510B/HB",
  "fr": "Référence : L-2510B / L-2510HB (Synoptiscope)\nType : synoptophore pour le diagnostic et la rééducation de la vision binoculaire (strabisme)\nRéglage de l'écart pupillaire : 45–80 mm (graduation 1 mm)\nRéglage de la mentonnière : 60 mm vertical, 45 mm horizontal\nÉlévation / dépression : 30° / 30° (graduation 1°)\nConvergence / divergence : 50° / 40° (graduation 1°)\nRotation des tests : ±20° (horaire / antihoraire)\nClignotement automatique : 30–150 fois/min ; clignotement manuel par bouton-poussoir\nDiaphragme de champ : ⌀ 10–50 mm\nDispositif de Haidinger : non (L-2510B) ; oui, 50–100 tr/min (L-2510HB)\nÉclairage : 8 V 0,7 A pour les tests ; 8 V 3 A pour les houppes de Haidinger (L-2510HB)\nTension d'alimentation : 100–120 V / 220–240 V CA, 50/60 Hz\nPuissance absorbée : 64 VA\nFusible : 1,0 A 250 V\nCEM : conforme IEC 60601-1-2:2001\nDimensions : 550 × 320 × 425 mm (l × p × h)\nPoids : 17 kg (L-2510B) ; 18 kg (L-2510HB)\nAccessoires : 27 paires de tests fournies en standard\nFabricant : Inami & Co., Ltd. (Japon)",
  "en": "Reference: L-2510B / L-2510HB (Synoptiscope)\nType: synoptophore for diagnosis and training of binocular vision (strabismus)\nP.D. adjustment: 45–80 mm (1 mm graduation)\nChinrest adjustment: 60 mm vertical, 45 mm horizontal\nElevation / depression: 30° / 30° (1° graduation)\nConvergence / divergence: 50° / 40° (1° graduation)\nSlide rotation: ±20° (clockwise / counter-clockwise)\nAutomatic flashing: 30–150 times/min; manual flashing by push button\nView aperture: ⌀ 10–50 mm\nHaidinger brush device: no (L-2510B); yes, 50–100 rpm (L-2510HB)\nIllumination: 8 V 0.7 A for slides; 8 V 3 A for Haidinger brush (L-2510HB)\nPower supply: 100–120 V / 220–240 V AC, 50/60 Hz\nPower input: 64 VA\nFuse: 1.0 A 250 V\nEMC: complies with IEC 60601-1-2:2001\nDimensions: 550 × 320 × 425 mm (W × D × H)\nWeight: 17 kg (L-2510B); 18 kg (L-2510HB)\nAccessories: 27 pairs of slides supplied as standard\nManufacturer: Inami & Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/inami-l-2510b-hb.pdf",
  "sources": [
   "https://inami.co.jp/en/special/synoptiscope/",
   "https://inami.co.jp/en/.assets/Synopti-Graph.jpg",
   "https://inami.co.jp/catalog/.assets/Synoptiscope-revised.pdf"
  ]
 },
 "prod-1768073447109-1f7025qtp": {
  "brand": "isomax",
  "ref": "ISO-ISS-16X5",
  "fr": "Référence : ISOMAX Solution physiologique (ISO-ISS-16X5)\nType : solution physiologique isotonique stérile pour le nettoyage nasal, oculaire et l'aérosolthérapie\nComposition : chlorure de sodium 0,9 g, eau purifiée q.s.p. 100 ml\nConcentration : NaCl 0,9 %\nVolume / Conditionnement : unidoses de 5 ml, boîte de 20 unidoses\nStérilité : stérile, usage unique, non injectable\nConservation : au sec, à l'abri de la chaleur, en dessous de 25 °C\nDurée d'utilisation après ouverture : utilisation immédiate, jeter le reste\nPopulation : nourrissons, enfants et adultes\nCompatibilité : nébuliseurs pneumatiques et à ultrasons\nClasse : dispositif médical de classe IIa (CE 0477)\nFabricant : Euritalia Pharma, div. de Coswell S.p.A. (Italie)",
  "en": "Reference: ISOMAX Physiological solution (ISO-ISS-16X5)\nType: sterile isotonic physiological solution for nasal, ocular cleansing and aerosol therapy\nComposition: sodium chloride 0.9 g, purified water q.s. 100 ml\nConcentration: NaCl 0.9%\nVolume / Packaging: 5 ml single-dose vials, box of 20 vials\nSterility: sterile, single use, not for injection\nStorage: dry place, away from heat, below 25 °C\nIn-use period after opening: use immediately, discard any remainder\nPopulation: babies, children and adults\nCompatibility: pneumatic and ultrasonic nebulizers\nClass: class IIa medical device (CE 0477)\nManufacturer: Euritalia Pharma, div. of Coswell S.p.A. (Italy)",
  "brochure": "/uploads/pdfs/isomax-soluzione-fisiologica.pdf",
  "sources": [
   "https://www.coswell.biz/marchi/isomax",
   "https://www.coswell.biz/flex/cm/pages/ServeAttachment.php/L/IT/D/1%252F9%252F1%252FD.095569e35c99183c71a7/P/BLOB%3AID%3D327/E/pdf?mode=download"
  ]
 },
 "omni-1768245275641-mcac2r5g2": {
  "brand": "omni",
  "ref": "OMNI-BLUE",
  "fr": "Référence : OMNI Blue\nType : colorant vital pour coloration de la capsule antérieure (capsulorhexis)\nComposition : bleu trypan 0,6 ou 0,8 mg/ml, solution isotonique tamponnée\nConcentration : 0,06 % ou 0,08 % p/v\nVolume / Conditionnement : 1 ml en flacon ou seringue préremplie, dose unitaire ; boîte de 5 ou 10\nStérilité : stérile, usage unique, usage intraoculaire uniquement\nConservation : 5–30 °C, au sec, à l'abri de la lumière\nDurée d'utilisation après ouverture : usage unique, jeter le reste de la solution\nIndications : phacoémulsification, chirurgie de cataracte SICS et EEC, capsulotomie antérieure / postérieure\nFabricant : Omni Lens Pvt. Ltd. (Inde)",
  "en": "Reference: OMNI Blue\nType: vital dye for anterior capsule staining (capsulorhexis)\nComposition: trypan blue 0.6 or 0.8 mg/ml, isotonic buffered solution\nConcentration: 0.06% or 0.08% w/v\nVolume / Packaging: 1 ml vial or prefilled syringe, unit dose; box of 5 or 10\nSterility: sterile, single use, intraocular use only\nStorage: 5–30 °C, dry place, protected from light\nIn-use period after opening: single use, discard remaining solution\nIndications: phacoemulsification, SICS and ECCE cataract surgery, anterior / posterior capsulotomy\nManufacturer: Omni Lens Pvt. Ltd. (India)",
  "brochure": "/uploads/pdfs/omni-omni-blue.pdf",
  "sources": [
   "https://www.omnilens.in/portfolio/omni-blue/",
   "http://omnilens.in/wp-content/uploads/2021/10/Omni-Blue.pdf"
  ]
 },
 "omni-1768245275610-ozjjmhwc7": {
  "brand": "omni",
  "ref": "OMNI-FLUORO",
  "fr": "Référence : OMNI Fluoro\nType : bandelettes ophtalmiques diagnostiques à la fluorescéine sodique\nComposition : environ 1 mg de fluorescéine sodique par bandelette, colorant de qualité pharmaceutique\nSupport : fibre de cellulose de qualité médicale\nStérilité : stérilisée à l'oxyde d'éthylène, sachet individuel pelable\nConditionnement : boîte de 100 ou 300 bandelettes\nConservation : à température ambiante\nIndications : adaptation de lentilles de contact, temps de rupture du film lacrymal (TBUT), localisation de lésions cornéennes, test de drainage lacrymal\nFabricant : Omni Lens Pvt. Ltd. (Inde)",
  "en": "Reference: OMNI Fluoro\nType: fluorescein sodium diagnostic ophthalmic strips\nComposition: approx. 1 mg fluorescein sodium per strip, pharmaceutical grade dye\nSubstrate: medical grade cellulose fibre\nSterility: ethylene oxide sterilised, individual peel pouch\nPackaging: box of 100 or 300 strips\nStorage: room temperature\nIndications: contact lens fitting, tear break-up time (TBUT), locating corneal lesions, lacrimal drainage test\nManufacturer: Omni Lens Pvt. Ltd. (India)",
  "brochure": "/uploads/pdfs/omni-diagnostic-strips.pdf",
  "sources": [
   "https://www.omnilens.in/portfolio/diagnostic-strips/",
   "http://omnilens.in/wp-content/uploads/2021/10/diagnostic-strips.pdf"
  ]
 },
 "omni-1768245275619-1fd5kczer": {
  "brand": "omni",
  "ref": "OMNI-SCHIRMER",
  "fr": "Référence : OMNI Schirmer\nType : bandelettes de test lacrymal de Schirmer\nSupport : fibre de cellulose de qualité médicale, échelle graduée imprimée\nLecture : bande bleue sur les bandelettes TestBlu\nDurée du test : 5 min\nStérilité : stérilisée à l'oxyde d'éthylène, sachet individuel pelable\nConditionnement : boîte de 100 ou 300 bandelettes\nConservation : à température ambiante\nFabricant : Omni Lens Pvt. Ltd. (Inde)",
  "en": "Reference: OMNI Schirmer\nType: Schirmer tear test strips\nSubstrate: medical grade cellulose fibre, printed graduated scale\nReading: blue band on TestBlu strips\nTest duration: 5 min\nSterility: ethylene oxide sterilised, individual peel pouch\nPackaging: box of 100 or 300 strips\nStorage: room temperature\nManufacturer: Omni Lens Pvt. Ltd. (India)",
  "brochure": "/uploads/pdfs/omni-diagnostic-strips.pdf",
  "sources": [
   "https://www.omnilens.in/portfolio/diagnostic-strips/",
   "http://omnilens.in/wp-content/uploads/2021/10/diagnostic-strips.pdf"
  ]
 },
 "53317b26-7693-40c9-bc5f-5ec7f55407ce": {
  "brand": "ophtec",
  "ref": "OD125",
  "fr": "Référence : OD125\nType : aiguille d'enclavation jetable\nIndication : enclavation à l'iris des implants Artisan et Artiflex\nUsage : unique\nConditionnement : 5 aiguilles emballées individuellement (5 × 1)\nFabricant : Ophtec BV (Pays-Bas)",
  "en": "Reference: OD125\nType: disposable enclavation needle\nIndication: iris enclavation of Artisan and Artiflex lenses\nUse: single use\nPackaging: 5 individually packed needles (5 × 1)\nManufacturer: Ophtec BV (Netherlands)",
  "brochure": null,
  "sources": [
   "https://www.ophtec.com/product-overview/disposable-enclavation-needle",
   "https://shop.ophtec.com/product/enclavation-needle"
  ]
 },
 "34e454ea-1227-44d5-bd69-ed10f3c02957": {
  "brand": "pukang",
  "ref": "G-18",
  "fr": "Référence : G-18\nType : armoire à instruments à base inox\nDimensions : 960 × 400 × 1750 mm (L × P × H, ±10 mm)\nMatériau : acier revêtu époxy, base en acier inoxydable\nPartie supérieure : 2 portes vitrées verrouillables, 3 étagères réglables\nPartie inférieure : 1 grand compartiment verrouillable\nFabricant : Hebei Pukang Medical Instruments Co., Ltd. (Chine)",
  "en": "Reference: G-18\nType: appliance cupboard with stainless steel base\nDimensions: 960 × 400 × 1750 mm (L × D × H, ±10 mm)\nMaterial: epoxy-coated steel, stainless steel base\nUpper section: 2 lockable glass doors, 3 adjustable shelves\nLower section: 1 large lockable storage compartment\nManufacturer: Hebei Pukang Medical Instruments Co., Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.pukangmed.com/products/g-18-appliance-cupboard-with-stainless-steel-base.html"
  ]
 },
 "2ca231ba-3acf-4a00-9695-599b0b777409": {
  "brand": "pukang",
  "ref": "G-19",
  "fr": "Référence : G-19\nType : armoire à instruments 2 portes à base inox\nDimensions : 960 × 400 × 1750 mm (L × P × H, ±10 mm)\nMatériau : acier revêtu époxy, base en acier inoxydable\nPortes : 2 portes vitrées verrouillables\nÉtagères : 5 étagères réglables\nFabricant : Hebei Pukang Medical Instruments Co., Ltd. (Chine)",
  "en": "Reference: G-19\nType: 2-door appliance cupboard with stainless steel base\nDimensions: 960 × 400 × 1750 mm (L × D × H, ±10 mm)\nMaterial: epoxy-coated steel, stainless steel base\nDoors: 2 lockable glass doors\nShelves: 5 adjustable shelves\nManufacturer: Hebei Pukang Medical Instruments Co., Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.pukangmed.com/products/g-1-medical-instruments-metal-storage-cabinet.html"
  ]
 },
 "e84aba0c-cfc3-465f-97e7-f906fc71355b": {
  "brand": "pukang",
  "ref": "G-20",
  "fr": "Référence : G-20\nType : armoire vestiaire hospitalière 6 portes\nDimensions : 960 × 400 × 1750 mm (L × P × H)\nMatériau : acier revêtu époxy, base en acier inoxydable\nPortes : 6 portes verrouillables avec poignée\nFabricant : Hebei Pukang Medical Instruments Co., Ltd. (Chine)",
  "en": "Reference: G-20\nType: 6-door employee storage cabinet for hospital use\nDimensions: 960 × 400 × 1750 mm (L × D × H)\nMaterial: epoxy-coated steel, stainless steel base\nDoors: 6 lockable doors with handle\nManufacturer: Hebei Pukang Medical Instruments Co., Ltd. (China)",
  "brochure": null,
  "sources": [
   "https://www.pukangmed.com/products/6-door-employee-storage-cabinet-for-hospital-use.html"
  ]
 },
 "prod-1768072845530-qych9qrej": {
  "brand": "rheon",
  "ref": "2P2, 2P2s, 3P2, 3P2s",
  "fr": "Référence : 2P2 (eyePlate-200) ; 2P2s (eyePlate-200s) ; 3P2 (eyePlate-300) ; 3P2s (eyePlate-300s)\nType : implant de drainage du glaucome non valvé\nSurface de la plaque : 200 mm² (eyePlate-200 / 200s) ; 300 mm² (eyePlate-300 / 300s)\nDimensions de la plaque (longueur × largeur) : 16,8 × 14,5 mm (200 / 200s) ; 18,9 × 18,5 mm (300 / 300s)\nÉpaisseur de la plaque : 0,8 mm\nRayon de courbure de la plaque : 15 mm\nDiamètre du tube (ext. / int.) : 0,63 / 0,3 mm (200 / 300) ; 0,467 / 0,18 mm (200s / 300s)\nLongueur du tube : 28–30 mm\nAiguille d'entrée en chambre antérieure : 23 G (200 / 300) ; 25 G (200s / 300s)\nMatériau : silicone médical implantable à long terme\nFixation : 2 orifices de fixation sclérale, 3 fenestrations\nUtilisation : seul ou associé à l'implant eyeWatch\nIRM : MR Safe\nStérilité : stérilisé par rayons X, double blister stérile, usage unique\nConservation : 15–25 °C, au sec\nFabricant : Rheon Medical SA (Suisse)",
  "en": "Reference: 2P2 (eyePlate-200); 2P2s (eyePlate-200s); 3P2 (eyePlate-300); 3P2s (eyePlate-300s)\nType: non-valved glaucoma drainage implant\nPlate surface area: 200 mm² (eyePlate-200 / 200s); 300 mm² (eyePlate-300 / 300s)\nPlate dimensions (length × width): 16.8 × 14.5 mm (200 / 200s); 18.9 × 18.5 mm (300 / 300s)\nPlate thickness: 0.8 mm\nPlate curvature radius: 15 mm\nTube diameter (outer / inner): 0.63 / 0.3 mm (200 / 300); 0.467 / 0.18 mm (200s / 300s)\nTube length: 28–30 mm\nAnterior chamber entry needle: 23 G (200 / 300); 25 G (200s / 300s)\nMaterial: long-term implantable medical grade silicone\nFixation: 2 scleral fixation holes, 3 fenestrations\nUse: stand-alone or combined with the eyeWatch implant\nMRI: MR Safe\nSterility: X-ray sterilised, double sterile blister, single use\nStorage: 15–25 °C, dry\nManufacturer: Rheon Medical SA (Switzerland)",
  "brochure": "/uploads/pdfs/rheon-eyeplate.pdf",
  "sources": [
   "https://rheonmedical.com/eyeplate/",
   "https://rheonmedical.com/eyeplate-s/",
   "https://rheonmedical.com/wp-content/uploads/2025/09/2700-1-8-Instructions-for-Use-eyePlate.pdf"
  ]
 },
 "prod-1768072845501-dpld7x7xw": {
  "brand": "rheon",
  "ref": "M4",
  "fr": "Référence : M4\nType : implant de drainage du glaucome ajustable (résistance fluidique réglable de façon non invasive)\nÉpaisseur de l'implant : 0,57 mm\nDiamètre de la buse : 0,48 mm\nAiguille d'entrée en chambre antérieure : 25 G\nMatériaux de l'implant : PEEK Optima, silicone Nusil MED-4830, colle époxy EPO-TEK MED 301-2\nRéglage : non invasif par stylo eyeWatch (disque magnétique interne), positions 0 (ouverture totale) à 6 (fermeture totale)\nIRM : MR Conditional (1,5 T ou 3 T, gradient ≤ 19 T/m)\nUtilisation : toujours en série avec une plaque eyePlate (non recommandé seul) ; compatible eyePlate et Baerveldt\nStérilité : stérilisé par rayons X, double blister stérile, usage unique\nConservation : 15–25 °C, au sec\nConditionnement : 1 implant eyeWatch, 1 stylo eyeWatch usage unique, 1 marqueur eyeWatch, 1 pince eyeWatch\nFabricant : Rheon Medical SA (Suisse)",
  "en": "Reference: M4\nType: adjustable glaucoma drainage implant (non-invasively adjustable fluidic resistance)\nImplant thickness: 0.57 mm\nNozzle diameter: 0.48 mm\nAnterior chamber entry needle: 25 G\nImplant materials: PEEK Optima, Nusil MED-4830 silicone, EPO-TEK MED 301-2 epoxy\nAdjustment: non-invasive with the eyeWatch Pen (internal magnetic disc), positions 0 (fully open) to 6 (fully closed)\nMRI: MR Conditional (1.5 T or 3 T, gradient ≤ 19 T/m)\nUse: always connected in series to an eyePlate (not recommended stand-alone); compatible with eyePlate and Baerveldt\nSterility: X-ray sterilised, double sterile blister, single use\nStorage: 15–25 °C, dry\nPackaging: 1 eyeWatch implant, 1 eyeWatch Pen single-use, 1 eyeWatch Marker, 1 eyeWatch Tweezer\nManufacturer: Rheon Medical SA (Switzerland)",
  "brochure": "/uploads/pdfs/rheon-eyewatch.pdf",
  "sources": [
   "https://rheonmedical.com/eyewatch/",
   "https://rheonmedical.com/wp-content/uploads/2025/09/1700-1-8-Instructions-for-use-EN.pdf",
   "https://rheonmedical.com/products-information/"
  ]
 },
 "prod-1768072845549-mozq2jje1": {
  "brand": "rheon",
  "ref": "C4, sC1",
  "fr": "Référence : C4 (stylo eyeWatch, version cabinet) ; sC1 (stylo eyeWatch usage unique)\nType : dispositif externe de lecture et de réglage de l'implant eyeWatch\nFonctions : lecture de la position de l'implant (boussole) ; réglage non invasif (aimant externe)\nPositions : 0 (ouverture totale) à 6 (fermeture totale)\nAimant : champ magnétique environ 150 fois supérieur au champ terrestre\nVersion cabinet (C4) : livrée non stérile, réglages postopératoires\nVersion usage unique (sC1) : stérile (rayons X), lecture et réglage peropératoires, fournie avec l'implant eyeWatch\nFabricant : Rheon Medical SA (Suisse)",
  "en": "Reference: C4 (eyeWatch Pen, office version); sC1 (eyeWatch Pen single-use)\nType: external device for reading and adjusting the eyeWatch implant\nFunctions: reading of implant position (compass); non-invasive adjustment (external magnet)\nPositions: 0 (fully open) to 6 (fully closed)\nMagnet: magnetic field about 150 times the Earth's magnetic field\nOffice version (C4): supplied non-sterile, post-operative adjustments\nSingle-use version (sC1): sterile (X-ray), intra-operative reading and adjustment, supplied with the eyeWatch implant\nManufacturer: Rheon Medical SA (Switzerland)",
  "brochure": "/uploads/pdfs/rheon-eyewatch.pdf",
  "sources": [
   "https://rheonmedical.com/wp-content/uploads/2025/09/1700-1-8-Instructions-for-use-EN.pdf"
  ]
 },
 "prod-1768072845376-agu7wjcny": {
  "brand": "rheon",
  "ref": "aW-syst-2Q0-01, eW-syst-300-01",
  "fr": "Référence : aW-syst-2Q0-01 (avec eyePlate-200) ; eW-syst-300-01 (avec eyePlate-300)\nType : système de drainage du glaucome ajustable\nComposition du système : implant eyeWatch, stylo eyeWatch usage unique, plaque eyePlate-200 ou eyePlate-300\nÉpaisseur de l'implant : 0,57 mm\nDiamètre de la buse : 0,48 mm\nAiguille d'entrée en chambre antérieure : 25 G\nMatériaux de l'implant : PEEK Optima, silicone Nusil MED-4830, colle époxy EPO-TEK MED 301-2\nRéglage : non invasif par stylo eyeWatch (disque magnétique interne), positions 0 (ouverture totale) à 6 (fermeture totale)\nIRM : MR Conditional (1,5 T ou 3 T, gradient ≤ 19 T/m)\nSurface de la plaque : 200 mm² (eyePlate-200) ; 300 mm² (eyePlate-300)\nDimensions de la plaque (longueur × largeur) : 16,8 × 14,5 mm (eyePlate-200) ; 18,9 × 18,5 mm (eyePlate-300)\nÉpaisseur de la plaque : 0,8 mm\nDiamètre du tube de la plaque (ext. / int.) : 0,63 / 0,3 mm\nMatériau de la plaque : silicone médical implantable\nStérilité : stérilisé par rayons X, usage unique\nConservation : 15–25 °C, au sec\nFabricant : Rheon Medical SA (Suisse)",
  "en": "Reference: aW-syst-2Q0-01 (with eyePlate-200); eW-syst-300-01 (with eyePlate-300)\nType: adjustable glaucoma drainage system\nSystem contents: eyeWatch implant, eyeWatch Pen single-use, eyePlate-200 or eyePlate-300 plate\nImplant thickness: 0.57 mm\nNozzle diameter: 0.48 mm\nAnterior chamber entry needle: 25 G\nImplant materials: PEEK Optima, Nusil MED-4830 silicone, EPO-TEK MED 301-2 epoxy\nAdjustment: non-invasive with the eyeWatch Pen (internal magnetic disc), positions 0 (fully open) to 6 (fully closed)\nMRI: MR Conditional (1.5 T or 3 T, gradient ≤ 19 T/m)\nPlate surface area: 200 mm² (eyePlate-200); 300 mm² (eyePlate-300)\nPlate dimensions (length × width): 16.8 × 14.5 mm (eyePlate-200); 18.9 × 18.5 mm (eyePlate-300)\nPlate thickness: 0.8 mm\nPlate tube diameter (outer / inner): 0.63 / 0.3 mm\nPlate material: implantable medical grade silicone\nSterility: X-ray sterilised, single use\nStorage: 15–25 °C, dry\nManufacturer: Rheon Medical SA (Switzerland)",
  "brochure": "/uploads/pdfs/rheon-eyewatch.pdf",
  "sources": [
   "https://rheonmedical.com/eyewatch/",
   "https://rheonmedical.com/eyeplate/",
   "https://rheonmedical.com/wp-content/uploads/2025/09/1700-1-8-Instructions-for-use-EN.pdf",
   "https://rheonmedical.com/wp-content/uploads/2025/09/2700-1-8-Instructions-for-Use-eyePlate.pdf"
  ]
 },
 "cb364d27-335e-4b40-b3a1-7a5f21982001": {
  "brand": "ursapharmm",
  "ref": "HYLO DUAL INTENSE",
  "fr": "Référence : HYLO DUAL INTENSE\nType : collyre lubrifiant pour sécheresse oculaire modérée à sévère avec symptômes inflammatoires\nComposition : hyaluronate de sodium 2,0 mg/ml, ectoïne 20 mg/ml, acide borique, borax, eau pour préparations injectables\nConcentration : hyaluronate de sodium 0,2 %, ectoïne 2 %\nVolume / Conditionnement : flacon COMOD de 10 ml (environ 300 gouttes)\nConservateurs : sans conservateur, sans phosphate\nStérilité : solution aqueuse stérile, système multidose COMOD\nConservation : ne pas conserver au-dessus de 25 °C\nDurée d'utilisation après ouverture : 6 mois\nPosologie usuelle : 1 goutte 3 fois par jour dans chaque œil (adultes et enfants de plus de 2 ans)\nLentilles de contact : non compatible (viscosité élevée)\nStatut : dispositif médical CE\nFabricant : URSAPHARM Arzneimittel GmbH (Allemagne)",
  "en": "Reference: HYLO DUAL INTENSE\nType: lubricating eye drops for moderate to severe dry eye with inflammatory symptoms\nComposition: sodium hyaluronate 2.0 mg/ml, ectoin 20 mg/ml, boric acid, borax, water for injections\nConcentration: sodium hyaluronate 0.2%, ectoin 2%\nVolume / Packaging: 10 ml COMOD bottle (approx. 300 drops)\nPreservatives: preservative-free, phosphate-free\nSterility: sterile aqueous solution, COMOD multi-dose system\nStorage: do not store above 25 °C\nIn-use period after opening: 6 months\nUsual dosage: 1 drop 3 times daily in each eye (adults and children over 2 years)\nContact lenses: not compatible (high viscosity)\nStatus: CE medical device\nManufacturer: URSAPHARM Arzneimittel GmbH (Germany)",
  "brochure": "/uploads/pdfs/ursapharm-hylo-dual-intense.pdf",
  "sources": [
   "https://ursapharm.de/en/products/dry-eye-syndrome/hylo-eye-care/hylo-dual-intense/",
   "https://dxsat.ursapharm.de/mediaportal/live/_storage/asset/77367/storage/master/download/77367.pdf"
  ]
 },
 "efcbb66f-2660-4323-ad08-946e6e2f07eb": {
  "brand": "nidek",
  "ref": "OPD-Scan",
  "fr": "Référence : OPD-Scan III\nAberromètre – sphère : -20,00 à +22,00 D\nAberromètre – cylindre : 0 à ±12,00 D\nZone de mesure de l'aberromètre : 2,0 à 9,5 mm (7 zones, 2520 points)\nTopographe – zone de mesure : 0,5 à 11,0 mm (R = 7,9 mm), 33 anneaux verticaux / 39 horizontaux\nKératomètre – rayon de courbure : 5,00 à 10,00 mm\nKératomètre – puissance réfractive : 33,75 à 67,50 D (n = 1,3375)\nDiamètre pupillaire minimal mesurable : 2,6 mm\nPupillomètre : 1,0 à 10,0 mm (photopique, mésopique)\nSuivi automatique : X-Y-Z\nÉcran : LCD couleur tactile 10,4 pouces\nAlimentation : 100–240 V CA, 50/60 Hz, 110 VA\nDimensions / poids : 284 × 525 × 533 mm / 23 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: OPD-Scan III\nAberrometer sphere: -20.00 to +22.00 D\nAberrometer cylinder: 0 to ±12.00 D\nAberrometer measurement area: 2.0 to 9.5 mm (7 zones, 2,520 points)\nTopographer measurement area: 0.5 to 11.0 mm (R = 7.9 mm), 33 vertical / 39 horizontal rings\nKeratometer curvature radius: 5.00 to 10.00 mm\nKeratometer refractive power: 33.75 to 67.50 D (n = 1.3375)\nMinimum measurable pupil diameter: 2.6 mm\nPupillometer: 1.0 to 10.0 mm (photopic, mesopic)\nAuto tracking: X-Y-Z\nDisplay: 10.4-inch colour LCD touch screen\nPower supply: 100–240 V AC, 50/60 Hz, 110 VA\nDimensions / weight: 284 × 525 × 533 mm / 23 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-opd-scan-iii.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/refractive-power-corneal-analyzer-opd-scan-lll/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/OPD-Scan-III.pdf"
  ]
 },
 "c033cf79-22de-4260-ad89-e16efae1393a": {
  "brand": "nidek",
  "ref": "ARK-1s",
  "fr": "Référence : ARK-1s / ARK-1a / ARK-1 (AR-1s / AR-1a / AR-1)\nRéfractomètre – sphère : -30,00 à +25,00 D (DVO = 12 mm), pas 0,01/0,12/0,25 D\nRéfractomètre – cylindre : 0 à ±12,00 D\nRéfractomètre – axe : 0–180° (pas 1°/5°)\nDiamètre pupillaire minimal mesurable : 2 mm\nKératomètre – rayon de courbure : 5,00 à 13,00 mm (ARK uniquement)\nKératomètre – puissance réfractive : 25,96 à 67,50 D (n = 1,3375) (ARK uniquement)\nPlage de mesure de l'écart pupillaire : 30 à 85 mm\nDiamètre pupillaire mesurable : 1,0 à 10,0 mm\nÉcran : LCD couleur inclinable 6,5 pouces\nImprimante : imprimante thermique avec coupe-papier automatique\nInterfaces : RS-232C (2 ports), USB, LAN\nAlimentation : 100–240 V CA, 50/60 Hz, 100 VA\nDimensions / poids : 260 × 495 × 457 mm / 20 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: ARK-1s / ARK-1a / ARK-1 (AR-1s / AR-1a / AR-1)\nRefractometer sphere: -30.00 to +25.00 D (VD = 12 mm), 0.01/0.12/0.25 D increments\nRefractometer cylinder: 0 to ±12.00 D\nRefractometer axis: 0–180° (1°/5° increments)\nMinimum measurable pupil diameter: 2 mm\nKeratometer curvature radius: 5.00 to 13.00 mm (ARK models only)\nKeratometer refractive power: 25.96 to 67.50 D (n = 1.3375) (ARK models only)\nPupillary distance range: 30 to 85 mm\nPupil size range: 1.0 to 10.0 mm\nDisplay: tiltable 6.5-inch colour LCD\nPrinter: thermal line printer with auto cutter\nInterfaces: RS-232C (2 ports), USB, LAN\nPower supply: 100–240 V AC, 50/60 Hz, 100 VA\nDimensions / weight: 260 × 495 × 457 mm / 20 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-ark-1-ar-1-series.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/auto-ref-keratometer-ark-1s-1a-1-auto-refractometer-ar-1s-1a-1/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/ARK_1_AR_1E_8P_9_A3.pdf"
  ]
 },
 "5dd75ed5-ef9c-4cfb-b471-aee6625ee09c": {
  "brand": "nidek",
  "ref": "AR-1",
  "fr": "Référence : AR-1 (série AR-1s / AR-1a / AR-1)\nSphère : -30,00 à +25,00 D (DVO = 12 mm), pas 0,01/0,12/0,25 D\nCylindre : 0 à ±12,00 D\nAxe : 0–180° (pas 1°/5°)\nDiamètre pupillaire minimal mesurable : 2 mm\nPlage de mesure de l'écart pupillaire : 30 à 85 mm\nDiamètre pupillaire mesurable : 1,0 à 10,0 mm\nÉcran : LCD couleur inclinable 6,5 pouces\nImprimante : imprimante thermique avec coupe-papier automatique\nInterfaces : RS-232C (2 ports), USB, LAN\nAlimentation : 100–240 V CA, 50/60 Hz, 100 VA\nDimensions / poids : 260 × 495 × 457 mm / 20 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: AR-1 (AR-1s / AR-1a / AR-1 series)\nSphere: -30.00 to +25.00 D (VD = 12 mm), 0.01/0.12/0.25 D increments\nCylinder: 0 to ±12.00 D\nAxis: 0–180° (1°/5° increments)\nMinimum measurable pupil diameter: 2 mm\nPupillary distance range: 30 to 85 mm\nPupil size range: 1.0 to 10.0 mm\nDisplay: tiltable 6.5-inch colour LCD\nPrinter: thermal line printer with auto cutter\nInterfaces: RS-232C (2 ports), USB, LAN\nPower supply: 100–240 V AC, 50/60 Hz, 100 VA\nDimensions / weight: 260 × 495 × 457 mm / 20 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-ark-1-ar-1-series.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/auto-ref-keratometer-ark-1s-1a-1-auto-refractometer-ar-1s-1a-1/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/ARK_1_AR_1E_8P_9_A3.pdf"
  ]
 },
 "c9810af0-736c-45a1-8dc3-b2f9f59bf5c2": {
  "brand": "nidek",
  "ref": "AL-SCAN",
  "fr": "Référence : AL-Scan\nLongueur axiale (optique) : 14 à 40 mm, précision ±0,05 mm (interférométrie à faible cohérence)\nRayon de courbure cornéen : 5,00 à 13,00 mm, précision ±0,05 mm\nProfondeur de chambre antérieure : 1,5 à 6,5 mm, précision ±0,1 mm\nÉpaisseur cornéenne centrale : 250 à 1300 µm, précision ±10 µm\nBlanc à blanc : 7 à 14 mm, précision ±0,2 mm\nDiamètre pupillaire : 1 à 10 mm\nLongueur axiale (ultrasons, option) : 12 à 40 mm, précision ±0,1 mm\nFormules de calcul d'implant : SRK, SRK II, SRK/T, Binkhorst, Hoffer Q, Holladay 1, Formula/H, Camellin-Calossi, Shammas-PL\nSuivi automatique : X-Y-Z\nÉcran : LCD couleur tactile inclinable 8,4 pouces\nInterfaces : LAN, USB\nAlimentation : 100–240 V CA, 50/60 Hz, 100 VA\nDimensions / poids : 283 × 504 × 457 mm / 21 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: AL-Scan\nAxial length (optical): 14 to 40 mm, accuracy ±0.05 mm (low-coherence interferometry)\nCorneal curvature radius: 5.00 to 13.00 mm, accuracy ±0.05 mm\nAnterior chamber depth: 1.5 to 6.5 mm, accuracy ±0.1 mm\nCentral corneal thickness: 250 to 1,300 µm, accuracy ±10 µm\nWhite-to-white: 7 to 14 mm, accuracy ±0.2 mm\nPupil size: 1 to 10 mm\nAxial length (ultrasound, optional): 12 to 40 mm, accuracy ±0.1 mm\nIOL calculation formulas: SRK, SRK II, SRK/T, Binkhorst, Hoffer Q, Holladay 1, Formula/H, Camellin-Calossi, Shammas-PL\nAuto tracking: X-Y-Z\nDisplay: tiltable 8.4-inch colour LCD touch screen\nInterfaces: LAN, USB\nPower supply: 100–240 V AC, 50/60 Hz, 100 VA\nDimensions / weight: 283 × 504 × 457 mm / 21 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-al-scan.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/optical-biometer-al-scan/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/AL-Scan.pdf"
  ]
 },
 "6c4b7a2f-8bd7-418d-98d9-0f050156f4ab": {
  "brand": "nidek",
  "ref": "ICE-1",
  "fr": "Référence : ICE-1\nDiamètre du verre : 110 mm max.\nÉcart frontal (FPD) : 30,00 à 99,50 mm\nÉcart pupillaire : 30,00 à 99,50 mm (1/2 EP : 15,00 à 49,75 mm)\nHauteur du centre optique : 0 à ±15,0 mm\nImageur de forme : zone 65,5 × 49,0 mm ; perçages Ø 0,50 à 10,00 mm (pas 0,01 mm)\nMéthode de centrage : manuelle\nÉcran : LCD couleur tactile SVGA 8,4 pouces\nInterfaces : RS-232C (4 ports), LAN, USB\nAlimentation : 100–240 V CA, 50/60 Hz, 60 VA\nDimensions / poids : 225 × 411 × 439 mm / 7,5 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: ICE-1\nLens diameter: 110 mm max.\nFrame PD (FPD): 30.00 to 99.50 mm\nPupillary distance: 30.00 to 99.50 mm (1/2 PD: 15.00 to 49.75 mm)\nOptical centre height: 0 to ±15.0 mm\nShape imager: area 65.5 × 49.0 mm; hole diameter 0.50 to 10.00 mm (0.01 mm increments)\nBlocking method: manual\nDisplay: 8.4-inch SVGA colour LCD touch panel\nInterfaces: RS-232C (4 ports), LAN, USB\nPower supply: 100–240 V AC, 50/60 Hz, 60 VA\nDimensions / weight: 225 × 411 × 439 mm / 7.5 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-ice-1.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/intelligent-blocker-ice-1/",
   "https://web.archive.org/web/20250326150348/https://www.nidek-intl.com/wp-content/uploads/2024/05/ICE-1.pdf (Wayback copy of the official NIDEK brochure)"
  ]
 },
 "c632cb82-b68c-439c-a615-ab0fe070cdb8": {
  "brand": "nidek",
  "ref": "ICE-1500",
  "fr": "Référence : ICE-1500 / ICE-1500NT\nDiamètre du verre : 85 mm max.\nÉcart frontal (FPD) : 30,00 à 99,50 mm\nÉcart pupillaire : 30,00 à 99,50 mm (1/2 EP : 15,00 à 49,75 mm)\nHauteur du centre optique : 0 à ±15,0 mm\nImageur de forme : zone 65,0 × 50,0 mm ; perçages Ø 0,50 à 10,00 mm\nLecteur de monture intégré : lecture 3D binoculaire automatique, 1000 points, précision ±0,05 mm\nSerrage de monture : automatique en une touche (ICE-1500) ; aucun (ICE-1500NT)\nMéthode de centrage : automatique\nÉcran : LCD couleur tactile SVGA 8,4 pouces\nInterfaces : RS-232C (3 ports), LAN\nAlimentation : 100–240 V CA, 50/60 Hz ; 110 VA (ICE-1500), 90 VA (ICE-1500NT)\nDimensions : 325 × 510 × 345 mm\nPoids : 21 kg (ICE-1500) ; 17 kg (ICE-1500NT)\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: ICE-1500 / ICE-1500NT\nLens diameter: 85 mm max.\nFrame PD (FPD): 30.00 to 99.50 mm\nPupillary distance: 30.00 to 99.50 mm (1/2 PD: 15.00 to 49.75 mm)\nOptical centre height: 0 to ±15.0 mm\nShape imager: area 65.0 × 50.0 mm; hole diameter 0.50 to 10.00 mm\nBuilt-in tracer: automatic 3D binocular tracing, 1,000 points, accuracy ±0.05 mm\nFrame clamping: one-touch automatic (ICE-1500); none (ICE-1500NT)\nBlocking method: automatic\nDisplay: 8.4-inch SVGA colour LCD touch panel\nInterfaces: RS-232C (3 ports), LAN\nPower supply: 100–240 V AC, 50/60 Hz; 110 VA (ICE-1500), 90 VA (ICE-1500NT)\nDimensions: 325 × 510 × 345 mm\nWeight: 21 kg (ICE-1500); 17 kg (ICE-1500NT)\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-ice-1500.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/intelligent-blocker-ice-1500/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/ICE-1500.pdf"
  ]
 },
 "87dc43e2-6b64-4bce-86ed-41a18ccebf49": {
  "brand": "nidek",
  "ref": "FE-2010",
  "fr": "Référence : FE-2010\nType : fauteuil patient à dossier fixe\nÉlévation : électrique, course de 25 cm\nCommande : par pédale (autonome) ou depuis le pupitre de l'unité\nCompatibilité : toutes les unités de consultation NIDEK, ou fauteuil autonome\nColoris : rouge, bleu, noir ou gris de série ; autres coloris en option\nFabricant : NIDEK SA (France)",
  "en": "Reference: FE-2010\nType: fixed-backrest patient chair\nElevation: electric, 25 cm stroke\nControl: foot switch (stand-alone) or from the unit's control panel\nCompatibility: all NIDEK refraction units, or stand-alone chair\nColours: red, blue, black or grey as standard; other colours optional\nManufacturer: NIDEK SA (France)",
  "brochure": "/uploads/pdfs/nidek-consultation-units-2022-2023.pdf",
  "sources": [
   "https://www.nidek.fr/fauteuils-de-consultation-et-tabourets/",
   "https://www.nidek.fr/wp-content/uploads/2023/04/Consultation-units-2022-2023.pdf (p. 40)"
  ]
 },
 "697b4ff5-b694-442b-8aca-392305174fea": {
  "brand": "nidek",
  "ref": "GS-1-EXPLO",
  "fr": "Référence : GS-1\nZone de capture : env. 2,36 × 2 mm\nDistance de travail : 1,5 mm\nSource lumineuse : LED blanche\nModes de capture : simple ; multiple (17 focales × jusqu'à 16 directions) ; complet (17 × 16 = 272 images)\nAssemblage d'images : circulaire, linéaire\nSuivi automatique : X-Y ; déclenchement automatique\nÉcran : LCD couleur tactile 9,0 pouces (WXGA)\nStockage : SSD intégré ; export JPEG, PNG, PDF\nInterfaces : USB, LAN\nAlimentation : 100–240 V CA, 50/60 Hz, 100 VA\nDimensions / poids : 280 × 504 × 460 mm / 15 kg\nPrisme multimiroir : 16 faces\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: GS-1\nCapturing area: approx. 2.36 × 2 mm\nWorking distance: 1.5 mm\nLight source: white LED\nCapture modes: single; multi (17 foci × up to 16 directions); full (17 × 16 = 272 images)\nImage stitching: circular, linear\nAuto tracking: X-Y; auto shot\nDisplay: 9.0-inch (WXGA) colour LCD touch screen\nStorage: built-in SSD; export JPEG, PNG, PDF\nInterfaces: USB, LAN\nPower supply: 100–240 V AC, 50/60 Hz, 100 VA\nDimensions / weight: 280 × 504 × 460 mm / 15 kg\nMultimirror prism: 16 facets\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-gs-1.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/gonioscope-gs-1/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/GS-1.pdf"
  ]
 },
 "6ebc6388-acd9-479a-bc76-c23610170176": {
  "brand": "nidek",
  "ref": "GYC-500",
  "fr": "Référence : GYC-500 / GYC-500 Vixi\nLongueur d'onde : 532 nm\nPuissance de sortie : 50 à 1700 mW (hors balayage) ; 50 à 1500 mW (balayage, GYC-500 Vixi)\nMode d'émission : continu, pulsé 0,01 à 0,2 s\nDurée d'émission : 0,01 à 3,00 s\nIntervalle : 0,05 à 1,00 s\nFaisceau de visée : diode laser 635 nm, 0,4 mW max.\nTaille du spot : 100 à 500 µm (balayage) / 50 à 500 µm (simple) (GYC-500 Vixi) ; 50 à 1000 µm (GYC-500)\nMotifs de tir : simple + carrés, rectangle, arcs, cercle, ligne, etc. (GYC-500 Vixi) ; simple (GYC-500)\nAlimentation : 100–240 V CA, 50/60 Hz, 250 VA\nDimensions / poids du corps principal : 237 × 318 × 90 mm / 6,2 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: GYC-500 / GYC-500 Vixi\nWavelength: 532 nm\nPower output: 50 to 1,700 mW (except scan delivery); 50 to 1,500 mW (scan delivery, GYC-500 Vixi)\nOutput type: continuous wave, pulse 0.01 to 0.2 s\nEmission time: 0.01 to 3.00 s\nInterval time: 0.05 to 1.00 s\nAiming beam: laser diode 635 nm, max. 0.4 mW\nSpot size: 100 to 500 µm (scan) / 50 to 500 µm (single) (GYC-500 Vixi); 50 to 1,000 µm (GYC-500)\nEmission patterns: single + square, rectangle, arcs, circle, line, etc. (GYC-500 Vixi); single (GYC-500)\nPower supply: 100–240 V AC, 50/60 Hz, 250 VA\nMain body dimensions / weight: 237 × 318 × 90 mm / 6.2 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-gyc-500-vixi.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/green-scan-laser-photocoagulator-gyc-500-vixi-green-laser-photocoagulator-gyc-500/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/05/GYC_500Vixi_GYC_500E_8P_6.pdf"
  ]
 },
 "7571ecad-f25e-45d4-92a3-505da95cdb1f": {
  "brand": "nidek",
  "ref": "PM-700",
  "fr": "Référence : PM-700\nMéthode de mesure : alignement sur le reflet cornéen\nPlage de mesure : 47,0 à 83,0 mm (23,5 à 41,5 mm par œil)\nDistances de fixation : 30, 35, 40, 50, 65, 100, 200 cm et ∞\nPas du réticule : 0,25 / 0,5 mm\nOcclusion monoculaire : obturateur à cristaux liquides (OD, OG ou binoculaire)\nAffichage : LCD\nAlimentation : 2 piles alcalines AA (LR6)\nDimensions / poids : 147 × 235 × 60 mm / 560 g (sans piles)\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: PM-700\nMeasurement method: corneal reflection alignment\nMeasurement range: 47.0 to 83.0 mm (23.5 to 41.5 mm per eye)\nDistance settings: 30, 35, 40, 50, 65, 100, 200 cm and ∞\nHairline increments: 0.25 / 0.5 mm\nMonocular occlusion: liquid crystal shutter (R, L or binocular open)\nDisplay: LCD\nPower source: 2 × AA alkaline batteries (LR6)\nDimensions / weight: 147 × 235 × 60 mm / 560 g (without batteries)\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-pm-700.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/pd-meter-pm-700/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/03/PM-700.pdf"
  ]
 },
 "21198d6f-a2aa-4468-bfda-b6c66d2d480b": {
  "brand": "nidek",
  "ref": "RT-3100",
  "fr": "Référence : RT-3100\nSphère : -19,00 à +16,75 D\nCylindre : 0,00 à ±6,00 D\nAxe : 0–180° (pas 1°/5°)\nÉcart pupillaire : 48 à 80 mm (vision de loin)\nPrisme : 0,00 à 20,00 Δ\nChamp visuel : 40° (DVO = 12 mm)\nDistance de vision de près : 350 à 700 mm\nÉcran : LCD couleur tactile 5,7 pouces\nImprimante : imprimante ligne rapide intégrée\nInterfaces : RS-232C (2 ports)\nAlimentation : 100–240 V CA, 50/60 Hz, 80 VA\nTête de réfracteur : 355 × 100 × 276 mm / 3,5 kg\nBoîtier de commande : 160 × 209 × 165 mm / 1,7 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: RT-3100\nSphere: -19.00 to +16.75 D\nCylinder: 0.00 to ±6.00 D\nAxis: 0–180° (1°/5° increments)\nPupillary distance: 48 to 80 mm (far mode)\nPrism: 0.00 to 20.00 Δ\nVisual field: 40° (VD = 12 mm)\nNear vision refraction distance: 350 to 700 mm\nDisplay: 5.7-inch colour LCD touch screen\nPrinter: built-in high-speed line printer\nInterfaces: RS-232C (2 ports)\nPower supply: 100–240 V AC, 50/60 Hz, 80 VA\nRefractor head: 355 × 100 × 276 mm / 3.5 kg\nControl box: 160 × 209 × 165 mm / 1.7 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-rt-3100.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/intelligent-refractor-rt-3100/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/04/RT-3100.pdf"
  ]
 },
 "b9a1e926-0f95-4f68-859f-f351b62f5401": {
  "brand": "nidek",
  "ref": "RT-6100",
  "fr": "Référence : RT-6100\nSphère : -29,00 à +26,75 D\nCylindre : 0,00 à ±8,75 D\nAxe : 0–180° (pas 1°/5°/15°)\nÉcart pupillaire : 48 à 80 mm (vision de loin)\nPrisme : 0,00 à 20,00 Δ\nChamp visuel : 40° (DVO = 12 mm)\nDistance de vision de près : 350 à 700 mm\nÉcran : LCD couleur 10,4 pouces\nImprimante : imprimante ligne rapide\nInterfaces : RS-232C (1 port), USB (1 port), LAN (3 ports), Wi-Fi en option\nAlimentation : 100–240 V CA, 50/60 Hz, 90 VA\nTête de réfracteur : 408 × 107 × 277 mm / 3,2 kg\nConsole de commande : 260 × 230 × 207 mm / 2,1 kg\nFabricant : NIDEK Co., Ltd. (Japon)",
  "en": "Reference: RT-6100\nSphere: -29.00 to +26.75 D\nCylinder: 0.00 to ±8.75 D\nAxis: 0–180° (1°/5°/15° increments)\nPupillary distance: 48 to 80 mm (far mode)\nPrism: 0.00 to 20.00 Δ\nVisual field: 40° (VD = 12 mm)\nNear vision refraction distance: 350 to 700 mm\nDisplay: 10.4-inch colour LCD\nPrinter: high-speed line printer\nInterfaces: RS-232C (1 port), USB (1 port), LAN (3 ports), optional WLAN\nPower supply: 100–240 V AC, 50/60 Hz, 90 VA\nRefractor head: 408 × 107 × 277 mm / 3.2 kg\nControl console: 260 × 230 × 207 mm / 2.1 kg\nManufacturer: NIDEK Co., Ltd. (Japan)",
  "brochure": "/uploads/pdfs/nidek-rt-6100.pdf",
  "sources": [
   "https://www.nidek-intl.com/items/intelligent-refractor-rt-6100/",
   "https://www.nidek-intl.com/wp-content/uploads/2024/04/RT_6100E_12P_1_A3-2.pdf"
  ]
 },
 "b63b26fa-0716-4370-879a-0340bf573a7f": {
  "brand": "nidek",
  "ref": "OT-4200",
  "fr": "Référence : OT-4200\nType : unité de consultation adaptée aux personnes en fauteuil roulant (patients de 1,20 à 2 m)\nPlateau : hauteur réglable électriquement de 61 à 96 cm, hauteur de travail mémorisable, 2 ou 3 instruments\nRéfracteur : sur bras à translation motorisée\nSiège patient : hauteur réglable électriquement de 45 à 65 cm\nCharge maximale du siège : 250 kg\nMobilier : meuble avec 1 tiroir pour verres d'essai (option : meuble 3 tiroirs et bureau)\nOptions du siège : rotation, repose-pieds, accoudoirs relevables\nPoids : 200 kg (sans appareil ni bureau)\nAlimentation : 230 V CA, 50 Hz, 1500 W\nClasse : dispositif médical de classe I, CE\nFabricant : NIDEK SA (France)",
  "en": "Reference: OT-4200\nType: refraction stand suitable for wheelchair users (patients 1.20 to 2 m tall)\nTable top: electrically adjustable height 61 to 96 cm, memorised working height, 2 or 3 instruments\nPhoropter: on electrically translating arm\nPatient chair: electrically adjustable height 45 to 65 cm\nPatient chair max load: 250 kg\nFurniture: unit with 1 drawer for trial lenses (option: 3-drawer furniture and desk)\nChair options: rotation, footrest, folding armrests\nWeight: 200 kg (without devices or desk)\nPower supply: 230 V AC, 50 Hz, 1500 W\nClass: Class I medical device, CE\nManufacturer: NIDEK SA (France)",
  "brochure": "/uploads/pdfs/nidek-ot-4200.pdf",
  "sources": [
   "https://www.nidek.fr/en/unites-de-consultation/ot-4200/",
   "https://www.nidek.fr/wp-content/uploads/2021/08/brochure_OT4200.pdf"
  ]
 },
 "d6427d02-d53a-48b6-b5c9-f09ffefd19d0": {
  "brand": "nidek",
  "ref": "OT-6400",
  "fr": "Référence : OT-6400\nType : unité de consultation tournante entièrement motorisée (patients de 1,20 à 2 m)\nPlateau : hauteur réglable électriquement sur 25 cm, hauteur de travail mémorisable, jusqu'à 6 instruments dans 1,35 m de diamètre\nRotation : électrique débrayable, démarrage et arrêt progressifs\nRéfracteur : sur bras à translation électrique et inclinaison motorisée\nMobilier : 3 tablettes porte-instruments motorisées + 1 tiroir, ou 4 tablettes motorisées (option : bureau 4 tiroirs)\nSiège patient : hauteur réglable électriquement de 45 à 65 cm\nCharge maximale du siège : 250 kg\nPilotage : application tablette ou smartphone\nPoids : 250 kg (sans appareil ni bureau)\nAlimentation : 230 V CA, 50 Hz, 2500 W\nClasse : dispositif médical de classe I, CE\nFabricant : NIDEK SA (France)",
  "en": "Reference: OT-6400\nType: fully motorised rotating refraction stand (patients 1.20 to 2 m tall)\nTable top: 25 cm electrical height adjustment, memorised working height, up to 6 instruments within 1.35 m diameter\nRotation: electric, disengageable, progressive start and stop\nPhoropter: on electrically translating and tilting arm\nFurniture: 3 motorised pull-out instrument flaps + 1 drawer, or 4 motorised flaps (option: desk with 4 drawers)\nPatient chair: electrically adjustable height 45 to 65 cm\nPatient chair max load: 250 kg\nControl: tablet or smartphone app\nWeight: 250 kg (without devices or desk)\nPower supply: 230 V AC, 50 Hz, 2500 W\nClass: Class I medical device, CE\nManufacturer: NIDEK SA (France)",
  "brochure": "/uploads/pdfs/nidek-ot-6400.pdf",
  "sources": [
   "https://www.nidek.fr/en/unites-de-consultation/ot-6400/",
   "https://www.nidek.fr/wp-content/uploads/2021/08/brochure_OT_6400_2021_BD.pdf"
  ]
 },
 "nitro-1768234615532-i023jv6xk": {
  "brand": "nitrocare",
  "ref": "HB 8000 T",
  "fr": "Référence : NITRO HB 8000 T (Sante)\nType : lit de soins intensifs à colonnes avec pesée\nDimensions hors tout : 2260 × 1025 mm\nHauteur réglable : 520–920 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nPesée : système de pesée intégré\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions), commande sur barrière\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 8000 T (Sante)\nType: column-type intensive care bed with weight scale\nOverall dimensions: 2260 × 1025 mm\nHeight adjustment: 520–920 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nWeight scale: integrated weight scale system\nControls: hand control unit, nurse control panel (function lock-out), control panel on side rail\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 14)",
   "https://www.nitrocare.com.tr/urun/en/200"
  ]
 },
 "nitro-1768234615232-o2cm2wqhh": {
  "brand": "nitrocare",
  "ref": "HB 8000",
  "fr": "Référence : NITRO HB 8000 (Sante)\nType : lit de soins intensifs à colonnes\nDimensions hors tout : 2260 × 1025 mm\nHauteur réglable : 480–880 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions), commande sur barrière\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 8000 (Sante)\nType: column-type intensive care bed\nOverall dimensions: 2260 × 1025 mm\nHeight adjustment: 480–880 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out), control panel on side rail\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 16)",
   "https://www.nitrocare.com.tr/urun/en/160"
  ]
 },
 "nitro-1768234615524-hryhlhzqe": {
  "brand": "nitrocare",
  "ref": "HB 8000 B",
  "fr": "Référence : NITRO HB 8000 B (Sante)\nType : lit de soins intensifs bariatrique à colonnes\nDimensions hors tout : 2260 × 1025 mm\nLargeur extensible : 850–1155 mm (extension latérale droite et gauche)\nHauteur réglable : 480–880 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions), commande sur barrière\nBatterie : oui\nRCP : mécanique et électronique\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : HPL\nRoues : roues doubles pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 8000 B (Sante)\nType: column-type bariatric intensive care bed\nOverall dimensions: 2260 × 1025 mm\nWidth extension: 850–1155 mm (right and left side extension)\nHeight adjustment: 480–880 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out), control panel on side rail\nBattery: yes\nCPR: mechanical and electronic\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: HPL\nCastors: 360° swivel double castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 13)",
   "https://www.nitrocare.com.tr/urun/en/183"
  ]
 },
 "nitro-1768234615792-j418nj55x": {
  "brand": "nitrocare",
  "ref": "HB 5130",
  "fr": "Référence : NITRO HB 5130 (Compact)\nType : lit de soins intensifs à colonnes avec pesée\nDimensions hors tout : 2290 × 960 mm\nHauteur réglable : 505–905 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nPesée : système de pesée intégré\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions), commande sur barrière\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : 4, aluminium et HPL\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 5130 (Compact)\nType: column-type intensive care bed with weight scale\nOverall dimensions: 2290 × 960 mm\nHeight adjustment: 505–905 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nWeight scale: integrated weight scale system\nControls: hand control unit, nurse control panel (function lock-out), control panel on side rail\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, aluminium and HPL\nSide rails: 4, aluminium and HPL\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 19)",
   "https://www.nitrocare.com.tr/urun/en/2"
  ]
 },
 "nitro-1768234615799-qy0rjiwjd": {
  "brand": "nitrocare",
  "ref": "HB 5220",
  "fr": "Référence : NITRO HB 5220 (Compact)\nType : lit de soins intensifs à colonnes\nDimensions hors tout : 2290 × 960 mm\nHauteur réglable : 470–870 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions)\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : 4, aluminium et HPL\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 5220 (Compact)\nType: column-type intensive care bed\nOverall dimensions: 2290 × 960 mm\nHeight adjustment: 470–870 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out)\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, aluminium and HPL\nSide rails: 4, aluminium and HPL\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 20)",
   "https://www.nitrocare.com.tr/urun/en/3"
  ]
 },
 "nitro-1768234615805-xafncoiku": {
  "brand": "nitrocare",
  "ref": "HB 5230",
  "fr": "Référence : NITRO HB 5230 (Optima)\nType : lit de soins intensifs à colonnes\nDimensions hors tout : 2215 × 1065 mm\nHauteur réglable : 470–870 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions)\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : aluminium et HPL\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 5230 (Optima)\nType: column-type intensive care bed\nOverall dimensions: 2215 × 1065 mm\nHeight adjustment: 470–870 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out)\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, aluminium and HPL\nSide rails: aluminium and HPL\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 25)",
   "https://www.nitrocare.com.tr/urun/en/14"
  ]
 },
 "nitro-1768234615759-2tjj9f4l8": {
  "brand": "nitrocare",
  "ref": "HB 5110",
  "fr": "Référence : NITRO HB 5110 (Lateral Optima)\nType : lit de soins intensifs à colonnes avec inclinaison latérale\nDimensions hors tout : 2215 × 1065 mm\nHauteur réglable : 460–860 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (5 moteurs)\nInclinaison latérale : motorisée, gauche et droite\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions)\nBatterie : oui\nRCP : mécanique et électronique\nRadiographie : logement cassette radio au relève-buste (HPL)\nRallonge de lit : oui\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : aluminium et HPL\nPlan de couchage : ABS\nRoues : 4 roues pivotantes 360° Ø 150 mm, freinage centralisé ; 1 roue antistatique ; 5e roue Ø 125 mm\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 5110 (Lateral Optima)\nType: column-type intensive care bed with lateral tilt\nOverall dimensions: 2215 × 1065 mm\nHeight adjustment: 460–860 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (5 motors)\nLateral tilt: motorised, left and right\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out)\nBattery: yes\nCPR: mechanical and electronic\nX-ray: X-ray cassette holder at backrest (HPL)\nBed extension: yes\nHead and foot boards: removable, aluminium and HPL\nSide rails: aluminium and HPL\nMattress platform: ABS\nCastors: 4 × 360° swivel castors Ø 150 mm, central brake; 1 antistatic castor; 5th castor Ø 125 mm\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 23)",
   "https://www.nitrocare.com.tr/urun/en/13"
  ]
 },
 "nitro-1768234615753-7xdpp0llc": {
  "brand": "nitrocare",
  "ref": "HB 6240",
  "fr": "Référence : NITRO HB 6240 (Innova)\nType : lit de soins intensifs, lit bas (lowbed)\nDimensions hors tout : 2230 × 1070 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : 4, aluminium\nPlan de couchage : ABS\nRoues : pivotantes 360° Ø 125 mm, freinage centralisé\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 6240 (Innova)\nType: intensive care bed, low bed\nOverall dimensions: 2230 × 1070 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: removable, aluminium and HPL\nSide rails: 4, aluminium\nMattress platform: ABS\nCastors: 360° swivel castors Ø 125 mm, central brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 29)",
   "https://www.nitrocare.com.tr/urun/en/99"
  ]
 },
 "nitro-1768234615809-1b0nljmq3": {
  "brand": "nitrocare",
  "ref": "HB 4220",
  "fr": "Référence : NITRO HB 4220 (Fiesta)\nType : lit de soins intensifs, lit bas (lowbed)\nDimensions hors tout : 2230 × 1080 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : ABS\nRoues : pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 4220 (Fiesta)\nType: intensive care bed, low bed\nOverall dimensions: 2230 × 1080 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: ABS\nCastors: 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 35)",
   "https://www.nitrocare.com.tr/urun/en/19"
  ]
 },
 "nitro-1768234615814-61ynri9tz": {
  "brand": "nitrocare",
  "ref": "HB 4310",
  "fr": "Référence : NITRO HB 4310 (Optima)\nType : lit de soins intensifs, lit bas (lowbed)\nDimensions hors tout : 2215 × 1065 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : aluminium et HPL\nPlan de couchage : ABS\nRoues : pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 4310 (Optima)\nType: intensive care bed, low bed\nOverall dimensions: 2215 × 1065 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: removable, aluminium and HPL\nSide rails: aluminium and HPL\nMattress platform: ABS\nCastors: 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 36)",
   "https://www.nitrocare.com.tr/urun/en/75"
  ]
 },
 "nitro-1768234615820-wyetrnn6d": {
  "brand": "nitrocare",
  "ref": "HB 4410",
  "fr": "Référence : NITRO HB 4410 (Soft)\nType : lit de soins intensifs\nDimensions hors tout : 2160 × 1020 mm\nHauteur réglable : 505–895 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage relève-buste et relève-jambes)\nRCP : mécanique et électronique\nPanneaux tête et pied : MDF revêtu de membrane\nBarrières : bois massif revêtu de membrane\nRoues : pivotantes 360° Ø 125 mm, freinage centralisé ; roue antistatique\nBatterie : oui\nPorte-sérum : réglable en hauteur\nFinition : peinture poudre électrostatique\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 4410 (Soft)\nType: intensive care bed\nOverall dimensions: 2160 × 1020 mm\nHeight adjustment: 505–895 mm\nMotorised functions: backrest, legrest, height, Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (backrest and legrest lock-out)\nCPR: mechanical and electronic\nHead and foot boards: membrane-covered MDF\nSide rails: membrane-covered solid wood\nCastors: 360° swivel castors Ø 125 mm, central locking; antistatic castor\nBattery: yes\nIV pole: height adjustable\nFinish: electrostatic powder coating\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20190703173922/https://www.nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF page 32)",
   "https://www.nitrocare.com.tr/urun/en/31"
  ]
 },
 "nitro-1768234615748-10kpa46dv": {
  "brand": "nitrocare",
  "ref": "HB 6220",
  "fr": "Référence : NITRO HB 6220 (Compact Bariatric)\nType : lit d'hôpital bariatrique\nDimensions hors tout : 2155 × 1120 mm\nHauteur réglable : 460–860 mm\nCharge maximale (SWL) : 315 kg\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nExtension : longueur et largeur du lit (17 cm de chaque côté en largeur)\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage relève-buste et relève-jambes)\nRCP : mécanique et électronique\nPanneaux et barrières : amovibles, aluminium et stratifié compact\nRoues : pivotantes 360° Ø 150 mm, freinage centralisé ; 5e roue Ø 125 mm\nRadiographie : compatible\nBatterie : oui\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 6220 (Compact Bariatric)\nType: bariatric hospital bed\nOverall dimensions: 2155 × 1120 mm\nHeight adjustment: 460–860 mm\nSafe working load: 315 kg\nMotorised functions: backrest, legrest, height, Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nExtension: bed length and width (17 cm each side in width)\nControls: hand control unit, nurse control panel (backrest and legrest lock-out)\nCPR: mechanical and electronic\nBoards and side rails: removable, aluminium and compact laminate\nCastors: 360° swivel castors Ø 150 mm, central locking; 5th castor Ø 125 mm\nX-ray: yes\nBattery: yes\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20190703173922/https://www.nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF page 26)",
   "https://www.nitrocare.com.tr/urun/en/84",
   "https://www.nitrocare.com.tr/urun/tr/84"
  ]
 },
 "nitro-1768234615824-bwha8ldg8": {
  "brand": "nitrocare",
  "ref": "HB 4430 P",
  "fr": "Référence : NITRO HB 4430 P (Compact)\nType : lit de soins intensifs pédiatrique\nDimensions hors tout : 1995 × 900 mm\nHauteur réglable : 550–930 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage des fonctions)\nBatterie : oui\nRCP : mécanique et électronique\nPanneaux tête et pied : amovibles, aluminium et HPL\nBarrières : 4, aluminium et HPL\nPlan de couchage : métal\nRoues : pivotantes 360° Ø 125 mm, frein linéaire ; roue antistatique\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 4430 P (Compact)\nType: pediatric intensive care bed\nOverall dimensions: 1995 × 900 mm\nHeight adjustment: 550–930 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (function lock-out)\nBattery: yes\nCPR: mechanical and electronic\nHead and foot boards: removable, aluminium and HPL\nSide rails: 4, aluminium and HPL\nMattress platform: metal\nCastors: 360° swivel castors Ø 125 mm, linear brake; antistatic castor\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 55)",
   "https://www.nitrocare.com.tr/urun/en/1"
  ]
 },
 "nitro-1768234615733-hpmofa1ho": {
  "brand": "nitrocare",
  "ref": "HB 7250",
  "fr": "Référence : NITRO HB 7250 (King / Single)\nType : lit de soins, lit bas (lowbed)\nDimensions hors tout : 2130 × 1200 mm (King) ; 2130 × 1030 mm (Single)\nLargeur intérieure : 1090 mm (King) ; 920 mm (Single)\nHauteur réglable : 290–665 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur (3 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : bois (décor)\nBarrières : 2, métal\nPlan de couchage : métal\nRoues : métal, pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 7250 (King / Single)\nType: care bed, low bed\nOverall dimensions: 2130 × 1200 mm (King); 2130 × 1030 mm (Single)\nInner width: 1090 mm (King); 920 mm (Single)\nHeight adjustment: 290–665 mm\nMotorised functions: backrest, legrest, height (3 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: wood decor\nSide rails: 2, metal\nMattress platform: metal\nCastors: metal, 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 71)",
   "https://www.nitrocare.com.tr/urun/en/178"
  ]
 },
 "nitro-1768234615743-ir7egark0": {
  "brand": "nitrocare",
  "ref": "HB 7260 F",
  "fr": "Référence : NITRO HB 7260 F (Serra 2)\nType : lit de soins à domicile, lit bas (lowbed)\nDimensions hors tout : 2110 × 1100 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : bois (décor) revêtu de tissu ; habillage latéral bois revêtu de tissu\nBarrières : 4, aluminium\nPlan de couchage : métal\nRoues : pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 7260 F (Serra 2)\nType: home care bed, low bed\nOverall dimensions: 2110 × 1100 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: wood decor covered with textile; wooden side decors covered with textile\nSide rails: 4, aluminium\nMattress platform: metal\nCastors: 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 64)",
   "https://www.nitrocare.com.tr/urun/en/189"
  ]
 },
 "nitro-1768234615738-kz931hoxf": {
  "brand": "nitrocare",
  "ref": "HB 7260",
  "fr": "Référence : NITRO HB 7260 (Serra 2)\nType : lit de soins à domicile, lit bas (lowbed)\nDimensions hors tout : 2090 × 1075 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : bois (décor) ; habillage latéral bois\nBarrières : 4, aluminium\nPlan de couchage : métal\nRoues : pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 7260 (Serra 2)\nType: home care bed, low bed\nOverall dimensions: 2090 × 1075 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: wood decor; wooden side decors\nSide rails: 4, aluminium\nMattress platform: metal\nCastors: 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 65)",
   "https://www.nitrocare.com.tr/urun/en/163"
  ]
 },
 "nitro-1768234615565-qre9zazb5": {
  "brand": "nitrocare",
  "ref": "HB 7240",
  "fr": "Référence : NITRO HB 7240 (Serra)\nType : lit de soins à domicile, lit bas (lowbed)\nDimensions hors tout : 2090 × 1020 mm\nHauteur réglable : 370–800 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : bois (décor)\nBarrières : 4, aluminium et HPL\nPlan de couchage : métal\nRoues : métal, pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 7240 (Serra)\nType: home care bed, low bed\nOverall dimensions: 2090 × 1020 mm\nHeight adjustment: 370–800 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: wood decor\nSide rails: 4, aluminium and HPL\nMattress platform: metal\nCastors: metal, 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 67)",
   "https://www.nitrocare.com.tr/urun/en/155"
  ]
 },
 "nitro-1768234615558-5wqf9o1c6": {
  "brand": "nitrocare",
  "ref": "HB 7000 W",
  "fr": "Référence : NITRO HB 7000 W (Serenity)\nType : lit de soins à domicile, lit bas (lowbed)\nDimensions hors tout : 2190 × 1035 mm\nHauteur réglable : 290–690 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur, Trendelenburg / anti-Trendelenburg (4 moteurs)\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux et barrières : bois (décor), panneaux tête et pied décor bois des deux côtés\nPlan de couchage : métal\nRoues : métal, pivotantes 360° Ø 125 mm, frein linéaire\nParticularité : pliable et transportable\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 7000 W (Serenity)\nType: home care bed, low bed\nOverall dimensions: 2190 × 1035 mm\nHeight adjustment: 290–690 mm\nMotorised functions: backrest, legrest, height, Trendelenburg / reverse Trendelenburg (4 motors)\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nBoards and side rails: wood; head and foot boards with wood decor on both sides\nMattress platform: metal\nCastors: metal, 360° swivel castors Ø 125 mm, linear brake\nFeature: foldable and transportable\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 69)",
   "https://www.nitrocare.com.tr/urun/en/133"
  ]
 },
 "nitro-1768234615543-zpe2htjtt": {
  "brand": "nitrocare",
  "ref": "HB 8130",
  "fr": "Référence : NITRO HB 8130 (Sante)\nType : lit patient, lit bas (lowbed)\nDimensions hors tout : 2260 × 1025 mm\nHauteur réglable : 390–770 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur (3 moteurs)\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, commande centrale sur barrière\nRCP : mécanique\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : ABS\nRoues : pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 8130 (Sante)\nType: patient bed, low bed\nOverall dimensions: 2260 × 1025 mm\nHeight adjustment: 390–770 mm\nMotorised functions: backrest, legrest, height (3 motors)\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, central control on side rail\nCPR: mechanical\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: ABS\nCastors: 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 39)",
   "https://www.nitrocare.com.tr/urun/en/168"
  ]
 },
 "nitro-1768234615862-fbkjvouje": {
  "brand": "nitrocare",
  "ref": "HB 1310",
  "fr": "Référence : NITRO HB 1310\nType : lit d'hôpital hydraulique manuel\nDimensions hors tout : 2230 × 1080 mm\nHauteur réglable : 525–845 mm\nRéglage de hauteur : pompe hydraulique\nRelève-buste / relève-jambes : vérins à gaz\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nPanneaux tête et pied : amovibles, ABS\nBarrières : 2, métal, rabattables\nPlan de couchage : métal\nRoues : métal, pivotantes 360° Ø 125 mm, frein linéaire\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 1310\nType: manual hydraulic hospital bed\nOverall dimensions: 2230 × 1080 mm\nHeight adjustment: 525–845 mm\nHeight adjustment system: hydraulic pump\nBackrest / legrest: gas springs\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nHead and foot boards: removable, ABS\nSide rails: 2, metal, folding\nMattress platform: metal\nCastors: metal, 360° swivel castors Ø 125 mm, linear brake\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 51)",
   "https://www.nitrocare.com.tr/urun/en/171"
  ]
 },
 "nitro-1768234615847-4husrqyc0": {
  "brand": "nitrocare",
  "ref": "HB 2220",
  "fr": "Référence : NITRO HB 2220 (Fiesta)\nType : lit patient\nDimensions hors tout : 2230 × 1085 mm\nHauteur du plan de couchage : 505 mm\nFonctions motorisées : relève-buste, relève-jambes (2 moteurs)\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : amovibles, ABS\nBarrières : 4, ABS\nPlan de couchage : ABS\nRoues : pivotantes 360° Ø 125 mm, frein linéaire et blocage directionnel\nPorte-sérum : réglable en hauteur\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 2220 (Fiesta)\nType: patient bed\nOverall dimensions: 2230 × 1085 mm\nPlatform height: 505 mm\nMotorised functions: backrest, legrest (2 motors)\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: removable, ABS\nSide rails: 4, ABS\nMattress platform: ABS\nCastors: 360° swivel castors Ø 125 mm, linear brake and directional lock\nIV pole: height adjustable\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogtr.pdf (PDF page 47)",
   "https://www.nitrocare.com.tr/urun/en/21"
  ]
 },
 "nitro-1768234615853-sdujvm3qm": {
  "brand": "nitrocare",
  "ref": "HB 2310",
  "fr": "Référence : NITRO HB 2310 (Soft)\nType : lit patient\nDimensions hors tout : 2160 × 1020 mm\nHauteur du plan de couchage : 530 mm\nFonctions motorisées : relève-buste, relève-jambes (2 moteurs)\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient\nRCP : mécanique\nPanneaux tête et pied : MDF revêtu de membrane\nBarrières : stratifié revêtu de membrane, rabattables\nRoues : pivotantes 360° Ø 125 mm, frein linéaire et blocage directionnel ; roue antistatique\nPorte-sérum : réglable en hauteur\nFinition : peinture poudre électrostatique\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 2310 (Soft)\nType: patient bed\nOverall dimensions: 2160 × 1020 mm\nPlatform height: 530 mm\nMotorised functions: backrest, legrest (2 motors)\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit\nCPR: mechanical\nHead and foot boards: membrane-covered MDF\nSide rails: membrane-covered laminate, folding\nCastors: 360° swivel castors Ø 125 mm, linear brake and directional lock; antistatic castor\nIV pole: height adjustable\nFinish: electrostatic powder coating\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20190703173922/https://www.nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF page 51)",
   "https://www.nitrocare.com.tr/urun/en/33"
  ]
 },
 "nitro-1768234615829-hjj4og5y6": {
  "brand": "nitrocare",
  "ref": "HB 3110",
  "fr": "Référence : NITRO HB 3110 (Compact)\nType : lit patient électrique\nDimensions hors tout : 2150 × 1060 mm\nHauteur réglable : 525–845 mm\nFonctions motorisées : relève-buste, relève-jambes, hauteur (3 moteurs)\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage relève-buste et relève-jambes)\nRCP : mécanique\nPanneaux et barrières : amovibles, aluminium et stratifié compact\nRoues : pivotantes 360° Ø 125 mm, freinage centralisé\nRadiographie : compatible\nPorte-sérum : réglable en hauteur\nFinition : peinture poudre électrostatique\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 3110 (Compact)\nType: electric patient bed\nOverall dimensions: 2150 × 1060 mm\nHeight adjustment: 525–845 mm\nMotorised functions: backrest, legrest, height (3 motors)\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (backrest and legrest lock-out)\nCPR: mechanical\nBoards and side rails: removable, aluminium and compact laminate\nCastors: 360° swivel castors Ø 125 mm, central locking\nX-ray: yes\nIV pole: height adjustable\nFinish: electrostatic powder coating\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20190703173922/https://www.nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF page 37)",
   "https://www.nitrocare.com.tr/urun/en/113",
   "https://www.nitrocare.com.tr/urun/tr/113"
  ]
 },
 "nitro-1768234615834-6z9hhyuao": {
  "brand": "nitrocare",
  "ref": "HB 3130",
  "fr": "Référence : NITRO HB 3130\nType : lit patient\nFonctions motorisées : relève-buste, relève-jambes\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage relève-buste et relève-jambes)\nRCP : mécanique\nPanneaux tête et pied : amovibles, aluminium et stratifié compact\nRoues : pivotantes 360° Ø 125 mm, frein linéaire et blocage directionnel\nPorte-sérum : réglable en hauteur\nFinition : peinture poudre électrostatique\nMatelas : mousse densité 32, antibactérien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 3130\nType: patient bed\nMotorised functions: backrest, legrest\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (backrest and legrest lock-out)\nCPR: mechanical\nHead and foot boards: removable, aluminium and compact laminate\nCastors: 360° swivel castors Ø 125 mm, linear brake and directional lock\nIV pole: height adjustable\nFinish: electrostatic powder coating\nMattress: density 32 foam, antibacterial\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/urun/en/8"
  ]
 },
 "nitro-1768234615842-rxwq9wjd0": {
  "brand": "nitrocare",
  "ref": "HB 3320",
  "fr": "Référence : NITRO HB 3320 (Fiesta)\nType : lit patient\nFonctions motorisées : relève-buste, relève-jambes, hauteur (3 moteurs)\nTrendelenburg / anti-Trendelenburg : mécanique, par vérin amortisseur\nPositions : Fowler, vasculaire\nPlicature des genoux : réglage manuel par mécanisme cranté\nCommandes : télécommande patient, panneau de commande infirmier (verrouillage relève-buste et relève-jambes), commande sur barrière\nRCP : mécanique\nPanneaux et barrières : amovibles, polypropylène\nRoues : pivotantes 360° Ø 125 mm, frein linéaire et blocage directionnel\nPorte-sérum : réglable en hauteur\nFinition : peinture poudre électrostatique\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NITRO HB 3320 (Fiesta)\nType: patient bed\nMotorised functions: backrest, legrest, height (3 motors)\nTrendelenburg / Reverse Trendelenburg: mechanical, with damper mechanism\nPositions: Fowler, vascular\nKnee break: manual adjustment with gradual mechanism\nControls: hand control unit, nurse control panel (backrest and legrest lock-out), guard rail controller\nCPR: mechanical\nBoards and side rails: removable, polypropylene\nCastors: 360° swivel castors Ø 125 mm, linear brake and directional lock\nIV pole: height adjustable\nFinish: electrostatic powder coating\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20160212061011/http://www.nitrocare.com.tr/katalog_2014.pdf (PDF page 30)",
   "https://www.nitrocare.com.tr/urun/en/20"
  ]
 },
 "nitro-1768234615866-sagd4xikn": {
  "brand": "nitrocare",
  "ref": "SD 01",
  "fr": "Référence : NTCR SD 01\nType : brancard d'urgence à commande mécanique\nDimensions hors tout : 2095 × 840 mm\nHauteur réglable : 515–790 mm (vérin hydraulique)\nTrendelenburg / Anti-Trendelenburg : oui, par amortisseur\nDossier : réglable par amortisseur\nPlan de couchage : métal\nBarrières : métalliques rabattables et verrouillables, peinture poudre électrostatique\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable, pare-chocs, panier, porte-serviettes, porte-sac à urine, ceinture\nOptions : roues Ø 200 mm à freinage centralisé, tablette défibrillateur, porte-jambes (2), plan de couchage HPL\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 01\nType: mechanical system patient stretcher\nOverall dimensions: 2095 × 840 mm\nHeight adjustment: 515–790 mm (hydraulic lift)\nTrendelenburg / Reverse Trendelenburg: yes, damper system\nBackrest: adjustable with damper system\nBed surface: metal\nSide rails: folding, lockable metal rails, electrostatic powder coated\nCastors: Ø 125 mm, 360° swivel, central brake\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress, bumpers, basket, towel rack, urine bag holder, belt\nOptions: Ø 200 mm central-brake castors, defibrillator table, leg holder set (2), HPL bed surface\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 86)",
   "https://www.nitrocare.com.tr/urun/en/82_ntcr-sd01-patient-treatment-stretcher"
  ]
 },
 "nitro-1768234615873-zss2imcaf": {
  "brand": "nitrocare",
  "ref": "SD 01 P",
  "fr": "Référence : NTCR SD 01 P\nType : brancard pédiatrique d'urgence à commande mécanique\nDimensions hors tout : 1600 × 840 mm\nHauteur réglable : 515–790 mm (vérin hydraulique)\nTrendelenburg / Anti-Trendelenburg : oui, par amortisseur\nDossier : réglable par amortisseur\nPlan de couchage : métal\nBarrières : métalliques rabattables et verrouillables, peinture poudre électrostatique\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable, pare-chocs, panier, porte-serviettes, porte-sac à urine, ceinture\nOptions : roues Ø 200 mm à freinage centralisé, tablette défibrillateur, porte-jambes (2)\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 01 P\nType: mechanical system pediatric patient stretcher\nOverall dimensions: 1600 × 840 mm\nHeight adjustment: 515–790 mm (hydraulic lift)\nTrendelenburg / Reverse Trendelenburg: yes, damper system\nBackrest: adjustable with damper system\nBed surface: metal\nSide rails: folding, lockable metal rails, electrostatic powder coated\nCastors: Ø 125 mm, 360° swivel, central brake\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress, bumpers, basket, towel rack, urine bag holder, belt\nOptions: Ø 200 mm central-brake castors, defibrillator table, leg holder set (2)\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 87)"
  ]
 },
 "nitro-1768234615878-fjf6lbqcn": {
  "brand": "nitrocare",
  "ref": "SD 04",
  "fr": "Référence : NTCR SD 04\nType : brancard d'urgence à commande hydraulique\nDimensions hors tout : 2145 × 840 mm\nHauteur réglable : 610–910 mm (vérin hydraulique)\nTrendelenburg / Anti-Trendelenburg : oui, par vérin hydraulique\nDossier : réglable par amortisseur ; RCP mécanique\nPlan de couchage : métal\nBarrières : 2 barrières métalliques rabattables et verrouillables, peinture poudre électrostatique\nRoues : Ø 200 mm, pivotantes 360°, freinage centralisé, blocage directionnel\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable (densité 36), pare-chocs, porte-sac à urine, logements accessoires, ceinture\nOptions : appui-tête, tablette défibrillateur, plan de couchage HPL\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 04\nType: hydraulic system emergency stretcher\nOverall dimensions: 2145 × 840 mm\nHeight adjustment: 610–910 mm (hydraulic lift)\nTrendelenburg / Reverse Trendelenburg: yes, hydraulic lift\nBackrest: adjustable with damper system; mechanical CPR\nBed surface: metal\nSide rails: 2 folding, lockable metal rails, electrostatic powder coated\nCastors: Ø 200 mm, 360° swivel, central brake, directional lock\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress (density 36), bumpers, urine bag holder, accessory slots, belt\nOptions: head restraint system, defibrillator table, full HPL bed surface\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 85)",
   "https://www.nitrocare.com.tr/urun/en/36_ntcr-sd04-emergency-strecher"
  ]
 },
 "nitro-1768234615884-79fnoahxh": {
  "brand": "nitrocare",
  "ref": "SD 05",
  "fr": "Référence : NTCR SD 05\nType : brancard d'urgence à commande hydraulique\nDimensions hors tout : 2145 × 840 mm\nHauteur réglable : 615–915 mm (vérin hydraulique)\nTrendelenburg / Anti-Trendelenburg : oui, par vérin hydraulique\nDossier : réglable par amortisseur\nPlan de couchage : HPL intégral ; radiotransparent sur toute la longueur avec porte-cassette radio\nBarrières : 2 barrières aluminium + inox rabattables\nRoues : Ø 200 mm, pivotantes 360°, freinage centralisé ; 5e roue Ø 125 mm\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable, pare-chocs, panier, porte-serviettes, porte-sac à urine, ceinture\nOptions : appui-tête, tablette défibrillateur, poignée intégrale côté pieds\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 05\nType: hydraulic system emergency stretcher\nOverall dimensions: 2145 × 840 mm\nHeight adjustment: 615–915 mm (hydraulic lift)\nTrendelenburg / Reverse Trendelenburg: yes, hydraulic lift\nBackrest: adjustable with damper system\nBed surface: full HPL; full X-ray (head to foot) with X-ray cassette holder\nSide rails: 2 folding aluminium + stainless steel rails\nCastors: Ø 200 mm, 360° swivel, central brake; 5th castor Ø 125 mm\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress, bumpers, basket, towel rack, urine bag holder, belt\nOptions: head restraint system, defibrillator table, full handle on footboard\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 84)"
  ]
 },
 "nitro-1768234615889-m8gnet1h5": {
  "brand": "nitrocare",
  "ref": "SD 06",
  "fr": "Référence : NTCR SD 06\nType : brancard de transfert à commande mécanique (2 chariots + plateau supérieur coulissant)\nDimensions hors tout : 2145 × 840 mm (chariot) ; longueur 4100 mm (2 chariots accouplés)\nHauteur : 810 mm\nDossier : réglable par amortisseur\nPlan de couchage : HPL intégral ; radiotransparent sur toute la longueur avec porte-cassette radio sur rail coulissant\nBarrières : 2 barrières aluminium + inox rabattables\nRoues : Ø 150 mm, pivotantes 360°, freinage centralisé\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable, pare-chocs, porte-sac à urine, logements accessoires, ceinture\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 06\nType: mechanical system transfer stretcher (2 trolleys + sliding upper platform)\nOverall dimensions: 2145 × 840 mm (trolley); 4100 mm length (2 trolleys coupled)\nHeight: 810 mm\nBackrest: adjustable with damper system\nBed surface: full HPL; full X-ray (head to foot) with cassette holder on sliding rail\nSide rails: 2 folding aluminium + stainless steel rails\nCastors: Ø 150 mm, 360° swivel, central brake\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress, bumpers, urine bag holder, accessory slots, belt\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 89)",
   "https://www.nitrocare.com.tr/urun/en/34_ntcr-sd06-patient-transfer-stretcher"
  ]
 },
 "nitro-1768234615893-h0etcgbtv": {
  "brand": "nitrocare",
  "ref": "SD 15",
  "fr": "Référence : NTCR SD 15\nType : brancard d'urgence à commande hydraulique\nDimensions hors tout : 2145 × 840 mm\nHauteur réglable : 620–900 mm (vérin hydraulique)\nTrendelenburg / Anti-Trendelenburg : oui, par vérin hydraulique\nFonctions : dossier, relève-jambes, dossier + jambes, plicature genoux, hauteur, Trendelenburg / Anti-Trendelenburg\nDossier : réglable par amortisseur\nPlan de couchage : HPL intégral ; radiotransparent sur toute la longueur avec porte-cassette radio\nBarrières : 2 barrières aluminium + inox rabattables\nRoues : Ø 200 mm, pivotantes 360°, freinage centralisé ; 5e roue Ø 125 mm\nÉquipements : porte-bouteille d'oxygène, potence à sérum réglable, matelas antibactérien imperméable, pare-chocs, panier, porte-serviettes, porte-sac à urine, ceinture\nOptions : appui-tête, tablette défibrillateur, poignée intégrale côté pieds\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SD 15\nType: hydraulic system emergency stretcher\nOverall dimensions: 2145 × 840 mm\nHeight adjustment: 620–900 mm (hydraulic lift)\nTrendelenburg / Reverse Trendelenburg: yes, hydraulic lift\nFunctions: backrest, legrest, backrest + legrest, knee break, height, Trendelenburg / Reverse Trendelenburg\nBackrest: adjustable with damper system\nBed surface: full HPL; full X-ray (head to foot) with X-ray cassette holder\nSide rails: 2 folding aluminium + stainless steel rails\nCastors: Ø 200 mm, 360° swivel, central brake; 5th castor Ø 125 mm\nEquipment: oxygen cylinder holder, height-adjustable IV pole, antibacterial waterproof mattress, bumpers, basket, towel rack, urine bag holder, belt\nOptions: head restraint system, defibrillator table, full handle on footboard\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 78)",
   "https://www.nitrocare.com.tr/urun/en/198_ntcr-sd-15-hydraulic-system-emergency-stretcher"
  ]
 },
 "nitro-1768234615897-4uuoxusv4": {
  "brand": "nitrocare",
  "ref": "SIGMA",
  "fr": "Référence : NTCR SIGMA (SD 03)\nType : brancard compatible arceau (C-Arm)\nDimensions hors tout : 2185 × 920 mm\nDimensions du plan de couchage : 2070 × 800 mm\nHauteur réglable : 600–1000 mm (2 colonnes électriques)\nMoteurs : 2\nTrendelenburg / Anti-Trendelenburg : oui, par les 2 colonnes motorisées\nDossier : réglable en angle ; RCP manuelle\nPlan de couchage : bois compact (dossier, assise, jambes)\nRoues : Ø 125 mm, pivotantes 360°, dont 1 antistatique\nÉquipements : barrières réglables, poignée de poussée, pédale de frein, télécommande, logement potence à sérum côté tête\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SIGMA (SD 03)\nType: C-arm stretcher\nOverall dimensions: 2185 × 920 mm\nPlatform dimensions: 2070 × 800 mm\nHeight adjustment: 600–1000 mm (2 electric columns)\nMotors: 2\nTrendelenburg / Reverse Trendelenburg: yes, via the 2 motorised columns\nBackrest: angle adjustable; manual CPR\nBed surface: compact wood (backrest, seat, leg section)\nCastors: Ø 125 mm, 360° swivel, 1 antistatic\nEquipment: adjustable side rails, push handle, brake pedal, hand control unit, IV pole slot at head end\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 94)",
   "https://www.nitrocare.com.tr/urun/en/210_ntcr-sigma--c-arm-stretcher---c-arm-stretcher"
  ]
 },
 "nitro-1768234615936-r058tcgsf": {
  "brand": "nitrocare",
  "ref": "NHS 870",
  "fr": "Référence : NHS 870\nType : fauteuil de dialyse à colonne hydraulique (dialyse et prélèvement sanguin)\nDimensions hors tout : 2195 × 755 mm\nHauteur réglable : 620–820 mm (vérin hydraulique)\nRéglages : dossier, relève-jambes, Trendelenburg / Anti-Trendelenburg par amortisseurs ; position lit\nCommande : pédales (frein et hauteur)\nRevêtement : similicuir sur mousse\nAccoudoirs : polyuréthane, réglables en hauteur et en angle\nRoues : Ø 150 mm, pivotantes 360°, freinage centralisé\nÉquipements : potence à sérum réglable, coussin d'appui-tête, pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NHS 870\nType: hydraulic column system dialysis chair (dialysis and blood donation)\nOverall dimensions: 2195 × 755 mm\nHeight adjustment: 620–820 mm (hydraulic system)\nAdjustments: headrest, legrest, Trendelenburg / Reverse Trendelenburg with dampers; bed position\nControl: foot pedals (brake and height)\nUpholstery: artificial leather on foam\nArmrests: polyurethane, height and angle adjustable\nCastors: Ø 150 mm, 360° swivel, central brake\nEquipment: height-adjustable IV pole, headrest pillow, protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 128)"
  ]
 },
 "nitro-1768234615941-rfibwth2b": {
  "brand": "nitrocare",
  "ref": "NHS 900",
  "fr": "Référence : NHS 900\nType : fauteuil de dialyse 4 moteurs\nMoteurs : 4 (dossier, jambes, hauteur, Trendelenburg / Anti-Trendelenburg)\nHauteur réglable : 590–990 mm\nLargeur d'assise : 600 mm\nFonctions : positions fauteuil et lit, position TV, dossier verrouillable à tout angle, repose-pieds extensible\nCommande : télécommande ; batterie\nRevêtement : similicuir sur mousse polyuréthane ; coussin d'assise visco 5 cm\nAccoudoirs : polyuréthane, réglables en hauteur et en angle\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé\nÉquipements : potence à sérum réglable, coussin d'appui-tête, poignées de poussée, RCP manuelle\nOptions : pédalier de commande\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NHS 900\nType: four-motor dialysis chair\nMotors: 4 (backrest, legrest, height, Trendelenburg / Reverse Trendelenburg)\nHeight adjustment: 590–990 mm\nSeat width: 600 mm\nFunctions: chair and bed positions, TV-out position, backrest lockable at any angle, extendable footrest\nControl: hand control unit; battery\nUpholstery: artificial leather on polyurethane foam; 5 cm visco seat pillow\nArmrests: polyurethane, height and angle adjustable\nCastors: Ø 125 mm, 360° swivel, central brake\nEquipment: height-adjustable IV pole, headrest pillow, push handles, manual CPR\nOptions: foot control panel\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 126)",
   "https://www.nitrocare.com.tr/urun/en/148_nhs-900-dialysis-chair"
  ]
 },
 "nitro-1768234615903-vng13tat7": {
  "brand": "nitrocare",
  "ref": "NTS X5",
  "fr": "Référence : NTS X5\nType : fauteuil de transport patient emboîtable\nDimensions hors tout : 1140 × 470 × 980 mm\nHauteur d'assise : 530 mm\nProfondeur d'assise : 430 mm\nChâssis : acier inoxydable\nAssise et dossier : matériau intégral\nAccoudoirs : rabattables, matériau intégral\nRepose-pieds : escamotable, armature métallique\nRoues : pivotantes 360° : avant Ø 125 mm, arrière Ø 200 mm ; freinage centralisé\nÉquipements : potence à sérum réglable\nOptions : station de stationnement, verrou à pièce, appui de maintien, ceinture\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X5\nType: nestable patient transport chair\nOverall dimensions: 1140 × 470 × 980 mm\nSeat height: 530 mm\nSeat depth: 430 mm\nFrame: stainless steel\nSeat and backrest: integral material\nArmrests: foldable, integral material\nFootrest: hidable, metal frame\nCastors: 360° swivel: front Ø 125 mm, rear Ø 200 mm; central brake\nEquipment: height-adjustable IV pole\nOptions: park station, coin lock, supporting position, belt\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 101)",
   "https://www.nitrocare.com.tr/urun/en/58_nts-x5-patient-transport-chair-"
  ]
 },
 "nitro-1768234615923-5xqwsopds": {
  "brand": "nitrocare",
  "ref": "NTS X10",
  "fr": "Référence : NTS X10\nType : fauteuil de transport patient emboîtable\nDimensions hors tout : 1140 × 470 × 980 mm\nHauteur d'assise : 530 mm\nProfondeur d'assise : 430 mm\nChâssis : métal à peinture poudre électrostatique (antibactérienne, couleurs au choix)\nAssise et dossier : matériau intégral\nAccoudoirs : rabattables, matériau intégral\nRepose-pieds : escamotable, armature métallique\nRoues : pivotantes 360° : avant Ø 125 mm, arrière Ø 200 mm ; freinage centralisé\nÉquipements : potence à sérum réglable\nOptions : station de stationnement, verrou à pièce, appui de maintien, ceinture\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X10\nType: nestable patient transport chair\nOverall dimensions: 1140 × 470 × 980 mm\nSeat height: 530 mm\nSeat depth: 430 mm\nFrame: electrostatic powder coated metal (antibacterial, colour options)\nSeat and backrest: integral material\nArmrests: foldable, integral material\nFootrest: hidable, metal frame\nCastors: 360° swivel: front Ø 125 mm, rear Ø 200 mm; central brake\nEquipment: height-adjustable IV pole\nOptions: park station, coin lock, supporting position, belt\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 102)",
   "https://www.nitrocare.com.tr/urun/en/87_nts-x10-patient-transport-chair-"
  ]
 },
 "nitro-1768234615909-r6a8zl8w5": {
  "brand": "nitrocare",
  "ref": "NTS X6",
  "fr": "Référence : NTS X6\nType : fauteuil de transport multifonction\nDimensions hors tout : 820–1095 × 640 × 1120 mm\nHauteur d'assise : 460 mm\nLargeur d'assise : 500 mm\nProfondeur d'assise : 430 mm\nFonctions : dossier et repose-jambes synchronisés par poignée jusqu'à la position horizontale\nRepose-pieds : HPL, suit les mouvements du patient\nAssise et dossier : polyuréthane ; dossier inclinable\nAccoudoirs : polyuréthane, rabattables progressivement\nRoues : pivotantes 360° : avant Ø 300 mm, arrière Ø 125 mm ; frein centralisé sur les 2 roues arrière\nÉquipements : potence à sérum réglable, coussin d'appui-tête réglable, poignées de poussée\nOptions : tablette repas, panier métallique de dossier\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X6\nType: multifunctional transport chair\nOverall dimensions: 820–1095 × 640 × 1120 mm\nSeat height: 460 mm\nSeat width: 500 mm\nSeat depth: 430 mm\nFunctions: backrest and legrest synchronised by hand lever to horizontal position\nFootrest: HPL, compliant with patient movements\nSeat and backrest: polyurethane; reclining backrest\nArmrests: polyurethane, gradual opening and closing\nCastors: 360° swivel: front Ø 300 mm, rear Ø 125 mm; central brake on 2 rear castors\nEquipment: height-adjustable IV pole, adjustable headrest pillow, push handles\nOptions: overbed table, backrest metal basket\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 104)",
   "https://www.nitrocare.com.tr/urun/en/73_nts-x6-patient-transport-chair-"
  ]
 },
 "nitro-1768234615918-mta9bwbvs": {
  "brand": "nitrocare",
  "ref": "NTS X8",
  "fr": "Référence : NTS X8\nType : fauteuil de transport multifonction réglable en hauteur\nDimensions hors tout : 820–1095 × 640 × 1100–1250 mm\nHauteur d'assise : 500–660 mm (vérin hydraulique, pédale)\nLargeur d'assise : 500 mm\nProfondeur d'assise : 430 mm\nFonctions : dossier et repose-jambes synchronisés par poignée jusqu'à la position horizontale\nAssise et dossier : polyuréthane ; dossier inclinable\nAccoudoirs : polyuréthane, rabattables progressivement\nRoues : pivotantes 360° : avant Ø 300 mm, arrière Ø 125 mm ; frein centralisé sur les 2 roues arrière\nÉquipements : potence à sérum réglable, coussin d'appui-tête réglable, poignées de poussée\nOptions : tablette repas, repose-pieds HPL\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X8\nType: height-adjustable multifunctional transport chair\nOverall dimensions: 820–1095 × 640 × 1100–1250 mm\nSeat height: 500–660 mm (hydraulic lift, pedal)\nSeat width: 500 mm\nSeat depth: 430 mm\nFunctions: backrest and legrest synchronised by hand lever to horizontal position\nSeat and backrest: polyurethane; reclining backrest\nArmrests: polyurethane, gradual opening and closing\nCastors: 360° swivel: front Ø 300 mm, rear Ø 125 mm; central brake on 2 rear castors\nEquipment: height-adjustable IV pole, adjustable headrest pillow, push handles\nOptions: overbed table, HPL footboard\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 105)",
   "https://www.nitrocare.com.tr/urun/en/134_nts-x8-patient-transport-chair-with-height-adjustment"
  ]
 },
 "nitro-1768234615931-7v1cpf0qt": {
  "brand": "nitrocare",
  "ref": "NTS X12",
  "fr": "Référence : NTS X12\nType : fauteuil de transport bariatrique multifonction (extra-large)\nDimensions hors tout : 820–1095 × 675 × 1120 mm\nHauteur d'assise : 460 mm\nLargeur d'assise : 600 mm\nProfondeur d'assise : 430 mm\nFonctions : dossier et repose-jambes synchronisés par poignée jusqu'à la position horizontale\nRepose-pieds : HPL, suit les mouvements du patient\nAssise et dossier : polyuréthane ; dossier inclinable\nAccoudoirs : polyuréthane, rabattables progressivement\nRoues : pivotantes 360° : avant Ø 300 mm, arrière Ø 125 mm ; frein centralisé sur les 2 roues arrière\nÉquipements : potence à sérum réglable, coussin d'appui-tête réglable, poignées de poussée\nOptions : tablette repas, panier métallique de dossier\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X12\nType: multifunctional bariatric transport chair (extra large)\nOverall dimensions: 820–1095 × 675 × 1120 mm\nSeat height: 460 mm\nSeat width: 600 mm\nSeat depth: 430 mm\nFunctions: backrest and legrest synchronised by hand lever to horizontal position\nFootrest: HPL, compliant with patient movements\nSeat and backrest: polyurethane; reclining backrest\nArmrests: polyurethane, gradual opening and closing\nCastors: 360° swivel: front Ø 300 mm, rear Ø 125 mm; central brake on 2 rear castors\nEquipment: height-adjustable IV pole, adjustable headrest pillow, push handles\nOptions: overbed table, backrest metal basket\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 106)",
   "https://www.nitrocare.com.tr/urun/en/115_nts-x12-bariatric-transport-chair"
  ]
 },
 "nitro-1768234615913-b7h5nruvy": {
  "brand": "nitrocare",
  "ref": "NTS X7",
  "fr": "Référence : NTS X7\nType : fauteuil de prélèvement sanguin multifonction\nDimensions hors tout : 820–1095 × 800 × 1120 mm\nHauteur d'assise : 460 mm\nLargeur d'assise : 500 mm\nProfondeur d'assise : 430 mm\nFonctions : dossier et repose-jambes synchronisés par poignée jusqu'à la position horizontale\nAppuie-bras : réglables, pour prélèvement sanguin\nRepose-pieds : HPL escamotable, suit les mouvements du patient\nAssise et dossier : polyuréthane ; dossier inclinable\nAccoudoirs : polyuréthane, rabattables progressivement\nRoues : pivotantes 360° : avant Ø 300 mm, arrière Ø 125 mm ; frein centralisé sur les 2 roues arrière\nÉquipements : potence à sérum réglable, coussin d'appui-tête réglable, poignées de poussée\nOptions : tablette repas\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X7\nType: multifunctional blood donor chair\nOverall dimensions: 820–1095 × 800 × 1120 mm\nSeat height: 460 mm\nSeat width: 500 mm\nSeat depth: 430 mm\nFunctions: backrest and legrest synchronised by hand lever to horizontal position\nArm supports: adjustable, for blood donation\nFootrest: hidable HPL, compliant with patient movements\nSeat and backrest: polyurethane; reclining backrest\nArmrests: polyurethane, gradual opening and closing\nCastors: 360° swivel: front Ø 300 mm, rear Ø 125 mm; central brake on 2 rear castors\nEquipment: height-adjustable IV pole, adjustable headrest pillow, push handles\nOptions: overbed table\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 108)",
   "https://www.nitrocare.com.tr/urun/en/79_nts-x7-blood-donor-chair"
  ]
 },
 "nitro-1768234615927-yhgpkxbz6": {
  "brand": "nitrocare",
  "ref": "NTS X11",
  "fr": "Référence : NTS X11\nType : fauteuil de prélèvement sanguin électrique 2 moteurs\nDimensions hors tout : 640 × 1160 mm (largeur × hauteur)\nHauteur d'assise : 475 mm\nLargeur d'assise : 500 mm\nProfondeur d'assise : 430 mm\nMoteurs : 2 (moteur 1 : dossier et repose-jambes synchronisés ; moteur 2 : position Trendelenburg)\nCommande : télécommande\nAppuie-bras : réglables en angle et en hauteur, pour prélèvement sanguin\nAssise et dossier : polyuréthane ; dossier inclinable\nAccoudoirs : polyuréthane, rabattables progressivement\nRoues : pivotantes 360° : avant Ø 300 mm, arrière Ø 125 mm ; frein centralisé sur les 2 roues arrière\nÉquipements : potence à sérum réglable, coussin d'appui-tête réglable, poignées de poussée\nOptions : repose-pieds HPL\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTS X11\nType: multifunctional electrical blood donor chair, 2 motors\nOverall dimensions: 640 × 1160 mm (width × height)\nSeat height: 475 mm\nSeat width: 500 mm\nSeat depth: 430 mm\nMotors: 2 (motor 1: synchronous backrest and legrest; motor 2: Trendelenburg position)\nControl: hand control unit\nArm supports: angle and height adjustable, for blood donation\nSeat and backrest: polyurethane; reclining backrest\nArmrests: polyurethane, gradual opening and closing\nCastors: 360° swivel: front Ø 300 mm, rear Ø 125 mm; central brake on 2 rear castors\nEquipment: height-adjustable IV pole, adjustable headrest pillow, push handles\nOptions: HPL footboard\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 109)",
   "https://www.nitrocare.com.tr/urun/en/114_nts-x11-2-motors-blood-donor-chair"
  ]
 },
 "nitro-1768234616072-991l6ui9j": {
  "brand": "nitrocare",
  "ref": "JMM 02",
  "fr": "Référence : JMM 02 (Sante)\nType : table d'examen gynécologique et lit d'accouchement 3 moteurs\nDimensions hors tout : 1635–2320 × 1070 mm (avec extension de lit)\nHauteur réglable : 605–875 mm\nRéglages motorisés : dossier, hauteur, Trendelenburg / Anti-Trendelenburg\nFonctions : passage position accouchement → position lit par système coulissant, sans transfert de la patiente ; extension du lit\nPlan de couchage : HPL intégral\nBarrières : ABS haute résistance, verrouillables ; panneaux tête et pieds amovibles\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé, dont 1 antistatique\nÉquipements : télécommande, batterie, RCP mécanique, porte-jambes réglables, poignées polyuréthane, cuvette inox amovible sur rail télescopique, potence à sérum, matelas antibactérien imperméable, pare-chocs\nColoris : 1034 bleu, 1081 beige sable\nOptions : roues doubles Q 150, chariot accessoires inox\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: JMM 02 (Sante)\nType: three-motor gynaecological examination and delivery bed\nOverall dimensions: 1635–2320 × 1070 mm (with bed extension)\nHeight adjustment: 605–875 mm\nMotorised adjustments: headrest, height, Trendelenburg / Reverse Trendelenburg\nFunctions: delivery position to bed position via sliding system without moving the patient; bed extension\nBed surface: full HPL\nSide rails: high-resistance ABS, lockable; removable head and foot boards\nCastors: Ø 125 mm, 360° swivel, central brake, 1 antistatic\nEquipment: hand control unit, battery, mechanical CPR, adjustable leg supports, polyurethane-coated hand grips, stainless steel removable basin on telescopic rail, IV pole, antibacterial waterproof mattress, bumpers\nDecors: 1034 blue, 1081 sand beige\nOptions: double castors Q 150, stainless steel accessory trolley\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 111)",
   "https://www.nitrocare.com.tr/urun/en/38_jmm02-delivery-bed--gynaecological-patient-bed"
  ]
 },
 "nitro-1768234616085-bnqhg4rfl": {
  "brand": "nitrocare",
  "ref": "EVA JMM 04",
  "fr": "Référence : EVA JMM 04\nType : fauteuil d'examen gynécologique motorisé\nUsage : gynécologie, examen, urologie, petite chirurgie\nDimensions : 840 × 610 mm (base) ; hauteur du dossier 855 mm\nHauteur réglable : 520–765 mm\nRéglages motorisés : dossier, hauteur, Trendelenburg\nAngle du dossier : 95–180°\nTrendelenburg : 0–25°\nRevêtement : similicuir sur mousse polyuréthane\nRoues : doubles Ø 125 mm, pivotantes 360°, freinage linéaire, dont 1 antistatique\nÉquipements : télécommande, repose-pieds réglables, poignées métal gainées polyuréthane, cuvette inox amovible sur rail télescopique\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: EVA JMM 04\nType: motorised gynaecological examination chair\nUse: gynaecology, examination, urology, minor surgery\nDimensions: 840 × 610 mm (base); backrest height 855 mm\nHeight adjustment: 520–765 mm\nMotorised adjustments: headrest, height, Trendelenburg\nBackrest angle: 95–180°\nTrendelenburg: 0–25°\nUpholstery: artificial leather on polyurethane foam\nCastors: double Ø 125 mm, 360° swivel, linear brake, 1 antistatic\nEquipment: hand control unit, adjustable foot supports, polyurethane-coated metal hand grips, stainless steel removable basin on telescopic rail\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 112)",
   "https://www.nitrocare.com.tr/urun/en/197_eva-jmm-04-four-motors-gynaecological-examination-chair"
  ]
 },
 "nitro-1768234616080-lmpcq0kvt": {
  "brand": "nitrocare",
  "ref": "JMM 03",
  "fr": "Référence : JMM 03\nType : table d'examen gynécologique 3 moteurs, position basse\nUsage : gynécologie, examen, urologie, petite chirurgie\nDimensions hors tout : 1600 × 790 mm\nDimensions du plan de couchage : 1500 × 600 mm\nHauteur réglable : 500–1000 mm\nRéglages motorisés : dossier, hauteur, Trendelenburg\nRevêtement : similicuir sur mousse polyuréthane\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé, dont 1 antistatique\nÉquipements : télécommande, porte-jambes réglables, poignées métal gainées polyuréthane, cuvette inox amovible sur rail télescopique, porte-serviettes\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: JMM 03\nType: three-motor gynaecological examination couch, low bed\nUse: gynaecology, examination, urology, minor surgery\nOverall dimensions: 1600 × 790 mm\nPlatform dimensions: 1500 × 600 mm\nHeight adjustment: 500–1000 mm\nMotorised adjustments: headrest, height, Trendelenburg\nUpholstery: artificial leather on polyurethane foam\nCastors: Ø 125 mm, 360° swivel, central brake, 1 antistatic\nEquipment: hand control unit, adjustable leg supports, polyurethane-coated metal hand grips, stainless steel removable basin on telescopic rail, towel rack\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 115)",
   "https://www.nitrocare.com.tr/urun/en/86_jmm-03-gynaecological-examination-table"
  ]
 },
 "nitro-1768234616026-k7619rsyl": {
  "brand": "nitrocare",
  "ref": "JMM 01",
  "fr": "Référence : JMM 01\nType : table d'examen gynécologique 2 moteurs\nUsage : gynécologie, examen, urologie, petite chirurgie\nDimensions hors tout : 1595 × 770 mm\nDimensions du plan de couchage : 1505 × 600 mm\nHauteur réglable : 510–830 mm\nRéglages motorisés : dossier, hauteur\nTrendelenburg : mécanique, par amortisseur\nRevêtement : similicuir sur mousse polyuréthane\nRoues : Ø 125 mm, pivotantes 360°, freinage centralisé, dont 1 antistatique\nÉquipements : télécommande, porte-jambes réglables, poignées métal gainées polyuréthane, cuvette inox amovible sur rail télescopique, porte-serviettes\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: JMM 01\nType: two-motor gynaecological examination couch\nUse: gynaecology, examination, urology, minor surgery\nOverall dimensions: 1595 × 770 mm\nPlatform dimensions: 1505 × 600 mm\nHeight adjustment: 510–830 mm\nMotorised adjustments: headrest, height\nTrendelenburg: mechanical, with shock absorber\nUpholstery: artificial leather on polyurethane foam\nCastors: Ø 125 mm, 360° swivel, central brake, 1 antistatic\nEquipment: hand control unit, adjustable leg supports, polyurethane-coated metal hand grips, stainless steel removable basin on telescopic rail, towel rack\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 116)"
  ]
 },
 "nitro-1768234616013-5lk0n8grq": {
  "brand": "nitrocare",
  "ref": "CARET 502",
  "fr": "Référence : CARET 502\nType : table d'examen fixe avec habillage bois\nDimensions hors tout : 1930 × 610 mm\nHauteur : 740 mm (plan) ; 840 mm (têtière)\nTêtière : longueur 500 mm\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: CARET 502\nType: fixed examination couch with wooden panelling\nOverall dimensions: 1930 × 610 mm\nHeight: 740 mm (platform); 840 mm (headrest)\nHeadrest: 500 mm long\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 149, catalogue p. 294-295)",
   "https://www.nitrocare.com.tr/urun/en/179_caret-502-patient-examination-table"
  ]
 },
 "nitro-1768234616018-3bo7cj3fj": {
  "brand": "nitrocare",
  "ref": "CARET 502 v2",
  "fr": "Référence : CARET 502\nType : table d'examen fixe avec habillage bois\nDimensions hors tout : 1930 × 610 mm\nHauteur : 740 mm (plan) ; 840 mm (têtière)\nTêtière : longueur 500 mm\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: CARET 502\nType: fixed examination couch with wooden panelling\nOverall dimensions: 1930 × 610 mm\nHeight: 740 mm (platform); 840 mm (headrest)\nHeadrest: 500 mm long\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 149, catalogue p. 294-295)",
   "https://www.nitrocare.com.tr/urun/en/179_caret-502-patient-examination-table"
  ]
 },
 "nitro-1768234615999-6lwt8h1yu": {
  "brand": "nitrocare",
  "ref": "SDY 10",
  "fr": "Référence : NTCR SDY 10\nType : table d'examen motorisée\nDimensions hors tout : 2055 × 650 mm\nHauteur réglable : 585–935 mm (moteur électrique)\nTêtière : réglable par amortisseur\nRoues : Ø 105 mm et Ø 200 mm\nÉquipements : porte-rouleau papier\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SDY 10\nType: motorized examination couch\nOverall dimensions: 2055 × 650 mm\nHeight adjustment: 585–935 mm (electric motor)\nHeadrest: adjustable with damper mechanism\nCastors: Ø 105 mm and Ø 200 mm\nEquipment: paper towel kit\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20180901082931/http://nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF p. 69, catalogue p. 134-135)"
  ]
 },
 "nitro-1768234616008-5tmqla023": {
  "brand": "nitrocare",
  "ref": "SDY 11",
  "fr": "Référence : NTCR SDY 11\nType : table d'examen motorisée avec verticalisation\nDimensions hors tout : 1865 × 600 mm\nHauteur réglable : 560–820 mm (moteur électrique)\nFonctions : position verticale pour relever le patient\nTêtière : réglable par amortisseur\nRoues : Ø 125 mm\nÉquipements : tablette repas réglable en hauteur (position verticale), sangles de maintien\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTCR SDY 11\nType: motorized examination couch with vertical position\nOverall dimensions: 1865 × 600 mm\nHeight adjustment: 560–820 mm (electric motor)\nFunctions: vertical position for raising the patient\nHeadrest: adjustable with damper mechanism\nCastors: Ø 125 mm\nEquipment: height-adjustable dining table (vertical position), fixable belts\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://web.archive.org/web/20180901082931/http://nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF p. 70, catalogue p. 136-137)",
   "https://www.nitrocare.com.tr/urun/en/40_ntcr-sdy11-patient-motorized-examination-couch"
  ]
 },
 "nitro-1768234615963-zh49vtmtp": {
  "brand": "nitrocare",
  "ref": "NTHM 112",
  "fr": "Référence : NTHM 112 (MT 112)\nType : chariot d'urgence\nDimensions : largeur 760 mm (caisson) / 850 mm (hors tout) ; hauteur 985 mm (plateau) / 1100 mm (hors tout)\nTiroirs : 5\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : Ø 125 mm, pivotantes 360°, dont 2 avec frein au pied\nVerrouillage : verrouillage simultané de tous les tiroirs\nSéparateurs : tiroirs divisibles en 3 à 12 compartiments\nÉquipements : tablette défibrillateur mobile HPL (420 × 420 mm), planche de réanimation, potence à sérum réglable, porte-bouteille d'oxygène, pare-chocs\nOptions : serrure électronique\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 112 (MT 112)\nType: emergency trolley\nDimensions: width 760 mm (body) / 850 mm (overall); height 985 mm (top) / 1100 mm (overall)\nDrawers: 5\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: Ø 125 mm, 360° swivel, 2 with foot brake\nLocking: all drawers lock at the same time\nDividers: drawers can be divided into 3–12 sections\nEquipment: movable HPL defibrillator table (420 × 420 mm), resuscitation board, height-adjustable IV pole, oxygen cylinder holder, protection bumpers\nOptions: electronic lock\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 118)",
   "https://www.nitrocare.com.tr/urun/en/41_nthm-112-emergency-trolley"
  ]
 },
 "nitro-1768234615967-g08h2gyj9": {
  "brand": "nitrocare",
  "ref": "NTHM 113",
  "fr": "Référence : NTHM 113 (MT 113)\nType : chariot de médicaments et de soins\nDimensions : largeur 760 mm (caisson) / 925 mm (hors tout) ; hauteur 985 mm (plateau) / 1400 mm (avec rangement supérieur)\nTiroirs : 5\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : Ø 125 mm, pivotantes 360°, dont 2 avec frein au pied\nVerrouillage : verrouillage simultané de tous les tiroirs\nSéparateurs : tiroirs divisibles en 3 à 12 compartiments\nRangement supérieur : bacs à médicaments amovibles sur 2 rangées\nÉquipements : étagère latérale pour flacons, poubelle plastique, pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 113 (MT 113)\nType: medicine and treatment trolley\nDimensions: width 760 mm (body) / 925 mm (overall); height 985 mm (top) / 1400 mm (with upper storage)\nDrawers: 5\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: Ø 125 mm, 360° swivel, 2 with foot brake\nLocking: all drawers lock at the same time\nDividers: drawers can be divided into 3–12 sections\nUpper storage: removable medicine storage boxes in 2 rows\nEquipment: side medicine bottle shelf, plastic dustbin, protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 118)",
   "https://www.nitrocare.com.tr/urun/en/42_nthm-113-medicine-and-treatment-trolley"
  ]
 },
 "nitro-1768234615971-3p4cwlinf": {
  "brand": "nitrocare",
  "ref": "NTHM 114",
  "fr": "Référence : NTHM 114 (MT 114)\nType : chariot à 2 tiroirs et armoire (chariot d'anesthésie au catalogue)\nDimensions : largeur 760 mm (caisson) / 825 mm (hors tout) ; hauteur 985 mm (plateau) / 1400 mm (avec rangement supérieur)\nRangement : 2 tiroirs supérieurs ; armoire à 2 portes avec étagère MDF\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : Ø 125 mm, pivotantes 360°, dont 2 avec frein au pied\nRangement supérieur : bacs à médicaments amovibles sur 2 rangées\nÉquipements : pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 114 (MT 114)\nType: 2-drawer trolley with cabinet (anaesthesia trolley in catalogue)\nDimensions: width 760 mm (body) / 825 mm (overall); height 985 mm (top) / 1400 mm (with upper storage)\nStorage: 2 upper drawers; two-door cabinet divided by MDF shelf\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: Ø 125 mm, 360° swivel, 2 with foot brake\nUpper storage: removable medicine storage boxes in 2 rows\nEquipment: protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 119)",
   "https://www.nitrocare.com.tr/urun/en/136_nthm-114-medicine-and-treatment-cart"
  ]
 },
 "nitro-1768234615976-v9pj81akj": {
  "brand": "nitrocare",
  "ref": "NTHM 115",
  "fr": "Référence : NTHM 115 (MT 115)\nType : chariot de médicaments et de soins\nDimensions : largeur 760 mm (caisson) / 925 mm (hors tout) ; hauteur 985 mm (plateau) / 1400 mm (avec rangement supérieur)\nTiroirs : 6 ; 1er tiroir inox servant de plan de travail\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : Ø 125 mm, pivotantes 360°, dont 2 avec frein au pied\nVerrouillage : verrouillage simultané de tous les tiroirs\nRangement médicaments : organiseurs dans les tiroirs 2 à 5 (7 + 5 + 5), chacun en 4 compartiments ; 15 bacs à l'arrière sur 3 rangées inclinées\nRangement supérieur : 11 bacs à médicaments amovibles (6 + 5)\nÉquipements : poubelle plastique, pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 115 (MT 115)\nType: medicine and treatment trolley\nDimensions: width 760 mm (body) / 925 mm (overall); height 985 mm (top) / 1400 mm (with upper storage)\nDrawers: 6; first drawer stainless steel, used as work bench\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: Ø 125 mm, 360° swivel, 2 with foot brake\nLocking: all drawers lock at the same time\nMedicine storage: organisers in drawers 2–5 (7 + 5 + 5), each in 4 sections; 15 boxes on the back in 3 angled rows\nUpper storage: 11 removable medicine storage boxes (6 + 5)\nEquipment: plastic dustbin, protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 119)",
   "https://www.nitrocare.com.tr/urun/en/81_nthm-115-medicine-and-treatment-trolley"
  ]
 },
 "nitro-1768234615980-qf6jvb4ps": {
  "brand": "nitrocare",
  "ref": "NTHM 116",
  "fr": "Référence : NTHM 116 (MT 116)\nType : chariot de stockage de médicaments\nDimensions : largeur 760 mm (caisson) / 825 mm (hors tout) ; hauteur 1630 mm\nTiroirs : 9 (tiroirs 1 à 7 divisibles en 3 à 12 compartiments ; tiroirs 8 et 9 en 4 compartiments)\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : doubles Ø 100 mm, pivotantes 360°, dont 2 avec frein au pied\nVerrouillage : verrouillage simultané de tous les tiroirs\nÉquipements : pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 116 (MT 116)\nType: medicine storage trolley\nDimensions: width 760 mm (body) / 825 mm (overall); height 1630 mm\nDrawers: 9 (drawers 1–7 divisible into 3–12 sections; drawers 8 and 9 in 4 sections)\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: double Ø 100 mm, 360° swivel, 2 with foot brake\nLocking: all drawers lock at the same time\nEquipment: protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 120)",
   "https://www.nitrocare.com.tr/urun/en/80_nthm-116-medicine-storage-cart"
  ]
 },
 "nitro-1768234615984-aqtmv2mmk": {
  "brand": "nitrocare",
  "ref": "NTHM 117",
  "fr": "Référence : NTHM 117 (MT 117)\nType : chariot de stockage de médicaments à 2 portes\nDimensions : largeur 760 mm (caisson) / 825 mm (hors tout) ; hauteur 1630 mm\nTiroirs : 7 (nombre modulable en option), divisibles en 3 à 12 compartiments\nStructure : HPL compact et aluminium\nFaçades : plexiglas translucide 8 mm ; poignées aluminium\nPlateau supérieur : ABS et MDF\nPlateau inférieur : HPL compact 8 mm sur armature métallique\nRoues : doubles Ø 100 mm, pivotantes 360°, dont 2 avec frein au pied\nÉquipements : pare-chocs\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 117 (MT 117)\nType: two-door medicine storage trolley\nDimensions: width 760 mm (body) / 825 mm (overall); height 1630 mm\nDrawers: 7 (can be increased or reduced optionally), divisible into 3–12 sections\nBody: HPL (compact) and aluminium\nFronts: 8 mm translucent plexiglass; aluminium handles\nTop table: ABS and MDF\nBottom plate: 8 mm HPL (compact) on metal frame\nCastors: double Ø 100 mm, 360° swivel, 2 with foot brake\nEquipment: protection bumpers\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 121)",
   "https://www.nitrocare.com.tr/urun/en/135_nthm-117-medicine-storage-cart"
  ]
 },
 "nitro-1768234615994-tmu3gzio2": {
  "brand": "nitrocare",
  "ref": "NTHM 118 B",
  "fr": "Référence : NTHM 118 B (MT 118B)\nType : chariot de médicaments et de soins avec support code-barres et unité d'alimentation\nHauteur : 940 mm (plateau) ; 1180 mm (hors tout)\nTiroirs : 5 ; 1er tiroir inox servant de plan de travail\nRangement médicaments : organiseurs dans les tiroirs 2 à 5 (6 + 6 + 4 + 4), chacun en 4 compartiments\nStructure : HPL compact et aluminium\nFaçades de tiroirs : plexiglas 8 mm ; poignées aluminium\nPlateau supérieur : HPL compact 8 mm\nRoues : doubles Ø 75 mm, pivotantes 360°, dont 2 avec frein au pied\nÉquipements : support moniteur et clavier, support lecteur code-barres et unité d'alimentation, support unité centrale slim et porte-documents, panier, poubelle plastique\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: NTHM 118 B (MT 118B)\nType: medicine and treatment trolley with barcode and power unit holder\nHeight: 940 mm (top); 1180 mm (overall)\nDrawers: 5; first drawer stainless steel, used as work bench\nMedicine storage: organisers in drawers 2–5 (6 + 6 + 4 + 4), each in 4 sections\nBody: HPL (compact) and aluminium\nDrawer fronts: 8 mm plexiglass; aluminium handles\nTop table: 8 mm HPL (compact)\nCastors: double Ø 75 mm, 360° swivel, 2 with foot brake\nEquipment: monitor and keyboard mount, barcode and power unit support, slim PC case and file holder, multipurpose basket, plastic dustbin\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 122)",
   "https://www.nitrocare.com.tr/urun/en/196_nthm-118b-nitrocare-medicne-and-treatment-trolley-with-barcode-and-power-unit-holder"
  ]
 },
 "nitro-1768234616089-c935o7eml": {
  "brand": "nitrocare",
  "ref": "BK 02",
  "fr": "Référence : BK 02\nType : berceau sur chariot avec bac transparent\nBac : plexiglas transparent ; matelas étanche anti-transpiration\nInclinaison du bac : 3 positions vers l'avant, par amortisseur\nHauteur : réglable par amortisseur\nChâssis : métal anticorrosion, peinture poudre électrostatique\nRoues : pivotantes 360°, dont 2 avec frein\nCaractéristiques : antibactérien, léger, facile à déplacer\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: BK 02\nType: baby cot on carrier trolley with transparent cell\nCell: transparent plexiglass; liquid-tight, antiperspirant mattress\nCell tilt: 3 positions forward, damper mechanism\nHeight: adjustable with damper mechanism\nFrame: corrosion-resistant metal, electrostatic powder coating\nCastors: 360° swivel, 2 lockable\nFeatures: antibacterial, light, easily carried\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/Nitrocare_Katalogen.pdf (PDF p. 124, catalogue p. 244)",
   "https://www.nitrocare.com.tr/urun/en/44_bk02-baby-cot"
  ]
 },
 "nitro-1768234616097-st3wr3bp1": {
  "brand": "nitrocare",
  "ref": "OLHD 1006",
  "fr": "Référence : OLHD 1006\nType : table de chevet compacte\nPlateau supérieur : stratifié compact\nRangement : tiroir\nCaisson : mélaminé\nPoignée : métal\nRoues : 4 roues plastique\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: OLHD 1006\nType: compact bedside cabinet\nTop table: compact laminate\nStorage: drawer\nBody: melamine\nHandle: metal\nCastors: 4 plastic castors\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/urun/en/102_olhd-1006-compact-bed-side-cabinet-"
  ]
 },
 "nitro-1768234616101-7tij06h9k": {
  "brand": "nitrocare",
  "ref": "OLHD 1007",
  "fr": "Référence : OLHD 1007\nType : table de chevet compacte\nPlateau supérieur : stratifié compact\nRangement : tiroirs\nCaisson : mélaminé\nPoignée : métal\nRoues : 4 roues plastique\nOptions : minibar intégrable\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: OLHD 1007\nType: compact bedside cabinet\nTop table: compact laminate\nStorage: drawers\nBody: melamine\nHandle: metal\nCastors: 4 plastic castors\nOptions: minibar can be fitted\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/urun/en/103_olhd-1007-compact-bed-side-cabinet",
   "https://web.archive.org/web/20180901082931/http://nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF p. 88, catalogue p. 172-173)"
  ]
 },
 "nitro-1768234616120-rx0dm6zl3": {
  "brand": "nitrocare",
  "ref": "BST 01",
  "fr": "Référence : BST 01 (NCYM 1001)\nType : table de lit (table repas) à plateau compact\nPlateau : stratifié compact\nChâssis : aluminium / métal, peinture électrostatique\nRéglage en hauteur : mécanisme à vérin amortisseur\nRoues : avec frein\nColoris : large choix\nFabricant : Nitrocare (Turquie)",
  "en": "Reference: BST 01 (NCYM 1001)\nType: overbed table with compact top\nTop: compact laminate\nFrame: aluminium metal, electrostatic paint\nHeight adjustment: lift mechanism with shock absorber\nCastors: with brake\nColours: wide range of options\nManufacturer: Nitrocare (Turkey)",
  "brochure": null,
  "sources": [
   "https://www.nitrocare.com.tr/urun/en/54_bst---01-compact-overbed-table",
   "https://web.archive.org/web/20180901082931/http://nitrocare.com.tr/Nitrocare_Katalog.pdf (PDF p. 89, catalogue p. 174-175)"
  ]
 },
 "8d919400-9fcd-467a-ad72-80a145f3b973": {
  "brand": "ray-vision",
  "ref": "TL-G40",
  "fr": "Référence : TL-G40\nType : boîte de verres d'essai\nNombre de verres : 266 ou 272 pièces en standard + 2 cylindres croisés\nCerclage des verres : métal coloré (sphères positives noires, négatives rouges)\nSphères : 40 paires concaves et convexes ; 0,25–6,00 D (pas de 0,25 D), 6,50–10,00 D (pas de 0,50 D), 11,00–15,00 D (pas de 1,00 D), 16,00–20,00 D (pas de 2,00 D)\nCylindres : 20 paires concaves et convexes ; 0,25–6,00 D\nPrismes : 12 pièces ; 0,5, 1,0 (×2) à 10,0 Δ (pas de 1,0 Δ)\nAccessoires : 14 pièces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cylindres croisés ±0,25 / ±0,50\nCoffret : aluminium\nMonture d'essai : non incluse\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TL-G40\nType: trial lens set\nNumber of lenses: 266 or 272 pieces as standard + 2 cross cylinders\nLens rim: colour metal rim (plus spheres plated black, minus plated red)\nSpheres: 40 pairs each of concave and convex; 0.25–6.00 D (0.25 D steps), 6.50–10.00 D (0.50 D steps), 11.00–15.00 D (1.00 D steps), 16.00–20.00 D (2.00 D steps)\nCylinders: 20 pairs each of concave and convex; 0.25–6.00 D\nPrisms: 12 pieces; 0.5, 1.0 (×2) to 10.0 Δ (1.0 Δ steps)\nAccessories: 14 pieces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cross cylinders ±0.25 / ±0.50\nCase: aluminium\nTrial frame: not included\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tl-g40.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/38.html",
   "https://www.ray-vision.com/Products_dt/75.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602794078670.pdf"
  ]
 },
 "a1033956-d016-42d6-9c46-35e89ce5ff77": {
  "brand": "ray-vision",
  "ref": "TL-L15",
  "fr": "Référence : TL-L15\nType : boîte de verres d'essai\nNombre de verres : 266 ou 272 pièces en standard + 2 cylindres croisés\nCerclage des verres : plastique coloré renforcé par une bague métallique argentée\nDiamètre du cerclage : 26 mm\nSphères : 40 paires concaves et convexes ; 0,25–6,00 D (pas de 0,25 D), 6,50–10,00 D (pas de 0,50 D), 11,00–15,00 D (pas de 1,00 D), 16,00–20,00 D (pas de 2,00 D)\nCylindres : 20 paires concaves et convexes ; 0,25–6,00 D\nPrismes : 12 pièces ; 0,5, 1,0 (×2) à 10,0 Δ (pas de 1,0 Δ)\nAccessoires : 14 pièces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cylindres croisés ±0,25 / ±0,50\nCoffret : bois\nMonture d'essai : non incluse\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TL-L15\nType: trial lens set\nNumber of lenses: 266 or 272 pieces as standard + 2 cross cylinders\nLens rim: colourful plastic rim reinforced with a silver metal ring\nRim diameter: 26 mm\nSpheres: 40 pairs each of concave and convex; 0.25–6.00 D (0.25 D steps), 6.50–10.00 D (0.50 D steps), 11.00–15.00 D (1.00 D steps), 16.00–20.00 D (2.00 D steps)\nCylinders: 20 pairs each of concave and convex; 0.25–6.00 D\nPrisms: 12 pieces; 0.5, 1.0 (×2) to 10.0 Δ (1.0 Δ steps)\nAccessories: 14 pieces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cross cylinders ±0.25 / ±0.50\nCase: wood\nTrial frame: not included\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tl-l15.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/39.html",
   "https://www.ray-vision.com/Products_dt/76.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/660279695d193.pdf"
  ]
 },
 "522caa8c-2bf6-400d-ae35-65fa9f08cb69": {
  "brand": "ray-vision",
  "ref": "TL-S30",
  "fr": "Référence : TL-S30\nType : boîte de verres d'essai\nNombre de verres : 266 ou 272 pièces en standard + 2 cylindres croisés\nCerclage des verres : métal doré (sphères positives) et argenté (sphères négatives)\nSphères : 40 paires concaves et convexes ; 0,25–6,00 D (pas de 0,25 D), 6,50–10,00 D (pas de 0,50 D), 11,00–15,00 D (pas de 1,00 D), 16,00–20,00 D (pas de 2,00 D)\nCylindres : 20 paires concaves et convexes ; 0,25–6,00 D\nPrismes : 12 pièces ; 0,5, 1,0 (×2) à 10,0 Δ (pas de 1,0 Δ)\nAccessoires : 14 pièces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cylindres croisés ±0,25 / ±0,50\nCoffret : aluminium\nMonture d'essai : non incluse\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TL-S30\nType: trial lens set\nNumber of lenses: 266 or 272 pieces as standard + 2 cross cylinders\nLens rim: golden metal rim (plus spheres) and silver (minus spheres)\nSpheres: 40 pairs each of concave and convex; 0.25–6.00 D (0.25 D steps), 6.50–10.00 D (0.50 D steps), 11.00–15.00 D (1.00 D steps), 16.00–20.00 D (2.00 D steps)\nCylinders: 20 pairs each of concave and convex; 0.25–6.00 D\nPrisms: 12 pieces; 0.5, 1.0 (×2) to 10.0 Δ (1.0 Δ steps)\nAccessories: 14 pieces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cross cylinders ±0.25 / ±0.50\nCase: aluminium\nTrial frame: not included\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tl-s30.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/40.html",
   "https://www.ray-vision.com/Products_dt/77.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602797d4a034.pdf"
  ]
 },
 "b6eb72dc-a45a-4689-b08a-b282b4a43174": {
  "brand": "ray-vision",
  "ref": "TL-V20",
  "fr": "Référence : TL-V20\nType : boîte de verres d'essai\nNombre de verres : 266 ou 272 pièces en standard + 2 cylindres croisés\nCerclage des verres : combiné plastique et métal (plastique coloré fixé par une bague argentée)\nDiamètre du cerclage : 26 mm\nSphères : 40 paires concaves et convexes ; 0,25–6,00 D (pas de 0,25 D), 6,50–10,00 D (pas de 0,50 D), 11,00–15,00 D (pas de 1,00 D), 16,00–20,00 D (pas de 2,00 D)\nCylindres : 20 paires concaves et convexes ; 0,25–6,00 D\nPrismes : 12 pièces ; 0,5, 1,0 (×2) à 10,0 Δ (pas de 1,0 Δ)\nAccessoires : 14 pièces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cylindres croisés ±0,25 / ±0,50\nCoffret : aluminium\nMonture d'essai : non incluse\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TL-V20\nType: trial lens set\nNumber of lenses: 266 or 272 pieces as standard + 2 cross cylinders\nLens rim: plastic and metal combi rim (colourful plastic fixed by a silver ring hoop)\nRim diameter: 26 mm\nSpheres: 40 pairs each of concave and convex; 0.25–6.00 D (0.25 D steps), 6.50–10.00 D (0.50 D steps), 11.00–15.00 D (1.00 D steps), 16.00–20.00 D (2.00 D steps)\nCylinders: 20 pairs each of concave and convex; 0.25–6.00 D\nPrisms: 12 pieces; 0.5, 1.0 (×2) to 10.0 Δ (1.0 Δ steps)\nAccessories: 14 pieces (RF, GF, BL, PL ×2, MR ×2, FL, CL ×2, PH ×2, SSPF) + cross cylinders ±0.25 / ±0.50\nCase: aluminium\nTrial frame: not included\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tl-v20.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/41.html",
   "https://www.ray-vision.com/Products_dt/78.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602798fc6266.pdf"
  ]
 },
 "e352f02a-6200-446c-b4ba-07d631216de0": {
  "brand": "ray-vision",
  "ref": "TL-E80",
  "fr": "Référence : TL-E80\nType : boîte de verres d'essai pour périmétrie (champ visuel)\nNombre de verres : 68 verres en verre\nCerclage des verres : métal argenté\nSphères : 2 × 28 pièces (concaves et convexes) ; 0,25–3,00 D (pas de 0,25 D), 3,00–7,00 D (pas de 0,50 D), 7,00–14,00 D (pas de 1,00 D), 14,00–16,00 D (pas de 2,00 D)\nCylindres négatifs : 12 pièces ; 0,25, 0,50, 0,75, 1,00, 1,50, 2,00, 2,50, 3,00, 3,50, 4,00, 4,50, 5,00 D\nCoffret : simili-cuir noir avec poignée\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TL-E80\nType: perimeter (visual field) trial lens set\nNumber of lenses: 68 glass lenses\nLens rim: silver metal\nSpheres: 2 × 28 pieces (concave and convex); 0.25–3.00 D (0.25 D steps), 3.00–7.00 D (0.50 D steps), 7.00–14.00 D (1.00 D steps), 14.00–16.00 D (2.00 D steps)\nMinus cylinders: 12 pieces; 0.25, 0.50, 0.75, 1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00 D\nCase: black leatheroid case with handle\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tl-e80.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/37.html",
   "https://www.ray-vision.com/Products_dt/74.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602792ae5dbc.pdf"
  ]
 },
 "641873cf-f8cf-4609-a830-874f589ca4ea": {
  "brand": "ray-vision",
  "ref": "TF-E40",
  "fr": "Référence : TF-E40\nMatériau : titane\nÉcart pupillaire : 54–70 mm (pas de 2 mm)\nDiamètre intérieur du porte-verre : 34 mm\nCapacité : 4 verres insérés simultanément (gauche et droite)\nRotation du verre autour de l'axe optique : 360°\nDécentrement centre optique / centre géométrique : ≤ 0,5 mm\nDéplacement du verre / centre géométrique du porte-verre : ≤ 0,3 mm\nAppui nasal : réglage vertical 4 mm ; écartement 7,5–11 mm ; rotation 20°\nRéglages : écart pupillaire, axe du cylindre, branches\nUsage : adapté à l'optométrie pédiatrique\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TF-E40\nMaterial: titanium\nPupillary distance: 54–70 mm (2 mm steps)\nLens cell inner diameter: 34 mm\nCapacity: 4 lenses inserted simultaneously (left and right)\nLens rotation around optical axis: 360°\nOptical centre / geometric centre misalignment: ≤ 0.5 mm\nLens displacement / cell geometric centre: ≤ 0.3 mm\nNose rest: up/down adjustment 4 mm; width 7.5–11 mm; rotation 20°\nAdjustments: pupillary distance, cylinder axis, temples\nUse: suitable for paediatric optometry\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/33.html",
   "https://www.ray-vision.com/Products_dt/70.html"
  ]
 },
 "a7b7fee1-ff03-49eb-88d5-831998e7ef16": {
  "brand": "ray-vision",
  "ref": "TF-K30",
  "fr": "Référence : TF-K30\nMatériau : plastique souple coloré\nÉcart pupillaire : fixe, 52–72 mm au choix\nLongueur réglable : 125–155 mm\nÉchelle d'axe : 0–180°, graduations de 5°\nOuverture interne effective : 38 mm\nCapacité : 4 verres (3 à l'avant, 1 à l'arrière)\nRotation du verre autour de l'axe optique : 360°\nNon-parallélisme axe optique / axe géométrique : ≤ 2,5°\nDécentrement centre optique / centre géométrique : ≤ 0,5 mm\nDéplacement du verre / centre géométrique du porte-verre : ≤ 0,3 mm\nRéglage d'axe : par vis rotative\nUsage : adultes et enfants\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TF-K30\nMaterial: soft coloured plastic\nPupillary distance: fixed, 52–72 mm optional\nAdjustable length: 125–155 mm\nAxis scale: 0–180°, 5° graduations\nEffective internal aperture: 38 mm\nCapacity: 4 lenses (3 front, 1 rear)\nLens rotation around optical axis: 360°\nOptical axis / geometric axis non-parallelism: ≤ 2.5°\nOptical centre / geometric centre misalignment: ≤ 0.5 mm\nLens displacement / cell geometric centre: ≤ 0.3 mm\nAxis adjustment: by rotating screw\nUse: adults and children\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/34.html",
   "https://www.ray-vision.com/Products_dt/71.html"
  ]
 },
 "75690617-aeca-43a2-9cec-e15bbef5be56": {
  "brand": "ray-vision",
  "ref": "TF-K65",
  "fr": "Référence : TF-K65\nMatériau : métal / plastique léger, noir\nCapacité : 5 paires de verres\nÉcart pupillaire : 48–80 mm ; réglage indépendant droite/gauche 50–80 mm\nÉchelle de distance verre-œil : oui\nAppui nasal : réglable en hauteur\nBranches : longueur et angle réglables (crémaillère)\nMolettes : fixées par vis\nDimensions : 356 × 229 × 25 mm (14,0 × 9,0 × 1 in)\nPoids : 170 g (6 oz)\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TF-K65\nMaterial: black lightweight metal / plastic\nCapacity: 5 pairs of lenses\nPupillary distance: 48–80 mm; independent right/left adjustment 50–80 mm\nVertex distance scale: yes\nNose piece: height adjustable\nTemples: adjustable length and angle (rack and pinion)\nKnobs: fastened with screws\nDimensions: 356 × 229 × 25 mm (14.0 × 9.0 × 1 in)\nWeight: 170 g (6 oz)\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/35.html",
   "https://www.ray-vision.com/Products_dt/72.html"
  ]
 },
 "668f9ff1-8bd5-46ab-9e78-2fda4390a03d": {
  "brand": "ray-vision",
  "ref": "TF-P50",
  "fr": "Référence : TF-P50\nMatériau : tout métal\nÉcart pupillaire : 48–80 mm (binoculaire) ; 24–40 mm par œil ; graduation 1 mm\nGraduation d'axe : 5°, sens antihoraire\nDiamètre intérieur du porte-verre : 32,5 mm\nCapacité : 4 verres par côté simultanément\nAppui nasal : réglable en hauteur et en angle\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TF-P50\nMaterial: all-metal\nPupillary distance: 48–80 mm (binocular); 24–40 mm per eye; 1 mm graduation\nAxis graduation: 5°, counter-clockwise\nLens cell inner diameter: 32.5 mm\nCapacity: 4 lenses per side simultaneously\nNose bridge: height and angle adjustable\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/36.html",
   "https://www.ray-vision.com/Products_dt/73.html"
  ]
 },
 "06a787a1-f9ce-4976-ba86-f2b31b213536": {
  "brand": "ray-vision",
  "ref": "OM-V50",
  "fr": "Référence : OM-V50\nType : microscope opératoire ophtalmique sur pied roulant\nGrossissement de l'oculaire : 12,5×\nObjectif : f = 200 mm\nDistance de travail : 190 mm\nGrossissement du microscope principal : 5,3×, 8×, 12× (3 paliers)\nDiamètre du champ : 38 mm, 25 mm, 17 mm\nRéglage dioptrique : ±7 D\nÉcart pupillaire : 50–80 mm\nSource lumineuse : lampe halogène médicale à réflexion froide 12 V / 100 W\nType d'éclairage : coaxial lumière froide 6° + 0°\nÉclairement coaxial : 30 000 lx\nPortée du bras : 870 mm\nRéglage vertical : 700–1100 mm\nMise au point fine : 30 mm\nBras : équilibré par ressort\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: OM-V50\nType: ophthalmic operation microscope on rolling stand\nEyepiece magnification: 12.5×\nObjective lens: f = 200 mm\nWorking distance: 190 mm\nMain microscope magnification: 5.3×, 8×, 12× (3 steps)\nField diameter: 38 mm, 25 mm, 17 mm\nDiopter adjustment: ±7 D\nPupillary distance: 50–80 mm\nLight source: 12 V / 100 W medical cold-reflection halogen lamp\nIllumination type: 6° + 0° coaxial cold light\nCoaxial illumination: 30,000 lx\nArm reach: 870 mm\nVertical adjustment: 700–1100 mm\nFine focusing range: 30 mm\nArm: spring-balanced\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-om-v50.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/60.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/66027b45485fc.pdf"
  ]
 },
 "28418216-e284-4edb-a012-5c2fef04ec81": {
  "brand": "ray-vision",
  "ref": "TB-S100",
  "fr": "Référence : TB-S100\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 58 × 47 cm\nHauteur réglable : 66–85 cm\nPoids : 17 kg\nTension d'alimentation : 100–230 V CA, 50/60 Hz\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S100\nType: motorised instrument table (electric lift)\nTabletop size: 58 × 47 cm\nHeight adjustment: 66–85 cm\nWeight: 17 kg\nInput voltage: 100–230 V AC, 50/60 Hz\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tb-s100.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/14.html",
   "https://www.ray-vision.com/Products_dt/32.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602731f92bb3.pdf"
  ]
 },
 "38d9869e-5121-4db2-90d9-8220eb6fcfdc": {
  "brand": "ray-vision",
  "ref": "TB-S430",
  "fr": "Référence : TB-S430\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 90 × 47 cm\nHauteur réglable : 72–93 cm\nPoids : 44 kg\nTension d'alimentation : 100–230 V CA, 50/60 Hz\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S430\nType: motorised instrument table (electric lift)\nTabletop size: 90 × 47 cm\nHeight adjustment: 72–93 cm\nWeight: 44 kg\nInput voltage: 100–230 V AC, 50/60 Hz\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tb-s430.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/20.html",
   "https://www.ray-vision.com/Products_dt/38.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602738944d20.pdf"
  ]
 },
 "f881f276-3778-4fcc-9295-bd5f8281d33a": {
  "brand": "ray-vision",
  "ref": "TB-S560",
  "fr": "Référence : TB-S560\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 102 × 59 cm\nHauteur réglable : 63–83 cm\nPoids : 38 kg\nTension d'alimentation : 100–230 V CA, 50/60 Hz\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S560\nType: motorised instrument table (electric lift)\nTabletop size: 102 × 59 cm\nHeight adjustment: 63–83 cm\nWeight: 38 kg\nInput voltage: 100–230 V AC, 50/60 Hz\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tb-s560.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/21.html",
   "https://www.ray-vision.com/Products_dt/39.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/660274a16a778.pdf"
  ]
 },
 "16a4797d-a944-4265-8769-5524a88ea46b": {
  "brand": "ray-vision",
  "ref": "TB-S700",
  "fr": "Référence : TB-S700\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 55 × 92 cm\nHauteur réglable : 690–900 mm\nMoteur : moteur à courant continu\nNiveau sonore à l'élévation : < 50 dB\nPoids : 32 kg\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S700\nType: motorised instrument table (electric lift)\nTabletop size: 55 × 92 cm\nHeight adjustment: 690–900 mm\nActuator: DC motor\nNoise during elevation: < 50 dB\nWeight: 32 kg\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tb-s700.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/23.html",
   "https://www.ray-vision.com/Products_dt/41.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/660274225b4dc.pdf"
  ]
 },
 "3850e5ef-c868-4249-8812-ad6dee8b057b": {
  "brand": "ray-vision",
  "ref": "TB-V300",
  "fr": "Référence : TB-V300\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 40 × 60 cm\nDimensions de la base : 45 × 52 cm\nHauteur réglable : 640–860 mm\nCharge maximale : 50 kg\nPoids : 25 kg\nTension d'alimentation : 220/110 V CA, 50/60 Hz\nNiveau sonore à l'élévation : < 55 dB\nRoues : roulettes avec freins\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-V300\nType: motorised instrument table (electric lift)\nTabletop size: 40 × 60 cm\nBase size: 45 × 52 cm\nHeight adjustment: 640–860 mm\nMaximum load: 50 kg\nWeight: 25 kg\nInput voltage: 220/110 V AC, 50/60 Hz\nNoise during elevation: < 55 dB\nCastors: with locks\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": "/uploads/pdfs/ray-vision-tb-v300.pdf",
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/25.html",
   "https://www.ray-vision.com/Products_dt/43.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602743bb3f6e.pdf"
  ]
 },
 "2d592657-5aee-4265-9ee5-1463a82ae84d": {
  "brand": "ray-vision",
  "ref": "TB-S330",
  "fr": "Référence : TB-S330\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 787 × 483 mm (31 × 19 in)\nHauteur réglable : 711–940 mm (28–37 in)\nPoids : 37 kg (81,5 lb)\nTension d'alimentation : 100–230 V CA, 50/60 Hz\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S330\nType: motorised instrument table (electric lift)\nTabletop size: 787 × 483 mm (31 × 19 in)\nHeight adjustment: 711–940 mm (28–37 in)\nWeight: 37 kg (81.5 lb)\nInput voltage: 100–230 V AC, 50/60 Hz\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/19.html",
   "https://www.ray-vision.com/Products_dt/37.html",
   "http://ray-vision.com/uploads/elm/file/file/2024-03-26/6602737d6f7a2.pdf"
  ]
 },
 "7439598c-3b4e-48ef-8a31-bee36bd47e86": {
  "brand": "ray-vision",
  "ref": "TB-S580",
  "fr": "Référence : TB-S580\nType : table à instruments électrique (élévation motorisée)\nDimensions du plateau : 92,5 × 61,5 cm\nHauteur réglable : 69–90 cm\nPoids : 40 kg\nTension d'alimentation : 100–230 V CA, 60 Hz\nFabricant : Ray Vision International Corp. (Chine)",
  "en": "Reference: TB-S580\nType: motorised instrument table (electric lift)\nTabletop size: 92.5 × 61.5 cm\nHeight adjustment: 69–90 cm\nWeight: 40 kg\nInput voltage: 100–230 V AC, 60 Hz\nManufacturer: Ray Vision International Corp. (China)",
  "brochure": null,
  "sources": [
   "http://ray-vision.com/index/product/detail/lang/en/id/22.html",
   "https://www.ray-vision.com/Products_dt/40.html"
  ]
 }
};

// product id: reason why no sheet was written (no reliable official source)
const EMPTY = {
 "0f9f86dd-14a3-4871-8a97-db39f7634f88": {
  "brand": "foshan",
  "ref": "FS9274L",
  "reason": "FS9274L introuvable : absent de l'e-catalogue officiel Foshan (69 pages OCR + vérification visuelle des tableaux aides à la marche p.51-54) et du site fabricant fsdfmed.com (218 fiches produit du sitemap) ; seuls des modèles voisins (FS9272LW, FS9275L-1) existent, non utilisables."
 },
 "7c358197-e410-4201-bde1-6a742ecd74f7": {
  "brand": "foshan",
  "ref": "FS140",
  "reason": "FS140 introuvable : absent de l'e-catalogue officiel (section Power Wheelchair p.16-21, seuls FS129/FS123/FS124/FS131GC/FS130LGC/FS141...) et du site fsdfmed.com (sitemap complet + recherche web) ; modèles voisins FS139/FS141 non utilisables."
 },
 "78f858cc-75d1-492c-9418-1e6a001d17ce": {
  "brand": "CARE GROUP",
  "ref": "DUOVISC-HILURON",
  "reason": "Care Group official site (caregroupiol.com, full WP product list checked) has no Hiluron Duo page: only Hiluron 1.4% (1.0 ml prefilled syringe, no further specs) and no Hiluron 3.0%; no brochure found. Not filled to avoid mixing a single-syringe product with the duo kit."
 },
 "b8c7c96f-4a07-4d0d-982a-feea0fbbc9f6": {
  "brand": "INOPHTA",
  "ref": "Nutri-FOV",
  "reason": "No official Inophta source: inophta.fr / inophta.com do not resolve, Wayback only has a 2007 blank page; composition found only on pharmacies/Vidal (not manufacturer) — rejected."
 },
 "nitro-1768234615550-cykifae9z": {
  "brand": "nitrocare",
  "ref": "HB 8140 ELC",
  "reason": "HB 8140 ELC: official page nitrocare.com.tr/urun/en/208 has only the title (four motors ICU low bed) and photos, no specs; model absent from current catalogue (Nitrocare_Katalogtr.pdf, Nov 2024) and from 2014/2019 Wayback catalogues; HB 8140 / 8140 C exist in catalogue but are different model codes."
 },
 "nitro-1768234615857-k8gdo8twa": {
  "brand": "nitrocare",
  "ref": "HB 1120",
  "reason": "HB 1120: official page nitrocare.com.tr/urun/en/209 has only the title 'Manuel Patient Bed', no specs or gallery; not in current catalogue (Nov 2024) nor 2014/2019 Wayback catalogues (only HB 1410/1420/1430 manual beds)."
 },
 "nitro-1768234616093-g9vxasoyr": {
  "brand": "nitrocare",
  "ref": "BK 04 Neo",
  "reason": "BK 04 Neo: current Nitrocare catalogue (Nitrocare_Katalogen.pdf p.124) shows a 'BK 04' only as photos, no specs and no 'Neo' naming; no product page on nitrocare.com.tr; 2018 catalogue (Wayback) has no BK 04. Nothing reliable."
 },
 "nitro-1768234615956-c27v6du3y": {
  "brand": "nitrocare",
  "ref": "HAPPY",
  "reason": "HAPPY dialysis chair: only appears in the 2018 Nitrocare catalogue (Wayback, p.92) as photos with name 'HAPPY Diyaliz Koltuğu / Dialysis Chair', no specs; not on current site or 2024 catalogue."
 },
 "nitro-1768234615991-mtnppiqk3": {
  "brand": "nitrocare",
  "ref": "NTHM 118",
  "reason": "NTHM 118 dressing cart: nitrocare.com.tr page 146_nthm-118--dressing-cart has photos only, no text; not in 2024 catalogue (only MT 118B, a different model) nor in the 2018 catalogue."
 },
 "nitro-1768234616105-a91ht2k4j": {
  "brand": "nitrocare",
  "ref": "OLHD 1008",
  "reason": "OLHD 1008: only listed in 2018 Nitrocare catalogue (p.88) as 'Bedside cabinet (full compact)' with a photo, no specs; no product page on current site; not in 2024 catalogue."
 },
 "nitro-1768234616113-pfx33huor": {
  "brand": "nitrocare",
  "ref": "OLHD 1011",
  "reason": "OLHD 1011: only listed in 2018 Nitrocare catalogue (p.88) as 'Bedside cabinet (full compact)' with a photo, no specs; no product page; not in 2024 catalogue."
 },
 "nitro-1768234616108-mk0xz4ac3": {
  "brand": "nitrocare",
  "ref": "OLHD 1009",
  "reason": "OLHD 1009: nitrocare.com.tr page 69_olhd-1009-bed-side-cabinet has photos only, no text; not in 2018 or 2024 catalogues (NCYM 1009 is a different model)."
 },
 "4f3d44ac-9571-417e-b68f-6706893e9c76": {
  "brand": "ray-vision",
  "ref": "TL-R60",
  "reason": "TL-R60 not found on ray-vision.com (current site sitemap, 106 product pages; legacy site ids 1–200 incl. Trial Lens Set category: only TL-E80/G40/L15/S30/V20) nor in any official Ray Vision PDF; web search returned no manufacturer source."
 }
};

const isEmpty = (s) => (s || "").trim().length < MIN;

async function plan() {
  const changes = [];
  const ids = Object.keys(SHEETS);
  const products = await prisma.products.findMany({ where: { id: { in: ids } }, include: { product_translations: true } });
  const missing = [];
  for (const [pid, s] of Object.entries(SHEETS)) {
    const p = products.find((x) => x.id === pid);
    if (!p) { missing.push(pid); continue; }
    for (const lang of ["fr", "en"]) {
      const to = s[lang];
      if (!to) continue;
      const t = p.product_translations.find((x) => x.language_code === lang);
      if (!t) { missing.push(`${lang} ${pid}`); continue; }
      if (t.fiche_technique === to) continue; // already done
      if (!isEmpty(t.fiche_technique)) { console.log(`  [SKIP filled] ${pid} ${lang}.fiche_technique`); continue; }
      changes.push({ table: "product_translations", rowId: t.id, field: "fiche_technique", label: `${pid} ${lang}.fiche_technique (${p.constructeur} ${p.reference_fournisseur})`, from: t.fiche_technique, to });
    }
    if (s.brochure) {
      if (p.pdf_brochure_url === s.brochure) continue;
      if ((p.pdf_brochure_url || "").trim()) { console.log(`  [SKIP brochure set] ${pid} = ${p.pdf_brochure_url}`); continue; }
      const file = path.join(PUBLIC, s.brochure);
      if (!fs.existsSync(file)) { console.log(`  [SKIP brochure file missing] ${file}`); continue; }
      changes.push({ table: "products", rowId: p.id, field: "pdf_brochure_url", label: `${pid} pdf_brochure_url (${p.constructeur} ${p.reference_fournisseur})`, from: p.pdf_brochure_url, to: s.brochure });
    }
  }
  if (missing.length) console.log(`  [MISSING] ${missing.join(", ")}`);
  console.log(`  ${Object.keys(EMPTY).length} product(s) left empty (no reliable official source), see EMPTY`);
  return changes;
}

async function write(table, rowId, field, value) {
  await prisma[table].update({ where: { id: rowId }, data: { [field]: value } });
}

async function apply() {
  const changes = await plan();
  const short = (s) => (s || "").replace(/\n/g, " / ").slice(0, 110);
  for (const c of changes) console.log(`  ${c.label}\n     - ${short(c.from)}\n     + ${short(c.to)}`);
  const n = (f) => changes.filter((c) => c.field === f).length;
  console.log(`\n${changes.length} field(s) to change (${n("fiche_technique")} sheet(s), ${n("pdf_brochure_url")} brochure(s))`);
  if (!APPLY || !changes.length) return;
  const before = fs.existsSync(BEFORE_FILE) ? JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8")) : { taken_at: new Date().toISOString(), fields: [] };
  for (const c of changes) {
    if (!before.fields.find((f) => f.table === c.table && f.rowId === c.rowId && f.field === c.field)) {
      before.fields.push({ table: c.table, rowId: c.rowId, field: c.field, label: c.label, value: c.from });
    }
  }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(before, null, 1)); // snapshot first, then write
  for (const c of changes) await write(c.table, c.rowId, c.field, c.to);
  console.log(`applied ${changes.length} change(s); snapshot ${BEFORE_FILE} (${before.fields.length} field(s))`);
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
