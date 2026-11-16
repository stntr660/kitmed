'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { FooterLogo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface FooterProps {
  locale: Locale;
  className?: string;
}

/** Footer of the client mockup (2026-11-16): logo | Certifié ISO 1997 - 2015 | Contact | Catalogues | SAV. */
export function Footer({ locale, className }: FooterProps) {
  const tChrome = useTranslations('siteChrome');

  const links = [
    { label: tChrome('nav.contact'), href: `/${locale}/contact` },
    { label: tChrome('nav.catalogues'), href: `/${locale}/catalogues` },
    { label: tChrome('nav.sav'), href: `/${locale}/sav` },
  ];
  const divider = 'hidden h-8 w-px bg-[#10146B]/40 md:block';

  return (
    <footer className={cn('bg-white', className)}>
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 md:flex-row md:justify-between md:gap-6">
          <Link href={`/${locale}`} className="flex items-center gap-4">
            <FooterLogo className="py-0 [&_img]:!max-h-[56px]" />
            <span className="h-10 w-px bg-[#10146B]/30" />
            <span className="text-xs font-bold leading-tight text-gray-900">
              {tChrome('certifiedLine1')}
              <br />
              {tChrome('certifiedLine2')}
            </span>
          </Link>
          {links.map(link => (
            <React.Fragment key={link.href}>
              <span className={divider} />
              <Link href={link.href} className="text-sm font-semibold text-[#10146B] hover:text-accent">
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
}
