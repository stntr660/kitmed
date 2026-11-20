import { useTranslations } from 'next-intl';
import { DomainTile, DOMAIN_GRID } from '@/components/products/DomainTile';

/**
 * The 8 domains of the client mockup (2026-11-16), in its order; photos cropped from the mockup.
 * « Orthoptie » opens its own category (scripts 93 + 121; sold without a manufacturer brand).
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
      <div className={`mx-auto mt-8 ${DOMAIN_GRID}`}>
        {DOMAINS.map(d => (
          <DomainTile
            key={d.key}
            href={`/${locale}/products/categories/${d.slug}`}
            title={t(d.key)}
            imageUrl={`/images/home/expertise-${d.key}.jpg`}
            linkLabel={t('viewProducts')}
          />
        ))}
      </div>
    </section>
  );
}
