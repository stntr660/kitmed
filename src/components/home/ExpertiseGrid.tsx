import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { SectionTitle } from '@/components/layout/SectionTitle';

/** The 7 domains of the mockup, in its order; photos cropped from the mockup. */
const DOMAINS = [
  { key: 'ophtalmologie', slug: 'ophtalmologie' },
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
    <section className="container mx-auto px-4 py-14 lg:px-8">
      <SectionTitle title={t('title')} align="center" />
      <p className="mt-4 text-center text-[#10146B]">{t('subtitle')}</p>
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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
              <h3 className="mt-4 text-lg font-bold uppercase text-[#10146B]">{t(d.key)}</h3>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#0B5CAD] group-hover:text-accent">
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
