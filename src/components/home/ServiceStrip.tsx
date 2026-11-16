import { Fragment } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, Users, Settings } from 'lucide-react';

/**
 * 3 shortcuts under the hero: catalogues, advice, after-sales.
 * Mockup (1440px): 45px side inset, 12px under the hero, 83px tall, glossy light-blue
 * gradient (pale top, bluer bottom third), short grey-blue dividers between items.
 */
export function ServiceStrip({ locale }: { locale: string }) {
  const t = useTranslations('homePage.strip');
  const items = [
    { icon: BookOpen, label: t('catalogues'), href: `/${locale}/catalogues` },
    { icon: Users, label: t('advice'), href: `/${locale}/contact` },
    { icon: Settings, label: t('sav'), href: `/${locale}/sav` },
  ];

  return (
    <div className="px-4 lg:px-[min(3.125vw,45px)]">
      <div className="mx-auto mt-3 flex max-w-[1350px] flex-col overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,#EDF7FC_0%,#F3FBFF_55%,#DDF0FE_62%,#D1EAFB_70%,#CDE7F9_100%)] shadow-[0_2px_8px_rgba(0,60,140,0.10)] ring-1 ring-[#DCEBF8] lg:h-[min(5.76vw,83px)] lg:flex-row lg:items-center lg:justify-between lg:pl-[6.5%] lg:pr-[4.6%]">
        {items.map((item, i) => (
          <Fragment key={item.href}>
            {i > 0 && (
              <span aria-hidden="true" className="hidden h-[37px] w-px flex-shrink-0 bg-[#9AB0CB] lg:block" />
            )}
            <Link
              href={item.href}
              className={`group flex items-center justify-center gap-3 px-4 py-3 text-[16px] font-bold tracking-[-0.015em] text-[#16198A] transition-colors hover:text-accent lg:px-0 lg:py-0 lg:gap-[min(2.1vw,30px)] lg:text-[min(1.42vw,20.5px)] ${i > 0 ? 'border-t border-[#C9DDF2] lg:border-t-0' : ''}`}
            >
              <item.icon
                className="h-8 w-8 flex-shrink-0 text-[#16198A] group-hover:text-accent lg:h-[min(3.6vw,52px)] lg:w-[min(3.6vw,52px)]"
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
