import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';

/**
 * The 8 domains of the client mockup (2026-11-16), in its order; photos cropped from the mockup.
 * « Orthoptie » opens its own category (MC2 range, scripts/catalog-restructure/93-orthoptie-mc2.js).
 */
const DOMAINS = [
  { key: 'ophtalmologie', slug: 'ophtalmologie' },
  { key: 'orthoptie', slug: 'orthoptie' },
  { key: 'orl', slug: 'orl-oto-rhino-laryngologie' },
  { key: 'pharma', slug: 'dispositifs-medicaux' },
  { key: 'contactologie', slug: 'oph-contactology' },
  { key: 'literie', slug: 'mobilier-et-literie-hospitaliers' },
  { key: 'drapage', slug: 'drapage' },
  { key: 'orthopedie', slug: 'orthopedics' },
] as const;

export function ExpertiseGrid({ locale }: { locale: string }) {
  const t = useTranslations('homePage.expertise');

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-14 lg:px-[34px]">
      <h2 className="text-center text-[26px] font-bold leading-tight tracking-[-0.01em] text-[#0A0EA4] sm:text-[34px] lg:text-[42px] lg:leading-[56px] xl:text-[49px]">{t('title')}</h2>
      <span aria-hidden="true" className="mx-auto mt-2 block h-[4px] w-20 rounded-full bg-[#D7191A] lg:mt-[11px] lg:h-[5px] lg:w-[112px]" />
      <p className="mt-4 text-center text-[#10146B] lg:mt-5 lg:text-[21px]">{t('subtitle')}</p>
      <div className="mx-auto mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map(d => {
          const href = `/${locale}/products/categories/${d.slug}`;
          return (
            <Link key={d.key} href={href} className="group text-center">
              <div className="aspect-[3/2] overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                <img
                  src={`/images/home/expertise-${d.key}.jpg`}
                  alt={t(d.key)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold uppercase text-[#10146B] xl:text-[22px]">{t(d.key)}</h3>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#0B5CAD] group-hover:text-accent xl:text-[18px]">
                {t('viewProducts')}
                <ChevronRight className="h-4 w-4 text-accent" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
