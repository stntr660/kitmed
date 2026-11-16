'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CtaBand } from '@/components/layout/CtaBand';
import { CataloguesExplorer } from '@/components/catalogues/CataloguesExplorer';

export default function CataloguesPage() {
  const t = useTranslations('catalogues');
  const locale = useHydrationSafeLocale('fr');

  return (
    <div className="flex flex-col bg-white">
      {/* useSearchParams (shareable ?domaine=&marque=&q= filters) needs a Suspense boundary. */}
      <Suspense
        fallback={
          <div className="container mx-auto flex items-center gap-3 px-4 py-16 text-slate-600 lg:px-8" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {t('loading')}
          </div>
        }
      >
        <CataloguesExplorer locale={locale} />
      </Suspense>

      <CtaBand title={t('cta.title')} buttonLabel={t('cta.button')} href={`/${locale}/contact`} variant="solid" />
    </div>
  );
}
