'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  productCount?: number;
}

export default function ProductsByManufacturerPage() {
  const t = useTranslations('products');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);

      // Fetch partners/manufacturers from the partners API
      const partnersResponse = await fetch('/api/partners?status=active');
      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json();

        if (partnersData.success && partnersData.data) {
          // Transform partners to manufacturers with proper logo data
          const manufacturerList = partnersData.data.map((partner: any) => ({
            id: partner.id,
            name: partner.name?.fr || partner.name?.en || partner.name || 'Unknown',
            slug: partner.slug,
            logoUrl: partner.logoUrl,
            websiteUrl: partner.websiteUrl,
            productCount: 0 // We'll update this if needed
          }));

          setManufacturers(manufacturerList);
        }
      }
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
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
              🏭 {t('manufacturers.badge')}
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('manufacturers.title')}
              <span className="text-primary-300 block mt-2">{t('manufacturers.titleSuffix')}</span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              {t('manufacturers.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Manufacturers Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text={t('manufacturers.loading')} />
            </div>
          ) : manufacturers.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  {t('manufacturers.sectionTitle')}
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {t('manufacturers.sectionDescription', {
                    count: manufacturers.length,
                    plural: manufacturers.length > 1 ? 's' : ''
                  })}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {manufacturers.map((manufacturer) => (
                  <Card key={manufacturer.slug} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                      <div className="w-full h-full bg-white flex items-center justify-center p-4">
                        {manufacturer.logoUrl ? (
                          <img
                            src={manufacturer.logoUrl}
                            alt={manufacturer.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Building2 className="h-12 w-12 text-slate-400 group-hover:text-primary transition-colors duration-300" />
                        )}
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                        {manufacturer.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      <div className="mb-4">
                        {manufacturer.websiteUrl && (
                          <a
                            href={manufacturer.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {t('manufacturers.websiteLink')}
                          </a>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-primary text-white hover:bg-primary-700"
                        asChild
                      >
                        <Link href={`/${locale}/partners/${manufacturer.slug}`} className="flex items-center justify-center">
                          {t('manufacturers.viewDetails')}
                          <ArrowRight className="ml-2 h-3 w-3" />
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
                {t('manufacturers.noManufacturers.title')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {t('manufacturers.noManufacturers.description')}
              </p>
              <Button asChild>
                <Link href={`/${locale}/products`}>
                  {t('manufacturers.backToProducts')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}