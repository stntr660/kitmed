'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

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
  const [isVisible, setIsVisible] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('home.banner');


  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

    fetchBanners();
  }, [position, locale]);

  // Loading state
  if (loading) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="relative container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  // Error state or no banners - show default content
  if (error || banners.length === 0) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    // Default minimal banner when no data available
    return (
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
  }

  // Render the first active banner
  const banner = banners[0];
  console.log('DynamicBanner rendering with banner data:', banner);

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
            <div className="relative mx-auto max-w-md">
              <img 
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
                style={{ filter: 'hue-rotate(15deg) saturate(0.9)' }}
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
          `text-${banner.textAlign}`
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

    // Default: Split layout with enhanced elements
    return (
      <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
        {/* Left Content - Text Section */}
        <div className={cn(
          `space-y-8 lg:pr-8 transform transition-all duration-1000`,
          `text-${banner.textAlign}`,
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
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

        {/* Right Content - Product Image (Enhanced UFSK Style) */}
        {banner.imageUrl && (
          <div className={cn(
            'relative transform transition-all duration-1000 delay-300',
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
          )}>
            <div className="relative max-w-lg mx-auto">
              {/* Main Product Image - Using actual medical equipment styling */}
              <div className="relative">
                <img 
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
                  style={{
                    filter: 'hue-rotate(15deg) saturate(0.9)',
                  }}
                />
                
                {/* Floating Info Badges */}
                <div className="absolute top-8 right-4 bg-white rounded-lg p-3 shadow-lg animate-pulse">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 border border-gray-300 rounded-full opacity-50 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-blue-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent blur-xl"></div>
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
          style={{
            backgroundImage: `url(${banner.backgroundUrl})`,
          }}
        >
          <div 
            className="absolute inset-0 bg-white"
            style={{ opacity: banner.overlayOpacity }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
      )}
      
      <div className="relative container mx-auto px-4 lg:px-8 py-8">
        {renderBannerContent()}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </section>
  );
}