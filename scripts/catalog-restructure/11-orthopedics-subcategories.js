const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

async function createCat(data) {
  const existing = await prisma.categories.findFirst({ where: { slug: data.slug } });
  if (existing) { console.log(`  [SKIP] "${data.slug}" exists`); return existing.id; }
  const id = randomUUID();
  await prisma.categories.create({
    data: {
      id, name: data.nameFr, slug: data.slug, parent_id: data.parentId,
      type: "equipment", sort_order: data.sortOrder, is_active: true,
      created_at: new Date(), updated_at: new Date(),
      category_translations: {
        create: [
          { id: randomUUID(), language_code: "fr", name: data.nameFr, description: data.descFr || "" },
          { id: randomUUID(), language_code: "en", name: data.nameEn, description: data.descEn || "" }
        ]
      }
    }
  });
  console.log(`  [OK] Created "${data.slug}" (${id})`);
  return id;
}

async function main() {
  console.log("=== ORTHOPEDICS SUBCATEGORY RESTRUCTURE ===\n");

  const ortho = await prisma.categories.findFirst({ where: { slug: "orthopedics" } });
  if (!ortho) { console.error("Orthopedics not found!"); process.exit(1); }
  console.log(`Found: ${ortho.id}\n`);

  // Create subcategories
  const attelles = await createCat({ slug: "attelles-immobilisation", nameFr: "Attelles et immobilisation", nameEn: "Splints & Immobilization", descFr: "Attelles de poignet, doigt, cuisse et immobilisateurs", descEn: "Wrist, finger, thigh splints and immobilizers", parentId: ortho.id, sortOrder: 1 });
  const ortheses = await createCat({ slug: "ortheses-articulaires", nameFr: "Ortheses articulaires", nameEn: "Joint Orthoses", descFr: "Ortheses de genou, cheville, epaule et tibio-tarsienne", descEn: "Knee, ankle, shoulder and tibio-tarsal orthoses", parentId: ortho.id, sortOrder: 2 });
  const ceintures = await createCat({ slug: "ceintures-lombaires", nameFr: "Ceintures et supports lombaires", nameEn: "Lumbar Belts & Supports", descFr: "Ceintures lombaires, bandes et ortheses lombo-sacrees", descEn: "Lumbar belts, bands and lumbosacral orthoses", parentId: ortho.id, sortOrder: 3 });
  const genouilleres = await createCat({ slug: "genouilleres-chevillieres", nameFr: "Genouilleres et chevillieres", nameEn: "Knee & Ankle Supports", descFr: "Genouilleres, chevillieres et coudieres elastiques", descEn: "Elastic knee braces, ankle supports and elbow supports", parentId: ortho.id, sortOrder: 4 });
  const chaussures = await createCat({ slug: "chaussures-protections", nameFr: "Chaussures et protections", nameEn: "Footwear & Protection", descFr: "Chaussures post-operatoires, protecteurs plantaires et hallux valgus", descEn: "Post-operative shoes, plantar protectors and hallux valgus", parentId: ortho.id, sortOrder: 5 });
  const coussins = await createCat({ slug: "coussins-anti-escarres", nameFr: "Coussins anti-escarres", nameEn: "Pressure Relief Cushions", descFr: "Coussins de prevention des escarres", descEn: "Pressure sore prevention cushions", parentId: ortho.id, sortOrder: 6 });
  const cervicale = await createCat({ slug: "ortheses-cervicales", nameFr: "Ortheses cervicales", nameEn: "Cervical Orthoses", descFr: "Colliers cervicaux et ortheses de cou", descEn: "Cervical collars and neck orthoses", parentId: ortho.id, sortOrder: 7 });

  // Reassign products
  console.log("\nReassigning products...\n");

  const orthoConsumable = await prisma.categories.findFirst({ where: { slug: "ortho-consumable" } });
  const products = await prisma.products.findMany({
    where: { category_id: orthoConsumable.id, status: "active" },
    include: { product_translations: { select: { nom: true, language_code: true } } }
  });

  const mappings = [
    { keywords: ["attelle", "immobilis", "clavi", "stack"], target: attelles, name: "attelles" },
    { keywords: ["orthese de genou", "orthèse de genou", "orthese tibio", "orthèse tibio", "orthese cheville", "orthèse cheville", "orthese d'epaule", "orthèse d'épaule", "orthese hallux", "orthèse hallux", "sangle patellaire"], target: ortheses, name: "ortheses" },
    { keywords: ["ceinture", "lombo-sacr", "lombo sacr", "prs6", "bande ceinture"], target: ceintures, name: "ceintures" },
    { keywords: ["genouill", "chevilliè", "chevillère", "chevillier", "coudière", "coudiere", "support elastique", "support élastique", "sangle d'épicondylite", "sangle d'epicondylite", "mollet", "cuisse"], target: genouilleres, name: "genouilleres" },
    { keywords: ["chaussure", "protecteur plantaire", "protecteur pour orteil", "hallux", "souriceaux"], target: chaussures, name: "chaussures" },
    { keywords: ["coussin anti-escarre", "coussin anti escarre", "cpfl", "cpva"], target: coussins, name: "coussins" },
    { keywords: ["cervical", "philadelphia", "cc121", "cc19"], target: cervicale, name: "cervicale" },
  ];

  let moved = 0;
  for (const p of products) {
    const nom = (p.product_translations.find(t => t.language_code === "fr")?.nom || "").toLowerCase();
    const ref = p.reference_fournisseur.toLowerCase();
    const text = `${nom} ${ref}`;

    let matched = false;
    for (const m of mappings) {
      if (m.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        await prisma.products.update({ where: { id: p.id }, data: { category_id: m.target, updated_at: new Date() } });
        console.log(`  [OK] "${nom}" -> ${m.name}`);
        moved++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      console.log(`  [SKIP] "${nom}" (ref: ${p.reference_fournisseur})`);
    }
  }

  console.log(`\nMoved: ${moved}/${products.length}`);

  // Set images
  console.log("\nSetting images...");
  for (const cat of [attelles, ortheses, ceintures, genouilleres, chaussures, coussins, cervicale]) {
    const best = await prisma.products.findFirst({
      where: { category_id: cat, status: "active" },
      orderBy: [{ is_featured: "desc" }, { created_at: "desc" }],
      include: { product_media: { where: { type: "image" }, orderBy: { is_primary: "desc" }, take: 1 } }
    });
    if (best?.product_media?.[0]?.url) {
      await prisma.categories.update({ where: { id: cat }, data: { image_url: best.product_media[0].url } });
      console.log(`  [OK] image set for ${cat}`);
    }
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
