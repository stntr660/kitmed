'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Building2, ChevronDown, ExternalLink, FileText, Loader2, Search, X } from 'lucide-react';
import { SoftWaveBackground } from '@/components/layout/SoftWaveBackground';

type Localized = { fr: string; en: string };

interface CatalogueBrochure {
  url: string;
  name: Localized;
}

interface CataloguePartner {
  id: string;
  slug: string;
  name: Localized;
  logoUrl: string | null;
  catalogueUrl: string | null;
  brochures: CatalogueBrochure[];
}

interface CatalogueDomain {
  id: string;
  slug: string;
  name: Localized;
  partners: CataloguePartner[];
}

interface PartnerInfo {
  id: string;
  description?: Localized | null;
}

interface DomainRef {
  slug: string;
  name: Localized;
}

/** One manufacturer, merged across all the domains it appears in. */
interface Manufacturer {
  id: string;
  slug: string;
  name: Localized;
  logoUrl: string | null;
  catalogueUrl: string | null;
  brochures: CatalogueBrochure[];
  domains: DomainRef[];
  description: Localized | null;
}

const DRAWER_FILTER_MIN = 8;

function localized(value: Localized | null | undefined, locale: string) {
  if (!value) return '';
  return (locale === 'en' ? value.en || value.fr : value.fr || value.en) || '';
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Groups the per-domain API payload into one entry per manufacturer (documents de-duplicated by URL). */
function toManufacturers(domains: CatalogueDomain[], infos: PartnerInfo[]): Manufacturer[] {
  const descriptions = new Map(infos.map((p) => [p.id, p.description ?? null]));
  const byId = new Map<string, Manufacturer>();
  for (const domain of domains) {
    for (const partner of domain.partners) {
      let entry = byId.get(partner.id);
      if (!entry) {
        entry = {
          id: partner.id,
          slug: partner.slug,
          name: partner.name,
          logoUrl: partner.logoUrl,
          catalogueUrl: partner.catalogueUrl,
          brochures: [],
          domains: [],
          description: descriptions.get(partner.id) ?? null,
        };
        byId.set(partner.id, entry);
      }
      if (!entry.catalogueUrl && partner.catalogueUrl) entry.catalogueUrl = partner.catalogueUrl;
      if (!entry.domains.some((d) => d.slug === domain.slug)) entry.domains.push({ slug: domain.slug, name: domain.name });
      for (const brochure of partner.brochures) {
        if (brochure.url === entry.catalogueUrl) continue;
        if (!entry.brochures.some((b) => b.url === brochure.url)) entry.brochures.push(brochure);
      }
    }
  }
  return Array.from(byId.values());
}

function DocumentsDrawer({
  manufacturer,
  locale,
  initialQuery,
  onClose,
}: {
  manufacturer: Manufacturer;
  locale: string;
  initialQuery: string;
  onClose: () => void;
}) {
  const t = useTranslations('catalogues');
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = localized(manufacturer.name, locale);
  const [filter, setFilter] = useState(() => {
    // Keep the page search only if it actually narrows this manufacturer's brochures.
    const q = normalize(initialQuery);
    if (!q) return '';
    return manufacturer.brochures.some((b) => normalize(localized(b.name, locale)).includes(q)) ? initialQuery : '';
  });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const q = normalize(filter);
  const brochures = q
    ? manufacturer.brochures.filter((b) => normalize(localized(b.name, locale)).includes(q))
    : manufacturer.brochures;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label={t('drawer.close')}
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[#10146B]/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogue-drawer-title"
        className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex items-start gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 px-2">
            {manufacturer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={manufacturer.logoUrl} alt="" className="max-h-12 max-w-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-slate-400" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {manufacturer.domains.map((d) => localized(d.name, locale)).join(' · ')}
            </p>
            <h2 id="catalogue-drawer-title" className="mt-1 text-xl font-bold leading-tight text-[#10146B]">
              {name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('drawer.close')}
            className="-mr-1 -mt-1 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#10146B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CAD]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {manufacturer.catalogueUrl && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('drawer.catalogue')}</h3>
              <a
                href={/^https?:/.test(manufacturer.catalogueUrl) ? manufacturer.catalogueUrl : `${manufacturer.catalogueUrl}#toolbar=0&navpanes=0`}
                target="_blank"
                rel="noopener noreferrer"
                title={t('drawer.open')}
                className="group mt-3 flex items-center gap-4 rounded-xl border border-[#10146B]/15 bg-[#F4F6FC] p-4 transition-colors hover:border-[#0A0EA4] hover:bg-[#EBEFFA]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#10146B] text-white">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#10146B]">
                    {t('drawer.catalogue')} {name}
                  </span>
                  <span className="block text-sm text-slate-500">{t('drawer.catalogueHint')}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0A0EA4]" aria-hidden="true" />
              </a>
            </section>
          )}

          {manufacturer.brochures.length > 0 && (
            <section className={manufacturer.catalogueUrl ? 'mt-7' : undefined}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t('drawer.brochures')} <span className="text-slate-400">({manufacturer.brochures.length})</span>
              </h3>
              {manufacturer.brochures.length >= DRAWER_FILTER_MIN && (
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t('drawer.filterPlaceholder')}
                    aria-label={t('drawer.filterPlaceholder')}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0B5CAD] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/20"
                  />
                </div>
              )}
              {brochures.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t('drawer.noMatch')}</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {brochures.map((b) => (
                    <li key={b.url}>
                      <a
                        href={/^https?:/.test(b.url) ? b.url : `${b.url}#toolbar=0&navpanes=0`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('drawer.open')}
                        className="group flex items-start gap-3 py-3 text-sm text-slate-800 transition-colors hover:text-[#0A0EA4]"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        <span className="min-w-0 flex-1 group-hover:underline">{localized(b.name, locale) || t('pdf')}</span>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-[#0A0EA4]" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 sm:px-6">
            <Link
              href={`/${locale}/partners/${manufacturer.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5CAD] hover:text-[#0A0EA4] hover:underline"
            >
              {t('drawer.products', { name })}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
        </div>
      </div>
    </div>
  );
}

function ManufacturerCard({
  manufacturer,
  locale,
  query,
  onDomain,
  onOpen,
  activeDomain,
}: {
  manufacturer: Manufacturer;
  locale: string;
  query: string;
  onDomain: (slug: string) => void;
  onOpen: (m: Manufacturer, trigger: HTMLElement) => void;
  activeDomain?: string;
}) {
  const t = useTranslations('catalogues');
  const name = localized(manufacturer.name, locale);
  const description =
    localized(manufacturer.description, locale) ||
    t('card.fallbackDescription', { domain: localized(manufacturer.domains[0]?.name, locale) });
  const brochureCount = manufacturer.brochures.length;
  // The card leads to the product catalogue filtered by this brand and domain (owner 2026-11-16);
  // the documents stay one click away (summary link -> drawer).
  const domainSlug =
    (activeDomain && manufacturer.domains.some((d) => d.slug === activeDomain) ? activeDomain : manufacturer.domains[0]?.slug) || '';
  const productsHref = `/${locale}/partners/${manufacturer.slug}${
    domainSlug && domainSlug !== 'other' ? `?category=${encodeURIComponent(domainSlug)}` : ''
  }`;
  const summary =
    manufacturer.catalogueUrl && brochureCount > 0
      ? t('card.both', { count: brochureCount })
      : manufacturer.catalogueUrl
        ? t('card.catalogue')
        : t('card.brochures');

  const q = normalize(query);
  const brochureMatches =
    q && !normalize(name).includes(q)
      ? manufacturer.brochures.filter((b) => normalize(localized(b.name, locale)).includes(q)).length
      : 0;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,20,107,0.04)] transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(16,20,107,0.18)] sm:p-5">
      <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-[#EEF1F9] px-6 sm:h-36">
        {manufacturer.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={manufacturer.logoUrl}
            alt={name}
            loading="lazy"
            className="max-h-16 max-w-[75%] object-contain sm:max-h-20"
          />
        ) : (
          <span className="text-2xl font-bold text-[#10146B]">{name}</span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
        {manufacturer.domains.map((d) => (
          <button
            key={d.slug}
            type="button"
            onClick={() => onDomain(d.slug)}
            title={t('filters.filterByDomain', { domain: localized(d.name, locale) })}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-accent hover:underline focus:outline-none focus-visible:underline"
          >
            {localized(d.name, locale)}
          </button>
        ))}
      </div>
      <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#10146B]">{name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{description}</p>
      {brochureMatches > 0 && (
        <p className="mt-2 text-xs font-medium text-[#0B5CAD]">{t('card.matches', { count: brochureMatches })}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <button
          type="button"
          onClick={(e) => onOpen(manufacturer, e.currentTarget)}
          aria-label={t('card.viewDocumentsOf', { name })}
          aria-haspopup="dialog"
          className="min-w-0 text-left text-sm text-slate-500 underline-offset-2 hover:text-[#0B5CAD] hover:underline focus:outline-none focus-visible:underline"
        >
          {summary}
        </button>
        <Link
          href={productsHref}
          aria-label={t('card.viewProductsOf', { name })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#10146B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A0EA4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CAD] focus-visible:ring-offset-2"
        >
          {t('card.viewProducts')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function CataloguesExplorer({ locale }: { locale: string }) {
  const t = useTranslations('catalogues');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [domains, setDomains] = useState<CatalogueDomain[]>([]);
  const [infos, setInfos] = useState<PartnerInfo[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [open, setOpen] = useState<Manufacturer | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const domainParam = searchParams.get('domaine') || '';
  const brandParam = searchParams.get('marque') || '';
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/catalogues')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json) => {
        if (cancelled) return;
        if (!json.success) throw new Error('failed');
        setDomains(json.data as CatalogueDomain[]);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    // Descriptions only (optional): the cards fall back to a generic line if this fails.
    fetch('/api/partners')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success && Array.isArray(json.data)) setInfos(json.data as PartnerInfo[]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const manufacturers = useMemo(() => toManufacturers(domains, infos), [domains, infos]);

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Search box -> URL (debounced), URL -> search box (back/forward, reset).
  useEffect(() => {
    if (query === queryParam) return;
    const id = window.setTimeout(() => updateParams({ q: query.trim() || null }), 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  useEffect(() => {
    setQuery((current) => (current.trim() === queryParam.trim() ? current : queryParam));
  }, [queryParam]);

  const activeDomain = domains.some((d) => d.slug === domainParam) ? domainParam : '';
  const brandsInDomain = useMemo(
    () =>
      manufacturers
        .filter((m) => !activeDomain || m.domains.some((d) => d.slug === activeDomain))
        .sort((a, b) => localized(a.name, locale).localeCompare(localized(b.name, locale), locale)),
    [manufacturers, activeDomain, locale]
  );
  const activeBrand = brandsInDomain.some((m) => m.slug === brandParam) ? brandParam : '';

  const visible = useMemo(() => {
    const q = normalize(query);
    return manufacturers.filter((m) => {
      if (activeDomain && !m.domains.some((d) => d.slug === activeDomain)) return false;
      if (activeBrand && m.slug !== activeBrand) return false;
      if (!q) return true;
      const haystack = [
        localized(m.name, locale),
        m.slug,
        localized(m.description, locale),
        ...m.domains.map((d) => localized(d.name, locale)),
        ...m.brochures.map((b) => localized(b.name, locale)),
      ]
        .map(normalize)
        .join(' ');
      return haystack.includes(q);
    });
  }, [manufacturers, activeDomain, activeBrand, query, locale]);

  const selectDomain = (slug: string) => {
    const brandStillVisible =
      !brandParam || manufacturers.some((m) => m.slug === brandParam && (!slug || m.domains.some((d) => d.slug === slug)));
    updateParams({ domaine: slug || null, marque: brandStillVisible ? brandParam || null : null });
  };

  const openDocuments = (m: Manufacturer, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpen(m);
  };
  const closeDocuments = useCallback(() => {
    setOpen(null);
    triggerRef.current?.focus();
  }, []);

  const hasFilters = Boolean(activeDomain || activeBrand || query.trim());
  const resetFilters = () => {
    setQuery('');
    updateParams({ domaine: null, marque: null, q: null });
  };

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5CAD] focus-visible:ring-offset-1 ${
      active
        ? 'border-[#10146B] bg-[#10146B] text-white shadow-sm'
        : 'border-slate-200 bg-white text-[#10146B] hover:border-[#10146B]/40 hover:bg-[#F4F6FC]'
    }`;

  return (
    <>
      {/* Header + filters on the light-blue wave background (same as the Partenaires hero) */}
      <section className="relative isolate overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <SoftWaveBackground wavesClassName="-bottom-px h-[50%] sm:h-[60%] lg:h-[72%]" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:text-sm">{t('kicker')}</p>
              <h1 className="mt-4 text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#10146B] sm:text-5xl lg:text-[3.5rem]">
                {t('title')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#2A2F45]">{t('intro')}</p>
            </div>
            {state === 'ready' && manufacturers.length > 0 && (
              <dl className="mt-8 flex gap-8 lg:mt-0 lg:shrink-0 lg:gap-12">
                <div>
                  <dt className="sr-only">{t('stats.manufacturers', { count: manufacturers.length })}</dt>
                  <dd className="text-4xl font-bold leading-none text-[#10146B]">{manufacturers.length}</dd>
                  <dd className="mt-2 text-sm text-slate-500">{t('stats.manufacturers', { count: manufacturers.length })}</dd>
                </div>
                <div>
                  <dt className="sr-only">{t('stats.domains', { count: domains.length })}</dt>
                  <dd className="text-4xl font-bold leading-none text-[#10146B]">{domains.length}</dd>
                  <dd className="mt-2 text-sm text-slate-500">{t('stats.domains', { count: domains.length })}</dd>
                </div>
              </dl>
            )}
          </div>
          {state === 'ready' && domains.length > 0 && (
            <div
              role="search"
              aria-label={t('filters.label')}
              className="mt-10 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_10px_30px_rgba(16,20,107,0.08)] backdrop-blur-sm sm:p-6 lg:mt-12"
            >
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('filters.searchPlaceholder')}
                    aria-label={t('filters.searchLabel')}
                    className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-11 text-base text-slate-800 placeholder:text-slate-400 focus:border-[#0B5CAD] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/20 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label={t('filters.clearSearch')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#10146B]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <label className="relative md:w-72">
                  <span className="sr-only">{t('filters.brand')}</span>
                  <select
                    value={activeBrand}
                    onChange={(e) => updateParams({ marque: e.target.value || null })}
                    className={`h-14 w-full appearance-none rounded-xl border bg-white pl-4 pr-10 text-base focus:border-[#0B5CAD] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/20 ${
                      activeBrand ? 'border-[#10146B] font-semibold text-[#10146B]' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <option value="">
                      {t('filters.brand')} : {t('filters.allBrands')}
                    </option>
                    {brandsInDomain.map((m) => (
                      <option key={m.id} value={m.slug}>
                        {localized(m.name, locale)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                </label>
              </div>

              <p id="catalogue-domain-label" className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {t('filters.domain')}
              </p>
              <div role="group" aria-labelledby="catalogue-domain-label" className="mt-3 flex flex-wrap gap-2">
                <button type="button" aria-pressed={!activeDomain} onClick={() => selectDomain('')} className={chipClass(!activeDomain)}>
                  {t('filters.allDomains')}
                </button>
                {domains.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={activeDomain === d.slug}
                    onClick={() => selectDomain(activeDomain === d.slug ? '' : d.slug)}
                    className={chipClass(activeDomain === d.slug)}
                  >
                    {localized(d.name, locale)}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      <section className="bg-gradient-to-b from-[#F4F8FE] to-white pb-14 lg:pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {state === 'ready' && domains.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm font-medium text-slate-600" aria-live="polite">
                {t('filters.results', { count: visible.length })}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B5CAD] hover:text-[#0A0EA4] hover:underline"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t('filters.reset')}
                </button>
              )}
            </div>
          )}

          {state === 'loading' && (
            <div className="mt-6 flex items-center gap-3 text-slate-600" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t('loading')}
            </div>
          )}
          {state === 'error' && (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
              {t('error')}
            </p>
          )}
          {state === 'ready' && domains.length === 0 && (
            <p className="mt-6 rounded-lg bg-slate-50 p-4 text-slate-700">{t('empty')}</p>
          )}

          {state === 'ready' && domains.length > 0 && visible.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-600">{t('noResults')}</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-lg bg-[#10146B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A0EA4]"
              >
                {t('filters.reset')}
              </button>
            </div>
          )}

          {visible.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 lg:gap-6">
              {visible.map((m) => (
                <ManufacturerCard
                  key={m.id}
                  manufacturer={m}
                  locale={locale}
                  query={query}
                  onDomain={(slug) => selectDomain(slug)}
                  onOpen={openDocuments}
                  activeDomain={activeDomain}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {open && <DocumentsDrawer manufacturer={open} locale={locale} initialQuery={query} onClose={closeDocuments} />}
    </>
  );
}
