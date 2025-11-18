'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, ShoppingCart, Globe, User, Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HeaderLogo } from '@/components/ui/logo';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useRFPStore } from '@/store/rfp-store';
import { useSearchStore } from '@/store/search-store';
import { cn, debounce } from '@/lib/utils';
import type { Locale } from '@/types';

interface HeaderProps {
  locale: Locale;
  className?: string;
}

const getNavigation = (locale: string) => [
  {
    name: 'products',
    href: `/${locale}/products`,
    hasSubmenu: true,
    submenu: [
      { name: 'allProducts', href: `/${locale}/products` },
      { name: 'byDiscipline', href: `/${locale}/products/disciplines` },
      { name: 'byManufacturer', href: `/${locale}/products/manufacturers` },
      { name: 'featured', href: `/${locale}/products/featured` },
    ],
  },
  {
    name: 'solutions',
    href: `/${locale}/solutions`,
    hasSubmenu: true,
    submenu: [
      { name: 'hospitalSolutions', href: `/${locale}/solutions/hospital` },
      { name: 'clinicSolutions', href: `/${locale}/solutions/clinic` },
      { name: 'labSolutions', href: `/${locale}/solutions/laboratory` },
    ],
  },
  {
    name: 'partners',
    href: `/${locale}/partners`,
  },
  {
    name: 'about',
    href: `/${locale}/about`,
    hasSubmenu: true,
    submenu: [
      { name: 'company', href: `/${locale}/about` },
      { name: 'team', href: `/${locale}/about/team` },
      { name: 'news', href: `/${locale}/about/news` },
    ],
  },
  {
    name: 'contact',
    href: `/${locale}/contact`,
  },
];

export function Header({ locale, className }: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  
  const navigation = getNavigation(locale);
  
  const { itemCount, toggleCart } = useRFPStore();
  const { query, setQuery } = useSearchStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);
  
  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 300),
    [router, locale]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
    }
  };

  const switchLocale = (newLocale: Locale) => {
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  const cartItemCount = itemCount();

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm', className)}>
      <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center"
            aria-label={tCommon('goToHomepage')}
          >
            <HeaderLogo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {navigation.map((item) => (
              <NavigationMenuItem key={item.name}>
                {item.hasSubmenu ? (
                  <>
                    <NavigationMenuTrigger
                      className={cn(
                        'h-auto px-4 py-2 text-sm font-medium bg-transparent border-0 text-gray-600 hover:text-gray-900 data-[state=open]:text-gray-900 transition-colors duration-200 uppercase tracking-wide',
                        pathname.startsWith(item.href) && 'text-primary font-semibold'
                      )}
                    >
                      {t(item.name)}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[320px] gap-1 p-2 md:w-[420px] md:grid-cols-2">
                        {item.submenu?.map((subItem) => (
                          <li key={subItem.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50',
                                  pathname === subItem.href && 'bg-gray-100 text-primary'
                                )}
                              >
                                <div className="font-medium">
                                  {t(subItem.name)}
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link 
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 uppercase tracking-wide',
                      pathname === item.href && 'text-primary font-semibold'
                    )}
                  >
                    {t(item.name)}
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder={tCommon('searchPlaceholder')}
              value={query}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full h-10 pl-10 pr-4 text-sm bg-gray-50/80 border border-gray-200/50 rounded-md transition-all duration-200 focus:outline-none focus:bg-white focus:border-gray-300 focus:shadow-sm',
                searchFocused && 'ring-1 ring-primary/20'
              )}
              aria-label={tCommon('searchProducts')}
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button (Mobile) */}
          <button
            className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            aria-label={tCommon('search')}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* RFP Cart */}
          <button
            onClick={toggleCart}
            className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            aria-label={`${tCommon('rfpCart')}${cartItemCount > 0 ? ` (${cartItemCount} ${tCommon('items')})` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-5 w-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="hidden md:flex p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                aria-label={tCommon('changeLanguage')}
              >
                <span className="text-sm font-medium uppercase">
                  {locale}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-gray-200/50 shadow-lg">
              <DropdownMenuItem 
                onClick={() => switchLocale('en')}
                className={cn(
                  'text-sm cursor-pointer hover:bg-gray-50',
                  locale === 'en' && 'bg-gray-100 font-medium'
                )}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchLocale('fr')}
                className={cn(
                  'text-sm cursor-pointer hover:bg-gray-50',
                  locale === 'fr' && 'bg-gray-100 font-medium'
                )}
              >
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                aria-label={tCommon('userMenu')}
              >
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-gray-200/50 shadow-lg w-48">
              <DropdownMenuItem asChild>
                <Link href="/account" className="text-sm cursor-pointer hover:bg-gray-50">{tCommon('myAccount')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/rfp/history" className="text-sm cursor-pointer hover:bg-gray-50">{tCommon('rfpHistory')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="text-sm cursor-pointer hover:bg-gray-50">{tCommon('adminPanel')}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label={tCommon('openMenu')}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>KITMED</SheetTitle>
              </SheetHeader>
              
              {/* Mobile Search */}
              <div className="mt-6">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder={tCommon('searchPlaceholder')}
                      value={query}
                      onChange={handleSearchChange}
                      className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:bg-white"
                    />
                  </div>
                </form>
              </div>

              {/* Mobile Navigation */}
              <nav className="mt-6">
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors',
                          pathname.startsWith(item.href) && 'text-primary bg-gray-50'
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t(item.name)}
                      </Link>
                      
                      {item.submenu && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors',
                                  pathname === subItem.href && 'text-primary bg-gray-50'
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t(subItem.name)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}