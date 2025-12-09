'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function ManufacturerCarousel({ 
  partners, 
  isLoading, 
  className 
}: ManufacturerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    const startAutoSlide = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!isHovered && partners.length > itemsPerView) {
          setCurrentIndex((prevIndex) => {
            const maxIndex = Math.max(0, partners.length - itemsPerView);
            return prevIndex >= maxIndex ? 0 : prevIndex + 1;
          });
        }
      }, 3000);
    };

    if (partners.length > itemsPerView && !isLoading) {
      startAutoSlide();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [partners.length, itemsPerView, isHovered, isLoading]);

  const goToPrevious = () => {
    const maxIndex = Math.max(0, partners.length - itemsPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? maxIndex : prevIndex - 1
    );
  };

  const goToNext = () => {
    const maxIndex = Math.max(0, partners.length - itemsPerView);
    setCurrentIndex((prevIndex) => 
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  // Don't show navigation if all items fit in view
  const showNavigation = partners.length > itemsPerView;

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: itemsPerView }).map((_, index) => (
            <div
              key={index}
              className="flex-none w-full sm:w-1/2 lg:w-1/3"
            >
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-full h-20 mb-4 flex items-center justify-center">
                    <div className="animate-pulse bg-gray-200 h-16 w-24 rounded"></div>
                  </div>
                  <div className="animate-pulse w-full">
                    <div className="h-5 bg-gray-200 rounded mb-2 w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
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
    <div 
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Manufacturer logos carousel"
    >
      {/* Navigation Buttons */}
      {showNavigation && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300",
              "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
            )}
            onClick={goToPrevious}
            aria-label="Previous manufacturers"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300",
              "opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
            )}
            onClick={goToNext}
            aria-label="Next manufacturers"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="overflow-hidden"
        role="group"
        aria-live="polite"
        aria-atomic="false"
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out gap-6"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {partners.map((partner, index) => (
            <div
              key={partner.id}
              className="flex-none w-full sm:w-1/2 lg:w-1/3"
              role="group"
              aria-label={`Manufacturer: ${partner.name}`}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full group/card relative">
                <CardContent className="p-6 flex flex-col items-center text-center h-full">
                  {/* Featured Badge */}
                  {partner.featured && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-primary-600 text-white border-0 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  
                  <div className="w-full h-20 mb-4 flex items-center justify-center">
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        className="max-h-16 w-auto object-contain transition-transform duration-300 group-hover/card:scale-105 filter grayscale hover:grayscale-0 transition-all"
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
                        "w-24 h-16 bg-gray-100 rounded flex items-center justify-center transition-colors duration-300 group-hover/card:bg-gray-200",
                        partner.logo ? "hidden" : "flex"
                      )}
                    >
                      <span className="text-xs font-semibold text-gray-500 text-center px-2">
                        {partner.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 transition-colors duration-300 group-hover/card:text-primary-600">
                      {partner.name}
                    </h3>
                    
                    {partner.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {partner.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Dots */}
      {showNavigation && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ 
            length: Math.max(0, partners.length - itemsPerView + 1) 
          }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-primary-600 w-6" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}