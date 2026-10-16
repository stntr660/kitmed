const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Batch 2026-10-16 -- KITMED's second review of the staging catalogue.
 *
 * A) ophthalmology families: Segment antérieur right after Lampes à fente,
 *    Tables motorisées last
 * B) sub-family order: Matériel de réfraction (Réfractomètres / Kératomètres
 *    first, renamed), Diagnostic rétine (OCT first, Micropérimètres last)
 * C) product order by brand inside Lampes à fente (Haag-Streit, Keeler,
 *    Mediworks) and Verres et ophtalmoscopes (Ocular, Ray Vision, HEINE)
 * D) removals, ARCHIVED (status only): FCI knives, and in Instrumentation
 *    everything except "Instruments FCI" and "Instruments Moria" (one of them
 *    linked a "bon de commande" instead of a sales brochure)
 * E) sales brochures attached; a file is linked only if the staging URL
 *    answers with a real PDF, wrong ones are removed
 * F) photos replaced (Affinity II / III) and NIDEK Phantom added to the
 *    homepage slider
 *
 * Run INSIDE the staging app container: /app/public/uploads is the mounted
 * volume, so the file checks see what the site serves.
 * /app is not writable, so the script runs from /tmp against /app's modules:
 *   docker cp 59-client-feedback-2026-10-16.js <app>:/tmp/59.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/59.js          # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/59.js --apply
 * The new brochures and photos (kitmed-2026-10-*.pdf, affinity-2-3.jpg,
 * phantom-slider.png) were copied to the volume first.
 *
 * Rollback: pg_dump taken first,
 *   backups/kitmed_staging_before_client_feedback_2026-10-16.dump
 */

const APPLY = process.argv.includes("--apply");
const UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
const SITE = process.env.SITE_URL || "https://kitmed-staging.zonemation.cloud";

// ------------------------------------------------------------ A. families
// « Segment antérieur devient après lampe à fente », « Table motorisée la dernière »
const OPHTHALMOLOGY_ORDER = [
  "table-de-consultation",
  "materiel-de-refraction",
  "lampe-a-fente",
  "segment-anterieur",
  "verres-ophtalmoscope-et-skeepens",
  "lasers-et-ipl",
  "diagnostic-retine",
  "biometrie-contact-sans-contact-et-echographie",
  "gonioscope",
  "bloc-operatoire",
  "consommable",
  "oculoplastie-fci",
  "valves",
  "oph-contactology",
  "simulateur",
  "autres",
  "table-motorisee",
];

// ------------------------------------------------------ B. sub-families
// parent slug -> children in client order; unlisted children keep their
// relative order after these
const SUBFAMILY_ORDER = {
  "materiel-de-refraction": [
    "auto-refractometres", // « Auto-réfractomètre en premier, renommé réfractomètre / kératomètre »
    "refracteurs",
    "ecran-optotype",      // Afficheurs de tests
    "frontofocometre",
    "pupillometres",       // « Loubliometre »
  ],
  "diagnostic-retine": [
    "oct-et-imagerie",     // OCT et OCT-A
    "retinographes",
    "plateformes-multimodales",
    "perimetres",
    "champ-visuel-electrophysiologie", // shown as « Micropérimètres »
  ],
};

const CATEGORY_RENAME = {
  "auto-refractometres": ["Réfractomètres / Kératomètres", "Refractometers / Keratometers"],
};

// ----------------------------------------------------- C. product order
const PRODUCT_ORDER = {
  "lampe-a-fente": [
    "Nouveau 2025", "BQ-900", "BM-900", "BI-900", "-", "7220531", // Haag-Streit (Elara, lamps, IM modules, AT 900)
    "SYMPHONY-Q", "3020-P-2139", "3010-P-2000",                    // Keeler
    "S390I",                                                       // Mediworks
  ],
  // « Verre ophta » -- one category, sorted by brand: lenses first, then
  // trial sets and frames, then ophthalmoscopes
  "verres-ophtalmoscope-et-skeepens": [
    "OCU-MKBIIKV0", "OCU-MKBIIKN1", "OACF-15",                     // Ocular exam / laser lenses + accessories
    "TL-R60", "TL-S30", "TL-L15", "TL-G40", "TL-E80", "TL-V20",    // Ray Vision trial lens sets
    "TF-P50", "TF-K30", "TF-K65", "TF-E40",                        // Ray Vision trial frames
    "HEINE-OMEGA-600", "slug:ophtalmoscope-indirect-binoculaire-omega-500-led", // HEINE indirect
    "HEINE-BETA-200S-LED", "slug:ophtalmoscope-beta-200-led",                    // HEINE direct
    "slug:ensemble-diagnostique-beta-200-led-ophtalmoscope-otoscope", "slug:ophtalmoscope-mini-3000-led",
  ],
};

