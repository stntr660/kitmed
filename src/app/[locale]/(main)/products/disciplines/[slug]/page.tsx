'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, ArrowLeft, Building2, Heart, Eye, Sparkles, Award, Download, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { PartnerLogosCarousel } from '@/components/carousel/PartnerLogosCarousel';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  pdfBrochureUrl?: string;
  primaryImage?: string;
  translations: Array<{
    languageCode: string;
    nom: string;
    description: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  type: string;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  other_categories: Category[];
  products?: Product[];
}

interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default function DisciplineCategoriesPage({ params }: PageProps) {
  const t = useTranslations('common');
  const tDisciplines = useTranslations('disciplinesDetail');
  const tCategories = useTranslations('categories.hierarchy');
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadDiscipline();
  }, [params.slug, locale]);

  const loadDiscipline = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load discipline with its categories
      const response = await fetch(`/api/disciplines/${params.slug}?locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setDiscipline(data.data);

        // If no subcategories but has products, fetch products directly
        const hasNoSubcategories = !data.data.other_categories || data.data.other_categories.length === 0;
        if (hasNoSubcategories && data.data.productCount > 0) {
          const productsResponse = await fetch(`/api/categories/${params.slug}?includeProducts=true&locale=${locale}`);
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            setProducts(productsData.data.products || []);
          }
        }
      } else {
        setError(tDisciplines('notFound'));
      }
    } catch (error) {
      console.error('Failed to load discipline:', error);
      setError(t('loading'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={tDisciplines('loading')} />
      </div>
    );
  }

  if (error || !discipline) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {error || tDisciplines('notFound')}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {tDisciplines('notFoundDescription')}
            </p>
            <Button asChild>
              <Link href={`/${locale}/products/disciplines`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tDisciplines('backToDisciplines')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b py-4 lg:py-6">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100" asChild>
                <Link href={`/${locale}/products/disciplines`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tDisciplines('medicalDisciplines')}
                </Link>
              </Button>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              {tDisciplines('equipment')}
              <span className="text-primary-600 block mt-1">{discipline.name}</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {discipline.description ||
               tDisciplines('fallbackDescription', { disciplineName: discipline.name.toLowerCase() })}
            </p>

            {discipline.other_categories && discipline.other_categories.filter((cat: Category) => cat.productCount > 0).length > 0 && (
              <div className="text-slate-500 mt-4">
                {tDisciplines('categoriesAvailable', {
                  count: discipline.other_categories.filter((cat: Category) => cat.productCount > 0).length,
                  plural: discipline.other_categories.filter((cat: Category) => cat.productCount > 0).length > 1 ? tDisciplines('categoryPlural') : tDisciplines('categorySingular')
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partner Logos Carousel */}
      <section className="bg-white border-b py-2">
        <div className="container mx-auto px-6 lg:px-8">
          <PartnerLogosCarousel locale={locale} />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-6 lg:py-8">
        <div className="container mx-auto px-6 lg:px-8">
          {discipline.other_categories && discipline.other_categories.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {discipline.other_categories.map((category) => (
                  <Card key={category.id} className="group h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white overflow-hidden">
                    <div className="relative h-36 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-xl">{category.name.charAt(0)}</span>
                          </div>
                        </div>
                      )}

                      {/* Product Count Badge */}
                      <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {tDisciplines('productsBadge', { count: category.productCount || 0 })}
                      </div>

                      {/* Category Type Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 text-primary-700 border-0 text-xs">
                          {tDisciplines('equipmentBadge')}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{tDisciplines('productsAvailable')}</span>
                          <span className="font-semibold">{category.productCount || 0}</span>
                        </div>

                        <Button
                          className="w-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          asChild
                        >
                          <Link href={`/${locale}/products/categories/${category.slug}`} className="flex items-center justify-center">
                            {category.children && category.children.length > 0 ? tDisciplines('exploreCategories') : tDisciplines('viewProducts')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : products.length > 0 ? (
            // No subcategories but has direct products - show products grid
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                  {tDisciplines('directProductsTitle', { count: products.length })}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {tDisciplines('directProductsDescription', { disciplineName: discipline.name })}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const productTranslation = product.translations[0];
                  const productName = productTranslation?.nom || `Product ${product.referenceFournisseur}`;
                  const primaryImage = product.primaryImage;

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-64 bg-white overflow-hidden p-4">
                        {primaryImage ? (
                          <Image
                            src={primaryImage}
                            alt={productName}
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
                              {tCategories('featured')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-slate-500 font-medium mb-1">
                              {product.constructeur}
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
                          {productTranslation?.description || tCategories('productFallback')}
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-mono">
                            {tCategories('reference')}: {product.referenceFournisseur}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            asChild
                          >
                            <Link href={`/${locale}/products/${product.slug || product.id}`}>
                              {tCategories('viewProduct')}
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
                                {tCategories('moreDetails')}
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
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {tDisciplines('noCategoriesTitle')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tDisciplines('noCategoriesDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/products/disciplines`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {tDisciplines('backToDisciplines')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/${locale}/products`}>
                    {tDisciplines('viewAllProducts')}
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