import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/database';
import { getRecursiveProductCounts } from '@/lib/catalog/category-counts';
import { STATIC_PAGES, SEO_LOCALES, categoryPath, isStaging, languageAlternates, localeUrl } from '@/lib/seo/site';

// Built per request from the database (new products appear without a rebuild)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Entry = MetadataRoute.Sitemap[number];

/** One entry per locale, each listing the fr / en / x-default alternates. */
function entries(path: string, lastModified: Date | undefined, priority: number, changeFrequency: Entry['changeFrequency']): Entry[] {
  return SEO_LOCALES.map(locale => ({
    url: localeUrl(locale, path),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(path) },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Staging is never indexed: empty sitemap
  if (isStaging()) return [];

  const [products, categories, partners, counts] = await Promise.all([
    prisma.products.findMany({
      where: { status: 'active', categories: { is_active: true } },
      select: { slug: true, updated_at: true },
      orderBy: { slug: 'asc' },
    }),
    prisma.categories.findMany({
      where: { is_active: true },
      select: { id: true, slug: true, type: true, parent_id: true, updated_at: true },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.partners.findMany({
      where: { status: 'active', products: { some: { status: 'active' } } },
      select: { slug: true, updated_at: true },
      orderBy: { sort_order: 'asc' },
    }),
    getRecursiveProductCounts(),
  ]);

  const latest = products.reduce<Date | undefined>(
    (max, p) => (!max || p.updated_at > max ? p.updated_at : max),
    undefined
  );

  const staticEntries = Object.values(STATIC_PAGES).flatMap(page =>
    entries(
      page.path,
      ['', '/products/disciplines', '/partners'].includes(page.path) ? latest : undefined,
      page.priority,
      page.priority >= 0.8 ? 'weekly' : page.priority >= 0.5 ? 'monthly' : 'yearly'
    )
  );

  const categoryEntries = categories
    // An empty category is never linked on the site
    .filter(c => (counts.get(c.id) || 0) > 0)
    .flatMap(c =>
      entries(
        categoryPath({ slug: c.slug, type: c.type, parentId: c.parent_id }),
        c.updated_at,
        c.parent_id ? 0.7 : 0.9,
        'weekly'
      )
    );

  const partnerEntries = partners.flatMap(p => entries(`/partners/${p.slug}`, p.updated_at, 0.7, 'weekly'));
  const productEntries = products.flatMap(p => entries(`/products/${p.slug}`, p.updated_at, 0.8, 'monthly'));

  return [...staticEntries, ...categoryEntries, ...partnerEntries, ...productEntries];
}
