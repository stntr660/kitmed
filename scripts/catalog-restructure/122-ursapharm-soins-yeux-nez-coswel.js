const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-20 -- owner:
 *  - add 7 URSAPHARM products with the owner's French texts (English written for EN) and photos:
 *      Collyres:                 HYLO PARIN (the archived product is re-activated and rewritten)
 *      Compléments et solutions: POSIFORLID lingettes, POSIFORLID spray 15 ml, RETARON, VitA POS
 *      new sub-category « Dispositifs médicaux nasaux » (under Dispositifs médicaux):
 *                                VitA Nasal, HYLO Nasal 20 ml
 *  - COSWEL (« Causewell ») page showed no product although it supplies ISOMAX: the ISOMAX saline
 *    solution moves to COSWEL (its sheet already says « Euritalia Pharma, div. of Coswell »), so COSWEL
 *    shows that product and appears under the « Dispositifs médicaux » domain on Partenaires.
 *    COSWEL description rewritten (it was a generic placeholder).
 * Images (copied into the staging uploads volume before --apply):
 *   /uploads/products/q122-<slug>.jpg, /uploads/categories/q122-dispositifs-nasaux.jpg
 *
 * REVERT POINT: --apply writes 122-before.json (HYLO PARIN, ISOMAX and COSWEL rows as they were);
 * --revert restores them and deletes the 6 new products and the new sub-category.
 *
 *   docker cp 122-ursapharm-soins-yeux-nez-coswel.js <app>:/tmp/122.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/122.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/122.js --apply
 *   docker cp <app>:/tmp/122-before.json scripts/catalog-restructure/
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/122.js --revert   # needs /tmp/122-before.json
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE = path.join(__dirname, "122-before.json");
const now = () => new Date();

const URSAPHARM = "b9e72a4c-fb4c-4171-968e-2b160284881d";
const COSWEL = "4e3f96da-da99-499f-a44a-32facfaa9c3e";
const DM = "oph-pharmaceutics"; // « Dispositifs médicaux »
const COLLYRES = "d119c001-0000-4000-8000-000000000001";
const COMPLEMENTS = "d119c001-0000-4000-8000-000000000002";
const NASAL = { id: "d122c001-0000-4000-8000-000000000001", slug: "dispositifs-medicaux-nasaux", sort: 3,
  fr: "Dispositifs médicaux nasaux", en: "Nasal medical devices",
  dfr: "Soins de la muqueuse nasale : sprays et baumes hydratants et réparateurs",
  den: "Nasal mucosa care: moisturising and repairing sprays and balms",
  image: "/uploads/categories/q122-dispositifs-nasaux.jpg" };

const HYLO_PARIN_ID = "89525782-89c0-46cd-927d-e9b83c0d6e17";
const ISOMAX_SLUG = "isomax-saline-solution";

