const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-15 -- Lot D, MORIA catalogues (script 80).
 *
 * 1. Reusable range (catalogue 67047INT-F, EN-FR-ES): of the 313 MORIA rows (312 archived +
 *    the active placeholder « Instruments Moria » ref MORIA-INSTRUMENTS), the 260 whose ref is
 *    printed in the catalogue are reactivated under Ophtalmologie > Instrumentation >
 *    « Instruments MORIA » (moria-instruments) in family sub-categories mirroring the catalogue
 *    (Blépharostats, Pinces > capsulorhexis / cornée et sclère / à nouer / sans dents /
 *    kératoplastie / autres, Porte-aiguilles, Ciseaux, Crochets et spatules, Canules,
 *    Autres instruments, Boîtes de stérilisation). Their FR/EN names, descriptions and
 *    fiches techniques are rewritten from the catalogue text (the old texts were machine
 *    mixed FR/EN and several were wrong: 393, 3225, 917, 61...). Existing photos are kept,
 *    except 8 wrong/missing ones replaced by catalogue crops (moria-r-*.jpg).
 *    The 52 other refs (trépans/punchs Hanna, ALTK/DSAEK chamber parts, consoles, ref « 15 »)
 *    stay archived; the placeholder MORIA-INSTRUMENTS is archived. No reusable « Sets » row
 *    exists in the DB, so no Sets sub-category is created.
 * 2. Single-use range (catalogue 67040INT-A, EN-FR): 79 new products (146 catalogue refs,
 *    pack-size / gauge / diameter variants grouped) under Ophtalmologie > Consommables >
 *    « MORIA usage unique » (moria-usage-unique) and 6 family sub-categories.
 * 3. 22 category tiles (moria-*-tile.jpg, 3:1 catalogue crops), catalogue PDFs on every
 *    product (pdf_brochure_url) and as MORIA partner default_pdf_url.
 *
 * REVERT POINT: 80-before.json = every MORIA product row (+ translations, media) and the
 * MORIA partner row before the change. --revert writes them back, deletes the 79 new
 * products and the 22 new categories. (--snapshot refuses to overwrite.)
 *
 * Run INSIDE the staging app container:
 *   docker cp 80-moria.js <app>:/tmp/80.js ; docker cp 80-before.json <app>:/tmp/80-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/80.js [--snapshot|--apply|--revert]
 * Files (moria-*.jpg in products/ and categories/, moria-catalogue-*.pdf in pdfs/) are copied
 * to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "80-before.json");
const BEFORE = SNAPSHOT ? null : JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));
const now = () => new Date();
const MORIA = "a378183d-07d2-4f52-aa4d-ddbcf205cc97";

