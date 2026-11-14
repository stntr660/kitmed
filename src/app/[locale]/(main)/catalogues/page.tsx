'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileText, Building2, Loader2 } from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SectionTitle } from '@/components/layout/SectionTitle';

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

const VISIBLE_BROCHURES = 4;

function localized(value: Localized, locale: string) {
  return (locale === 'en' ? value.en || value.fr : value.fr || value.en) || '';
}

function PartnerCard({ partner, locale }: { partner: CataloguePartner; locale: string }) {
  const t = useTranslations('catalogues');
  const [expanded, setExpanded] = useState(false);
  const name = localized(partner.name, locale);
  const brochures = expanded ? partner.brochures : partner.brochures.slice(0, VISIBLE_BROCHURES);
  const hidden = partner.brochures.length - VISIBLE_BROCHURES;

  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-20 items-center justify-center rounded-lg bg-gray-50 px-4">
        {partner.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logoUrl} alt={name} className="max-h-14 max-w-full object-contain" loading="lazy" />
        ) : (
          <Building2 className="h-10 w-10 text-gray-400" aria-hidden="true" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#00007C]">{name}</h3>

      {partner.catalogueUrl && (
        <a
          href={partner.catalogueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-[#E3040D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B9030B]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('download')}
        </a>
      )}

      {partner.brochures.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('brochures')}</p>
          <ul className="mt-2 space-y-1.5">
            {brochures.map((b) => (
              <li key={b.url}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-sm text-gray-800 hover:text-[#E3040D]"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#E3040D]" aria-hidden="true" />
                  <span className="line-clamp-2 group-hover:underline">{localized(b.name, locale) || t('pdf')}</span>
                </a>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-medium text-[#00007C] underline underline-offset-2 hover:text-[#E3040D]"
            >
              {expanded ? t('showLess') : t('showMore', { count: hidden })}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function CataloguesPage() {
  const t = useTranslations('catalogues');
  const tNav = useTranslations('navigation');
  const locale = useHydrationSafeLocale('fr');
  const [domains, setDomains] = useState<CatalogueDomain[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col bg-white">
      <PageHeader
        accent
        title={t('header.title')}
        breadcrumb={[{ label: tNav('home'), href: `/${locale}` }, { label: t('header.breadcrumb') }]}
      />

      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="max-w-3xl text-base lg:text-lg leading-relaxed text-gray-800">{t('intro')}</p>

          {state === 'ready' && domains.length > 0 && (
            <nav aria-label={t('header.title')} className="mt-6 flex flex-wrap gap-2">
              {domains.map((d) => (
                <a
                  key={d.id}
                  href={`#${d.slug}`}
                  className="rounded-full border border-[#00007C]/20 bg-[#EBF5FF] px-4 py-1.5 text-sm font-medium text-[#00007C] hover:border-[#E3040D] hover:text-[#E3040D]"
                >
                  {localized(d.name, locale)}
                </a>
              ))}
            </nav>
          )}

          {state === 'loading' && (
            <div className="mt-12 flex items-center gap-3 text-gray-600" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t('loading')}
            </div>
          )}
          {state === 'error' && (
            <p className="mt-12 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
              {t('error')}
            </p>
          )}
          {state === 'ready' && domains.length === 0 && (
            <p className="mt-12 rounded-lg bg-gray-50 p-4 text-gray-700">{t('empty')}</p>
          )}

          {state === 'ready' &&
            domains.map((domain) => (
              <section key={domain.id} id={domain.slug} className="mt-12 scroll-mt-28">
                <SectionTitle title={localized(domain.name, locale)} />
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {domain.partners.map((partner) => (
                    <PartnerCard key={`${domain.id}-${partner.id}`} partner={partner} locale={locale} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      </section>

      <CtaBand title={t('cta.title')} buttonLabel={t('cta.button')} href={`/${locale}/contact`} variant="solid" />
    </div>
  );
}
