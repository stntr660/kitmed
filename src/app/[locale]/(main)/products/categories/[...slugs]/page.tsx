'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, ArrowLeft, Building2, ChevronRight, Package, Eye, Heart, Sparkles, Award, Download, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CertificationsBanner } from '@/components/ui/certifications-banner';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  type: string;
  children?: Category[];
  parentId?: string;
  parent?: Category;
}

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

interface PageProps {
  params: {
    slugs: string[];
    locale: string;
  };
}

export default function CategoryHierarchyPage({ params }: PageProps) {
  const t = useTranslations('common');
  const tCategories = useTranslations('categories.hierarchy');
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useHydrationSafeLocale('fr');

  const currentSlug = params.slugs[params.slugs.length - 1];

  useEffect(() => {
    loadCategoryData();
  }, [params.slugs, locale]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load category with children and products
      const response = await fetch(`/api/categories/${currentSlug}?includeChildren=true&includeProducts=true&locale=${locale}`);
      
      if (!response.ok) {
        throw new Error('Category not found');
      }

      const data = await response.json();
      const categoryData = data.data;
      
      setCategory(categoryData);

      // Build breadcrumbs from parent hierarchy
      const breadcrumbPath: Category[] = [];
      let currentCategory = categoryData;
      
      while (currentCategory) {
        breadcrumbPath.unshift(currentCategory);
        currentCategory = currentCategory.parent;
      }
      setBreadcrumbs(breadcrumbPath);

      // Set products if available
      if (categoryData.products) {
        setProducts(categoryData.products);
      }

    } catch (error) {
      console.error('Failed to load category:', error);
      setError(tCategories('notFound'));
    } finally {
      setLoading(false);
    }
  };

  const hasSubcategories = category?.children && category.children.length > 0;
  const hasProducts = products && products.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={tCategories('loading')} />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CertificationsBanner variant="compact" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {error || tCategories('notFound')}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {tCategories('notFoundDescription')}
            </p>
            <Button asChild>
              <Link href={`/${locale}/products`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tCategories('backToProducts')}
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6">
              <ol className="flex items-center justify-center space-x-2 text-sm">
                <li>
                  <Link 
                    href={`/${locale}/products`}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {t('navigation.products')}
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.id} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-white/50 mx-2" />
                    {index < breadcrumbs.length - 1 ? (
                      <Link 
                        href={`/${locale}/products/categories/${breadcrumbs.slice(0, index + 1).map(b => b.slug).join('/')}`}
                        className="text-white/70 hover:text-white transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    ) : (
                      <span className="text-white font-medium">{crumb.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <Badge className="mb-6 px-6 py-3 bg-white/20 text-white border-0 shadow-xl">
              🏥 {category.type === 'discipline' ? tCategories('discipline') : tCategories('category')}
            </Badge>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {category.name}
            </h1>

            <p className="text-xl text-primary-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              {category.description ||
               tCategories('exploreFallback', { categoryName: category.name.toLowerCase() })}
            </p>

            <div className="flex items-center justify-center space-x-6 text-primary-100">
              {hasSubcategories && (
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  {category.children.length} {category.children.length > 1 ? tCategories('subcategoryPlural') : tCategories('subcategorySingular')}
                </div>
              )}
              {hasProducts && (
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {products.length} {products.length > 1 ? tCategories('productPlural') : tCategories('productSingular')}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Subcategories Section */}
      {hasSubcategories && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                {tCategories('subcategories')}
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                {tCategories('subcategoriesDescription', { categoryName: category.name.toLowerCase() })}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {category.children.map((subCategory) => (
                <Card key={subCategory.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                  <div className="relative h-56 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                    {subCategory.imageUrl ? (
                      <Image
                        src={subCategory.imageUrl}
                        alt={subCategory.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-xl">
                            {subCategory.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Count Badge */}
                    <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      {subCategory.productCount || 0} {tCategories('productPlural')}
                    </div>
                  </div>

                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {subCategory.name}
                    </CardTitle>
                    <p className="text-slate-600 leading-relaxed line-clamp-3">
                      {subCategory.description ||
                       tCategories('subcategoryFallback', { categoryName: subCategory.name.toLowerCase() })}
                    </p>
                  </CardHeader>

                  <CardContent className="p-6 pt-0">
                    <Button
                      className="w-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      asChild
                    >
                      <Link 
                        href={`/${locale}/products/categories/${[...params.slugs, subCategory.slug].join('/')}`}
                        className="flex items-center justify-center"
                      >
                        {tCategories('explore')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      {hasProducts && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {tCategories('availableProducts')}
                </h2>
                <p className="text-slate-600">
                  {tCategories('availableProductsCount', { count: products.length, plural: products.length > 1 ? 's' : '' })}
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" size="sm">
                  {tCategories('sortByPrice')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  {tCategories('sortByPopularity')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
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
                          <QuoteRequestForm
                            product={{
                              id: product.id,
                              referenceFournisseur: product.referenceFournisseur,
                              constructeur: product.constructeur,
                              translations: product.translations
                            }}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {tCategories('quote')}
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
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasSubcategories && !hasProducts && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Package className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {tCategories('emptyCategory')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tCategories('emptyCategoryDescription')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/products`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tCategories('backToProducts')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}