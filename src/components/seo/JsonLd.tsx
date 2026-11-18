import { COMPANY, absoluteUrl, localeUrl, siteUrl, summarize } from '@/lib/seo/site';

/**
 * Server-rendered JSON-LD (schema.org). `<` is escaped so text from the
 * database can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

const ORG_ID = () => `${siteUrl()}/#organization`;

function postalAddress(a: { streetAddress: string; addressLocality: string; addressCountry: string }) {
  return { '@type': 'PostalAddress', ...a };
}

/** Organization + head office + showroom (home page). */
export function organizationJsonLd(locale: string, description: string) {
  const org = {
    '@type': 'Organization',
    '@id': ORG_ID(),
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: siteUrl(),
    logo: absoluteUrl(COMPANY.logo),
    image: absoluteUrl(COMPANY.logo),
    description,
    foundingDate: COMPANY.foundingDate,
    email: COMPANY.email,
    telephone: COMPANY.direction.phones[0],
    faxNumber: COMPANY.direction.fax,
    address: postalAddress(COMPANY.direction),
    areaServed: { '@type': 'Country', name: 'Morocco' },
    sameAs: COMPANY.sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: COMPANY.direction.phones[0],
        email: COMPANY.email,
        areaServed: 'MA',
        availableLanguage: ['French', 'English', 'Arabic'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: COMPANY.exportEmail,
        description: 'Export',
      },
    ],
  };

  const business = (id: string, name: string, place: typeof COMPANY.direction) => ({
    '@type': ['MedicalBusiness', 'LocalBusiness'],
    '@id': `${siteUrl()}/#${id}`,
    name,
    url: localeUrl(locale),
    image: absoluteUrl(COMPANY.logo),
    logo: absoluteUrl(COMPANY.logo),
    telephone: place.phones[0],
    faxNumber: place.fax,
    email: COMPANY.email,
    address: postalAddress(place),
    parentOrganization: { '@id': ORG_ID() },
    sameAs: COMPANY.sameAs,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      business('direction', locale === 'en' ? 'KITMED — Head office' : 'KITMED — Direction', COMPANY.direction),
      business('showroom', 'KITMED — Showroom', COMPANY.showroom),
      {
        '@type': 'WebSite',
        '@id': `${siteUrl()}/#website`,
        url: siteUrl(),
        name: COMPANY.name,
        inLanguage: ['fr', 'en'],
        publisher: { '@id': ORG_ID() },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  description?: string | null;
  url: string;
  images: string[];
  brand?: string | null;
  sku: string;
  category?: string | null;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    ...(p.description ? { description: summarize(p.description, 5000) } : {}),
    url: p.url,
    ...(p.images.length ? { image: p.images.map(absoluteUrl) } : {}),
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    sku: p.sku,
    mpn: p.sku,
    ...(p.category ? { category: p.category } : {}),
    // No price on the site: products are sold on quotation, so no Offer.
  };
}

export function itemListJsonLd(name: string, url: string, items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}
