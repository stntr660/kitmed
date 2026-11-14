'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, ChevronDown, ChevronRight, MapPin, FileText } from 'lucide-react';

import { HeaderLogo } from '@/components/ui/logo';
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
  { key: 'catalogues', path: '/catalogues' },
  { key: 'sav', path: '/sav' },
  { key: 'contact', path: '/contact' },
] as const;

const NAVY = 'text-[#10146B]';

export function Header({ locale, className }: HeaderProps) {
  const t = useTranslations('siteChrome');
  const tCommon = useTranslations('common');
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();

  const { query, setQuery } = useSearchStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<CategoryNode[]>([]);

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
    <header className={cn('sticky -top-9 lg:-top-[132px] z-50 w-full bg-white shadow-sm', className)}>
      {/* Top bar */}
      <div className="h-9 bg-[#DCEEFD]">
        <div className="container mx-auto flex h-full items-center justify-between gap-4 px-4 lg:px-8">
          <p className={cn('truncate text-xs font-semibold', NAVY)}>{t('topBar')}</p>
          <div className="flex flex-shrink-0 items-center gap-4">
            <span className={cn('hidden items-center gap-1.5 text-xs sm:flex', NAVY)}>
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {t('location')}
            </span>
            {languageSwitch}
          </div>
        </div>
      </div>

      {/* Logo, search, quote */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto flex h-20 items-center justify-between gap-6 px-4 lg:h-24 lg:px-8">
          <Link href={`/${locale}`} aria-label={tCommon('goToHomepage')} className="flex flex-shrink-0 flex-col items-center">
            <HeaderLogo className="py-0 [&_img]:!max-h-[48px] lg:[&_img]:!max-h-[60px]" />
            <span className="mt-0.5 text-[10px] font-semibold leading-none text-gray-800">{t('certified')}</span>
          </Link>

          <div className="hidden max-w-xl flex-1 md:block">{searchForm()}</div>

          <div className="flex items-center gap-2">
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
                <div className="p-5">{searchForm()}</div>
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
                  {cat.subcategories && cat.subcategories.length > 0 && <ChevronRight className="h-4 w-4 opacity-60" />}
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
