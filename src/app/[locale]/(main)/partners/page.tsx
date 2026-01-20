'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Building2, ArrowRight, Grid } from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  isFeatured: boolean;
  name: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  productCount?: number;
}

export default function PartnersPage() {
  const t = useTranslations('partners');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?locale=${locale}&includeProductCount=true&excludeZeroProducts=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, [locale]);

  // Fetch partners when category changes
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const url = selectedCategory
          ? `/api/partners?categorySlug=${selectedCategory}`
          : '/api/partners';
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch partners');
        }

        const data = await response.json();

        if (data.success) {
          setPartners(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load partners');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [selectedCategory]);

  const getPartnerName = (partner: Partner) => {
    return partner.name[locale as keyof typeof partner.name] || partner.name.fr || partner.name.en;
  };

  if (error) {
    return (
      <div className="flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{tCommon('error')}</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
              {t('hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="py-8 overflow-x-auto scrollbar-hide">
              <div className="flex gap-5 justify-center min-w-max">
                {/* All Categories Chip */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'flex flex-col items-center gap-4 p-5 rounded-2xl transition-all duration-200 min-w-[120px]',
                    selectedCategory === null
                      ? 'bg-primary text-white shadow-xl scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-lg'
                  )}
                >
                  <div className={cn(
                    'w-28 h-28 rounded-xl flex items-center justify-center',
                    selectedCategory === null ? 'bg-white/20' : 'bg-white shadow-md'
                  )}>
                    <Grid className={cn(
                      'h-14 w-14',
                      selectedCategory === null ? 'text-white' : 'text-primary'
                    )} />
                  </div>
                  <span className="text-base font-semibold text-center leading-tight">
                    {tCommon('all')}
                  </span>
                </button>

                {/* Category Chips */}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={cn(
                      'flex flex-col items-center gap-4 p-5 rounded-2xl transition-all duration-200 min-w-[120px]',
                      selectedCategory === category.slug
                        ? 'bg-primary text-white shadow-xl scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-lg'
                    )}
                  >
                    <div className={cn(
                      'w-28 h-28 rounded-xl overflow-hidden flex items-center justify-center',
                      selectedCategory === category.slug ? 'bg-white p-2' : 'bg-white shadow-md'
                    )}>
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className={cn(
                          'h-14 w-14',
                          selectedCategory === category.slug ? 'text-primary' : 'text-gray-400'
                        )} />
                      )}
                    </div>
                    <span className="text-base font-semibold text-center leading-tight max-w-[110px] line-clamp-2">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Partners Grid */}
      <section id="partners-grid" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : partners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <Link key={partner.id} href={`/${locale}/partners/${partner.slug}${selectedCategory ? `?category=${selectedCategory}` : ''}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                      <CardContent className="p-5 flex items-center gap-4">
                        {partner.logoUrl ? (
                          <img
                            src={partner.logoUrl}
                            alt={getPartnerName(partner)}
                            className="h-12 w-12 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {getPartnerName(partner)}
                            </h3>
                            {partner.isFeatured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategory ? t('noPartnersInCategory') : t('noPartners.title')}
                </h3>
                <p className="text-gray-600">
                  {selectedCategory ? t('noPartnersInCategoryDescription') : t('noPartners.description')}
                </p>
                {selectedCategory && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSelectedCategory(null)}
                  >
                    {t('viewAllPartners')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
