'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
}

/** Products per slide: 1 on phones, 2 from the md breakpoint (768px). */
const MD_QUERY = '(min-width: 768px)';
const AUTO_MS = 6000;

/**
 * The mockup shows the kind of device under the name (« Lampe à fente »), not the banner slogan.
 * Keyed by the banner title in lower case, without ® or spaces; unknown titles keep their subtitle.
 */
const DEVICE_TYPE: Record<string, string> = {
  elara900: 'Lampe à fente',
  metis900: 'Microscope opératoire',
  unitésynetic2: 'Unité de consultation',
  phantom: 'Unité de réfraction',
  eyestar900: 'Biomètre OCT',
  'eye-light': 'Sécheresse oculaire',
  'rs-1': 'Tomographe OCT',
  surgicube: 'Bloc opératoire mobile',
  'opério&steristay': "Flux d'air laminaire",
};
const typeKey = (title: string) => title.replace(/[®\s]/g, '').toLowerCase();

/** Panel colours sampled from the mockup: deeper blue on both sides, near-white centre and top. */
const PANEL_BG = [
  'radial-gradient(60% 40% at 50% 0%, rgba(243,251,255,0.95) 0%, rgba(243,251,255,0) 100%)',
  'radial-gradient(30% 14% at 25% 96%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)',
  'radial-gradient(30% 14% at 72% 96%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)',
  'linear-gradient(90deg, #C3E2F9 0%, #D3EAFB 12%, #E4F3FD 30%, #EAF6FE 50%, #E4F3FD 70%, #D3EAFB 88%, #C4E3F8 100%)',
].join(', ');
/** Thin white diagonal light streaks: top-left corner, lower-left and lower-right. */
const PANEL_SHEEN = [
  'linear-gradient(135deg, rgba(255,255,255,0) 6%, rgba(255,255,255,0.55) 9%, rgba(255,255,255,0) 13%)',
  'linear-gradient(160deg, rgba(255,255,255,0) 55%, rgba(255,255,255,0.4) 62%, rgba(255,255,255,0) 70%)',
  'linear-gradient(200deg, rgba(255,255,255,0) 60%, rgba(255,255,255,0.4) 66%, rgba(255,255,255,0) 73%)',
].join(', ');
const BUTTON_BG = 'linear-gradient(180deg, #149DEC 0%, #0377D1 35%, #0052B1 72%, #063C93 100%)';
const ARROW =
  'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[10px] bg-white text-[#0A0BA6] shadow-[0_3px_10px_rgba(20,60,120,0.14)] ring-1 ring-[#E3ECF5] transition-colors hover:text-accent sm:flex lg:h-[56px] lg:w-[56px]';

/**
 * « Découvrez nos équipements »: 2 products per slide (1 on phones).
 * Source, first non-empty of: banners « equipment-showcase », banners « homepage »
 * (the product slides managed in admin > Bannières), featured products.
 */
