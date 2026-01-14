'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Search,
  ArrowRight,
  Heart,
  Eye,
  Building2,
  Award,
  Sparkles,
  MessageSquare,
  Download,
  FileText,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';
import { CertificationsBanner } from '@/components/ui/certifications-banner';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  pdfSource?: 'product' | 'manufacturer' | null;
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

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function SearchPageContent() {
  const t = useTranslations('common');
  const tProducts = useTranslations('products');
  const locale = useHydrationSafeLocale('fr');
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, locale]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'active');
      params.append('pageSize', '24');

      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/products?${params}&locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
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
    <div className="min-h-screen bg-slate-50">
      <CertificationsBanner variant="compact" />

      {/* Search Header */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/products`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Link>
              </Button>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-6">
              {locale === 'fr' ? 'Recherche' : 'Search'}
            </h1>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder={tProducts('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-primary-500 shadow-sm"
                autoFocus
              />
            </div>

            {searchQuery && (
              <p className="mt-4 text-slate-600">
                {locale === 'fr'
                  ? `Resultats pour "${searchQuery}"`
                  : `Results for "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text={tProducts('search.loading')} />
            </div>
          ) : products && products.items.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-slate-600">
                  {products.total} {locale === 'fr' ? 'produit(s) trouve(s)' : 'product(s) found'}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.items.map((product) => {
                  const primaryImage = getPrimaryImage(product);
                  const categoryInfo = product.category;

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      <div className="relative h-64 bg-white overflow-hidden p-4">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || getProductName(product)}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-gray-400" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="absolute top-4 left-4 space-y-2">
                          {product.isFeatured && (
                            <Badge className="bg-accent-500 text-white border-0 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {tProducts('listing.featured')}
                            </Badge>
                          )}
                          {categoryInfo && (
                            <Badge
                              variant="secondary"
                              className="text-xs border-0 bg-primary-100 text-primary-600"
                            >
                              {categoryInfo.name || 'Category'}
                            </Badge>
                          )}
                          {product.pdfBrochureUrl && (
                            <Badge
                              variant="secondary"
                              className="text-xs border-0 bg-blue-100 text-blue-600"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Badge>
                          )}
                        </div>
                      </div>

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
                          {product.isFeatured && (
                            <Award className="h-5 w-5 text-primary-500 flex-shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="text-sm text-slate-600 line-clamp-2">
                          {getProductDescription(product) || tProducts('listing.descriptionFallback')}
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-mono">
                            {tProducts('listing.reference', { ref: product.referenceFournisseur })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            asChild
                          >
                            <Link href={`/${locale}/products/${product.slug || product.id}`}>
                              {tProducts('listing.viewDetails')}
                            </Link>
                          </Button>

                          <div className="flex gap-2">
                            <QuoteRequestForm
                              product={{
                                id: product.id,
                                referenceFournisseur: product.referenceFournisseur,
                                constructeur: product.manufacturer.name,
                                translations: [{
                                  languageCode: 'fr',
                                  nom: product.name,
                                  description: product.description,
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
                                  {tProducts('listing.quote')}
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
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {tProducts('noResults.title')}
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tProducts('noResults.description')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/products`}>
                  {locale === 'fr' ? 'Voir tous les produits' : 'View all products'}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
