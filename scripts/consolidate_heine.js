const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const fs = require('fs');
const prisma = new PrismaClient();

// Cleaned up French translations for Heine products
const heineProducts = [
  {
    references: "C-000.32.241",
    constructeur: "heine",
    nom_fr: "Filtre Jaune Amovible pour LoupeLight2/MicroLight2",
    nom_en: "Detachable Yellow Filter for Loupelight2/Microlight2",
    description_fr: "Filtre jaune amovible pour les lampes frontales HEINE LoupeLight2 et MicroLight2. Réduit la lumière bleue. Pour les applications dentaires, empêche le durcissement prématuré des matériaux composites. Facile à fixer et à détacher.",
    description_en: "Detachable yellow filter for use with HEINE LoupeLight2 and MicroLight2 headlights. Reduces blue light. For dental applications, prevents premature hardening of composite materials. Easy to attach and detach.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/5/f/csm_J-008.31.277-HEINE-Headlight-MicroLight2-additional_cc321197b7.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-000.32.302, C-000.32.305, C-000.32.306, C-000.32.307, C-000.32.309, C-000.32.523, C-000.32.537, C-000.32.549, C-000.32.551, C-000.32.027",
    constructeur: "heine",
    nom_fr: "Accessoires pour Loupes Binoculaires",
    nom_en: "Binocular Loupes Accessories",
    description_fr: "Accessoires pour loupes binoculaires HR et HRP comprenant: monture S-FRAME avec cordon de retenue, support de loupe i-View, bandeau professionnel L, verres de protection (grandes/petites paires), monture S-FRAME pour verres correcteurs, lentilles de proximité pour HR 2.5x/340mm réduisant la distance de travail à 250mm, verres de protection de remplacement (5 paires), accessoires optiques HR/HRP.",
    description_en: "Accessories for HR and HRP binocular loupes including: S-FRAME with retaining cord, i-View loupe mount, Professional L Headband, protective lenses (large/small pairs), S-FRAME for prescription lenses, close-up lenses for HR 2.5x/340mm reducing working distance to 250mm, replacement protective lenses (5 pairs), HR/HRP optics accessories.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/0/1/csm_C-000.32.356-HEINE-BinocularLoupes-HR2.5x-additional_4da1bc58b7.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-000.32.350, C-000.32.355, C-000.32.356, C-000.32.357, C-000.32.366, C-000.32.367",
    constructeur: "heine",
    nom_fr: "Loupes Binoculaires HR 2.5x Haute Résolution",
    nom_en: "HR 2.5x High Resolution Binocular Loupes",
    description_fr: "Loupes binoculaires haute résolution offrant une image nette et un grand champ de vision. Conception légère avec optiques achromatiques multicouches. Disponibles en distances de travail de 340mm et 420mm. Options de montage: monture S-FRAME avec verres de protection, leviers pivotants stérilisables, cordon de retenue, chiffon de nettoyage et mallette de transport, ou bandeau professionnel L avec protection anti-éclaboussures S-GUARD.",
    description_en: "High resolution binocular loupes with crisp, high-resolution image and large field of view. Lightweight design with multi-coated achromatic optics. Available in 340mm and 420mm working distances. Mounting options: S-FRAME with protective lenses, sterilisable swivel levers, retaining cord, cleaning cloth and carrying case, or Professional L Headband with S-GUARD splash protection.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/0/1/csm_C-000.32.356-HEINE-BinocularLoupes-HR2.5x-additional_4da1bc58b7.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-000.32.440, C-000.32.441, C-000.32.444, C-000.32.445, C-000.32.450, C-000.32.455, C-000.32.460, C-000.32.461, C-000.32.464, C-000.32.465, C-000.32.470, C-000.32.475, C-000.32.440A, C-000.32.441A, C-000.32.444A, C-000.32.445A, C-000.32.450A, C-000.32.455A, C-000.32.460A, C-000.32.461A, C-000.32.464A, C-000.32.465A, C-000.32.470A, C-000.32.475A, C-000.32.430, C-000.32.431, C-000.32.434, C-000.32.435",
    constructeur: "heine",
    nom_fr: "Loupes Binoculaires Prismatiques HRP Haute Résolution",
    nom_en: "HRP High Resolution Prismatic Binocular Loupes",
    description_fr: "Loupes binoculaires prismatiques haute résolution disponibles en grossissements 3.5x, 4x et 6x. Image nette haute résolution avec grand champ de vision. Légères avec optiques achromatiques multicouches. Disponibles en distances de travail de 340mm et 420mm. Compatibles avec monture S-FRAME ou bandeau professionnel L avec S-GUARD. Peuvent être montées avec la lampe frontale HEINE ML4 LED ou MicroLight.",
    description_en: "High resolution prismatic binocular loupes available in 3.5x, 4x, and 6x magnifications. Crisp, high-resolution image with large field of view. Lightweight with multi-coated achromatic optics. Available in 340mm and 420mm working distances. Compatible with S-FRAME or Professional L Headband with S-GUARD. Can be mounted with HEINE ML4 LED HeadLight or MicroLight.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/c/a/csm_C-000.32.430-HEINE-BinocularLoupes-HRP3.5x-additional_11e3ba63d5.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-001.30.100, C-008.30.100, C-011.10.118, C-011.28.388, C-144.10.118, C-144.24.420, C-144.28.388, C-008.30.120, C-010.28.388, C-261.10.118, C-261.24.420, C-261.28.388",
    constructeur: "heine",
    nom_fr: "Ophtalmoscope Beta 200 LED",
    nom_en: "Beta 200 LED Ophthalmoscope",
    description_fr: "Ophtalmoscope direct doté du système optique asphérique (AOS) breveté US 4,963,014 pour des images du fond d'œil claires et sans reflets. Caractéristiques: 27 lentilles (-35D à +40D) en pas de dioptrie unique, 6 ouvertures plus filtre sans rouge. Illumination LEDHQ (température couleur 3500K, IRC ≥90) avec durée de vie d'environ 100 000 heures. Gradation continue 3-100%. Boîtier en aluminium moulé étanche à la poussière pesant 73g. Compatible avec manches à piles 2.5V et manches rechargeables 3.5V. Garantie 5 ans.",
    description_en: "Direct ophthalmoscope featuring Aspherical Optical System (AOS) with US Patent 4,963,014 for clear, glare-free fundus images. Features 27 lenses (-35D to +40D) in 27 single-diopter steps, 6 apertures plus red-free filter. LEDHQ illumination (3500K color temp, CRI ≥90) with ~100,000 hour life. Continuous dimmability 3-100%. Dustproof cast aluminum frame weighing 73g. Compatible with 2.5V battery handles and 3.5V rechargeable handles. 5-year warranty.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/f/6/csm_C-011.28.388-HEINE-ophthalmoscope-BETA200-diagnostic-kit-additional_ac49bb3714.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-008.33.610, C-008.33.611, C-008.33.612, C-008.33.620, C-008.33.621, C-008.33.622",
    constructeur: "heine",
    nom_fr: "Ophtalmoscope Indirect Omega 600",
    nom_en: "Omega 600 Indirect Ophthalmoscope",
    description_fr: "L'ophtalmoscope indirect haut de gamme le plus léger au monde, lauréat du Good Design Award 2021. VisionBOOST unique pour jusqu'à 20% de meilleure visibilité dans les opacités des milieux. Image du fond d'œil la plus lumineuse avec LEDHQ couleur naturelle (3-100%, boost jusqu'à 245%). Image la plus nette grâce aux optiques en verre supérieures. Technologie d'ajustement stéréoscopique unique pour la meilleure imagerie 3D. Design SmoothSURFACE pour désinfection facile. Batterie lithium polymère intégrée compacte. Fonction flip-up, 3 filtres, 4 ouvertures. Garantie 5 ans.",
    description_en: "Lightest high-end indirect ophthalmoscope worldwide with Good Design Award 2021. Unique visionBOOST for up to 20% better view in media opacities. Brightest fundus image with true color LEDHQ (3-100%, up to 245% boost). Sharpest fundus image with superior glass optics. Unique Stereoscopic Adjustment Technology for best 3D imaging. SmoothSURFACE design for easy disinfection. Integrated compact lithium polymer battery. Flip-up function, 3 filters, 4 apertures. 5-year guarantee.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/f/c/csm_C-008.33.610-HEINE-IndirectOphthalmoscope-OMEGA600-additional_fa473842c0.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-011.28.388, C-010.28.388, C-261.28.388, C-144.28.388",
    constructeur: "heine",
    nom_fr: "Ensemble Diagnostique Beta 200 LED (Ophtalmoscope + Otoscope)",
    nom_en: "Beta 200 LED Diagnostic Set (Ophthalmoscope + Otoscope)",
    description_fr: "Diagnostic fiable avec durabilité exceptionnelle. Ophtalmoscope BETA 200 LED avec système optique spécial pour des images claires du fond d'œil. Combiné avec l'otoscope BETA 200 LED F.O. offrant une durabilité exceptionnelle et un grossissement optimal. Illumination LEDHQ. L'ensemble comprend: ophtalmoscope BETA 200 LED, otoscope BETA 200 LED F.O., 10 embouts jetables AllSpec 4mm, mallette rigide, manche rechargeable BETA4 USB avec câble USB et bloc d'alimentation.",
    description_en: "Reliable diagnosis with outstanding durability. BETA 200 LED Ophthalmoscope with special optical system for clear fundus images. Combined with BETA 200 LED F.O. Otoscope featuring exceptional durability and optimum magnification. LEDHQ illumination. Set includes: BETA 200 LED Ophthalmoscope, BETA 200 LED F.O. Otoscope, 10 AllSpec disposable tips 4mm, Hard case, BETA4 USB rechargeable handle with USB cord and plug-in power supply.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/1/c/csm_A-132.28.388-HEINE-BETA200-LED-otoscope-ophtalmoscope-set-usb-2_2927c0f5ee.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-011.28.388, C-144.28.388, C-261.28.388",
    constructeur: "heine",
    nom_fr: "Ensemble Diagnostique Beta 400/200 LED (Otoscope + Ophtalmoscope)",
    nom_en: "Beta 400/200 LED Diagnostic Set (Otoscope + Ophthalmoscope)",
    description_fr: "Vue détaillée avec durabilité exceptionnelle. Otoscope BETA 400 F.O. avec le plus fort grossissement 4.2x. Ophtalmoscope BETA 200 LED avec système optique spécial pour des images claires du fond d'œil. Illumination LEDHQ. L'ensemble comprend: ophtalmoscope BETA 200 LED, otoscope BETA 400 LED F.O., 10 embouts jetables AllSpec 4mm, mallette rigide.",
    description_en: "Detailed view with outstanding durability. BETA 400 F.O. Otoscope with highest 4.2x magnification. BETA 200 LED Ophthalmoscope with special optical system for clear fundus images. LEDHQ illumination. Set includes: BETA 200 LED Ophthalmoscope, BETA 400 LED F.O. Otoscope, 10 AllSpec disposable tips 4mm, Hard case.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/1/c/csm_A-132.28.388-HEINE-BETA200-LED-otoscope-ophtalmoscope-set-usb-2_2927c0f5ee.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-014.10.118, C-014.28.388, C-034.10.118, C-034.28.388",
    constructeur: "heine",
    nom_fr: "Rétinoscope Beta 200 LED",
    nom_en: "Beta 200 LED Retinoscope",
    description_fr: "Rétinoscope portatif pour réfraction objective avec illumination LEDHQ parfaitement uniforme pour une fente précise. Mesure fiable de la réfraction oculaire. Réglage précis du faisceau parallèle via ParaStop. Réflexe fundique très lumineux avec largeur de ligne 1.1mm (ISO 12865 < 1.5mm) et longueur de ligne 35mm. Gradation continue brevetée 3-100%. Le filtre polarisant élimine la lumière parasite. Commandes métalliques pour durabilité exceptionnelle. Utilisation pratique au pouce avec commande unique pour vergence et rotation de ligne.",
    description_en: "Hand-held retinoscope for objective refraction with totally even LEDHQ illumination for a precise streak. Reliable measurement of eye's refraction. Precise parallel beam path adjustment via ParaStop. Very bright fundus reflex with 1.1mm line width (ISO 12865 < 1.5mm) and 35mm line length. Patented continuous dimmability 3-100%. Polarisation filter eliminates stray light. Metal controls for exceptional durability. Convenient thumb operation with single control for vergence and line rotation.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/7/1/csm_C-014.10.118-HEINE-Retinoscope-BETA200-Diagnostic-Kit-main_cd2f01a6c0.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-034.10.118, C-034.28.388, C-144.10.118, C-261.10.118",
    constructeur: "heine",
    nom_fr: "Ensemble Diagnostique Ophtalmique (Ophtalmoscope + Rétinoscope)",
    nom_en: "Ophthalmic Diagnostic Set (Ophthalmoscope + Retinoscope)",
    description_fr: "Ensemble diagnostique combinant ophtalmoscope et rétinoscope. Ophtalmoscope BETA 200 LED avec système optique asphérique. Rétinoscope à fente BETA 200 LED pour réfraction objective. Illumination LEDHQ sur tous les instruments. L'ensemble comprend: ophtalmoscope BETA 200 LED, rétinoscope à fente BETA 200 LED, manche rechargeable BETA4 USB/NT, mallette rigide.",
    description_en: "Combined ophthalmoscope and retinoscope diagnostic set. BETA 200 LED Ophthalmoscope with aspherical optical system. BETA 200 LED Streak Retinoscope for objective refraction. LEDHQ illumination throughout. Set includes: BETA 200 LED Ophthalmoscope, BETA 200 LED Streak Retinoscope, BETA4 USB/NT rechargeable handle, hard case.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/7/1/csm_C-014.10.118-HEINE-Retinoscope-BETA200-Diagnostic-Kit-main_cd2f01a6c0.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-182.10.118, C-182.28.388",
    constructeur: "heine",
    nom_fr: "Ophtalmoscope K180 LED",
    nom_en: "K180 LED Ophthalmoscope",
    description_fr: "Ophtalmoscope direct standard pour budget réduit. Conception robuste avec optiques sphériques de précision à faible réflexion pour un diagnostic fiable. Caractéristiques: roue de lentilles 27 pas (-35 à +40D), 5 ouvertures différentes en 2 variantes. Illumination LEDHQ pour lumière blanche et brillante. Boîtier en polycarbonate robuste et étanche à la poussière. Options d'alimentation flexibles: batterie rechargeable avec USB ou chargeur de table, ou piles remplaçables. Garantie 5 ans.",
    description_en: "Standard direct ophthalmoscope for a smaller budget. Sturdy design with low-reflection spherical precision optics for reliable diagnosis. Features 27 single-step lens wheel (-35 to +40D), 5 different apertures in 2 variants. LEDHQ illumination for bright, white light. Dustproof, sturdy polycarbonate housing. Flexible power options: rechargeable battery with USB or table charger, or replaceable batteries. 5-year guarantee.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/3/9/csm_C-182.10.118-HEINE-ophthalmoscope-K180-LED_e9be3370c8.png",
    category: "oph-diagnostic"
  },
  {
    references: "C-283.10.330, C-283.10.335, C-284.10.330, C-284.10.335, C-008.33.530, C-008.33.535",
    constructeur: "heine",
    nom_fr: "Ophtalmoscope Indirect Binoculaire Omega 500 LED",
    nom_en: "Omega 500 LED Binocular Indirect Ophthalmoscope",
    description_fr: "Ajustement synchronisé unique de la convergence et de la parallaxe pour des images stéréoscopiques haute qualité du fond d'œil quelle que soit la taille de la pupille. Sélection précise des optiques d'observation et d'illumination pour pupilles petites jusqu'à 1.0mm. Système d'illumination multicouche avec alignement vertical exact. Construction en aluminium étanche à la poussière. 3 filtres différents, 4 ouvertures différentes. Le rhéostat du bandeau HC 50L contrôle l'illumination LED/XHL. Alimentation: mPack (8.5h) ou mPack UNPLUGGED (3.5h).",
    description_en: "Unique Synchronized Adjustment of Convergence and Parallax for high quality, stereoscopic fundus images through any pupil size. Precise selection of observation and illumination optics for small pupils down to 1.0mm. Multi-coated illumination system with exact vertical alignment. Dustproof aluminum frame construction. 3 different filters, 4 different apertures. HC 50L Headband Rheostat controls LED/XHL illumination. Power: mPack (8.5h) or mPack UNPLUGGED (3.5h).",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/b/6/csm_C-008.33.535-HEINE-IndirectOphthalmoscope-OMEGA500-additional_6e9b031eba.png",
    category: "oph-diagnostic"
  },
  {
    references: "D-001.71.120, D-002.71.120, D-008.71.120, D-008.71.220, D-886.11.021, D-886.11.022",
    constructeur: "heine",
    nom_fr: "Ophtalmoscope Mini 3000 LED",
    nom_en: "Mini 3000 LED Ophthalmoscope",
    description_fr: "Ophtalmoscope de poche moderne avec illumination LEDHQ. Lumière concentrée et brillante pour une illumination optimale, image brillante et rendu des couleurs authentique. Ouverture étoile de fixation avec filtre gris pour réduire l'intensité lumineuse. 18 lentilles allant de -20 à +20D. 5 ouvertures différentes. S'éteint automatiquement lorsqu'il est clipé à la poche. Utilisation pratique à un doigt. Disponible en noir ou bleu. Peut être combiné avec le système de manche mini 3000.",
    description_en: "Modern pocket ophthalmoscope with LEDHQ illumination. Concentrated, bright light for optimum illumination, brilliant image and authentic colour rendering. Fixation star aperture with grey filter to reduce light intensity. 18 lenses ranging from -20 to +20D. 5 different apertures. Switches off automatically when clipped to pocket. Practical one-finger operation. Available in black or blue. Can be combined with mini 3000 handle system.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/c/4/csm_D-008.71.120-HEINE-mini3000-LED-ophthalmoscope-battery-handle_1c19f78c0c.png",
    category: "oph-diagnostic"
  },
  {
    references: "D-886.11.021, D-886.11.022",
    constructeur: "heine",
    nom_fr: "Ensemble Diagnostique Mini 3000 LED (Ophtalmoscope + Otoscope)",
    nom_en: "Mini 3000 LED Diagnostic Set (Ophthalmoscope + Otoscope)",
    description_fr: "Qualité maximale dans des dimensions minimales. Ophtalmoscope de poche moderne combiné avec otoscope compact et lumineux. Illumination LEDHQ pour une illumination optimale, image brillante et rendu des couleurs authentique. L'ensemble comprend: ophtalmoscope mini 3000 LED, otoscope mini 3000 F.O. LED, 1 jeu (4 pcs.) d'embouts réutilisables, 10 embouts jetables AllSpec 4mm, mallette rigide avec 2 manches à piles mini 3000 avec piles.",
    description_en: "Maximum quality with minimum dimensions. Modern pocket-size ophthalmoscope combined with compact, bright otoscope. LEDHQ illumination for optimum illumination, brilliant image and authentic colour rendering. Set includes: mini 3000 LED Ophthalmoscope, mini 3000 F.O. Otoscope LED, 1 set (4 pcs.) reusable tips, 10 AllSpec disposable tips 4mm, hard case with 2 mini 3000 battery handles with batteries.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/e/e/csm_D-886.11.021-HEINE-mini3000-LED-otoscope-ophtalmoscope-set-battery-handle-2_23da5e427a.png",
    category: "oph-diagnostic"
  },
  {
    references: "J-008.31.276, J-008.31.277",
    constructeur: "heine",
    nom_fr: "Lampe Frontale MicroLight2 LED",
    nom_en: "Microlight2 LED Headlight",
    description_fr: "Lampe frontale universelle ultra-légère sans grossissement. Illumination LEDHQ pour une illumination homogène avec rendu des couleurs naturel et fidèle. 25% plus lumineuse que le modèle précédent avec illumination homogène bord à bord. Deux options de montage: bandeau léger ou monture S-FRAME. Câble de connexion remplaçable vers la source d'alimentation mPack mini. Illumination sans ombre avec boîtier en aluminium.",
    description_en: "Ultralight, universal headlight without magnification. LEDHQ illumination for homogeneous illumination with true and natural colour rendering. 25% brighter than predecessor model with homogeneous edge-to-edge illumination. Two mounting options: Lightweight Headband or S-FRAME. Replaceable connecting cord to mPack mini power source. Shadow-free illumination with aluminium housing.",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/5/f/csm_J-008.31.277-HEINE-Headlight-MicroLight2-additional_cc321197b7.png",
    category: "oph-diagnostic"
  },
  {
    references: "J-008.31.415, J-008.31.416, J-008.31.417, J-008.31.418, J-008.31.431, J-008.31.432, J-008.31.433, J-008.31.434, J-008.31.441, J-008.31.442, J-008.31.443, J-008.31.444, J-008.31.445, J-008.31.446, J-008.31.447, J-008.31.448, J-008.31.451, J-008.31.453, J-008.31.455, J-008.31.457, J-008.31.461, J-008.31.463",
    constructeur: "heine",
    nom_fr: "Lampe Frontale Chirurgicale ML4 LED",
    nom_en: "ML4 LED Headlight",
    description_fr: "Lampe frontale chirurgicale best-seller avec illumination LEDHQ. Taille de spot d'illumination réglable: plage de 30mm à 80mm à 420mm de distance de travail. Illumination brillante et homogène bord à bord. Contrôle continu de l'intensité lumineuse pour éviter les reflets. Conception coaxiale pour imagerie sans ombre. Bandeau professionnel L avec plusieurs points d'ajustement et rembourrage souple. Filtre polarisant P2 et filtre jaune en option. Options d'alimentation: mPack UNPLUGGED (3.5h) ou mPack ceinture (8.5h).",
    description_en: "Topseller surgical headlight with LEDHQ illumination. Adjustable illumination spot size: 30mm to 80mm range at 420mm working distance. Bright and homogeneous edge-to-edge illumination. Stepless light intensity control prevents reflexes. Coaxial design for shadow-free imaging. Professional L headband with multiple adjustment points and soft padding. Optional polarisation filter P2 and yellow filter. Power options: mPack UNPLUGGED (3.5h) or belt-worn mPack (8.5h).",
    imageUrl: "https://www.heine.com/fileadmin/_processed_/3/7/csm_J-008.31.410-HEINE-Headlight-ML4LED-main_1090381405.png",
    category: "oph-diagnostic"
  }
];

