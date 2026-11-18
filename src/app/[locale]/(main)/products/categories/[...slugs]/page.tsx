import type { Metadata } from 'next';
import { cache } from 'react';
import CategoryHierarchyPage from './CategoryPageClient';
import { getPublicCategory } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, buildPageMetadata, categoryUrl, localeUrl, seoLocale, summarize } from '@/lib/seo/site';

interface PageProps {
  params: { slugs: string[]; locale: string };
}

// Same request as the client (/api/categories/[slug]?includeChildren=true&includeProducts=true)
const loadCategory = cache((slug: string, locale: string) =>
  getPublicCategory(slug, locale, { includeChildren: true, includeProducts: true })
);

function trail(category: any): any[] {
  const path: any[] = [];
  let current = category;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = seoLocale(params.locale);
  const slug = params.slugs[params.slugs.length - 1];
  const category = await loadCategory(slug, locale);
  if (!category) {
    return { title: { absolute: 'KITMED' }, robots: { index: false } };
  }
  const path = trail(category);
  const parentName = path.length > 1 ? path[0].name : null;
  const title =
    category.metaTitle ||
    `${category.name}${parentName && parentName !== category.name ? ` — ${parentName}` : ''} | KITMED`;
  const fallback =
    locale === 'en'
      ? `${category.name}: ${category.productCount} medical products and equipment available from KITMED, Casablanca, Morocco. Ask for a quote.`
      : `${category.name} : ${category.productCount} produits et équipements médicaux disponibles chez KITMED, Casablanca, Maroc. Demandez un devis.`;
  return buildPageMetadata({
    locale,
    // Leaf slug = one canonical URL whatever the path used to reach it
    path: `/products/categories/${category.slug}`,
    title,
    description: summarize(category.metaDescription || category.description || fallback, 155),
    images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const locale = seoLocale(params.locale);
  const slug = params.slugs[params.slugs.length - 1];
  const category = await loadCategory(slug, locale).catch(() => null);

  const jsonLd = category
    ? [
        breadcrumbJsonLd([
          { name: 'KITMED', url: localeUrl(locale) },
          { name: locale === 'en' ? 'Products' : 'Produits', url: localeUrl(locale, STATIC_PAGES.disciplines.path) },
          ...trail(category).map((c: any, i: number, all: any[]) => ({
            name: c.name,
            url: categoryUrl(locale, { slug: c.slug, type: c.type, parentId: i === 0 ? null : all[i - 1].id }),
          })),
        ]),
        itemListJsonLd(
          category.name,
          localeUrl(locale, `/products/categories/${category.slug}`),
          category.children?.length
            ? category.children.map((c: any) => ({ name: c.name, url: localeUrl(locale, `/products/categories/${c.slug}`) }))
            : (category.products || []).map((p: any) => ({
                name: p.translations?.[0]?.nom || p.referenceFournisseur,
                url: localeUrl(locale, `/products/${p.slug}`),
              }))
        ),
      ]
    : [];

  return (
    <>
      {jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <CategoryHierarchyPage params={params} initialCategory={category} />
    </>
  );
}
