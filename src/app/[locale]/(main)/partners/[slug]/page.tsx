'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Building2, ExternalLink, Package, Star, FileText, Heart, Eye, Award, Sparkles, Download, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CertificationsBanner } from '@/components/ui/certifications-banner';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';

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
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadPartnerData();
  }, [params.slug, locale, page]);

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

      // Load partner products
      const productsResponse = await fetch(
        `/api/products?partner=${partnerData.data.id}&locale=${locale}&page=${page}&pageSize=12`
      );

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
        <CertificationsBanner variant="compact" />
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
      {/* Certifications Banner */}
      <CertificationsBanner variant="compact" />

      {/* Partner Header */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link href={`/${locale}/partners`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('partners')}
                </Link>
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Partner Logo */}
              <div className="flex-shrink-0">
                {partner.logoUrl ? (
                  <div className="w-32 h-32 bg-white rounded-xl p-4 flex items-center justify-center shadow-xl">
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center shadow-xl">
                    <Building2 className="h-16 w-16 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Partner Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">
                  {partner.isFeatured && (
                    <Badge className="bg-white/20 text-white border-0 shadow-xl">
                      <Star className="mr-1 h-3 w-3" />
                      {tPartner('featuredBadge')}
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white border-0 shadow-xl">
                    <Package className="mr-1 h-3 w-3" />
                    {tPartner('productsCount', { count: partner.productCount || products.length })}
                  </Badge>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {partner.name}
                </h1>

                {partner.description && (
                  <p className="text-xl text-primary-100 mb-6 leading-relaxed max-w-3xl">
                    {partner.description}
                  </p>
                )}

                {partner.websiteUrl && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button
                      className="bg-white text-primary-600 hover:bg-primary-50 transition-colors"
                      asChild
                    >
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {tPartner('visitWebsite')}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
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
                  {tPartner('productsTitle', { partnerName: partner.name })}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {tPartner('productsDescription', { partnerName: partner.name })}
                </p>
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
                          {product.description || product.shortDescription || tPartner('productFallbackDescription')}
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
                            <QuoteRequestForm
                              product={{
                                id: product.id,
                                referenceFournisseur: product.referenceFournisseur,
                                constructeur: manufacturerName,
                                translations: product.translations?.length ? product.translations : [{
                                  languageCode: 'fr',
                                  nom: productName,
                                  description: product.description || product.shortDescription || '',
                                  ficheTechnique: null
                                }]
                              }}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {t('quote')}
                                </Button>
                              }
                            />

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