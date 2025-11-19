'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube,
  ExternalLink,
  Building2,
  Shield,
  CheckCircle,
  Printer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FooterLogo } from '@/components/ui/logo';
import { ComplianceBadges } from '@/components/ui/compliance-badges';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface FooterProps {
  locale: Locale;
  className?: string;
}

const getFooterLinks = (locale: string) => ({
  products: [
    { name: 'allProducts', href: `/${locale}/products` },
    { name: 'byDiscipline', href: `/${locale}/products/disciplines` },
    { name: 'byManufacturer', href: `/${locale}/products/manufacturers` },
    { name: 'featured', href: `/${locale}/products/featured` },
  ],
  company: [
    { name: 'about', href: `/${locale}/about` },
  ],
  support: [
    { name: 'contact', href: `/${locale}/contact` },
    { name: 'documentation', href: `/${locale}/support/documentation` },
    { name: 'training', href: `/${locale}/support/training` },
    { name: 'maintenance', href: `/${locale}/support/maintenance` },
  ],
  legal: [
    { name: 'privacy', href: `/${locale}/legal/privacy` },
    { name: 'terms', href: `/${locale}/legal/terms` },
    { name: 'cookies', href: `/${locale}/legal/cookies` },
    { name: 'compliance', href: `/${locale}/legal/compliance` },
  ],
});

const socialLinks = [
  { name: 'facebook', href: '#', icon: Facebook },
  { name: 'twitter', href: '#', icon: Twitter },
  { name: 'linkedin', href: '#', icon: Linkedin },
  { name: 'youtube', href: '#', icon: Youtube },
];

export function Footer({ locale, className }: FooterProps) {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const footerLinks = getFooterLinks(locale);

  return (
    <footer className={cn('bg-gray-50 border-t', className)}>
      {/* Main Footer Content */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Company Logo */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <FooterLogo />
            </div>
            <p className="text-sm text-medical-text-secondary mb-6">
              Équipements médicaux de pointe pour les professionnels de santé au Maroc et en Afrique depuis 1997.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`social.${social.name}`)}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-medical-heading mb-4 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Direction
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <span className="text-medical-text-secondary">
                  20, rue Lalande, Quartier des Hôpitaux<br />
                  Casablanca - Maroc
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <a href="tel:+212522860366" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    +212 522 86 03 66
                  </a>
                  <a href="tel:+212522860431" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    +212 522 86 04 31
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Printer className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <span className="text-medical-text-secondary">
                  +212 522 86 04 16
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <a href="mailto:INFO@KITMED.MA" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    INFO@KITMED.MA
                  </a>
                  <a href="mailto:EXPORT@KITMED.MA" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    EXPORT@KITMED.MA
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ShowRoom */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-medical-heading mb-4">
              ShowRoom
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <span className="text-medical-text-secondary">
                  33, rue Lahcen El Aarjounen<br />
                  Quartier des Hôpitaux<br />
                  Casablanca - Maroc
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <a href="tel:+212522863427" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    +212 522 86 34 27
                  </a>
                  <a href="tel:+212522860856" className="text-medical-text-secondary hover:text-gray-600 transition-colors block">
                    +212 522 86 08 56
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Printer className="h-4 w-4 text-medical-text-muted flex-shrink-0 mt-0.5" />
                <span className="text-medical-text-secondary">
                  +212 522 86 04 16
                </span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-8">
              {Object.entries(footerLinks).slice(0, 2).map(([section, links]) => (
                <div key={section}>
                  <h3 className="text-sm font-semibold text-medical-heading mb-3">
                    {t(`sections.${section}`)}
                  </h3>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-medical-text-secondary hover:text-gray-600 transition-colors"
                        >
                          {t(`links.${link.name}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

        <Separator className="my-8" />

        {/* Certifications & Standards */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-medical-heading mb-4 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Certifications et Normes
          </h3>
          
          {/* Professional Certifications */}
          <ComplianceBadges variant="grid" className="mb-6" />

          {/* Additional Compliance Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  Conformité Réglementaire Complète
                </p>
                <p className="text-sm text-gray-600">
                  Autorisations officielles ONSSA et certifications ISO pour garantir la qualité 
                  et la sécurité de nos équipements médicaux au Maroc.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-2 md:flex-row md:space-y-0 md:space-x-4">
            <p className="text-xs text-medical-text-muted">
              © 2024 KITMED. {t('rights')}
            </p>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/legal/privacy"
                className="text-xs text-medical-text-muted hover:text-gray-600 transition-colors"
              >
                {t('links.privacy')}
              </Link>
              <Link
                href="/legal/terms"
                className="text-xs text-medical-text-muted hover:text-gray-600 transition-colors"
              >
                {t('links.terms')}
              </Link>
              <Link
                href="/legal/cookies"
                className="text-xs text-medical-text-muted hover:text-gray-600 transition-colors"
              >
                {t('links.cookies')}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}