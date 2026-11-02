const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-19 -- « Instruments vitreoretinal Rumex », one general product in Instrumentation
 * like « Instruments FCI » and « Instruments Moria », with Rumex's 2026
 * vitreoretinal brochure. The 157 single Rumex instruments stay archived.
 *
 * The photo is the instruments from the brochure cover, cropped without text.
 * Both files are copied to the uploads volume first:
 *   /uploads/products/rumex-instruments-2026.jpg
 *   /uploads/pdfs/kitmed-2026-10-rumex-vitreoretinal-brochure.pdf
 *     (source: cdn.shopify.com/.../INSTRUMENTS_FOR_VITREORETINAL_SURGERY-2026_web.pdf)
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 61-rumex-instruments.js <app>:/tmp/61.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/61.js          # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/61.js --apply
 *
 * Rollback: delete the product with reference RUMEX-INSTRUMENTS (its
 * translations and media cascade).
 */

const APPLY = process.argv.includes("--apply");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const REF = "RUMEX-INSTRUMENTS";
const IMAGE = "/uploads/products/rumex-instruments-2026.jpg";
const PDF = "/uploads/pdfs/kitmed-2026-10-rumex-vitreoretinal-brochure.pdf";
const TEXT = {
  fr: {
    nom: "Instruments vitreoretinal Rumex",
    description: "Gamme complète d'instruments chirurgicaux ophtalmiques Rumex. Instrumentation de précision pour la chirurgie vitréo-rétinienne : pinces ILM et ERM, ciseaux, poignées, trocarts, canules et consommables.",
  },
  en: {
    nom: "Rumex Vitreoretinal Instruments",
    description: "Complete range of Rumex ophthalmic surgical instruments. Precision instrumentation for vitreoretinal surgery: ILM and ERM forceps, scissors, handles, trocars, cannulas and consumables.",
  },
};

async function main() {
  for (const f of [IMAGE, PDF]) {
    const onDisk = path.join(UPLOADS, f.replace(/^\/uploads\//, ""));
    if (!fs.existsSync(onDisk)) throw new Error(`missing file on the volume: ${onDisk}`);
  }
  if (await prisma.products.findUnique({ where: { reference_fournisseur: REF } })) {
    console.log(`  [EXISTS] ${REF}`);
    return prisma.$disconnect();
  }
  const category = await prisma.categories.findUnique({ where: { slug: "instrumentation" } });
  const partner = await prisma.partners.findUnique({ where: { slug: "rumex" } });
  const fci = await prisma.products.findUnique({ where: { reference_fournisseur: "FCI-INSTRUMENTS" } });

  console.log(`  + ${TEXT.fr.nom} -> ${category.slug} (ordre ${fci.sort_order}), photo ${IMAGE}, brochure ${PDF}`);
  if (APPLY) {
    const id = randomUUID();
    await prisma.products.create({
      data: {
        id, reference_fournisseur: REF, category_id: category.id, constructeur: "rumex",
        partner_id: partner ? partner.id : null, slug: "instruments-vitreoretinal-rumex",
        status: "active", sort_order: fci.sort_order, pdf_brochure_url: PDF, updated_at: new Date(),
        product_translations: { create: Object.entries(TEXT).map(([language_code, t]) => ({ id: randomUUID(), language_code, ...t })) },
        product_media: { create: [{ id: randomUUID(), type: "image", url: IMAGE, alt_text: TEXT.fr.nom, is_primary: true, sort_order: 0 }] },
      },
    });
  }
  console.log(APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
