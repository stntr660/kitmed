import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import { getPublicProduct, getPublicCategory } from '@/lib/catalog/public-catalog';
import { JsonLd, breadcrumbJsonLd, productJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, buildPageMetadata, categoryUrl, localeUrl, seoLocale, summarize } from '@/lib/seo/site';

interface PageProps {
  params: { slug: string; locale: string };
}

// One query per request, shared by generateMetadata and the page
const loadProduct = cache((slug: string, locale: string) => getPublicProduct(slug, locale));

function localized(product: NonNullable<Awaited<ReturnType<typeof getPublicProduct>>>, locale: string) {
  const tr =
    product.translations.find(t => t.languageCode === locale) ||
    product.translations.find(t => t.languageCode === 'fr');
  return {
    name: tr?.nom || product.referenceFournisseur,
    description: tr?.description || null,
    specs: tr?.ficheTechnique || null,
    metaTitle: tr?.metaTitle || null,
    metaDescription: tr?.metaDescription || null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = seoLocale(params.locale);
  const product = await loadProduct(params.slug, locale);
  if (!product) {
    return { title: { absolute: locale === 'en' ? 'Product not found — KITMED' : 'Produit non trouvé — KITMED' }, robots: { index: false } };
  }
  const { name, description, specs, metaTitle, metaDescription } = localized(product, locale);
  const brand = product.partner?.name || product.constructeur;
  const title = metaTitle || `${name}${brand ? ` | ${brand}` : ''} — KITMED`;
  const fallback =
    locale === 'en'
      ? `${name}${brand ? ` by ${brand}` : ''}, available from KITMED in Casablanca, Morocco. Ref. ${product.referenceFournisseur}. Ask for a quote.`
      : `${name}${brand ? ` ${brand}` : ''}, disponible chez KITMED à Casablanca, Maroc. Réf. ${product.referenceFournisseur}. Demandez un devis.`;
  const images = product.media
    .filter(m => m.type === 'image')
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
    .slice(0, 1)
    .map(m => ({ url: m.url, alt: m.altText || name }));

  return buildPageMetadata({
    locale,
    path: `/products/${product.slug}`,
    title,
    description: summarize(metaDescription || description || specs || fallback, 155),
    images,
  });
}

/** Category path from the root (Ophtalmologie > Appareillage > ...) for the breadcrumb JSON-LD. */
async function categoryTrail(slug: string | undefined, locale: string) {
  if (!slug) return [];
  const category = await getPublicCategory(slug, locale, { includeChildren: false, includeProducts: false }).catch(() => null);
  const trail: Array<{ name: string; slug: string; type: string }> = [];
  let current: any = category;
  while (current) {
    trail.unshift({ name: current.name, slug: current.slug, type: current.type });
    current = current.parent;
  }
  return trail;
}

export default async function ProductPage({ params }: PageProps) {
  const locale = seoLocale(params.locale);
  const product = await loadProduct(params.slug, locale);
  if (!product) notFound();

  const { name, description, specs } = localized(product, locale);
  const url = localeUrl(locale, `/products/${product.slug}`);
  const trail = await categoryTrail(product.category?.slug, locale);
  const images = product.media
    .filter(m => m.type === 'image')
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
    .map(m => m.url);

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name,
          description: description || specs,
          url,
          images,
          brand: product.partner?.name || product.constructeur,
          sku: product.referenceFournisseur,
          category: trail.length ? trail.map(c => c.name).join(' > ') : product.category?.name,
          locale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'KITMED', url: localeUrl(locale) },
          { name: locale === 'en' ? 'Products' : 'Produits', url: localeUrl(locale, STATIC_PAGES.disciplines.path) },
          ...trail.map(c => ({ name: c.name, url: categoryUrl(locale, c) })),
          { name, url },
        ])}
      />
      <ProductPageClient slug={params.slug} locale={locale} initialProduct={product as any} />
    </>
  );
}