const P = [
  {
    id: HYLO_PARIN_ID, existing: true, slug: "hylo-parin", ref: "HYLO-PARIN", category: COLLYRES, sort: 6,
    fr: {
      nom: "HYLO PARIN® – Collyre hydratant à l'acide hyaluronique et à l'héparine",
      description:
`Hydratation, protection et régénération de la surface oculaire.

La sécheresse oculaire peut fragiliser la surface de l'œil et provoquer des sensations d'inconfort : rougeurs, brûlures, démangeaisons ou impression de corps étranger. Lorsque le film lacrymal ne joue plus pleinement son rôle protecteur, la cornée et la conjonctive deviennent plus sensibles aux agressions extérieures.

HYLO PARIN® apporte une réponse adaptée grâce à sa double action hydratante et protectrice. Sa formule contribue à restaurer le confort oculaire, à maintenir une hydratation durable et à favoriser les mécanismes naturels de régénération de la surface de l'œil.

L'acide hyaluronique (0,1 %) retient l'eau et forme un film hydratant stable à la surface de l'œil, pour une lubrification prolongée et une meilleure protection contre les irritations. L'héparine complète cette action en favorisant l'hydratation et en accompagnant la régénération naturelle de la cornée et de la conjonctive fragilisées.

HYLO PARIN® – L'alliance de l'hydratation et de la protection pour retrouver le confort de vos yeux.`,
      fiche:
`Référence : HYLO PARIN
Fabricant : URSAPHARM (Allemagne)
Type : collyre hydratant
Composition : acide hyaluronique 0,1 % et héparine
Avantages : hydratation durable de la surface oculaire ; soulagement des sensations d'irritation et de sécheresse ; protection de la cornée et de la conjonctive
Conservateurs : sans conservateurs ni phosphates
Lentilles de contact : compatible
Conditionnement : flacon de 10 ml (au moins 300 gouttes)
Durée d'utilisation après ouverture : 6 mois`,
    },
    en: {
      nom: "HYLO PARIN® – Moisturising eye drops with hyaluronic acid and heparin",
      description:
`Hydration, protection and regeneration of the ocular surface.

Dry eye can weaken the surface of the eye and cause discomfort: redness, burning, itching or a foreign-body sensation. When the tear film no longer fully protects the eye, the cornea and conjunctiva become more sensitive to external aggressions.

HYLO PARIN® offers a suitable answer with its dual moisturising and protective action. Its formula helps restore eye comfort, keeps the eye hydrated for longer and supports the natural regeneration of the ocular surface.

Hyaluronic acid (0.1%) holds water and forms a stable moisturising film on the eye, for long-lasting lubrication and better protection against irritation. Heparin completes this action by supporting hydration and the natural regeneration of a weakened cornea and conjunctiva.

HYLO PARIN® – hydration and protection together, for comfortable eyes again.`,
      fiche:
`Reference: HYLO PARIN
Manufacturer: URSAPHARM (Germany)
Type: moisturising eye drops
Composition: 0.1% hyaluronic acid and heparin
Benefits: long-lasting hydration of the ocular surface; relief of irritation and dryness; protection of the cornea and conjunctiva
Preservatives: preservative-free and phosphate-free
Contact lenses: compatible
Pack: 10 ml bottle (at least 300 drops)
Use after opening: 6 months`,
    },
    image: "/uploads/products/q122-hylo-parin.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000001", slug: "posiforlid-lingettes-hygiene-paupieres", ref: "POSIFORLID-LINGETTES",
    category: COMPLEMENTS, sort: 3,
    fr: {
      nom: "POSIFORLID® – Lingettes pour l'hygiène des paupières",
      description:
`La douceur au service de votre hygiène oculaire.

Les lingettes POSIFORLID® sont spécialement conçues pour nettoyer en douceur la peau sensible des paupières et éliminer délicatement les dépôts accumulés sur les paupières et entre les cils.

Leur formule associe l'acide hyaluronique, la prêle et l'euphraise (Euphrasia) pour accompagner l'hygiène quotidienne des paupières, tout en respectant leur sensibilité.

Une hygiène régulière des paupières contribue à préserver le bon fonctionnement des glandes de Meibomius, essentielles à l'équilibre du film lacrymal.

POSIFORLID® : un geste de douceur au quotidien pour prendre soin de vos paupières.`,
      fiche:
`Référence : POSIFORLID lingettes
Fabricant : URSAPHARM (Allemagne)
Type : lingettes pour l'hygiène des paupières
Composition : acide hyaluronique, prêle, euphraise (Euphrasia)
Formule : sans conservateurs ni parfums ajoutés
Atouts : nettoyage doux des paupières et des cils ; testées dermatologiquement ; pratiques à domicile, en déplacement ou en voyage
Âge : dès 3 mois, selon les indications du fabricant
Utilisation : matin et soir, conformément à la notice`,
    },
    en: {
      nom: "POSIFORLID® – Eyelid hygiene wipes",
      description:
`Gentle care for your eyelid hygiene.

POSIFORLID® wipes are designed to gently clean the sensitive skin of the eyelids and carefully remove deposits built up on the lids and between the lashes.

Their formula combines hyaluronic acid, horsetail and eyebright (Euphrasia) to support daily eyelid hygiene while respecting their sensitivity.

Regular eyelid hygiene helps keep the meibomian glands working well, which are essential to a balanced tear film.

POSIFORLID®: a gentle daily step to care for your eyelids.`,
      fiche:
`Reference: POSIFORLID wipes
Manufacturer: URSAPHARM (Germany)
Type: eyelid hygiene wipes
Composition: hyaluronic acid, horsetail, eyebright (Euphrasia)
Formula: no preservatives, no added fragrance
Benefits: gentle cleaning of eyelids and lashes; dermatologically tested; easy to use at home, on the move or when travelling
Age: from 3 months, as indicated by the manufacturer
Use: morning and evening, as described in the leaflet`,
    },
    image: "/uploads/products/q122-posiforlid-lingettes-hygiene-paupieres.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000002", slug: "posiforlid-spray-oculaire-15-ml", ref: "POSIFORLID-SPRAY-15",
    category: COMPLEMENTS, sort: 4,
    fr: {
      nom: "POSIFORLID® – Spray oculaire 15 ml",
      description:
`Douceur, fraîcheur et hygiène au quotidien pour vos paupières.

POSIFORLID® est un spray oculaire spécialement conçu pour nettoyer en douceur et apaiser les paupières sensibles ou irritées.

Grâce à sa formule associant Euphrasia, acide hyaluronique et acide salicylique, il contribue à une hygiène optimale des paupières tout en procurant une agréable sensation de confort et de fraîcheur.

Simple et pratique, POSIFORLID® s'intègre naturellement à votre routine d'hygiène oculaire. Il peut également compléter les soins des paupières après l'application de chaleur à l'aide d'un masque oculaire adapté.

POSIFORLID® : prenez soin de vos paupières, jour après jour.`,
      fiche:
`Référence : POSIFORLID spray oculaire 15 ml
Fabricant : URSAPHARM (Allemagne)
Type : spray pour l'hygiène des paupières
Composition : Euphrasia, acide hyaluronique, acide salicylique
Formule : sans parfum ajouté et sans conservateur
Atouts : action apaisante sur les paupières sensibles et irritées ; nettoyage en douceur du contour des yeux
Application : avec un coton ou par pulvérisation directe sur les paupières fermées
Utilisation : jusqu'à 4 fois par jour, selon les instructions d'utilisation
Durée d'utilisation après ouverture : 6 mois
Conditionnement : flacon de 15 ml (environ 250 pulvérisations)`,
    },
    en: {
      nom: "POSIFORLID® – Eyelid spray 15 ml",
      description:
`Gentle, refreshing daily hygiene for your eyelids.

POSIFORLID® is an eye spray designed to gently clean and soothe sensitive or irritated eyelids.

Its formula combines Euphrasia, hyaluronic acid and salicylic acid for optimal eyelid hygiene, with a pleasant feeling of comfort and freshness.

Simple and practical, POSIFORLID® fits easily into your eye hygiene routine. It can also follow eyelid care with warmth from a suitable eye mask.

POSIFORLID®: care for your eyelids, day after day.`,
      fiche:
`Reference: POSIFORLID eye spray 15 ml
Manufacturer: URSAPHARM (Germany)
Type: eyelid hygiene spray
Composition: Euphrasia, hyaluronic acid, salicylic acid
Formula: no added fragrance, preservative-free
Benefits: soothes sensitive and irritated eyelids; gentle cleaning around the eyes
Application: with a cotton pad or sprayed directly onto closed eyelids
Use: up to 4 times a day, following the instructions
Use after opening: 6 months
Pack: 15 ml bottle (about 250 sprays)`,
    },
    image: "/uploads/products/q122-posiforlid-spray-oculaire-15-ml.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000003", slug: "retaron", ref: "RETARON-90", category: COMPLEMENTS, sort: 5,
    fr: {
      nom: "RETARON® – Complément alimentaire pour la vision (90 gélules)",
      description:
`Vos yeux méritent le meilleur ! Préservez votre capital visuel, aujourd'hui et pour les années à venir.

Parce que nos yeux nous accompagnent à chaque instant de notre vie, prendre soin de sa vision est essentiel. Avec le temps, les besoins nutritionnels de nos yeux évoluent, et une alimentation apportant les nutriments essentiels contribue à préserver leur bon fonctionnement.

RETARON®, développé par les laboratoires allemands URSAPHARM, associe des vitamines, des minéraux, des antioxydants et des acides gras essentiels dans une formule spécialement conçue pour accompagner votre santé visuelle au quotidien.

Avec seulement une gélule par jour, RETARON® s'intègre facilement à votre routine. Son format de 90 gélules permet un programme nutritionnel de trois mois.

RETARON® – Parce que chaque regard compte.

Complément alimentaire à utiliser conformément à sa notice. Ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain.`,
      fiche:
`Référence : RETARON 90 gélules
Fabricant : URSAPHARM (Allemagne)
Type : complément alimentaire pour la vision
Zinc et oméga-3 (DHA) : contribuent au maintien d'une vision normale
Lutéine et zéaxanthine : pigments naturellement présents dans la macula
Vitamines C et E, sélénium : contribuent à protéger les cellules contre le stress oxydatif
Extrait de baies d'aronia : riche en composés végétaux antioxydants
Oméga-3 : DHA et EPA
Posologie : une gélule par jour
Conditionnement : boîte de 90 gélules (programme de 3 mois)`,
    },
    en: {
      nom: "RETARON® – Food supplement for vision (90 capsules)",
      description:
`Your eyes deserve the best! Protect your eyesight, today and for years to come.

Our eyes are with us at every moment of our lives, so caring for our vision matters. Over time the nutritional needs of the eyes change, and a diet that provides essential nutrients helps keep them working well.

RETARON®, developed by the German laboratory URSAPHARM, combines vitamins, minerals, antioxidants and essential fatty acids in a formula designed to support your eye health every day.

With just one capsule a day, RETARON® fits easily into your routine. The 90-capsule pack covers a three-month programme.

RETARON® – because every look counts.

Food supplement to be used as described in its leaflet. Does not replace a varied, balanced diet and a healthy lifestyle.`,
      fiche:
`Reference: RETARON 90 capsules
Manufacturer: URSAPHARM (Germany)
Type: food supplement for vision
Zinc and omega-3 (DHA): contribute to the maintenance of normal vision
Lutein and zeaxanthin: pigments naturally present in the macula
Vitamins C and E, selenium: help protect cells from oxidative stress
Aronia berry extract: rich in antioxidant plant compounds
Omega-3: DHA and EPA
Dosage: one capsule a day
Pack: box of 90 capsules (3-month programme)`,
    },
    image: "/uploads/products/q122-retaron.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000004", slug: "vita-pos", ref: "VITA-POS-5G", category: COMPLEMENTS, sort: 6,
    fr: {
      nom: "VitA POS® – Pommade ophtalmique à la vitamine A (5 g)",
      description:
`Le soin de nuit qui veille sur vos yeux. Offrez à vos yeux une nuit de douceur et de protection.

Vos yeux sont secs, fatigués ou irrités ? Sensations de brûlure, picotements ou inconfort au réveil peuvent être les signes d'une sécheresse oculaire.

VitA POS®, pommade ophtalmique enrichie en vitamine A, offre une protection prolongée de la surface oculaire et contribue à préserver l'équilibre naturel du film lacrymal. Sa texture onctueuse forme un film protecteur qui aide à limiter le dessèchement de l'œil, particulièrement pendant la nuit, lorsque la production naturelle de larmes diminue.

Particulièrement adaptée à une application avant le coucher, VitA POS® accompagne vos yeux pendant la nuit et contribue à réduire les sensations de sécheresse au réveil.

VitA POS® – Prenez soin de vos yeux pendant votre sommeil, pour des réveils tout en douceur.

Dispositif médical. Lire attentivement la notice avant utilisation. La pommade peut provoquer un flou visuel temporaire après application.`,
      fiche:
`Référence : VitA POS 5 g
Fabricant : URSAPHARM (Allemagne)
Type : pommade ophtalmique
Composition : vitamine A (250 UI/g)
Actions : hydrate et lubrifie durablement la surface de l'œil ; apaise l'inconfort lié à la sécheresse ; protège la cornée et la conjonctive ; améliore la stabilité du film lacrymal ; limite l'adhérence des paupières au réveil
Conservateurs : sans agents conservateurs, sans phosphates
Utilisation : particulièrement adaptée la nuit, avant le coucher
Conditionnement : tube de 5 g
Durée d'utilisation après ouverture : 6 mois
Statut : dispositif médical`,
    },
    en: {
      nom: "VitA POS® – Eye ointment with vitamin A (5 g)",
      description:
`The night-time care that looks after your eyes. Give your eyes a gentle, protected night.

Are your eyes dry, tired or irritated? Burning, stinging or discomfort on waking can be signs of dry eye.

VitA POS®, an eye ointment enriched with vitamin A, gives long-lasting protection to the ocular surface and helps keep the tear film naturally balanced. Its smooth texture forms a protective film that limits drying of the eye, especially at night when natural tear production drops.

Especially suited to use before bedtime, VitA POS® looks after your eyes through the night and helps reduce dryness on waking.

VitA POS® – care for your eyes while you sleep, for gentle mornings.

Medical device. Read the leaflet carefully before use. The ointment may cause temporary blurred vision after application.`,
      fiche:
`Reference: VitA POS 5 g
Manufacturer: URSAPHARM (Germany)
Type: eye ointment
Composition: vitamin A (250 IU/g)
Actions: long-lasting hydration and lubrication of the eye surface; soothes dryness discomfort; protects the cornea and conjunctiva; improves tear film stability; limits eyelids sticking on waking
Preservatives: preservative-free, phosphate-free
Use: especially at night, before bedtime
Pack: 5 g tube
Use after opening: 6 months
Status: medical device`,
    },
    image: "/uploads/products/q122-vita-pos.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000005", slug: "vita-nasal", ref: "VITA-NASAL-5G", category: NASAL.id, sort: 1,
    fr: {
      nom: "VitA Nasal – Baume de soin nasal à la vitamine A (5 g)",
      description:
`Le soin réparateur pour votre nez. Apaise, hydrate et favorise la régénération naturelle de la muqueuse nasale.

Spécialement conçu pour les nez secs, irrités ou fragilisés, VitA Nasal est un baume de soin enrichi en vitamine A qui aide à réparer et à protéger les tissus délicats du nez.

VitA Nasal : un geste de douceur pour un nez apaisé, protégé et régénéré.`,
      fiche:
`Référence : VitA Nasal 5 g
Fabricant : URSAPHARM (Allemagne)
Type : baume de soin (pommade nasale)
Composition : vitamine A
Actions : favorise la cicatrisation naturelle des zones nasales irritées ; apaise les irritations et l'inconfort ; hydrate durablement la muqueuse nasale ; protège contre le dessèchement lié au froid, à l'air sec ou aux mouchages répétés
Conservateurs : sans conservateurs
Voie : nasale
Conditionnement : tube de 5 g`,
    },
    en: {
      nom: "VitA Nasal – Nasal care balm with vitamin A (5 g)",
      description:
`Repairing care for your nose. Soothes, moisturises and supports the natural regeneration of the nasal mucosa.

Designed for dry, irritated or weakened noses, VitA Nasal is a care balm enriched with vitamin A that helps repair and protect the delicate tissues of the nose.

VitA Nasal: a gentle step for a soothed, protected and restored nose.`,
      fiche:
`Reference: VitA Nasal 5 g
Manufacturer: URSAPHARM (Germany)
Type: care balm (nasal ointment)
Composition: vitamin A
Actions: supports natural healing of irritated nasal areas; soothes irritation and discomfort; keeps the nasal mucosa moisturised; protects against drying from cold, dry air or frequent nose-blowing
Preservatives: preservative-free
Route: nasal
Pack: 5 g tube`,
    },
    image: "/uploads/products/q122-vita-nasal.jpg",
  },
  {
    id: "d122p001-0000-4000-8000-000000000006", slug: "hylo-nasal-20-ml", ref: "HYLO-NASAL-20", category: NASAL.id, sort: 2,
    fr: {
      nom: "HYLO Nasal – Spray nasal soignant 20 ml",
      description:
`Le soin essentiel pour votre nez. Apaisez, protégez et prenez soin de votre nez au quotidien.

Conçu pour le confort des muqueuses nasales sensibles et fragilisées, HYLO Nasal est un spray de soin qui aide à hydrater, apaiser et protéger le nez contre les désagréments liés à la sécheresse nasale.

Grâce à son format pratique de 20 ml, HYLO Nasal s'intègre facilement à votre routine de soin.

HYLO Nasal – Le geste douceur pour un nez apaisé, protégé et confortable.`,
      fiche:
`Référence : HYLO Nasal 20 ml
Fabricant : URSAPHARM (Allemagne)
Type : spray nasal soignant
Actions : apaise les irritations et les sensations de sécheresse ; hydrate la muqueuse nasale ; protège les zones fragilisées par le froid, la pollution ou la climatisation ; favorise le bien-être nasal au quotidien
Voie : nasale
Conditionnement : flacon spray de 20 ml`,
    },
    en: {
      nom: "HYLO Nasal – Nasal care spray 20 ml",
      description:
`Essential care for your nose. Soothe, protect and look after your nose every day.

Designed for the comfort of sensitive and weakened nasal mucosa, HYLO Nasal is a care spray that helps moisturise, soothe and protect the nose against the discomfort of nasal dryness.

In a handy 20 ml format, HYLO Nasal fits easily into your care routine.

HYLO Nasal – the gentle step for a soothed, protected and comfortable nose.`,
      fiche:
`Reference: HYLO Nasal 20 ml
Manufacturer: URSAPHARM (Germany)
Type: nasal care spray
Actions: soothes irritation and dryness; moisturises the nasal mucosa; protects areas weakened by cold, pollution or air conditioning; supports everyday nasal comfort
Route: nasal
Pack: 20 ml spray bottle`,
    },
    image: "/uploads/products/q122-hylo-nasal.jpg",
  },
];

