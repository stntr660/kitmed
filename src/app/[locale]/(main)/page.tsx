'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { ManufacturerCarousel } from '@/components/carousel/ManufacturerCarousel';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { DynamicBanner } from '@/components/banners/DynamicBanner';
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

interface Product {
  id: string;
  name: string;
  slug: string;
  media: Array<{ id: string; type: string; url: string; isPrimary: boolean; altText: string | null }>;
}

const localized = (value: unknown, locale: string): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, string>;
    return v[locale] || v.fr || v.en || '';
  }
  return '';
};

/** Homepage in the order of the client mockup (KITMED_Accueil_Banniere_Equipements). */
export default function HomePage() {
  const t = useTranslations('homePage');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const isHydrated = useIsHydrated();
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    if (!isHydrated) return;

    fetch(`/api/partners?status=active&pageSize=12`)
      .then(res => res.json())
      .then(result => {
        if (!result.success || !result.data) return;
        const list: Partner[] = result.data.map((partner: any) => ({
          id: partner.id,
          name: localized(partner.name, locale) || 'Partner',
          logo: partner.logoUrl || '/uploads/partners/default.png',
          description: localized(partner.description, locale),
          featured: partner.featured || false,
          priority: partner.priority || 0,
        }));
        setPartners(list);
      })
      .catch(error => console.error('Error fetching partners:', error))
      .finally(() => setPartnersLoading(false));

    fetch(`/api/products?status=active&featured=true&pageSize=4&locale=${locale}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) setFeaturedProducts(result.data.items || []);
      })
      .catch(error => console.error('Error fetching featured products:', error))
      .finally(() => setProductsLoading(false));
  }, [locale, isHydrated]);

  return (
    <HydrationErrorBoundary>
      <div className="flex flex-col bg-white">
        <DynamicBanner position="homepage" />
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
              className="mt-2"
              locale={locale}
            />
          </div>
        </section>

        {/* Produits phares */}
        <section className="container mx-auto px-4 py-12 lg:px-8">
          <SectionTitle title={t('featured.title')} align="center" />
          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {!isHydrated || productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map(product => {
                const image = product.media?.find(m => m.isPrimary && m.type === 'image') || product.media?.[0];
                const href = `/${locale}/products/${product.slug}`;
                return (
                  <Link
                    key={product.id}
                    href={href}
                    className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-36 items-center justify-center sm:h-48">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.altText || product.name}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full rounded-lg bg-gray-50" />
                      )}
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-sm font-bold text-[#10146B] sm:text-base">{product.name}</h3>
                    <span className="mt-auto inline-flex items-center justify-center gap-1 pt-2 text-sm font-medium text-[#0B5CAD] group-hover:text-accent">
                      {t('featured.cta')}
                      <ChevronRight className="h-4 w-4 text-accent" />
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="col-span-full py-8 text-center text-gray-500">{t('featured.empty')}</p>
            )}
          </div>
        </section>

        {/* KITMED, votre partenaire depuis 1997 */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#DCEEFD] via-[#E8F4FE] to-[#F3F9FF]">
          <img
            src="/images/home/band-building.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-y-0 right-0 hidden h-full w-[45%] object-cover md:block"
          />
          <div className="absolute inset-y-0 right-0 hidden w-[45%] bg-gradient-to-r from-[#E8F4FE] to-transparent md:block" />
          <div className="relative container mx-auto px-4 py-10 lg:px-8">
            <div className="max-w-2xl border-l-4 border-accent pl-4 sm:pl-6">
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
        </section>
      </div>
    </HydrationErrorBoundary>
  );
}
