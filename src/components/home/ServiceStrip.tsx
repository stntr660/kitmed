import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, Users, Settings } from 'lucide-react';

/** 3 shortcuts under the hero: catalogues, advice, after-sales. */
export function ServiceStrip({ locale }: { locale: string }) {
  const t = useTranslations('homePage.strip');
  const items = [
    { icon: BookOpen, label: t('catalogues'), href: `/${locale}/catalogues` },
    { icon: Users, label: t('advice'), href: `/${locale}/contact` },
    { icon: Settings, label: t('sav'), href: `/${locale}/sav` },
  ];

  return (
    <div className="container mx-auto px-4 lg:px-8">
      <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-xl border border-[#D5E8FA] bg-gradient-to-r from-[#E4F2FD] to-[#F1F8FF] shadow-sm sm:grid-cols-3">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-center gap-3 px-4 py-4 text-sm font-semibold text-[#10146B] transition-colors hover:text-accent ${i > 0 ? 'border-t border-[#C9DDF2] sm:border-l sm:border-t-0' : ''}`}
          >
            <item.icon className="h-6 w-6 flex-shrink-0 text-[#10146B] group-hover:text-accent" strokeWidth={1.6} />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
