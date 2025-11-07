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
    <header className={cn('sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60', className)}>
      <div className="container flex h-16 items-center justify-between">
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
                        'transition-colors hover:text-primary',
                        pathname.startsWith(item.href) && 'text-primary'
                      )}
                    >
                      {t(item.name)}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.submenu?.map((subItem) => (
                          <li key={subItem.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                  pathname === subItem.href && 'bg-accent text-accent-foreground'
                                )}
                              >
                                <div className="text-sm font-medium leading-none">
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
                      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={tCommon('searchPlaceholder')}
              value={query}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'pl-10 pr-4 transition-all duration-200',
                searchFocused && 'ring-2 ring-primary'
              )}
              aria-label={tCommon('searchProducts')}
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={tCommon('search')}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={tCommon('wishlist')}
          >
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          {/* RFP Cart */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCart}
            className="relative"
            aria-label={`${tCommon('rfpCart')}${cartItemCount > 0 ? ` (${cartItemCount} ${tCommon('items')})` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge 
                variant="accent" 
                className="absolute -right-1 -top-1 h-5 w-5 p-0 text-xs"
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Badge>
            )}
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                aria-label={tCommon('changeLanguage')}
              >
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => switchLocale('en')}
                className={locale === 'en' ? 'bg-accent' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchLocale('fr')}
                className={locale === 'fr' ? 'bg-accent' : ''}
              >
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                aria-label={tCommon('userMenu')}
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/account">{tCommon('myAccount')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/rfp/history">{tCommon('rfpHistory')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin">{tCommon('adminPanel')}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={tCommon('openMenu')}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>KITMED</SheetTitle>
              </SheetHeader>
              
              {/* Mobile Search */}
              <div className="mt-6">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={tCommon('searchPlaceholder')}
                      value={query}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                </form>
              </div>

              {/* Mobile Navigation */}
              <nav className="mt-6">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                          pathname.startsWith(item.href) && 'bg-accent text-accent-foreground'
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
                                  'flex items-center rounded-lg px-3 py-1 text-sm transition-colors hover:bg-accent',
                                  pathname === subItem.href && 'bg-accent text-accent-foreground'
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