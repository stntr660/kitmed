const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-10-27 -- client feedback on the ophthalmology families.
 *
 * A) Bloc opératoire card shows the Metis 900 microscope and the Cube CV-9000
 *    phaco side by side, with no text on the image (the « Cube α CV-9000 »
 *    caption of the phaco photo is removed). File: bloc-operatoire-photo.jpg
 * B) Contactologie card shows the 1-Day Acuvue Moist box.
 *    File: oph-contactology-photo.jpg
 * C) Exploration ORL card shows an Otopront ENT workstation, photo sent by
 *    the client. File: ent-exploration-photo.jpg
 * D) Oculoplastie becomes a sub-family of Bloc opératoire, after
 *    Instrumentation. Its products stay attached to it.
 *
 * REVERT POINT: `before` is what each row had on 2026-10-27. --revert puts
 * every image and the Oculoplastie parent / position back exactly.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 63-bloc-operatoire-oculoplastie.js <app>:/tmp/63.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/63.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/63.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/63.js --revert
 * The *-photo.jpg files are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const IMAGES = {
  "bloc-operatoire":  { before: "/uploads/categories/bloc-operatoire.jpg",  after: "/uploads/categories/bloc-operatoire-photo.jpg" },
  "oph-contactology": { before: "/uploads/categories/oph-contactology.png", after: "/uploads/categories/oph-contactology-photo.jpg" },
  "ent-exploration":  { before: "/uploads/categories/ent-exploration.png",  after: "/uploads/categories/ent-exploration-photo.jpg" },
};

const MOVE = {
  slug: "oculoplastie-fci",
  before: { parent_id: "ophthalmology", sort_order: 12 },
  afterParentSlug: "bloc-operatoire",
  afterSortOrder: 30, // after Instrumentation (28) and Punchs & Trépans (29)
};

async function main() {
  for (const [slug, { before, after }] of Object.entries(IMAGES)) {
    const target = REVERT ? before : after;
    if (!fs.existsSync(path.join(UPLOADS, target.replace(/^\/uploads\//, "")))) {
      console.log(`  [MISSING FILE] ${slug} ${target}`);
      continue;
    }
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { console.log(`  [MISSING CATEGORY] ${slug}`); continue; }
    if (cat.image_url === target) { console.log(`  [SKIP] ${slug}`); continue; }
    console.log(`  ${slug.padEnd(24)} ${cat.image_url} -> ${target}`);
    if (APPLY || REVERT) await prisma.categories.update({ where: { id: cat.id }, data: { image_url: target, updated_at: new Date() } });
  }

  const cat = await prisma.categories.findUnique({ where: { slug: MOVE.slug } });
  const parent = await prisma.categories.findUnique({ where: { slug: MOVE.afterParentSlug } });
  if (!cat || !parent) {
    console.log(`  [MISSING CATEGORY] ${!cat ? MOVE.slug : MOVE.afterParentSlug}`);
  } else {
    const target = REVERT ? MOVE.before : { parent_id: parent.id, sort_order: MOVE.afterSortOrder };
    if (cat.parent_id === target.parent_id && cat.sort_order === target.sort_order) {
      console.log(`  [SKIP] ${MOVE.slug}`);
    } else {
      console.log(`  ${MOVE.slug.padEnd(24)} parent ${cat.parent_id} #${cat.sort_order} -> ${target.parent_id} #${target.sort_order}`);
      if (APPLY || REVERT) await prisma.categories.update({ where: { id: cat.id }, data: { ...target, updated_at: new Date() } });
    }
  }

  console.log(APPLY || REVERT ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