async function consolidateHeine() {
  console.log('=== CONSOLIDATING HEINE PRODUCTS ===\n');

  // Get the category ID for oph-diagnostic
  const category = await prisma.categories.findFirst({
    where: { slug: 'oph-diagnostic' }
  });

  if (!category) {
    console.error('Category oph-diagnostic not found!');
    return;
  }

  console.log('Found category:', category.name, '(', category.id, ')\n');

  // Step 1: Count existing Heine products
  const existingCount = await prisma.products.count({
    where: { constructeur: { contains: 'heine', mode: 'insensitive' } }
  });
  console.log('Existing Heine products:', existingCount);

  // Step 2: Delete existing Heine products and their translations/media
  console.log('\nDeleting existing Heine products...');

  const heineProductIds = await prisma.products.findMany({
    where: { constructeur: { contains: 'heine', mode: 'insensitive' } },
    select: { id: true }
  });

  const ids = heineProductIds.map(p => p.id);

  // Delete translations first
  await prisma.product_translations.deleteMany({
    where: { product_id: { in: ids } }
  });
  console.log('- Deleted translations');

  // Delete media
  await prisma.product_media.deleteMany({
    where: { product_id: { in: ids } }
  });
  console.log('- Deleted media');

  // Delete products
  await prisma.products.deleteMany({
    where: { id: { in: ids } }
  });
  console.log('- Deleted products');

  // Step 3: Insert consolidated products
  console.log('\nInserting', heineProducts.length, 'consolidated products...\n');

  for (const product of heineProducts) {
    // Generate slug from French name
    const slug = product.nom_fr
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the product
    const productId = randomUUID();
    const created = await prisma.products.create({
      data: {
        id: productId,
        reference_fournisseur: product.references,
        constructeur: product.constructeur,
        category_id: category.id,
        status: 'active',
        is_featured: false,
        slug: slug,
        created_at: new Date(),
        updated_at: new Date(),
        product_translations: {
          create: [
            {
              id: randomUUID(),
              language_code: 'fr',
              nom: product.nom_fr,
              description: product.description_fr
            },
            {
              id: randomUUID(),
              language_code: 'en',
              nom: product.nom_en,
              description: product.description_en
            }
          ]
        },
        product_media: product.imageUrl ? {
          create: {
            id: randomUUID(),
            type: 'image',
            url: product.imageUrl,
            is_primary: true,
            sort_order: 0
          }
        } : undefined
      }
    });

    console.log('Created:', product.nom_fr);
  }

  // Step 4: Verify
  const newCount = await prisma.products.count({
    where: { constructeur: { contains: 'heine', mode: 'insensitive' } }
  });
  console.log('\n=== COMPLETE ===');
  console.log('Before:', existingCount, 'products');
  console.log('After:', newCount, 'products');
  console.log('Reduced by:', existingCount - newCount, 'duplicates');

  await prisma.$disconnect();
}

consolidateHeine().catch(console.error);
