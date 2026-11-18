'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Users, ShieldCheck, Timer, GraduationCap, type LucideIcon } from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SectionTitle } from '@/components/layout/SectionTitle';

const COMMITMENTS: { key: 'listening' | 'quality' | 'followUp' | 'training'; icon: LucideIcon }[] = [
  { key: 'listening', icon: Users },
  { key: 'quality', icon: ShieldCheck },
  { key: 'followUp', icon: Timer },
  { key: 'training', icon: GraduationCap },
];

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <SectionTitle title={title} />
      <p className="mt-5 text-base lg:text-lg leading-relaxed text-gray-800">{text}</p>
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');
  const tNav = useTranslations('navigation');
  const locale = useHydrationSafeLocale('fr');

  return (
    <div className="flex flex-col bg-white">
      <PageHeader
        accent
        title={t('header.title')}
        breadcrumb={[{ label: tNav('home'), href: `/${locale}` }, { label: t('header.breadcrumb') }]}
      />

      {/* Intro: kicker, headline, who we are + photo */}
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-sm lg:text-base font-bold tracking-wide text-[#E3040D]">{t('kicker')}</p>
          <h2 className="mt-2 max-w-3xl text-3xl lg:text-4xl font-bold leading-tight text-[#00007C]">
            {t('headline')}
          </h2>
          <span aria-hidden="true" className="mt-4 block h-1 w-16 rounded-full bg-[#E3040D]" />

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
            <div className="lg:pt-4">
              <h3 className="text-2xl lg:text-3xl font-bold text-[#00007C]">{t('who.title')}</h3>
              <p className="mt-5 text-base lg:text-lg leading-relaxed text-gray-800">{t('who.p1')}</p>
              <p className="mt-5 text-base lg:text-lg leading-relaxed text-gray-800">{t('who.p2')}</p>
            </div>
            <figure>
              <div className="overflow-hidden rounded-lg shadow-sm">
                <Image
                  src="/images/about/accueil-kitmed.jpg"
                  alt={t('who.imageAlt')}
                  width={1600}
                  height={900}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* Expertise / long-term support */}
      <section className="pb-10 lg:pb-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-gray-300">
            <div className="md:pr-10">
              <TextBlock title={t('expertise.title')} text={t('expertise.text')} />
            </div>
            <div className="md:pl-10">
              <TextBlock title={t('longTerm.title')} text={t('longTerm.text')} />
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="px-4 lg:px-5">
        <div className="mx-auto max-w-[1440px] rounded-2xl bg-[#DBEEFD] px-4 py-8 lg:px-8 lg:py-10">
          <div className="container mx-auto px-0 lg:px-4">
            <SectionTitle title={t('commitments.title')} align="center" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {COMMITMENTS.map(({ key, icon: Icon }) => (
                <div key={key} className="rounded-xl bg-white p-6 text-center shadow-sm">
                  <Icon className="mx-auto h-12 w-12 text-[#00007C]" strokeWidth={1.6} aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-[#00007C]">{t(`commitments.${key}.title`)}</h3>
                  <p className="mt-2 text-sm lg:text-base leading-snug text-gray-800">{t(`commitments.${key}.text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Teams / ambition */}
      <section className="py-10 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-gray-300">
            <div className="md:pr-10">
              <TextBlock title={t('teams.title')} text={t('teams.text')} />
            </div>
            <div className="md:pl-10">
              <TextBlock title={t('ambition.title')} text={t('ambition.text')} />
            </div>
          </div>
        </div>
      </section>

      <CtaBand title={t('cta.title')} buttonLabel={t('cta.button')} href={`/${locale}/contact`} variant="solid" />
    </div>
  );
}
