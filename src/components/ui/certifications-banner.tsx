'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Shield, CheckCircle, Award, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsHydrated } from '@/components/ui/hydration-safe';

interface CertificationsBannerProps {
  variant?: 'hero' | 'compact' | 'floating';
  className?: string;
}

const certifications = [
  {
    id: 'onssa',
    name: 'ONSSA',
    fullName: 'Office National de Sécurité Sanitaire',
    description: 'Autorisé par ONSSA',
    logo: '/images/compliance/onssa-logo.svg',
    fallbackColor: 'from-slate-500 to-slate-600',
    website: 'https://www.onssa.gov.ma',
    priority: 1
  },
  {
    id: 'iso9001',
    name: 'ISO 9001',
    number: '9001',
    fullName: 'Quality Management System',
    description: 'Gestion de la Qualité',
    logo: '/images/compliance/iso-2-1.svg',
    fallbackColor: 'from-slate-500 to-slate-600',
    website: 'https://www.iso.org/iso-9001-quality-management.html',
    priority: 2
  },
  {
    id: 'iso13485',
    name: 'ISO 13485',
    number: '13485',
    fullName: 'Medical Devices Quality Management',
    description: 'Dispositifs Médicaux',
    logo: '/images/compliance/iso-2-1.svg',
    fallbackColor: 'from-slate-500 to-slate-600',
    website: 'https://www.iso.org/iso-13485-medical-devices.html',
    priority: 3
  },
  {
    id: 'iso22716',
    name: 'ISO 22716',
    number: '22716',
    fullName: 'Cosmetics Good Manufacturing Practices',
    description: 'Bonnes Pratiques GMP',
    logo: '/images/compliance/iso-2-1.svg',
    fallbackColor: 'from-slate-500 to-slate-600',
    website: 'https://www.iso.org/standard/36437.html',
    priority: 4
  }
];

export function CertificationsBanner({ variant = 'hero', className }: CertificationsBannerProps) {
  if (variant === 'compact') {
    return <CompactCertificationsBanner className={className} />;
  }

  if (variant === 'floating') {
    return <FloatingCertificationsBanner className={className} />;
  }

  return <HeroCertificationsBanner className={className} />;
}

// Hero version - full banner with animation
function HeroCertificationsBanner({ className }: { className?: string }) {
  return (
    <section className={cn("relative py-4 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 overflow-hidden", className)}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-24 translate-y-24 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-500"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

          {/* Left side - Title and trust message */}
          <div className="text-center lg:text-left lg:flex-1">
            <h2 className="text-white font-bold text-lg lg:text-xl mb-1">
              Certifications & Normes Internationales
            </h2>
            <p className="text-primary-100 text-sm lg:text-base">
              Confiance garantie par nos certifications officielles
            </p>
          </div>

          {/* Right side - Certification logos */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
            {certifications.map((cert, index) => (
              <CertificationLogo
                key={cert.id}
                certification={cert}
                index={index}
                size="md"
              />
            ))}

            {/* Trust indicator */}
            <div className="hidden lg:flex flex-col items-center ml-3 pl-3 border-l border-white/30">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="h-4 w-4 text-primary-100" />
                <span className="text-white font-semibold text-sm">100%</span>
              </div>
              <span className="text-primary-100 text-xs">Conforme</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Compact version - small top bar
function CompactCertificationsBanner({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border-b border-primary-100 py-2", className)}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">
              Certifié ONSSA • ISO 9001/13485/22716
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-5">
            {certifications.map((cert, index) => (
              <CertificationLogo
                key={cert.id}
                certification={cert}
                index={index}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating version - overlaid on content
function FloatingCertificationsBanner({ className }: { className?: string }) {
  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary-200 shadow-sm", className)}>
      <div className="container mx-auto px-4 lg:px-8 py-1.5">
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-800">Certifications</span>
          </div>

          {certifications.map((cert, index) => (
            <CertificationLogo
              key={cert.id}
              certification={cert}
              index={index}
              size="sm"
            />
          ))}

          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-primary-500" />
            <span className="text-xs font-medium text-primary-700">Vérifié</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual certification logo component
function CertificationLogo({
  certification,
  index,
  size = 'md'
}: {
  certification: any;
  index: number;
  size: 'sm' | 'md' | 'lg';
}) {
  const [imageError, setImageError] = useState(false);
  const isHydrated = useIsHydrated();

  const sizes = {
    sm: { logo: 32, container: 'w-8 sm:w-10', containerHeight: 'h-12 sm:h-14' },
    md: { logo: 40, container: 'w-10 sm:w-12 lg:w-16', containerHeight: 'h-14 sm:h-16 lg:h-20' },
    lg: { logo: 56, container: 'w-12 sm:w-16 lg:w-20', containerHeight: 'h-16 sm:h-20 lg:h-24' }
  };

  const currentSize = sizes[size];

  return (
    <div
      className={cn(
        "relative group transition-transform duration-300 hover:scale-105",
        `animate-fade-in-up delay-${index * 100}`
      )}
      title={certification.fullName}
    >
      {!isHydrated ? (
        // SSR fallback
        <div className={cn(
          "bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex flex-col items-center justify-center gap-1",
          currentSize.container,
          currentSize.containerHeight
        )}>
          <span className="text-white font-bold text-xs">
            {certification.name.split(' ')[0]}
          </span>
          {certification.number && (
            <span className="text-white text-xs">
              {certification.number}
            </span>
          )}
        </div>
      ) : !imageError ? (
        <div className={cn("flex flex-col items-center", currentSize.container)}>
          {/* Logo container with consistent sizing */}
          <div
            className="flex items-center justify-center"
            style={{ height: `${currentSize.logo}px` }}
          >
            <Image
              src={certification.logo}
              alt={`${certification.name} Logo`}
              width={certification.id === 'onssa' ? currentSize.logo * (size === 'sm' ? 2.2 : 2.8) : currentSize.logo}
              height={certification.id === 'onssa' ? currentSize.logo * (size === 'sm' ? 2.2 : 2.8) : currentSize.logo}
              className="object-contain filter brightness-0 invert"
              unoptimized
              style={{
                maxHeight: certification.id === 'onssa' ? `${currentSize.logo * (size === 'sm' ? 1.8 : 2.2)}px` : `${currentSize.logo}px`,
                maxWidth: certification.id === 'onssa' ? `${currentSize.logo * (size === 'sm' ? 1.8 : 2.2)}px` : `${currentSize.logo}px`
              }}
              onError={() => setImageError(true)}
            />
          </div>

          {/* ISO number clearly displayed below logo */}
          {certification.number && (
            <div className="text-center">
              <span className="text-xs font-semibold text-white">
                {certification.number}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={cn("flex flex-col items-center", currentSize.container)}>
          {/* Fallback with consistent sizing */}
          <div
            className="flex items-center justify-center"
            style={{ height: `${currentSize.logo}px` }}
          >
            <div className={cn(
              `bg-gradient-to-br ${certification.fallbackColor} rounded-lg flex items-center justify-center`,
              certification.id === 'onssa' ? 'w-14 h-14' : 'w-12 h-12'
            )}>
              <span className="text-white font-bold text-xs">
                {certification.name.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* ISO number for fallback too */}
          {certification.number && (
            <div className="text-center">
              <span className="text-xs font-semibold text-white">
                {certification.number}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{certification.name}</div>
        <div className="text-gray-300">{certification.description}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

// CSS animations (to be added to globals.css)
export const certificationAnimations = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }

  .delay-0 { animation-delay: 0ms; }
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
`;