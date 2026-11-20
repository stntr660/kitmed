'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  ExternalLink,
  ArrowLeft,
  Download,
  Heart,
  Share2,
  Building2,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { isWebPageLink } from '@/lib/utils';
import { brochureHref, isViewerPdfPath } from '@/lib/brochure';
import Image from 'next/image';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  pdfSource?: 'product' | 'manufacturer' | null;
  status: string;
  isFeatured: boolean;
  isNewArrival?: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  partner?: {
    id: string;
    slug?: string | null;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
  translations: Array<{
    languageCode: string;
    nom: string;
    description: string | null;
    ficheTechnique: string | null;
  }>;
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
    title: string | null;
    sortOrder: number;
  }>;
}

interface ProductPageClientProps {
  slug: string;
  locale: string;
  /** Loaded on the server (same payload as /api/products/[slug]) so the first HTML has the product. */
  initialProduct?: Product | null;
}

export default function ProductPageClient({ slug, locale, initialProduct = null }: ProductPageClientProps) {
  const t = useTranslations('products.detail');
  const tCommon = useTranslations('common');
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // Server already rendered this product for this locale: no refetch.
    if (initialProduct && initialProduct.slug === slug) {
      return;
    }
    if (slug) {
      loadProduct();
    }
  }, [slug, locale]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      // Try to fetch real product data by slug using the public API
      const response = await fetch(`/api/products/${slug}?locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const productData = data.data;

          // Use the API data directly since it's already properly formatted
          setProduct(productData);
          return;
        }
      }

      // Unknown slug: show the « not found » state, never placeholder data
      setProduct(null);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: Product) => {
    const translation = product.translations?.find(t => t.languageCode === locale)
      || product.translations?.find(t => t.languageCode === 'fr');
    return translation?.nom || product.referenceFournisseur;
  };

  const getProductDescription = (product: Product) => {
    const translation = product.translations?.find(t => t.languageCode === locale)
      || product.translations?.find(t => t.languageCode === 'fr');
    return translation?.description;
  };

  const getProductSpecs = (product: Product) => {
    const translation = product.translations?.find(t => t.languageCode === locale)
      || product.translations?.find(t => t.languageCode === 'fr');
    return translation?.ficheTechnique;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('loading')} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{t('notFound')}</h1>
          <Button asChild>
            <Link href={`/${locale}/products/disciplines`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToCatalog')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.media?.filter(m => m.type === 'image').sort((a, b) => a.sortOrder - b.sortOrder) || [];
  const currentImage = images[selectedImageIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center text-sm text-slate-600">
            <Link href={`/${locale}/products/disciplines`} className="hover:text-gray-600 transition-colors">
              {t('breadcrumbProducts')}
            </Link>
            <span className="mx-2">/</span>
            {product.category && (
              <>
                <Link href={`/${locale}/products/categories/${product.category.slug}`} className="hover:text-gray-600 transition-colors">
                  {product.category.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-slate-900 font-medium">{getProductName(product)}</span>
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Product Images */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="aspect-square relative">
                  {currentImage ? (
                    <Image
                      src={currentImage.url}
                      alt={currentImage.altText || getProductName(product)}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="h-24 w-24 text-slate-400" />
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 space-y-2">
                    {product.isNewArrival && (
                      <Badge className="rounded-full border-0 bg-accent-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {tCommon('newArrival')}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                      {t('available')}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-6 right-6 space-y-2">
                    <Button size="sm" variant="secondary" className="h-10 w-10 p-0 shadow-lg">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-10 w-10 p-0 shadow-lg">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImageIndex === index
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-slate-200 hover:border-primary-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `Image ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-8">
              {/* Header */}
              <div>
                {/* No manufacturer chip for unbranded products (e.g. the former MC2 orthoptics range, script 121) */}
                {(product.partner?.name || product.constructeur) && (
                <div className="flex items-center gap-3 mb-4">
                  <Link
                    href={product.partner?.slug ? `/${locale}/partners/${product.partner.slug}` : `/${locale}/partners`}
                    className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-primary-900 shadow-sm transition-colors hover:border-primary-300"
                  >
                    {product.partner?.logoUrl && (
                      <Image
                        src={product.partner.logoUrl}
                        alt=""
                        width={56}
                        height={24}
                        className="h-6 w-auto max-w-[72px] object-contain"
                      />
                    )}
                    {product.partner?.name || product.constructeur}
                  </Link>
                </div>
                )}

                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  {getProductName(product)}
                </h1>

                <div className="text-sm text-slate-500 font-mono mb-6">
                  {t('reference')}: {product.referenceFournisseur}
                </div>

                <p className="whitespace-pre-line text-lg text-slate-700 leading-relaxed">
                  {getProductDescription(product)}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" className="bg-primary text-white hover:bg-gray-600 h-14" asChild>
                    <Link href={`/${locale}/contact`}>
                      <MessageSquare className="h-5 w-5 mr-2" />
                      {t('moreDetails')}
                    </Link>
                  </Button>

                  {product.pdfBrochureUrl && (
                    <Button size="lg" variant="outline" className="h-14 relative" asChild>
                      <a
                        href={
                          isWebPageLink(product.pdfBrochureUrl)
                            ? product.pdfBrochureUrl
                            : isViewerPdfPath(product.pdfBrochureUrl)
                              ? brochureHref(product.pdfBrochureUrl, locale, getProductName(product), `/${locale}/products/${product.slug || slug}`)
                              : `${product.pdfBrochureUrl}#toolbar=0&navpanes=0`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {isWebPageLink(product.pdfBrochureUrl) ? <ExternalLink className="h-5 w-5 mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
                        {isWebPageLink(product.pdfBrochureUrl) ? tCommon('officialSite') : t('viewBrochure')}
                        {product.pdfSource === 'manufacturer' && (
                          <span className="ml-2 text-xs text-slate-500">{t('generalBrochure')}</span>
                        )}
                      </a>
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-center space-x-8 text-center">
                  <div className="flex flex-col items-center">
                    <Phone className="h-6 w-6 text-primary-600 mb-2" />
                    <span className="text-sm text-slate-600">{t('phoneSupport')}</span>
                    <div className="space-y-1">
                      <a href="tel:+212522860366" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        +212 522 86 03 66
                      </a>
                      <a href="tel:+212522860431" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        +212 522 86 04 31
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <Mail className="h-6 w-6 text-primary-600 mb-2" />
                    <span className="text-sm text-slate-600">{t('contactEmail')}</span>
                    <div className="space-y-1">
                      <a href="mailto:INFO@KITMED.MA" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        INFO@KITMED.MA
                      </a>
                      <a href="mailto:EXPORT@KITMED.MA" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        EXPORT@KITMED.MA
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {getProductSpecs(product) && (
        <section className="container mx-auto px-4 lg:px-8 pb-12">
          <div className="rounded-lg border border-slate-200 bg-white p-6 lg:p-8">
            <h2 className="text-xl lg:text-2xl font-bold text-primary-900">{t('technicalSheet')}</h2>
            <span aria-hidden="true" className="mt-2 mb-5 block h-1 w-12 rounded-full bg-accent-500" />
            <dl className="divide-y divide-slate-100 text-sm">
              {getProductSpecs(product)!.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
                const m = line.match(/^([^:]{1,60}?)\s+:\s+(.+)$/);
                return m ? (
                  <div key={i} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-6">
                    <dt className="font-medium text-slate-900 break-words">{m[1]}</dt>
                    <dd className="text-slate-700 break-words">{m[2]}</dd>
                  </div>
                ) : (
                  <p key={i} className="py-2 text-slate-700 break-words">{line}</p>
                );
              })}
            </dl>
          </div>
        </section>
      )}

    </div>
  );
}