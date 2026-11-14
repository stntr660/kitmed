'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Wrench, PlugZap, GraduationCap, Settings, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { PageHeader } from '@/components/layout/PageHeader';
import { CtaBand } from '@/components/layout/CtaBand';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const SERVICES = [
  { key: 'installation', icon: Wrench },
  { key: 'commissioning', icon: PlugZap },
  { key: 'training', icon: GraduationCap },
  { key: 'maintenance', icon: Settings },
] as const;

const EMPTY = { name: '', establishment: '', phone: '', email: '', equipment: '', serial: '', description: '' };
type Field = keyof typeof EMPTY;

// Prefix used in the contact submission subject so SAV requests stand out in the admin inbox.
const SAV_SUBJECT_PREFIX = '[SAV]';

export default function SavPage() {
  const t = useTranslations('sav');
  const tNav = useTranslations('navigation');
  const locale = useHydrationSafeLocale('fr');
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const set = (field: Field) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorText('');

    const fullName = form.name.trim().replace(/\s+/g, ' ');
    const space = fullName.indexOf(' ');
    const firstName = space > 0 ? fullName.slice(0, space) : fullName;
    const lastName = space > 0 ? fullName.slice(space + 1) : '-';

    const message = [
      'Demande SAV',
      `Établissement : ${form.establishment.trim()}`,
      `Équipement / marque : ${form.equipment.trim()}`,
      `Numéro de série : ${form.serial.trim() || 'non renseigné'}`,
      '',
      'Description :',
      form.description.trim(),
    ].join('\n');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.establishment.trim(),
          subject: `${SAV_SUBJECT_PREFIX} ${form.equipment.trim()}`,
          message,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorText(json?.error === 'INVALID_EMAIL' ? t('form.invalidEmail') : '');
        setStatus('error');
        return;
      }
      setForm(EMPTY);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const label = (field: Field, required = true) => (
    <label htmlFor={`sav-${field}`} className="mb-1.5 block text-sm font-medium text-gray-800">
      {t(`form.${field}`)}
      {required ? <span className="text-[#E3040D]"> *</span> : <span className="font-normal text-gray-500"> ({t('form.optional')})</span>}
    </label>
  );

  return (
    <div className="flex flex-col bg-white">
      <PageHeader
        title={t('header.title')}
        breadcrumb={[{ label: tNav('home'), href: `/${locale}` }, { label: t('header.breadcrumb') }]}
      />

      <section className="py-10 lg:py-14">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[2fr_3fr] lg:px-8">
          <div>
            <p className="text-sm lg:text-base font-bold tracking-wide text-[#E3040D]">{t('kicker')}</p>
            <div className="mt-2">
              <SectionTitle title={t('title')} />
            </div>
            <p className="mt-5 text-base lg:text-lg leading-relaxed text-gray-800">{t('intro')}</p>
            <ul className="mt-8 grid grid-cols-2 gap-4">
              {SERVICES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-center gap-3 rounded-xl bg-[#DBEEFD] p-4">
                  <Icon className="h-7 w-7 shrink-0 text-[#00007C]" strokeWidth={1.7} aria-hidden="true" />
                  <span className="font-semibold text-[#00007C]">{t(`services.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl lg:text-2xl font-bold text-[#00007C]">{t('form.title')}</h2>

            {status === 'success' ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5" role="status">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-green-900">{t('form.successTitle')}</p>
                    <p className="mt-1 text-green-800">{t('form.success')}</p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="mt-3 text-sm font-medium text-[#00007C] underline underline-offset-2"
                    >
                      {t('form.newRequest')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    {label('name')}
                    <Input id="sav-name" required autoComplete="name" value={form.name} onChange={set('name')} />
                  </div>
                  <div>
                    {label('establishment')}
                    <Input id="sav-establishment" required autoComplete="organization" value={form.establishment} onChange={set('establishment')} />
                  </div>
                  <div>
                    {label('phone')}
                    <Input id="sav-phone" type="tel" required autoComplete="tel" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div>
                    {label('email')}
                    <Input id="sav-email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
                  </div>
                  <div>
                    {label('equipment')}
                    <Input id="sav-equipment" required value={form.equipment} onChange={set('equipment')} />
                  </div>
                  <div>
                    {label('serial', false)}
                    <Input id="sav-serial" value={form.serial} onChange={set('serial')} />
                  </div>
                </div>
                <div>
                  {label('description')}
                  <Textarea
                    id="sav-description"
                    required
                    rows={5}
                    placeholder={t('form.descriptionPlaceholder')}
                    value={form.description}
                    onChange={set('description')}
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{errorText || t('form.error')}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500">
                    <span className="text-[#E3040D]">*</span> {t('form.required')}
                  </p>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#E3040D] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#B9030B] disabled:opacity-60"
                  >
                    {status === 'sending' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                    {status === 'sending' ? t('form.sending') : t('form.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <CtaBand title={t('cta.title')} buttonLabel={t('cta.button')} href={`/${locale}/contact`} />
    </div>
  );
}
