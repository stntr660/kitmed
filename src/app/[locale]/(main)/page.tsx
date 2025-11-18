'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Award, Users, Globe, Star, Play, ChevronDown } from 'lucide-react';
import { DynamicBanner } from '@/components/banners/DynamicBanner';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  count: string;
}

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [isVisible, setIsVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`/api/categories?includeProductCount=true&locale=${locale}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);


  return (
    <div className="flex flex-col">
      {/* Dynamic Banner with Static Fallback */}
      <DynamicBanner position="homepage" />

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

          {/* Technical Specifications Preview */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-2">
                        SPÉCIFICATIONS
                      </p>
                      <h3 className="text-3xl font-light text-gray-900 mb-4">
                        Performance &amp; Fiabilité
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Équipements conçus pour répondre aux exigences les plus strictes 
                        des environnements médicaux professionnels
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Certification</span>
                        <span className="font-medium text-gray-900">CE • FDA • ISO</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Garantie</span>
                        <span className="font-medium text-gray-900">3 ans fabricant</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Formation</span>
                        <span className="font-medium text-gray-900">Incluse</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-gray-400">Vidéo de démonstration</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-200">
                        <Play className="h-8 w-8 text-gray-600 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Disciplines Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mb-4">
              Spécialités Médicales
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Nos Domaines d'Expertise
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Découvrez nos solutions spécialisées pour chaque discipline médicale, 
              avec des équipements adaptés aux besoins spécifiques de votre pratique.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categoriesLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <Card className="h-full border border-gray-200">
                    <div className="relative aspect-video bg-gray-200"></div>
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              categories.map((category) => (
                <div key={category.id} className="group cursor-pointer">
                  <Link href={`/${locale}/products?category=${category.slug}`}>
                    <Card className="h-full border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:border-blue-300">
                      <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-white overflow-hidden">
                        {category.imageUrl ? (
                          <img 
                            src={category.imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xl">{category.name.charAt(0)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {category.count} produits
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 min-h-[3rem]">
                          {category.description || `Solutions professionnelles pour ${category.name.toLowerCase()}`}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                            Découvrir la gamme
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-16 text-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-medium transition-all duration-300"
              asChild
            >
              <Link href={`/${locale}/products`} className="flex items-center">
                Voir Tous les Équipements
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
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-medium transition-all duration-300"
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
  );
}