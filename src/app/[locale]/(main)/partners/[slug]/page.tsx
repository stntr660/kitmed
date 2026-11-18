import type { Metadata } from 'next';
import { cache } from 'react';
import PartnerProductsPage from './PartnerPageClient';
import { getPublicPartner } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, absoluteUrl, buildPageMetadata, localeUrl, seoLocale, summarize } from '@/lib/seo/site';

interface PageProps {
  params: { slug: string; locale: string };
}

const loadPartner = cache((slug: string, locale: string) => getPublicPartner(slug, locale));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = seoLocale(params.locale);
  const partner = await loadPartner(params.slug, locale);
  if (!partner) {
    return { title: { absolute: 'KITMED' }, robots: { index: false } };
  }
  const title =
    locale === 'en'
      ? `${partner.name} — products distributed in Morocco | KITMED`
      : `${partner.name} — produits distribués au Maroc | KITMED`;
  const fallback =
    locale === 'en'
      ? `KITMED distributes ${partner.name} in Morocco: ${partner.productCount} products, advice, installation and after-sales service from Casablanca.`
      : `KITMED distribue ${partner.name} au Maroc : ${partner.productCount} produits, conseil, installation et service après-vente depuis Casablanca.`;
  return buildPageMetadata({
    locale,
    path: `/partners/${partner.slug}`,
    title,
    description: summarize(partner.description || fallback, 155),
    images: partner.logoUrl ? [{ url: partner.logoUrl, alt: partner.name }] : undefined,
  });
}

export default async function PartnerPage({ params }: PageProps) {
  const locale = seoLocale(params.locale);
  const partner = await loadPartner(params.slug, locale).catch(() => null);
  const url = partner ? localeUrl(locale, `/partners/${partner.slug}`) : '';

  return (
    <>
      {partner && (
        <>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'Brand',
              name: partner.name,
              url,
              ...(partner.logoUrl ? { logo: absoluteUrl(partner.logoUrl) } : {}),
              ...(partner.description ? { description: summarize(partner.description, 1000) } : {}),
              ...(partner.websiteUrl ? { sameAs: [partner.websiteUrl] } : {}),
            }}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'KITMED', url: localeUrl(locale) },
              { name: STATIC_PAGES.partners[locale].title.split(' — ')[0], url: localeUrl(locale, STATIC_PAGES.partners.path) },
              { name: partner.name, url },
            ])}
          />
        </>
      )}
      <PartnerProductsPage params={params} />
    </>
  );
}