const COSWEL_TEXT = {
  fr: "Groupe italien Coswell S.p.A. : produits d'hygiène et dispositifs médicaux. Sa division Euritalia Pharma fabrique la solution physiologique ISOMAX (nettoyage nasal, oculaire et aérosolthérapie).",
  en: "Italian group Coswell S.p.A.: hygiene products and medical devices. Its Euritalia Pharma division makes ISOMAX physiological saline (nasal and eye cleansing, aerosol therapy).",
};

async function revert() {
  const b = JSON.parse(fs.readFileSync(BEFORE, "utf8"));
  const newIds = P.filter(p => !p.existing).map(p => p.id);
  await prisma.products.deleteMany({ where: { id: { in: newIds } } }); // cascades translations + media
  await prisma.categories.deleteMany({ where: { id: NASAL.id } });
  const hp = b.hyloParin;
  await prisma.products.update({ where: { id: hp.id }, data: { status: hp.status, category_id: hp.category_id, sort_order: hp.sort_order, is_new_arrival: hp.is_new_arrival, updated_at: now() } });
  for (const t of hp.product_translations) await prisma.product_translations.update({ where: { id: t.id }, data: { nom: t.nom, description: t.description, fiche_technique: t.fiche_technique } });
  await prisma.product_media.deleteMany({ where: { product_id: hp.id, url: { startsWith: "/uploads/products/q122-" } } });
  for (const m of hp.product_media) await prisma.product_media.update({ where: { id: m.id }, data: { is_primary: m.is_primary, sort_order: m.sort_order } });
  await prisma.products.update({ where: { id: b.isomax.id }, data: { partner_id: b.isomax.partner_id, constructeur: b.isomax.constructeur, updated_at: now() } });
  await prisma.partners.update({ where: { id: COSWEL }, data: { description: b.coswel.description, updated_at: now() } });
  for (const t of b.coswel.partner_translations) await prisma.partner_translations.update({ where: { id: t.id }, data: { description: t.description } });
  console.log("reverted");
}

