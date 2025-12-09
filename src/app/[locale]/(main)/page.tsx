'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Award, Users, Globe, Star, Play, ChevronDown } from 'lucide-react';
import { DynamicBanner } from '@/components/banners/DynamicBanner';
import { CertificationsBanner } from '@/components/ui/certifications-banner';
import { ManufacturerCarousel } from '@/components/carousel/ManufacturerCarousel';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { useIsHydrated } from '@/components/ui/hydration-safe';
import { HydrationErrorBoundary } from '@/components/ui/hydration-error-boundary';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  featured?: boolean;
  priority?: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  manufacturer: {
    name: string;
  };
  category?: {
    name: string;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
  }>;
}

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const isHydrated = useIsHydrated();
  const locale = useHydrationSafeLocale('fr');

  // Fetch data from APIs
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`/api/categories?includeProductCount=true&locale=${locale}`);
        const result = await response.json();

        if (result.success && result.data) {
          setCategories(result.data.slice(0, 6)); // Limit to 6 categories
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchPartners = async () => {
      try {
        setPartnersLoading(true);
        const response = await fetch(`/api/partners?status=active&pageSize=12`);
        const result = await response.json();

        if (result.success && result.data) {
          // Transform partner data to match expected interface with safe fallbacks
          const transformedPartners = result.data.map((partner: any) => {
            // Safely extract name with proper fallback handling
            let partnerName = 'Partner';
            if (partner.name) {
              if (typeof partner.name === 'string') {
                partnerName = partner.name;
              } else if (typeof partner.name === 'object') {
                partnerName = partner.name[locale] || partner.name.fr || partner.name.en || 'Partner';
              }
            }

            // Safely extract description
            let partnerDescription = '';
            if (partner.description) {
              if (typeof partner.description === 'string') {
                partnerDescription = partner.description;
              } else if (typeof partner.description === 'object') {
                partnerDescription = partner.description[locale] || partner.description.fr || partner.description.en || '';
              }
            }

            return {
              id: partner.id,
              name: partnerName,
              logo: partner.logoUrl || '/uploads/partners/default.png',
              description: partnerDescription,
              featured: partner.featured || false,
              priority: partner.priority || 0
            };
          });

          // Sort partners: featured first, then by priority, then by name
          const sortedPartners = transformedPartners.sort((a, b) => {
            if (a.featured !== b.featured) {
              return b.featured ? 1 : -1; // Featured partners first
            }
            if (a.priority !== b.priority) {
              return b.priority - a.priority; // Higher priority first
            }
            return a.name.localeCompare(b.name); // Alphabetical by name
          });

          setPartners(sortedPartners);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
        // Fallback to empty array on error
        setPartners([]);
      } finally {
        setPartnersLoading(false);
      }
    };

    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await fetch(`/api/products?status=active&featured=true&pageSize=6&locale=${locale}`);
        const result = await response.json();

        if (result.success && result.data) {
          setFeaturedProducts(result.data.items || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    if (isHydrated) {
      fetchCategories();
      fetchPartners();
      fetchFeaturedProducts();
    }
  }, [locale, isHydrated]);

  return (
    <HydrationErrorBoundary>
      <div className="flex flex-col">
        {/* Dynamic Banner - always render the same component structure */}
        <DynamicBanner position="homepage" />

        {/* Certifications Banner */}
        <CertificationsBanner variant="hero" />

        {/* Partners Section */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
                {t('partners.title')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                {t('partners.subtitle')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t('partners.description')}
              </p>
            </div>

            <ManufacturerCarousel
              partners={partners}
              isLoading={!isHydrated || partnersLoading}
              className="px-4"
            />

            <div className="mt-12 text-center">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary-300 text-primary-700 hover:bg-primary-50"
                asChild
              >
                <Link href={`/${locale}/partners`}>
                  {t('partners.viewAll')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
                {t('sections.concepts')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
                {t('sections.innovation')}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('sections.innovationDescription')}
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  number: "01",
                  title: t('features.0.title'),
                  description: t('features.0.description')
                },
                {
                  number: "02",
                  title: t('features.1.title'),
                  description: t('features.1.description')
                },
                {
                  number: "03",
                  title: t('features.2.title'),
                  description: t('features.2.description')
                }
              ].map((feature, index) => (
                <div key={index} className="group text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto border border-gray-300 rounded-full flex items-center justify-center group-hover:border-primary transition-colors duration-300">
                      <span className="text-2xl font-light text-gray-400 group-hover:text-primary transition-colors duration-300">
                        {feature.number}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-light text-gray-900 mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Medical Disciplines Section */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
                {t('disciplines.title')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                {t('disciplines.subtitle')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t('disciplines.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {!isHydrated || categoriesLoading ? (
                // Loading skeleton - same structure as actual content
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="group cursor-pointer">
                    <Card className="h-full border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:border-primary-300">
                      <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                        <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                        <div className="absolute top-4 right-4 bg-gray-200 animate-pulse px-3 py-1 rounded-full text-xs font-medium w-16 h-6">
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                          <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="group cursor-pointer">
                    <Link href={`/${locale}/products?category=${category.slug}`}>
                      <Card className="h-full border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:border-primary-300">
                        <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 font-bold text-xl">{category.name.charAt(0)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            {category.productCount} {t('disciplines.productsCount')}
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 min-h-[3rem]">
                            {category.description || t('disciplines.fallbackDescription', { name: category.name.toLowerCase() })}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                              {t('disciplines.viewRange')}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary-300 text-primary-700 hover:bg-primary-50"
                asChild
              >
                <Link href={`/${locale}/products/disciplines`}>
                  {t('disciplines.viewAll')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
                {t('featuredProducts.title')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6 leading-tight">
                {t('featuredProducts.subtitle')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t('featuredProducts.description')}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {!isHydrated || productsLoading ? (
                // Loading skeleton - same structure as actual content
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="group h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white overflow-hidden">
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                      <div className="absolute top-3 left-3">
                        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-3 w-full"></div>
                        <div className="h-3 bg-gray-200 rounded mb-3 w-1/3"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map((product) => {
                  const primaryImage = product.media?.find(m => m.isPrimary && m.type === 'image');

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      <div className="relative h-48 bg-white overflow-hidden p-4">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 text-xs">IMG</span>
                            </div>
                          </div>
                        )}

                        {/* Featured Badge */}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-accent-500 text-white border-0 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {t('featured')}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 font-medium">{product.manufacturer.name}</p>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {product.shortDescription || t('featuredProducts.noDescription')}
                        </p>
                        {product.category && (
                          <p className="text-xs text-primary-600 font-medium mb-3">
                            {product.category.name}
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="w-full bg-primary text-white hover:bg-primary-600"
                          asChild
                        >
                          <Link href={`/${locale}/products/${product.slug}`}>
                            {t('viewDetails')}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">{t('featuredProducts.noProducts')}</p>
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-accent-300 text-accent-700 hover:bg-accent-50"
                asChild
              >
                <Link href={`/${locale}/products/featured`}>
                  {t('featuredProducts.viewAll')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* References Section */}
        <section className="py-20 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
                {t('sections.references')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
                {t('sections.referencesTitle')}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('sections.referencesDescription')}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                {
                  number: t('references.stats.0.number'),
                  label: t('references.stats.0.label')
                },
                {
                  number: t('references.stats.1.number'),
                  label: t('references.stats.1.label')
                },
                {
                  number: t('references.stats.2.number'),
                  label: t('references.stats.2.label')
                },
                {
                  number: t('references.stats.3.number'),
                  label: t('references.stats.3.label')
                }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-light text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8 lg:p-12">
                  <div className="text-center">
                    <blockquote className="text-2xl font-light text-gray-800 leading-relaxed mb-8 italic">
                      "{t('references.testimonial.quote')}"
                    </blockquote>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{t('references.testimonial.author')}</div>
                      <div className="text-gray-600 text-sm">{t('references.testimonial.position')}</div>
                      <div className="text-primary text-sm font-medium">{t('references.testimonial.organization')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-24 bg-gray-900 text-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-400 uppercase tracking-wider text-sm font-medium mb-4">
                {t('sections.service')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-light mb-6 leading-tight">
                {t('sections.consultation')}
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-12">
                {t('sections.consultationDescription')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium transition-all duration-300"
                  asChild
                >
                  <Link href="/contact" className="flex items-center">
                    {t('cta.contact')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-medium transition-all duration-300"
                  asChild
                >
                  <Link href="/rfp/new" className="flex items-center">
                    {t('cta.requestQuote')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrationErrorBoundary>
  );
}