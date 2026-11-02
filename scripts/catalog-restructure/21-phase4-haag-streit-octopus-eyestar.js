require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const HAAG_STREIT_PARTNER_ID = "bc6c494f-bfd1-488b-aabe-91bdfe65e519";
const CHAMP_VISUEL_CAT_ID = "a8595c54-edb2-44c0-895b-2314fe5d723b";
const BIOMETRIE_CAT_ID = "d5b2283d-5328-4091-a5aa-a33f97e6afe4";
const TOPOGRAPHIE_CAT_ID = "54effae5-ffbd-4a20-8c67-682e9c88ed55";
const EYESTAR_900_PRODUCT_ID = "e7429d79-b881-4e67-acbd-f97e1fc9acaa";

async function setTitleAndDescription(tx, productId, nomFr, nomEn, descFr, descEn) {
  for (const [lang, nom, desc] of [
    ["fr", nomFr, descFr],
    ["en", nomEn, descEn],
  ]) {
    const t = await tx.product_translations.findFirst({
      where: { product_id: productId, language_code: lang },
    });
    if (t) {
      await tx.product_translations.update({
        where: { id: t.id },
        data: { nom, description: desc },
      });
    }
  }
  await tx.products.update({
    where: { id: productId },
    data: { updated_at: new Date() },
  });
}

async function createProduct(tx, data) {
  const existing = await tx.products.findUnique({
    where: { reference_fournisseur: data.ref },
  });
  if (existing) {
    console.log(`   [SKIP] ${data.ref} exists (${existing.id})`);
    return existing.id;
  }
  const id = `custom-${Date.now()}-${randomUUID().slice(0, 8)}`;
  await tx.products.create({
    data: {
      id,
      reference_fournisseur: data.ref,
      category_id: data.categoryId,
      constructeur: data.constructeur,
      slug: data.slug,
      status: data.status || "active",
      is_featured: false,
      sort_order: data.sortOrder || 5,
      partner_id: data.partnerId || null,
      created_at: new Date(),
      updated_at: new Date(),
      product_translations: {
        create: [
          {
            id: randomUUID(),
            language_code: "fr",
            nom: data.nomFr,
            description: data.descFr,
          },
          {
            id: randomUUID(),
            language_code: "en",
            nom: data.nomEn,
            description: data.descEn,
          },
        ],
      },
    },
  });
  console.log(`   [PROD] ${data.ref} created (${id})`);
  return id;
}

async function main() {
  console.log("\n== Phase 4: Haag-Streit Octopus + EYESTAR 900 variants ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("1. Create Octopus 900 in Champ visuel et électrophysiologie");
      await createProduct(tx, {
        ref: "HAAG-OCTOPUS-900",
        categoryId: CHAMP_VISUEL_CAT_ID,
        constructeur: "haag-streit",
        partnerId: HAAG_STREIT_PARTNER_ID,
        slug: "haag-streit-octopus-900",
        sortOrder: 1,
        nomFr: "Périmètre Octopus 900",
        nomEn: "Octopus 900 Perimeter",
        descFr:
          "Périmètre statique et cinétique plein champ Haag-Streit Octopus 900. Examen complet du champ visuel (+/- 90°) avec stratégies SAP, SWAP, Flicker, cinétique Goldmann. Analyse avancée du glaucome et suivi oculaire intégré.",
        descEn:
          "Haag-Streit Octopus 900 full-field static and kinetic perimeter. Comprehensive visual field testing (+/- 90°) with SAP, SWAP, Flicker, Goldmann kinetic strategies. Advanced glaucoma analysis and integrated eye tracking.",
      });

      console.log("\n2. Update existing EYESTAR 900 -> clarify as C-Suite");
      await setTitleAndDescription(
        tx,
        EYESTAR_900_PRODUCT_ID,
        "EYESTAR 900 C-Suite — OCT Swept-Source Biométrie / Topographie (Cataract Suite)",
        "EYESTAR 900 C-Suite — Swept-Source OCT Biometry / Topography (Cataract Suite)",
        "EYESTAR 900 C-Suite : biomètre Swept-Source OCT Haag-Streit pour la planification chirurgicale de la cataracte. Topographie cornéenne antérieure et postérieure, kératométrie double zone, pachymétrie, analyse de l'inclinaison du cristallin, simulation de vision. Intégration EyeSuite IOL (Hill-RBF, Barrett, Olsen). Mesure des deux yeux en ~40 secondes.",
        "EYESTAR 900 C-Suite: Haag-Streit swept-source OCT biometer for cataract surgery planning. Anterior and posterior corneal topography, dual-zone keratometry, pachymetry, lens tilt analysis, vision simulation. EyeSuite IOL integration (Hill-RBF, Barrett, Olsen). Both-eye measurement in ~40 seconds.",
      );
      console.log(`   [TITLE] EYESTAR 900 renamed as C-Suite`);

      console.log("\n3. Create EYESTAR 900 AC-Suite (Biometry + Anterior Chamber)");
      await createProduct(tx, {
        ref: "HAAG-EYESTAR-900-AC",
        categoryId: BIOMETRIE_CAT_ID,
        constructeur: "haag-streit",
        partnerId: HAAG_STREIT_PARTNER_ID,
        slug: "haag-streit-eyestar-900-ac-suite",
        sortOrder: 5,
        nomFr: "EYESTAR 900 AC-Suite — Biométrie / Analyse du Segment Antérieur",
        nomEn: "EYESTAR 900 AC-Suite — Biometry / Anterior Chamber Analysis",
        descFr:
          "EYESTAR 900 AC-Suite : biomètre Swept-Source OCT Haag-Streit avec topographie Classe-A 12 mm de la cornée antérieure et postérieure, imagerie OCT 18 mm, outils de détection d'ectasie. Pour l'évaluation complète du segment antérieur.",
        descEn:
          "EYESTAR 900 AC-Suite: Haag-Streit swept-source OCT biometer with 12 mm Class-A topography of anterior and posterior cornea, 18 mm OCT imaging, ectasia detection tools. For comprehensive anterior segment evaluation.",
      });

      console.log("\n4. Tighten Octopus 600 title (already exists, just clarify description)");
      const oct600 = await tx.products.findUnique({
        where: { reference_fournisseur: "7220001" },
      });
      await setTitleAndDescription(
        tx,
        oct600.id,
        "Périmètre Octopus 600",
        "Octopus 600 Perimeter",
        "Périmètre statique de champ central Haag-Streit Octopus 600. Solution compacte de bureau pour l'examen du champ visuel central (+/- 30°). Tests SAP et Pulsar pour dépistage précoce, analyse de progression, suivi oculaire.",
        "Haag-Streit Octopus 600 central-field static perimeter. Compact desktop solution for central visual field testing (+/- 30°). SAP and Pulsar tests for early detection, progression analysis, eye tracking.",
      );
      console.log(`   [TITLE] Octopus 600 description enriched`);
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 4 complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
