import type { Metadata } from 'next';
import PartnersPage from './PartnersPageClient';
import { getPublicPartnersWithProducts } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, localeUrl, seoLocale, staticPageMetadata } from '@/lib/seo/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return staticPageMetadata('partners', params.locale);
}

export default async function PartnersServerPage({ params }: { params: { locale: string } }) {
  const locale = seoLocale(params.locale);
  const page = STATIC_PAGES.partners;
  const partners = await getPublicPartnersWithProducts(locale).catch(() => []);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'KITMED', url: localeUrl(locale) },
          { name: page[locale].title.split(' — ')[0], url: localeUrl(locale, page.path) },
        ])}
      />
      {partners.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            page[locale].title,
            localeUrl(locale, page.path),
            partners.map(p => ({ name: p.name, url: localeUrl(locale, `/partners/${p.slug}`) }))
          )}
        />
      )}
      <PartnersPage />
    </>
  );
}
