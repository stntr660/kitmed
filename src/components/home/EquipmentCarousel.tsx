'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
}

const PER_SLIDE = 2;
const AUTO_MS = 6000;

/**
 * « Découvrez nos équipements »: 2 products per slide.
 * Source, first non-empty of: banners « equipment-showcase », banners « homepage »
 * (the product slides managed in admin > Bannières), featured products.
 */
export function EquipmentCarousel({ locale }: { locale: string }) {
  const t = useTranslations('homePage.equipment');
  const [items, setItems] = useState<Item[] | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const localize = (url: string) => url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/(fr|en)(?=\/|$)/, `/${locale}`);
    const fromBanners = async (position: string): Promise<Item[]> => {
      const res = await fetch(`/api/banners?position=${position}&locale=${locale}`);
      const result = await res.json();
      return (result.success ? result.data || [] : [])
        .filter((b: any) => b.imageUrl)
        .map((b: any) => ({
          id: b.id,
          title: (b.title || '').trim(),
          subtitle: b.subtitle || undefined,
          image: b.imageUrl,
          href: b.ctaUrl ? localize(b.ctaUrl) : `/${locale}/products`,
        }));
    };
    const fromFeatured = async (): Promise<Item[]> => {
      const res = await fetch(`/api/products?status=active&featured=true&pageSize=8&locale=${locale}`);
      const result = await res.json();
      return (result.success ? result.data?.items || [] : []).map((p: any) => ({
        id: p.id,
        title: p.name,
        subtitle: p.category?.name,
        image: p.media?.find((m: any) => m.isPrimary && m.type === 'image')?.url || p.media?.[0]?.url,
        href: `/${locale}/products/${p.slug}`,
      }));
    };
    (async () => {
      let list: Item[] = [];
      for (const load of [() => fromBanners('equipment-showcase'), () => fromBanners('homepage'), fromFeatured]) {
        try { list = await load(); } catch { list = []; }
        if (list.length) break;
      }
      if (!cancelled) setItems(list);
    })();
    return () => { cancelled = true; };
  }, [locale]);

  const slides: Item[][] = [];
  for (let i = 0; i < (items?.length || 0); i += PER_SLIDE) slides.push(items!.slice(i, i + PER_SLIDE));
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setSlide(s => (s + 1) % count), AUTO_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (items && items.length === 0) return null;

  const go = (d: number) => setSlide(s => (s + d + count) % count);

  return (
    <section className="container mx-auto px-4 pt-10 lg:px-8">
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D3E8FB] via-[#E9F4FE] to-[#D3E8FB] px-4 pb-8 pt-8 sm:px-14"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <SectionTitle title={t('title')} align="center" />

        {!items ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[0, 1].map(i => <div key={i} className="h-72 animate-pulse rounded-xl bg-white/60" />)}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {slides.map((group, gi) => (
                <div key={gi} className="grid w-full flex-none grid-cols-1 md:grid-cols-2" aria-hidden={gi !== slide}>
                  {group.map((item, ii) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-4 px-2 py-4 sm:gap-6 md:px-6',
                        ii > 0 && 'border-t border-[#10146B]/15 md:border-l md:border-t-0'
                      )}
                    >
                      <Link href={item.href} tabIndex={gi === slide ? 0 : -1} className="block h-44 w-1/2 flex-shrink-0 sm:h-60 lg:h-72">
                        {item.image && (
                          <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-contain" />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <p className="text-xl font-bold uppercase leading-tight text-[#10146B] lg:text-2xl">{item.title}</p>
                        {item.subtitle && <p className="mt-1 line-clamp-2 text-sm text-[#10146B] lg:text-base">{item.subtitle}</p>}
                        <Link
                          href={item.href}
                          tabIndex={gi === slide ? 0 : -1}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#0B5CAD] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#094C8F]"
                        >
                          {t('cta')}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('previous')}
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#10146B] shadow-sm hover:text-accent sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('next')}
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#10146B] shadow-sm hover:text-accent sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mt-4 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={t('goTo', { number: i + 1 })}
                  className={cn('h-2.5 w-2.5 rounded-full transition-colors', i === slide ? 'bg-[#0B5CAD]' : 'bg-[#10146B]/20 hover:bg-[#10146B]/40')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
