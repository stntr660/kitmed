'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin, Facebook, Linkedin, Instagram } from 'lucide-react';

import { FooterLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface FooterProps {
  locale: Locale;
  className?: string;
}

const socialLinks = [
  { name: 'facebook', href: 'https://www.facebook.com/share/1E9mpRMbRD/?mibextid=wwXIfr', icon: Facebook },
  { name: 'instagram', href: 'https://www.instagram.com/kitmed.maroc?igsh=MjluY25wMGc2N3Aw', icon: Instagram },
  { name: 'linkedin', href: 'https://www.linkedin.com/company/kitmed/', icon: Linkedin },
];

const LEGAL = ['privacy', 'terms', 'cookies'] as const;

/** Slim footer from the client mockups: logo | Casablanca | Contact | Catalogues | SAV, then © + legal. */
export function Footer({ locale, className }: FooterProps) {
  const t = useTranslations('footer');
  const tChrome = useTranslations('siteChrome');
  const currentYear = new Date().getFullYear();

  const links = [
    { label: tChrome('nav.contact'), href: `/${locale}/contact` },
    { label: tChrome('nav.catalogues'), href: `/${locale}/catalogues` },
    { label: tChrome('nav.sav'), href: `/${locale}/sav` },
  ];
  const cell = 'flex items-center justify-center px-6 py-2 text-sm font-semibold text-[#10146B] md:border-l md:border-[#10146B]/30';

  return (
    <footer className={cn('border-t border-gray-100 bg-white', className)}>
      <div className="container mx-auto px-4 py-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-0">
          <Link href={`/${locale}`} className="flex flex-col items-center pr-6">
            <FooterLogo className="py-0 [&_img]:!max-h-[48px]" />
            <span className="mt-0.5 text-[10px] font-semibold leading-none text-gray-800">{tChrome('certified')}</span>
          </Link>
          <div className="flex flex-1 flex-col items-center md:flex-row md:justify-around">
            <span className={cn(cell, 'gap-1.5 font-normal')}>
              <MapPin className="h-4 w-4 text-accent" />
              {tChrome('location')}
            </span>
            {links.map(link => (
              <Link key={link.href} href={link.href} className={cn(cell, 'hover:text-accent')}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 md:flex-row">
          <p>© {currentYear} KITMED. {t('rights')}</p>
          <div className="flex items-center gap-4">
            {LEGAL.map(key => (
              <Link key={key} href={`/${locale}/legal/${key}`} className="hover:text-gray-700">
                {t(`links.${key}`)}
              </Link>
            ))}
            <span className="flex items-center gap-2 pl-2">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(`social.${social.name}`)}
                  className="text-gray-400 hover:text-primary"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
