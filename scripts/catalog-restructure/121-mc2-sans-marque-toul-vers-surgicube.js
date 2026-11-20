const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-20 -- owner:
 *  1. MC2: no more MC2 branding, but keep every product and every category.
 *     - the 57 MC2 products lose their manufacturer (partner_id null, constructeur ""), their
 *       brochure (pdf_brochure_url null: it was the MC2 catalogue), the « mc2- » slug prefix and the
 *       « MC2- » reference prefix (now « ORT- »); the « Fabricant : MC2 … » line is removed from the
 *       FR/EN technical sheets;
 *     - the 6 Orthoptie sub-categories lose the « mc2- » slug prefix; « MC2 » is removed from the
 *       Orthoptie and Synoptophore descriptions (FR + EN);
 *     - partner MC2 -> inactive (hidden from Partenaires, logo strip, Catalogues).
 *     Product photos are left untouched (owner: don't edit the images).
 *  2. Toul Meditech becomes SurgiCube: the Opério / SteriStay product moves to the SurgiCube partner
 *     (slug operio-steristay, ref SURGICUBE-OPERIO-STERISTAY, « Toul Meditech » removed from its
 *     names); its homepage banner points to the new slug; partner Toul Meditech -> inactive.
 *
 * No redirects needed: the old slugs were never live (production is in maintenance mode).
 *
 * REVERT POINT: --apply writes 121-before.json (every row/field it changes) next to this script
 * (copy it back into the repo); --revert restores it.
 *
 *   docker cp 121-mc2-sans-marque-toul-vers-surgicube.js <app>:/tmp/121.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/121.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/121.js --apply
 *   docker cp <app>:/tmp/121-before.json scripts/catalog-restructure/     (keep the revert point)
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/121.js --revert  # needs /tmp/121-before.json
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE = path.join(__dirname, "121-before.json");
const now = () => new Date();

const MC2 = "a93a0001-0000-4000-8000-000000000001";
const TOUL = "a70a0001-0000-4000-8000-000000000002";
const SURGICUBE = "a70a0001-0000-4000-8000-000000000001";
const TOUL_SLUG = "toul-meditech-operio-steristay";

const MAKER_LINE = /^[^\S\n]*(Fabricant|Manufacturer)\s*:\s*MC2\b.*(\r?\n)?/gim;
const cleanSheet = s => {
  if (!s) return s;
  const out = s.replace(MAKER_LINE, "").trim();
  return out.length ? out : null;
};
const cleanCatText = s =>
  s == null ? s : s
    .replace(/Matériel d'orthoptie MC2 :/g, "Matériel d'orthoptie :")
    .replace(/MC2 orthoptics equipment:/g, "Orthoptics equipment:")
    .replace(/Synoptophore MC2 /g, "Synoptophore ")
    .replace(/MC2 synoptophore /g, "Synoptophore ");

async function revert() {
  const b = JSON.parse(fs.readFileSync(BEFORE, "utf8"));
  for (const p of b.products) {
    const { id, translations, ...data } = p;
    await prisma.products.update({ where: { id }, data: { ...data, updated_at: now() } });
    for (const t of translations) {
      const { id: tid, ...td } = t;
      await prisma.product_translations.update({ where: { id: tid }, data: td });
    }
  }
  for (const c of b.categories) {
    const { id, translations, ...data } = c;
    await prisma.categories.update({ where: { id }, data: { ...data, updated_at: now() } });
    for (const t of translations) {
      const { id: tid, ...td } = t;
      await prisma.category_translations.update({ where: { id: tid }, data: td });
    }
  }
  for (const pa of b.partners) await prisma.partners.update({ where: { id: pa.id }, data: { status: pa.status, updated_at: now() } });
  for (const bn of b.banners) await prisma.banners.update({ where: { id: bn.id }, data: { cta_url: bn.cta_url, updated_at: now() } });
  console.log(`reverted ${b.products.length} products, ${b.categories.length} categories, ${b.partners.length} partners, ${b.banners.length} banners`);
}

async function main() {
  if (REVERT) return revert();

  const prodSelect = {
    id: true, slug: true, reference_fournisseur: true, constructeur: true, partner_id: true, pdf_brochure_url: true,
    product_translations: { select: { id: true, nom: true, fiche_technique: true } },
  };
  const mc2Products = await prisma.products.findMany({ where: { partner_id: MC2 }, select: prodSelect });
  const toulProducts = await prisma.products.findMany({ where: { slug: TOUL_SLUG }, select: prodSelect });
  const cats = await prisma.categories.findMany({
    where: { OR: [{ slug: { startsWith: "mc2-" } }, { description: { contains: "MC2" } }] },
    select: { id: true, slug: true, description: true, category_translations: { select: { id: true, description: true } } },
  });
  const partners = await prisma.partners.findMany({ where: { id: { in: [MC2, TOUL] } }, select: { id: true, slug: true, status: true } });
  const banners = await prisma.banners.findMany({ where: { cta_url: { contains: TOUL_SLUG } }, select: { id: true, cta_url: true } });

  const before = {
    products: [...mc2Products, ...toulProducts].map(p => ({
      id: p.id, slug: p.slug, reference_fournisseur: p.reference_fournisseur, constructeur: p.constructeur,
      partner_id: p.partner_id, pdf_brochure_url: p.pdf_brochure_url,
      translations: p.product_translations.map(t => ({ id: t.id, nom: t.nom, fiche_technique: t.fiche_technique })),
    })),
    categories: cats.map(c => ({ id: c.id, slug: c.slug, description: c.description,
      translations: c.category_translations.map(t => ({ id: t.id, description: t.description })) })),
    partners, banners,
  };
  console.log(`MC2 products ${mc2Products.length}, Toul products ${toulProducts.length}, categories ${cats.length}, partners ${partners.length}, banners ${banners.length}`);
  if (APPLY) { fs.writeFileSync(BEFORE, JSON.stringify(before, null, 1)); console.log(`revert point -> ${BEFORE}`); }

  let sheets = 0;
  for (const p of mc2Products) {
    const data = {
      partner_id: null, constructeur: "", pdf_brochure_url: null,
      slug: p.slug.replace(/^mc2-/, ""),
      reference_fournisseur: p.reference_fournisseur.replace(/^MC2-/, "ORT-"),
      updated_at: now(),
    };
    if (APPLY) await prisma.products.update({ where: { id: p.id }, data });
    for (const t of p.product_translations) {
      const sheet = cleanSheet(t.fiche_technique);
      if (sheet !== t.fiche_technique) { sheets++; if (APPLY) await prisma.product_translations.update({ where: { id: t.id }, data: { fiche_technique: sheet } }); }
    }
  }
  console.log(`  MC2: ${mc2Products.length} products unbranded, ${sheets} technical sheets cleaned (e.g. ${mc2Products[0]?.slug} -> ${mc2Products[0]?.slug.replace(/^mc2-/, "")})`);

  for (const c of cats) {
    const slug = c.slug.replace(/^mc2-/, "");
    console.log(`  category ${c.slug} -> ${slug}`);
    if (!APPLY) continue;
    await prisma.categories.update({ where: { id: c.id }, data: { slug, description: cleanCatText(c.description), updated_at: now() } });
    for (const t of c.category_translations) {
      const d = cleanCatText(t.description);
      if (d !== t.description) await prisma.category_translations.update({ where: { id: t.id }, data: { description: d } });
    }
  }

  for (const p of toulProducts) {
    console.log(`  ${p.slug} -> operio-steristay (partner SurgiCube)`);
    if (!APPLY) continue;
    await prisma.products.update({ where: { id: p.id }, data: {
      partner_id: SURGICUBE, constructeur: "surgicube-international", slug: "operio-steristay",
      reference_fournisseur: "SURGICUBE-OPERIO-STERISTAY", updated_at: now() } });
    for (const t of p.product_translations)
      await prisma.product_translations.update({ where: { id: t.id }, data: { nom: t.nom.replace(/^Toul Meditech\s+/, "") } });
  }
  for (const b of banners) {
    console.log(`  banner ${b.cta_url} -> ${b.cta_url.replace(TOUL_SLUG, "operio-steristay")}`);
    if (APPLY) await prisma.banners.update({ where: { id: b.id }, data: { cta_url: b.cta_url.replace(TOUL_SLUG, "operio-steristay"), updated_at: now() } });
  }
  for (const pa of partners) {
    console.log(`  partner ${pa.slug}: ${pa.status} -> inactive`);
    if (APPLY) await prisma.partners.update({ where: { id: pa.id }, data: { status: "inactive", updated_at: now() } });
  }
  if (!APPLY) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
