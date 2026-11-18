import type { Metadata } from 'next';
import { headers } from 'next/headers';

/**
 * SEO helpers shared by generateMetadata, JSON-LD, robots.ts, sitemap.ts and
 * llms.txt. Production base URL comes from NEXT_PUBLIC_SITE_URL (default
 * https://kitmed.ma). Staging is detected by NEXT_PUBLIC_SITE_ENV=staging or a
 * request host containing "staging": it is never indexed (noindex + robots.txt
 * Disallow: /).
 */

export const SEO_LOCALES = ['fr', 'en'] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];
export const DEFAULT_SEO_LOCALE: SeoLocale = 'fr';

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://kitmed.ma').replace(/\/+$/, '');
}

export function seoLocale(locale: string | undefined): SeoLocale {
  return locale === 'en' ? 'en' : 'fr';
}

/** Host of the current request ('' outside a request, e.g. at build time). */
export function requestHost(): string {
  try {
    const h = headers();
    return (h.get('x-forwarded-host') || h.get('host') || '').toLowerCase();
  } catch {
    return '';
  }
}

export function isStaging(host: string = requestHost()): boolean {
  if ((process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase() === 'staging') return true;
  return host.includes('staging');
}

/** Absolute URL on the public site; absolute URLs (CDN images) are kept. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** `/{locale}{path}` as an absolute URL. `path` is '' for the home page or starts with '/'. */
export function localeUrl(locale: string, path: string = ''): string {
  return `${siteUrl()}/${seoLocale(locale)}${path}`;
}

export function languageAlternates(path: string = ''): Record<string, string> {
  return {
    fr: localeUrl('fr', path),
    en: localeUrl('en', path),
    'x-default': localeUrl(DEFAULT_SEO_LOCALE, path),
  };
}

/** Plain text, collapsed whitespace, cut on a word boundary (~155 chars for meta descriptions). */
export function summarize(text: string | null | undefined, max = 155): string {
  if (!text) return '';
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

export function robotsMetadata(): Metadata['robots'] {
  if (isStaging()) {
    return { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };
  }
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export const SITE_NAME = 'KITMED';
export const DEFAULT_OG_IMAGE = '/images/logos/kitmed-logo-original.png';

interface PageMetadataInput {
  locale: string;
  /** Path after the locale: '' for home, '/products/xyz' otherwise. */
  path: string;
  title: string;
  description: string;
  images?: Array<{ url: string; alt?: string }>;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/** Full per-page metadata: title, description, canonical, hreflang, Open Graph, Twitter, robots. */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  images,
  type = 'website',
  noindex,
}: PageMetadataInput): Metadata {
  const loc = seoLocale(locale);
  const url = localeUrl(loc, path);
  const ogImages = (images && images.length > 0 ? images : [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }]).map(img => ({
    url: absoluteUrl(img.url),
    alt: img.alt || title,
  }));
  const robots = noindex ? { index: false, follow: true } : robotsMetadata();

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: loc === 'fr' ? 'fr_MA' : 'en_US',
      alternateLocale: loc === 'fr' ? ['en_US'] : ['fr_MA'],
      type,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map(i => i.url),
    },
    robots: isStaging() ? robotsMetadata() : robots,
  };
}

// ---------------------------------------------------------------------------
// Company facts (footer / about page) used by JSON-LD and llms.txt
// ---------------------------------------------------------------------------

export const COMPANY = {
  name: 'KITMED',
  legalName: 'KITMED',
  foundingDate: '1997',
  email: 'info@kitmed.ma',
  exportEmail: 'export@kitmed.ma',
  logo: '/images/logos/kitmed-logo-original.png',
  sameAs: [
    'https://www.facebook.com/share/1E9mpRMbRD/',
    'https://www.instagram.com/kitmed.maroc',
    'https://www.linkedin.com/company/kitmed/',
  ],
  direction: {
    streetAddress: '20, rue Lalande, Quartier des Hôpitaux',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
    phones: ['+212522860366', '+212522860431'],
    fax: '+212522860416',
  },
  showroom: {
    streetAddress: '33, rue Lahcen El Arjoune, Quartier des Hôpitaux',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
    phones: ['+212522863427', '+212522860856'],
    fax: '+212522860416',
  },
};

// ---------------------------------------------------------------------------
// Static pages: titles / descriptions per locale (also listed in the sitemap)
// ---------------------------------------------------------------------------

export const STATIC_PAGES: Record<
  string,
  { path: string; priority: number; fr: { title: string; description: string }; en: { title: string; description: string } }
