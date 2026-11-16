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
  const count = slides.length;

  useEffect(() => setSlide(0), [perSlide]);
  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % count), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  if (isLoading) {
    return <div className={cn('mx-auto h-28 max-w-3xl animate-pulse rounded-lg bg-white/60', className)} />;
  }
  if (count === 0) return null;

  const go = (delta: number) => setSlide(s => (s + delta + count) % count);
  const arrow = 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-[#10146B] shadow-sm transition-colors hover:text-accent';

  return (
    <div
      className={cn('mx-auto flex max-w-4xl items-center gap-4', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" onClick={() => go(-1)} aria-label="Partenaires précédents" className={arrow}>
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex-1 overflow-hidden" role="region" aria-label="Logos des partenaires">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((group, gi) => (
            <div key={gi} className="flex w-full flex-none items-center">
              {group.map((partner, i) => (
                <div
                  key={partner.id}
                  className={cn('flex h-28 flex-1 items-center justify-center px-6', i > 0 && 'border-l border-[#10146B]/25')}
                >
                  <Link href={`/${locale}/partners`} title={partner.name}>
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      loading="lazy"
                      className="max-h-20 max-w-[220px] object-contain mix-blend-multiply"
                    />
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => go(1)} aria-label="Partenaires suivants" className={arrow}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
