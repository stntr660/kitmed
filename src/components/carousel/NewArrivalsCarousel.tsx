'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface NewArrivalProduct {
  id: string;
  name: string;
  slug: string;
  manufacturer?: { name: string };
  category?: { name: string } | null;
  media: Array<{ type: string; url: string; isPrimary: boolean; altText: string | null }>;
}

interface NewArrivalsCarouselProps {
  products: NewArrivalProduct[];
  isLoading: boolean;
  className?: string;
  locale?: string;
}

// Card width (w-72 = 288px) + gap (gap-6 = 24px)
const CARD_WIDTH = 312;
// Below this count the row fits on screen: shown static and centred, not scrolled
const MIN_TO_SCROLL = 4;

export function NewArrivalsCarousel({
  products,
  isLoading,
  className,
  locale = 'fr'
}: NewArrivalsCarouselProps) {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [translateX, setTranslateX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrolls = products.length >= MIN_TO_SCROLL;

  // Continuous scrolling, paused on hover (same behaviour as the partner logos strip)
  useEffect(() => {
    if (!scrolls || isLoading) return;

    intervalRef.current = setInterval(() => {
      if (!isHovered) {
        setTranslateX((prev) => {
          const next = prev - 1;
          return next <= -(CARD_WIDTH * products.length) ? 0 : next;
        });
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scrolls, products.length, isHovered, isLoading]);

  const goToPrevious = () => {
    setTranslateX((prev) => {
      const next = prev + CARD_WIDTH;
      return next > 0 ? -(CARD_WIDTH * (products.length - 1)) : next;
    });
  };

  const goToNext = () => {
    setTranslateX((prev) => {
      const next = prev - CARD_WIDTH;
      return next <= -(CARD_WIDTH * products.length) ? 0 : next;
    });
  };

  if (isLoading) {
    return (
      <div className={cn("flex justify-center gap-6 overflow-hidden py-6", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex-none w-72 h-80 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  // Tripled for a seamless loop when scrolling
  const items = scrolls ? [...products, ...products, ...products] : products;

  const renderCard = (product: NewArrivalProduct, key: string) => {
    const image = product.media?.find(m => m.isPrimary && m.type === 'image')
      || product.media?.find(m => m.type === 'image');

    return (
      <Link
        key={key}
        href={`/${locale}/products/${product.slug}`}
        className="group flex-none w-72 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <div className="relative h-56 bg-white p-6">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-50" />
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-white border-0 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {tCommon('newArrival')}
            </Badge>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1">{product.manufacturer?.name}</p>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          {product.category && (
            <p className="text-xs text-primary-600 font-medium mt-2">{product.category.name}</p>
          )}
          <span className="mt-4 inline-flex items-center text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
            {t('newArrivals.viewDetails')}
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </Link>
    );
  };

  if (!scrolls) {
    return (
      <div className={cn("flex flex-wrap justify-center gap-6 py-6", className)}>
        {items.map((product) => renderCard(product, product.id))}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-primary-600 transition-colors duration-200"
        onClick={goToPrevious}
        aria-label="Previous products"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-primary-600 transition-colors duration-200"
        onClick={goToNext}
        aria-label="Next products"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div
        className="overflow-hidden py-6 mx-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="New arrivals carousel"
      >
        <div
          className="flex gap-6"
          style={{
            transform: `translateX(${translateX}px)`,
            width: `${items.length * CARD_WIDTH}px`,
          }}
        >
          {items.map((product, index) => renderCard(product, `${product.id}-${index}`))}
        </div>
      </div>
    </div>
  );
}
