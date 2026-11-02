const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

/**
 * Fixes the 4 Nidek products with correct descriptions, categories, and images.
 * All 4 are consultation units, not what was originally guessed.
 * Also corrects DT-6400 -> OT-6400.
 */

const FIXES = [
  {
    slug: "nidek-lypop",
    newSlug: "nidek-lypop",
    reference: "NIDEK-LYPOP",
    nameFr: "Nidek LyPop",
    nameEn: "Nidek LyPop",
    descFr: "Unite de consultation compacte pour deux instruments et un bras refracteur, utilisable dans un espace d'un metre de large seulement. Le bras refracteur translatable maintient une hauteur d'oeil constante pendant la refraction, et le fauteuil est reglable electriquement sur 25 cm. Certifiee Origine France Garantie.",
    descEn: "The most compact refraction unit on the market, designed for two instruments and a refractor arm, usable in a space just one meter wide. The translating refractor arm maintains constant eye height during refraction, and the electrically adjustable seat offers 25 cm of height displacement. Certified Origine France Garantie.",
    imageUrl: "/uploads/products/nidek-lypop-primary.jpg",
    categorySlug: "consultation"
  },
  {
    slug: "nidek-affinity",
    newSlug: "nidek-affinity",
    reference: "NIDEK-AFFINITY",
    nameFr: "Nidek Affinity",
    nameEn: "Nidek Affinity",
    descFr: "Unite de consultation de reference pour l'ophtalmologie, concue pour deux ou trois instruments motorises avec bras refracteur. La technologie de hauteur d'oeil constante elimine le besoin de regler la platine et le fauteuil lors du passage d'un instrument a l'autre, reduisant la fatigue du praticien. Compatible avec le logiciel RT-Connect pour la telemedecine.",
    descEn: "The reference consultation unit for ophthalmology, designed for two or three motorized instruments with a refractor arm. The constant eye height technology eliminates the need to adjust the plate and chair when switching instruments, reducing practitioner fatigue. Compatible with RT-Connect software for telemedicine.",
    imageUrl: "/uploads/products/nidek-affinity-primary.jpg",
    categorySlug: "consultation"
  },
  {
    slug: "nidek-synetic",
    newSlug: "nidek-synetic",
    reference: "NIDEK-SYNETIC",
    nameFr: "Nidek Synetic",
    nameEn: "Nidek Synetic",
    descFr: "Unite de consultation a translation entierement motorisee, concue pour 2 ou 3 instruments avec bras refracteur translatable et inclinable. Tous les mouvements sont automatises via un panneau de commande tactile. Sa platine en bois cintre et ses materiaux nobles offrent rigidite et style, tout en supportant des appareils lourds comme des OCT ou des retinographes.",
    descEn: "A fully motorized translation consultation unit designed for 2 or 3 instruments with a powered translating and tilting refractor arm. All motions are automated via a hybrid touchscreen control panel. Its bent wooden plate and premium materials provide both rigidity and distinctive style, while supporting heavy devices such as OCTs and fundus cameras.",
    imageUrl: "/uploads/products/nidek-synetic-primary.jpg",
    categorySlug: "consultation"
  },
  {
    slug: "nidek-dt-6400",
    newSlug: "nidek-ot-6400",
    reference: "NIDEK-OT6400",
    nameFr: "Nidek OT-6400",
    nameEn: "Nidek OT-6400",
    descFr: "Unite de consultation rotative haut de gamme, entierement automatisee, pour 3 ou 4 instruments avec bras refracteur translatable et inclinable. La technologie de hauteur d'oeil constante adapte automatiquement la hauteur en fonction de chaque mentonniere. Premiere unite premium dotee d'une application mobile pour le controle a distance, certifiee Origine France Garantie.",
    descEn: "Premium fully powered and automated rotating consultation unit for 3 or 4 instruments with a translating and tilting refractor arm. The constant eye height technology automatically adapts the height based on each chinrest, eliminating manual adjustments. First premium unit with mobile app control for remote operation, certified Origine France Garantie.",
    imageUrl: "/uploads/products/nidek-ot6400-primary.jpg",
    categorySlug: "consultation"
  }
];

async function main() {
  console.log("=== FIX NIDEK PRODUCTS ===\n");

  // Find consultation category
  const consultation = await prisma.categories.findFirst({
    where: { slug: "consultation" }
  });

  if (!consultation) {
    console.error("ERROR: Consultation category not found!");
    process.exit(1);
  }

  console.log(`Consultation category: ${consultation.id}\n`);

  for (const fix of FIXES) {
    const product = await prisma.products.findFirst({
      where: { slug: fix.slug }
    });

    if (!product) {
      console.log(`[SKIP] Product "${fix.slug}" not found`);
      continue;
    }

    // Update product core fields
    await prisma.products.update({
      where: { id: product.id },
      data: {
        slug: fix.newSlug,
        reference_fournisseur: fix.reference,
        category_id: consultation.id,
        updated_at: new Date()
      }
    });

    // Update French translation
    await prisma.product_translations.updateMany({
      where: { product_id: product.id, language_code: "fr" },
      data: { nom: fix.nameFr, description: fix.descFr }
    });

    // Update English translation
    await prisma.product_translations.updateMany({
      where: { product_id: product.id, language_code: "en" },
      data: { nom: fix.nameEn, description: fix.descEn }
    });

    // Remove old media and add new primary image
    await prisma.product_media.deleteMany({
      where: { product_id: product.id }
    });

    await prisma.product_media.create({
      data: {
        id: randomUUID(),
        product_id: product.id,
        type: "image",
        url: fix.imageUrl,
        is_primary: true,
        alt_text: fix.nameFr,
        title: fix.nameFr,
        sort_order: 0,
        created_at: new Date()
      }
    });

    console.log(`[OK] Updated "${fix.slug}" -> "${fix.newSlug}" with correct info and image`);
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
