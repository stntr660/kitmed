'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LanguageIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr' as Locale, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  const switchLocale = (newLocale: Locale) => {
    const currentPath = pathname.replace(/^\/[a-z]{2}/, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  const handleLanguageSwitch = (newLocale: Locale) => {
    setIsOpen(false);
    
    // Force a full page reload with the new locale
    const currentPath = pathname.replace(/^\/[a-z]{2}/, '');
    const newUrl = `/${newLocale}${currentPath}`;
    
    window.location.href = newUrl;
  };

  return (
    <div className="relative">
      <button 
        className="flex items-center gap-x-2 text-sm leading-6 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl px-3 py-2 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LanguageIcon className="h-5 w-5" />
        <span className="hidden sm:block font-medium">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-gray-900/5">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{t('changeLanguage')}</h3>
          </div>

          {languages.map((language) => (
            <button
              key={language.code}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLanguageSwitch(language.code);
              }}
              className={cn(
                'flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-gray-50 cursor-pointer',
                currentLocale === language.code
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700'
              )}
            >
              <span className="mr-3 text-lg">{language.flag}</span>
              <span>{language.name}</span>
              {currentLocale === language.code && (
                <div className="ml-auto h-2 w-2 bg-primary-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}