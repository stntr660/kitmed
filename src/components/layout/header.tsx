'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, ChevronDown, ChevronRight, Facebook, Linkedin, Instagram } from 'lucide-react';

import { HeaderLogo } from '@/components/ui/logo';
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
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { useSearchStore } from '@/store/search-store';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface HeaderProps {
  locale: Locale;
  className?: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Subcategory[];
}

const getNavigation = (locale: string) => [
  { name: 'home', href: `/${locale}` },
  { name: 'about', href: `/${locale}/about` },
  { name: 'products', href: `/${locale}/products` },
  { name: 'partners', href: `/${locale}/partners` },
  { name: 'contact', href: `/${locale}/contact` },
];

export function Header({ locale, className }: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();

  const navigation = getNavigation(locale);

  const { query, setQuery } = useSearchStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

  // Fetch categories with hierarchy, excluding those with zero products
  React.useEffect(() => {
    fetch(`/api/categories?locale=${locale}&hierarchy=true&includeProductCount=true&excludeZeroProducts=true`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data);
        }
      })
      .catch(console.error);
  }, [locale]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : '';
      router.push(`/${locale}/search?q=${encodeURIComponent(query)}${categoryParam}`);
    }
  };

  const switchLocale = (newLocale: Locale) => {
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return t('categories');
    for (const cat of categories) {
      if (cat.id === selectedCategory) return cat.name;
      if (cat.subcategories) {
        const sub = cat.subcategories.find(s => s.id === selectedCategory);
        if (sub) return sub.name;
      }
    }
    return t('categories');
  };

  return (
    <header className={cn('sticky top-0 z-50 w-full bg-white shadow-sm', className)}>
      {/* Top Row - Logo, Search, Social */}
      <div className="border-b border-gray-100">
        <div className="container flex h-20 items-center justify-between px-6 lg:px-12">
          {/* Logo */}
          <div className="flex-shrink-0 mr-8">
            <Link href={`/${locale}`} aria-label={tCommon('goToHomepage')}>
              <HeaderLogo />
            </Link>
          </div>

          {/* Search Bar with Category Dropdown - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-3xl mx-12">
            <form onSubmit={handleSearchSubmit} className="flex w-full">
              {/* Category Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 h-12 bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg text-sm text-gray-600 hover:bg-gray-150 transition-colors min-w-[160px] justify-between"
                  >
                    <span className="truncate">{getSelectedCategoryName()}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-[400px] overflow-y-auto p-2">
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('')}
                    className={cn('cursor-pointer py-2.5 px-3 rounded-md', !selectedCategory && 'bg-primary/10 text-primary')}
                  >
                    {t('allCategories')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  {categories.map((cat) => (
                    cat.subcategories && cat.subcategories.length > 0 ? (
                      <DropdownMenuSub key={cat.id}>
                        <DropdownMenuSubTrigger className="py-2.5 px-3 rounded-md">
                          <span className="font-medium">{cat.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-2">
                          <DropdownMenuItem
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn('cursor-pointer py-2 px-3 rounded-md', selectedCategory === cat.id && 'bg-primary/10 text-primary')}
                          >
                            Tous les {cat.name}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          {cat.subcategories.map((sub) => (
                            <DropdownMenuItem
                              key={sub.id}
                              onClick={() => setSelectedCategory(sub.id)}
                              className={cn('cursor-pointer py-2 px-3 rounded-md text-sm', selectedCategory === sub.id && 'bg-primary/10 text-primary')}
                            >
                              {sub.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn('cursor-pointer py-2.5 px-3 rounded-md', selectedCategory === cat.id && 'bg-primary/10 text-primary')}
                      >
                        {cat.name}
                      </DropdownMenuItem>
                    )
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="search"
                  placeholder={tCommon('searchPlaceholder')}
                  value={query}
                  onChange={handleSearchChange}
                  className="w-full h-12 px-5 text-sm bg-white border border-gray-200 border-l-0 focus:outline-none focus:border-primary/50"
                  aria-label={tCommon('searchProducts')}
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="flex items-center justify-center w-14 h-12 bg-primary text-white rounded-r-lg hover:bg-primary/90 transition-colors"
                aria-label={tCommon('search')}
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Social Icons & Language - Desktop */}
          <div className="hidden lg:flex items-center gap-6 ml-8">
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/share/1E9mpRMbRD/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/kitmed.maroc?igsh=MjluY25wMGc2N3Aw" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/kitmed/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md">
                  <span className="uppercase">{locale}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-1">
                <DropdownMenuItem onClick={() => switchLocale('en')} className={cn('cursor-pointer py-2 px-3 rounded-md', locale === 'en' && 'bg-gray-100')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale('fr')} className={cn('cursor-pointer py-2 px-3 rounded-md', locale === 'fr' && 'bg-gray-100')}>
                  Francais
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: Search & Menu */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={tCommon('search')}
            >
              <Search className="h-5 w-5" />
            </button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" aria-label={tCommon('openMenu')}>
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle>KITMED</SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <div className="p-6">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder={tCommon('searchPlaceholder')}
                        value={query}
                        onChange={handleSearchChange}
                        className="w-full h-11 pl-11 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:bg-white"
                      />
                    </div>
                  </form>
                </div>

                {/* Mobile Navigation */}
                <nav className="px-4">
                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors',
                            pathname === item.href && 'text-primary bg-primary/5'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t(item.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Mobile Categories */}
                <div className="px-4 mt-4">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('categories')}</p>
                  <ul className="space-y-1">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/${locale}/products?category=${cat.slug}`}
                          className="flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {cat.name}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile Language */}
                <div className="p-6 mt-4 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{tCommon('language')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { switchLocale('en'); setMobileMenuOpen(false); }}
                      className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors', locale === 'en' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { switchLocale('fr'); setMobileMenuOpen(false); }}
                      className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors', locale === 'fr' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                    >
                      Francais
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom Row - Navigation */}
      <div className="hidden lg:block bg-gray-50 border-b border-gray-200">
        <div className="container flex h-14 items-center justify-between px-6 lg:px-12">
          {/* Browse Categories Dropdown */}
          <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 py-2 px-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <Menu className="h-4 w-4" />
                <span>{t('browseCategories')}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', categoriesOpen && 'rotate-180')} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-[500px] overflow-y-auto p-2">
              {categories.map((cat) => (
                cat.subcategories && cat.subcategories.length > 0 ? (
                  <DropdownMenuSub key={cat.id}>
                    <DropdownMenuSubTrigger className="py-2.5 px-3 rounded-md font-medium">
                      {cat.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 p-2 max-h-80 overflow-y-auto">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${locale}/products?category=${cat.slug}`}
                          className="cursor-pointer py-2 px-3 rounded-md font-medium text-primary"
                        >
                          Voir tout
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      {cat.subcategories.map((sub) => (
                        <DropdownMenuItem key={sub.id} asChild>
                          <Link
                            href={`/${locale}/products?category=${sub.slug}`}
                            className="cursor-pointer py-2 px-3 rounded-md text-sm"
                          >
                            {sub.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : (
                  <DropdownMenuItem key={cat.id} asChild>
                    <Link
                      href={`/${locale}/products?category=${cat.slug}`}
                      className="cursor-pointer py-2.5 px-3 rounded-md"
                    >
                      {cat.name}
                    </Link>
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Main Navigation */}
          <nav className="flex items-center gap-10">
            {navigation.map((item) => (
              item.name === 'products' ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2',
                        pathname.startsWith(item.href) && 'text-primary'
                      )}
                    >
                      {t(item.name)}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72 max-h-[500px] overflow-y-auto p-2">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${locale}/products`}
                        className="cursor-pointer py-2.5 px-3 rounded-md font-medium text-primary"
                      >
                        {t('allProducts')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    {categories.map((cat) => (
                      cat.subcategories && cat.subcategories.length > 0 ? (
                        <DropdownMenuSub key={cat.id}>
                          <DropdownMenuSubTrigger className="py-2.5 px-3 rounded-md font-medium">
                            {cat.name}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-64 p-2 max-h-80 overflow-y-auto">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${locale}/products?category=${cat.slug}`}
                                className="cursor-pointer py-2 px-3 rounded-md font-medium text-primary"
                              >
                                Voir tout
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            {cat.subcategories.map((sub) => (
                              <DropdownMenuItem key={sub.id} asChild>
                                <Link
                                  href={`/${locale}/products?category=${sub.slug}`}
                                  className="cursor-pointer py-2 px-3 rounded-md text-sm"
                                >
                                  {sub.name}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ) : (
                        <DropdownMenuItem key={cat.id} asChild>
                          <Link
                            href={`/${locale}/products?category=${cat.slug}`}
                            className="cursor-pointer py-2.5 px-3 rounded-md"
                          >
                            {cat.name}
                          </Link>
                        </DropdownMenuItem>
                      )
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2',
                    pathname === item.href && 'text-primary'
                  )}
                >
                  {t(item.name)}
                </Link>
              )
            ))}
          </nav>

          {/* Quote Request Button */}
          <Link
            href={`/${locale}/contact`}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-2"
          >
            {t('quoteRequest')}
          </Link>
        </div>
      </div>
    </header>
  );
}
