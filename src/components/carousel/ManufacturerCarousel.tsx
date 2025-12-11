'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            onClick={goToPrevious}
            aria-label="Previous manufacturers"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            onClick={goToNext}
            aria-label="Next manufacturers"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Continuous scrolling logos */}
      <div 
        className="overflow-hidden py-12"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Manufacturer logos carousel"
      >
        <div 
          className="flex gap-12 items-center"
          style={{
            transform: `translateX(${translateX}px)`,
            width: `${extendedPartners.length * 240}px`, // 240px per logo (bigger spacing)
          }}
        >
          {extendedPartners.map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-none w-48 h-28 flex items-center justify-center group"
              title={partner.name}
            >
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="max-h-24 max-w-44 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
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
      
      {/* See all partners button */}
      <div className="text-center mt-8">
        <Button
          size="lg"
          variant="outline"
          className="border-2 border-primary-300 text-primary-700 hover:bg-primary-50"
          asChild
        >
          <Link href={`/${locale}/partners`}>
            Voir tous les partenaires
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}