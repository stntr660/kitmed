'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Partner {
  id: string;
  slug: string;
  logoUrl: string | null;
  name: {
    fr: string;
    en: string;
  };
}

interface PartnerLogosCarouselProps {
  categorySlug?: string;
  className?: string;
  locale?: string;
}

export function PartnerLogosCarousel({
  categorySlug,
  className,
  locale = 'fr'
}: PartnerLogosCarouselProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [translateX, setTranslateX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const url = categorySlug
          ? `/api/partners?categorySlug=${categorySlug}`
          : '/api/partners';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPartners(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [categorySlug]);

  // Continuous scrolling effect
  useEffect(() => {
    const startContinuousScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (!isHovered && partners.length > 0) {
          setTranslateX((prev) => {
            const newTranslateX = prev - 1;
            const logoWidth = 160;
            const resetPoint = -(logoWidth * partners.length);
            return newTranslateX <= resetPoint ? 0 : newTranslateX;
          });
        }
      }, 30);
    };

    if (partners.length > 0 && !loading) {
      startContinuousScroll();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [partners.length, isHovered, loading]);

  const goToPrevious = () => {
    setTranslateX((prev) => {
      const logoWidth = 160;
      const maxScroll = logoWidth * partners.length;
      const newTranslateX = prev + logoWidth * 3;
      return newTranslateX > 0 ? -maxScroll + logoWidth : newTranslateX;
    });
  };

  const goToNext = () => {
    setTranslateX((prev) => {
      const logoWidth = 160;
      const resetPoint = -(logoWidth * partners.length);
      const newTranslateX = prev - logoWidth * 3;
      return newTranslateX <= resetPoint ? 0 : newTranslateX;
    });
  };

  const getPartnerName = (partner: Partner) => {
    return partner.name[locale as keyof typeof partner.name] || partner.name.fr || partner.name.en;
  };

  // Create duplicated partners array for seamless scrolling
  const extendedPartners = [...partners, ...partners, ...partners];

  if (loading) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex gap-8 overflow-hidden py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-none w-32 h-16 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 h-12 w-28 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Navigation Arrows */}
      {partners.length > 4 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-primary-600 transition-colors duration-200"
            onClick={goToPrevious}
            aria-label="Previous partners"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-primary-600 transition-colors duration-200"
            onClick={goToNext}
            aria-label="Next partners"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Scrolling logos */}
      <div
        className="overflow-hidden py-6 px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Partner logos carousel"
      >
        <div
          className="flex gap-8 items-center"
          style={{
            transform: `translateX(${translateX}px)`,
            width: `${extendedPartners.length * 160}px`,
          }}
        >
          {extendedPartners.map((partner, index) => (
            <Link
              key={`${partner.id}-${index}`}
              href={`/${locale}/partners/${partner.slug}`}
              className="flex-none w-32 h-16 flex items-center justify-center group"
              title={getPartnerName(partner)}
            >
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt={`${getPartnerName(partner)} logo`}
                  className="max-h-12 max-w-28 object-contain transition-all duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-medium text-gray-400 text-center px-2 group-hover:text-primary-600 transition-colors">
                  {getPartnerName(partner).split(' ').slice(0, 2).join(' ')}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