// -------------------------------------------------------- D. removals
// key: reference_fournisseur, or "slug:<product slug>" when the reference is
// a list of codes
const ARCHIVE = {
  "COUTEAUX": "« Remove : couteaux FCI »",
  "BONSDECO": "Instrumentation : seuls « Instruments FCI » et « Instruments Moria » restent ; son PDF est un bon de commande",
  "slug:boite-dacryocystorhinostomie": "Instrumentation : seuls « Instruments FCI » et « Instruments Moria » restent",
};

// ------------------------------------------------------- E. brochures
// reference -> URL under /uploads (null = remove a wrong brochure)
const B = (slug) => `/uploads/pdfs/kitmed-2026-10-${slug}-brochure.pdf`;
const BROCHURES = {
  "Nouveau 2025":     "/uploads/pdfs/hs-elara900-fl-xxx-en-web-1772807575593-6660a630.pdf", // Elara 900, already on the volume
  "LYPOP":            B("lypop"),          // nidek.fr, FR, 4 p.
  "TONOREF-III":      B("tonoref-iii"),    // nidek.fr, FR, 6 p.
  "YC-200":           B("yc-200"),         // nidek.fr, FR, YC-200 + YC-200 S Plus
  "YLC-500":          B("ylc-500"),        // nidek.fr, FR, GYC / YLC / MC-500 range brochure (only one offered)
  "HAAG-OCTOPUS-900": B("octopus-900"),    // haag-streit.com, EN -- replaces the clinical compendium
  "7220001":          B("octopus-600"),    // haag-streit.com, EN -- replaces the clinical compendium
  "RS-1":             B("rs-1"),           // nidek.fr, FR, 2 p. leaflet
  "CV-9000":          B("cv-9000"),        // nidek-intl.com, EN, Cube α
  "RS-330-DUO2":      B("rs-330-duo2"),    // nidek.fr, FR (the volume only had the EN spec sheet)
  "ARTISAN APHAKIA":  B("artisan-aphakia"),// ophtec.com factsheet -- was the surgical procedure
  "Biovis-1.6":       B("biovis"),         // medicontur.com, FR, BioVis family infosheet
  "Biovis-1.8":       B("biovis"),
  "Biovis-3.0":       B("biovis"),
  "VISCO-MC":         B("visco-mc"),       // medicontur.com, FR infosheet
  "PHANTOM":          B("phantom"),        // nidek.fr, FR, 12 p., Sept 2026
  // DUOVISC-HILURON and the ACUVUE lenses: the makers publish no brochure
};

// ---------------------------------------------------------- F. photos
// reference -> file under public/uploads/products (becomes the primary image)
const PRIMARY_IMAGES = {
  "OT-2200": "affinity-2-3.jpg", // « Affinity 2/3 should have a clearer photo » -- nidek.fr original, 1600 px
};

// « Nidek Phantom should be added on slider »
const BANNERS = [
  {
    title: "Phantom", file: "phantom-slider.png", sort: 4,
    cta_url: "/fr/products/phantom-open-field-refraction-system-phantom",
    fr: { title: "Phantom", subtitle: "La réfraction en champ ouvert", cta: "Découvrir",
          description: "Système de réfraction binoculaire NIDEK en champ ouvert : le patient regarde au loin, sans réfracteur devant les yeux." },
    en: { title: "Phantom", subtitle: "Open-field refraction", cta: "Discover",
          description: "NIDEK binocular open-field refraction system: the patient looks into the distance, with no phoropter in front of the eyes." },
  },
];

// ============================================================================

const log = [];
const say = (s) => { console.log(s); log.push(s); };
const now = () => new Date();

async function product(key) {
  const where = key.startsWith("slug:") ? { slug: key.slice(5) } : { reference_fournisseur: key };
  const p = await prisma.products.findUnique({
    where,
    include: { product_translations: true, product_media: true, categories: { select: { slug: true } } },
  });
  if (!p) say(`  [MISSING PRODUCT] ${key}`);
  return p;
}
const frName = (p) => p.product_translations.find((t) => t.language_code === "fr")?.nom || p.reference_fournisseur;