async function main() {
  if (REVERT) return revert();

  for (const p of P) {
    if (p.fr.nom === p.en.nom || p.fr.description === p.en.description || p.fr.fiche === p.en.fiche) throw new Error(`FR = EN for ${p.slug}`);
  }

  const hyloParin = await prisma.products.findUnique({ where: { id: HYLO_PARIN_ID }, include: { product_translations: true, product_media: true } });
  const isomax = await prisma.products.findUnique({ where: { slug: ISOMAX_SLUG }, select: { id: true, partner_id: true, constructeur: true } });
  const coswel = await prisma.partners.findUnique({ where: { id: COSWEL }, include: { partner_translations: true } });
  if (APPLY) { fs.writeFileSync(BEFORE, JSON.stringify({ hyloParin, isomax, coswel }, null, 1)); console.log(`revert point -> ${BEFORE}`); }

  const nasalExists = await prisma.categories.findUnique({ where: { id: NASAL.id } });
  console.log(`  ${nasalExists ? "[SKIP] " : "+ "}category ${NASAL.slug} under Dispositifs médicaux`);
  if (APPLY && !nasalExists) await prisma.categories.create({ data: {
    id: NASAL.id, slug: NASAL.slug, name: NASAL.fr, description: NASAL.dfr, parent_id: DM, sort_order: NASAL.sort,
    is_active: true, type: "equipment", image_url: NASAL.image, updated_at: now(),
    category_translations: { create: [
      { id: `${NASAL.id}-fr`, language_code: "fr", name: NASAL.fr, description: NASAL.dfr },
      { id: `${NASAL.id}-en`, language_code: "en", name: NASAL.en, description: NASAL.den }] } } });

  for (const p of P) {
    if (p.existing) {
      console.log(`  ~ ${p.slug}: re-activated, rewritten, new photo, category ${p.category === COLLYRES ? "Collyres" : p.category}`);
      if (!APPLY) continue;
      await prisma.products.update({ where: { id: p.id }, data: { status: "active", category_id: p.category, sort_order: p.sort, partner_id: URSAPHARM, is_new_arrival: true, updated_at: now() } });
      for (const lang of ["fr", "en"]) {
        const t = hyloParin.product_translations.find(x => x.language_code === lang);
        await prisma.product_translations.update({ where: { id: t.id }, data: { nom: p[lang].nom, description: p[lang].description, fiche_technique: p[lang].fiche } });
      }
      await prisma.product_media.updateMany({ where: { product_id: p.id }, data: { is_primary: false, sort_order: 1 } });
      await prisma.product_media.create({ data: { id: `${p.id}-q122`, product_id: p.id, type: "image", url: p.image, alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true } });
      continue;
    }
    const exists = await prisma.products.findUnique({ where: { id: p.id } });
    console.log(`  ${exists ? "[SKIP] " : "+ "}${p.slug} (${p.ref})`);
    if (!APPLY || exists) continue;
    await prisma.products.create({ data: {
      id: p.id, reference_fournisseur: p.ref, category_id: p.category, constructeur: "ursapharm", slug: p.slug,
      status: "active", is_new_arrival: true, sort_order: p.sort, partner_id: URSAPHARM, updated_at: now(),
      product_translations: { create: [
        { id: `${p.id}-fr`, language_code: "fr", nom: p.fr.nom, description: p.fr.description, fiche_technique: p.fr.fiche },
        { id: `${p.id}-en`, language_code: "en", nom: p.en.nom, description: p.en.description, fiche_technique: p.en.fiche }] },
      product_media: { create: [{ id: `${p.id}-img`, type: "image", url: p.image, alt_text: p.fr.nom, title: p.fr.nom, sort_order: 0, is_primary: true }] },
    } });
  }

  console.log(`  ISOMAX: partner ${isomax.partner_id} -> COSWEL; COSWEL description rewritten`);
  if (APPLY) {
    await prisma.products.update({ where: { id: isomax.id }, data: { partner_id: COSWEL, constructeur: "coswel", updated_at: now() } });
    await prisma.partners.update({ where: { id: COSWEL }, data: { description: COSWEL_TEXT.en, updated_at: now() } });
    for (const t of coswel.partner_translations)
      await prisma.partner_translations.update({ where: { id: t.id }, data: { description: COSWEL_TEXT[t.language_code] || t.description } });
  }
  if (!APPLY) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
