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

  const title = banner?.title || t('title');
  const text = banner?.description || banner?.subtitle || t('text');
  const photo = banner?.backgroundUrl || banner?.imageUrl || '/images/home/hero.jpg';
  const primaryHref = banner?.ctaUrl ? banner.ctaUrl.replace(/^\/(fr|en)(?=\/|$)/, `/${locale}`) : `/${locale}/products`;
  const primaryLabel = banner?.ctaText || t('primary');

  return (
    <section className="relative overflow-hidden bg-[#003A85]">
      <img
        src={photo}
        alt=""
        aria-hidden="true"
        className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-[62%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#00306F] via-[#003A85]/90 to-[#003A85]/30 md:via-[#003A85]/85 md:to-transparent" />
      <div className="relative container mx-auto px-4 py-14 lg:px-8 lg:py-20">
        <div className="max-w-xl text-white">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 lg:text-lg">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              {primaryLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 rounded-md border border-white px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#003A85]"
            >
              {t('secondary')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