const pdfCache = new Map();
async function isPdf(url) {
  if (pdfCache.has(url)) return pdfCache.get(url);
  let ok = false;
  try {
    const res = await fetch(`${SITE}${encodeURI(decodeURI(url))}`, { headers: { Range: "bytes=0-4" } });
    ok = res.ok && Buffer.from(await res.arrayBuffer()).slice(0, 4).toString() === "%PDF";
  } catch { ok = false; }
  pdfCache.set(url, ok);
  return ok;
}

async function setCategoryNames(cat, fr, en) {
  for (const [lang, name] of [["fr", fr], ["en", en]]) {
    const tr = await prisma.category_translations.findUnique({
      where: { category_id_language_code: { category_id: cat.id, language_code: lang } },
    });
    if (tr && tr.name === name) continue;
    say(`    ${lang}: "${tr ? tr.name : "(none)"}" -> "${name}"`);
    if (!APPLY) continue;
    if (tr) await prisma.category_translations.update({ where: { id: tr.id }, data: { name } });
    else await prisma.category_translations.create({ data: { id: randomUUID(), category_id: cat.id, language_code: lang, name } });
  }
  if (cat.name !== fr && APPLY) await prisma.categories.update({ where: { id: cat.id }, data: { name: fr, updated_at: now() } });
}

async function orderChildren(parentSlug, slugs) {
  const parent = await prisma.categories.findUnique({ where: { slug: parentSlug } });
  if (!parent) { say(`  [MISSING] ${parentSlug}`); return; }
  const children = await prisma.categories.findMany({ where: { parent_id: parent.id }, orderBy: [{ sort_order: "asc" }, { slug: "asc" }] });
  const rest = children.filter((c) => !slugs.includes(c.slug));
  const ordered = [...slugs.map((s) => children.find((c) => c.slug === s) || s), ...rest];
  for (const [i, c] of ordered.entries()) {
    if (typeof c === "string") { say(`  [MISSING] ${c} sous ${parentSlug}`); continue; }
    const sort = i + 1;
    say(`  ${String(sort).padStart(2)}. ${c.slug}${c.is_active ? "" : " [OFF]"}${c.sort_order !== sort ? `  (sort ${c.sort_order} -> ${sort})` : ""}`);
    if (APPLY && c.sort_order !== sort) await prisma.categories.update({ where: { id: c.id }, data: { sort_order: sort, updated_at: now() } });
  }
}

