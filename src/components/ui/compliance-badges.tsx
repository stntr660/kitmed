'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Shield, CheckCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsHydrated } from '@/components/ui/hydration-safe';

interface ComplianceBadgesProps {
  variant?: 'grid' | 'inline' | 'compact';
  showLabels?: boolean;
  className?: string;
}

const certifications = [
  {
    id: 'onssa',
    name: 'ONSSA',
    fullName: 'Office National de Sécurité Sanitaire des produits Alimentaires',
    description: 'Autorisé par ONSSA',
    descriptionEn: 'Authorized by ONSSA',
    logo: '/images/compliance/onssa-logo.svg',
    fallbackColor: 'from-blue-500 to-blue-600',
    website: 'https://www.onssa.gov.ma'
  },
  {
    id: 'iso9001',
    name: 'ISO 9001',
    fullName: 'Quality Management System',
    description: 'Gestion de la Qualité',
    descriptionEn: 'Quality Management',
    logo: '/images/compliance/iso-logo.png',
    fallbackColor: 'from-green-500 to-green-600',
    website: 'https://www.iso.org/iso-9001-quality-management.html'
  },
  {
    id: 'iso13485',
    name: 'ISO 13485',
    fullName: 'Medical Devices Quality Management',
    description: 'Dispositifs Médicaux',
    descriptionEn: 'Medical Devices',
    logo: '/images/compliance/iso-logo.png',
    fallbackColor: 'from-red-500 to-red-600',
    website: 'https://www.iso.org/iso-13485-medical-devices.html'
  },
  {
    id: 'iso22716',
    name: 'ISO 22716',
    fullName: 'Cosmetics Good Manufacturing Practices',
    description: 'Bonnes Pratiques GMP',
    descriptionEn: 'Cosmetics GMP',
    logo: '/images/compliance/iso-logo.png',
    fallbackColor: 'from-purple-500 to-purple-600',
    website: 'https://www.iso.org/standard/36437.html'
  }
];

export function ComplianceBadges({ 
  variant = 'grid', 
  showLabels = true, 
  className 
}: ComplianceBadgesProps) {
  
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-gray-900">
          ONSSA • ISO 9001/13485/22716
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {certifications.map((cert) => (
          <InlineCertificationBadge 
            key={cert.id} 
            certification={cert} 
            showLabels={showLabels}
          />
        ))}
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {certifications.map((cert) => (
        <CertificationBadge 
          key={cert.id} 
          certification={cert} 
          showLabels={showLabels}
        />
      ))}
    </div>
  );
}

// Individual certification badge component for grid layout
function CertificationBadge({ certification, showLabels }: { certification: any; showLabels: boolean }) {
  const [imageError, setImageError] = useState(false);
  const isHydrated = useIsHydrated();
  
  // Make ONSSA logo bigger to align with ISO logos
  const logoSize = certification.id === 'onssa' ? 130 : 90;
  const borderRadius = certification.id === 'onssa' ? '' : 'rounded-full';

  return (
    <div className="flex flex-col items-center p-2">
      <div className="relative">
        {!isHydrated ? (
          // Show logo during SSR
          <Image
            src={certification.logo}
            alt={`${certification.name} Logo`}
            width={logoSize}
            height={logoSize}
            className={`object-contain ${borderRadius}`}
          />
        ) : !imageError ? (
          <Image
            src={certification.logo}
            alt={`${certification.name} Logo`}
            width={logoSize}
            height={logoSize}
            className={`object-contain ${borderRadius}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-20 h-20 bg-gradient-to-br ${certification.fallbackColor} rounded-full flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">
              {certification.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
      {showLabels && (
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-900">{certification.name}</div>
          <div className="text-xs text-gray-600">{certification.description}</div>
        </div>
      )}
    </div>
  );
}

// Individual certification badge component for inline layout
function InlineCertificationBadge({ certification, showLabels }: { certification: any; showLabels: boolean }) {
  const [imageError, setImageError] = useState(false);
  const isHydrated = useIsHydrated();
  
  // Make ONSSA logo bigger to align with ISO logos
  const logoSize = certification.id === 'onssa' ? 90 : 60;
  const borderRadius = certification.id === 'onssa' ? '' : 'rounded-full';

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        {!isHydrated ? (
          <Image
            src={certification.logo}
            alt={`${certification.name} Logo`}
            width={logoSize}
            height={logoSize}
            className={`object-contain ${borderRadius}`}
          />
        ) : !imageError ? (
          <Image
            src={certification.logo}
            alt={`${certification.name} Logo`}
            width={logoSize}
            height={logoSize}
            className={`object-contain ${borderRadius}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-12 h-12 bg-gradient-to-br ${certification.fallbackColor} rounded-full flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">
              {certification.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
      {showLabels && (
        <div>
          <div className="text-sm font-semibold text-gray-900">{certification.name}</div>
          <div className="text-xs text-gray-600">{certification.description}</div>
        </div>
      )}
    </div>
  );
}

// Professional certification section component
export function CertificationSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          Certifications & Normes
        </h3>
      </div>
      
      <p className="text-sm text-gray-600">
        KITMED est certifié et autorisé par les organismes de réglementation pour 
        garantir la qualité et la sécurité de nos équipements médicaux.
      </p>
      
      <ComplianceBadges variant="grid" />
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              Conformité Réglementaire Complète
            </p>
            <p className="text-sm text-gray-600">
              Tous nos produits respectent les standards internationaux de qualité et 
              de sécurité pour les équipements médicaux, avec autorisation officielle 
              du Ministère de la Santé du Maroc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}