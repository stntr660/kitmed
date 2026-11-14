'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Partner {
  id: string;
  name: string;
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

export function ManufacturerCarousel({
  partners,
  isLoading,
  className,
  locale = 'fr'
}: ManufacturerCarouselProps) {
  const t = useTranslations('homePage.partners');
  const [translateX, setTranslateX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Sort partners to prioritize featured ones
  const sortedPartners = [...partners].sort((a, b) => {
    if (a.featured !== b.featured) {
      return b.featured ? 1 : -1; // Featured partners first
    }
    if (a.priority !== b.priority) {
      return (b.priority || 0) - (a.priority || 0); // Higher priority first
    }
    return a.name.localeCompare(b.name); // Alphabetical by name
  });

  // Continuous smooth scrolling effect - faster speed
  useEffect(() => {
    const startContinuousScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!isHovered && sortedPartners.length > 0) {
          setTranslateX((prev) => {
            // Move by 2px every 30ms for faster smooth continuous scroll
            const newTranslateX = prev - 2;
            // Reset when we've scrolled through one complete set
            const logoWidth = 240; // Updated width for bigger spacing
            const resetPoint = -(logoWidth * sortedPartners.length);
            return newTranslateX <= resetPoint ? 0 : newTranslateX;
          });
        }
      }, 30); // 30ms intervals for faster movement
    };

    if (sortedPartners.length > 0 && !isLoading) {
      startContinuousScroll();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sortedPartners.length, isHovered, isLoading]);

  // Manual navigation functions
  const goToPrevious = () => {
    setTranslateX((prev) => {
      const logoWidth = 240;
      const maxScroll = logoWidth * sortedPartners.length;
      const newTranslateX = prev + logoWidth * 3; // Move 3 logos at a time
      return newTranslateX > 0 ? -maxScroll + logoWidth : newTranslateX;
    });
  };

  const goToNext = () => {
    setTranslateX((prev) => {
      const logoWidth = 240;
      const resetPoint = -(logoWidth * sortedPartners.length);
      const newTranslateX = prev - logoWidth * 3; // Move 3 logos at a time
      return newTranslateX <= resetPoint ? 0 : newTranslateX;
    });
  };

  // Create duplicated partners array for seamless infinite scrolling
  const extendedPartners = [...sortedPartners, ...sortedPartners, ...sortedPartners]; // Triple for smooth infinite effect

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex gap-12 overflow-hidden py-12">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex-none w-48 h-28 flex items-center justify-center"
            >
              <div className="animate-pulse bg-gray-200 h-24 w-44 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <p className="text-gray-500">No manufacturers available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Navigation Arrows - Always Visible */}
      {sortedPartners.length > 3 && (
        <>
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#10146B] shadow-sm hover:text-accent transition-colors duration-200"
            onClick={goToPrevious}
            aria-label="Previous manufacturers"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#10146B] shadow-sm hover:text-accent transition-colors duration-200"
            onClick={goToNext}
            aria-label="Next manufacturers"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Continuous scrolling logos */}
      <div 
        className="mx-12 overflow-hidden py-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Manufacturer logos carousel"
      >
        <div 
          className="flex items-center"
          style={{
            transform: `translateX(${translateX}px)`,
            width: `${extendedPartners.length * 240}px`, // 240px per logo (bigger spacing)
          }}
        >
          {extendedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-none w-60 h-24 flex items-center justify-center group border-l border-[#10146B]/15"
              title={partner.name}
            >
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="max-h-20 max-w-44 object-contain transition-all duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={cn(
                  "w-44 h-24 flex items-center justify-center",
                  partner.logo ? "hidden" : "flex"
                )}
              >
                <span className="text-sm font-semibold text-gray-400 text-center px-3">
                  {partner.name.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* See all partners */}
      <div className="text-center">
        <Link href={`/${locale}/partners`} className="text-sm font-medium text-[#0B5CAD] hover:text-accent">
          {t('viewAll')}
        </Link>
      </div>
    </div>
  );
}