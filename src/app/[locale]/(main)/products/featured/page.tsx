'use client';

import { brochureHref } from '@/lib/brochure';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  ExternalLink,
  ArrowRight,
  Download,
  Building2,
  Award,
  Sparkles,
  MessageSquare,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { isWebPageLink } from '@/lib/utils';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  name: string;
  description: string;
  shortDescription: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  manufacturer: {
    name: string;
  };
  discipline: {
    name: string;
    color: string;
    imageUrl: string | null;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
  }>;
}

export default function FeaturedProductsPage() {
  const t = useTranslations('common');
  const tFeatured = useTranslations('home.featuredProducts');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadFeaturedProducts();
  }, [locale]);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?status=active&featured=true&pageSize=50&locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: Product) => {
    return product.name || product.referenceFournisseur;
  };

  const getProductDescription = (product: Product) => {
    return product.description || product.shortDescription;
  };

  const getPrimaryImage = (product: Product) => {
    return product.media?.find(m => m.isPrimary && m.type === 'image');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page title, same style as « Produits par Discipline » (owner 2026-11-19) */}
      <section className="bg-white pb-6 pt-10 lg:pt-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-[#0A0EA4] sm:text-[36px] lg:text-[46px]">
            {tFeatured('subtitle')}
          </h1>
          <span aria-hidden="true" className="mx-auto mt-3 block h-[4px] w-20 rounded-full bg-[#D7191A] lg:h-[5px] lg:w-[112px]" />
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#10146B] lg:text-[19px]">
            {tFeatured('description')}
          </p>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text={tFeatured('loading')} />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  {tFeatured('title')}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {tFeatured('count', { count: products.length, plural: products.length > 1 ? 's' : '' })}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const primaryImage = getPrimaryImage(product);

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      {/* Product Image -- the whole photo opens the product, not only the button */}
                      <Link
                        href={`/${locale}/products/${product.slug || product.id}`}
                        aria-label={getProductName(product)}
                        className="relative block h-64 bg-slate-100 overflow-hidden"
                      >
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || getProductName(product)}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-slate-400" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 space-y-2">
                          <Badge className="bg-accent-500 text-white border-0 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {t('featured')}
                          </Badge>
                        </div>
                      </Link>

                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-slate-500 font-medium mb-1">
                              {product.manufacturer.name}
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
                              {getProductName(product)}
                            </CardTitle>
                          </div>
                          <Award className="h-5 w-5 text-primary-500 flex-shrink-0 ml-2" />
                        </div>

                        <div className="text-sm text-slate-600 line-clamp-2">
                          {getProductDescription(product) || tFeatured('noDescription')}
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-mono">
                            {t('reference')}: {product.referenceFournisseur}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            asChild
                          >
                            <Link href={`/${locale}/products/${product.slug || product.id}`}>
                              {tFeatured('viewDetails')}
                            </Link>
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              asChild
                            >
                              <Link href={`/${locale}/contact`}>
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {t('moreDetails')}
                              </Link>
                            </Button>

                            {product.pdfBrochureUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3"
                                asChild
                              >
                                <a href={brochureHref(product.pdfBrochureUrl, locale, product.name)} target="_blank" rel="noopener noreferrer">
                                  {isWebPageLink(product.pdfBrochureUrl) ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-accent-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {tFeatured('noFeaturedTitle')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tFeatured('noFeaturedDescription')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/products/disciplines`}>
                  {tFeatured('backToProducts')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}