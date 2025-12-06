'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      const response = await fetch(`/api/categories?includeProductCount=true&locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
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
      <section className="relative bg-slate-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-6 py-3 bg-primary-500 text-white border-0 shadow-xl">
              🏥 {tDisciplines('medicalSpecialties')}
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {tDisciplines('title')}
              <span className="text-primary-300 block mt-2">{tDisciplines('titleSuffix')}</span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
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

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                    <div className="relative h-64 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <Building2 className="h-16 w-16 text-slate-400" />
                        </div>
                      )}

                    </div>

                    <CardHeader className="p-6 pb-4">
                      <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </CardTitle>
                      <p className="text-slate-600 leading-relaxed">
                        {category.description || tDisciplines('fallbackDescription', { name: category.name.toLowerCase() })}
                      </p>
                    </CardHeader>

                    <CardContent className="p-6 pt-0">
                      <Button
                        className="w-full bg-primary text-white hover:bg-primary-700"
                        asChild
                      >
                        <Link href={`/${locale}/products/disciplines/${category.slug}`} className="flex items-center justify-center">
                          {tDisciplines('exploreCategories')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
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