async function main() {
  say(`=== Client feedback 2026-10-16 ===`);
  say(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}  uploads: ${UPLOADS}\n`);
  const activeBefore = await prisma.products.count({ where: { status: "active" } });

  say("--- A. familles ophtalmologie ---");
  await orderChildren("ophtalmologie", OPHTHALMOLOGY_ORDER);

  say("\n--- B. sous-familles ---");
  for (const [parent, slugs] of Object.entries(SUBFAMILY_ORDER)) {
    say(` ${parent}`);
    await orderChildren(parent, slugs);
  }
  for (const [slug, [fr, en]] of Object.entries(CATEGORY_RENAME)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    if (!cat) { say(`  [MISSING] ${slug}`); continue; }
    say(`  ~ ${slug}`);
    await setCategoryNames(cat, fr, en);
  }

  say("\n--- C. ordre des produits ---");
  for (const [slug, refs] of Object.entries(PRODUCT_ORDER)) {
    const cat = await prisma.categories.findUnique({ where: { slug } });
    for (const [i, ref] of refs.entries()) {
      const p = await product(ref);
      if (!p) continue;
      if (p.category_id !== cat.id) { say(`  [ELSEWHERE] ${ref} est dans ${p.categories.slug}`); continue; }
      const sort = (i + 1) * 10;
      say(`  ${String(sort).padStart(3)} ${p.constructeur.padEnd(16)} ${frName(p).slice(0, 50)}${p.sort_order !== sort ? `  (${p.sort_order} -> ${sort})` : ""}`);
      if (APPLY && p.sort_order !== sort) await prisma.products.update({ where: { id: p.id }, data: { sort_order: sort, updated_at: now() } });
    }
    const listed = [];
    for (const ref of refs) { const p = await product(ref); if (p) listed.push(p.id); }
    const others = await prisma.products.findMany({ where: { category_id: cat.id, status: "active", id: { notIn: listed } } });
    for (const o of others) {
      say(`  [NON LISTÉ] ${o.reference_fournisseur} -> 999`);
      if (APPLY) await prisma.products.update({ where: { id: o.id }, data: { sort_order: 999, updated_at: now() } });
    }
  }

  say("\n--- D. produits archivés ---");
  for (const [key, why] of Object.entries(ARCHIVE)) {
    const p = await product(key);
    if (!p) continue;
    if (p.status !== "active") { say(`  [SKIP] ${key.slice(0, 40)} déjà ${p.status}`); continue; }
    say(`  x [${p.categories.slug}] ${frName(p).slice(0, 70)}\n      ${why}`);
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data: { status: "archived", updated_at: now() } });
  }

  say("\n--- E. brochures ---");
  for (const [ref, url] of Object.entries(BROCHURES)) {
    const p = await product(ref);
    if (!p) continue;
    if (url && !(await isPdf(url))) { say(`  [NOT A PDF ON STAGING] ${ref} ${url}`); continue; }
    if (p.pdf_brochure_url === url) { say(`  [SKIP] ${ref} déjà à jour`); continue; }
    say(`  ${ref.padEnd(16)} ${frName(p).slice(0, 40)}: ${p.pdf_brochure_url || "(aucune)"} -> ${url || "(retirée)"}`);
    if (!APPLY) continue;
    await prisma.products.update({ where: { id: p.id }, data: { pdf_brochure_url: url, updated_at: now() } });
    // a pdf media row would still be served when the field is empty
    if (!url) await prisma.product_media.deleteMany({ where: { product_id: p.id, type: "pdf" } });
  }

  say("\n--- F1. photos produits ---");
  for (const [ref, file] of Object.entries(PRIMARY_IMAGES)) {
    const p = await product(ref);
    if (!p) continue;
    if (!fs.existsSync(path.join(UPLOADS, "products", file))) { say(`  [NO FILE] ${ref} (${file})`); continue; }
    const url = `/uploads/products/${file}`;
    const current = p.product_media.find((m) => m.type === "image" && m.is_primary);
    if (current && current.url === url) { say(`  [SKIP] ${ref} a déjà ${file}`); continue; }
    say(`  ${ref}: ${current ? current.url : "(aucune)"} -> ${url}`);
    if (!APPLY) continue;
    await prisma.product_media.updateMany({ where: { product_id: p.id, type: "image" }, data: { is_primary: false } });
    await prisma.product_media.updateMany({ where: { product_id: p.id, type: "image" }, data: { sort_order: { increment: 1 } } });
    await prisma.product_media.create({
      data: { id: randomUUID(), product_id: p.id, type: "image", url, alt_text: frName(p), sort_order: 0, is_primary: true },
    });
  }

  say("\n--- F2. slider ---");
  for (const b of BANNERS) {
    if (!fs.existsSync(path.join(UPLOADS, "banners", b.file))) { say(`  [NO FILE] ${b.title} (${b.file})`); continue; }
    const exists = await prisma.banners.findFirst({ where: { title: b.title, position: "homepage" } });
    if (exists) { say(`  [EXISTS] ${b.title}`); continue; }
    say(`  + ${b.title} (ordre ${b.sort}) -> ${b.cta_url}`);
    if (!APPLY) continue;
    const later = await prisma.banners.findMany({ where: { position: "homepage", is_active: true, sort_order: { gte: b.sort } } });
    for (const l of later) await prisma.banners.update({ where: { id: l.id }, data: { sort_order: l.sort_order + 1, updated_at: now() } });
    await prisma.banners.create({
      data: {
        id: randomUUID(), title: b.fr.title, subtitle: b.fr.subtitle, description: b.fr.description,
        image_url: `/uploads/banners/${b.file}`, cta_text: b.fr.cta, cta_url: b.cta_url, cta_style: "primary",
        position: "homepage", layout: "split", text_align: "left", overlay_opacity: 0.9,
        sort_order: b.sort, is_active: true, updated_at: now(),
        banner_translations: { create: ["fr", "en"].map((lang) => ({
          id: randomUUID(), language_code: lang, title: b[lang].title, subtitle: b[lang].subtitle,
          description: b[lang].description, cta_text: b[lang].cta,
        })) },
      },
    });
  }

  const activeAfter = await prisma.products.count({ where: { status: "active" } });
  say(`\n  produits actifs: ${activeBefore} -> ${activeAfter}`);
  say(`\n${APPLY ? "=== DONE ===" : "[DRY-RUN] Re-run with --apply"}`);

  const out = path.join(__dirname, `59-client-feedback-2026-10-16.${APPLY ? "apply" : "dry-run"}.log`);
  try { fs.writeFileSync(out, log.join("\n") + "\n"); } catch { /* read-only image: stdout has it */ }
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
