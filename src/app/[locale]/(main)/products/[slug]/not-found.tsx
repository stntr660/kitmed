'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Unknown or inactive product: same « not found » screen as before, now with a real 404 status.
export default function ProductNotFound() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('products.detail');
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">{t('notFound')}</h1>
        <Button asChild>
          <Link href={`/${locale}/products/disciplines`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToCatalog')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
