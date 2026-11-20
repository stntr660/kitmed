'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { cn } from '@/lib/utils';
import { DOMAIN_PHOTOS, PRODUCT_DOMAINS } from '@/components/products/productDomains';
import { SoftWaveBackground } from '@/components/layout/SoftWaveBackground';

interface Partner {
  id: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  isFeatured: boolean;
  name: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  productCount?: number;
}

// Category filter tiles: one photo per domain, cropped from the owner's mockup
// (public/images/products/domaine-<slug>.jpg); other categories fall back to their own image.
const photoFor = (category: Category) => DOMAIN_PHOTOS[category.slug] ?? category.imageUrl ?? null;

// The mockup domains first, in the mockup's order; any other category after them.
const DOMAIN_ORDER: string[] = PRODUCT_DOMAINS.map((d) => d.slug);
const orderedCategories = (list: Category[]) =>
  [...list].sort((a, b) => {
    const ia = DOMAIN_ORDER.indexOf(a.slug);
    const ib = DOMAIN_ORDER.indexOf(b.slug);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

// Fades the hero photo's edges into the background (left edge most, like the mockup).
const HERO_FADE_LAYERS =
  'linear-gradient(to right, transparent 0%, #000 15%), linear-gradient(to bottom, transparent 0%, #000 10%, #000 86%, transparent 100%)';
const HERO_PHOTO_FADE: CSSProperties = {
  maskImage: HERO_FADE_LAYERS,
  WebkitMaskImage: HERO_FADE_LAYERS,
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
};

/** « ORL (Oto-Rhino-Laryngologie) »: as in the mockup, the part in brackets is set in regular weight. */
function DomainLabel({ label }: { label: string }) {
  const i = label.indexOf(' (');
  if (i < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, i)}
      <span className="block font-normal">{label.slice(i + 1)}</span>
    </>
  );
}

export default function PartnersPage() {
  const t = useTranslations('partners');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?locale=${locale}&includeProductCount=true&excludeZeroProducts=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, [locale]);

  // Fetch partners when category changes
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const url = selectedCategory
          ? `/api/partners?categorySlug=${selectedCategory}`
          : '/api/partners';
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch partners');
        }

        const data = await response.json();

        if (data.success) {
          setPartners(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load partners');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [selectedCategory]);

  const getPartnerName = (partner: Partner) => {
    return partner.name[locale as keyof typeof partner.name] || partner.name.fr || partner.name.en;
  };

  if (error) {
    return (
      <div className="flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{tCommon('error')}</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero (owner mockup 2026-11-17): light-blue background with soft waves + product composition photo */}
      <section className="relative isolate overflow-hidden">
        <SoftWaveBackground />
        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-6 px-4 pb-6 pt-8 sm:pb-14 sm:pt-10 lg:grid-cols-[1fr_minmax(0,47%)] lg:gap-0 lg:px-[34px] lg:pb-10 lg:pt-6 xl:pl-[78px]">
          <div className="relative z-10 lg:py-10">
            <h1 className="max-w-[720px] text-[28px] font-bold leading-[1.18] tracking-[-0.01em] text-[#10146B] sm:text-[38px] lg:text-[42px] xl:w-[800px] xl:max-w-none xl:text-[46px]">
              {t('solutionsHero.title')}
            </h1>
            <span aria-hidden="true" className="mt-5 block h-[5px] w-[100px] rounded-full bg-[#10146B] lg:mt-8" />
            <p className="mt-5 max-w-[600px] text-[17px] leading-[1.45] text-[#2A2F45] sm:text-[20px] lg:mt-7 xl:text-[26px]">
              {t('solutionsHero.description')}
            </p>
          </div>
          <div className="relative -mx-4 sm:mx-0 lg:-ml-24 lg:-mr-[34px]">
            <img
              src="/images/products/partenaires-hero-2026-11-20.jpg"
              alt={t('solutionsHero.imageAlt')}
              width={1483}
              height={1061}
              className="block h-auto w-full"
              style={HERO_PHOTO_FADE}
            />
          </div>
        </div>
      </section>

      {/* Domain photo tiles = category filter (clicking the selected one again shows all partners) */}
      {categories.length > 0 && (
        <section aria-label={t('solutionsHero.domainsLabel')} className="bg-[#F4F8FE]">
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-6 lg:px-[34px] lg:pb-14 lg:pt-2">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-7 lg:flex-nowrap lg:gap-x-6">
              {orderedCategories(categories).map((category) => {
                const selected = selectedCategory === category.slug;
                const photo = photoFor(category);
                return (
                  <li
                    key={category.id}
                    className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-auto lg:min-w-0 lg:flex-1"
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedCategory((prev) => (prev === category.slug ? null : category.slug))}
                      className="group block w-full text-center"
                    >
                      <div
                        className={cn(
                          'aspect-[161/153] overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(16,20,107,0.10)] transition',
                          selected && 'ring-4 ring-[#0B5CAD] ring-offset-2 ring-offset-[#F4F8FE]'
                        )}
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-white">
                            <Building2 aria-hidden className="h-12 w-12 text-primary" />
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-3 block text-[16px] font-bold leading-tight group-hover:text-[#0B5CAD] sm:text-[18px] xl:mt-4 xl:text-[20px]',
                          selected ? 'text-[#0B5CAD]' : 'text-[#10146B]'
                        )}
                      >
                        <DomainLabel label={category.name} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Partners Grid */}
      <section id="partners-grid" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : partners.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <Link key={partner.id} href={`/${locale}/partners/${partner.slug}${selectedCategory ? `?category=${selectedCategory}` : ''}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                      <CardContent className="p-5 flex items-center gap-4">
                        {partner.logoUrl ? (
                          <img
                            src={partner.logoUrl}
                            alt={getPartnerName(partner)}
                            className="h-12 w-32 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-32 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {getPartnerName(partner)}
                            </h3>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategory ? t('noPartnersInCategory') : t('noPartners.title')}
                </h3>
                <p className="text-gray-600">
                  {selectedCategory ? t('noPartnersInCategoryDescription') : t('noPartners.description')}
                </p>
                {selectedCategory && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSelectedCategory(null)}
                  >
                    {t('viewAllPartners')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
