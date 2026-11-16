'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { ManufacturerCarousel } from '@/components/carousel/ManufacturerCarousel';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { HomeHero } from '@/components/home/HomeHero';
import { ServiceStrip } from '@/components/home/ServiceStrip';
import { EquipmentCarousel } from '@/components/home/EquipmentCarousel';
import { ExpertiseGrid } from '@/components/home/ExpertiseGrid';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { useIsHydrated } from '@/components/ui/hydration-safe';
import { HydrationErrorBoundary } from '@/components/ui/hydration-error-boundary';

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  featured?: boolean;
  priority?: number;
}

const localized = (value: unknown, locale: string): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, string>;
    return v[locale] || v.fr || v.en || '';
  }
  return '';
};

/**
 * Homepage = client mockup « KITMED | Maquette de la page d'accueil » (2026-11-16), read left to right:
 * hero, service strip, « Découvrez nos équipements », « Nos domaines d'expertise » (8 tiles),
 * « Nos partenaires », « KITMED, votre partenaire depuis 1997 ».
 */
export default function HomePage() {
  const t = useTranslations('homePage');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const isHydrated = useIsHydrated();
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    if (!isHydrated) return;

    fetch(`/api/partners?status=active&pageSize=50`)
      .then(res => res.json())
      .then(result => {
        if (!result.success || !result.data) return;
        setPartners(
          result.data.map((partner: any) => ({
            id: partner.id,
            name: localized(partner.name, locale) || 'Partner',
            logo: partner.logoUrl || '',
            description: localized(partner.description, locale),
            featured: partner.featured || false,
            priority: partner.priority || 0,
          }))
        );
      })
      .catch(error => console.error('Error fetching partners:', error))
      .finally(() => setPartnersLoading(false));
  }, [locale, isHydrated]);

  return (
    <HydrationErrorBoundary>
      <div className="flex flex-col bg-white">
        <HomeHero locale={locale} />
        <ServiceStrip locale={locale} />
        <EquipmentCarousel locale={locale} />
        <ExpertiseGrid locale={locale} />

        {/* Nos partenaires */}
        <section className="bg-gradient-to-r from-[#E1F0FD] via-[#EEF7FF] to-[#E1F0FD] py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionTitle title={t('partners.title')} align="center" />
            <ManufacturerCarousel
              partners={partners}
              isLoading={!isHydrated || partnersLoading}
              className="mt-4"
              locale={locale}
            />
          </div>
        </section>

        {/* KITMED, votre partenaire depuis 1997 */}
        <section className="container mx-auto px-4 py-10 lg:px-8">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#DCEEFD] via-[#E8F4FE] to-[#F3F9FF] shadow-sm">
            <div className="absolute inset-y-0 right-0 hidden md:block">
              <img src="/images/home/band-building.jpg" alt="" aria-hidden="true" className="h-full w-auto object-contain" />
              <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#EEF6FE] to-transparent" />
            </div>
            <div className="relative px-6 py-10 sm:px-10 lg:py-14">
              <div className="max-w-2xl border-l-4 border-accent pl-4 sm:pl-6 md:max-w-[55%]">
                <h2 className="text-2xl font-bold text-[#10146B] lg:text-3xl">{t('band.title')}</h2>
                <p className="mt-2 text-[#10146B]">{t('band.text')}</p>
                <Link
                  href={`/${locale}/about`}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
                >
                  {t('band.cta')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrationErrorBoundary>
  );
}
