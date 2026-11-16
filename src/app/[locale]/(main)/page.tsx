'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type React from 'react';
import { ChevronRight } from 'lucide-react';
import { ManufacturerCarousel } from '@/components/carousel/ManufacturerCarousel';
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

/* Curve of the 1997 band, drawn in the box of the portrait building photo (viewBox 1000×1000 stretched
   to the photo, which is shown whole, roof to lawn: owner 2026-11-16) so it sits at the same place on the
   photo at every screen width; slightly bowed like the mockup. */
const CURVE = (dx: number) => `M${110 + dx} 0 Q${52 + dx} 500 ${0 + dx} 1000`;
const CURVE_BACK = (dx: number) => `L${0 + dx} 1000 Q${52 + dx} 500 ${110 + dx} 0 Z`;
const CURVE_M = (dy: number) => `M0 ${170 + dy} Q450 ${40 + dy} 1000 ${10 + dy}`;
const CURVE_M_BACK = (dy: number) => `L1000 ${10 + dy} Q450 ${40 + dy} 0 ${170 + dy} Z`;

const svgMask = (d: string): React.CSSProperties => {
  const url = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'><path d='${d}' fill='#000'/></svg>`
  )}")`;
  return { WebkitMaskImage: url, maskImage: url, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' };
};
const BAND_PHOTO_MASK = svgMask(`M110 0 Q52 500 0 1000 L1000 1000 L1000 0 Z`);
const BAND_PHOTO_MASK_MOBILE = svgMask(`M0 170 Q450 40 1000 10 L1000 1000 L0 1000 Z`);

/** Cyan swoosh along the curve: bright thin edge, solid cyan, then fading into the photo (thin slices = smooth gradient). */
function BandSwoosh({ className, mobile = false }: { className?: string; mobile?: boolean }) {
  const STEPS = 16;
  const SOLID = mobile ? 14 : 45; // viewBox units of solid cyan before the fade
  const FADE = mobile ? 40 : 60;
  const slices = Array.from({ length: STEPS }, (_, i) => {
    const a = SOLID + (FADE * i) / STEPS;
    const b = SOLID + (FADE * (i + 1)) / STEPS;
    return { a, b, o: 0.85 * (1 - (i + 0.5) / STEPS) };
  });
  const shape = (a: number, b: number) => (mobile ? `${CURVE_M(a)} ${CURVE_M_BACK(b)}` : `${CURVE(a)} ${CURVE_BACK(b)}`);
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <defs>
        <linearGradient id={mobile ? 'swM' : 'sw'} x1="0" y1="0" x2={mobile ? '1' : '0'} y2={mobile ? '0' : '1'}>
          <stop offset="0" stopColor="#62C2F8" />
          <stop offset="0.45" stopColor="#8FD3FB" />
          <stop offset="1" stopColor="#A2DBFB" />
        </linearGradient>
      </defs>
      <path d={shape(0, SOLID)} fill={`url(#${mobile ? 'swM' : 'sw'})`} />
      {slices.map(({ a, b, o }) => (
        <path key={a} d={shape(a, b + 0.5)} fill={`url(#${mobile ? 'swM' : 'sw'})`} fillOpacity={o} />
      ))}
      <path d={mobile ? CURVE_M(0) : CURVE(0)} fill="none" stroke="#E4F5FF" strokeOpacity="0.9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

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

        {/* Nos partenaires — mockup: flat #D8EEFC band slightly wider than the grid, square corners */}
        <section className="px-4 pb-6 pt-8 lg:px-[28px] lg:pb-[54px] lg:pt-[34px]">
          <div className="mx-auto max-w-[1384px] rounded-[2px] bg-[#D8EEFC] pb-5 pt-4 lg:h-[221px] lg:pb-0 lg:pt-[10px]">
            <h2 className="text-center text-[26px] font-bold leading-tight tracking-[-0.01em] text-[#0A0EA4] sm:text-[34px] lg:text-[42px] lg:leading-[56px] xl:text-[49px]">{t('partners.title')}</h2>
            <span aria-hidden="true" className="mx-auto mt-2 block h-[3px] w-16 bg-[#DD0F0E] lg:mt-[10px] lg:h-[5px] lg:w-[101px]" />
            <ManufacturerCarousel
              partners={partners}
              isLoading={!isHydrated || partnersLoading}
              className="mt-3 lg:mt-[2px]"
              locale={locale}
            />
          </div>
        </section>

        {/* KITMED, votre partenaire depuis 1997 — mockup: light-blue band, building photo on the right behind a curved cyan swoosh */}
        <section className="px-4 pb-10 lg:px-[28px]">
          <div className="relative mx-auto max-w-[1384px] overflow-hidden rounded-[3px_3px_10px_10px] bg-[linear-gradient(180deg,#D9EFFD_0%,#D4EBFB_100%)] shadow-[0_3px_8px_rgba(20,60,120,0.14)] md:h-[340px] lg:h-[473px]">
            {/* Desktop photo: masked to the right of the curve, swoosh drawn over the seam */}
            <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden aspect-[1024/1230] md:block">
              <img src="/images/home/band-building.jpg" alt="" className="h-full w-full" style={BAND_PHOTO_MASK} />
              <BandSwoosh className="absolute inset-0 h-full w-full" />
            </div>

            <div className="relative px-5 pb-6 pt-7 md:pl-[45px] md:pr-0 md:pt-[39px] xl:pl-[52px] xl:pt-[45px]">
              <div className="border-l-4 border-[#DD0F0E] pl-4 md:max-w-[56%] md:pl-[31px] xl:max-w-[680px]">
                <h2 className="-mt-[6px] text-[22px] font-bold leading-[1.2] text-[#080CA0] md:text-[26px] lg:text-[30px] xl:whitespace-nowrap xl:text-[35px]">{t('band.title')}</h2>
                <p className="mt-2 text-[15px] leading-[1.2] text-[#1E4597] lg:mt-[8px] lg:max-w-[560px] lg:text-[19px] xl:max-w-[640px] xl:text-[22px]">{t('band.text')}</p>
                <Link
                  href={`/${locale}/about`}
                  className="mt-4 inline-flex h-[41px] items-center gap-3 rounded-[6px] bg-[linear-gradient(180deg,#EE2B27_0%,#D0110D_55%,#B90606_100%)] px-[20px] text-[16px] font-medium lg:text-[17px] text-white shadow-[0_2px_4px_rgba(120,0,0,0.35)] transition-[filter] hover:brightness-110 lg:mt-[13px] lg:w-[195px] lg:justify-center lg:px-0 xl:h-[47px] xl:w-[225px] xl:text-[19px]"
                >
                  {t('band.cta')}
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
            </div>

            {/* Phone photo: below the text, curved top edge */}
            <div aria-hidden="true" className="relative h-[460px] md:hidden">
              <div className="absolute inset-0" style={BAND_PHOTO_MASK_MOBILE}>
                <img src="/images/home/band-building.jpg" alt="" className="h-full w-full object-cover" style={{ objectPosition: '50% 100%' }} />
              </div>
              <BandSwoosh mobile className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        </section>
      </div>
    </HydrationErrorBoundary>
  );
}
