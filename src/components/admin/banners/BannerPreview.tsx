'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink } from 'lucide-react';

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
  position: string;
  layout: 'split' | 'centered' | 'full-width';
  textAlign: 'left' | 'center' | 'right';
  overlayOpacity: number;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  translations: Array<{
    languageCode: string;
    title: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
  }>;
}

interface BannerPreviewProps {
  banner: Banner;
  device: 'desktop' | 'tablet' | 'mobile';
  locale?: string;
}

export function BannerPreview({ banner, device, locale = 'fr' }: BannerPreviewProps) {
  // Get localized content
  const translation = banner.translations.find(t => t.languageCode === locale);
  const content = {
    title: translation?.title || banner.title,
    subtitle: translation?.subtitle || banner.subtitle,
    description: translation?.description || banner.description,
    ctaText: translation?.ctaText || banner.ctaText,
  };

  // Device-specific container styles
  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

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

  // Layout-specific rendering
  const renderBannerContent = () => {
    if (banner.layout === 'centered') {
      return (
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className={cn(
              'text-4xl lg:text-6xl font-light text-blue-500 leading-none',
              device === 'mobile' && 'text-3xl',
              device === 'tablet' && 'text-5xl'
            )}>
              {content.title}
            </h1>
            {content.subtitle && (
              <h2 className={cn(
                'text-2xl lg:text-4xl font-light text-gray-800 leading-tight',
                device === 'mobile' && 'text-xl',
                device === 'tablet' && 'text-3xl'
              )}>
                {content.subtitle}
              </h2>
            )}
            {content.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {content.description}
              </p>
            )}
          </div>
          
          {banner.imageUrl && (
            <div className="relative mx-auto max-w-md">
              <img 
                src={banner.imageUrl}
                alt={content.title}
                className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
                style={{ filter: 'hue-rotate(15deg) saturate(0.9)' }}
              />
            </div>
          )}

          {content.ctaText && banner.ctaUrl && (
            <div className="pt-4">
              <Button 
                className={cn(
                  'px-8 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center space-x-2',
                  getCtaStyles()
                )}
              >
                <span>{content.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
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
            <h1 className={cn(
              'text-5xl lg:text-7xl font-light text-blue-500 leading-none',
              device === 'mobile' && 'text-3xl',
              device === 'tablet' && 'text-5xl'
            )}>
              {content.title}
            </h1>
            {content.subtitle && (
              <h2 className={cn(
                'text-3xl lg:text-5xl font-light text-gray-800 leading-tight',
                device === 'mobile' && 'text-xl',
                device === 'tablet' && 'text-3xl'
              )}>
                {content.subtitle}
              </h2>
            )}
            {content.description && (
              <p className="text-gray-600 text-xl max-w-4xl mx-auto">
                {content.description}
              </p>
            )}
          </div>

          {content.ctaText && banner.ctaUrl && (
            <div className="pt-6">
              <Button 
                className={cn(
                  'px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center space-x-3',
                  getCtaStyles()
                )}
              >
                <span>{content.ctaText}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Default: Split layout
    return (
      <div className={cn(
        'grid gap-12 items-center min-h-[calc(100vh-6rem)]',
        device === 'mobile' ? 'grid-cols-1 gap-8' : 'lg:grid-cols-2'
      )}>
        <div className={cn(
          'space-y-6',
          `text-${banner.textAlign}`
        )}>
          <div className="space-y-4">
            <h1 className={cn(
              'text-6xl lg:text-7xl font-light text-blue-500 leading-none',
              device === 'mobile' && 'text-4xl',
              device === 'tablet' && 'text-5xl'
            )}>
              {content.title}
            </h1>
            {content.subtitle && (
              <h2 className={cn(
                'text-4xl lg:text-5xl font-light text-gray-800 leading-tight',
                device === 'mobile' && 'text-2xl',
                device === 'tablet' && 'text-3xl'
              )}>
                {content.subtitle}
              </h2>
            )}
            {content.description && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {content.description}
              </p>
            )}
          </div>

          {content.ctaText && banner.ctaUrl && (
            <div className="pt-4">
              <Button 
                className={cn(
                  'px-8 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center space-x-2',
                  getCtaStyles()
                )}
              >
                <span>{content.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {banner.imageUrl && (
          <div className="relative">
            <img 
              src={banner.imageUrl}
              alt={content.title}
              className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
              style={{ filter: 'hue-rotate(15deg) saturate(0.9)' }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('overflow-hidden', getDeviceStyles())}>
      {/* Preview Container */}
      <div className="relative min-h-[600px] overflow-hidden rounded-lg border shadow-lg bg-white">
        {/* Background */}
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
        
        {/* Content */}
        <div className="relative container mx-auto px-4 lg:px-8 py-8">
          {renderBannerContent()}
        </div>

        {/* Preview Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <span>PREVIEW</span>
            {banner.ctaUrl && (
              <ExternalLink className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>

      {/* Banner Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium text-gray-700">Layout:</span>
            <span className="ml-2 text-gray-600 capitalize">{banner.layout}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Text Align:</span>
            <span className="ml-2 text-gray-600 capitalize">{banner.textAlign}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Overlay:</span>
            <span className="ml-2 text-gray-600">{Math.round(banner.overlayOpacity * 100)}%</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">CTA Style:</span>
            <span className="ml-2 text-gray-600 capitalize">{banner.ctaStyle}</span>
          </div>
        </div>
        
        {(banner.startDate || banner.endDate) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Schedule:</span>
              {banner.startDate && (
                <span className="ml-1">
                  From {new Date(banner.startDate).toLocaleDateString()}
                </span>
              )}
              {banner.endDate && (
                <span className="ml-1">
                  to {new Date(banner.endDate).toLocaleDateString()}
                </span>
              )}
              {!banner.startDate && !banner.endDate && (
                <span className="ml-1">Always active</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}