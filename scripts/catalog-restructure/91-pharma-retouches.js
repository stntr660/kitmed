const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-16 -- client edits (WhatsApp 2026-11-16) on the « Pharma » domain
 * (dispositifs-medicaux / oph-pharmaceutics):
 *   A) the 3 ISOMAR sprays (partner COSWEL) are archived. ISOMAX saline
 *      solution (another brand) is kept;
 *   B) « HYLO DUAL Collyre » (HYLO-DUAL) is archived: the client asks to remove
 *      « le deuxième » HYLO DUAL of the list (1st card = HYLO DUAL INTENSE,
 *      2nd = HYLO DUAL) and « Hylo dual à supprimer » in the brochure block of
 *      /fr/catalogues -- archiving it also removes that brochure entry;
 *   C) Nutri-FOV (INOPHTA): the blurry photo is replaced by the client's two new
 *      photos, rebuilt 1000x1000 on white, centred (3/4 view main, front second):
 *      /uploads/products/nutri-fov-91-1.jpg, nutri-fov-91-2.jpg;
 *   D) HYLO CARE / COMOD / FRESH / GEL brochures pointed to hylo.ma product web
 *      pages (script 60), which now answer 403 to everyone -> « ne s'ouvrent
 *      pas ». Each gets a real PDF on our server, cut from the official
 *      URSAPHARM consumer brochure (HYLO GLOBAL EN 2025): cover + the product's
 *      page + the HYLO family page: /uploads/pdfs/ursapharm-hylo-<x>-brochure.pdf.
 *
 * REVERT POINT: 91-before.json (--snapshot, refuses to overwrite) holds the
 * status, pdf_brochure_url and media of every row touched, as on 2026-11-16;
 * --revert writes them back.
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 91-pharma-retouches.js <app>:/tmp/91.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/91.js --snapshot   # writes /tmp/91-before.json
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/91.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/91.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/91.js --revert
 * (copy 91-before.json next to the script before --revert.)
 * The nutri-fov-91-*.jpg photos (products/) and ursapharm-hylo-*-brochure.pdf
 * (pdfs/) are copied to the uploads volume first.
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const SNAPSHOT = process.argv.includes("--snapshot");
const WRITE = APPLY || REVERT;
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const BEFORE_FILE = path.join(__dirname, "91-before.json");

const ARCHIVE = {
  "prod-1768072845647-n5eco5adk": "ISOMAR Spray Décongestionnant (GA1360400)",
  "prod-1768072845641-8sxxmwi1x": "ISOMAR Baby Spray (GA1360000)",
  "prod-1768072845599-svkxux5a3": "ISOMAR Spray Nez-Oreilles (GA1359900)",
  "0aaf54bc-ed1b-47bd-bca4-637d6e7947d5": "HYLO DUAL Collyre (HYLO-DUAL)",
};
const NUTRI = "b8c7c96f-4a07-4d0d-982a-feea0fbbc9f6";
const NUTRI_ALT = "Nutri-FOV — complément alimentaire INOPHTA";
const NUTRI_MEDIA = ["/uploads/products/nutri-fov-91-1.jpg", "/uploads/products/nutri-fov-91-2.jpg"].map((url, i) => ({
  id: `${NUTRI}-m91-${i}`, product_id: NUTRI, type: "image", url, alt_text: NUTRI_ALT, title: NUTRI_ALT, sort_order: i, is_primary: i === 0 }));
const PDFS = {
  "92953380-4087-4153-8db3-1c7b6a8701e1": "/uploads/pdfs/ursapharm-hylo-care-brochure.pdf",
  "3cff0f65-a5d6-4def-bbf1-59550629157a": "/uploads/pdfs/ursapharm-hylo-comod-brochure.pdf",
  "cce98b3b-c207-46e8-850f-0d949a6b6463": "/uploads/pdfs/ursapharm-hylo-fresh-brochure.pdf",
  "c157792a-ebab-4b99-a252-9132621e133f": "/uploads/pdfs/ursapharm-hylo-gel-brochure.pdf",
};
const IDS = [...Object.keys(ARCHIVE), NUTRI, ...Object.keys(PDFS)];
const fileOk = (url) => fs.existsSync(path.join(UPLOADS, url.replace(/^\/uploads\//, "")));

async function main() {
  if (SNAPSHOT) {
    if (fs.existsSync(BEFORE_FILE)) throw new Error(`${BEFORE_FILE} exists -- refusing to overwrite`);
    const rows = await prisma.products.findMany({ where: { id: { in: IDS } }, include: { product_media: true } });
    const out = Object.fromEntries(rows.map((p) => [p.id, { status: p.status, pdf_brochure_url: p.pdf_brochure_url, media: p.product_media }]));
    fs.writeFileSync(BEFORE_FILE, JSON.stringify(out, null, 2));
    console.log(`  snapshot of ${rows.length} products -> ${BEFORE_FILE}`);
    return prisma.$disconnect();
  }
  const BEFORE = JSON.parse(fs.readFileSync(BEFORE_FILE, "utf8"));

  // A + B: archive
  for (const [id, label] of Object.entries(ARCHIVE)) {
    const p = await prisma.products.findUnique({ where: { id } });
    if (!p) { console.log(`  [MISSING] ${label}`); continue; }
    const target = REVERT ? BEFORE[id].status : "archived";
    if (p.status === target) { console.log(`  [SKIP] ${label} (${p.status})`); continue; }
    console.log(`  ${label}: ${p.status} -> ${target}`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { status: target, updated_at: new Date() } });
  }

  // C: Nutri-FOV photos
  const target = REVERT ? BEFORE[NUTRI].media.map((m) => ({ ...m, created_at: new Date(m.created_at) })) : NUTRI_MEDIA;
  const missing = target.filter((m) => !fileOk(m.url));
  const cur = await prisma.product_media.findMany({ where: { product_id: NUTRI } });
  const same = cur.length === target.length && target.every((m) => cur.some((x) => x.url === m.url && x.is_primary === m.is_primary && x.sort_order === m.sort_order));
  if (missing.length) console.log(`  [MISSING FILE] ${missing.map((m) => m.url).join(", ")}`);
  else if (same) console.log("  [SKIP] Nutri-FOV photos");
  else {
    console.log(`  Nutri-FOV photos ${cur.map((m) => m.url).join(", ")} -> ${target.map((m) => m.url).join(", ")}`);
    if (WRITE) await prisma.$transaction(async (tx) => {
      await tx.product_media.deleteMany({ where: { product_id: NUTRI } });
      for (const m of target) await tx.product_media.create({ data: m });
      await tx.products.update({ where: { id: NUTRI }, data: { updated_at: new Date() } });
    });
  }

  // D: HYLO brochures
  for (const [id, pdf] of Object.entries(PDFS)) {
    const p = await prisma.products.findUnique({ where: { id } });
    const to = REVERT ? BEFORE[id].pdf_brochure_url : pdf;
    if (!REVERT && !fileOk(pdf)) { console.log(`  [MISSING FILE] ${pdf}`); continue; }
    if (p.pdf_brochure_url === to) { console.log(`  [SKIP] ${p.reference_fournisseur}`); continue; }
    console.log(`  ${p.reference_fournisseur} pdf ${p.pdf_brochure_url} -> ${to}`);
    if (WRITE) await prisma.products.update({ where: { id }, data: { pdf_brochure_url: to, updated_at: new Date() } });
  }

  console.log(WRITE ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply (or --revert)");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
