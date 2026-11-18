import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export const dynamic = 'force-dynamic';

type Localized = { fr: string; en: string };

interface CatalogueBrochure {
  url: string;
  name: Localized;
}

interface CataloguePartner {
  id: string;
  slug: string;
  name: Localized;
  logoUrl: string | null;
  catalogueUrl: string | null;
  brochures: CatalogueBrochure[];
}

interface CatalogueDomain {
  id: string;
  slug: string;
  name: Localized;
  partners: CataloguePartner[];
}

// Display names of the root categories on the Catalogues page (by slug).
// Anything not listed keeps its own translated name.
const DOMAIN_LABELS: Record<string, Localized> = {
  'ophtalmologie': { fr: 'Ophtalmologie', en: 'Ophthalmology' },
  'oph-contactology': { fr: 'Contactologie', en: 'Contactology' },
  'orl-oto-rhino-laryngologie': { fr: 'ORL', en: 'ENT' },
  'mobilier-et-literie-hospitaliers': { fr: 'Literie & mobilier médical', en: 'Medical beds & furniture' },
  'orthopedics': { fr: 'Orthopédie', en: 'Orthopaedics' },
  'dispositifs-medicaux': { fr: 'Pharma', en: 'Pharma' },
};

const OTHER_DOMAIN_ID = 'other';

// Only same-site paths or http(s) links are exposed as download links.
function safeUrl(raw: string | null | undefined): string | null {
  const url = raw?.trim();
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

function pick<T extends { language_code: string }>(rows: T[], lang: string): T | undefined {
  return rows.find((r) => r.language_code === lang);
}

// GET /api/catalogues - public: downloadable PDFs grouped by domain (root category), then by partner.
// Sources: partners.default_pdf_url (catalogue) and products.pdf_brochure_url / PDF product media (brochures).
export async function GET() {
  try {
    const [categories, partners, products] = await Promise.all([
      prisma.categories.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parent_id: true,
          sort_order: true,
          is_active: true,
          category_translations: { select: { language_code: true, name: true } },
        },
      }),
      prisma.partners.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          slug: true,
          logo_url: true,
          default_pdf_url: true,
          sort_order: true,
          partner_translations: { select: { language_code: true, name: true } },
        },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.products.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          category_id: true,
          partner_id: true,
          constructeur: true,
          pdf_brochure_url: true,
          sort_order: true,
          product_translations: { select: { language_code: true, nom: true } },
          product_media: { where: { type: 'pdf' }, select: { url: true }, orderBy: { sort_order: 'asc' }, take: 1 },
        },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      }),
    ]);

    // Root (domain) of every category, walking up the parent chain.
    const byId = new Map(categories.map((c) => [c.id, c]));
    const rootCache = new Map<string, string | null>();
    const rootOf = (categoryId: string): string | null => {
      if (rootCache.has(categoryId)) return rootCache.get(categoryId)!;
      let current = byId.get(categoryId);
      const seen = new Set<string>();
      while (current && current.parent_id && !seen.has(current.id)) {
        seen.add(current.id);
        current = byId.get(current.parent_id);
      }
      const root = current && !current.parent_id && current.is_active ? current.id : null;
      rootCache.set(categoryId, root);
      return root;
    };

    const partnerById = new Map(partners.map((p) => [p.id, p]));
    const partnerBySlug = new Map(partners.map((p) => [p.slug, p]));

    // domainId -> partnerId -> entry
    const groups = new Map<string, Map<string, CataloguePartner>>();
    const entryFor = (domainId: string, partner: (typeof partners)[number]): CataloguePartner => {
      if (!groups.has(domainId)) groups.set(domainId, new Map());
      const domain = groups.get(domainId)!;
      if (!domain.has(partner.id)) {
        domain.set(partner.id, {
          id: partner.id,
          slug: partner.slug,
          name: {
            fr: pick(partner.partner_translations, 'fr')?.name || partner.name,
            en: pick(partner.partner_translations, 'en')?.name || partner.name,
          },
          logoUrl: partner.logo_url,
          catalogueUrl: safeUrl(partner.default_pdf_url),
          brochures: [],
        });
      }
      return domain.get(partner.id)!;
    };

    const partnerDomains = new Map<string, Set<string>>();
    for (const product of products) {
      const partner =
        (product.partner_id && partnerById.get(product.partner_id)) ||
        (!product.partner_id ? partnerBySlug.get(product.constructeur) : undefined);
      if (!partner) continue; // no partner, or partner not active
      const domainId = rootOf(product.category_id);
      if (!domainId) continue; // category outside an active domain

      if (!partnerDomains.has(partner.id)) partnerDomains.set(partner.id, new Set());
      partnerDomains.get(partner.id)!.add(domainId);

      // Same precedence as /api/products: product brochure, then a PDF in the product media.
      const url = safeUrl(product.pdf_brochure_url) || safeUrl(product.product_media[0]?.url);
      if (!url) continue;
      const entry = entryFor(domainId, partner);
      if (url === entry.catalogueUrl || entry.brochures.some((b) => b.url === url)) continue;
      const fr = pick(product.product_translations, 'fr')?.nom;
      const en = pick(product.product_translations, 'en')?.nom;
      entry.brochures.push({ url, name: { fr: fr || en || '', en: en || fr || '' } });
    }

    // Partner catalogues: listed in every domain where the partner has active products.
    for (const partner of partners) {
      if (!safeUrl(partner.default_pdf_url)) continue;
      const domains = partnerDomains.get(partner.id);
      if (domains && domains.size > 0) {
        domains.forEach((domainId) => entryFor(domainId, partner));
      } else {
        entryFor(OTHER_DOMAIN_ID, partner);
      }
    }

    const partnerOrder = new Map(partners.map((p, i) => [p.id, i]));
    const domainList: CatalogueDomain[] = [];
    const rootIds = Array.from(groups.keys()).filter((id) => id !== OTHER_DOMAIN_ID);
    rootIds.sort((a, b) => (byId.get(a)!.sort_order - byId.get(b)!.sort_order) || byId.get(a)!.name.localeCompare(byId.get(b)!.name));

    const toList = (domainId: string) =>
      Array.from(groups.get(domainId)!.values())
        .filter((p) => p.catalogueUrl || p.brochures.length > 0)
        .sort((a, b) => partnerOrder.get(a.id)! - partnerOrder.get(b.id)!);

    for (const id of rootIds) {
      const category = byId.get(id)!;
      const list = toList(id);
      if (list.length === 0) continue;
      domainList.push({
        id,
        slug: category.slug,
        name: DOMAIN_LABELS[category.slug] || {
          fr: pick(category.category_translations, 'fr')?.name || category.name,
          en: pick(category.category_translations, 'en')?.name || category.name,
        },
        partners: list,
      });
    }
    if (groups.has(OTHER_DOMAIN_ID)) {
      const list = toList(OTHER_DOMAIN_ID);
      if (list.length > 0) {
        domainList.push({
          id: OTHER_DOMAIN_ID,
          slug: OTHER_DOMAIN_ID,
          name: { fr: 'Autres partenaires', en: 'Other partners' },
          partners: list,
        });
      }
    }

    return NextResponse.json(
      { success: true, data: domainList },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Public catalogues fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch catalogues' } },
      { status: 500 }
    );
  }
}
