'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  name: string;
  slug?: string;
  logo: string;
  description: string;
  featured?: boolean;
  priority?: number;
}

interface ManufacturerCarouselProps {
  partners: Partner[];
  isLoading: boolean;
  className?: string;
  locale?: string;
}

/** Shown first, as on the client mockup. */
const FIRST = ['NIDEK', 'MORIA'];
const MD_QUERY = '(min-width: 768px)';
const AUTO_MS = 5000;

/** « Nos partenaires » of the mockup: 2 big logos per slide (1 on phones), a divider between them, arrows on the sides. */
export function ManufacturerCarousel({ partners, isLoading, className, locale = 'fr' }: ManufacturerCarouselProps) {
  const [perSlide, setPerSlide] = useState(1);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    const update = () => setPerSlide(mq.matches ? 2 : 1);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const rank = (p: Partner) => {
    const i = FIRST.indexOf(p.name.toUpperCase());
    return i === -1 ? FIRST.length : i;
  };
  const sorted = partners
    .filter(p => p.logo)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(x => x.p);

  const slides: Partner[][] = [];
  for (let i = 0; i < sorted.length; i += perSlide) slides.push(sorted.slice(i, i + perSlide));
  // Never a half-empty last slide: complete it with the first logos
  const last = slides[slides.length - 1];
  if (slides.length > 1 && last.length < perSlide) slides[slides.length - 1] = [...last, ...sorted.slice(0, perSlide - last.length)];
  const count = slides.length;

  useEffect(() => setSlide(0), [perSlide]);
  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % count), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  if (isLoading) {
    return <div className={cn('mx-auto h-[100px] max-w-3xl animate-pulse rounded-lg bg-white/60', className)} />;
  }
  if (count === 0) return null;

  const go = (delta: number) => setSlide(s => (s + delta + count) % count);
  // Mockup: 45px white tiles, soft edge, navy chevron.
  const arrow =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[5px] border border-[#E2EAF4] bg-[#F7F9FC] text-[#11109A] shadow-[0_1px_3px_rgba(16,40,90,0.18)] transition-colors hover:text-[#DD0F0E] lg:h-[45px] lg:w-[45px]';

  return (
    <div
      className={cn('flex items-center px-3 lg:px-[76px]', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" onClick={() => go(-1)} aria-label="Partenaires précédents" className={arrow}>
        <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1 overflow-hidden" role="region" aria-label="Logos des partenaires">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((group, gi) => (
            <div key={gi} className="flex w-full flex-none items-center">
              {group.map((partner, i) => (
                <div key={partner.id} className="relative flex h-[100px] flex-1 items-center justify-center px-4">
                  {i > 0 && <span aria-hidden="true" className="absolute left-0 top-1/2 h-[62px] w-[1.5px] -translate-y-1/2 bg-[#86A3C0]" />}
                  <Link href={`/${locale}/partners`} title={partner.name}>
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      loading="eager"
                      decoding="async"
                      className="max-h-[72px] max-w-[200px] object-contain mix-blend-multiply lg:max-h-[86px] lg:max-w-[250px]"
                    />
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => go(1)} aria-label="Partenaires suivants" className={arrow}>
        <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={3} />
      </button>
    </div>
  );
}