> = {
  home: {
    path: '',
    priority: 1,
    fr: {
      title: 'KITMED — Distributeur d’équipements médicaux au Maroc depuis 1997',
      description:
        'KITMED, Casablanca : équipements et dispositifs médicaux en ophtalmologie, orthoptie, contactologie, ORL, orthopédie, literie et mobilier médical. Devis et SAV.',
    },
    en: {
      title: 'KITMED — Medical equipment distributor in Morocco since 1997',
      description:
        'KITMED, Casablanca: medical equipment and devices for ophthalmology, orthoptics, contact lenses, ENT, orthopaedics, hospital beds and furniture. Quotes and service.',
    },
  },
  about: {
    path: '/about',
    priority: 0.6,
    fr: {
      title: 'À propos de KITMED — Équipements médicaux à Casablanca depuis 1997',
      description:
        'Depuis 1997, KITMED distribue au Maroc les équipements médicaux de marques internationales et accompagne les professionnels de santé : conseil, installation, SAV.',
    },
    en: {
      title: 'About KITMED — Medical equipment in Casablanca since 1997',
      description:
        'Since 1997, KITMED has supplied Moroccan healthcare professionals with medical equipment from international brands, with advice, installation and service.',
    },
  },
  contact: {
    path: '/contact',
    priority: 0.6,
    fr: {
      title: 'Contact — KITMED Casablanca',
      description:
        'Contactez KITMED : direction au 20, rue Lalande et showroom au 33, rue Lahcen El Arjoune, Quartier des Hôpitaux, Casablanca. Tél. +212 522 86 03 66.',
    },
    en: {
      title: 'Contact — KITMED Casablanca',
      description:
        'Contact KITMED: head office at 20 rue Lalande and showroom at 33 rue Lahcen El Arjoune, Quartier des Hôpitaux, Casablanca. Phone +212 522 86 03 66.',
    },
  },
  sav: {
    path: '/sav',
    priority: 0.5,
    fr: {
      title: 'Service après-vente (SAV) — KITMED',
      description:
        'Demande d’intervention, maintenance et réparation de vos équipements médicaux KITMED : notre service après-vente vous répond à Casablanca et partout au Maroc.',
    },
    en: {
      title: 'After-sales service — KITMED',
      description:
        'Service requests, maintenance and repair of your KITMED medical equipment: our after-sales team answers from Casablanca, across Morocco.',
    },
  },
  catalogues: {
    path: '/catalogues',
    priority: 0.6,
    fr: {
      title: 'Catalogues et brochures produits — KITMED',
      description:
        'Téléchargez les catalogues et brochures des équipements médicaux distribués par KITMED, classés par domaine et par marque.',
    },
    en: {
      title: 'Product catalogues and brochures — KITMED',
      description:
        'Download catalogues and brochures for the medical equipment distributed by KITMED, by specialty and by brand.',
    },
  },
  rfp: {
    path: '/rfp/new',
    priority: 0.5,
    fr: {
      title: 'Demande de devis — KITMED',
      description:
        'Demandez un devis pour vos équipements et dispositifs médicaux : KITMED vous répond rapidement avec une offre adaptée à votre établissement.',
    },
    en: {
      title: 'Request a quote — KITMED',
      description:
        'Request a quote for medical equipment and devices: KITMED replies quickly with an offer suited to your practice or hospital.',
    },
  },
  disciplines: {
    path: '/products/disciplines',
    priority: 0.9,
    fr: {
      title: 'Nos produits par domaine — KITMED',
      description:
        'Équipements médicaux par domaine : ophtalmologie, orthoptie, contactologie, ORL, literie et mobilier médical, orthopédie, dispositifs médicaux, drapage.',
    },
    en: {
      title: 'Our products by specialty — KITMED',
      description:
        'Medical equipment by specialty: ophthalmology, orthoptics, contact lenses, ENT, hospital beds and furniture, orthopaedics, medical devices, drapes.',
    },
  },
  partners: {
    path: '/partners',
    priority: 0.8,
    fr: {
      title: 'Nos marques partenaires — KITMED',
      description:
        'Les fabricants internationaux d’équipements médicaux distribués par KITMED au Maroc : découvrez chaque marque et ses produits.',
    },
    en: {
      title: 'Our partner brands — KITMED',
      description:
        'The international medical equipment manufacturers distributed by KITMED in Morocco: discover each brand and its products.',
    },
  },
  privacy: {
    path: '/legal/privacy',
    priority: 0.2,
    fr: { title: 'Politique de confidentialité — KITMED', description: 'Politique de confidentialité et protection des données personnelles du site KITMED.' },
    en: { title: 'Privacy policy — KITMED', description: 'Privacy policy and personal data protection on the KITMED website.' },
  },
  terms: {
    path: '/legal/terms',
    priority: 0.2,
    fr: { title: 'Conditions d’utilisation — KITMED', description: 'Conditions générales d’utilisation du site KITMED.' },
    en: { title: 'Terms of use — KITMED', description: 'Terms of use of the KITMED website.' },
  },
  cookies: {
    path: '/legal/cookies',
    priority: 0.2,
    fr: { title: 'Politique cookies — KITMED', description: 'Utilisation des cookies sur le site KITMED.' },
    en: { title: 'Cookie policy — KITMED', description: 'How the KITMED website uses cookies.' },
  },
  compliance: {
    path: '/legal/compliance',
    priority: 0.2,
    fr: { title: 'Conformité réglementaire — KITMED', description: 'Conformité réglementaire et certifications de KITMED.' },
    en: { title: 'Regulatory compliance — KITMED', description: 'KITMED regulatory compliance and certifications.' },
  },
};

export function staticPageMetadata(key: keyof typeof STATIC_PAGES | string, locale: string): Metadata {
  const page = STATIC_PAGES[key];
  const loc = seoLocale(locale);
  return buildPageMetadata({ locale: loc, path: page.path, title: page[loc].title, description: page[loc].description });
}

/** Public URL of a category: a discipline has its own page, other levels use the leaf slug. */
export function categoryPath(c: { slug: string; type?: string | null; parentId?: string | null }): string {
  return c.type === 'discipline' && !c.parentId ? `/products/disciplines/${c.slug}` : `/products/categories/${c.slug}`;
}

export function categoryUrl(locale: string, c: { slug: string; type?: string | null; parentId?: string | null }): string {
  return localeUrl(locale, categoryPath(c));
}
