'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2 } from 'lucide-react';

// pdf.js + page-flip are only fetched on this page (separate chunk, client only).
const BrochureFlipbook = dynamic(() => import('@/components/brochure/BrochureFlipbook'), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

function ViewerLoading() {
  const t = useTranslations('brochureViewer');
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-600" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-[#0B5CAD]" aria-hidden="true" />
      {t('loading')}
    </div>
  );
}

interface Props {
  locale: string;
  file: string;
  title: string;
  returnPath: string | null;
}

export default function BrochurePageClient({ locale, file, title, returnPath }: Props) {
  const t = useTranslations('brochureViewer');
  const backHref = returnPath || `/${locale}/catalogues`;
  const backLabel = returnPath
    ? returnPath.includes('/products/')
      ? t('backToProduct')
      : returnPath.includes('/catalogues')
        ? t('backToCatalogues')
        : t('back')
    : t('backToCatalogues');

  return (
    <div className="bg-[#F4F6FC]">
      <div className="container mx-auto px-4 pb-10 pt-6 lg:px-8 lg:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0B5CAD] hover:text-[#0A0EA4] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{t('eyebrow')}</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-[#10146B] sm:text-3xl">{title || t('title')}</h1>
          </div>
          <p className="hidden text-sm text-slate-500 md:block">{t('hint')}</p>
        </div>

        <div className="mt-6">
          <BrochureFlipbook file={file} locale={locale} />
        </div>
      </div>
    </div>
  );
}
