'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useIsHydrated } from '@/components/ui/hydration-safe';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaStyle: 'primary' | 'secondary' | 'outline';
  layout: 'split' | 'centered' | 'full-width';
  textAlign: 'left' | 'center' | 'right';
  overlayOpacity: number;
  sortOrder: number;
}

interface DynamicBannerProps {
  position?: string;
  fallbackComponent?: React.ReactNode;
}

export function DynamicBanner({ position = 'homepage', fallbackComponent }: DynamicBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useIsHydrated();
  const locale = useHydrationSafeLocale('fr');
  const t = useTranslations('home.banner');

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/banners?position=${position}&locale=${locale}`);
        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }

        const result = await response.json();
        if (result.success) {
          setBanners(result.data || []);
        } else {
          throw new Error(result.error?.message || 'Failed to load banners');
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (isHydrated) {
      fetchBanners();
    }
  }, [position, locale, isHydrated]);

  // Static fallback component - consistent across SSR and client
  const StaticFallback = () => (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <div className="relative container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="text-center space-y-6">
            <h1 className="text-6xl lg:text-7xl font-light text-blue-500 leading-none">
              kit<span className="text-blue-600">Med</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Medical equipment solutions
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Always render StaticFallback during SSR and initial hydration
  if (!isHydrated) {
    return <StaticFallback />;
  }

  // Loading state after hydration - same structure as fallback
  if (loading) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="relative container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="text-center space-y-6">
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-6 w-80 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state or no banners - show fallback
  if (error || banners.length === 0) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    return <StaticFallback />;
  }

  // Render the first active banner
  const banner = banners[0];

  // CTA Button styles
  const getCtaStyles = () => {
    switch (banner.ctaStyle) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  // Render banner content based on layout
  const renderBannerContent = () => {
    if (banner.layout === 'centered') {
      return (
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-light text-blue-500 leading-none">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <h2 className="text-2xl lg:text-4xl font-light text-gray-800 leading-tight">
                {banner.subtitle}
              </h2>
            )}
            {banner.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {banner.description}
              </p>
            )}
          </div>
          
          {banner.imageUrl && (
            <div className="relative mx-auto max-w-xl">
              <img 
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {banner.ctaText && banner.ctaUrl && (
            <div className="pt-4">
              <a href={banner.ctaUrl}>
                <Button 
                  className={cn(
                    'px-8 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center space-x-2',
                    getCtaStyles()
                  )}
                >
                  <span>{banner.ctaText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      );
    }

    if (banner.layout === 'full-width') {
      return (
        <div className={cn(
          'text-center space-y-8 w-full',
          banner.textAlign === 'left' ? 'text-left' : 
          banner.textAlign === 'right' ? 'text-right' : 'text-center'
        )}>
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-7xl font-light text-blue-500 leading-none">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <h2 className="text-3xl lg:text-5xl font-light text-gray-800 leading-tight">
                {banner.subtitle}
              </h2>
            )}
            {banner.description && (
              <p className="text-gray-600 text-xl max-w-4xl mx-auto">
                {banner.description}
              </p>
            )}
          </div>

          {banner.ctaText && banner.ctaUrl && (
            <div className="pt-6">
              <a href={banner.ctaUrl}>
                <Button 
                  className={cn(
                    'px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center space-x-3',
                    getCtaStyles()
                  )}
                >
                  <span>{banner.ctaText}</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
            </div>
          )}
        </div>
      );
    }

    // Default: Split layout
    return (
      <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
        {/* Left Content - Text Section */}
        <div className={cn(
          'space-y-8 lg:pr-8',
          banner.textAlign === 'left' ? 'text-left' : 
          banner.textAlign === 'right' ? 'text-right' : 'text-center'
        )}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-light text-blue-500 leading-none">
                {banner.title === 'kitMed' ? (
                  <>kit<span className="text-blue-600">Med</span></>
                ) : (
                  banner.title
                )}
              </h1>
              {banner.subtitle && (
                <h2 className="text-4xl lg:text-5xl font-light text-gray-800 leading-tight">
                  {banner.subtitle}
                </h2>
              )}
            </div>
            
            {banner.description && (
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                {banner.description}
              </p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {banner.ctaText && banner.ctaUrl && (
              <Button 
                size="lg" 
                className={cn(
                  'px-8 py-4 text-lg font-medium transition-all duration-300',
                  getCtaStyles()
                )}
                asChild
              >
                <Link href={banner.ctaUrl} className="flex items-center">
                  {banner.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Right Content - Product Image */}
        {banner.imageUrl && (
          <div className="relative">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <img 
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-auto hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      {banner.backgroundUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${banner.backgroundUrl})` }}
        >
          <div 
            className="absolute inset-0 bg-white"
            style={{ opacity: banner.overlayOpacity / 100 }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
      )}
      
      <div className="relative container mx-auto px-4 lg:px-8 py-8">
        {renderBannerContent()}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </section>
  );
}