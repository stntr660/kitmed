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

const navigation = [
  {
    name: 'products',
    href: '/products',
    hasSubmenu: true,
    submenu: [
      { name: 'allProducts', href: '/products' },
      { name: 'byDiscipline', href: '/products/disciplines' },
      { name: 'byManufacturer', href: '/products/manufacturers' },
      { name: 'featured', href: '/products/featured' },
    ],
  },
  {
    name: 'solutions',
    href: '/solutions',
    hasSubmenu: true,
    submenu: [
      { name: 'hospitalSolutions', href: '/solutions/hospital' },
      { name: 'clinicSolutions', href: '/solutions/clinic' },
      { name: 'labSolutions', href: '/solutions/laboratory' },
    ],
  },
  {
    name: 'partners',
    href: '/partners',
  },
  {
    name: 'about',
    href: '/about',
    hasSubmenu: true,
    submenu: [
      { name: 'company', href: '/about' },
      { name: 'team', href: '/about/team' },
      { name: 'news', href: '/about/news' },
    ],
  },
  {
    name: 'contact',
    href: '/contact',
  },
];

export function Header({ locale, className }: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  
  const { itemCount, toggleCart } = useRFPStore();
  const { query, setQuery } = useSearchStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);
  
  // Debounced search handler
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 300),
    [router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const switchLocale = (newLocale: Locale) => {
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  const cartItemCount = itemCount();

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-gray-100 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95', className)}>
      <div className="container flex h-14 items-center justify-between">
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
                        'h-auto px-3 py-2 text-sm font-medium bg-transparent border-0 text-gray-700 hover:text-gray-900 data-[state=open]:text-gray-900',
                        pathname.startsWith(item.href) && 'text-primary'
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
                      'inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors',
                      pathname === item.href && 'text-primary'
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
        <div className="hidden md:flex flex-1 max-w-md mx-8">
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
                'w-full h-9 pl-10 pr-4 text-sm bg-gray-50 border-0 rounded-full transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-sm',
                searchFocused && 'ring-1 ring-gray-300'
              )}
              aria-label={tCommon('searchProducts')}
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Button (Mobile) */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={tCommon('search')}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist */}
          <Link 
            href="/wishlist"
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={tCommon('wishlist')}
          >
            <Heart className="h-5 w-5" />
          </Link>

          {/* RFP Cart */}
          <button
            onClick={toggleCart}
            className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={`${tCommon('rfpCart')}${cartItemCount > 0 ? ` (${cartItemCount} ${tCommon('items')})` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 h-5 w-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label={tCommon('changeLanguage')}
              >
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-gray-200">
              <DropdownMenuItem 
                onClick={() => switchLocale('en')}
                className={cn(
                  'text-sm cursor-pointer',
                  locale === 'en' && 'bg-gray-100'
                )}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchLocale('fr')}
                className={cn(
                  'text-sm cursor-pointer',
                  locale === 'fr' && 'bg-gray-100'
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
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label={tCommon('userMenu')}
              >
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-gray-200">
              <DropdownMenuItem asChild>
                <Link href="/account" className="text-sm cursor-pointer">{tCommon('myAccount')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/rfp/history" className="text-sm cursor-pointer">{tCommon('rfpHistory')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="text-sm cursor-pointer">{tCommon('adminPanel')}</Link>
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