'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

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

export default function PartnersPage() {
  const t = useTranslations('partners');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/partners');

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
  }, []);

  const getPartnerName = (partner: Partner) => {
    return partner.name[locale as keyof typeof partner.name] || partner.name.fr || partner.name.en;
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('partners-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('all.title')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section id="partners-grid" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {partners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <Link key={partner.id} href={`/${locale}/partners/${partner.slug}`}>
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
                  {t('noPartners.title')}
                </h3>
                <p className="text-gray-600">
                  {t('noPartners.description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
