'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, ChevronDown, ChevronRight, MapPin, FileText, Instagram, Facebook, Linkedin } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useSearchStore } from '@/store/search-store';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types';

interface HeaderProps {
  locale: Locale;
  className?: string;
}

/** A category of the public tree: root > pillar (Appareillage...) > tile. */
interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  subcategories?: CategoryNode[];
}

const NAV_ITEMS = [
  { key: 'home', path: '' },
  { key: 'about', path: '/about' },
  { key: 'products', path: '/products' },
  { key: 'partners', path: '/partners' },
  { key: 'catalogues', path: '/catalogues' },
  { key: 'sav', path: '/sav' },
  { key: 'contact', path: '/contact' },
] as const;

const NAVY = 'text-[#10146B]';
const INSTAGRAM_URL = 'https://www.instagram.com/kitmed.maroc?igsh=MjluY25wMGc2N3Aw';
const FACEBOOK_URL = 'https://www.facebook.com/share/1E9mpRMbRD/?mibextid=wwXIfr';
const LINKEDIN_URL = 'https://www.linkedin.com/company/kitmed/';
const ISO_BADGES = ['9001', '13485', '22716'];

export function Header({ locale, className }: HeaderProps) {
  const t = useTranslations('siteChrome');
  const tCommon = useTranslations('common');
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();

  const { query, setQuery } = useSearchStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);

  // Close the phone search row when the page changes
  React.useEffect(() => setMobileSearchOpen(false), [pathname]);

  // Category tree (3 levels), only branches that hold products
  React.useEffect(() => {
    fetch(`/api/categories?locale=${locale}&hierarchy=true&includeProductCount=true`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) setCategories(data.data);
      })
      .catch(console.error);
  }, [locale]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
    }
  };

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    const currentPath = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
    router.push(`/${newLocale}${currentPath}`);
  };

  const isActive = (path: string) => {
    const href = `/${locale}${path}`;
    if (!path) return pathname === href || pathname === `${href}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const languageSwitch = (
    <div className="flex items-center gap-1 text-xs font-semibold" aria-label={tCommon('language')}>
      {(['fr', 'en'] as Locale[]).map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span className="text-[#10146B]/40">|</span>}
          <button
            type="button"
            onClick={() => switchLocale(l)}
            aria-pressed={locale === l}
            className={cn(
              'px-1 uppercase transition-colors',
              locale === l ? 'text-accent' : `${NAVY} hover:text-accent`
            )}
          >
            {l}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  const searchForm = (extraClass?: string) => (
    <form onSubmit={handleSearchSubmit} role="search" className={cn('relative w-full', extraClass)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10146B]" />
      <input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={tCommon('searchProducts')}
        className="h-11 w-full rounded-lg border border-[#DCE6F2] bg-[#F1F5FA] pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-500 focus:border-primary/50 focus:bg-white focus:outline-none"
      />
    </form>
  );

  return (
    <header className={cn('sticky -top-9 lg:-top-[148px] z-50 w-full bg-white shadow-sm', className)}>
      {/* Top bar: tagline | Instagram, Facebook | Casablanca (mockup) */}
      <div className="h-9 bg-[#DCEEFD]">
        <div className="container mx-auto flex h-full items-center justify-between gap-4 px-4 lg:px-8">
          <p className={cn('truncate text-xs font-semibold', NAVY)}>{t('topBar')}</p>
          <div className="hidden items-center gap-3 sm:flex">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-[#F9CE34] via-[#EE2A7B] to-[#6228D7] text-white">
              <Instagram className="h-4 w-4" />
            </a>
            <span className="h-4 w-px bg-[#10146B]/40" />
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-white">
              <Facebook className="h-3.5 w-3.5 fill-current" />
            </a>
            <span className="h-4 w-px bg-[#10146B]/40" />
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0A66C2] text-white">
              <Linkedin className="h-3.5 w-3.5 fill-current" />
            </a>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className={cn('flex items-center gap-1.5 text-xs', NAVY)}>
              <MapPin className="h-3.5 w-3.5 text-accent" />
              <span className="hidden sm:inline">{t('location')}</span>
            </span>
            <span className="h-4 w-px bg-[#10146B]/30" />
            {languageSwitch}
          </div>
        </div>
      </div>

      {/* Logo, search, quote */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto flex h-20 items-center justify-between gap-3 px-4 md:gap-6 lg:h-28 lg:px-8">
          {/* Logo enlarged (owner 2026-11-20: « pas valorisé »): trimmed hi-res file, ~1.8x the old visible size */}
          <Link href={`/${locale}`} aria-label={tCommon('goToHomepage')} className="flex flex-shrink-0 items-center gap-3 lg:gap-4">
            <Image
              src="/images/logos/kitmed-logo-header.png"
              alt="KITMED"
              width={559}
              height={270}
              priority
              className="h-[54px] w-auto sm:h-[62px] lg:h-[84px]"
            />
            <span className="hidden h-12 w-px bg-[#10146B]/30 sm:block lg:h-14" />
            <span className="hidden whitespace-nowrap text-sm font-bold leading-tight text-[#10146B] sm:block">
              {t('certifiedLine1')}
            </span>
          </Link>

          {/* ONSSA + ISO badges, as in the previous header (owner 2026-11-17) */}
          <div className="hidden flex-shrink-0 items-center gap-3 border-l border-gray-200 pl-5 xl:flex">
            <Image src="/images/compliance/onssa-logo.svg" alt="ONSSA" width={56} height={56} className="object-contain" />
            {ISO_BADGES.map(code => (
              <div key={code} className="flex flex-col items-center gap-0.5">
                <Image src="/images/compliance/iso-logo.png" alt={`ISO ${code}`} width={40} height={40} className="rounded-full object-contain" />
                <span className="text-[10px] font-semibold text-primary-600">{code}</span>
              </div>
            ))}
          </div>

          <div className="hidden max-w-md flex-1 md:block">{searchForm()}</div>

          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            {/* Phones: search and quote as icons (the full controls show from md / sm) */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(o => !o)}
              aria-expanded={mobileSearchOpen}
              aria-controls="mobile-search"
              aria-label={tCommon('searchProducts')}
              className="rounded-lg p-2.5 text-[#10146B] transition-colors hover:bg-gray-100 md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={`/${locale}/rfp/new`}
              aria-label={t('quote')}
              className="rounded-lg p-2.5 text-accent transition-colors hover:bg-accent/5 sm:hidden"
            >
              <FileText className="h-5 w-5" />
            </Link>
            <Link
              href={`/${locale}/rfp/new`}
              className="hidden items-center gap-2 rounded-lg border-2 border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white sm:inline-flex"
            >
              <FileText className="h-4 w-4" />
              {t('quote')}
            </Link>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="rounded-lg p-2.5 text-[#10146B] transition-colors hover:bg-gray-100 lg:hidden"
                  aria-label={tCommon('openMenu')}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[22rem] max-w-[90vw] overflow-y-auto p-0">
                <SheetHeader className="border-b p-5">
                  <SheetTitle className={NAVY}>{t('menu')}</SheetTitle>
                </SheetHeader>
                <div className="flex items-center justify-between gap-4 p-5">{searchForm()}{languageSwitch}</div>
                <nav className="px-3">
                  <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={`/${locale}${item.path}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50',
                            isActive(item.path) ? 'bg-accent/5 text-accent' : NAVY
                          )}
                        >
                          {t(`nav.${item.key}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-4 border-t px-3 pt-4">
                  <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('categories')}</p>
                  <MobileCategoryTree
                    categories={categories}
                    locale={locale}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                </div>
                <div className="p-5">
                  <Link
                    href={`/${locale}/rfp/new`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-accent py-2.5 text-sm font-semibold text-accent"
                  >
                    <FileText className="h-4 w-4" />
                    {t('quote')}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search row (phones), opened by the search icon */}
      {mobileSearchOpen && (
        <div id="mobile-search" className="border-b border-gray-100 bg-white px-4 py-3 md:hidden">
          {searchForm()}
        </div>
      )}

      {/* Navigation row (desktop) */}
      <div className="hidden border-b border-gray-100 bg-white lg:block">
        <div className="container relative mx-auto flex h-14 items-center gap-10 px-4 lg:px-8">
          <CategoryMenu categories={categories} locale={locale} pathname={pathname} />
          <nav className="flex flex-1 items-center justify-between">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.path}`}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={cn(
                  'relative py-2 text-sm font-semibold transition-colors hover:text-accent',
                  isActive(item.path)
                    ? "text-accent after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-accent after:content-['']"
                    : NAVY
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

/** « Nos catégories » button + panel: roots on the left, their pillars and tiles on the right. */
function CategoryMenu({ categories, locale, pathname }: { categories: CategoryNode[]; locale: string; pathname: string }) {
  const t = useTranslations('siteChrome');
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  // close on route change, outside click and Escape
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = categories.find(c => c.id === activeId) || categories[0];
  const base = `/${locale}/products/categories`;
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-10 items-center gap-3 rounded-md bg-[#0B5CAD] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#094C8F]"
      >
        <Menu className="h-5 w-5" />
        {t('categories')}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && categories.length > 0 && (
        <div className="absolute left-4 right-4 top-full z-50 mt-1 flex max-h-[70vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl lg:left-8 lg:right-8">
          <ul className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-[#F4F9FF] py-2">
            {categories.map(cat => (
              <li key={cat.id}>
                <Link
                  href={`${base}/${cat.slug}`}
                  onMouseEnter={() => setActiveId(cat.id)}
                  onFocus={() => setActiveId(cat.id)}
                  onClick={close}
                  className={cn(
                    'flex items-center justify-between px-5 py-2.5 text-sm font-semibold transition-colors',
                    active?.id === cat.id ? 'bg-white text-accent' : `${NAVY} hover:bg-white`
                  )}
                >
                  {cat.name}
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>

          {active && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <p className={cn('text-lg font-bold', NAVY)}>{active.name}</p>
                <Link href={`${base}/${active.slug}`} onClick={close} className="text-sm font-semibold text-accent hover:underline">
                  {t('viewAll')}
                </Link>
              </div>
              {active.subcategories?.some(s => s.subcategories && s.subcategories.length > 0) ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-3">
                  {active.subcategories.map(sub => {
                    const long = (sub.subcategories?.length || 0) > 12;
                    return (
                    <div key={sub.id} className={cn(long && 'col-span-2')}>
                      <Link
                        href={`${base}/${active.slug}/${sub.slug}`}
                        onClick={close}
                        className="mb-2 block border-b border-gray-100 pb-1.5 text-sm font-bold text-[#0B5CAD] hover:text-accent"
                      >
                        {sub.name}
                      </Link>
                      <ul className={cn(long ? 'columns-2 gap-x-8' : '')}>
                        {(sub.subcategories || []).map(leaf => (
                          <li key={leaf.id} className="break-inside-avoid py-0.5">
                            <Link
                              href={`${base}/${active.slug}/${sub.slug}/${leaf.slug}`}
                              onClick={close}
                              className="block text-sm text-gray-700 hover:text-accent"
                            >
                              {leaf.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-x-8 gap-y-2 xl:grid-cols-3">
                  {(active.subcategories || []).map(sub => (
                    <li key={sub.id}>
                      <Link
                        href={`${base}/${active.slug}/${sub.slug}`}
                        onClick={close}
                        className="block text-sm text-gray-700 hover:text-accent"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Mobile: the same tree as nested, collapsible lists. */
function MobileCategoryTree({ categories, locale, onNavigate }: { categories: CategoryNode[]; locale: string; onNavigate: () => void }) {
  const [openIds, setOpenIds] = React.useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpenIds(s => ({ ...s, [id]: !s[id] }));

  const render = (nodes: CategoryNode[], parentPath: string, depth: number) => (
    <ul className={cn(depth > 0 && 'ml-4 border-l border-gray-100')}>
      {nodes.map(node => {
        const href = `${parentPath}/${node.slug}`;
        const hasChildren = !!node.subcategories && node.subcategories.length > 0;
        return (
          <li key={node.id}>
            <div className="flex items-center">
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-gray-50',
                  depth === 0 ? `font-semibold ${NAVY}` : 'text-gray-700'
                )}
              >
                {node.name}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  aria-expanded={!!openIds[node.id]}
                  aria-label={node.name}
                  className="p-2.5 text-gray-500"
                >
                  <ChevronDown className={cn('h-4 w-4 transition-transform', openIds[node.id] && 'rotate-180')} />
                </button>
              )}
            </div>
            {hasChildren && openIds[node.id] && render(node.subcategories!, href, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return render(categories, `/${locale}/products/categories`, 0);
}