// generated from the two catalogues (see scratch build scripts); do not edit by hand
const DATA = {
"cats": [
{
"id": "c80a0001-0000-4000-8000-000000000001",
"slug": "moria-instruments",
"parent": "instrumentation",
"fr": "Instruments MORIA",
"en": "MORIA instruments",
"dfr": "Instrumentation de microchirurgie ophtalmique réutilisable MORIA, conçue, fabriquée et finie à la main en France.",
"den": "MORIA reusable ophthalmic microsurgical instruments, designed, manufactured and hand finished in France.",
"sort": 20,
"image": "/uploads/categories/moria-instruments-tile-v2.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000002",
"slug": "moria-blepharostats",
"parent": "moria-instruments",
"fr": "Blépharostats",
"en": "Speculums",
"dfr": null,
"den": null,
"sort": 1,
"image": "/uploads/categories/moria-blepharostats-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000003",
"slug": "moria-pinces",
"parent": "moria-instruments",
"fr": "Pinces",
"en": "Forceps",
"dfr": null,
"den": null,
"sort": 2,
"image": "/uploads/categories/moria-pinces-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000004",
"slug": "moria-pinces-capsulorhexis",
"parent": "moria-pinces",
"fr": "Pinces capsulorhexis",
"en": "Capsulorhexis forceps",
"dfr": null,
"den": null,
"sort": 1,
"image": "/uploads/categories/moria-pinces-capsulorhexis-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000005",
"slug": "moria-pinces-cornee-sclere",
"parent": "moria-pinces",
"fr": "Pinces cornée et sclère",
"en": "Corneal and scleral forceps",
"dfr": null,
"den": null,
"sort": 2,
"image": "/uploads/categories/moria-pinces-cornee-sclere-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000006",
"slug": "moria-pinces-a-nouer",
"parent": "moria-pinces",
"fr": "Pinces à nouer",
"en": "Tying forceps",
"dfr": null,
"den": null,
"sort": 3,
"image": "/uploads/categories/moria-pinces-a-nouer-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000007",
"slug": "moria-pinces-sans-dents",
"parent": "moria-pinces",
"fr": "Pinces sans dents",
"en": "Toothless forceps",
"dfr": null,
"den": null,
"sort": 4,
"image": "/uploads/categories/moria-pinces-sans-dents-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000008",
"slug": "moria-pinces-keratoplastie",
"parent": "moria-pinces",
"fr": "Pinces de kératoplastie",
"en": "Keratoplasty forceps",
"dfr": null,
"den": null,
"sort": 5,
"image": "/uploads/categories/moria-pinces-keratoplastie-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000009",
"slug": "moria-pinces-autres",
"parent": "moria-pinces",
"fr": "Autres pinces",
"en": "Other forceps",
"dfr": null,
"den": null,
"sort": 6,
"image": "/uploads/categories/moria-pinces-autres-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000010",
"slug": "moria-porte-aiguilles",
"parent": "moria-instruments",
"fr": "Porte-aiguilles",
"en": "Needle holders",
"dfr": null,
"den": null,
"sort": 3,
"image": "/uploads/categories/moria-porte-aiguilles-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000011",
"slug": "moria-ciseaux",
"parent": "moria-instruments",
"fr": "Ciseaux",
"en": "Scissors",
"dfr": null,
"den": null,
"sort": 4,
"image": "/uploads/categories/moria-ciseaux-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000012",
"slug": "moria-crochets-spatules",
"parent": "moria-instruments",
"fr": "Crochets et spatules",
"en": "Hooks and spatulas",
"dfr": null,
"den": null,
"sort": 5,
"image": "/uploads/categories/moria-crochets-spatules-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000013",
"slug": "moria-canules",
"parent": "moria-instruments",
"fr": "Canules",
"en": "Cannulas",
"dfr": null,
"den": null,
"sort": 6,
"image": "/uploads/categories/moria-canules-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000014",
"slug": "moria-autres",
"parent": "moria-instruments",
"fr": "Autres instruments",
"en": "Other instruments",
"dfr": null,
"den": null,
"sort": 7,
"image": "/uploads/categories/moria-autres-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000015",
"slug": "moria-boites-sterilisation",
"parent": "moria-instruments",
"fr": "Boîtes de stérilisation",
"en": "Sterilization boxes",
"dfr": null,
"den": null,
"sort": 8,
"image": "/uploads/categories/moria-boites-sterilisation-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000016",
"slug": "moria-usage-unique",
"parent": "consommable",
"fr": "MORIA usage unique",
"en": "MORIA single-use",
"dfr": "Instrumentation ophtalmique à usage unique MORIA (gammes One et One Steel), canules, micro-éponges et kits de procédure.",
"den": "MORIA single-use ophthalmic instruments (One and One Steel ranges), cannulas, micro-sponges and procedure kits.",
"sort": 20,
"image": "/uploads/categories/moria-usage-unique-tile-v2.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000017",
"slug": "moria-uu-blepharostats",
"parent": "moria-usage-unique",
"fr": "Blépharostats",
"en": "Speculums",
"dfr": null,
"den": null,
"sort": 1,
"image": "/uploads/categories/moria-uu-blepharostats-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000018",
"slug": "moria-uu-pinces",
"parent": "moria-usage-unique",
"fr": "Pinces et porte-aiguilles",
"en": "Forceps and needle holders",
"dfr": null,
"den": null,
"sort": 2,
"image": "/uploads/categories/moria-uu-pinces-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000019",
"slug": "moria-uu-crochets-anneaux",
"parent": "moria-usage-unique",
"fr": "Crochets, anneaux et marqueurs",
"en": "Hooks, rings and markers",
"dfr": null,
"den": null,
"sort": 3,
"image": "/uploads/categories/moria-uu-crochets-anneaux-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000020",
"slug": "moria-uu-ciseaux",
"parent": "moria-usage-unique",
"fr": "Ciseaux",
"en": "Scissors",
"dfr": null,
"den": null,
"sort": 4,
"image": "/uploads/categories/moria-uu-ciseaux-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000021",
"slug": "moria-uu-canules",
"parent": "moria-usage-unique",
"fr": "Canules et micro-éponges",
"en": "Cannulas and micro-sponges",
"dfr": null,
"den": null,
"sort": 5,
"image": "/uploads/categories/moria-uu-canules-tile.jpg"
},
{
"id": "c80a0001-0000-4000-8000-000000000022",
"slug": "moria-uu-kits",
"parent": "moria-usage-unique",
"fr": "Kits de procédure",
"en": "Procedure kits",
"dfr": null,
"den": null,
"sort": 6,
"image": "/uploads/categories/moria-uu-kits-tile.jpg"
}
],
"products": [
{
"id": "1dd74f1a-e716-4088-9acd-33f06638faef",
"ref": "393",
"cat": "moria-blepharostats",
"sort": 1,
"fr": {
"nom": "Blépharostat de Pley",
"description": "Recommandé pour chirurgie de la cataracte, petites chirurgies et consultation. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 393\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Pley Speculum",
"description": "Recommended for cataract surgery, small surgeries and consultation. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 393\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-393.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a2bb91c4-fb67-483d-af8f-a7d81bd3b6da",
"ref": "9627A",
"cat": "moria-blepharostats",
"sort": 2,
"fr": {
"nom": "Blépharostat de Castroviejo – modèle adulte, oreilles de 14 mm",
"description": "Modèle adulte, oreilles de 14 mm. Recommandé pour chirurgie du strabisme et décollement de rétine. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9627A\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Speculum – adult model, 14-mm lid blades",
"description": "Adult model, 14-mm lid blades. Recommended for strabismus and retinal detachment surgery. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9627A\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e8e6d61c-2cd4-4db4-85a0-6f84c02244bc",
"ref": "13132",
"cat": "moria-blepharostats",
"sort": 3,
"fr": {
"nom": "Blépharostat de Castroviejo-Bonnet",
"description": "À 2 x 2 griffes mousses, oreilles de 14 mm. Recommandé pour chirurgie de décollement de rétine. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13132\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo-Bonnet Speculum",
"description": "2 x 2 blunt spongs, 14-mm lid blades. Recommended for retinal detachment surgery. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13132\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fd9fae71-3adf-4095-a3c1-eea213680652",
"ref": "18195",
"cat": "moria-blepharostats",
"sort": 4,
"fr": {
"nom": "Blépharostat de Schapira",
"description": "Oreilles ouvertes de 15 mm, large ouverture, recommandé pour phaco et micro-kératoplastie lamellaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18195\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Schapira Speculum",
"description": "15-mm open lid blades, wide opening, recommended for phaco and micro lamellar keratoplasty. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18195\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0358c8e6-d4e9-43a5-b8de-fe8b176c19f4",
"ref": "19030",
"cat": "moria-blepharostats",
"sort": 5,
"fr": {
"nom": "Blépharostat de Franceschi",
"description": "Oreilles fenestrées de 19 mm, fort et allégé. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19030\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Franceschi Speculum",
"description": "19-mm fenestrated wire blade, strong action and lightweight. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19030\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b3edd183-f20d-426d-903a-e084245d02a5",
"ref": "19048",
"cat": "moria-blepharostats",
"sort": 6,
"fr": {
"nom": "Blépharostat de Olivieri-Cantera",
"description": "Cuillères de 14 mm, réglable, fort. Recommandé pour chirurgie de la cataracte et chirurgie réfractive. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19048\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Olivieri-Cantera Speculum",
"description": "14-mm solid blades, adjustable, strong action. Recommended for cataract and refractive surgeries. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19048\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2780015b-7707-4bc7-9a43-35b2ccc58497",
"ref": "19069",
"cat": "moria-blepharostats",
"sort": 7,
"fr": {
"nom": "Blépharostat aspirant",
"description": "Réglable, oreilles ouvertes 17 et 18 mm, tube silicone et connecteur « luer-lock » fournis. Recommandé pour chirurgie de la cataracte. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19069\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Aspirating Speculum",
"description": "Adjustable, 17- and 18-mm open-bladed speculum, supplied with silicone tubing and luer-lock adapter. Recommended for cataract surgery. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19069\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "75208f09-eefe-4ced-9aa5-59486f923344",
"ref": "19069T",
"cat": "moria-blepharostats",
"sort": 8,
"fr": {
"nom": "Set de remplacement tubulure silicone",
"description": "Pour #19069 (non représenté). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19069T\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Silicone Tubing Replacement Set",
"description": "For #19069 (not shown). MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19069T\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f6852331-d34b-4b90-ba13-a5a6510cdee0",
"ref": "19078",
"cat": "moria-blepharostats",
"sort": 9,
"fr": {
"nom": "Blépharostat Colibri réglable",
"description": "Oreilles ouvertes de 16 mm, encombrement réduit, extrémités en olive pour confort optimal du patient. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19078\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Adjustable Colibri Speculum",
"description": "16-mm open blades, small size, olive-shaped tips for optimal safety. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19078\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5a45231f-032e-4d5f-b423-c9bd59f52586",
"ref": "20035",
"cat": "moria-blepharostats",
"sort": 10,
"fr": {
"nom": "Blépharostat réglable – oreilles ouvertes et arrondies de 14 mm",
"description": "Oreilles ouvertes et arrondies de 14 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20035\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Adjustable Speculum – 14-mm open curved blades",
"description": "14-mm open curved blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20035\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d5b2f44c-c357-4da2-9f5e-2cdad4d9fe8e",
"ref": "20036",
"cat": "moria-blepharostats",
"sort": 11,
"fr": {
"nom": "Blépharostat réglable – oreilles pleines de 13 mm",
"description": "Oreilles pleines de 13 mm. Recommandé pour chirurgie de la cataracte et chirurgie réfractive. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20036\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Adjustable Speculum – 13-mm solid blades",
"description": "13-mm solid blades. Recommended for cataract and refractive surgeries. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20036\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "15eff415-03e0-47e6-9770-20c1254d63e3",
"ref": "20042",
"cat": "moria-blepharostats",
"sort": 12,
"fr": {
"nom": "Blépharostat réglable – oreilles carrées de 15 mm",
"description": "Oreilles carrées de 15 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20042\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Adjustable Speculum – 15-mm square lid blades",
"description": "15-mm square lid blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20042\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d60fb9bc-21bd-40b6-b1a8-9bb8159a36d4",
"ref": "6346A",
"cat": "moria-blepharostats",
"sort": 13,
"fr": {
"nom": "Blépharostat de Barraquer – « Colibri », adulte, oreilles de 15 mm",
"description": "« Colibri », adulte, oreilles de 15 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6346A\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Speculum – \"Colibri\", adult size, 15-mm lid blades",
"description": "\"Colibri\", adult size, 15-mm lid blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6346A\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8b058aa4-7fb2-4222-a690-cc884daa2d08",
"ref": "18221",
"cat": "moria-blepharostats",
"sort": 14,
"fr": {
"nom": "Blépharostat de Kratz",
"description": "Oreilles ouvertes de 15 mm, oblique. Recommandé pour incisions temporales et pour chirurgie de la cataracte. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18221\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kratz Speculum",
"description": "15-mm open-blades speculum, oblique. Recommended for temporal incisions and for cataract surgery. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18221\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "cd226664-5e9a-4d1b-aba3-76ba688b4e3f",
"ref": "7699",
"cat": "moria-blepharostats",
"sort": 15,
"fr": {
"nom": "Blépharostat de Corcelle",
"description": "Cuillères pleines de 8 mm, amagnétique. Recommandé pour petites chirurgies et consultation. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7699\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Corcelle Speculum",
"description": "8-mm solid blades, non magnetic. Recommended for small surgeries and consultation. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7699\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "079e7ffc-16a0-487c-b79a-f7086ac288b7",
"ref": "6346B",
"cat": "moria-blepharostats",
"sort": 16,
"fr": {
"nom": "Blépharostat de Barraquer – « Colibri », enfant, oreilles de 13 mm",
"description": "« Colibri », enfant, oreilles de 13 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6346B\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Speculum – \"Colibri\", child size, 13-mm lid blades",
"description": "\"Colibri\", child size, 13-mm lid blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6346B\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6e31198e-665c-450d-b75c-f45274d12354",
"ref": "6346C",
"cat": "moria-blepharostats",
"sort": 17,
"fr": {
"nom": "Blépharostat de Barraquer – « Colibri », bébé, oreilles de 10 mm",
"description": "« Colibri », bébé, oreilles de 10 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6346C\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Speculum – \"Colibri\", baby size, 10-mm lid blades",
"description": "\"Colibri\", baby size, 10-mm lid blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6346C\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1c0dac9c-86f1-4b89-bed1-6fb33ec8065c",
"ref": "6346D",
"cat": "moria-blepharostats",
"sort": 18,
"fr": {
"nom": "Blépharostat de Barraquer – « Colibri », nouveau né, oreilles de 7 mm",
"description": "« Colibri », nouveau né, oreilles de 7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6346D\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Speculum – \"Colibri\", newborn size, 7-mm lid blades",
"description": "\"Colibri\", newborn size, 7-mm lid blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6346D\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8fe7badf-96df-4432-9fe4-b1eea4acb42d",
"ref": "9627B",
"cat": "moria-blepharostats",
"sort": 19,
"fr": {
"nom": "Blépharostat de Castroviejo – modèle enfant, oreilles de 11 mm",
"description": "Modèle enfant, oreilles de 11 mm. Recommandé pour chirurgie strabisme et décollement de rétine. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9627B\nFamille : Blépharostats\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Speculum – child model, 11-mm lid blades",
"description": "Child model, 11-mm lid blades. Recommended for strabismus and retinal detachment surgery. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9627B\nFamily: Speculums\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2d6dc6d3-78c7-40d9-9b32-ce6cadee6e1b",
"ref": "M2002",
"cat": "moria-pinces-capsulorhexis",
"sort": 1,
"fr": {
"nom": "Pince d'Utrata",
"description": "Manche plat strié, branches droites, extrémités mousses à 45°, incision 1,8 mm, longueur 8,6 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M2002\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Utrata Forceps",
"description": "Flat serrated handle, straight jaws, 45° blunt tips, 1.8-mm incision, 8.6-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M2002\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9d49f9f6-edc3-4971-b203-c3bdc8f825c4",
"ref": "M2002C",
"cat": "moria-pinces-capsulorhexis",
"sort": 2,
"fr": {
"nom": "Pince de Corydon",
"description": "Manche plat strié, branches courbes, extrémités pointues à 90°, incision 1,8 mm, longueur 8,6 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M2002C\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Corydon Forceps",
"description": "Flat serrated handle, curved jaws, 90° pointed tips, 1.8-mm incision, 8.6-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M2002C\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ed5ba17e-d29d-4dfa-b48a-99bc028dc239",
"ref": "20000",
"cat": "moria-pinces-capsulorhexis",
"sort": 3,
"fr": {
"nom": "Pince de Crozafon",
"description": "Branches courbes, extrémités pointues à 45°, incision 2,2 mm, longueur 12 cm. Livrée avec protecteur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20000\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Crozafon Forceps",
"description": "Curved jaws, 45° pointed tips, for 2.2-mm incision, 12-cm long. Sold with protector. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20000\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a0ce4ed9-0fa6-4256-8d30-ed8465a05f80",
"ref": "19079",
"cat": "moria-pinces-capsulorhexis",
"sort": 4,
"fr": {
"nom": "Pince à Action Croisée de Hachet",
"description": "Branches courbes, extrémités pointues à 45°, incision 2,2 mm, longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19079\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Hachet Cross-Action Forceps",
"description": "Curved shaft, 45° pointed tips, for 2.2-mm incision, 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19079\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "952f859b-8f71-48ab-b7f7-44ac3158cd03",
"ref": "20020",
"cat": "moria-pinces-capsulorhexis",
"sort": 5,
"fr": {
"nom": "Pince capsulorhexis à action croisée 1,5 mm",
"description": "Branches courbes, extrémités pointues à 90°, incision 1,5 mm, longueur 11 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20020\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cross-Action Capsulorhexis Forceps 1.5 mm",
"description": "Curved shaft, 90° pointed tips, for 1.5-mm incision, 11-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20020\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "65d2f925-6db4-48e0-9147-ed658ea806e7",
"ref": "20031",
"cat": "moria-pinces-capsulorhexis",
"sort": 6,
"fr": {
"nom": "Pince Action Croisée",
"description": "Branches courbes, extrémités pointues à 45°, incision 1,8 mm, longueur 12,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20031\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cross-Action Forceps",
"description": "Curved shaft, 45° pointed tips, for 1.8-mm incision, 12.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20031\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a146367c-9e2e-4cff-a740-b192f0f0eb26",
"ref": "20221X1",
"cat": "moria-pinces-capsulorhexis",
"sort": 7,
"fr": {
"nom": "Pince Rhexis 23G, Longue",
"description": "Extrémités pointues à 90°, courbe, graduation laser, diamètre de 0,6 mm pour des incisions de 1,00 mm. Pince à commande distale. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20221X1\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "23G Rhexis Forceps, Long",
"description": "90° pointed tips, curved, laser graduation, 0.6-mm diameter for 1-mm incision. Distal-command forceps. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20221X1\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "3d6264b9-799d-4c75-9304-a9d33656a87f",
"ref": "20222X1",
"cat": "moria-pinces-capsulorhexis",
"sort": 8,
"fr": {
"nom": "Pince Rhexis 23G, Courte",
"description": "Extrémités pointues à 90°, courbe, graduation laser, diamètre de 0,6 mm pour des incisions de 1,00 mm. Pince à commande distale. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20222X1\nFamille : Pinces capsulorhexis\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "23G Rhexis Forceps, Short",
"description": "90° pointed tips, curved, laser graduation, 0.6-mm diameter for 1-mm incision. Distal-command forceps. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20222X1\nFamily: Capsulorhexis forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6b8c4fa2-0650-4bab-95a4-ab8d6f5845c2",
"ref": "M1809",
"cat": "moria-pinces-cornee-sclere",
"sort": 1,
"fr": {
"nom": "Pince de Bonn – manche plat strié, dents de 0, 12 mm, longueur 7, 3 cm",
"description": "Manche plat strié, dents de 0,12 mm, longueur 7,3 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M1809\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn Forceps – flat serrated handle, 0.12-mm teeth, 7.3-cm long",
"description": "Flat serrated handle, 0.12-mm teeth, 7.3-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M1809\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f4c96c3f-1063-43c4-a1ae-fa145268db97",
"ref": "7835",
"cat": "moria-pinces-cornee-sclere",
"sort": 2,
"fr": {
"nom": "Pince de Bonn – à plateaux et micro dents de 0, 1 mm face à face",
"description": "À plateaux et micro dents de 0,1 mm face à face. Longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7835\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn Forceps – with platforms and 0.1-mm facing micro teeth",
"description": "With platforms and 0.1-mm facing micro teeth, 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7835\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "218b7268-4874-440a-bb56-d95c5fefc768",
"ref": "TI7835",
"cat": "moria-pinces-cornee-sclere",
"sort": 3,
"fr": {
"nom": "Pince de Bonn – titane",
"description": "Version en titane de la pince de Bonn réf. 7835 : à plateaux et micro dents de 0,1 mm face à face, longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : TI7835\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn Forceps – titanium",
"description": "Titanium version of the Bonn forceps ref. 7835: platforms and 0.1-mm facing micro teeth, 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: TI7835\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5e330b79-e70c-45f1-bfd7-3100e4db2ce1",
"ref": "7850A",
"cat": "moria-pinces-cornee-sclere",
"sort": 4,
"fr": {
"nom": "Pince de Bonn-Moria – droite à plateaux et micro dents de 0, 1 mm face à face",
"description": "Droite à plateaux et micro dents de 0,1 mm face à face. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7850A\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn-Moria Forceps – straight with platforms and 0.1-mm facing micro teeth",
"description": "Straight with platforms and 0.1-mm facing micro teeth. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7850A\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "58669bc0-d9af-44e8-94df-cc518f332fb1",
"ref": "7850B",
"cat": "moria-pinces-cornee-sclere",
"sort": 5,
"fr": {
"nom": "Pince de Moria – coudée en baïonnette, dents de 0, 1 mm et plateaux",
"description": "Coudée en baïonnette, dents de 0,1 mm et plateaux. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7850B\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria Forceps – bayonet shaped, with 0.1-mm teeth and platforms",
"description": "Bayonet shaped, with 0.1-mm teeth and platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7850B\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6a6ef8b0-9e93-4fe3-bac2-6bb32160a85e",
"ref": "13160",
"cat": "moria-pinces-cornee-sclere",
"sort": 6,
"fr": {
"nom": "Pince de Bonn – ergonomique, à plateaux et micro dents de 0",
"description": "Ergonomique, à plateaux et micro dents de 0,1 mm face à face. Longueur 9,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13160\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn Forceps – ergonomic, and 0.1-mm facing micro teeth, 9.5-cm long",
"description": "Ergonomic, and 0.1-mm facing micro teeth, 9.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13160\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4be67ca1-ee42-456f-9b69-765d16de108e",
"ref": "13161",
"cat": "moria-pinces-cornee-sclere",
"sort": 7,
"fr": {
"nom": "Pince de Bonn-Moria – ergonomique, à plateaux et micro dents de 0",
"description": "Ergonomique, à plateaux et micro dents de 0,1 mm face à face. Longueur 11 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13161\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn-Moria Forceps – ergonomic, platforms and 0.1-mm facing micro teeth",
"description": "Ergonomic, platforms and 0.1-mm facing micro teeth. 11-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13161\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c8c22d6c-204e-4815-aefe-582b6b8a5f21",
"ref": "13246",
"cat": "moria-pinces-cornee-sclere",
"sort": 8,
"fr": {
"nom": "Pince de Bonn-Kraff",
"description": "Ergonomique, à branches longues, dents de 0,1 mm et plateaux. Longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13246\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonn-Kraff Forceps",
"description": "Ergonomic, long jaws, 0.1-mm teeth and platforms. 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13246\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4615ec91-99fc-4e1a-ab41-5539e0e65438",
"ref": "13240",
"cat": "moria-pinces-cornee-sclere",
"sort": 9,
"fr": {
"nom": "Pince de Kraff-Moria",
"description": "Ergonomique, dents obliques 0,1 mm, plateaux pour fils. Longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13240\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kraff-Moria Forceps",
"description": "Ergonomic, 0.1-mm oblique teeth, with tying platforms. 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13240\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0380d8e2-d58a-4ca3-9c99-a048d408efd4",
"ref": "7862",
"cat": "moria-pinces-cornee-sclere",
"sort": 10,
"fr": {
"nom": "Pince de Barraquer-Troutman",
"description": "Type « Colibri », dents obliques 0,12 mm, plateaux pour fils. Longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7862\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer-Troutman Forceps",
"description": "\"Colibri\" type, 0.12-mm oblique teeth, with tying platforms. 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7862\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "3c90a25f-7e32-460c-9178-883a3385a5c6",
"ref": "9803",
"cat": "moria-pinces-cornee-sclere",
"sort": 11,
"fr": {
"nom": "Pince de Pierse",
"description": "Type « Colibri », à alvéoles de 0,2 mm et plateaux. Longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9803\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Pierse Forceps",
"description": "\"Colibri\" type, 0.2-mm notched jaws and platforms. 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9803\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ce8c57c7-36df-4d15-9e2a-e3075991606d",
"ref": "13245",
"cat": "moria-pinces-cornee-sclere",
"sort": 12,
"fr": {
"nom": "Pince de Mac Pherson-Moria",
"description": "Ergonomique, coudée sur 11 mm, dents 0,15 mm et plateaux. Avec griffe. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13245\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Mac Pherson-Moria Forceps",
"description": "Ergonomic, angled on 11 mm, 0.15-mm teeth and platforms. With spong. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13245\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1be950f6-9d47-4e5a-bf6e-d2e3cb7696d8",
"ref": "M1796",
"cat": "moria-pinces-cornee-sclere",
"sort": 13,
"fr": {
"nom": "Pince de Castroviejo – manche plat strié, dents de 0, 12 mm et plateaux de 5",
"description": "Manche plat strié, dents de 0,12 mm et plateaux de 5,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M1796\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Forceps – flat serrated handle",
"description": "Flat serrated handle, 0.12-mm teeth and 5.5-mm platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M1796\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7b299456-4b22-42ba-b601-92159f07b4b0",
"ref": "7384",
"cat": "moria-pinces-cornee-sclere",
"sort": 14,
"fr": {
"nom": "Pince de Castroviejo – dents obliques de 0, 4 mm et plateaux pour fils",
"description": "Dents obliques de 0,4 mm et plateaux pour fils. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7384\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Forceps – 0.4-mm oblique teeth, and tying platforms",
"description": "0.4-mm oblique teeth, and tying platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7384\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7c9cf4df-e67b-4a78-8be0-59f9c43c0dbe",
"ref": "9510",
"cat": "moria-pinces-cornee-sclere",
"sort": 15,
"fr": {
"nom": "Pince de Castroviejo « Utility »",
"description": "Dents obliques de 0,3 mm et plateaux. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9510\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Forceps \"Utility\"",
"description": "0.3-mm oblique teeth with platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9510\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "df80fc47-3ab5-46f9-a500-3d8f146254e5",
"ref": "9965",
"cat": "moria-pinces-cornee-sclere",
"sort": 16,
"fr": {
"nom": "Pince de Remky Polak",
"description": "Dents de 3 mm. Permet de positionner les quatre points cardinaux. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9965\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Remky Polak Forceps",
"description": "3-mm teeth. Positioning of the four cardinal points. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9965\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "56cbf188-b0f5-4f9e-8589-2c7861f38cef",
"ref": "3222",
"cat": "moria-pinces-cornee-sclere",
"sort": 17,
"fr": {
"nom": "Pince de Jayle",
"description": "Dents de 0,8 mm face à face et plateaux pour fils. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 3222\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Jayle Forceps",
"description": "0.8-mm facing teeth and tying platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 3222\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "045fd85f-82c4-41f1-9a51-1f4ea1aa6d7f",
"ref": "3225",
"cat": "moria-pinces-cornee-sclere",
"sort": 18,
"fr": {
"nom": "Pince de Paufique",
"description": "Dents obliques de 0,8 mm et plateaux pour fils, type Manhattan Eye and Ear Hospital. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 3225\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Paufique Forceps",
"description": "0.8-mm oblique teeth and tying platforms, Manhattan Eye and Ear Hospital type. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 3225\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-3225.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "116f0bed-5a84-4bf8-8ea5-53a4adbf37ab",
"ref": "6223",
"cat": "moria-pinces-cornee-sclere",
"sort": 19,
"fr": {
"nom": "Pince de De Saint Martin-Barraquer",
"description": "Affinée, dents obliques de 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6223\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "De Saint Martin-Barraquer Forceps",
"description": "Thin, 0.5-mm oblique teeth. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6223\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "3ab42c33-5c90-4083-ba91-b0c7c6800ee7",
"ref": "2280A",
"cat": "moria-pinces-cornee-sclere",
"sort": 20,
"fr": {
"nom": "Pince de Lester",
"description": "À conjonctive, dents de 1 mm, fine, usuelle. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2280A\nFamille : Pinces cornée et sclère\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lester Forceps",
"description": "Conjunctiva, 1-mm teeth, delicate, usual. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2280A\nFamily: Corneal and scleral forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a8fef4bc-cd02-4ec0-9229-548be0d837ad",
"ref": "M1815S",
"cat": "moria-pinces-a-nouer",
"sort": 1,
"fr": {
"nom": "Pince de Mac Pherson – manche plat strié, mors droits, plateaux de 4 mm",
"description": "Manche plat strié, mors droits, plateaux de 4 mm, longueur 8,4 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M1815S\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Mac Pherson Forceps – flat serrated handle, straight jaws, 4-mm platforms",
"description": "Flat serrated handle, straight jaws, 4-mm platforms, 8.4-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M1815S\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d73d16db-d0f9-401c-90c5-52a36f6954e7",
"ref": "M1815A",
"cat": "moria-pinces-a-nouer",
"sort": 2,
"fr": {
"nom": "Pince de Mac Pherson – manche plat strié, mors coudés, plateaux de 4 mm",
"description": "Manche plat strié, mors coudés, plateaux de 4 mm, longueur 8,2 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M1815A\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Mac Pherson Forceps – flat serrated handle, angled jaws, 4-mm platforms",
"description": "Flat serrated handle, angled jaws, 4-mm platforms, 8.2-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M1815A\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a49777cb-900a-47d9-a968-ae4489a68a55",
"ref": "M1815AK",
"cat": "moria-pinces-a-nouer",
"sort": 3,
"fr": {
"nom": "Pince de Kelman-Mac Pherson – manche plat strié, mors coudés à plateau de 7 mm",
"description": "Manche plat strié, mors coudés à plateau de 7 mm, longueur 8,2 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M1815AK\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kelman-Mac Pherson Forceps – flat serrated handle, angled jaws, 7-mm platforms",
"description": "Flat serrated handle, angled jaws, 7-mm platforms, 8.2 cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M1815AK\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "92f9c19e-f69a-43fc-8b6a-ed79beb4e718",
"ref": "M5030",
"cat": "moria-pinces-a-nouer",
"sort": 4,
"fr": {
"nom": "Pince de Kelman-Mac Pherson – manche plat strié, mors coudés à plateau de 11 mm",
"description": "Manche plat strié, mors coudés à plateau de 11 mm, longueur 8,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M5030\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kelman-Mac Pherson Forceps – flat serrated handle, angled jaws, 11-mm platforms",
"description": "Flat serrated handle, angled jaws, 11-mm platforms, 8.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M5030\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d2fb755b-712e-4c8c-94af-dc86454e8dbf",
"ref": "7835C",
"cat": "moria-pinces-a-nouer",
"sort": 5,
"fr": {
"nom": "Pince de Moria – droite, à micro plateaux (7835C)",
"description": "Droite, à micro plateaux. Longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7835C\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria Forceps – straight, with micro platforms (7835C)",
"description": "Straight, with micro platforms. 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7835C\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f6da3fc1-4b5c-4437-9d56-03f245eae92d",
"ref": "7850C",
"cat": "moria-pinces-a-nouer",
"sort": 6,
"fr": {
"nom": "Pince de Moria – droite, à micro plateaux (7850C)",
"description": "Droite, à micro plateaux. Longueur 10 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7850C\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria Forceps – straight, with micro platforms (7850C)",
"description": "Straight, with micro platforms. 10-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7850C\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8b05bbda-d64d-4297-9355-f95c683ebeca",
"ref": "2432",
"cat": "moria-pinces-a-nouer",
"sort": 7,
"fr": {
"nom": "Pince de Barraquer – droite, avec 2 plateaux mousses, mors 1 mm",
"description": "Droite, avec 2 plateaux mousses, mors 1 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2432\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Forceps – straight, with 2 blunt platforms, 1-mm jaws",
"description": "Straight, with 2 blunt platforms, 1-mm jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2432\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "75819e1e-0ca1-4141-9675-3d4cad961a7e",
"ref": "7431",
"cat": "moria-pinces-a-nouer",
"sort": 8,
"fr": {
"nom": "Pince de Barraquer « Colibri »",
"description": "Plateaux ultra fins 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7431\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Forceps \"Colibri\"",
"description": "Very delicate, 0.5-mm platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7431\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "573214f4-2c3b-4934-b981-4c58c9e1fa02",
"ref": "9604",
"cat": "moria-pinces-a-nouer",
"sort": 9,
"fr": {
"nom": "Pince de Troutman – droite, fine",
"description": "Droite, fine. Monofil 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9604\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman Forceps – straight, delicate",
"description": "Straight, delicate. 10/0 monofilament. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9604\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "94dc493c-5092-4de4-a71c-0dab48b81960",
"ref": "9605",
"cat": "moria-pinces-a-nouer",
"sort": 10,
"fr": {
"nom": "Pince de Troutman – courbe, fine",
"description": "Courbe, fine. Monofil 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9605\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman Forceps – curved, delicate",
"description": "Curved, delicate. 10/0 monofilament. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9605\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a15d62c0-ebbd-4c43-b43a-918908cf6d61",
"ref": "13167",
"cat": "moria-pinces-a-nouer",
"sort": 11,
"fr": {
"nom": "Pince de Moria – droite, plateaux ultra fins pour monofil 10/0",
"description": "Droite, plateaux ultra fins pour monofil 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13167\nFamille : Pinces à nouer\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria Forceps – straight, very delicate platforms for 10/0 monofilament",
"description": "Straight, very delicate platforms for 10/0 monofilament. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13167\nFamily: Tying forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "038795c1-eaab-448e-b71c-7c0654e5be45",
"ref": "6031BIS",
"cat": "moria-pinces-sans-dents",
"sort": 1,
"fr": {
"nom": "Pince – modèle suisse, très fine, mors de 1, 5 mm",
"description": "Modèle suisse, très fine, mors de 1,5 mm, concave/convexe. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6031BIS\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Forceps – swiss model, 1.5-mm concave/convexe jaws",
"description": "Swiss model, 1.5-mm concave/convexe jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6031BIS\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0c58d38a-5965-4a42-b330-db0be82b4576",
"ref": "2146",
"cat": "moria-pinces-sans-dents",
"sort": 2,
"fr": {
"nom": "Pince – droite, moyenne, usuelle",
"description": "Droite, moyenne, usuelle. Mors de 4,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2146\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Forceps – straight, medium size, standard",
"description": "Straight, medium size, standard. 4.5-mm jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2146\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fae7040e-faa7-49b8-a69c-e99b581a7336",
"ref": "18225",
"cat": "moria-pinces-sans-dents",
"sort": 3,
"fr": {
"nom": "Pince de Fechtner",
"description": "Ergonomique, droite et à micro-plateaux. Complètement atraumatique grâce à son extrémité formée de deux anneaux. Extrémité de 6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18225\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Fechtner Forceps",
"description": "Ergonomic, straight with fine tying platforms. Micro ring tips handles conjunctiva atraumatically. 6-mm length tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18225\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e928f1c2-30fd-4fc1-a7a5-93e395cf7a2b",
"ref": "2180A",
"cat": "moria-pinces-sans-dents",
"sort": 4,
"fr": {
"nom": "Pince de Bonaccolto",
"description": "Droite, usuelle, mors striés de 0,8 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2180A\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bonaccolto Forceps",
"description": "Straight, usual, 0.8-mm serrated jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2180A\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5bb78590-cfcc-4e3c-af67-c69e3cdc08cd",
"ref": "2183",
"cat": "moria-pinces-sans-dents",
"sort": 5,
"fr": {
"nom": "Pince – courbe, usuelle, mors striés de 1 mm",
"description": "Courbe, usuelle, mors striés de 1 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2183\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Forceps – curved, usual, 1-mm serrated jaws",
"description": "Curved, usual, 1-mm serrated jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2183\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a185c20a-15ca-43e9-a2f6-2816b1eff9e1",
"ref": "MC31",
"cat": "moria-pinces-sans-dents",
"sort": 6,
"fr": {
"nom": "Pince à iris courbe",
"description": "10 cm, striée. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC31\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Iris forceps, curved",
"description": "10-cm long, with delicate teeth. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC31\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "20e5444a-45ce-43a3-ab98-87dc4d26d3e3",
"ref": "MC32",
"cat": "moria-pinces-sans-dents",
"sort": 7,
"fr": {
"nom": "Pince à iris droite",
"description": "10 cm, striée. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC32\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Iris forceps, straight",
"description": "10-cm long, with fine teeth. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC32\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7e89d6ba-572f-4859-94c0-30b1148cf0d7",
"ref": "MC40",
"cat": "moria-pinces-sans-dents",
"sort": 8,
"fr": {
"nom": "Pince Dumont – modèle Moria, droite, serrant sur 4 mm",
"description": "Modèle Moria, droite, serrant sur 4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC40\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Dumont Forceps – moria design, straight, tips closing flat on 4 mm",
"description": "Moria design, straight, tips closing flat on 4 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC40\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5ff14a40-2f72-4eb0-8241-74f6609898e6",
"ref": "MC40B",
"cat": "moria-pinces-sans-dents",
"sort": 9,
"fr": {
"nom": "Pince Dumont – modèle Moria, courbe serrant sur 4 mm",
"description": "Modèle Moria, courbe serrant sur 4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC40B\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Dumont Forceps – moria design, curved, tips closing flat on 4 mm",
"description": "Moria design, curved, tips closing flat on 4 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC40B\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "49c85803-b45c-4a07-8b8f-1451a284d9e0",
"ref": "9980",
"cat": "moria-pinces-sans-dents",
"sort": 10,
"fr": {
"nom": "Pince micro chirurgie Moria – droite, ultra fine, longueur 13 cm",
"description": "Droite, ultra fine, longueur 13 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9980\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria micro surgery forceps – straight, extra delicate, 13-cm long",
"description": "Straight, extra delicate, 13-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9980\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ec6c2cd0-af3f-4871-abd9-54da06b1c36c",
"ref": "9983",
"cat": "moria-pinces-sans-dents",
"sort": 11,
"fr": {
"nom": "Pince micro chirurgie Moria – droite, longueur 13 cm",
"description": "Droite, longueur 13 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9983\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Micro surgery forceps",
"description": "Straight, 13-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9983\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "705018fd-8207-4198-ad24-30645a560b74",
"ref": "9987",
"cat": "moria-pinces-sans-dents",
"sort": 12,
"fr": {
"nom": "Pince micro chirurgie Moria – courbe, longueur 13 cm",
"description": "Courbe, longueur 13 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9987\nFamille : Pinces sans dents\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Moria micro surgery forceps – curved, 13-cm long",
"description": "Curved, 13-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9987\nFamily: Toothless forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1438e0c1-8cd6-412d-a5b0-4d5aafa9e6d5",
"ref": "20038",
"cat": "moria-pinces-keratoplastie",
"sort": 1,
"fr": {
"nom": "Pince DMEK courbe",
"description": "Courbure de 7°, plateaux de 10 mm, longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20038\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Curved DMEK Forceps",
"description": "7° curvature, 10-mm platforms, 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20038\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "92a1f567-a09b-44ee-adb5-20ed4842c987",
"ref": "20039",
"cat": "moria-pinces-keratoplastie",
"sort": 2,
"fr": {
"nom": "Pince DMEK droite",
"description": "Plateaux de 10 mm, longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20039\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Straight DMEK Forceps",
"description": "10-mm platforms, 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20039\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a80d055b-f636-4edb-a3d1-00283574cde1",
"ref": "19097",
"cat": "moria-pinces-keratoplastie",
"sort": 3,
"fr": {
"nom": "Pince descemetorhexis de Gorovoy",
"description": "Forme Utrata inversée, bout émoussé, longueur 11,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19097\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "DSO Gorovoy Forceps",
"description": "Inverted Utrata shaped, blunt tip, 11.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19097\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4cec8a71-98e2-4114-bfaa-941e236ca0a4",
"ref": "20003",
"cat": "moria-pinces-keratoplastie",
"sort": 4,
"fr": {
"nom": "Pince d'Ogawa",
"description": "Pince à introduire le lenticule du donneur (DSAEK) : extrémité mousse pour la libération du greffon dans l'œil du patient ; angulation optimisée du manche pour un contrôle du bout des doigts ; lorsque la pince est fermée, les extrémités des parties actives restent légèrement espacées afin de ne pas comprimer le greffon. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20003\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Ogawa Inserting Forceps",
"description": "For donor button insertion (DSAEK): blunt tips for the release of donor tissue inside the patient's eye; angulation of handle optimized for fingertip control; when the instrument is closed, the active tips remain slightly open so as not to compress the donor tissue. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20003\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9ed92fe4-e372-42ca-bc65-e06dee3f23be",
"ref": "20004",
"cat": "moria-pinces-keratoplastie",
"sort": 5,
"fr": {
"nom": "Pince de Busin 20G",
"description": "Pour saisir et positionner le lenticule cornéen du donneur (DSAEK) : pince à micro-incision, action distale ; conçue pour positionner un greffon DSAEK dans la spatule de Busin puis le tirer depuis la spatule vers la chambre antérieure du receveur ; taille des pointes adaptée à la spatule ; extrémité atraumatique des pointes pour saisir le greffon donneur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20004\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Busin Forceps 20G",
"description": "For grasping and positioning the donor graft (DSAEK): micro-incision forceps, distal action; designed to position a DSAEK graft in the Busin spatula and to pull it from the spatula into the recipient's anterior chamber; size of the tips adapted to the spatula; atraumatic ridges to grasp the donor button. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20004\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0098eb1d-ed63-44a4-b479-68c701aee094",
"ref": "20011",
"cat": "moria-pinces-keratoplastie",
"sort": 6,
"fr": {
"nom": "Pince de Busin 23G",
"description": "Pour saisir et positionner le lenticule cornéen du donneur (DSAEK) : pince à micro-incision, action distale ; conçue pour positionner un greffon DSAEK dans la spatule de Busin puis le tirer depuis la spatule vers la chambre antérieure du receveur ; taille des pointes adaptée à la spatule ; extrémité atraumatique des pointes pour saisir le greffon donneur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20011\nFamille : Pinces de kératoplastie\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Busin Forceps 23G",
"description": "For grasping and positioning the donor graft (DSAEK): micro-incision forceps, distal action; designed to position a DSAEK graft in the Busin spatula and to pull it from the spatula into the recipient's anterior chamber; size of the tips adapted to the spatula; atraumatic ridges to grasp the donor button. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20011\nFamily: Keratoplasty forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "81e14d9d-7635-4ff1-bdd5-72d8c39ca104",
"ref": "MC43",
"cat": "moria-pinces-autres",
"sort": 1,
"fr": {
"nom": "Pince de De Wecker « Moustique » – droite",
"description": "Droite. Longueur 5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC43\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "De Wecker Forceps \"Mosquito\" – straight",
"description": "Straight. 5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC43\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1ee64a10-f62e-44ff-b2f9-a618f3b0e136",
"ref": "MC44",
"cat": "moria-pinces-autres",
"sort": 2,
"fr": {
"nom": "Pince de De Wecker « Moustique » – courbe",
"description": "Courbe. Longueur 5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC44\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "De Wecker Forceps \"Mosquito\" – curved",
"description": "Curved. 5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC44\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6caea54b-18db-4d60-bca9-cc6eb684e41d",
"ref": "2321",
"cat": "moria-pinces-autres",
"sort": 3,
"fr": {
"nom": "Pince de De Wecker",
"description": "Droite, à action croisée. Longueur 7,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2321\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "De Wecker Forceps",
"description": "Straight, cross-action, 7.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2321\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "94399629-ba7f-4a92-a086-c3b230118dbb",
"ref": "2420A",
"cat": "moria-pinces-autres",
"sort": 4,
"fr": {
"nom": "Pince de Prince-Blascovics – à droite",
"description": "À droite. Longueur de l'extrémité 11,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2420A\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Prince-Blascovics Forceps – right side",
"description": "Right side. 11.5-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2420A\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "900e37ba-6e59-4fd6-9391-eca990a1a160",
"ref": "2420B",
"cat": "moria-pinces-autres",
"sort": 5,
"fr": {
"nom": "Pince de Prince-Blascovics – à gauche",
"description": "À gauche. Longueur de l'extrémité 11,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2420B\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Prince-Blascovics Forceps – left side",
"description": "Left side. 11.5-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2420B\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "77810a92-cfc2-4ec2-aa4f-734123f26cbe",
"ref": "2125",
"cat": "moria-pinces-autres",
"sort": 6,
"fr": {
"nom": "Pince de Desmarres",
"description": "Usuelle, 25 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2125\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Desmarres Forceps",
"description": "Usual, 25 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2125\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "63374496-f6f2-415a-9fbd-7ab2180971ff",
"ref": "2131",
"cat": "moria-pinces-autres",
"sort": 7,
"fr": {
"nom": "Pince de Lambert",
"description": "À mors ronds, 11 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2131\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lambert Forceps",
"description": "11-mm round jaws. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2131\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b7ea1e28-d0b4-4a16-8408-13088415aaac",
"ref": "20001",
"cat": "moria-pinces-autres",
"sort": 8,
"fr": {
"nom": "Micro Pre-chopper de Crozafon",
"description": "Pour incision de 2,2 mm, extrémités pointues semi-tranchantes. Longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20001\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Crozafon Micro Pre-chopper",
"description": "For 2.2-mm incision semi-sharp pointed tip. 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20001\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "06dc2bf8-0850-47b0-9176-ae4eb0d92ae4",
"ref": "2228",
"cat": "moria-pinces-autres",
"sort": 9,
"fr": {
"nom": "Pince d'Elschnig",
"description": "Droite à 1 x 2 dents obliques. Pour fixer le droit supérieur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2228\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Elschnig Forceps",
"description": "Straight, with 1 x 2 oblique teeth. Superior rectus fixation. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2228\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2b2306da-9d4c-4cdd-8373-6bfa37521bd0",
"ref": "2221",
"cat": "moria-pinces-autres",
"sort": 10,
"fr": {
"nom": "Pince de Barraquer – à 12 x 12 dents obliques, pour fixation sclérale",
"description": "À 12 x 12 dents obliques, pour fixation sclérale. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2221\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Forceps – 12 x 12 oblique teeth, for scleral fixation",
"description": "12 x 12 oblique teeth, for scleral fixation. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2221\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fc504d5e-98a4-4323-8677-412c0a8cf96c",
"ref": "19074",
"cat": "moria-pinces-autres",
"sort": 11,
"fr": {
"nom": "Pince explantation",
"description": "Mors striés, 7 mm, pour retirer les fragments de LIO. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19074\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Explantation Forceps",
"description": "7-mm serrated jaws, to remove IOL pieces. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19074\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "29294e0b-8c4d-4646-97e9-0bce8ab60103",
"ref": "19082",
"cat": "moria-pinces-autres",
"sort": 12,
"fr": {
"nom": "Pince de De Laage",
"description": "Pour sclérectomie profonde non perforante, extrémités très fines et émoussées. Extrémité de 7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19082\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "De Laage Glaucoma Forceps",
"description": "For deep non-penetrating sclerectomy delicate and smooth tips. 7-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19082\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e1de0c61-ac2e-459f-a386-9f5f598a27d4",
"ref": "18158",
"cat": "moria-pinces-autres",
"sort": 13,
"fr": {
"nom": "Pince de Colin",
"description": "Ergonomique à action croisée, mors extérieurs striés, longueur 11,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18158\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Colin Forceps",
"description": "Ergonomic, cross-action, externally serrated jaws, 11.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18158\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d958b83b-c4b1-49af-b59f-bd3d709c41cc",
"ref": "13238",
"cat": "moria-pinces-autres",
"sort": 14,
"fr": {
"nom": "Pince de Blaydes",
"description": "Mors plats, fins et mousses de 7 mm. Pour LIO à fixation irienne. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13238\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Blaydes Forceps",
"description": "7-mm flat jaws, delicate and blunt. For iris-fixated IOL. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13238\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c54918e4-f7ae-4236-aa6c-cec64e7ef51d",
"ref": "13261",
"cat": "moria-pinces-autres",
"sort": 15,
"fr": {
"nom": "Pince de Waring",
"description": "Ergonomique, mors 7 mm à plateaux. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13261\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Waring Forceps",
"description": "Ergonomic, 7-mm jaws with platforms. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13261\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1b0d0f89-46fe-45a1-9140-e0d4cb62062f",
"ref": "17161",
"cat": "moria-pinces-autres",
"sort": 16,
"fr": {
"nom": "Pince à tenir de Faulkner",
"description": "Mors inclinés, mousses et arrondis 11 mm, pour implants silicone acrylique. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17161\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Faulkner Forceps",
"description": "Special inclination blunt jaws, 11-mm long rounded jaws, for silicone acrylic lens. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17161\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1e479b76-730f-4dd5-a80d-9d6a97623ae8",
"ref": "19003",
"cat": "moria-pinces-autres",
"sort": 17,
"fr": {
"nom": "Pince à introduire IOL souple",
"description": "Action directe, pour implants silicone, acrylique. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19003\nFamille : Autres pinces\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Inserting Forceps",
"description": "Direct action, for silicone, acrylic lens. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19003\nFamily: Other forceps\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9146b69d-7ec2-430e-ab98-c49ea4cc81a4",
"ref": "2484",
"cat": "moria-porte-aiguilles",
"sort": 1,
"fr": {
"nom": "Porte-aiguilles de Vantey-Desvignes",
"description": "Mors larges et lisses, courts et droits, très forts. 4/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2484\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vantey-Desvignes Needle Holder",
"description": "Wide and smooth jaws, short and straight, very strong. 4/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2484\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a342c817-2a5b-46a1-93d6-0de53695e821",
"ref": "4134C",
"cat": "moria-porte-aiguilles",
"sort": 2,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors coniques et striés, courbe, à verrou",
"description": "Mors coniques et striés, courbe, à verrou. 4/0 à 6/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4134C\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – conical and serrated jaws, curved, with lock",
"description": "Conical and serrated jaws, curved, with lock. 4/0 to 6/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4134C\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e730c493-4567-42fc-9e7f-39641a0ffba6",
"ref": "4134D",
"cat": "moria-porte-aiguilles",
"sort": 3,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors coniques et striés, courbe, sans verrou",
"description": "Mors coniques et striés, courbe, sans verrou. 4/0 à 6/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4134D\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – conical and serrated jaws, curved, without lock",
"description": "Conical and serrated jaws, curved, without lock. 4/0 to 6/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4134D\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1f678c0c-e902-4f5c-9d1c-b905cbb2b98d",
"ref": "4180A",
"cat": "moria-porte-aiguilles",
"sort": 4,
"fr": {
"nom": "Porte-aiguilles de Barraquer – mors courbes et lisses de 1, 5 mm, à verrou",
"description": "Mors courbes et lisses de 1,5 mm, à verrou. Longueur 13 cm. 5/0 à 7/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4180A\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Needle Holder – curved and smooth 1.5 mm jaws, with lock",
"description": "Curved and smooth 1.5 mm jaws, with lock. 13-cm long. 5/0 to 7/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4180A\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "11f85249-ccb6-4ff1-89e9-1380da8f3a65",
"ref": "4180B",
"cat": "moria-porte-aiguilles",
"sort": 5,
"fr": {
"nom": "Porte-aiguilles de Barraquer – mors courbes et lisses de 1, 5 mm, sans verrou (4180B)",
"description": "Mors courbes et lisses de 1,5 mm, sans verrou. Longueur 13 cm. 5/0 à 7/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4180B\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Needle Holder – curved and smooth jaws 1.5 mm, without lock",
"description": "Curved and smooth jaws 1.5 mm, without lock. 13-cm long. 5/0 to 7/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4180B\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-4180b.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "47b307fc-2619-4d4e-b0de-3b999e0f4b43",
"ref": "7251",
"cat": "moria-porte-aiguilles",
"sort": 6,
"fr": {
"nom": "Porte-aiguilles de Barraquer-De Laage – mors courbes et lisses de 1 mm, sans verrou",
"description": "Mors courbes et lisses de 1 mm, sans verrou. Longueur 13 cm. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7251\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer-De Laage Needle Holder – curved and smooth jaws 1 mm, without lock",
"description": "Curved and smooth jaws 1 mm, without lock. 13-cm long. 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7251\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5d4a7a7a-792a-4e0d-af2e-dbf1568e66b3",
"ref": "7252",
"cat": "moria-porte-aiguilles",
"sort": 7,
"fr": {
"nom": "Porte-aiguilles de Barraquer – mors courbes et lisses de 1, 5 mm, sans verrou (7252)",
"description": "Mors courbes et lisses de 1,5 mm, sans verrou. Longueur 13 cm. 8/0 à 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7252\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Needle Holder – curved and smooth, 1.5-mm jaws, without lock",
"description": "Curved and smooth, 1.5-mm jaws, without lock. 13-cm long. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7252\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4ebce365-031d-4b0a-8a5c-33ffc2f8b7cf",
"ref": "7252BIS",
"cat": "moria-porte-aiguilles",
"sort": 8,
"fr": {
"nom": "Porte-aiguilles de Barraquer-De Laage – mors courbes et lisses ultra fins de 0, 8 mm",
"description": "Mors courbes et lisses ultra fins de 0,8 mm, sans verrou. Longueur 13 cm. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7252BIS\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer-De Laage Needle Holder – curved and smooth, very thin 0.8-mm jaws, without lock",
"description": "Curved and smooth, very thin 0.8-mm jaws, without lock. 13-cm long. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7252BIS\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "13c694a8-3220-4c9a-9ff3-221d84aee35a",
"ref": "8147",
"cat": "moria-porte-aiguilles",
"sort": 9,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors droits fins et lisses, à verrou, ressort souple",
"description": "Mors droits fins et lisses, à verrou, ressort souple. 8/0 à 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8147\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – straight, delicate and smooth jaws, with lock",
"description": "Straight, delicate and smooth jaws, with lock, with gentle spring action. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8147\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d45a0ba9-398d-4e22-a35a-a12dcc1ed6a0",
"ref": "8148",
"cat": "moria-porte-aiguilles",
"sort": 10,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors droits fins, lisses, sans verrou, ressort souple",
"description": "Mors droits fins, lisses, sans verrou, ressort souple. 8/0 à 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8148\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – delicate, straight, smooth jaws, without lock",
"description": "Delicate, straight, smooth jaws, without lock, gentle spring action. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8148\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b9217fbe-1cd9-459d-b4ac-7e27b2ed314b",
"ref": "8149",
"cat": "moria-porte-aiguilles",
"sort": 11,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors courbes, fins et lisses, à verrou, ressort souple",
"description": "Mors courbes, fins et lisses, à verrou, ressort souple. 8/0 à 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8149\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – delicate, curved and smooth jaws, with lock",
"description": "Delicate, curved and smooth jaws, with lock, gentle spring action. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8149\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "bedb96bb-1d5a-464e-bd77-bb5262e65c85",
"ref": "8150",
"cat": "moria-porte-aiguilles",
"sort": 12,
"fr": {
"nom": "Porte-aiguilles de Castroviejo – mors courbes, fins et lisses, sans verrou",
"description": "Mors courbes, fins et lisses, sans verrou, ressort souple. 8/0 à 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8150\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Needle Holder – delicate, curved and smooth jaws, without lock",
"description": "Delicate, curved and smooth jaws, without lock, gentle spring action. 8/0 to 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8150\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7fda1bb7-35ba-4279-a391-4fe8f64231d3",
"ref": "8151",
"cat": "moria-porte-aiguilles",
"sort": 13,
"fr": {
"nom": "Porte-aiguilles de Barraquer – mors courbes et lisses de 15 mm de longueur",
"description": "Mors courbes et lisses de 15 mm de longueur, sans verrou, extrémité large de 0,5 mm. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8151\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Needle Holder – curved and smooth 15-mm jaws 0.5-mm tip width",
"description": "Curved and smooth 15-mm jaws 0.5-mm tip width,without lock, 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8151\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "3808eb14-68e7-4a8b-9a37-7b0c9a1b9264",
"ref": "9960",
"cat": "moria-porte-aiguilles",
"sort": 14,
"fr": {
"nom": "Porte-aiguilles de Troutman-O'Brien – courbe, lisse, sans verrou, mors ultra fins de 0, 8 mm",
"description": "Courbe, lisse, sans verrou, mors ultra fins de 0,8 mm. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9960\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman-O'Brien Needle Holder – curved and smooth, very delicate, 0.8-mm jaws",
"description": "Curved and smooth, very delicate, 0.8-mm jaws, without lock, 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9960\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "eefc0ce5-a3e1-413a-8e91-a171ab30f613",
"ref": "TI9960",
"cat": "moria-porte-aiguilles",
"sort": 15,
"fr": {
"nom": "Porte-aiguilles de Troutman-O'Brien – titane",
"description": "Version en titane du porte-aiguilles réf. 9960 : courbe, lisse, sans verrou, mors ultra fins de 0,8 mm. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : TI9960\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman-O'Brien Needle Holder – titanium",
"description": "Titanium version of needle holder ref. 9960: curved and smooth, very delicate 0.8-mm jaws, without lock, 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: TI9960\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-ti9960.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9b7fe1b9-b2f9-4366-b332-580eaeea4800",
"ref": "9960BIS",
"cat": "moria-porte-aiguilles",
"sort": 16,
"fr": {
"nom": "Porte-aiguilles de Troutman-O'Brien – mors courbes, lisses, ultra fins de 0, 8 mm, à verrou",
"description": "Mors courbes, lisses, ultra fins de 0,8 mm, à verrou. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9960BIS\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman-O'Brien Needle Holder – curved, smooth, very delicate 0.8-mm jaws, with lock",
"description": "Curved, smooth, very delicate 0.8-mm jaws, with lock. 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9960BIS\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c1d58cea-be8b-4f18-a356-4d1aadca119f",
"ref": "13100",
"cat": "moria-porte-aiguilles",
"sort": 17,
"fr": {
"nom": "Porte-aiguilles de Barraquer-Moria",
"description": "Mors courbes, lisses, ultra fins de 0,8 mm, à verrou. 10/0. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13100\nFamille : Porte-aiguilles\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer-Moria Needle Holder",
"description": "Curved, smooth, very delicate 0.8-mm jaws, with lock. 10/0. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13100\nFamily: Needle holders\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a1799abc-85cc-454d-8a3c-4d2de1bcd7b2",
"ref": "8023A",
"cat": "moria-ciseaux",
"sort": 1,
"fr": {
"nom": "Ciseaux de Katzin – horaires",
"description": "Micro lames inverses égales, mousses, 6 mm, pour kératoplastie. Modèle horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8023A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Katzin Scissors – clockwise",
"description": "Equal micro inverted blades, blunt, 6 mm, for keratoplasty. Clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8023A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "89e1d30a-f2f7-4b9f-843d-1f3634c0863d",
"ref": "8023B",
"cat": "moria-ciseaux",
"sort": 2,
"fr": {
"nom": "Ciseaux de Katzin – anti-horaires",
"description": "Micro lames inverses égales, mousses, 6 mm, pour kératoplastie. Modèle anti-horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8023B\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Katzin Scissors – counter-clockwise",
"description": "Equal micro inverted blades, blunt, 6 mm, for keratoplasty. Counter-clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8023B\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "331bd7c2-e3d3-45c9-9169-7686c0fed12b",
"ref": "9850",
"cat": "moria-ciseaux",
"sort": 3,
"fr": {
"nom": "Ciseaux de Troutman – horaires",
"description": "Lames de 6 mm, pour kératoplastie. Modèle horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9850\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman Scissors – clockwise",
"description": "6-mm blade, for keratoplasty. Clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9850\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "80bc4398-9672-4fae-92e6-52ce6e76aaa3",
"ref": "9851",
"cat": "moria-ciseaux",
"sort": 4,
"fr": {
"nom": "Ciseaux de Troutman – anti-horaires",
"description": "Lames de 6 mm, pour kératoplastie. Modèle anti-horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9851\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Troutman Scissors – counter-clockwise",
"description": "6-mm blade, for keratoplasty. Counter-clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9851\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b20905b6-6a1e-485e-8a49-4f315c6ffeb0",
"ref": "20024",
"cat": "moria-ciseaux",
"sort": 5,
"fr": {
"nom": "Ciseaux de Busin – horaires",
"description": "Courbes ; lame supérieure plus courte et surface d'appui sur Descemet mousse, pour kératoplastie. Modèle horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20024\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Busin Scissors – clockwise",
"description": "Curved; shorter superior blade and foam bearing surface on Descemet, for keratoplasty. Clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20024\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "aa133b91-9ecc-4902-8b79-b96346f17198",
"ref": "20025",
"cat": "moria-ciseaux",
"sort": 6,
"fr": {
"nom": "Ciseaux de Busin – anti-horaires",
"description": "Courbes ; lame supérieure plus courte et surface d'appui sur Descemet mousse, pour kératoplastie. Modèle anti-horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20025\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Busin Scissors – counter-clockwise",
"description": "Curved; shorter superior blade and foam bearing surface on Descemet, for keratoplasty. Counter-clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20025\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "45822b0d-1ea4-47a6-b48e-368139cf23dc",
"ref": "20029",
"cat": "moria-ciseaux",
"sort": 7,
"fr": {
"nom": "Ciseaux de Gabison – horaires",
"description": "Courbes ; lame supérieure plus courte et lame inférieure avec plateforme. Longueur lame supérieure = 7 mm, longueur lame inférieure = 7,5 mm. Pour kératoplastie. Modèle horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20029\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gabison Scissors – clockwise",
"description": "Curved; shorter superior blade and lower blade with safety platform. Superior blade length = 7 mm, inferior blade length = 7.5 mm. For keratoplasty. Clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20029\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c5468864-b3c1-480d-86f9-d4a1cfffc3f0",
"ref": "20030",
"cat": "moria-ciseaux",
"sort": 8,
"fr": {
"nom": "Ciseaux de Gabison – anti-horaires",
"description": "Courbes ; lame supérieure plus courte et lame inférieure avec plateforme. Longueur lame supérieure = 7 mm, longueur lame inférieure = 7,5 mm. Pour kératoplastie. Modèle anti-horaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20030\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gabison Scissors – counter-clockwise",
"description": "Curved; shorter superior blade and lower blade with safety platform. Superior blade length = 7 mm, inferior blade length = 7.5 mm. For keratoplasty. Counter-clockwise model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20030\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2cf385db-2de5-4f69-a6b0-ae7f0cf77e24",
"ref": "9600",
"cat": "moria-ciseaux",
"sort": 9,
"fr": {
"nom": "Ciseaux de Vannas – droits, pointus, lames de 5 mm x 0, 5 mm",
"description": "Droits, pointus, lames de 5 mm x 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9600\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas Scissors – straight, pointed, blades 5 mm x 0.5 mm",
"description": "Straight, pointed, blades 5 mm x 0.5 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9600\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ecf5498b-11fb-48a9-a406-967261cb42a1",
"ref": "9600BIS",
"cat": "moria-ciseaux",
"sort": 10,
"fr": {
"nom": "Ciseaux de Vannas-Moria – droits, mousses, lames de 5 mm x 0, 5 mm",
"description": "Droits, mousses, lames de 5 mm x 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9600BIS\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas-Moria Scissors – straight, blunt, blades 5 mm x 0.5 mm",
"description": "Straight, blunt, blades 5 mm x 0.5 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9600BIS\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8f6707a8-0799-4e3e-bca0-6e11027a57a0",
"ref": "9601",
"cat": "moria-ciseaux",
"sort": 11,
"fr": {
"nom": "Ciseaux de Vannas – courbes, pointus, lames de 5 mm x 0, 5 mm",
"description": "Courbes, pointus, lames de 5 mm x 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9601\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas Scissors – curved, pointed, blades 5 mm x 0.5 mm",
"description": "Curved, pointed, blades 5 mm x 0.5 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9601\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5360be5b-1f28-4b22-8a9c-2f287b2bf55a",
"ref": "MC52",
"cat": "moria-ciseaux",
"sort": 12,
"fr": {
"nom": "Ciseaux de Vannas – droits, pointus, lames de 7 mm",
"description": "Droits, pointus, lames de 7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC52\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas Scissors – straight, pointed, 7-mm blades",
"description": "Straight, pointed, 7-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC52\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "43530683-5277-401d-9cd6-4afd4ca2ce6e",
"ref": "MC50",
"cat": "moria-ciseaux",
"sort": 13,
"fr": {
"nom": "Ciseaux de Vannas – courbes, pointus, lames de 7 mm",
"description": "Courbes, pointus, lames de 7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC50\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas Scissors – curved, pointed, 7-mm blades",
"description": "Curved, pointed, 7-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC50\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fb79f055-5602-4957-9942-b16d75b5ba4c",
"ref": "8100",
"cat": "moria-ciseaux",
"sort": 14,
"fr": {
"nom": "Ciseaux de Vannas-Moria – courbes et mousses, lames de 7 mm, pour cornée et iris",
"description": "Courbes et mousses, lames de 7 mm, pour cornée et iris. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8100\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vannas-Moria Scissors – curved and blunt, 7-mm blades, for cornea and iris",
"description": "Curved and blunt, 7-mm blades, for cornea and iris. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8100\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "51a43a73-fdee-4dde-b13b-5fecdecf54fb",
"ref": "9721",
"cat": "moria-ciseaux",
"sort": 15,
"fr": {
"nom": "Ciseaux de Castroviejo",
"description": "Lames de 10 mm, demi-courbes et très mousses, pour conjonctive. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9721\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Scissors",
"description": "10-mm half curved blades, very blunt, for conjunctiva. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9721\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1c4d5eea-e040-4bb6-832a-21908ecea0aa",
"ref": "13263",
"cat": "moria-ciseaux",
"sort": 16,
"fr": {
"nom": "Ciseaux de Gills-Aron-Rosa",
"description": "Coudés, pointus sur 11 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13263\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gills-Aron-Rosa Scissors",
"description": "Angled, pointed, 11-mm long blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13263\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2fcbdef7-109a-4a93-898f-e927aad44cb4",
"ref": "17000",
"cat": "moria-ciseaux",
"sort": 17,
"fr": {
"nom": "Ciseaux de Worst",
"description": "Courbes, longues lames de 13 mm, fines mousses, pour capsulectomie. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17000\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Worst Scissors",
"description": "Curved, 13-mm long blades, delicate, blunt, for capsulectomy. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17000\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f0cb1299-b105-4fcd-96d9-8a13fc152ae1",
"ref": "8090",
"cat": "moria-ciseaux",
"sort": 18,
"fr": {
"nom": "Ciseaux de Barraquer – à 2 lames pointues de 8 mm",
"description": "À 2 lames pointues de 8 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8090\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Scissors – 2 pointed 8-mm blades",
"description": "2 pointed 8-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8090\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7b9affb2-9e74-4c47-b419-b386e9c3c898",
"ref": "7865",
"cat": "moria-ciseaux",
"sort": 19,
"fr": {
"nom": "Ciseaux de Barraquer – à 2 lames mousses de 8, 5 mm",
"description": "À 2 lames mousses de 8,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7865\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Scissors – 2 blunt 8.5-mm blades",
"description": "2 blunt 8.5-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7865\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "22bcb1fe-2188-4def-8d70-1f6c6ed89206",
"ref": "MC19",
"cat": "moria-ciseaux",
"sort": 20,
"fr": {
"nom": "Ciseaux de Pascheff Wolff",
"description": "Lames très fines de 6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC19\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Pascheff Wolff Scissors",
"description": "Very delicate, 6-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC19\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9056257a-b5c8-4f38-842a-824247810b79",
"ref": "MC19B",
"cat": "moria-ciseaux",
"sort": 21,
"fr": {
"nom": "Micro ciseaux de Wolff",
"description": "Lames très pointues de 4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC19B\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Wolff Micro scissors",
"description": "Very sharp, 4-mm pointed blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC19B\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8f439fad-406b-425f-9ca3-a57506ae6d9b",
"ref": "MC26",
"cat": "moria-ciseaux",
"sort": 22,
"fr": {
"nom": "Ciseaux de Dowell – coudés 45°, lames très pointues 12 mm",
"description": "Coudés 45°, lames très pointues 12 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC26\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Dowell scissors – 45° angled, 12-mm pointed blades",
"description": "45° angled, 12-mm pointed blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC26\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c0e65b5b-c25c-450b-8486-9b43df010750",
"ref": "MC26B",
"cat": "moria-ciseaux",
"sort": 23,
"fr": {
"nom": "Ciseaux de Dowell – droits, lames pointues de 12 mm",
"description": "Droits, lames pointues de 12 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : MC26B\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Dowell scissors – straight, 12-mm sharp blades",
"description": "Straight, 12-mm sharp blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: MC26B\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-mc26b.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "db3387b6-2644-4ac0-89dd-05ce6a632407",
"ref": "4251C",
"cat": "moria-ciseaux",
"sort": 24,
"fr": {
"nom": "Ciseaux de Sevrin-Stevens",
"description": "Demi-courbes (bec de canard). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4251C\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Sevrin-Stevens Scissors",
"description": "Semi curved (duck beak) MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4251C\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c98e6f9f-d1ec-4f63-939e-5b147c1b4fcd",
"ref": "4263",
"cat": "moria-ciseaux",
"sort": 25,
"fr": {
"nom": "Ciseaux de Westcott-Cochet",
"description": "Droits, longues lames, mousses de 13 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4263\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Westcott-Cochet Scissors",
"description": "Straight, blunt, 13-mm long blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4263\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6810a830-6a17-48ca-9cb5-ea3d7828e6e4",
"ref": "18013",
"cat": "moria-ciseaux",
"sort": 26,
"fr": {
"nom": "Ciseaux de Stevens",
"description": "Courbes, mousses, lames de 11,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18013\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Stevens Scissors",
"description": "Curved, blunt, 11.5-mm blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18013\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e5231d5d-fc73-48b1-8537-0c7211f633a4",
"ref": "11057",
"cat": "moria-ciseaux",
"sort": 27,
"fr": {
"nom": "Ciseaux de Westcott-Hugonnier",
"description": "Lames longues 13 mm, demi-courbes, légèrement mousses. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 11057\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Westcott-Hugonnier Scissors",
"description": "Half curved, slightly blunt tips, 13-mm long blades. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 11057\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4dcc094d-dd10-432d-84e0-bc6d497307fd",
"ref": "4877A",
"cat": "moria-ciseaux",
"sort": 28,
"fr": {
"nom": "Ciseaux – droits, pointus, 10 cm, fins",
"description": "Droits, pointus, 10 cm, fins. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4877A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – straight, pointed, delicate, 10-cm long",
"description": "Straight, pointed, delicate, 10-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4877A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d757a261-2736-4843-be3c-a01912bc2ef5",
"ref": "4878A",
"cat": "moria-ciseaux",
"sort": 29,
"fr": {
"nom": "Ciseaux – courbes, pointus, 10 cm, fins",
"description": "Courbes, pointus, 10 cm, fins. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4878A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – curved, pointed, delicate, 10-cm long",
"description": "Curved, pointed, delicate, 10-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4878A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f6a331ff-6369-4fd6-9051-b173e094b016",
"ref": "917",
"cat": "moria-ciseaux",
"sort": 30,
"fr": {
"nom": "Ciseaux – pour adultes, très courbes, mousses",
"description": "Pour adultes, très courbes, mousses. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 917\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – for adults, very curved, blunt",
"description": "For adults, very curved, blunt. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 917\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-917.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1c85c2cf-de57-40d0-88af-a28f27584d73",
"ref": "8142A",
"cat": "moria-ciseaux",
"sort": 31,
"fr": {
"nom": "Ciseaux – modèle Université de Bonn, courbes, pointus",
"description": "Modèle Université de Bonn, courbes, pointus, ultra légers, 8 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8142A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – university of Bonn type, curved, pointed, ultra light",
"description": "University of Bonn type, curved, pointed, ultra light, 8-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8142A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7ca5d41d-a780-4841-b531-fbb9c2a0e9df",
"ref": "8143A",
"cat": "moria-ciseaux",
"sort": 32,
"fr": {
"nom": "Ciseaux – modèle Université de Bonn, droits, pointus",
"description": "Modèle Université de Bonn, droits, pointus, ultra légers, 8 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8143A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – university of Bonn type, straight, pointed, ultra light",
"description": "University of Bonn type, straight, pointed, ultra light, 8-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8143A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "00c139a0-4bea-4e6f-9bd9-1ca4614f2f4f",
"ref": "8144A",
"cat": "moria-ciseaux",
"sort": 33,
"fr": {
"nom": "Ciseaux – modèle Université de Bonn, courbes, mousses",
"description": "Modèle Université de Bonn, courbes, mousses, ultra légers, 8 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8144A\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Scissors – university of Bonn type, curved, blunt, ultra light",
"description": "University of Bonn type, curved, blunt, ultra light, 8-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8144A\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9eb90dfd-7f98-4865-93ea-5bdb194dfc11",
"ref": "19068",
"cat": "moria-ciseaux",
"sort": 34,
"fr": {
"nom": "Coupeur d'haptique",
"description": "Comportant une lame inférieure fixe et une lame supérieure mobile pour couper tous types d'implants souples. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19068\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Haptic Cutter",
"description": "Designed with a fixed lower blade and a movable upper blade to cut the haptic of all types of soft IOLs. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19068\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ccd02b5d-5d2c-4904-a2e3-27227fbd7e5b",
"ref": "19072",
"cat": "moria-ciseaux",
"sort": 35,
"fr": {
"nom": "Coupeur d'implant souple",
"description": "Coupeur d'implant souple Moria. Anses de rechange : réf. 19073 (set de 3 anses inox usage unique). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19072\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Soft IOL Cutter",
"description": "Moria soft IOL cutter. Replacement loops: ref. 19073 (set of 3 single-use stainless steel loops). MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19072\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d610142d-275c-4f15-bf80-c435e1b6c69c",
"ref": "19073",
"cat": "moria-ciseaux",
"sort": 36,
"fr": {
"nom": "Anses pour coupeur d'implant Moria (réf. 19072)",
"description": "Set de 3 anses inox usage unique, pour le coupeur d'implant souple réf. 19072. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19073\nFamille : Ciseaux\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Loops for Moria IOL Cutter (ref. 19072)",
"description": "Set of 3 single-use stainless steel loops, for the soft IOL cutter ref. 19072. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19073\nFamily: Scissors\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2d43510d-9017-45f1-9adf-c4f3c4c1c82b",
"ref": "M35220",
"cat": "moria-crochets-spatules",
"sort": 1,
"fr": {
"nom": "Crochet de Sinskey",
"description": "Droit, mousse, extrémité de diamètre 0,2 mm, longueur 12,1 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M35220\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Sinskey Hook",
"description": "Straight, blunt, 0.2-mm tips diameter, 12.1-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M35220\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "15205cbe-51ea-44f4-a3b8-73f73415bdbc",
"ref": "M0567",
"cat": "moria-crochets-spatules",
"sort": 2,
"fr": {
"nom": "Crochet de Kuglen – droit, extrémité en K, longueur 12 cm",
"description": "Droit, extrémité en K, longueur 12 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M0567\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kuglen Hook – straight, K tip, 12-cm long",
"description": "Straight, K tip, 12-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M0567\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2d0283e1-be99-4d45-8e2b-83feb7cf7b3f",
"ref": "M35522",
"cat": "moria-crochets-spatules",
"sort": 3,
"fr": {
"nom": "Crochet de Kuglen – droit, extrémité en olive, longueur 11, 6 cm",
"description": "Droit, extrémité en olive, longueur 11,6 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M35522\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kuglen Hook – straight, olive tip, 11.6-cm long",
"description": "Straight, olive tip, 11.6-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M35522\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f8dd91ee-4909-4fe7-9f2b-8c7dfa1cedcd",
"ref": "M0577",
"cat": "moria-crochets-spatules",
"sort": 4,
"fr": {
"nom": "Crochet de Osher",
"description": "Longueur 12,5 cm, extrémité en Y. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M0577\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Osher Hook",
"description": "12.5-cm long, Y tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M0577\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d408ed98-c4d7-4d87-84d6-60dfdd1f18ee",
"ref": "20040",
"cat": "moria-crochets-spatules",
"sort": 5,
"fr": {
"nom": "Crochet de Pisacano – extrémité disque horizontal, longueur 11, 5 cm",
"description": "Extrémité disque horizontal, longueur 11,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20040\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Pisacano Hook – horizontal disk tip, 11.5-cm long",
"description": "Horizontal disk tip, 11.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20040\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d083cd39-2b97-4b01-a2b2-6709d4bc69ba",
"ref": "20041",
"cat": "moria-crochets-spatules",
"sort": 6,
"fr": {
"nom": "Crochet de Pisacano – extrémité disque vertical, longueur 11, 5 cm",
"description": "Extrémité disque vertical, longueur 11,5 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20041\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Pisacano Hook – vertical disk tip, 11.5-cm long",
"description": "Vertical disk tip, 11.5-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20041\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "76149aba-82df-4bc8-8e9d-280eddcbd19c",
"ref": "20017",
"cat": "moria-crochets-spatules",
"sort": 7,
"fr": {
"nom": "Crochet diviseur de noyau de Villon",
"description": "Phaco chopper vertical. Angulation 130°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20017\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Villon Nucleus Divider Hook",
"description": "Vertical Phaco chopper. Angulation 130°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20017\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "334a1db0-2862-4678-89b0-afee6b024396",
"ref": "M0570N",
"cat": "moria-crochets-spatules",
"sort": 8,
"fr": {
"nom": "Spatule double de Nichamin",
"description": "Phaco chopper, extrémité tranchante de 1,25 mm et extrémité spatulée mousse de 0,5 mm, longueur 14,2 cm. Angulations 110° et 135°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M0570N\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Nichamin Double-Ended Spatula",
"description": "Phaco chopper, 1.25-mm cutting tip and 0.5-mm blunt spatulated tip, 14.2-cm long. Angulations 110° and 135°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M0570N\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "729f7a23-7767-4d1d-82a8-d19d4d2a2067",
"ref": "M0489",
"cat": "moria-crochets-spatules",
"sort": 9,
"fr": {
"nom": "Spatule double de Castroviejo",
"description": "Longueur 14 cm. Pour noyaux durs et mous. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M0489\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Castroviejo Double-Ended Spatula",
"description": "For hard and soft nucleus. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M0489\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e831fba9-b3cb-4a47-bb73-6b706de8d84d",
"ref": "M0712",
"cat": "moria-crochets-spatules",
"sort": 10,
"fr": {
"nom": "Spatule de Koch",
"description": "Longueur 11,9 cm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M0712\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Koch Spatula",
"description": "11.9-cm long. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M0712\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "cebba824-28a5-43b2-8bfa-83b8d85aac16",
"ref": "M32390",
"cat": "moria-crochets-spatules",
"sort": 11,
"fr": {
"nom": "Spatule de Nagahara",
"description": "Phaco chopper. Longueur 11,6 cm. Angulation 130°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : M32390\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Nagahara Spatula",
"description": "Phaco chopper. 11.6-cm long. Angulation 130°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: M32390\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9198d7ca-e7f4-47ae-a781-a1f843ef07a1",
"ref": "18210",
"cat": "moria-crochets-spatules",
"sort": 12,
"fr": {
"nom": "Crochet manipulateur « Stop & Chop »",
"description": "Extrémité triangulaire, mousse, 1,5 mm. Angulation 130°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18210\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "\"Stop & Chop\" Manipulator",
"description": "Triangular and blunt tip, 1.5-mm. Angulation 130°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18210\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5ce832b3-782f-4033-8086-d2461d33399d",
"ref": "20002",
"cat": "moria-crochets-spatules",
"sort": 13,
"fr": {
"nom": "Crochet manipulateur de Nagahara",
"description": "Extrémité de 1,3 mm, angulée à 90° avec la partie interne tranchante. Angulation 145°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20002\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Nagahara Phaco Chopper",
"description": "1.3-mm tip, 90° angled, with inner cutting edge. Angulation 145°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20002\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f35410cb-b876-4bcc-b29a-282ac20695e5",
"ref": "18227",
"cat": "moria-crochets-spatules",
"sort": 14,
"fr": {
"nom": "Phaco cliveur de Haefliger – pour médecin droitier, prise en main main gauche",
"description": "Pour médecin droitier, prise en main main gauche. Modèle usuel, bords mousses pour noyaux durs et mous, angle à 45°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18227\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Haefliger Phaco Cleaver – for right-handed surgeon",
"description": "For right-handed surgeon, holding instrument in left hand. Usual model, blunt edges, for hard and soft nucleus, angulated at 45°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18227\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9a2d9ece-be97-4ed2-afa8-8acc736279f3",
"ref": "18228",
"cat": "moria-crochets-spatules",
"sort": 15,
"fr": {
"nom": "Phaco cliveur de Haefliger – pour médecin gaucher, prise en main main droite",
"description": "Pour médecin gaucher, prise en main main droite. Bords mousses pour noyaux durs et mous, angle à 45°. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18228\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Haefliger Phaco Cleaver – for left-handed surgeon",
"description": "For left-handed surgeon, holding instrument in right hand. Blunt edges, for hard and soft nucleus, angulated at 45°. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18228\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "762dff89-a2c5-4e64-a253-a26650fb51ef",
"ref": "17157",
"cat": "moria-crochets-spatules",
"sort": 16,
"fr": {
"nom": "Crochet manipulateur de Crozafon",
"description": "Coudé, à fourche, mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17157\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Crozafon Manipulator",
"description": "Angled, fork shape, blunt. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17157\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "3a39abb8-8f21-4418-b690-76236b9b2d68",
"ref": "17159",
"cat": "moria-crochets-spatules",
"sort": 17,
"fr": {
"nom": "Crochet manipulateur de Lebuisson – longueur 9 mm",
"description": "Longueur 9 mm. Coudé, embout olivaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17159\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lebuisson Manipulator – 9-mm long",
"description": "9-mm long. Angled, bulbous tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17159\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7402b42c-fb7a-41fd-9a15-755a028932d5",
"ref": "18039",
"cat": "moria-crochets-spatules",
"sort": 18,
"fr": {
"nom": "Crochet manipulateur de Arneodo",
"description": "Longueur 13 mm. Coudé, embout rond et mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18039\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Arneodo Manipulator",
"description": "13-mm long. Angled, blunt round tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18039\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "da5315b0-70d9-4b94-b971-9122b3276b75",
"ref": "18089",
"cat": "moria-crochets-spatules",
"sort": 19,
"fr": {
"nom": "Crochet manipulateur double de Arneodo-Crozafon",
"description": "Pour noyau mou et noyau dur. Longueur de chaque extrémité: 14 mm. Une extrémité fine, courbe, mousse et une extrémité forte, courbe, spatulée. Pour noyaux durs et mous. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18089\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Arneodo-Crozafon Double Manipulator",
"description": "For soft and hard nucleus. Length of each tip: 14 mm. One thin, curved, blunt tip, and the other strong, curved, spatulated. For hard and soft nucleus. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18089\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "57c5624c-0a67-4388-afc7-adc31e4b9e39",
"ref": "18104",
"cat": "moria-crochets-spatules",
"sort": 20,
"fr": {
"nom": "Crochet manipulateur de Lebuisson – longueur 12 mm",
"description": "Longueur 12 mm. Extrémité spatulée et olivaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18104\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lebuisson Manipulator – 12-mm long, bulbous and spatulated micro tip",
"description": "12-mm long, bulbous and spatulated micro tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18104\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-18104.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8420c4ee-db96-4486-8e01-33e87668c108",
"ref": "18112",
"cat": "moria-crochets-spatules",
"sort": 21,
"fr": {
"nom": "Crochet manipulateur",
"description": "Longueur 11 mm. En forme de doigt, extrémité courbe. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18112\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Manipulator",
"description": "11-mm long. Finger shaped, curved tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18112\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5a3ad5d4-eb43-4946-9252-95782a9aec42",
"ref": "19000",
"cat": "moria-crochets-spatules",
"sort": 22,
"fr": {
"nom": "Crochet manipulateur « Diabolo »",
"description": "Coudé, extrémité olivaire micro bouton de col. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19000\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "\"Diabolo\" Manipulator",
"description": "Angled, bulbous micro collar button tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19000\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e57120e8-000f-46b4-8b19-8405bf34aa9a",
"ref": "13227",
"cat": "moria-crochets-spatules",
"sort": 23,
"fr": {
"nom": "Crochet manipulateur de Lester",
"description": "Coudé olivaire « bouton de col ». Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13227\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lester Manipulator",
"description": "Angled, bulbous \"collar button\" tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13227\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ea5875af-c12f-4561-8ac7-75994d7700ac",
"ref": "20028",
"cat": "moria-crochets-spatules",
"sort": 24,
"fr": {
"nom": "Spatule double de Fontana",
"description": "Instrument de DALK à deux extrémités : spatule en forme de disque pour la délamination du stroma postérieur périphérique (extrémité plate, arrondie et semi-tranchante, partie active mousse) et spatule plate pour la dissection du stroma postérieur (partie active biseautée et mousse pour protéger la membrane de Descemet lors de la découpe du stroma postérieur). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20028\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Fontana Double-Ended Spatula",
"description": "DALK instrument with two ends: disc-shaped spatula for detachment of intrastromal adherences (semi-sharp rounded design for peripheral dissection, blunt active part) and foam flat spatula for stromal dissection (beveled up, blunt tip to protect Descemet's membrane while cutting posterior stroma). MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20028\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "38ce600a-0e92-4e60-a709-3f0d661cf589",
"ref": "20016",
"cat": "moria-crochets-spatules",
"sort": 25,
"fr": {
"nom": "Spatule à délaminer de Renard",
"description": "Extrémité de 10 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20016\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Renard Corneal Dissector Spatula",
"description": "10-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20016\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d706bd77-200f-4e3a-981e-5529917a9eb1",
"ref": "20006",
"cat": "moria-crochets-spatules",
"sort": 26,
"fr": {
"nom": "Spatule glissière de Busin",
"description": "Pour l'insertion d'un lenticule cornéen DSAEK, incision de 5,5 mm : conçue pour la technique du « pull-through » ; l'aile latérale aide à mettre en place le greffon DSAEK directement depuis le punch de Busin ; déploiement du greffon dans l'œil du receveur ; centrage du lenticule dans la chambre antérieure. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20006\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Busin Spatula",
"description": "For the insertion of a DSAEK donor lamellar graft through a 5.5-mm incision: designed for the \"pull-through\" technique; lateral wing design aids in scooping up the DSAEK graft directly from the Busin donor punch; unfolding of the graft in the recipient's eye; centration of the donor button in the anterior chamber. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20006\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5b935d96-d858-4b2b-a541-a2193503216b",
"ref": "20007",
"cat": "moria-crochets-spatules",
"sort": 27,
"fr": {
"nom": "Mini-spatule glissière de Busin",
"description": "Pour l'insertion d'un greffon Ultra-Thin DSAEK, incision de 3,5 mm : conçue pour la technique du « pull-through » ; l'aile latérale aide à mettre en place le greffon directement depuis le punch de Busin ; déploiement du greffon dans l'œil du receveur ; centrage du lenticule dans la chambre antérieure. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20007\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Mini-Busin Spatula",
"description": "For the insertion of an Ultra-Thin DSAEK graft through a 3.5-mm incision: designed for the \"pull-through\" technique; lateral wing design aids in scooping up the graft directly from the Busin donor punch; unfolding of the graft in the recipient's eye; centration of the donor button in the anterior chamber. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20007\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8a88643f-e1d8-4e53-948f-225df092cf51",
"ref": "20021",
"cat": "moria-crochets-spatules",
"sort": 28,
"fr": {
"nom": "Marqueur stroma descémétique donneur",
"description": "Instrument de DMEK pour marquer le stroma descémétique du greffon donneur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20021\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Donor Descemet's Stroma Scorer",
"description": "DMEK instrument to score the donor Descemet's stroma. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20021\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "86c86d77-b365-4fba-8c68-798ffeb87c2b",
"ref": "20022",
"cat": "moria-crochets-spatules",
"sort": 29,
"fr": {
"nom": "Microdissecteur",
"description": "Pour greffon endothélial. Extrémité de 3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20022\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Micro Dissector",
"description": "For endothelial graft. 3-mm tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20022\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "dd849d38-d4a7-4ff2-a16d-860730875748",
"ref": "19091",
"cat": "moria-crochets-spatules",
"sort": 30,
"fr": {
"nom": "Crochet de Price",
"description": "Sinskey inversé, pour le rhexis de la Descemet. Extrémité de 0,7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19091\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Price Hook",
"description": "Reverse Sinskey, for descemetorhexis. 0.7-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19091\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "77f84bad-10cc-444e-b203-c73c418cfc37",
"ref": "18224",
"cat": "moria-crochets-spatules",
"sort": 31,
"fr": {
"nom": "Manipulateur de Caro",
"description": "Pour repositionnement du volet. Extrémité hémisphérique et parfaitement polie. Extrémité de 4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18224\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Caro Flap Repositioning Manipulator",
"description": "Hemispherical and highly polished tip. Tip length: 4 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18224\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9d5f414e-ae65-4620-8a56-cd63a5aebb98",
"ref": "20010",
"cat": "moria-crochets-spatules",
"sort": 32,
"fr": {
"nom": "Cliveur pour reprise LASIK",
"description": "Une extrémité affilée pour clivage et réouverture du volet, l'autre extémité pour soulever et repositionner le volet. Extrémités de 0,2 mm et 0,3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20010\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Double-Ended Spatula Cleaver for LASIK",
"description": "Enhancement One tip with slightly sharpened edges for re-openning the flap, and one tip to lift the LASIK flap. Tips of 0.2 mm and 0.3 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20010\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e5166861-c878-4767-821b-f82788bc8f07",
"ref": "19087",
"cat": "moria-crochets-spatules",
"sort": 33,
"fr": {
"nom": "Spatule double de Vryghem",
"description": "Une extrémité pour réouverture du volet, l'autre extrémité pour soulever et repositionner le volet. Extrémités de 3 mm et 0,9 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19087\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Vryghem Double-Ended Spatula",
"description": "One tip for re-opening the flap and one tip for lifting then repositioning the flap. Tips of 3 mm and 0.9 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19087\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a974a00c-499e-40ac-9591-58ffbe746c25",
"ref": "19019",
"cat": "moria-crochets-spatules",
"sort": 34,
"fr": {
"nom": "Spatule de Bahamon",
"description": "Bords semi tranchants permettant un soulèvement aisé du flap lors des procédures de réintervention. Extrémité de 9,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19019\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Bahamon Spatula",
"description": "Semi-sharp edges to effectively separate epithelium and lift the flap in case of re-treatment. Tip length: 9.5 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19019\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7f1f73b8-bcc0-4d5a-b0d7-6c7e2a5ebad6",
"ref": "19080",
"cat": "moria-crochets-spatules",
"sort": 35,
"fr": {
"nom": "Spatule de Fox",
"description": "Pour réintervention LASIK, en forme de trident, côtés semi tranchants. Extrémité de 3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19080\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Fox Spatula",
"description": "For LASIK enhancement, trident shaped, semi sharp sides. Length of Tip length: 3 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19080\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "901b1537-a87b-4397-bf42-bc2849f71166",
"ref": "20032",
"cat": "moria-crochets-spatules",
"sort": 36,
"fr": {
"nom": "Spatule double Ancel",
"description": "Un côté avec un crochet et l'autre avec une spatule mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20032\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Ancel double-ended Spatula",
"description": "One side with a hook and the other one with a foam spatula. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20032\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "de4382e9-89c2-4a82-907e-d347bd167edd",
"ref": "19084",
"cat": "moria-crochets-spatules",
"sort": 37,
"fr": {
"nom": "Spatule double Epi-LASIK",
"description": "Une extrémité atraumatique en forme de club de golf, pour replier le volet en accordéon. L'autre extrémité courbe, ronde pour repositionner le volet Epi-LASIK. Extrémité de 8 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19084\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Double-Ended Epi-LASIK Spatula",
"description": "One atraumatic \"Golf Club shaped\" tip for Epi-LASIK flap folding in an accordeon like fashion. Second smooth and curved tip for epithelial flap repositioning. Tip length: 8 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19084\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b6813e17-5529-4a02-a710-ae676519d682",
"ref": "19089",
"cat": "moria-crochets-spatules",
"sort": 38,
"fr": {
"nom": "Spatule de désépithélialisation",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19089\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Spatula for Desepithelization",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19089\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b1d109f9-91c4-4b5f-84db-5d698d8f1a3f",
"ref": "1141",
"cat": "moria-crochets-spatules",
"sort": 39,
"fr": {
"nom": "Crochet",
"description": "Modèle moyen, usuel, 12 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 1141\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Hook",
"description": "Medium size, usual, 12 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 1141\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7ad85298-6b2b-47fa-85b8-608d53c33f41",
"ref": "8063",
"cat": "moria-crochets-spatules",
"sort": 40,
"fr": {
"nom": "Crochet de Gass-Rouchy",
"description": "Perforé, pour passer les fils dans les muscles. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8063\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gass-Rouchy Hook",
"description": "Fixation hook with hole. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8063\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d026ad6f-acfd-448f-9635-2d5c2bf87a94",
"ref": "13010",
"cat": "moria-crochets-spatules",
"sort": 41,
"fr": {
"nom": "Crochet de Hugonnier-Gobin",
"description": "Ultra fin, pour petits obliques. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13010\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Hugonnier-Gobin Hook",
"description": "Very delicate, for oblique muscle. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13010\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a359b770-4557-4c92-823d-091b3ff037dc",
"ref": "7825B",
"cat": "moria-crochets-spatules",
"sort": 42,
"fr": {
"nom": "Spatule à iris de Barraquer – 10 mm, extrémité disque horizontal",
"description": "10 mm, extrémité disque horizontal. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7825B\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Iris Spatula – 10-mm long, horizontal disk tip",
"description": "10-mm long, horizontal disk tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7825B\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "624be31e-2327-44e8-af78-32c0b22a1cae",
"ref": "7825C",
"cat": "moria-crochets-spatules",
"sort": 43,
"fr": {
"nom": "Spatule à iris de Barraquer – 12 mm, extrémité disque horizontal",
"description": "12 mm, extrémité disque horizontal. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7825C\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Iris Spatula – 12-mm long, horizontal disk tip",
"description": "12-mm long, horizontal disk tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7825C\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8ca8fcb2-f0a1-4cfe-a778-8fc2722fbd0f",
"ref": "9611B",
"cat": "moria-crochets-spatules",
"sort": 44,
"fr": {
"nom": "Spatule à iris de Barraquer – 12 mm, terminée par une petite boule",
"description": "12 mm, terminée par une petite boule. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9611B\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Iris Spatula – 12-mm long, ended with a small ball",
"description": "12-mm long, ended with a small ball. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9611B\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4db94498-c26e-40a7-ad1b-bbb8af472d3f",
"ref": "20018",
"cat": "moria-crochets-spatules",
"sort": 45,
"fr": {
"nom": "Crochet à iris de Burtin",
"description": "Extremité de 1 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20018\nFamille : Crochets et spatules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Burtin iris Hook",
"description": "Tip length: 1 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20018\nFamily: Hooks and spatulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "30598191-dda3-4dba-aea4-bcc0f51a680f",
"ref": "9623",
"cat": "moria-canules",
"sort": 1,
"fr": {
"nom": "Canule de Charleux – pour lavage ou aspiration, orifice 0, 4 mm, diamètre 0 (9623)",
"description": "Pour lavage ou aspiration, orifice 0,4 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 9623\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Charleux Cannula – for irrigation or aspiration, 23 G outer Ø (9623)",
"description": "For irrigation or aspiration, 23 G outer Ø, 27 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 9623\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ac68b808-d2c1-4d69-b8b6-23491e00e1fb",
"ref": "13229",
"cat": "moria-canules",
"sort": 2,
"fr": {
"nom": "Canule de Charleux – pour lavage ou aspiration, orifice 0, 4 mm, diamètre 0 (13229)",
"description": "Pour lavage ou aspiration, orifice 0,4 mm, diamètre 0,6 mm, modèle long 30 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13229\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Charleux Cannula – for irrigation or aspiration, 23 G outer Ø (13229)",
"description": "For irrigation or aspiration, 23 G outer Ø, 27 G inner Ø, 30-mm long model. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13229\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "376f278d-06e7-4c76-8913-03cb4d3b3db6",
"ref": "13221",
"cat": "moria-canules",
"sort": 3,
"fr": {
"nom": "Canule de Barraquer-Troutman",
"description": "Olivaire fine, orifice 0,4 mm, diamètre 0,7 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13221\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer-Troutman Cannula",
"description": "Fine bulbous tip, 22 G outer Ø, 27 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13221\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "6c8d06e8-0ec3-4c7e-b041-8ce79a63bf0d",
"ref": "13230A",
"cat": "moria-canules",
"sort": 4,
"fr": {
"nom": "Canule de Charleux-Simcoe – pour aspiration du cortex, orifice 0, 3 mm, diamètre 0",
"description": "Pour aspiration du cortex, orifice 0,3 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13230A\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Charleux-Simcoe Cannula – for cortex aspiration, 30 G opening, 23 G outer Ø",
"description": "For cortex aspiration, 30 G opening, 23 G outer Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13230A\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "515f1c80-98e8-4f76-a784-682b041703b6",
"ref": "13248",
"cat": "moria-canules",
"sort": 5,
"fr": {
"nom": "Canule de Binkhorst-Quintana – coudée à gauche, lavage à 1h, orifice 0, 25 mm",
"description": "Coudée à gauche, lavage à 1h, orifice 0,25 mm, diamètre 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13248\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Binkhorst-Quintana Cannula – curved on the left, irrigation at 1 o'clock",
"description": "Curved on the left, irrigation at 1 o'clock, 25 G outer Ø, 31 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13248\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a81fb0a8-a8d3-4481-8aa2-0574606d0b2e",
"ref": "13250",
"cat": "moria-canules",
"sort": 6,
"fr": {
"nom": "Canule de Binkhorst-Quintana – coudée à droite, lavage à 11h, orifice, 0, 25 mm",
"description": "Coudée à droite, lavage à 11h, orifice, 0,25 mm, diamètre 0,5 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 13250\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Binkhorst-Quintana Cannula – curved on the right, irrigation at 11 o'clock",
"description": "Curved on the right, irrigation at 11 o'clock, 25 G outer Ø, 31 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 13250\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "72a06527-ee7f-42c7-988a-3c381a1c3acf",
"ref": "12961",
"cat": "moria-canules",
"sort": 7,
"fr": {
"nom": "Canule de Kratz",
"description": "Gratteuse pour polissage de la capsule, orifice 0,4 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 12961\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Kratz Cannula",
"description": "Capsule polisher, 23 G outer Ø, 27 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 12961\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "858a9db6-662e-48dd-959c-3c22c207750d",
"ref": "18267",
"cat": "moria-canules",
"sort": 8,
"fr": {
"nom": "Canule aspiratrice",
"description": "0,8 mm, courbe, monobloc, gratteuse, diamètre d'aspiration 0,35 mm, utilisée avec irrigation réf. 18268 et raccord de nettoyage réf. 18073FU. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18267\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Aspirating Cannula",
"description": "21 G outer Ø, curved, single piece, capsule polisher, 28 G inner Ø upper aspiration opening, used in conjunction with irrigation system ref. 18268 and cleaning connector ref. 18073FU. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18267\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "84b4dc69-1e29-4f2b-823b-baa6590513c3",
"ref": "18073FU",
"cat": "moria-canules",
"sort": 9,
"fr": {
"nom": "Embout pour nettoyage pour #18267",
"description": "Système d'aspiration bi-manuelle, femelle-femelle. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18073FU\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cleaning connector for #18267",
"description": "Bi-manual aspiration system, female-female. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18073FU\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "513680fa-be2d-42a8-8e11-75e30815adb3",
"ref": "18268",
"cat": "moria-canules",
"sort": 10,
"fr": {
"nom": "Canule irrigatrice",
"description": "Courbe, monobloc, mousse, irrigatrice, diamètre 0,8 mm, diamètre d'irrigation 0,5 mm, utilisée avec aspiration réf. 18267. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18268\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Irrigating Cannula",
"description": "Curved, single piece, blunt, 21 G outer Ø, 25 G inner Ø, used in conjunction with aspirating system ref. 18267. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18268\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "41bd00a7-d1da-48cb-a5b7-defe4d0dbe2d",
"ref": "17120",
"cat": "moria-canules",
"sort": 11,
"fr": {
"nom": "Canule SFO",
"description": "Diamètre 1,2 mm, orifice aspiration supérieur 0,35 mm, irrigation sur le côté. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17120\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "SFO Cannula",
"description": "18 G outer Ø, 28 G inner Ø, side opening irrigation. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17120\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "98d91be5-60f7-456f-93fa-89ba3b74f957",
"ref": "90061L",
"cat": "moria-canules",
"sort": 12,
"fr": {
"nom": "Canule de Charleux-Simcoe – modèle original, courbe diamètre 0, 6 mm",
"description": "Modèle original, courbe diamètre 0,6 mm, orifice supérieur 0,3 mm, terminaison mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 90061L\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Charleux-Simcoe Cannula – original model curved, 23 G outer Ø, 30 G inner Ø",
"description": "Original model curved, 23 G outer Ø, 30 G inner Ø, with blunt end. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 90061L\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "1f03d4a5-1dac-43d8-853b-f5ef226f8dce",
"ref": "18081",
"cat": "moria-canules",
"sort": 13,
"fr": {
"nom": "Canule de Corydon – longueur 20 mm, extrémité en crosse d'évêque aplatie (18081)",
"description": "Longueur 20 mm, extrémité en crosse d'évêque aplatie, diamètre 0,5 mm, courbée à droite. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18081\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Corydon Cannula – \"U\" shaped, 20 mm long, 25 G outer Ø (18081)",
"description": "\"U\" shaped, 20 mm long, 25 G outer Ø, curved on the right and flattened tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18081\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "368ec3a9-daee-47b0-8ae9-fa1e4aa35df4",
"ref": "18082",
"cat": "moria-canules",
"sort": 14,
"fr": {
"nom": "Canule de Corydon – longueur 20 mm, extrémité en crosse d'évêque aplatie (18082)",
"description": "Longueur 20 mm, extrémité en crosse d'évêque aplatie, diamètre 0,5 mm, courbée à gauche. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18082\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Corydon Cannula – \"U\" shaped, 20 mm long, 25 G outer Ø (18082)",
"description": "\"U\" shaped, 20 mm long, 25 G outer Ø, curved on the left and flattened tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18082\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a124e7ae-d033-4a77-bd67-fb44e8ff03be",
"ref": "18103",
"cat": "moria-canules",
"sort": 15,
"fr": {
"nom": "Canule – courbe, longueur 20 mm, orifice en bout diamètre 0",
"description": "Courbe, longueur 20 mm, orifice en bout diamètre 0,5 mm, extrémité aplatie. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18103\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cannula – curved, 20-mm long, 25 G outer Ø, flattened tip",
"description": "Curved, 20-mm long, 25 G outer Ø, flattened tip. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18103\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7240c793-469f-4263-bd76-f77066b2f5fd",
"ref": "18153",
"cat": "moria-canules",
"sort": 16,
"fr": {
"nom": "Canule – longueur 8 mm, diamètre 0, 5 mm",
"description": "Longueur 8 mm, diamètre 0,5 mm, extrémité aplatie et très mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18153\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cannula – 8-mm long, 25 G outer Ø, flattened tip, blunt",
"description": "8-mm long, 25 G outer Ø, flattened tip, blunt. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18153\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fa6ffe5a-5694-497a-b2af-37ae8ad38eb6",
"ref": "7503",
"cat": "moria-canules",
"sort": 17,
"fr": {
"nom": "Canule de Calamendrei",
"description": "Orifice 0,2 mm, diamètre 0,4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7503\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Calamendrei Cannula",
"description": "27 G outer Ø, 33 G inner Ø;. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7503\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0e1c0c4f-d0aa-4025-8ea2-048e1feeadcb",
"ref": "7504",
"cat": "moria-canules",
"sort": 18,
"fr": {
"nom": "Canule de Rycroft",
"description": "Pour injection d'air, orifice 0,15 mm, diamètre 0,3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 7504\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Rycroft Cannula",
"description": "For air injection, 30 G outer Ø, 35 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 7504\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "49d1c5eb-e4fd-4e6b-b3a6-e426714d61ca",
"ref": "18011",
"cat": "moria-canules",
"sort": 19,
"fr": {
"nom": "Canule de Gills",
"description": "Coudée, longueur 9 mm, orifice de 0,4 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18011\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gills Cannula",
"description": "Curved, 9-mm length, 23 G outer Ø, 27 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18011\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "af561286-9f00-4118-a4fa-8845cce66a5d",
"ref": "8016",
"cat": "moria-canules",
"sort": 20,
"fr": {
"nom": "Canule de Barraquer",
"description": "Olivaire, orifice 0,4 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 8016\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Barraquer Cannula",
"description": "Bulbous tip, 23 G outer Ø, 27 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 8016\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d079fc25-c45a-4a75-a276-65f3038c83a2",
"ref": "20027",
"cat": "moria-canules",
"sort": 21,
"fr": {
"nom": "Canule de Fontana 27G, courbe",
"description": "Idéale pour la technique de la « Big Bubble » : partie active mousse ; extrémité angulée (126°) pour faciliter l'insertion dans le stroma ; diamètre de 27G ; orifice inférieur de 0,4 mm de diamètre ; sortie de l'air par la face postérieure. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20027\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "27G Fontana Cannula, Curved",
"description": "Air injection cannula to ease the \"Big Bubble\" creation: blunt and smooth tip; curved (126° angulation) to facilitate stromal insertion; 27G diameter shaft; 0.4-mm diameter lower port; air exits by the posterior side. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20027\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4b4b772c-1af9-4316-8a27-7cf649b3743b",
"ref": "19092",
"cat": "moria-canules",
"sort": 22,
"fr": {
"nom": "Mainteneur de chambre 20 G",
"description": "Port d'irrigation 0,9 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19092\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Chamber Maintainer 20 G",
"description": "0.9-mm irrigation port. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19092\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f5773ac8-59ab-4719-af49-226d09491f9a",
"ref": "791",
"cat": "moria-canules",
"sort": 23,
"fr": {
"nom": "Canule de Galezowski – fine, courbe, orifice 0, 35 mm, diamètre 0, 6 mm",
"description": "Fine, courbe, orifice 0,35 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 791\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Galezowski Cannula – delicate, curved, 23 G outer Ø, 28 G inner Ø",
"description": "Delicate, curved, 23 G outer Ø, 28 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 791\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "c1a7d9bd-9b2b-481a-aea0-1819fba2ac00",
"ref": "792",
"cat": "moria-canules",
"sort": 24,
"fr": {
"nom": "Canule de Galezowski – fine, droite, usuelle, orifice 0, 35 mm, diamètre 0",
"description": "Fine, droite, usuelle, orifice 0,35 mm, diamètre 0,6 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 792\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Galezowski Cannula – delicate, straight, usual, 23 G outer Ø, 28 G inner Ø",
"description": "Delicate, straight, usual, 23 G outer Ø, 28 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 792\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ac625e2b-fbce-472a-a025-d4806d3f5871",
"ref": "18009",
"cat": "moria-canules",
"sort": 25,
"fr": {
"nom": "Canule fine et droite pour bébé",
"description": "Longueur 8 mm, orifice 0,2 mm, diamètre 0,4 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18009\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Cannula straight and delicate for baby",
"description": "8-mm long, 27 G outer Ø, 33 G inner Ø. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18009\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "387e07d4-7ad4-4f6a-80c1-96cd1102693d",
"ref": "19017",
"cat": "moria-canules",
"sort": 26,
"fr": {
"nom": "Canule de Lebuisson",
"description": "Aplatie, angulation simple, 3 orifices d'irrigation: en bout, inférieur et supérieur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19017\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Lebuisson Cannula",
"description": "Flattened tip, regular angulation, 3 irrigation ports: upper, lower, frontal. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19017\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8586df50-d334-46fe-a19f-97866b956a6d",
"ref": "19018",
"cat": "moria-canules",
"sort": 27,
"fr": {
"nom": "Canule double",
"description": "Canule en diapason à 4 orifices d'irrigation sur chaque branche. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19018\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Double Armed Cannula",
"description": "Cannula like a tuning fork with 4 irrigation ports on each arm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19018\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "451448f9-9baa-49c2-a41b-c032cb63f916",
"ref": "19088",
"cat": "moria-canules",
"sort": 28,
"fr": {
"nom": "Canule Epi-LASIK",
"description": "Courbe, 0,6 mm, trois orifices inférieurs d'infusion. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19088\nFamille : Canules\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Epi-LASIK Cannula",
"description": "Curved, 23 G outer Ø, three bottom infusion ports. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19088\nFamily: Cannulas\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "75ba4889-bdff-4410-af94-c4341f188964",
"ref": "61",
"cat": "moria-autres",
"sort": 1,
"fr": {
"nom": "Aiguille de Dupuytren",
"description": "Fine, usuelle, à corps étrangers. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 61\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Dupuytren Needle",
"description": "Delicate, regular model, for foreign body. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 61\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": "/uploads/products/moria-r-61.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2d53a967-7383-440f-bb99-a75f37cd7968",
"ref": "18220",
"cat": "moria-autres",
"sort": 2,
"fr": {
"nom": "Anneau de Fine-Thornton",
"description": "Ouvert, diamètre extérieur 15 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18220\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Fine-Thornton Ring",
"description": "Opened, 15-mm external diameter. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18220\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "665b47dc-1520-413d-a598-5962d6c9a470",
"ref": "247",
"cat": "moria-autres",
"sort": 3,
"fr": {
"nom": "Anse de Snellen, Usuelle",
"description": "Pour extraire le cristallin. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 247\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Snellen Loop, Standard",
"description": "To extract the crystalline lens. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 247\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "0abb91bd-ea6b-487f-b8b4-85d784ef231b",
"ref": "4174",
"cat": "moria-autres",
"sort": 4,
"fr": {
"nom": "Anse de Foster-Paufique",
"description": "Pour énucléation. Produit assemblé ; fils de rechange : réf. 4174B (jeu de 10). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4174\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Foster-Paufique Loop",
"description": "For enucleation. Assembled product; replacement wires: ref. 4174B (set of 10). MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4174\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "4c38cadc-7792-47be-b6db-0e56a2d77827",
"ref": "4174B",
"cat": "moria-autres",
"sort": 5,
"fr": {
"nom": "Jeu de 10 fils pour anse #4174",
"description": "Jeu de 10 fils en acier inoxydable pour l'anse de Foster-Paufique réf. 4174. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4174B\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Set of 10 wires for loop #4174",
"description": "Set of 10 stainless steel wires for the Foster-Paufique loop ref. 4174. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4174B\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ef4bee8c-2f51-47c5-9fac-613c10e17531",
"ref": "4170",
"cat": "moria-autres",
"sort": 6,
"fr": {
"nom": "Compas de Sourdille",
"description": "Ouverture 16 mm. Gradué 1 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 4170\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Sourdille Caliper",
"description": "Opening 16 mm. Graduated 1 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 4170\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "998e8447-02b6-4426-bc61-1be554572a30",
"ref": "3201",
"cat": "moria-autres",
"sort": 7,
"fr": {
"nom": "Couteau de Paufique",
"description": "Cliveur, 6 mm (serpette de Desmarres-Paufique). Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 3201\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Paufique Knife",
"description": "Corneal dissector, 6 mm (lancet shape Desmarres-Paufique). MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 3201\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d0c6ec0b-62a4-4e5d-acec-99fdc1f5917c",
"ref": "1121B",
"cat": "moria-autres",
"sort": 8,
"fr": {
"nom": "Curette d'Abadie",
"description": "Petit modèle, 8 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 1121B\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Abadie Curette",
"description": "Small model, 8 mm. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 1121B\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f6f5b6df-49b5-484d-b876-181b3fab996d",
"ref": "1353",
"cat": "moria-autres",
"sort": 9,
"fr": {
"nom": "Écarteur de Wolkmann",
"description": "À 4 griffes. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 1353\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Wolkmann Retractor",
"description": "With 4 prongs. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 1353\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "aa9c064b-88cb-43d1-9b61-24b3592e395f",
"ref": "2597B",
"cat": "moria-autres",
"sort": 10,
"fr": {
"nom": "Releveur de paupières de Desmarres",
"description": "Moyen modèle, 12 mm, mousse. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2597B\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Desmarres Lid Retractor",
"description": "Medium size, 12 mm, blunt. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2597B\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "bdf7b556-47bc-43e7-b0fa-d0433ec16976",
"ref": "6100",
"cat": "moria-autres",
"sort": 11,
"fr": {
"nom": "Marqueur de Urrets-Zavalia",
"description": "Identateur, pique à fixation et dépresseur, permet la rotation du globe. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 6100\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Urrets-Zavalia Marker",
"description": "Indentator, fixation pick and depressor, allowing rotation of the globe. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 6100\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7a3636ea-4685-4e72-b078-22beb6a567ff",
"ref": "20033",
"cat": "moria-autres",
"sort": 12,
"fr": {
"nom": "Marqueur pendulaire de Can",
"description": "Positionnement des implants toriques. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20033\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Can Pendular Marker",
"description": "Positioning of toric IOLs. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20033\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "fa369713-4d35-4013-a585-ea49ab2258ff",
"ref": "20044",
"cat": "moria-autres",
"sort": 13,
"fr": {
"nom": "Marqueur d'haptique LIO Gorovoy",
"description": "Marque la localisation souhaitée des haptiques d'une LIO lors de sa mise en place en l'absence de support zonulaire/capsulaire. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20044\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "IOL Haptic Gorovoy Marker",
"description": "To mark expected location of IOL haptics during IOL fixation technique in the absence of zonular/capsular support. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20044\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "277f3589-3281-4f5f-929e-2444f0c718c8",
"ref": "19095",
"cat": "moria-autres",
"sort": 14,
"fr": {
"nom": "Marqueur diamètre 8,5 mm pour la cornée du patient",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19095\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "8.5-mm Diameter Marker for patient cornea",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19095\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "bfb5b272-1a8e-4f51-bb12-b2e1e7b96a83",
"ref": "19096",
"cat": "moria-autres",
"sort": 15,
"fr": {
"nom": "Marqueur « S »",
"description": "Pour marquer un « S » sur le stroma du lenticule du donneur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19096\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "\"S\" Marker",
"description": "Designed to mark an \"S\" on the stromal side of the donor button. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19096\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b60b7966-f13f-4b5a-b1b1-ad6ecc34aa8e",
"ref": "20034",
"cat": "moria-autres",
"sort": 16,
"fr": {
"nom": "Marqueur « S » angulé",
"description": "Pour marquer un « S » sur le stroma du lenticule du donneur. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20034\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Angled \"S\" Marker",
"description": "To mark an \"S\" on the stromal side of the donor button. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20034\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "73dedd52-3d5b-4a29-9794-075b39df5072",
"ref": "20045",
"cat": "moria-autres",
"sort": 17,
"fr": {
"nom": "Marqueur « F »",
"description": "Pour marquer un « F » sur le côté descemétique d'un greffon DMEK. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 20045\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "\"F\" marker",
"description": "To stamp a \"F\" on the Descemetic side of a DMEK graft. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 20045\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b7c0b545-7259-4d94-973a-b3d52dc85be8",
"ref": "19047",
"cat": "moria-autres",
"sort": 18,
"fr": {
"nom": "Marqueur de Culbertson",
"description": "Asymétrique (5 marques) pour une remise en place exacte du volet. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19047\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Culbertson Marker",
"description": "Asymmetrical marker (5 marks) for proper flap alignment. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19047\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "85e24a84-7573-4280-a19b-d49e4ebb0e62",
"ref": "2456",
"cat": "moria-autres",
"sort": 19,
"fr": {
"nom": "Plaque à paupières de Jaeger",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2456\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Jaeger Lid Plate",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2456\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a3ed3e6a-0392-4887-bd50-b46cb94d2908",
"ref": "19009",
"cat": "moria-autres",
"sort": 20,
"fr": {
"nom": "Dilatateur de pupille de Beehler – droit, 4 points de dilatation de la pupille",
"description": "Droit, 4 points de dilatation de la pupille, pour incision de 3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19009\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Beehler Pupil Dilator – straight",
"description": "Straight, 4 stretching points with 3 extendable \"micro fingers\", insertion through 3-mm incision. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19009\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "2cdf2cbe-c540-4514-8ddf-7e0200bf0d08",
"ref": "19016",
"cat": "moria-autres",
"sort": 21,
"fr": {
"nom": "Extrémité de Remplacement pour dilatateur de pupille de Beehler #19009",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19016\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Replacement Kit for Beehler Pupil Dilator Tip #19009",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19016\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ff6e8280-c4e0-455f-a765-8d2dad541da6",
"ref": "19039",
"cat": "moria-autres",
"sort": 22,
"fr": {
"nom": "Extrémité de Remplacement pour dilatateur de pupille de Beehler #19009/2.8",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19039\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Replacement Kit for Beehler Pupil Dilator Tip #19009/2.8",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19039\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ead261b4-6be4-45c3-9d0a-79bc8b1d3bf7",
"ref": "19027",
"cat": "moria-autres",
"sort": 23,
"fr": {
"nom": "Dilatateur de pupille de Beehler – courbe, 4 points de dilatation de la pupille",
"description": "Courbe, 4 points de dilatation de la pupille, pour incision de 3 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19027\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Beehler Pupil Dilator – curved, 4 stretching points of pupil, for 3-mm incision",
"description": "Curved, 4 stretching points of pupil, for 3-mm incision. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19027\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "e755958b-bf60-4c47-bf36-a9ab21a00089",
"ref": "19050",
"cat": "moria-autres",
"sort": 24,
"fr": {
"nom": "Extrémité de Remplacement pour dilatateur de pupille de Beehler #19027",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19050\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Replacement Kit for Beehler Pupil Dilator Tip #19027",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19050\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "39429089-fa4c-49e1-86ac-5ac034aa13cc",
"ref": "19070",
"cat": "moria-autres",
"sort": 25,
"fr": {
"nom": "Micro dilatateur de pupille de Beehler",
"description": "Droit, 3 points de dilatation, pour micro incision 20 G. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19070\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Micro Beehler Pupil Dilator",
"description": "Straight 20 G, 3 stretching points. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19070\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "8b5fd1f5-8398-4c6b-bb8f-1a1745f27394",
"ref": "19076",
"cat": "moria-autres",
"sort": 26,
"fr": {
"nom": "Extrémité de Remplacement pour dilatateur de pupille de Beehler #19070",
"description": "Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 19076\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Replacement Kit for Beehler Pupil Dilator Tip #19070",
"description": "MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 19076\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "608b3d15-2944-475c-bae3-62a29ef7044d",
"ref": "2873A",
"cat": "moria-autres",
"sort": 27,
"fr": {
"nom": "Stylet à voies lacrymales de Sichel",
"description": "Fin, conique et mousse. Extrémité de 0,41 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 2873A\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Sichel Lachrymal Dilator",
"description": "Delicate, conical and blunt. 0.41-mm tip length. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 2873A\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "f054333c-134c-4567-a081-0269be709602",
"ref": "18069",
"cat": "moria-autres",
"sort": 28,
"fr": {
"nom": "Punch de Crozafon-De Laage",
"description": "Diamètre calibré de 1,5 mm pour une résection semi-circulaire de 0,75 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18069\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Crozafon-De Laage Punch",
"description": "1.5-mm calibrated diameter for 0.75-mm semi-circular resection. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18069\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7be73ca0-37e1-49f1-aa83-7885c111bfd3",
"ref": "18251",
"cat": "moria-autres",
"sort": 29,
"fr": {
"nom": "Extrémité de remplacement 1,5 mm pour punch #18069",
"description": "Extrémité de remplacement de 1,5 mm de diamètre. S'utilise avec le punch de Crozafon-De Laage #18069 pour une résection semi-circulaire de 0,75 mm. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 18251\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Replacement tip 1.5 mm for punch #18069",
"description": "Tip replacement, 1.5-mm diameter. To be used with the Crozafon-De Laage punch #18069 to make 0.75-mm semi-circular resections. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 18251\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "48fa7177-3d0b-45a3-9a2f-e0e0f7578486",
"ref": "22518355",
"cat": "moria-boites-sterilisation",
"sort": 1,
"fr": {
"nom": "Boîte de stérilisation inox non colorée 316 x 210 x 25 mm",
"description": "Boîte de stérilisation en inox non coloré, 316 x 210 x 25 mm. Plaque picots silicone fournie, avec fermoir. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518355\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Non-coloured stainless steel sterilization box 316 x 210 x 25 mm",
"description": "Non-coloured stainless steel sterilization box, 316 x 210 x 25 mm. Silicone mat supplied, with lock. MORIA sterilization box.",
"fiche_technique": "Reference: 22518355\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "b211e761-bf4a-43b9-9d28-c122e816ea09",
"ref": "22518356",
"cat": "moria-boites-sterilisation",
"sort": 2,
"fr": {
"nom": "Boîte de stérilisation inox non colorée 253 x 210 x 25 mm",
"description": "Boîte de stérilisation en inox non coloré, 253 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518356\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Non-coloured stainless steel sterilization box 253 x 210 x 25 mm",
"description": "Non-coloured stainless steel sterilization box, 253 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518356\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "37d76d2f-c981-4960-916b-342c4ad9d1cf",
"ref": "22518357",
"cat": "moria-boites-sterilisation",
"sort": 3,
"fr": {
"nom": "Boîte de stérilisation inox non colorée 190 x 210 x 25 mm",
"description": "Boîte de stérilisation en inox non coloré, 190 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518357\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Non-coloured stainless steel sterilization box 190 x 210 x 25 mm",
"description": "Non-coloured stainless steel sterilization box, 190 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518357\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "5e718012-1237-4391-b97d-2112262deb1d",
"ref": "22518358",
"cat": "moria-boites-sterilisation",
"sort": 4,
"fr": {
"nom": "Boîte de stérilisation inox non colorée 127 x 210 x 25 mm",
"description": "Boîte de stérilisation en inox non coloré, 127 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518358\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Non-coloured stainless steel sterilization box 127 x 210 x 25 mm",
"description": "Non-coloured stainless steel sterilization box, 127 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518358\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "578c5d18-5017-4abc-a7aa-d3017035adfd",
"ref": "22518359",
"cat": "moria-boites-sterilisation",
"sort": 5,
"fr": {
"nom": "Boîte de stérilisation inox non colorée 64 x 210 x 25 mm",
"description": "Boîte de stérilisation en inox non coloré, 64 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518359\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Non-coloured stainless steel sterilization box 64 x 210 x 25 mm",
"description": "Non-coloured stainless steel sterilization box, 64 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518359\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "68520318-9912-4539-a689-b50b16483bbf",
"ref": "22518350",
"cat": "moria-boites-sterilisation",
"sort": 6,
"fr": {
"nom": "Boîte de stérilisation aluminium anodisé or 316 x 210 x 25 mm",
"description": "Boîte de stérilisation en aluminium anodisé or, 316 x 210 x 25 mm. Plaque picots silicone fournie, avec fermoir. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518350\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Gold anodized aluminium sterilization box 316 x 210 x 25 mm",
"description": "Gold anodized aluminium sterilization box, 316 x 210 x 25 mm. Silicone mat supplied, with lock. MORIA sterilization box.",
"fiche_technique": "Reference: 22518350\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d1b02908-d0cf-4d1e-ab3b-7ea1f8a7e39c",
"ref": "22518351",
"cat": "moria-boites-sterilisation",
"sort": 7,
"fr": {
"nom": "Boîte de stérilisation aluminium anodisé rouge 253 x 210 x 25 mm",
"description": "Boîte de stérilisation en aluminium anodisé rouge, 253 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518351\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Red anodized aluminium sterilization box 253 x 210 x 25 mm",
"description": "Red anodized aluminium sterilization box, 253 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518351\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "7a36d3f3-0a00-4a5d-967c-b38bd802dcce",
"ref": "22518352",
"cat": "moria-boites-sterilisation",
"sort": 8,
"fr": {
"nom": "Boîte de stérilisation aluminium anodisé vert 190 x 210 x 25 mm",
"description": "Boîte de stérilisation en aluminium anodisé vert, 190 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518352\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Green anodized aluminium sterilization box 190 x 210 x 25 mm",
"description": "Green anodized aluminium sterilization box, 190 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518352\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "ea4c69ad-d0f6-43dd-acfb-52ccfebedc68",
"ref": "22518353",
"cat": "moria-boites-sterilisation",
"sort": 9,
"fr": {
"nom": "Boîte de stérilisation aluminium anodisé bleu 127 x 210 x 25 mm",
"description": "Boîte de stérilisation en aluminium anodisé bleu, 127 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518353\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Blue anodized aluminium sterilization box 127 x 210 x 25 mm",
"description": "Blue anodized aluminium sterilization box, 127 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518353\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "9f7118b7-b5e9-481e-b53c-530b102ebb1b",
"ref": "22518354",
"cat": "moria-boites-sterilisation",
"sort": 10,
"fr": {
"nom": "Boîte de stérilisation aluminium anodisé noir 64 x 210 x 25 mm",
"description": "Boîte de stérilisation en aluminium anodisé noir, 64 x 210 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22518354\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Black anodized aluminium sterilization box 64 x 210 x 25 mm",
"description": "Black anodized aluminium sterilization box, 64 x 210 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22518354\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "12b014f1-0cac-42b1-a93c-aadf1e5f0e5c",
"ref": "22519093",
"cat": "moria-boites-sterilisation",
"sort": 11,
"fr": {
"nom": "Boîte de stérilisation aluminium pour kératoplastie lamellaire",
"description": "Boîte de stérilisation en aluminium pour la petite instrumentation manuelle de kératoplastie lamellaire. 210 x 127 x 25 mm. Boîte de stérilisation MORIA.",
"fiche_technique": "Référence : 22519093\nFamille : Boîtes de stérilisation\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Aluminium sterilization box for lamellar keratoplasty",
"description": "Aluminium sterilization box for lamellar keratoplasty hand-held instruments. 210 x 127 x 25 mm. MORIA sterilization box.",
"fiche_technique": "Reference: 22519093\nFamily: Sterilization boxes\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "a7adf0dc-81fa-4dc1-8277-28f5fcfc3e65",
"ref": "17150B",
"cat": "moria-autres",
"sort": 30,
"fr": {
"nom": "Bloc réceptacle creux en silicone",
"description": "Bloc réceptacle creux en silicone, élément de l'extension du set Moria de kératoplastie transfixiante (KT) #442B. Instrument réutilisable MORIA, conçu, fabriqué et fini à la main en France.",
"fiche_technique": "Référence : 17150B\nFamille : Autres instruments\nGamme : instrumentation réutilisable MORIA\nFabricant : MORIA (France)"
},
"en": {
"nom": "Silicone Block Receptacle, Hollowed",
"description": "Hollowed silicone block receptacle, part of the extension of the Moria penetrating keratoplasty (PK) set #442B. MORIA reusable instrument, designed, manufactured and hand finished in France.",
"fiche_technique": "Reference: 17150B\nFamily: Other instruments\nRange: MORIA reusable instrumentation\nManufacturer: MORIA (France)"
},
"img": null,
"pdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000001",
"new": true,
"ref": "17258X10",
"slug": "moria-uu-blepharostat-a-fil-pour-prematures-17258x10",
"cat": "moria-uu-blepharostats",
"sort": 1,
"fr": {
"nom": "Blépharostat à fil pour prématurés",
"description": "Oreilles de 6 et 9 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17258X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Neonatal wire speculum",
"description": "6- and 9-mm blades. MORIA single-use range.",
"fiche_technique": "Reference: 17258X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17258x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000002",
"new": true,
"ref": "17266X10",
"slug": "moria-uu-petit-blepharostat-pediatrique-a-fil-17266x10",
"cat": "moria-uu-blepharostats",
"sort": 2,
"fr": {
"nom": "Petit blépharostat pédiatrique à fil",
"description": "Oreilles à fil de 4,1 mm ; oreilles qui s'emboîtent pour une insertion et un retrait facilités ; taille et caractéristiques de flexion appropriées pour les prématurés. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17266X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Small neonatal speculum",
"description": "4.1-mm wire blades; staggered closed wire blades that fit together for easy insertion and removal; appropriate size and flex characteristics for premature infants. MORIA single-use range.",
"fiche_technique": "Reference: 17266X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17266x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000003",
"new": true,
"ref": "17537X10",
"slug": "moria-uu-blepharostat-a-fil-avec-plateaux-17537x10",
"cat": "moria-uu-blepharostats",
"sort": 3,
"fr": {
"nom": "Blépharostat à fil avec plateaux",
"description": "Oreilles fermées de 15 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17537X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Wire speculum with platforms",
"description": "15-mm closed blades. MORIA single-use range.",
"fiche_technique": "Reference: 17537X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17537x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000004",
"new": true,
"ref": "17227X10",
"slug": "moria-uu-blepharostat-a-fil-de-kratz-adulte-17227x10",
"cat": "moria-uu-blepharostats",
"sort": 4,
"fr": {
"nom": "Blépharostat à fil de Kratz adulte",
"description": "Oreilles ouvertes de 15 mm, fil de 1 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17227X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Kratz wire speculum",
"description": "15-mm open blades, 1-mm wire diameter. MORIA single-use range.",
"fiche_technique": "Reference: 17227X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17227x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000005",
"new": true,
"ref": "17508X10",
"slug": "moria-uu-blepharostat-reglable-oreilles-ouvertes-de-15-mm-17508x10",
"cat": "moria-uu-blepharostats",
"sort": 5,
"fr": {
"nom": "Blépharostat réglable – oreilles ouvertes de 15 mm",
"description": "Blépharostat réglable à vis, oreilles ouvertes de 15 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17508X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Adjustable speculum – 15-mm open blades",
"description": "Adjustable speculum with screw, 15-mm open blades. MORIA single-use range.",
"fiche_technique": "Reference: 17508X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17508x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000006",
"new": true,
"ref": "17231X10",
"slug": "moria-uu-blepharostat-reglable-oreilles-pleines-de-15-mm-17231x10",
"cat": "moria-uu-blepharostats",
"sort": 6,
"fr": {
"nom": "Blépharostat réglable – oreilles pleines de 15 mm",
"description": "Blépharostat réglable à vis, oreilles pleines de 15 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17231X10\nFamille : Blépharostats\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Adjustable speculum – 15-mm solid blades",
"description": "Adjustable speculum with screw, 15-mm solid blades. MORIA single-use range.",
"fiche_technique": "Reference: 17231X10\nFamily: Speculums\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17231x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000007",
"new": true,
"ref": "17502X10",
"slug": "moria-uu-pince-capsulorhexis-droite-17502x10",
"cat": "moria-uu-pinces",
"sort": 1,
"fr": {
"nom": "Pince capsulorhexis droite",
"description": "Pointes à 90°, incision 1,8 mm, branches droites. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17502X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, straight",
"description": "90° pointed tip, 1.8-mm incision, straight shaft. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17502X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17502x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000008",
"new": true,
"ref": "17503X10",
"slug": "moria-uu-pince-capsulorhexis-courbe-type-corydon-manche-plat-17503x10",
"cat": "moria-uu-pinces",
"sort": 2,
"fr": {
"nom": "Pince capsulorhexis courbe – type Corydon (manche plat)",
"description": "Pointes à 90°, incision 1,8 mm, branches courbes. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17503X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, curved – Corydon type (flat handle)",
"description": "90° pointed tip, 1.8-mm incision, curved shaft. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17503X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17503x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000009",
"new": true,
"ref": "17511X10",
"slug": "moria-uu-pince-d-utrata-droite-17511x10",
"cat": "moria-uu-pinces",
"sort": 3,
"fr": {
"nom": "Pince d'Utrata droite",
"description": "Pointes à 45°, incision 1,8 mm, branches droites. Manche métallique rond. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17511X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, straight – Utrata type",
"description": "45° pointed tip, 1.8-mm incision, straight shaft. Round metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17511X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17511x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000010",
"new": true,
"ref": "17512X10",
"slug": "moria-uu-pince-de-crozafon-courbe-17512x10",
"cat": "moria-uu-pinces",
"sort": 4,
"fr": {
"nom": "Pince de Crozafon courbe",
"description": "Pointes à 45°, incision 1,8 mm, branches courbes. Manche métallique rond. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17512X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, curved – Crozafon type",
"description": "45° pointed tip, 1.8-mm incision, curved shaft. Round metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17512X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17512x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000011",
"new": true,
"ref": "17513X10",
"slug": "moria-uu-pince-de-corydon-courbe-manche-rond-17513x10",
"cat": "moria-uu-pinces",
"sort": 5,
"fr": {
"nom": "Pince de Corydon courbe (manche rond)",
"description": "Pointes à 90°, incision 1,8 mm, branches courbes. Manche métallique rond. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17513X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, curved – Corydon type (round handle)",
"description": "90° pointed tip, 1.8-mm incision, curved shaft. Round metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17513X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17513x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000012",
"new": true,
"ref": "17237X10",
"slug": "moria-uu-pince-capsulorhexis-courbe-pointes-a-90-17237x10",
"cat": "moria-uu-pinces",
"sort": 6,
"fr": {
"nom": "Pince capsulorhexis courbe – pointes à 90°",
"description": "Pointes à 90°, incision 1,8 mm, branches courbes. Manche plastique. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17237X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, curved – 90° pointed tip",
"description": "90° pointed tip, 1.8-mm incision, curved shaft. Plastic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17237X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17237x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000013",
"new": true,
"ref": "17252X10",
"slug": "moria-uu-pince-capsulorhexis-courbe-pointes-a-45-17252x10",
"cat": "moria-uu-pinces",
"sort": 7,
"fr": {
"nom": "Pince capsulorhexis courbe – pointes à 45°",
"description": "Pointes à 45°, incision 1,8 mm, branches courbes. Manche plastique. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17252X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Capsulorhexis forceps, curved – 45° pointed tip",
"description": "45° pointed tip, 1.8-mm incision, curved shaft. Plastic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17252X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17252x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000014",
"new": true,
"ref": "17221X10",
"slug": "moria-uu-pince-de-bonn-droite-plateaux-de-3-7-mm-17221x10",
"cat": "moria-uu-pinces",
"sort": 8,
"fr": {
"nom": "Pince de Bonn droite – plateaux de 3,7 mm",
"description": "Dents de 0,12 mm, plateaux de 3,7 mm. S'utilise notamment pour retirer un fil 6/0 ou 7/0, saisir des compresses ou méchage de cavités. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17221X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Bonn forceps, straight – 3.7-mm platforms",
"description": "0.12-mm teeth, 3.7-mm platforms. Recommended for removing 6/0 or 7/0 thread, grasping compresses or filling cavities with compresses. MORIA single-use range.",
"fiche_technique": "Reference: 17221X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17221x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000015",
"new": true,
"ref": "17504X10",
"slug": "moria-uu-pince-de-bonn-droite-plateaux-de-5-mm-17504x10",
"cat": "moria-uu-pinces",
"sort": 9,
"fr": {
"nom": "Pince de Bonn droite – plateaux de 5 mm",
"description": "Dents de 0,12 mm, plateaux de 5 mm. S'utilise notamment pour retirer un fil 6/0 ou 7/0, saisir des compresses ou méchage de cavités. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17504X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Bonn forceps, straight – 5-mm platforms",
"description": "0.12-mm teeth, 5-mm platforms. Recommended for removing 6/0 or 7/0 thread, grasping compresses or filling cavities with compresses. MORIA single-use range.",
"fiche_technique": "Reference: 17504X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17504x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000016",
"new": true,
"ref": "17505X10",
"slug": "moria-uu-pince-de-bonn-coudee-17505x10",
"cat": "moria-uu-pinces",
"sort": 10,
"fr": {
"nom": "Pince de Bonn coudée",
"description": "Dents de 0,12 mm, plateaux de 5 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17505X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Bonn forceps, angled",
"description": "0.12-mm teeth, 5-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17505X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17505x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000017",
"new": true,
"ref": "17514X10",
"slug": "moria-uu-pince-alveolee-17514x10",
"cat": "moria-uu-pinces",
"sort": 11,
"fr": {
"nom": "Pince alvéolée",
"description": "Extrémité alvéolée de 0,3 mm, plateformes de 5 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17514X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Notched forceps",
"description": "0.3-mm notched jaws, 5-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17514X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17514x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000018",
"new": true,
"ref": "17516X10",
"slug": "moria-uu-pince-de-paufique-17516x10",
"cat": "moria-uu-pinces",
"sort": 12,
"fr": {
"nom": "Pince de Paufique",
"description": "Dents obliques de 0,4 mm, plateaux de 5 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17516X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Paufique forceps",
"description": "0.4-mm oblique teeth, 5-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17516X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17516x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000019",
"new": true,
"ref": "17521X10",
"slug": "moria-uu-pince-de-preparation-de-greffon-17521x10",
"cat": "moria-uu-pinces",
"sort": 13,
"fr": {
"nom": "Pince de préparation de greffon",
"description": "Extrémité ovale 1 mm x 2 mm, branches courbes de 15 mm. Pour la kératoplastie. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17521X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Corneal graft preparation forceps",
"description": "1-mm x 2-mm oval-shaped tip, curved, 15-mm long. For keratoplasty. MORIA single-use range.",
"fiche_technique": "Reference: 17521X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17521x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000020",
"new": true,
"ref": "17233X10",
"slug": "moria-uu-pince-monofilament-coudee-type-mc-pherson-plateaux-de-8-mm-17233x10",
"cat": "moria-uu-pinces",
"sort": 14,
"fr": {
"nom": "Pince monofilament coudée type Mc Pherson – plateaux de 8 mm",
"description": "Coudée, plateaux de 8 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17233X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Mc Pherson tying forceps, angled – 8-mm platforms",
"description": "Angled, 8-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17233X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17233x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000021",
"new": true,
"ref": "17222X10",
"slug": "moria-uu-pince-monofilament-droite-plateaux-de-4-mm-17222x10",
"cat": "moria-uu-pinces",
"sort": 15,
"fr": {
"nom": "Pince monofilament droite – plateaux de 4 mm",
"description": "Plateaux de 4 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17222X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Tying forceps, straight – 4-mm platforms",
"description": "4-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17222X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17222x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000022",
"new": true,
"ref": "17225X10",
"slug": "moria-uu-pince-monofilament-courbe-plateaux-de-4-mm-17225x10",
"cat": "moria-uu-pinces",
"sort": 16,
"fr": {
"nom": "Pince monofilament courbe – plateaux de 4 mm",
"description": "Plateaux de 4 mm. S'utilise notamment pour retirer du fil 10-0 ou enlever des cils. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17225X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Tying forceps, curved – 4-mm platforms",
"description": "4-mm platforms. Recommended for removing 10-0 thread or eyelashes. MORIA single-use range.",
"fiche_technique": "Reference: 17225X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17225x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000023",
"new": true,
"ref": "17247X10",
"slug": "moria-uu-pince-monofilament-courbe-plateaux-de-3-5-mm-17247x10",
"cat": "moria-uu-pinces",
"sort": 17,
"fr": {
"nom": "Pince monofilament courbe – plateaux de 3,5 mm",
"description": "Plateaux de 3,5 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17247X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Tying forceps, curved – 3.5-mm platforms",
"description": "3.5-mm platforms. MORIA single-use range.",
"fiche_technique": "Reference: 17247X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17247x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000024",
"new": true,
"ref": "17500X10",
"slug": "moria-uu-pince-monofilament-coudee-type-mc-pherson-plateaux-de-5-mm-17500x10",
"cat": "moria-uu-pinces",
"sort": 18,
"fr": {
"nom": "Pince monofilament coudée type Mc Pherson – plateaux de 5 mm",
"description": "Plateaux de 5 mm. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17500X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Mc Pherson tying forceps, angled – 5-mm platforms",
"description": "5-mm platforms. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17500X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17500x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000025",
"new": true,
"ref": "17501X10",
"slug": "moria-uu-pince-monofilament-courbe-plateaux-de-5-mm-17501x10",
"cat": "moria-uu-pinces",
"sort": 19,
"fr": {
"nom": "Pince monofilament courbe – plateaux de 5 mm",
"description": "Plateaux de 5 mm. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17501X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Tying forceps, curved – 5-mm platforms",
"description": "5-mm platforms. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17501X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17501x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000026",
"new": true,
"ref": "17515X10",
"slug": "moria-uu-pince-de-troutman-droite-17515x10",
"cat": "moria-uu-pinces",
"sort": 20,
"fr": {
"nom": "Pince de Troutman droite",
"description": "Plateaux de 5 mm. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17515X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Troutman forceps, straight",
"description": "5-mm platforms. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17515X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17515x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000027",
"new": true,
"ref": "17517X10",
"slug": "moria-uu-pince-de-joaillier-droite-17517x10",
"cat": "moria-uu-pinces",
"sort": 21,
"fr": {
"nom": "Pince de joaillier droite",
"description": "Longueur 11,5 cm. Manche métallique plat. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17517X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Jeweler forceps, straight",
"description": "11.5-cm length. Flat metallic handle. MORIA single-use range.",
"fiche_technique": "Reference: 17517X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17517x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000028",
"new": true,
"ref": "17450/XX",
"slug": "moria-uu-pince-ilm-one-ret-forceps-23g-25g-27g-17450-xx",
"cat": "moria-uu-pinces",
"sort": 22,
"fr": {
"nom": "Pince ILM ONE® ret-forceps (23G / 25G / 27G)",
"description": "Mors fins pour attraper et peler une membrane telle la MLI (membrane limitante interne). Pince rétine à usage unique, disponible en 23G, 25G et 27G (boîtes de 5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17450/XX\nRéférences : 17450/23GX5, 17450/25GX5, 17450/27GX5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\n17450/23GX5 – ONE® ret-forceps 23G, boîte de 5 – longueur utile ouverte / fermée : 34,6 / 33,3 mm (± 0,5) – force de préhension ≥ 50 g\n17450/25GX5 – ONE® ret-forceps 25G, boîte de 5 – longueur utile ouverte / fermée : 32,5 / 31,3 mm (± 0,5) – force de préhension ≥ 50 g\n17450/27GX5 – ONE® ret-forceps 27G, boîte de 5 – longueur utile ouverte / fermée : 29,5 / 28,2 mm (± 0,5) – force de préhension ≥ 30 g"
},
"en": {
"nom": "ILM forceps ONE® ret-forceps (23G / 25G / 27G)",
"description": "Fine jaws to grip and peel membrane like ILM (Inner Limiting Membrane). Single-use retinal forceps, available in 23G, 25G and 27G (boxes of 5). MORIA single-use range.",
"fiche_technique": "Reference: 17450/XX\nReferences: 17450/23GX5, 17450/25GX5, 17450/27GX5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\n17450/23GX5 – ONE® ret-forceps 23G, box of 5 – useful length open / closed: 34.6 / 33.3 mm (± 0.5) – grasping force ≥ 50 g\n17450/25GX5 – ONE® ret-forceps 25G, box of 5 – useful length open / closed: 32.5 / 31.3 mm (± 0.5) – grasping force ≥ 50 g\n17450/27GX5 – ONE® ret-forceps 27G, box of 5 – useful length open / closed: 29.5 / 28.2 mm (± 0.5) – grasping force ≥ 30 g"
},
"img": "/uploads/products/moria-uu-17450-xx.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000029",
"new": true,
"ref": "17451/XX",
"slug": "moria-uu-pince-end-grasping-one-ret-forceps-23g-25g-27g-17451-xx",
"cat": "moria-uu-pinces",
"sort": 23,
"fr": {
"nom": "Pince End-Grasping ONE® ret-forceps (23G / 25G / 27G)",
"description": "Mors asymétriques pour une large surface de contact et un pelage de membranes. Pince rétine à usage unique, disponible en 23G, 25G et 27G (boîtes de 5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17451/XX\nRéférences : 17451/23GX5, 17451/25GX5, 17451/27GX5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\n17451/23GX5 – ONE® ret-forceps 23G, boîte de 5 – longueur utile ouverte / fermée : 34,5 / 33,2 mm (± 0,5) – force de préhension ≥ 50 g\n17451/25GX5 – ONE® ret-forceps 25G, boîte de 5 – longueur utile ouverte / fermée : 32,5 / 31,2 mm (± 0,5) – force de préhension ≥ 50 g\n17451/27GX5 – ONE® ret-forceps 27G, boîte de 5 – longueur utile ouverte / fermée : 29,7 / 28,4 mm (± 0,5) – force de préhension ≥ 30 g"
},
"en": {
"nom": "End-Grasping forceps ONE® ret-forceps (23G / 25G / 27G)",
"description": "Asymmetric jaws allowing a good contact surface for peeling membranes. Single-use retinal forceps, available in 23G, 25G and 27G (boxes of 5). MORIA single-use range.",
"fiche_technique": "Reference: 17451/XX\nReferences: 17451/23GX5, 17451/25GX5, 17451/27GX5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\n17451/23GX5 – ONE® ret-forceps 23G, box of 5 – useful length open / closed: 34.5 / 33.2 mm (± 0.5) – grasping force ≥ 50 g\n17451/25GX5 – ONE® ret-forceps 25G, box of 5 – useful length open / closed: 32.5 / 31.2 mm (± 0.5) – grasping force ≥ 50 g\n17451/27GX5 – ONE® ret-forceps 27G, box of 5 – useful length open / closed: 29.7 / 28.4 mm (± 0.5) – grasping force ≥ 30 g"
},
"img": "/uploads/products/moria-uu-17451-xx.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000030",
"new": true,
"ref": "17452/XX",
"slug": "moria-uu-pince-eckardt-one-ret-forceps-23g-25g-27g-17452-xx",
"cat": "moria-uu-pinces",
"sort": 24,
"fr": {
"nom": "Pince Eckardt ONE® ret-forceps (23G / 25G / 27G)",
"description": "Micro-pince multi-usage adaptée à tout type de membranes. Pince rétine à usage unique, disponible en 23G, 25G et 27G (boîtes de 5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17452/XX\nRéférences : 17452/23GX5, 17452/25GX5, 17452/27GX5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\n17452/23GX5 – ONE® ret-forceps 23G, boîte de 5 – longueur utile ouverte / fermée : 35,3 / 34,0 mm (± 0,5) – force de préhension ≥ 50 g\n17452/25GX5 – ONE® ret-forceps 25G, boîte de 5 – longueur utile ouverte / fermée : 32,0 / 30,8 mm (± 0,5) – force de préhension ≥ 50 g\n17452/27GX5 – ONE® ret-forceps 27G, boîte de 5 – longueur utile ouverte / fermée : 30,0 / 28,8 mm (± 0,5) – force de préhension ≥ 30 g"
},
"en": {
"nom": "Eckardt forceps ONE® ret-forceps (23G / 25G / 27G)",
"description": "Multipurpose micro-forceps suitable for all types of membranes. Single-use retinal forceps, available in 23G, 25G and 27G (boxes of 5). MORIA single-use range.",
"fiche_technique": "Reference: 17452/XX\nReferences: 17452/23GX5, 17452/25GX5, 17452/27GX5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\n17452/23GX5 – ONE® ret-forceps 23G, box of 5 – useful length open / closed: 35.3 / 34.0 mm (± 0.5) – grasping force ≥ 50 g\n17452/25GX5 – ONE® ret-forceps 25G, box of 5 – useful length open / closed: 32.0 / 30.8 mm (± 0.5) – grasping force ≥ 50 g\n17452/27GX5 – ONE® ret-forceps 27G, box of 5 – useful length open / closed: 30.0 / 28.8 mm (± 0.5) – grasping force ≥ 30 g"
},
"img": "/uploads/products/moria-uu-17452-xx.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000031",
"new": true,
"ref": "17453/XX",
"slug": "moria-uu-pince-ultra-grip-one-ret-forceps-23g-25g-27g-17453-xx",
"cat": "moria-uu-pinces",
"sort": 25,
"fr": {
"nom": "Pince Ultra-Grip ONE® ret-forceps (23G / 25G / 27G)",
"description": "Pince micro-striée pour attraper et peler les membranes. Pince rétine à usage unique, disponible en 23G, 25G et 27G (boîtes de 5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17453/XX\nRéférences : 17453/23GX5, 17453/25GX5, 17453/27GX5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\n17453/23GX5 – ONE® ret-forceps 23G, boîte de 5 – longueur utile ouverte / fermée : 33,8 / 32,5 mm (± 0,5) – force de préhension ≥ 130 g\n17453/25GX5 – ONE® ret-forceps 25G, boîte de 5 – longueur utile ouverte / fermée : 31,7 / 30,4 mm (± 0,5) – force de préhension ≥ 130 g\n17453/27GX5 – ONE® ret-forceps 27G, boîte de 5 – longueur utile ouverte / fermée : 31,7 / 30,4 mm (± 0,5) – force de préhension ≥ 80 g"
},
"en": {
"nom": "Ultra-Grip forceps ONE® ret-forceps (23G / 25G / 27G)",
"description": "Micro-striated forceps for gripping membranes. Single-use retinal forceps, available in 23G, 25G and 27G (boxes of 5). MORIA single-use range.",
"fiche_technique": "Reference: 17453/XX\nReferences: 17453/23GX5, 17453/25GX5, 17453/27GX5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\n17453/23GX5 – ONE® ret-forceps 23G, box of 5 – useful length open / closed: 33.8 / 32.5 mm (± 0.5) – grasping force ≥ 130 g\n17453/25GX5 – ONE® ret-forceps 25G, box of 5 – useful length open / closed: 31.7 / 30.4 mm (± 0.5) – grasping force ≥ 130 g\n17453/27GX5 – ONE® ret-forceps 27G, box of 5 – useful length open / closed: 31.7 / 30.4 mm (± 0.5) – grasping force ≥ 80 g"
},
"img": "/uploads/products/moria-uu-17453-xx.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000032",
"new": true,
"ref": "17454/XX",
"slug": "moria-uu-pince-de-tano-one-ret-forceps-23g-25g-27g-17454-xx",
"cat": "moria-uu-pinces",
"sort": 26,
"fr": {
"nom": "Pince de Tano ONE® ret-forceps (23G / 25G / 27G)",
"description": "Pince asymétrique adaptée aux différents types de membranes. Pince rétine à usage unique, disponible en 23G, 25G et 27G (boîtes de 5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17454/XX\nRéférences : 17454/23GX5, 17454/25GX5, 17454/27GX5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\n17454/23GX5 – ONE® ret-forceps 23G, boîte de 5 – longueur utile ouverte / fermée : 33,5 / 32,2 mm (± 0,5) – force de préhension ≥ 50 g\n17454/25GX5 – ONE® ret-forceps 25G, boîte de 5 – longueur utile ouverte / fermée : 31,4 / 30,1 mm (± 0,5) – force de préhension ≥ 50 g\n17454/27GX5 – ONE® ret-forceps 27G, boîte de 5 – longueur utile ouverte / fermée : 29,2 / 27,9 mm (± 0,5) – force de préhension ≥ 30 g"
},
"en": {
"nom": "Tano forceps ONE® ret-forceps (23G / 25G / 27G)",
"description": "Asymmetrical forceps suitable for peeling various membranes. Single-use retinal forceps, available in 23G, 25G and 27G (boxes of 5). MORIA single-use range.",
"fiche_technique": "Reference: 17454/XX\nReferences: 17454/23GX5, 17454/25GX5, 17454/27GX5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\n17454/23GX5 – ONE® ret-forceps 23G, box of 5 – useful length open / closed: 33.5 / 32.2 mm (± 0.5) – grasping force ≥ 50 g\n17454/25GX5 – ONE® ret-forceps 25G, box of 5 – useful length open / closed: 31.4 / 30.1 mm (± 0.5) – grasping force ≥ 50 g\n17454/27GX5 – ONE® ret-forceps 27G, box of 5 – useful length open / closed: 29.2 / 27.9 mm (± 0.5) – grasping force ≥ 30 g"
},
"img": "/uploads/products/moria-uu-17454-xx.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000033",
"new": true,
"ref": "17455/27X5",
"slug": "moria-uu-pince-yoneda-a-bord-arrondi-one-ret-forceps-27g-17455-27x5",
"cat": "moria-uu-pinces",
"sort": 27,
"fr": {
"nom": "Pince Yoneda à bord arrondi ONE® ret-forceps 27G",
"description": "Pince à bords arrondis mousses avec une large surface de contact. Développée avec le Dr Kazuhito Yoneda (Japon). Pince rétine 27G à usage unique, boîte de 5. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17455/27X5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 5\nLongueur utile ouverte / fermée : 29,4 / 28,1 mm (± 0,5) – force de préhension ≥ 80 g"
},
"en": {
"nom": "Yoneda forceps, rounded edge ONE® ret-forceps 27G",
"description": "Blunt rounded wedge with large grasping surface. Developed with Dr Kazuhito Yoneda, MD, PhD, Japan. Single-use 27G retinal forceps, box of 5. MORIA single-use range.",
"fiche_technique": "Reference: 17455/27X5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 5\nUseful length open / closed: 29.4 / 28.1 mm (± 0.5) – grasping force ≥ 80 g"
},
"img": "/uploads/products/moria-uu-17455-27x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000034",
"new": true,
"ref": "17534X10",
"slug": "moria-uu-porte-aiguille-courbe-17534x10",
"cat": "moria-uu-pinces",
"sort": 28,
"fr": {
"nom": "Porte-aiguille courbe",
"description": "Mors courbes et lisses de 9 mm, manche rond ergonomique, longueur 12 cm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17534X10\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Needle holder, curved",
"description": "Smooth and curved jaws, round and ergonomic handle, 12-cm length. MORIA single-use range.",
"fiche_technique": "Reference: 17534X10\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17534x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000035",
"new": true,
"ref": "17301X1",
"slug": "moria-uu-pince-de-busin-23g-17301x1",
"cat": "moria-uu-pinces",
"sort": 29,
"fr": {
"nom": "Pince de Busin 23G",
"description": "Recommandée en DSAEK pour saisir et positionner le lenticule cornéen donneur. Disponible à l'unité (17301X1) ou par boîte de 5 (17301X5). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17301X1\nRéférences : 17301X1, 17301X5\nFamille : Pinces et porte-aiguilles\nGamme : instrumentation à usage unique MORIA"
},
"en": {
"nom": "Busin forceps 23G",
"description": "Recommended in DSAEK for grasping and positioning the donor graft. Available individually (17301X1) or in boxes of 5 (17301X5). MORIA single-use range.",
"fiche_technique": "Reference: 17301X1\nReferences: 17301X1, 17301X5\nFamily: Forceps and needle holders\nRange: MORIA single-use instrumentation"
},
"img": "/uploads/products/moria-uu-17301x1.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000036",
"new": true,
"ref": "17522X10",
"slug": "moria-uu-separateur-elevateur-relex-17522x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 1,
"fr": {
"nom": "Séparateur-élévateur RELEX",
"description": "Spatule courbe et crochet angulé. Pour la chirurgie réfractive. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17522X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "RELEX manipulator",
"description": "Curved spatula and angled hook. For refractive surgery. MORIA single-use range.",
"fiche_technique": "Reference: 17522X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17522x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000037",
"new": true,
"ref": "17523X10",
"slug": "moria-uu-separateur-elevateur-lasik-17523x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 2,
"fr": {
"nom": "Séparateur-élévateur LASIK",
"description": "Extrémité droite et mousse pour déplacer le capot cornéen, crochet angulé. Pour la chirurgie réfractive. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17523X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "LASIK manipulator",
"description": "Straight and foam tip to move the corneal flap, angled hook. For refractive surgery. MORIA single-use range.",
"fiche_technique": "Reference: 17523X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17523x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000038",
"new": true,
"ref": "17223X10",
"slug": "moria-uu-crochet-manipulateur-de-sinskey-17223x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 3,
"fr": {
"nom": "Crochet manipulateur de Sinskey",
"description": "Coudé, extrémité de 0,2 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17223X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Sinskey IOL manipulator",
"description": "Angled, 0.2-mm tip. MORIA single-use range.",
"fiche_technique": "Reference: 17223X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17223x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000039",
"new": true,
"ref": "17228X10",
"slug": "moria-uu-manipulateur-a-implant-de-lester-17228x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 4,
"fr": {
"nom": "Manipulateur à implant de Lester",
"description": "Coudé, extrémité « bouton de col ». Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17228X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Lester IOL manipulator",
"description": "Angled, collar button tip. MORIA single-use range.",
"fiche_technique": "Reference: 17228X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17228x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000040",
"new": true,
"ref": "17230X10",
"slug": "moria-uu-crochet-manipulateur-conique-17230x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 5,
"fr": {
"nom": "Crochet manipulateur conique",
"description": "Conique, droit, mousse. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17230X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Lens manipulator",
"description": "Conical, straight, blunt. MORIA single-use range.",
"fiche_technique": "Reference: 17230X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17230x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000041",
"new": true,
"ref": "17229X10",
"slug": "moria-uu-crochet-manipulateur-phaco-chopper-17229x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 6,
"fr": {
"nom": "Crochet manipulateur phaco chopper",
"description": "Extrémité de 1,5 mm, partie interne tranchante. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17229X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Lens manipulator phaco chopper",
"description": "1.5-mm tip, inner cutting edge. MORIA single-use range.",
"fiche_technique": "Reference: 17229X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17229x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000042",
"new": true,
"ref": "17242X10",
"slug": "moria-uu-manipulateur-de-drysdale-17242x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 7,
"fr": {
"nom": "Manipulateur de Drysdale",
"description": "Extrémité mousse en forme de spatule. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17242X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Drysdale lens manipulator",
"description": "Blunt paddle design. MORIA single-use range.",
"fiche_technique": "Reference: 17242X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17242x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000043",
"new": true,
"ref": "17232X10",
"slug": "moria-uu-anneau-de-fixation-de-thornton-17232x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 8,
"fr": {
"nom": "Anneau de fixation de Thornton",
"description": "Dents mousses, diamètre interne de 1,3 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17232X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Thornton-Fine fixation ring",
"description": "Blunt teeth, 1.3-mm internal diameter. MORIA single-use range.",
"fiche_technique": "Reference: 17232X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17232x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000044",
"new": true,
"ref": "17250X10",
"slug": "moria-uu-anneau-de-mendez-17250x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 9,
"fr": {
"nom": "Anneau de Mendez",
"description": "Diamètre intérieur de 12 mm ; graduation tous les 5° ; 4 encoches aux points cardinaux ; manche à 0° pour un positionnement temporal ; surface mate pour une meilleure visibilité sous microscope. Pour le positionnement des LIO toriques. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17250X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Mendez ring",
"description": "12-mm inside diameter; indicators at increments of 5°; four notches on the internal edge at cardinal positions; handle positioned at 0° to hold temporally; dark surface for good visibility under microscope. For toric IOL positioning. MORIA single-use range.",
"fiche_technique": "Reference: 17250X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17250x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000045",
"new": true,
"ref": "17544X10",
"slug": "moria-uu-spatule-de-koch-courbe-17544x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 10,
"fr": {
"nom": "Spatule de Koch courbe",
"description": "Longueur 116 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17544X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Koch spatula, curved",
"description": "116-mm length. MORIA single-use range.",
"fiche_technique": "Reference: 17544X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17544x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000046",
"new": true,
"ref": "17302X5",
"slug": "moria-uu-crochet-de-price-17302x5",
"cat": "moria-uu-crochets-anneaux",
"sort": 11,
"fr": {
"nom": "Crochet de Price",
"description": "Sinskey inversé, recommandé en DSAEK et DMEK pour le descemetorhexis. Boîte de 5. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17302X5\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 5"
},
"en": {
"nom": "Price hook",
"description": "Reverse Sinskey, recommended in DSAEK and DMEK for the descemetorhexis. Box of 5. MORIA single-use range.",
"fiche_technique": "Reference: 17302X5\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 5"
},
"img": "/uploads/products/moria-uu-17302x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000047",
"new": true,
"ref": "17303X5",
"slug": "moria-uu-spatule-90-17303x5",
"cat": "moria-uu-crochets-anneaux",
"sort": 12,
"fr": {
"nom": "Spatule 90°",
"description": "Extrémité angulée à 90°, recommandée en DSAEK et DMEK pour retirer la membrane de Descemet. Boîte de 5 (17303X5) ou de 10 (17303X10). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17303X5\nRéférences : 17303X5, 17303X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA"
},
"en": {
"nom": "90° spatula",
"description": "90° angled tip, recommended in DSAEK and DMEK for Descemet's stripping. Box of 5 (17303X5) or 10 (17303X10). MORIA single-use range.",
"fiche_technique": "Reference: 17303X5\nReferences: 17303X5, 17303X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation"
},
"img": "/uploads/products/moria-uu-17303x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000048",
"new": true,
"ref": "17300X5",
"slug": "moria-uu-spatule-de-busin-17300x5",
"cat": "moria-uu-crochets-anneaux",
"sort": 13,
"fr": {
"nom": "Spatule de Busin",
"description": "Recommandée en DSAEK pour l'insertion du lenticule cornéen donneur ; incision de 3,2 mm. Boîte de 5. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17300X5\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 5"
},
"en": {
"nom": "Busin spatula",
"description": "Recommended in DSAEK for insertion of donor graft; 3.2-mm incision. Box of 5. MORIA single-use range.",
"fiche_technique": "Reference: 17300X5\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 5"
},
"img": "/uploads/products/moria-uu-17300x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000049",
"new": true,
"ref": "17541X10",
"slug": "moria-uu-spatule-epitheliale-17541x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 14,
"fr": {
"nom": "Spatule épithéliale",
"description": "Longueur 5,5 mm. Pour la chirurgie réfractive et la kératoplastie. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17541X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Epithelial spatula",
"description": "5.5-mm length. For refractive surgery and keratoplasty. MORIA single-use range.",
"fiche_technique": "Reference: 17541X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17541x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000050",
"new": true,
"ref": "17249X10",
"slug": "moria-uu-marqueur-a-bulle-17249x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 15,
"fr": {
"nom": "Marqueur à bulle",
"description": "Marquage pré-opératoire de l'axe 0 - 180° ; surface de marquage fine : 0,4 mm x 3 mm. Pour le positionnement des LIO toriques. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17249X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Preoperative bubble marker",
"description": "Preoperative marking of the 0-180° axis; thin marking surface: 0.4 mm x 3 mm. For toric IOL positioning. MORIA single-use range.",
"fiche_technique": "Reference: 17249X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17249x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000051",
"new": true,
"ref": "17251X10",
"slug": "moria-uu-marqueur-de-bores-17251x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 16,
"fr": {
"nom": "Marqueur de Bores",
"description": "Insertion dans l'anneau de Mendez pour réaliser 2 marques radiales sur l'axe désiré ; marques précises et fines de 0,4 mm ; arêtes émoussées épousant la courbe de la cornée ; surface mate pour une meilleure visibilité sous microscope. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17251X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Bores marker",
"description": "Used inside the Mendez ring to make two radial marks along the desired axis; precise 0.4-mm fine markings; blade design follows the curvature of the cornea; matte surface for maximum visibility under the microscope. MORIA single-use range.",
"fiche_technique": "Reference: 17251X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17251x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000052",
"new": true,
"ref": "17518X10",
"slug": "moria-uu-marqueur-cornee-8-8-5-9-mm-17518x10",
"cat": "moria-uu-crochets-anneaux",
"sort": 17,
"fr": {
"nom": "Marqueur cornée (8 / 8,5 / 9 mm)",
"description": "Marqueur pour la cornée du patient, disponible en diamètres 8 mm, 8,5 mm et 9 mm (réf. 17518X10, 17519X10, 17520X10). Pour la chirurgie réfractive et la kératoplastie. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17518X10\nRéférences : 17518X10, 17519X10, 17520X10\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA"
},
"en": {
"nom": "Corneal marker (8 / 8.5 / 9 mm)",
"description": "Marker for the patient's cornea, available in 8-mm, 8.5-mm and 9-mm diameters (ref. 17518X10, 17519X10, 17520X10). For refractive surgery and keratoplasty. MORIA single-use range.",
"fiche_technique": "Reference: 17518X10\nReferences: 17518X10, 17519X10, 17520X10\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation"
},
"img": "/uploads/products/moria-uu-17518x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000053",
"new": true,
"ref": "17539X20",
"slug": "moria-uu-marqueur-scleral-3-5-mm-4-mm-17539x20",
"cat": "moria-uu-crochets-anneaux",
"sort": 18,
"fr": {
"nom": "Marqueur scléral 3,5 mm / 4 mm",
"description": "Marquage scléral par indentation à 3,5 mm et 4 mm. Pour les injections intravitréennes. Boîte de 20. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17539X20\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 20"
},
"en": {
"nom": "Scleral marker 3.5 mm / 4 mm",
"description": "Scleral marking at 3.5 mm and 4.0 mm. For intravitreal injections. Box of 20. MORIA single-use range.",
"fiche_technique": "Reference: 17539X20\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 20"
},
"img": "/uploads/products/moria-uu-17539x20.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000054",
"new": true,
"ref": "17253X20",
"slug": "moria-uu-depresseur-a-double-extremite-17253x20",
"cat": "moria-uu-crochets-anneaux",
"sort": 19,
"fr": {
"nom": "Dépresseur à double extrémité",
"description": "4 orientations possibles. Pour la néonatologie (examen ROP). Boîte de 20. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17253X20\nFamille : Crochets, anneaux et marqueurs\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 20"
},
"en": {
"nom": "Double-ended depressor",
"description": "4 distinct orientations. For neonatology (ROP examination). Box of 20. MORIA single-use range.",
"fiche_technique": "Reference: 17253X20\nFamily: Hooks, rings and markers\nRange: MORIA single-use instrumentation\nPackaging: box of 20"
},
"img": "/uploads/products/moria-uu-17253x20.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000055",
"new": true,
"ref": "17506X5",
"slug": "moria-uu-ciseaux-a-doigts-pointus-17506x5",
"cat": "moria-uu-ciseaux",
"sort": 1,
"fr": {
"nom": "Ciseaux à doigts pointus",
"description": "S'utilisent notamment pour découper un champ ou un fil 6/0 à 10/0. Boîte de 5. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17506X5\nFamille : Ciseaux\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 5"
},
"en": {
"nom": "Ring scissors – sharp",
"description": "Recommended for cutting operative field or removing 6/0 to 10/0 thread. Box of 5. MORIA single-use range.",
"fiche_technique": "Reference: 17506X5\nFamily: Scissors\nRange: MORIA single-use instrumentation\nPackaging: box of 5"
},
"img": "/uploads/products/moria-uu-17506x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000056",
"new": true,
"ref": "17507X5",
"slug": "moria-uu-ciseaux-a-doigts-mousses-17507x5",
"cat": "moria-uu-ciseaux",
"sort": 2,
"fr": {
"nom": "Ciseaux à doigts mousses",
"description": "S'utilisent notamment pour découper un champ ou un fil 6/0 à 10/0. Boîte de 5. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17507X5\nFamille : Ciseaux\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 5"
},
"en": {
"nom": "Ring scissors – blunt",
"description": "Recommended for cutting operative field or removing 6/0 to 10/0 thread. Box of 5. MORIA single-use range.",
"fiche_technique": "Reference: 17507X5\nFamily: Scissors\nRange: MORIA single-use instrumentation\nPackaging: box of 5"
},
"img": "/uploads/products/moria-uu-17507x5.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000057",
"new": true,
"ref": "17531X10",
"slug": "moria-uu-ciseaux-de-vannas-courbes-17531x10",
"cat": "moria-uu-ciseaux",
"sort": 3,
"fr": {
"nom": "Ciseaux de Vannas courbes",
"description": "Extrémité mousse, lame de 5 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17531X10\nFamille : Ciseaux\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Vannas scissors, curved",
"description": "Blunt tip, 5-mm blade length. MORIA single-use range.",
"fiche_technique": "Reference: 17531X10\nFamily: Scissors\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17531x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000058",
"new": true,
"ref": "17532X10",
"slug": "moria-uu-ciseaux-de-castroviejo-courbes-17532x10",
"cat": "moria-uu-ciseaux",
"sort": 4,
"fr": {
"nom": "Ciseaux de Castroviejo courbes",
"description": "Extrémité mousse, lame de 8 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17532X10\nFamille : Ciseaux\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Castroviejo scissors, curved",
"description": "Blunt tip, 8-mm blade length. MORIA single-use range.",
"fiche_technique": "Reference: 17532X10\nFamily: Scissors\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17532x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000059",
"new": true,
"ref": "17533X10",
"slug": "moria-uu-ciseaux-de-westcott-courbes-17533x10",
"cat": "moria-uu-ciseaux",
"sort": 5,
"fr": {
"nom": "Ciseaux de Westcott courbes",
"description": "Extrémité pointue, lame de 8 mm. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17533X10\nFamille : Ciseaux\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "Westcott scissors, curved",
"description": "Pointed tip, 8-mm blade length. MORIA single-use range.",
"fiche_technique": "Reference: 17533X10\nFamily: Scissors\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17533x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000060",
"new": true,
"ref": "M0275",
"slug": "moria-uu-aiguilles-retrobulbaires-25g-m0275",
"cat": "moria-uu-canules",
"sort": 1,
"fr": {
"nom": "Aiguilles rétrobulbaires 25G",
"description": "Pour injection d'agents anesthésiques derrière le globe oculaire. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M0275\nRéférences : M0275, M0637\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM0275 – 25G – 0,5 x 38 mm\nM0637 – 25G – 0,5 x 38 mm (Atkinson)"
},
"en": {
"nom": "Retrobulbar needles 25G",
"description": "For injection of anesthetic agents behind the eyeball. MORIA single-use range.",
"fiche_technique": "Reference: M0275\nReferences: M0275, M0637\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM0275 – 25G – 0.5 x 38 mm\nM0637 – 25G – 0.5 x 38 mm (Atkinson)"
},
"img": "/uploads/products/moria-uu-m0275.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000061",
"new": true,
"ref": "M0643",
"slug": "moria-uu-aiguilles-peribulbaires-atkinson-m0643",
"cat": "moria-uu-canules",
"sort": 2,
"fr": {
"nom": "Aiguilles péribulbaires (Atkinson)",
"description": "Pour injection d'agents anesthésiques autour du globe oculaire. Disponibles en 23G, 25G et 27G. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M0643\nRéférences : M0643, M0642, M0642A, M0641\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM0643 – 23G – 0,64 x 32 mm\nM0642 – 25G – 0,5 x 32 mm\nM0642A – 25G – 0,5 x 22 mm\nM0641 – 27G – 0,4 x 22 mm"
},
"en": {
"nom": "Peribulbar needles (Atkinson)",
"description": "For injection of anesthetic agents around the eyeball. Available in 23G, 25G and 27G. MORIA single-use range.",
"fiche_technique": "Reference: M0643\nReferences: M0643, M0642, M0642A, M0641\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM0643 – 23G – 0.64 x 32 mm\nM0642 – 25G – 0.5 x 32 mm\nM0642A – 25G – 0.5 x 22 mm\nM0641 – 27G – 0.4 x 22 mm"
},
"img": "/uploads/products/moria-uu-m0643.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000062",
"new": true,
"ref": "M0278",
"slug": "moria-uu-canule-sous-tenonienne-19g-m0278",
"cat": "moria-uu-canules",
"sort": 3,
"fr": {
"nom": "Canule sous-ténonienne 19G",
"description": "Pour injection d'agents anesthésiques dans l'espace sous-ténonien. L'extrémité plate arrondie permet une progression facile tandis que la courbure permet le mouvement autour du globe. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M0278\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM0278 – 19G – 1,1 x 25 mm"
},
"en": {
"nom": "Sub-tenon cannula 19G",
"description": "For injection of anesthetic agents into the sub-tenon space. Rounded flat tip for easy progression while the curvature allows the movement around the globe. MORIA single-use range.",
"fiche_technique": "Reference: M0278\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM0278 – 19G – 1.1 x 25 mm"
},
"img": "/uploads/products/moria-uu-m0278.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000063",
"new": true,
"ref": "M8604B",
"slug": "moria-uu-polisseurs-de-capsule-posterieure-21g-23g-m8604b",
"cat": "moria-uu-canules",
"sort": 4,
"fr": {
"nom": "Polisseurs de capsule postérieure (21G / 23G)",
"description": "Polisseurs de capsule postérieure à usage unique, disponibles en 21G et 23G. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M8604B\nRéférences : M8604B, M8604A\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM8604B – 21G – 0,81 x 22 mm\nM8604A – 23G – 0,64 x 22 mm"
},
"en": {
"nom": "Posterior capsule polishers (21G / 23G)",
"description": "Single-use posterior capsule polishers, available in 21G and 23G. MORIA single-use range.",
"fiche_technique": "Reference: M8604B\nReferences: M8604B, M8604A\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM8604B – 21G – 0.81 x 22 mm\nM8604A – 23G – 0.64 x 22 mm"
},
"img": "/uploads/products/moria-uu-m8604b.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000064",
"new": true,
"ref": "M2270",
"slug": "moria-uu-canules-de-chambre-anterieure-rycroft-m2270",
"cat": "moria-uu-canules",
"sort": 5,
"fr": {
"nom": "Canules de chambre antérieure (Rycroft)",
"description": "Pour maintenir la profondeur de la chambre antérieure avec du visqueux, du BSS ou de l'air. Disponibles en 30G et 27G. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M2270\nRéférences : M2270, M2270A, M2273A\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM2270 – 30G – 0,3 x 22 mm, extrémité 4 mm\nM2270A – 30G – 0,3 x 22 mm, extrémité 8 mm\nM2273A – 27G – 0,4 x 22 mm"
},
"en": {
"nom": "Cannulas for anterior chamber (Rycroft)",
"description": "To maintain anterior chamber depth with viscous, BSS or air. Available in 30G and 27G. MORIA single-use range.",
"fiche_technique": "Reference: M2270\nReferences: M2270, M2270A, M2273A\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM2270 – 30G – 0.3 x 22 mm, 4-mm tip\nM2270A – 30G – 0.3 x 22 mm, 8-mm tip\nM2273A – 27G – 0.4 x 22 mm"
},
"img": "/uploads/products/moria-uu-m2270.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000065",
"new": true,
"ref": "M3909",
"slug": "moria-uu-canules-pour-solutions-viscoelastiques-23g-25g-m3909",
"cat": "moria-uu-canules",
"sort": 6,
"fr": {
"nom": "Canules pour solutions viscoélastiques (23G / 25G)",
"description": "Canules pour l'injection de solutions viscoélastiques, disponibles en 23G et 25G. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M3909\nRéférences : M3909, M3899A\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM3909 – 23G – 0,64 x 22 mm\nM3899A – 25G – 0,5 x 22 mm"
},
"en": {
"nom": "Cannulas for viscoelastic solutions (23G / 25G)",
"description": "Cannulas for viscoelastic solutions, available in 23G and 25G. MORIA single-use range.",
"fiche_technique": "Reference: M3909\nReferences: M3909, M3899A\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM3909 – 23G – 0.64 x 22 mm\nM3899A – 25G – 0.5 x 22 mm"
},
"img": "/uploads/products/moria-uu-m3909.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000066",
"new": true,
"ref": "M3610",
"slug": "moria-uu-kystotomes-pour-capsulotomie-25g-27g-30g-m3610",
"cat": "moria-uu-canules",
"sort": 7,
"fr": {
"nom": "Kystotomes pour capsulotomie (25G / 27G / 30G)",
"description": "Peuvent être rattachés à une seringue remplie d'air ou de BSS pour maintenir la chambre antérieure pendant la capsulotomie ou pour percer un trou dans la partie condensée du vitré. Les kystotomes préformés ont été conçus pour se conformer à la convexité antérieure du cristallin. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M3610\nRéférences : M3610, M3610B, M3630\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM3610 – 25G – 0,5 x 16 mm\nM3610B – 27G – 0,4 x 16 mm\nM3630 – 30G – 0,3 x 16 mm"
},
"en": {
"nom": "Cystitomes for capsulotomy (25G / 27G / 30G)",
"description": "Can be attached to a syringe filled with air or BSS to maintain the anterior chamber during capsulotomy, or to make a hole in the condensed vitreous. Designed to conform to the anterior convexity of the crystalline lens. MORIA single-use range.",
"fiche_technique": "Reference: M3610\nReferences: M3610, M3610B, M3630\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM3610 – 25G – 0.5 x 16 mm\nM3610B – 27G – 0.4 x 16 mm\nM3630 – 30G – 0.3 x 16 mm"
},
"img": "/uploads/products/moria-uu-m3610.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000067",
"new": true,
"ref": "M2273E",
"slug": "moria-uu-hydrodissecteurs-27g-25g-m2273e",
"cat": "moria-uu-canules",
"sort": 8,
"fr": {
"nom": "Hydrodissecteurs (27G / 25G)",
"description": "La canule à hydrodissection permet de séparer le cortex du noyau cristallinien ; la canule à hydrodélinéation permet de séparer les différentes couches du noyau pour faciliter la phaco-émulsification. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M2273E\nRéférences : M2273E, M3900\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM2273E – 27G – 0,4 x 22 mm\nM3900 – 25G – 0,5 x 22 mm"
},
"en": {
"nom": "Hydrodissectors (27G / 25G)",
"description": "Hydrodissection cannula allows the separation of cortex from the crystalline lens; hydrodelineation cannula allows the separation of different layers of the nucleus to facilitate phacoemulsification. MORIA single-use range.",
"fiche_technique": "Reference: M2273E\nReferences: M2273E, M3900\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM2273E – 27G – 0.4 x 22 mm\nM3900 – 25G – 0.5 x 22 mm"
},
"img": "/uploads/products/moria-uu-m2273e.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000068",
"new": true,
"ref": "M6594",
"slug": "moria-uu-extracteur-de-cortex-23g-charleux-m6594",
"cat": "moria-uu-canules",
"sort": 9,
"fr": {
"nom": "Extracteur de cortex 23G (Charleux)",
"description": "Canule simple courant pour l'extraction du cortex. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M6594\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM6594 – 23G – 0,64 x 16 mm"
},
"en": {
"nom": "Cortex extractor 23G (Charleux)",
"description": "Single-way cannula for cortex extraction. MORIA single-use range.",
"fiche_technique": "Reference: M6594\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM6594 – 23G – 0.64 x 16 mm"
},
"img": "/uploads/products/moria-uu-m6594.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000069",
"new": true,
"ref": "M4499",
"slug": "moria-uu-canules-double-courant-perfluorocarbone-m4499",
"cat": "moria-uu-canules",
"sort": 10,
"fr": {
"nom": "Canules double courant perfluorocarbone",
"description": "Canules double courant pour perfluorocarbone, disponibles en 23G/30G et 25G/30G. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M4499\nRéférences : M4499, M4499A\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM4499 – 23G/30G\nM4499A – 25G/30G"
},
"en": {
"nom": "Double-way cannulas for perfluorocarbon",
"description": "Double-way cannulas for perfluorocarbon, available in 23G/30G and 25G/30G. MORIA single-use range.",
"fiche_technique": "Reference: M4499\nReferences: M4499, M4499A\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM4499 – 23G/30G\nM4499A – 25G/30G"
},
"img": "/uploads/products/moria-uu-m4499.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000070",
"new": true,
"ref": "M4458",
"slug": "moria-uu-canules-backflush-23g-25g-27g-m4458",
"cat": "moria-uu-canules",
"sort": 11,
"fr": {
"nom": "Canules Backflush (23G / 25G / 27G)",
"description": "Canules Backflush à usage unique, disponibles en 23G, 25G et 27G avec bout silicone, bout brosse ou bout mousse. Gamme usage unique MORIA.",
"fiche_technique": "Référence : M4458\nRéférences : M4458, M4459, M4478, M4456, M4449, M4477, M4486\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Sterimedix\nM4458 – 23G, bout silicone\nM4459 – 23G, bout brosse\nM4478 – 23G, bout mousse\nM4456 – 25G, bout silicone\nM4449 – 25G, bout brosse\nM4477 – 25G, bout mousse\nM4486 – 27G, bout mousse"
},
"en": {
"nom": "Backflush cannulas (23G / 25G / 27G)",
"description": "Single-use backflush cannulas, available in 23G, 25G and 27G with silicone, brush or blunt tip. MORIA single-use range.",
"fiche_technique": "Reference: M4458\nReferences: M4458, M4459, M4478, M4456, M4449, M4477, M4486\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Sterimedix\nM4458 – 23G, silicone tip\nM4459 – 23G, brush tip\nM4478 – 23G, blunt tip\nM4456 – 25G, silicone tip\nM4449 – 25G\nM4477 – 25G, blunt tip\nM4486 – 27G, blunt tip"
},
"img": "/uploads/products/moria-uu-m4458.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000071",
"new": true,
"ref": "30601",
"slug": "moria-uu-tampons-absorbants-avec-manches-steriles-30601",
"cat": "moria-uu-canules",
"sort": 12,
"fr": {
"nom": "Tampons absorbants avec manches, stériles",
"description": "Tampons absorbants (micro-éponges) avec manches, stériles, pointe émoussée. Boîte de 20 sachets de 10 unités. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 30601\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Kettenbach\n30601 – Boîte de 20 sachets de 10 unités"
},
"en": {
"nom": "Absorbent pads with sleeves, sterile",
"description": "Absorbent pads (micro-sponges) with sleeves, sterile, blunt tip. Box of 20 bags of 10 units. MORIA single-use range.",
"fiche_technique": "Reference: 30601\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Kettenbach\n30601 – Box of 20 bags of 10 units"
},
"img": "/uploads/products/moria-uu-30601.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000072",
"new": true,
"ref": "30761",
"slug": "moria-uu-tampons-absorbants-cuneiformes-non-steriles-30761",
"cat": "moria-uu-canules",
"sort": 13,
"fr": {
"nom": "Tampons absorbants cunéiformes, non stériles",
"description": "Tampons absorbants (micro-éponges), non stériles, cunéiformes. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 30761\nFamille : Canules et micro-éponges\nGamme : instrumentation à usage unique MORIA\nMarque indiquée au catalogue : Kettenbach\n30761 – Non stériles, cunéiformes"
},
"en": {
"nom": "Absorbent pads, non-sterile, cuneiform",
"description": "Absorbent pads (micro-sponges), non-sterile, cuneiform. MORIA single-use range.",
"fiche_technique": "Reference: 30761\nFamily: Cannulas and micro-sponges\nRange: MORIA single-use instrumentation\nBrand shown in the catalogue: Kettenbach\n30761 – Non-sterile, cuneiform"
},
"img": "/uploads/products/moria-uu-30761.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000073",
"new": true,
"ref": "EASYSET-CATARACTE",
"slug": "moria-uu-kits-easyset-cataracte-easyset-cataracte",
"cat": "moria-uu-kits",
"sort": 1,
"fr": {
"nom": "Kits EasySet Cataracte",
"description": "Sets cataracte livrés en blister stérile, d'une composition comprise entre 3 et 7 instruments à usage unique des gammes One et One Steel : jusqu'à 1 blépharostat, 2 manipulateurs, 3 pinces et 1 paire de ciseaux à champ. Ouverture du sachet et du blister d'un doigt, instruments immédiatement prêts à l'emploi et maintenus dans leurs emplacements dédiés sur un plateau compact. 35 compositions au catalogue (boîtes de 10 sets), détaillées dans la fiche technique. Gamme usage unique MORIA.",
"fiche_technique": "Référence : EASYSET-CATARACTE\nRéférences : 5001X10, 5101X10, 5102X10, 52107X10, 52110X10, 52111X10, 52112X10, 52113X10, 52114X10, 52115X10, 52116X10, 52117X10, 52118X10, 52119X10, 52120X10, 52121X10, 52122X10, 52123X10, 52124X10, 52125X10, 52126X10, 52127X10, 52128X10, 52129X10, 52130X10, 52131X10, 52132X10, 52133X10, 52134X10, 52135X10, 52136X10, 52139X10, 52140X10, 52142X10, 52151X10\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA\n5001 X10 (4 instruments) : 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17223 manipulateur de Sinskey\n5101 X10 (5 instruments) : 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17247 pince monofilament courbe, 17223 manipulateur de Sinskey\n5102 X10 (6 instruments) : 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17230 manipulateur de cristallin, 17247 pince monofilament courbe, 17223 manipulateur de Sinskey\n52107 X10 (4 instruments) : 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17228 manipulateur de Lester\n52110 X10 (4 instruments) : 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17223 manipulateur de Sinskey\n52111 X10 (4 instruments) : 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin\n52112 X10 (4 instruments) : 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17223 manipulateur de Sinskey\n52113 X10 (4 instruments) : 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin\n52114 X10 (5 instruments) : 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17225 pince monofilament courbe, 17228 manipulateur de Lester\n52115 X10 (5 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17237 pince capsulorhexis courbe 90°, 17247 pince monofilament courbe, 17228 manipulateur de Lester\n52116 X10 (5 instruments) : 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin, 17223 manipulateur de Sinskey\n52117 X10 (5 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin\n52118 X10 (6 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17225 pince monofilament courbe, 17228 manipulateur de Lester\n52119 X10 (5 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17237 pince capsulorhexis courbe 90°, 17247 pince monofilament courbe, 17228 manipulateur de Lester\n52120 X10 (5 instruments) : 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin, 17501 pince monofilament courbe\n52121 X10 (5 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17223 manipulateur de Sinskey\n52122 X10 (5 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17505 pince de Bonn courbe, 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin\n52123 X10 (6 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin, 17223 manipulateur de Sinskey\n52124 X10 (6 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17233 pince monofilament coudée Mc Pherson, 17223 manipulateur de Sinskey\n52125 X10 (6 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17230 manipulateur de cristallin, 17233 pince monofilament coudée Mc Pherson\n52126 X10 (5 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17502 pince capsulorhexis droite 90°, 17501 pince monofilament courbe\n52127 X10 (6 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17221 pince de Bonn droite (3,7 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17225 pince monofilament courbe, 17223 manipulateur de Sinskey\n52128 X10 (7 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17252 pince capsulorhexis courbe 45°, 17229 manipulateur phaco chopper, 17225 pince monofilament courbe, 17223 manipulateur de Sinskey\n52129 X10 (6 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17225 pince monofilament courbe, 17223 manipulateur de Sinskey\n52130 X10 (6 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17502 pince capsulorhexis droite 90°, 17225 pince monofilament courbe, 17223 manipulateur de Sinskey\n52131 X10 (7 instruments) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17221 pince de Bonn droite (3,7 mm), 17252 pince capsulorhexis courbe 45°, 17229 manipulateur phaco chopper, 17225 pince monofilament courbe, 17223 manipulateur de Sinskey\n52132 X10 (6 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17230 manipulateur de cristallin, 17247 pince monofilament courbe\n52133 X10 (6 instruments) : 17507 ciseaux mousses, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17230 manipulateur de cristallin, 17247 pince monofilament courbe\n52134 X10 (4 instruments) : 17508 blépharostat réglable, 17237 pince capsulorhexis courbe 90°, 17242 manipulateur de Drysdale, 17222 pince monofilament droite\n52135 X10 (5 instruments) : 17507 ciseaux mousses, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17223 manipulateur de Sinskey\n52136 X10 (7 instruments) : 17506 ciseaux pointus, 17227 blépharostat à fil de Kratz, 17221 pince de Bonn droite (3,7 mm), 17237 pince capsulorhexis courbe 90°, 17230 manipulateur de cristallin, 17233 pince monofilament coudée Mc Pherson, 17223 manipulateur de Sinskey\n52139 X10 (5 instruments) : 17227 blépharostat à fil de Kratz, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17230 manipulateur de cristallin, 17501 pince monofilament courbe\n52140 X10 (4 instruments – FDA uniquement) : 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17252 pince capsulorhexis courbe 45°, 17229 manipulateur phaco chopper\n52142 X10 (5 instruments – FDA uniquement) : 17506 ciseaux pointus, 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17500 pince monofilament coudée Mc Pherson\n52151 X10 (7 instruments – FDA uniquement) : 17507 ciseaux mousses, 17508 blépharostat réglable, 17504 pince de Bonn droite (5 mm), 17503 pince capsulorhexis courbe 90° type Corydon, 17229 manipulateur phaco chopper, 17223 manipulateur de Sinskey, 17544 spatule de Koch courbe"
},
"en": {
"nom": "EasySet Cataract kits",
"description": "Cataract sets delivered in sterile blister packs containing a range of 3 to 7 single-use instruments from the One and One Steel ranges: up to 3 forceps, 2 manipulators, 1 speculum and 1 pair of scissors. One-finger blister pack opening, instruments immediately ready for use and held in their dedicated locations in a compact tray. 35 compositions in the catalogue (boxes of 10 sets), detailed in the technical sheet. MORIA single-use range.",
"fiche_technique": "Reference: EASYSET-CATARACTE\nReferences: 5001X10, 5101X10, 5102X10, 52107X10, 52110X10, 52111X10, 52112X10, 52113X10, 52114X10, 52115X10, 52116X10, 52117X10, 52118X10, 52119X10, 52120X10, 52121X10, 52122X10, 52123X10, 52124X10, 52125X10, 52126X10, 52127X10, 52128X10, 52129X10, 52130X10, 52131X10, 52132X10, 52133X10, 52134X10, 52135X10, 52136X10, 52139X10, 52140X10, 52142X10, 52151X10\nFamily: Procedure kits\nRange: MORIA single-use instrumentation\n5001 X10 (4 instruments): 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17223 Sinskey IOL manipulator\n5101 X10 (5 instruments): 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17247 tying forceps curved, 17223 Sinskey IOL manipulator\n5102 X10 (6 instruments): 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17230 lens manipulator, 17247 tying forceps curved, 17223 Sinskey IOL manipulator\n52107 X10 (4 instruments): 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17228 Lester IOL manipulator\n52110 X10 (4 instruments): 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17223 Sinskey IOL manipulator\n52111 X10 (4 instruments): 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator\n52112 X10 (4 instruments): 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17223 Sinskey IOL manipulator\n52113 X10 (4 instruments): 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator\n52114 X10 (5 instruments): 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17225 tying forceps curved, 17228 Lester IOL manipulator\n52115 X10 (5 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17237 capsulorhexis forceps curved 90°, 17247 tying forceps curved, 17228 Lester IOL manipulator\n52116 X10 (5 instruments): 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator, 17223 Sinskey IOL manipulator\n52117 X10 (5 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator\n52118 X10 (6 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17225 tying forceps curved, 17228 Lester IOL manipulator\n52119 X10 (5 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17237 capsulorhexis forceps curved 90°, 17247 tying forceps curved, 17228 Lester IOL manipulator\n52120 X10 (5 instruments): 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator, 17501 tying forceps curved\n52121 X10 (5 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17223 Sinskey IOL manipulator\n52122 X10 (5 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17505 Bonn forceps curved, 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator\n52123 X10 (6 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator, 17223 Sinskey IOL manipulator\n52124 X10 (6 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17233 Mc Pherson tying forceps angled, 17223 Sinskey IOL manipulator\n52125 X10 (6 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17230 lens manipulator, 17233 Mc Pherson tying forceps angled\n52126 X10 (5 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17502 capsulorhexis forceps straight 90°, 17501 tying forceps curved\n52127 X10 (6 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17221 Bonn forceps straight (3.7 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17225 tying forceps curved, 17223 Sinskey IOL manipulator\n52128 X10 (7 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17252 capsulorhexis forceps curved 45°, 17229 lens manipulator phaco chopper, 17225 tying forceps curved, 17223 Sinskey IOL manipulator\n52129 X10 (6 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17225 tying forceps curved, 17223 Sinskey IOL manipulator\n52130 X10 (6 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17502 capsulorhexis forceps straight 90°, 17225 tying forceps curved, 17223 Sinskey IOL manipulator\n52131 X10 (7 instruments): 17506 sharp scissors, 17508 adjustable speculum, 17221 Bonn forceps straight (3.7 mm), 17252 capsulorhexis forceps curved 45°, 17229 lens manipulator phaco chopper, 17225 tying forceps curved, 17223 Sinskey IOL manipulator\n52132 X10 (6 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17230 lens manipulator, 17247 tying forceps curved\n52133 X10 (6 instruments): 17507 blunt scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17230 lens manipulator, 17247 tying forceps curved\n52134 X10 (4 instruments): 17508 adjustable speculum, 17237 capsulorhexis forceps curved 90°, 17242 Drysdale lens manipulator, 17222 tying forceps straight\n52135 X10 (5 instruments): 17507 blunt scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17223 Sinskey IOL manipulator\n52136 X10 (7 instruments): 17506 sharp scissors, 17227 Kratz wire speculum, 17221 Bonn forceps straight (3.7 mm), 17237 capsulorhexis forceps curved 90°, 17230 lens manipulator, 17233 Mc Pherson tying forceps angled, 17223 Sinskey IOL manipulator\n52139 X10 (5 instruments): 17227 Kratz wire speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17230 lens manipulator, 17501 tying forceps curved\n52140 X10 (4 instruments – FDA only): 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17252 capsulorhexis forceps curved 45°, 17229 lens manipulator phaco chopper\n52142 X10 (5 instruments – FDA only): 17506 sharp scissors, 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17500 Mc Pherson tying forceps angled\n52151 X10 (7 instruments – FDA only): 17507 blunt scissors, 17508 adjustable speculum, 17504 Bonn forceps straight (5 mm), 17503 capsulorhexis forceps curved 90° Corydon type, 17229 lens manipulator phaco chopper, 17223 Sinskey IOL manipulator, 17544 Koch spatula curved"
},
"img": "/uploads/products/moria-uu-easyset-cataracte.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000074",
"new": true,
"ref": "17210",
"slug": "moria-uu-kit-rop-blepharostat-a-oreilles-solides-et-depresseur-a-double-extremite-17210",
"cat": "moria-uu-kits",
"sort": 2,
"fr": {
"nom": "Kit ROP : blépharostat à oreilles solides et dépresseur à double extrémité",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Blépharostat à oreilles solides : petites oreilles solides qui limitent le contact avec les cils pendant l'examen ; design optimal pour une insertion facile entre les paupières ; taille et flexion appropriées pour les prématurés ; profil bas compatible avec l'imagerie oculaire pédiatrique. Dépresseur à double extrémité (4 orientations possibles). Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17210\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA"
},
"en": {
"nom": "ROP kit: solid blades speculum and double-ended depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Solid blades speculum: solid small blades that limit contact with eyelashes during exam; optimal design for easy insertion between eyelids; appropriate size and flex characteristics for premature infants; low profile that can be used with pediatric eye imaging. Double-ended depressor (4 distinct orientations). MORIA single-use range.",
"fiche_technique": "Reference: 17210\nFamily: Procedure kits\nRange: MORIA single-use instrumentation"
},
"img": "/uploads/products/moria-uu-17210.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000075",
"new": true,
"ref": "17255X20",
"slug": "moria-uu-kit-rop-blepharostat-a-oreilles-solides-et-depresseur-a-anse-17255x20",
"cat": "moria-uu-kits",
"sort": 3,
"fr": {
"nom": "Kit ROP : blépharostat à oreilles solides et dépresseur à anse",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Blépharostat à oreilles solides : petites oreilles solides qui limitent le contact avec les cils pendant l'examen ; design optimal pour une insertion facile entre les paupières ; taille et flexion appropriées pour les prématurés ; profil bas compatible avec l'imagerie oculaire pédiatrique. Dépresseur à anse. Boîte de 20. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17255X20\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 20"
},
"en": {
"nom": "ROP kit: solid blades speculum and loop depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Solid blades speculum: solid small blades that limit contact with eyelashes during exam; optimal design for easy insertion between eyelids; appropriate size and flex characteristics for premature infants; low profile that can be used with pediatric eye imaging. Loop depressor. Box of 20. MORIA single-use range.",
"fiche_technique": "Reference: 17255X20\nFamily: Procedure kits\nRange: MORIA single-use instrumentation\nPackaging: box of 20"
},
"img": "/uploads/products/moria-uu-17255x20.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000076",
"new": true,
"ref": "17262X10",
"slug": "moria-uu-kit-rop-petit-blepharostat-pediatrique-a-fil-et-depresseur-a-double-extremite-172",
"cat": "moria-uu-kits",
"sort": 4,
"fr": {
"nom": "Kit ROP : petit blépharostat pédiatrique à fil et dépresseur à double extrémité",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Petit blépharostat pédiatrique à fil (oreilles de 4,1 mm) et dépresseur à double extrémité. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17262X10\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "ROP kit: small neonatal speculum and double-ended depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Small neonatal speculum (4.1-mm wire blades) and double-ended depressor. MORIA single-use range.",
"fiche_technique": "Reference: 17262X10\nFamily: Procedure kits\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17262x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000077",
"new": true,
"ref": "17264X10",
"slug": "moria-uu-kit-rop-petit-blepharostat-pediatrique-a-fil-et-depresseur-a-anse-17264x10",
"cat": "moria-uu-kits",
"sort": 5,
"fr": {
"nom": "Kit ROP : petit blépharostat pédiatrique à fil et dépresseur à anse",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Petit blépharostat pédiatrique à fil (oreilles de 4,1 mm) et dépresseur à anse. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17264X10\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "ROP kit: small neonatal speculum and loop depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Small neonatal speculum (4.1-mm wire blades) and loop depressor. MORIA single-use range.",
"fiche_technique": "Reference: 17264X10\nFamily: Procedure kits\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17264x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000078",
"new": true,
"ref": "17263X10",
"slug": "moria-uu-kit-rop-blepharostat-a-fil-avec-plateaux-et-depresseur-a-double-extremite-17263x1",
"cat": "moria-uu-kits",
"sort": 6,
"fr": {
"nom": "Kit ROP : blépharostat à fil avec plateaux et dépresseur à double extrémité",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Blépharostat pédiatrique à fil avec plateaux (oreilles de 6 et 9 mm) et dépresseur à double extrémité. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17263X10\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA\nConditionnement : boîte de 10"
},
"en": {
"nom": "ROP kit: pediatric wire speculum with tabs and double-ended depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Pediatric wire speculum with tabs (6- and 9-mm blades) and double-ended depressor. MORIA single-use range.",
"fiche_technique": "Reference: 17263X10\nFamily: Procedure kits\nRange: MORIA single-use instrumentation\nPackaging: box of 10"
},
"img": "/uploads/products/moria-uu-17263x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
},
{
"id": "d80a0001-0000-4000-8000-000000000079",
"new": true,
"ref": "17257X10",
"slug": "moria-uu-kit-rop-blepharostat-a-fil-avec-plateaux-et-depresseur-a-anse-17257x10",
"cat": "moria-uu-kits",
"sort": 7,
"fr": {
"nom": "Kit ROP : blépharostat à fil avec plateaux et dépresseur à anse",
"description": "Kit ROP (rétinopathie du prématuré) à usage unique. Blépharostat pédiatrique à fil avec plateaux (oreilles de 6 et 9 mm) et dépresseur à anse. 17257X10 : vendu en plateau rigide ; 17265X10 : emballage plus compact avec moins de plastique. Gamme usage unique MORIA.",
"fiche_technique": "Référence : 17257X10\nRéférences : 17257X10, 17265X10\nFamille : Kits de procédure\nGamme : instrumentation à usage unique MORIA"
},
"en": {
"nom": "ROP kit: pediatric wire speculum with tabs and loop depressor",
"description": "Single-use ROP (retinopathy of prematurity) kit. Pediatric wire speculum with tabs (6- and 9-mm blades) and loop depressor. 17257X10: sold in stable tray; 17265X10: compact packaging with less plastic. MORIA single-use range.",
"fiche_technique": "Reference: 17257X10\nReferences: 17257X10, 17265X10\nFamily: Procedure kits\nRange: MORIA single-use instrumentation"
},
"img": "/uploads/products/moria-uu-17257x10.jpg",
"pdf": "/uploads/pdfs/moria-catalogue-usage-unique-67040INT-A.pdf"
}
],
"archive": [
"a9793fe2-4a94-4d8e-8f43-37cfad46c654"
],
"partnerPdf": "/uploads/pdfs/moria-catalogue-reutilisable-67047INT-F.pdf"
};

const exists = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));
const same = (a, b) => (a ?? null) === (b ?? null);

async function snapshot() {
  if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists, refusing to overwrite`);
  const products = await prisma.products.findMany({
    where: { OR: [{ partner_id: MORIA }, { constructeur: { equals: "moria", mode: "insensitive" } }] },
    include: { product_translations: true, product_media: true }, orderBy: { id: "asc" } });
  const partner = await prisma.partners.findUnique({ where: { id: MORIA } });
  const out = { taken_at: new Date().toISOString(), partner, products: {} };
  for (const p of products) { const { product_translations, product_media, ...row } = p; out.products[p.id] = { row, translations: product_translations, media: product_media }; }
  fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 1));
  console.log(`snapshot: ${products.length} products + partner -> ${BEFORE_FILE}`);
}

async function apply() {
  const slugId = {};
  for (const s of ["instrumentation", "consommable"]) slugId[s] = (await prisma.categories.findUnique({ where: { slug: s } })).id;
  for (const c of DATA.cats) slugId[c.slug] = c.id;
  const parentType = (await prisma.categories.findUnique({ where: { slug: "instrumentation" } })).type;
  for (const c of DATA.cats) {
    if (!exists(c.image)) console.log(`  [MISSING FILE] ${c.image}`);
    const row = await prisma.categories.findUnique({ where: { id: c.id }, include: { category_translations: true } });
    const tr = [{ language_code: "fr", name: c.fr, description: c.dfr }, { language_code: "en", name: c.en, description: c.den }];
    if (!row) {
      console.log(`  + category ${c.slug} « ${c.fr} » under ${c.parent} (sort ${c.sort})`);
      if (WRITE) await prisma.categories.create({ data: { id: c.id, slug: c.slug, name: c.fr, description: c.dfr, parent_id: slugId[c.parent],
        sort_order: c.sort, is_active: true, type: parentType, image_url: c.image, updated_at: now(),
        category_translations: { create: tr.map((t) => ({ id: `${c.id}-${t.language_code}`, ...t })) } } });
      continue;
    }
    const data = {};
    if (row.parent_id !== slugId[c.parent]) data.parent_id = slugId[c.parent];
    if (row.sort_order !== c.sort) data.sort_order = c.sort;
    if (row.image_url !== c.image) data.image_url = c.image;
    if (!row.is_active) data.is_active = true;
    if (row.name !== c.fr) data.name = c.fr;
    const trBad = tr.filter((t) => { const x = row.category_translations.find((y) => y.language_code === t.language_code); return !x || x.name !== t.name || !same(x.description, t.description); });
    if (!Object.keys(data).length && !trBad.length) { console.log(`  [SKIP] category ${c.slug}`); continue; }
    console.log(`  category ${c.slug} ${JSON.stringify(data)}${trBad.length ? " texts" : ""}`);
    if (WRITE) {
      if (Object.keys(data).length) await prisma.categories.update({ where: { id: c.id }, data: { ...data, updated_at: now() } });
      for (const t of trBad) await prisma.category_translations.upsert({ where: { category_id_language_code: { category_id: c.id, language_code: t.language_code } },
        update: { name: t.name, description: t.description }, create: { id: `${c.id}-${t.language_code}`, category_id: c.id, ...t } });
    }
  }

  const counts = { created: 0, updated: 0, skipped: 0 };
  for (const p of DATA.products) {
    for (const f of [p.img, p.pdf]) if (f && !exists(f)) console.log(`  [MISSING FILE] ${f}`);
    const row = await prisma.products.findUnique({ where: { id: p.id }, include: { product_translations: true, product_media: true } });
    const media = p.img ? { id: `${p.id}-m80`, type: "image", url: p.img, alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true } : null;
    if (!row) {
      if (!p.new) { console.log(`  [MISSING PRODUCT] ${p.id} ${p.ref}`); continue; }
      counts.created++;
      console.log(`  + product ${p.slug} [${p.ref}] -> ${p.cat}`);
      if (WRITE) await prisma.products.create({ data: {
        id: p.id, reference_fournisseur: p.ref, slug: p.slug, category_id: slugId[p.cat], constructeur: "MORIA", partner_id: MORIA,
        status: "active", sort_order: p.sort, pdf_brochure_url: p.pdf, updated_at: now(),
        product_translations: { create: ["fr", "en"].map((lang) => ({ id: `${p.id}-${lang}`, language_code: lang, ...p[lang] })) },
        product_media: { create: [media] } } });
      continue;
    }
    const data = {};
    if (row.category_id !== slugId[p.cat]) data.category_id = slugId[p.cat];
    if (row.status !== "active") data.status = "active";
    if (row.sort_order !== p.sort) data.sort_order = p.sort;
    if (row.pdf_brochure_url !== p.pdf) data.pdf_brochure_url = p.pdf;
    if (row.partner_id !== MORIA) data.partner_id = MORIA;
    if (row.constructeur !== "MORIA") data.constructeur = "MORIA";
    const tr = ["fr", "en"].filter((lang) => { const t = row.product_translations.find((x) => x.language_code === lang);
      return !t || ["nom", "description", "fiche_technique"].some((k) => !same(t[k], p[lang][k])); });
    const mediaOk = media ? (row.product_media.length === 1 && row.product_media[0].url === media.url && row.product_media[0].is_primary)
      : (row.product_media.length > 0 && row.product_media.some((m) => m.is_primary) && row.product_media.every((m) => exists(m.url)));
    if (!media && !mediaOk) console.log(`  [WARN] ${p.ref} has no usable photo`);
    if (!Object.keys(data).length && !tr.length && (mediaOk || !media)) { counts.skipped++; continue; }
    counts.updated++;
    const fr = row.product_translations.find((x) => x.language_code === "fr");
    console.log(`  product [${p.ref}] « ${(fr?.nom || "").trim()} » -> « ${p.fr.nom} » ${JSON.stringify(data)}${tr.length ? " texts:" + tr.join("+") : ""}${media && !mediaOk ? ` photo ${media.url}` : ""}`);
    if (!WRITE) continue;
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length) await tx.products.update({ where: { id: p.id }, data: { ...data, updated_at: now() } });
      for (const lang of tr) await tx.product_translations.upsert({ where: { product_id_language_code: { product_id: p.id, language_code: lang } },
        update: p[lang], create: { id: crypto.randomUUID(), product_id: p.id, language_code: lang, ...p[lang] } });
      if (media && !mediaOk) {
        await tx.product_media.deleteMany({ where: { product_id: p.id } });
        await tx.product_media.create({ data: { ...media, product_id: p.id } });
      }
    });
  }
  console.log(`  products: ${counts.created} new, ${counts.updated} to update, ${counts.skipped} unchanged`);

  for (const id of DATA.archive) {
    const row = await prisma.products.findUnique({ where: { id } });
    if (!row || row.status === "archived") continue;
    console.log(`  archive ${row.slug} [${row.reference_fournisseur}]`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: "archived", updated_at: now() } });
  }

  const partner = await prisma.partners.findUnique({ where: { id: MORIA } });
  if (partner.default_pdf_url !== DATA.partnerPdf || partner.status !== "active") {
    console.log(`  partner MORIA default_pdf_url -> ${DATA.partnerPdf}`);
    if (WRITE) await prisma.partners.update({ where: { id: MORIA }, data: { default_pdf_url: DATA.partnerPdf, status: "active", updated_at: now() } });
  }
}

async function revert() {
  for (const [id, b] of Object.entries(BEFORE.products)) {
    const { id: _id, created_at, ...row } = b.row;
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
  console.log(`  restored ${Object.keys(BEFORE.products).length} products`);
  const n = await prisma.products.deleteMany({ where: { id: { in: DATA.products.filter((p) => p.new && !BEFORE.products[p.id]).map((p) => p.id) } } });
  console.log(`  - deleted ${n.count} new products`);
  const { id, created_at, ...prow } = BEFORE.partner;
  await prisma.partners.update({ where: { id }, data: { ...prow, updated_at: now() } });
  for (const c of [...DATA.cats].reverse()) {
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