export function EquipmentCarousel({ locale }: { locale: string }) {
  const t = useTranslations('homePage.equipment');
  const [items, setItems] = useState<Item[] | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perSlide, setPerSlide] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const update = () => setPerSlide(mq.matches ? 2 : 1);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
          subtitle: (locale === 'fr' && DEVICE_TYPE[typeKey(b.title || '')]) || b.subtitle || undefined,
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
  for (let i = 0; i < (items?.length || 0); i += perSlide) slides.push(items!.slice(i, i + perSlide));
  // Never a half-empty last slide: complete it with the first products
  const lastSlide = slides[slides.length - 1];
  if (slides.length > 1 && lastSlide.length < perSlide) {
    slides[slides.length - 1] = [...lastSlide, ...items!.slice(0, perSlide - lastSlide.length)];
  }
  const count = slides.length;

  // Keep the current slide valid when the layout switches between 1 and 2 per slide
  useEffect(() => {
    if (count > 0 && slide >= count) setSlide(count - 1);
  }, [count, slide]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setSlide(s => (s + 1) % count), AUTO_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  if (items && items.length === 0) return null;

  const go = (d: number) => setSlide(s => (s + d + count) % count);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-8 lg:px-[28px]">
      <div
        className="relative overflow-hidden rounded-[12px] border border-white/80 px-3 pb-4 pt-5 shadow-[0_2px_10px_rgba(16,60,120,0.06)] sm:px-[88px] md:pb-[14px] md:pt-[18px]"
        style={{ background: PANEL_BG }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Light streaks of the mockup (thin white diagonal sheens on the sides) */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: PANEL_SHEEN }} />

        <div className="relative text-center">
          <h2 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-[#0A0EA4] sm:text-[34px] lg:text-[42px] lg:leading-[56px] xl:text-[49px]">
            {t('title')}
          </h2>
          <span aria-hidden="true" className="mx-auto mt-2 block h-[4px] w-20 rounded-full bg-[#D7191A] lg:mt-[11px] lg:h-[5px] lg:w-[112px]" />
        </div>

        {!items ? (
          <div className="relative mt-6 grid gap-6 md:grid-cols-2">
            {[0, 1].map(i => <div key={i} className={cn("h-72 animate-pulse rounded-xl bg-white/60 lg:h-[465px]", i > 0 && "hidden md:block")} />)}
          </div>
        ) : (
          <div className="relative mt-4 overflow-hidden lg:mt-[6px]">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {slides.map((group, gi) => (
                <div key={gi} className="grid w-full min-w-0 flex-none grid-cols-1 md:grid-cols-2" aria-hidden={gi !== slide}>
                  {group.map((item, ii) => (
                    <div
                      key={item.id}
                      className="relative flex min-w-0 items-center gap-3 py-2 md:gap-0 md:py-0 md:pl-[2%] lg:h-[440px] xl:h-[500px] xl:pl-[16px]"
                    >
                      {ii > 0 && (
                        <span aria-hidden="true" className="absolute left-0 top-[17%] hidden h-[63%] w-px bg-[#9FB4D1] md:block" />
                      )}
                      <Link
                        href={item.href}
                        tabIndex={gi === slide ? 0 : -1}
                        className="block h-44 w-[48%] flex-shrink-0 sm:h-60 md:mr-[3%] md:h-[340px] md:w-[54%] lg:h-[420px] lg:self-end xl:mb-[4px] xl:mr-[20px] xl:h-[470px] xl:w-[56%]"
                      >
                        {item.image && (
                          <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-contain object-bottom drop-shadow-[0_14px_14px_rgba(40,80,130,0.12)]" />
                        )}
                      </Link>
                      <div className={cn('relative min-w-0 flex-1', ii > 0 ? 'md:mt-[90px] xl:mt-[104px]' : 'xl:mt-[16px]')}>
                        <p className="break-words text-xl font-bold uppercase leading-[1.1] text-[#0A0E96] sm:text-2xl lg:text-[28px] xl:text-[34px]">{item.title}</p>
                        {item.subtitle && <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[#13277A] sm:text-base lg:text-xl xl:mt-[12px] xl:text-[23px]">{item.subtitle}</p>}
                        <Link
                          href={item.href}
                          tabIndex={gi === slide ? 0 : -1}
                          className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#0A4AA6] px-4 text-sm font-semibold text-white shadow-[0_3px_8px_rgba(2,60,150,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] transition-[filter] hover:brightness-110 lg:h-[46px] lg:px-6 lg:text-lg xl:mt-[14px] xl:h-[50px] xl:min-w-[182px] xl:text-[20px]"
                          style={{ background: BUTTON_BG }}
                        >
                          {t('cta')}
                          <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
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
              className={cn(ARROW, 'left-4')}
            >
              <ChevronLeft className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={3.25} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('next')}
              className={cn(ARROW, 'right-4')}
            >
              <ChevronRight className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={3.25} />
            </button>
            <div className="relative mt-3 flex justify-center gap-3 lg:mt-[6px] lg:gap-[25px]">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={t('goTo', { number: i + 1 })}
                  className={cn(
                    'h-3 w-3 rounded-full transition-colors lg:h-4 lg:w-4',
                    i === slide ? 'bg-[#04389C]' : 'bg-[#ABBCD8] hover:bg-[#8FA5C9]'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
