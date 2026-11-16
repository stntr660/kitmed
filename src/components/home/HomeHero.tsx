'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';

interface HeroBanner {
  title?: string;
  description?: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

/*
 * Geometry measured on the client mockup (hero = 665×183 px there, 1440×396 on the site):
 * the photo is cut by one big circle whose centre sits below the banner, at
 * 87.7% / 112% of the box, radius 43.6% of the width (161% of the height).
 * A thin cyan rim and a soft light-blue glow run along that curve.
 */
const CURVE = '43.6% 161% at 87.7% 112%';

/** Blue panel: navy on the left, brightening towards the curve, a bit darker at the bottom. */
const PANEL_BG = [
  // rim (cyan line) along the curve, drawn under the clipped photo
  `radial-gradient(${CURVE}, #48A6DE 0, #48A6DE calc(100% + 7px), #2F86CE calc(100% + 9px), transparent calc(100% + 10px))`,
  // the blue brightens as it nears the curve (measured: ~#1A70C6 at the rim, ~#0052B4 140px away, navy beyond 400px)
  `radial-gradient(${CURVE}, #1A70C6 calc(100% + 9px), #0C68C4 calc(100% + 40px), #0560C0 calc(100% + 90px), #0052B4 calc(100% + 145px), rgba(0,70,170,0.7) calc(100% + 205px), rgba(0,58,150,0.3) calc(100% + 300px), rgba(0,53,147,0) calc(100% + 410px))`,
  // soft diagonal light sweeps seen in the mockup
  'radial-gradient(28% 55% at 33% 28%, rgba(20,95,200,0.32), rgba(20,95,200,0) 100%)',
  'radial-gradient(22% 45% at 12% 62%, rgba(25,70,150,0.25), rgba(25,70,150,0) 100%)',
].join(', ');

/** Navy base: slightly lighter at the top, darker at the bottom. */
const BASE_BG = 'linear-gradient(180deg, #00399D 0%, #00368F 35%, #003289 60%, #002E7C 88%, #002A72 100%)';

/** Phones / tablets: same navy, brightening towards the photo below (like the desktop curve). */
const STACKED_BG = 'radial-gradient(130% 70% at 70% 100%, #1A70C6 0%, #0560C0 25%, rgba(0,82,180,0.6) 50%, rgba(0,53,147,0) 80%)';

/**
 * Homepage hero. Text and photo come from the mockup by default; an active
 * banner with position « homepage-hero » (admin > Bannières) overrides the
 * title, text, photo and first button. The 2nd button (« Nous contacter ») is fixed.
 */
export function HomeHero({ locale }: { locale: string }) {
  const t = useTranslations('homePage.hero');
  const [banner, setBanner] = useState<HeroBanner | null>(null);

  useEffect(() => {
    fetch(`/api/banners?position=homepage-hero&locale=${locale}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) setBanner(result.data[0]);
      })
      .catch(() => {});
  }, [locale]);

  const title = (banner?.title || t('title')).replace(/'/g, '’');
  const text = banner?.description || banner?.subtitle || t('text');
  const photo = banner?.backgroundUrl || banner?.imageUrl || '/images/home/hero-photo.jpg';
  const primaryHref = banner?.ctaUrl ? banner.ctaUrl.replace(/^\/(fr|en)(?=\/|$)/, `/${locale}`) : `/${locale}/products`;
  const primaryLabel = banner?.ctaText || t('primary');

  // Mockup breaks the default title after the first comma.
  const comma = title.indexOf(', ');
  const titleLines = comma > 0 ? [title.slice(0, comma + 1), title.slice(comma + 2)] : [title];

  return (
    <section className="relative overflow-hidden" style={{ background: BASE_BG }}>
      <div className="absolute inset-0 lg:hidden" style={{ background: STACKED_BG }} aria-hidden="true" />
      <div className="absolute inset-0 hidden lg:block" style={{ background: PANEL_BG }} aria-hidden="true" />
      {/* Photo: stacked under the text on phones, cut by the curve from lg up */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ clipPath: `ellipse(${CURVE})` }}
        aria-hidden="true"
      >
        <img src={photo} alt="" className="absolute inset-y-0 right-0 h-full w-[56.2%] object-cover" />
      </div>

      <div className="relative px-4 pb-8 pt-10 sm:px-8 lg:h-[min(27.5vw,396px)] lg:px-[5.35%] lg:pb-0 lg:pt-[min(4.375vw,63px)]">
        <div className="min-w-0 text-white lg:max-w-[48%]">
          <h1 className="break-words text-[32px] font-semibold leading-[1.12] tracking-[-0.01em] sm:text-[40px] lg:text-[min(3.8vw,54.7px)] lg:leading-[min(3.61vw,52px)]">
            {titleLines.map((line, i) => (
              <span key={i} className="lg:block lg:whitespace-nowrap">
                {line}
                {i < titleLines.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <p className="mt-3 max-w-[30em] text-[17px] leading-[1.45] text-white sm:text-lg lg:mt-[min(1.39vw,20px)] lg:max-w-[min(36vw,520px)] lg:text-[min(1.8vw,26px)] lg:leading-[min(2.29vw,33px)]">
            {text}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-[min(0.97vw,14px)] lg:flex-nowrap lg:gap-[min(1.6vw,23px)]">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-3 lg:gap-[min(0.9vw,13px)] rounded-lg bg-[linear-gradient(180deg,#EC2D2A_0%,#DA1A25_45%,#C4060E_100%)] px-6 text-[16px] font-medium text-white shadow-[0_3px_8px_rgba(80,0,20,0.35)] transition-[filter] hover:brightness-110 lg:h-[min(3.75vw,54px)] lg:w-[min(20.1vw,290px)] lg:px-0 lg:text-[min(1.25vw,18px)]"
            >
              {primaryLabel}
              <ChevronRight className="h-4 w-4 lg:h-[min(1.25vw,18px)] lg:w-[min(1.25vw,18px)]" strokeWidth={2.5} />
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-12 items-center justify-center gap-3 lg:gap-[min(0.9vw,13px)] rounded-[10px] border-[1.5px] border-white/75 px-6 text-[16px] font-medium text-white transition-colors hover:bg-white hover:text-[#003A85] lg:h-[min(3.75vw,54px)] lg:w-[min(15.9vw,229px)] lg:px-0 lg:text-[min(1.25vw,18px)]"
            >
              {t('secondary')}
              <ChevronRight className="h-4 w-4 lg:h-[min(1.25vw,18px)] lg:w-[min(1.25vw,18px)]" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Phone / tablet: photo below the text with the same curved, rimmed edge on top */}
      <div className="relative h-[220px] sm:h-[300px] lg:hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{ clipPath: 'ellipse(120% 100% at 70% 100%)', background: '#48A6DE' }} />
        <div className="absolute inset-x-0 bottom-0 top-[7px]" style={{ clipPath: 'ellipse(120% 100% at 70% 100%)' }}>
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
