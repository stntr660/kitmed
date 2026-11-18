import type { Metadata } from 'next';
import { cache } from 'react';
import DisciplineCategoriesPage from './DisciplinePageClient';
import { getPublicCategory, getPublicDiscipline } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, buildPageMetadata, localeUrl, seoLocale, summarize } from '@/lib/seo/site';

interface PageProps {
  params: { slug: string; locale: string };
}

const loadDiscipline = cache((slug: string, locale: string) => getPublicDiscipline(slug, locale));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = seoLocale(params.locale);
  const discipline = await loadDiscipline(params.slug, locale);
  if (!discipline) {
    return { title: { absolute: 'KITMED' }, robots: { index: false } };
  }
  const title = discipline.metaTitle || `${discipline.name} — ${locale === 'en' ? 'medical equipment' : 'équipements médicaux'} | KITMED`;
  const families = discipline.other_categories.slice(0, 6).map(c => c.name).join(', ');
  const fallback =
    locale === 'en'
      ? `${discipline.name} at KITMED, Casablanca: ${families}. ${discipline.productCount} products from international brands. Ask for a quote.`
      : `${discipline.name} chez KITMED, Casablanca : ${families}. ${discipline.productCount} produits de marques internationales. Demandez un devis.`;
  return buildPageMetadata({
    locale,
    path: `/products/disciplines/${discipline.slug}`,
    title,
    description: summarize(discipline.metaDescription || discipline.description || fallback, 155),
    images: discipline.imageUrl ? [{ url: discipline.imageUrl, alt: discipline.name }] : undefined,
  });
}

export default async function DisciplinePage({ params }: PageProps) {
  const locale = seoLocale(params.locale);
  const discipline = await loadDiscipline(params.slug, locale).catch(() => null);

  // Same rule as the client: no sub-category but products -> list the products
  let products: any[] | null = null;
  if (discipline && discipline.other_categories.length === 0 && discipline.productCount > 0) {
    const category = await getPublicCategory(params.slug, locale, { includeProducts: true }).catch(() => null);
    products = category?.products || [];
  }

  const url = localeUrl(locale, `/products/disciplines/${params.slug}`);

  return (
    <>
      {discipline && (
        <>
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'KITMED', url: localeUrl(locale) },
              { name: locale === 'en' ? 'Products' : 'Produits', url: localeUrl(locale, STATIC_PAGES.disciplines.path) },
              { name: discipline.name, url },
            ])}
          />
          <JsonLd
            data={itemListJsonLd(
              discipline.name,
              url,
              discipline.other_categories.length
                ? discipline.other_categories.map(c => ({ name: c.name, url: localeUrl(locale, `/products/categories/${c.slug}`) }))
                : (products || []).map((p: any) => ({
                    name: p.translations?.[0]?.nom || p.referenceFournisseur,
                    url: localeUrl(locale, `/products/${p.slug}`),
                  }))
            )}
          />
        </>
      )}
      <DisciplineCategoriesPage
        params={params}
        initialDiscipline={discipline as any}
        initialProducts={products}
      />
    </>
  );
}
