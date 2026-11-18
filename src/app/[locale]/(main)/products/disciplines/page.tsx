import type { Metadata } from 'next';
import ProductsByDisciplinePage from './DisciplinesPageClient';
import { getPublicRootCategories } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, localeUrl, seoLocale, staticPageMetadata } from '@/lib/seo/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return staticPageMetadata('disciplines', params.locale);
}

export default async function DisciplinesPage({ params }: { params: { locale: string } }) {
  const locale = seoLocale(params.locale);
  // Same request as the client (/api/categories?includeProductCount=true)
  const categories = await getPublicRootCategories(locale, { includeProductCount: true }).catch(() => null);
  const page = STATIC_PAGES.disciplines;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'KITMED', url: localeUrl(locale) },
          { name: page[locale].title.split(' — ')[0], url: localeUrl(locale, page.path) },
        ])}
      />
      {categories && (
        <JsonLd
          data={itemListJsonLd(
            page[locale].title,
            localeUrl(locale, page.path),
            categories.map(c => ({ name: c.name, url: localeUrl(locale, `/products/disciplines/${c.slug}`) }))
          )}
        />
      )}
      <ProductsByDisciplinePage initialCategories={categories as any} />
    </>
  );
}
