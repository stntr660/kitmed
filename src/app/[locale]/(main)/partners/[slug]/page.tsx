'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Building2, Package, Star, Heart, Eye, Award, Sparkles, Download, MessageSquare, X, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  referenceFournisseur: string;
  constructeur: string;
  isFeatured: boolean;
  pdfBrochureUrl?: string | null;
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
  }>;
  manufacturer: {
    name: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  translations: Array<{
    languageCode: string;
    nom: string;
    description: string;
    ficheTechnique: string | null;
  }>;
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  isFeatured: boolean;
  productCount: number;
}

interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default function PartnerProductsPage({ params }: PageProps) {
  const t = useTranslations('common');
  const tPartner = useTranslations('partnerDetail');
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');

  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const locale = useHydrationSafeLocale('fr');

  // Fetch category name when filter is active
  useEffect(() => {
    if (categoryFilter) {
      fetch(`/api/categories?locale=${locale}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const category = data.data.find((c: { slug: string; name: string }) => c.slug === categoryFilter);
            if (category) {
              setCategoryName(category.name);
            }
          }
        })
        .catch(console.error);
    } else {
      setCategoryName(null);
    }
  }, [categoryFilter, locale]);

  useEffect(() => {
    loadPartnerData();
  }, [params.slug, locale, page, categoryFilter]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load partner info
      const partnerResponse = await fetch(`/api/partners/${params.slug}?locale=${locale}`);
      if (!partnerResponse.ok) {
        setError(tPartner('notFound'));
        return;
      }

      const partnerData = await partnerResponse.json();
      setPartner(partnerData.data);

      // Load partner products (with optional category filter)
      const productsUrl = `/api/products?partner=${partnerData.data.id}&locale=${locale}&page=${page}&pageSize=12${categoryFilter ? `&categorySlug=${categoryFilter}` : ''}`;
      const productsResponse = await fetch(productsUrl);

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.data.items);
        setTotalPages(productsData.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
      setError(tPartner('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={tPartner('loading')} />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {error || tPartner('notFound')}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {tPartner('notFoundDescription')}
            </p>
            <Button asChild>
              <Link href={`/${locale}/partners`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tPartner('backToPartners')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Partner Header (matches category page style) */}
      <section className="bg-white border-b py-4 lg:py-6">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb */}
            <div className="mb-4 flex justify-center">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-primary-600" asChild>
                <Link href={`/${locale}/partners`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('partners')}
                </Link>
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* Partner Logo */}
              {partner.logoUrl ? (
                <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm border border-slate-200">
                  <Image
                    src={partner.logoUrl}
                    alt={partner.name}
                    width={72}
                    height={72}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-slate-400" />
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight break-words">
                {partner.name}
              </h1>

              <div className="flex flex-wrap gap-2 justify-center">
                {partner.isFeatured && (
                  <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-0">
                    <Star className="mr-1 h-3 w-3" />
                    {tPartner('featuredBadge')}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-0">
                  <Package className="mr-1 h-3 w-3" />
                  {tPartner('productsCount', { count: partner.productCount || products.length })}
                </Badge>
                {categoryFilter && categoryName && (
                  <Badge className="bg-primary-600 text-white border-0">
                    <Filter className="mr-1 h-3 w-3" />
                    {tPartner('filteredByCategory', { categoryName })}
                  </Badge>
                )}
              </div>

              {partner.description && (
                <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
                  {partner.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {products.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  {categoryFilter && categoryName
                    ? tPartner('filteredProductsTitle', { partnerName: partner.name, categoryName })
                    : tPartner('productsTitle', { partnerName: partner.name })}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
                  {categoryFilter && categoryName
                    ? tPartner('filteredProductsDescription', { partnerName: partner.name, categoryName })
                    : tPartner('productsDescription', { partnerName: partner.name })}
                </p>
                {categoryFilter && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${locale}/partners/${params.slug}`)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    {tPartner('clearCategoryFilter')}
                  </Button>
                )}
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const primaryImage = product.media?.find(m => m.isPrimary && m.type === 'image');
                  const productName = product.name || `Product ${product.referenceFournisseur}`;
                  const manufacturerName = product.manufacturer?.name || product.constructeur || partner.name;

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-64 bg-white overflow-hidden p-4">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || productName}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-gray-400" />
                          </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 space-y-2">
                          {product.isFeatured && (
                            <Badge className="bg-accent-500 text-white border-0 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {t('featured')}
                            </Badge>
                          )}
                          {product.category && (
                            <Badge variant="secondary" className="bg-primary-100 text-primary-600 border-0 text-xs">
                              {product.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-slate-500 font-medium mb-1">
                              {manufacturerName}
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
                              {productName}
                            </CardTitle>
                          </div>
                          {product.isFeatured && (
                            <Award className="h-5 w-5 text-primary-500 flex-shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="text-sm text-slate-600 line-clamp-2">
                          {product.description || product.shortDescription || `${locale === 'fr' ? 'Produit médical professionnel de' : 'Professional medical product from'} ${partner?.name || ''}.`}
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
                              {t('viewDetails')}
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
                                <a href={product.pdfBrochureUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      onClick={() => setPage(pageNum)}
                      className="w-10 h-10 p-0"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Package className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {tPartner('noProductsTitle')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tPartner('noProductsDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/partners`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {tPartner('backToPartners')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/${locale}/products`}>
                    {tPartner('viewAllProducts')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}