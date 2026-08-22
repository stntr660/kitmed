'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  count: string;
}

export default function ProductsByDisciplinePage() {
  const t = useTranslations('common');
  const tDisciplines = useTranslations('disciplines');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadCategories();
  }, [locale]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories?includeProductCount=true&excludeZeroProducts=true&locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        // Filter for discipline-type categories only
        const disciplineCategories = (data.data || []).filter((cat: Category) => cat.count !== '0');
        setCategories(disciplineCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b py-4 lg:py-6">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight break-words">
              {tDisciplines('title')}
              <span className="text-primary-600 block mt-1">{tDisciplines('titleSuffix')}</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {tDisciplines('description')}
            </p>
          </div>
        </div>
      </section>

      {/* Disciplines Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text={tDisciplines('loading')} />
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  {tDisciplines('disciplinesSectionTitle')}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {tDisciplines('disciplinesSectionDescription', { 
                    count: categories.length, 
                    plural: categories.length > 1 ? 's' : '' 
                  })}
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/${locale}/products/disciplines/${category.slug}`}
                    className="block group"
                  >
                    <Card className="aspect-square flex flex-col border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white overflow-hidden cursor-pointer h-full">
                      <div className="relative flex-1 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                        {category.imageUrl ? (
                          <Image
                            src={category.imageUrl}
                            alt={category.name}
                            fill
                            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-primary-600" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                          {category.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-3 pt-0">
                        <div className="w-full inline-flex items-center justify-center gap-1.5 bg-primary-600 text-white group-hover:bg-primary-700 transition-colors h-8 text-xs font-medium rounded-md">
                          {tDisciplines('exploreCategories')}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {tDisciplines('noSpecialtiesFound')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tDisciplines('noSpecialtiesFoundDescription')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/products`}>
                  {tDisciplines('backToProducts')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}