'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DomainTile, DOMAIN_GRID } from '@/components/products/DomainTile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { useScrollRestore } from '@/hooks/useScrollRestore';

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
  const tCards = useTranslations('categoryCards');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useScrollRestore(!loading);
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

              <div className={DOMAIN_GRID}>
                {categories.map((category) => (
                  <DomainTile
                    key={category.id}
                    href={`/${locale}/products/disciplines/${category.slug}`}
                    title={category.name}
                    imageUrl={category.imageUrl}
                    linkLabel={tCards('seeProducts')}
                  />
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
                <Link href={`/${locale}`}>
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