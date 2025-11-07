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
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface FooterProps {
  locale: Locale;
  className?: string;
}

const footerLinks = {
  products: [
    { name: 'allProducts', href: '/products' },
    { name: 'byDiscipline', href: '/products/disciplines' },
    { name: 'byManufacturer', href: '/products/manufacturers' },
    { name: 'featured', href: '/products/featured' },
  ],
  company: [
    { name: 'about', href: '/about' },
    { name: 'team', href: '/about/team' },
    { name: 'careers', href: '/careers' },
    { name: 'news', href: '/about/news' },
  ],
  support: [
    { name: 'contact', href: '/contact' },
    { name: 'documentation', href: '/support/documentation' },
    { name: 'training', href: '/support/training' },
    { name: 'maintenance', href: '/support/maintenance' },
  ],
  legal: [
    { name: 'privacy', href: '/legal/privacy' },
    { name: 'terms', href: '/legal/terms' },
    { name: 'cookies', href: '/legal/cookies' },
    { name: 'compliance', href: '/legal/compliance' },
  ],
};

const socialLinks = [
  { name: 'facebook', href: '#', icon: Facebook },
  { name: 'twitter', href: '#', icon: Twitter },
  { name: 'linkedin', href: '#', icon: Linkedin },
  { name: 'youtube', href: '#', icon: Youtube },
];

export function Footer({ locale, className }: FooterProps) {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  
  const [email, setEmail] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    
    try {
      // Newsletter subscription logic would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setEmail('');
      // Show success message
    } catch (error) {
      // Handle error
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className={cn('bg-gray-50 border-t', className)}>
      {/* Main Footer Content */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-6">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-primary">KITMED</span>
            </div>
            
            <p className="text-sm text-medical-text-secondary mb-6">
              {t('description')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-medical-text-muted flex-shrink-0" />
                <span className="text-medical-text-secondary">
                  {t('address')}
                </span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-medical-text-muted flex-shrink-0" />
                <a 
                  href="tel:+33123456789" 
                  className="text-medical-text-secondary hover:text-primary transition-colors"
                >
                  +33 1 23 45 67 89
                </a>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-medical-text-muted flex-shrink-0" />
                <a 
                  href="mailto:contact@kitmed.com" 
                  className="text-medical-text-secondary hover:text-primary transition-colors"
                >
                  contact@kitmed.com
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3 mt-6">
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

          {/* Footer Links */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {Object.entries(footerLinks).map(([section, links]) => (
                <div key={section}>
                  <h3 className="text-sm font-semibold text-medical-heading mb-3">
                    {t(`sections.${section}`)}
                  </h3>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-medical-text-secondary hover:text-primary transition-colors"
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

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-medical-heading mb-3">
              {t('newsletter.title')}
            </h3>
            <p className="text-sm text-medical-text-secondary mb-4">
              {t('newsletter.description')}
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder={t('newsletter.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label={t('newsletter.placeholder')}
              />
              <Button
                type="submit"
                variant="medical"
                size="sm"
                className="w-full"
                loading={isSubscribing}
                loadingText={tCommon('subscribing')}
              >
                {tCommon('subscribe')}
              </Button>
            </form>

            <p className="text-xs text-medical-text-muted mt-2">
              {t('newsletter.privacy')}
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Certifications & Standards */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-medical-heading mb-4">
            {t('certifications.title')}
          </h3>
          <div className="flex flex-wrap items-center gap-6">
            {/* ISO Certification */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold">ISO</span>
              </div>
              <span className="text-xs text-medical-text-secondary">
                ISO 13485:2016
              </span>
            </div>

            {/* CE Marking */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold">CE</span>
              </div>
              <span className="text-xs text-medical-text-secondary">
                CE Marking
              </span>
            </div>

            {/* FDA */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold">FDA</span>
              </div>
              <span className="text-xs text-medical-text-secondary">
                FDA Registered
              </span>
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
                className="text-xs text-medical-text-muted hover:text-primary transition-colors"
              >
                {t('links.privacy')}
              </Link>
              <Link
                href="/legal/terms"
                className="text-xs text-medical-text-muted hover:text-primary transition-colors"
              >
                {t('links.terms')}
              </Link>
              <Link
                href="/legal/cookies"
                className="text-xs text-medical-text-muted hover:text-primary transition-colors"
              >
                {t('links.cookies')}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-medical-text-muted">
            <span>{t('poweredBy')}</span>
            <Link
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 hover:text-primary transition-colors"
            >
              <span>Next.js</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}