'use client';

import { useState, type FormEvent, type ReactNode, type SVGProps } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  User,
  Building2,
  Phone,
  Mail,
  Layers,
  Barcode,
  FileEdit,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';

const NAVY = '#10146B';
const TEAL = '#16B3A3';

const EMPTY = { name: '', establishment: '', phone: '', email: '', equipment: '', serial: '', description: '' };
type Field = keyof typeof EMPTY;

// Equipment families offered in the « Équipement concerné » select. The translated label is what gets sent.
const EQUIPMENT_OPTIONS = ['slitLamp', 'oct', 'refraction', 'laser', 'microscope', 'biometry', 'furniture', 'other'] as const;

// Prefix used in the contact submission subject so SAV requests stand out in the admin inbox.
const SAV_SUBJECT_PREFIX = '[SAV]';

/* ---------- Service icons (navy line + teal accent, as in the mockup) ---------- */

const GEAR =
  'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z';

const svgBase: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function InstallationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      {/* screwdriver: navy shaft, teal handle */}
      <path d="M20.8 3.2l-.6 1.6-8.2 8.2-1-1 8.2-8.2z" stroke={NAVY} strokeWidth={1.3} />
      <path d="M11.4 12.6l-1.4-1.4-7 7a1 1 0 0 0 0 1.4l.6.6a1 1 0 0 0 1.4 0z" stroke={TEAL} strokeWidth={1.5} />
      {/* wrench, mirrored */}
      <g transform="translate(24 0) scale(-1 1)">
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          stroke={NAVY}
          strokeWidth={1.4}
        />
      </g>
    </svg>
  );
}

function CommissioningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <path d={GEAR} stroke={NAVY} strokeWidth={1.3} />
      <circle cx="12" cy="12" r="4.4" fill={TEAL} />
      <path d="m9.9 12.1 1.5 1.5 2.8-2.9" stroke="#fff" strokeWidth={1.4} />
    </svg>
  );
}

function TrainingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <path d="M2 9.5l10-5 10 5-10 5z" stroke={NAVY} strokeWidth={1.3} />
      <path d="M6 11.5v5c3 2.4 9 2.4 12 0v-5" stroke={NAVY} strokeWidth={1.3} />
      <path d="M21 10v5" stroke={NAVY} strokeWidth={1.3} />
      <circle cx="21" cy="16" r="0.9" fill={NAVY} />
    </svg>
  );
}

function MaintenanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke={NAVY} strokeWidth={1.3} />
      <path d="M21 3v5h-5" stroke={NAVY} strokeWidth={1.3} />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke={NAVY} strokeWidth={1.3} />
      <path d="M8 16H3v5" stroke={NAVY} strokeWidth={1.3} />
      <g transform="translate(12 12) scale(0.42) translate(-12 -12)">
        <path d={GEAR} fill={TEAL} stroke={TEAL} strokeWidth={1.5} />
        <circle cx="12" cy="12" r="3.4" fill="#fff" />
      </g>
    </svg>
  );
}

function FormHeaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgBase} {...props}>
      <rect x="2.5" y="4" width="18" height="17" rx="2.2" stroke={TEAL} strokeWidth={1.4} />
      <path d="M2.5 9h18M7.5 2.5v3M15.5 2.5v3" stroke={TEAL} strokeWidth={1.4} />
      <path d="M6 12.5h5M6 15.5h3.5M6 18h3" stroke={NAVY} strokeWidth={1.2} />
      <path d="M13 13h3.5" stroke={NAVY} strokeWidth={1.2} />
      <path d="M20.6 12.4a1.3 1.3 0 0 1 1.9 1.9l-5.6 5.6-2.6.7.7-2.6z" fill="#fff" stroke={NAVY} strokeWidth={1.2} />
    </svg>
  );
}

const SERVICES = [
  { key: 'installation', Icon: InstallationIcon },
  { key: 'commissioning', Icon: CommissioningIcon },
  { key: 'training', Icon: TrainingIcon },
  { key: 'maintenance', Icon: MaintenanceIcon },
] as const;

const fieldBase =
  'block w-full rounded-lg border border-[#C9D3E3] bg-white text-[15px] text-[#10146B] placeholder:text-[#3B4256] transition-colors focus:border-[#0B5CAD] focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]/20';

function IconField({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10146B]">{icon}</span>
      {children}
    </div>
  );
}

export default function SavPage() {
  const t = useTranslations('sav');
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
    <label htmlFor={`sav-${field}`} className="mb-1.5 block text-[15px] font-semibold leading-tight text-[#10146B] lg:text-base">
      {t(`form.${field}`)}
      {required ? <span className="text-accent"> *</span> : <span> ({t('form.optional')})</span>}
    </label>
  );

  const iconCls = 'h-5 w-5';

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#F1F6FC] via-[#F4F8FD] to-[#EEF4FB]">
      {/* Bottom-left blue wave */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-[90px] w-[90%] lg:h-[135px] lg:w-[48%]"
        viewBox="0 0 700 135"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sav-wave-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4FB8E8" />
            <stop offset="1" stopColor="#0B5CAD" />
          </linearGradient>
          <linearGradient id="sav-wave-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#BFE6F7" />
            <stop offset="1" stopColor="#7CC7EC" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M0 10 C 200 25, 420 95, 700 135 L0 135Z" fill="url(#sav-wave-b)" opacity="0.7" />
        <path d="M0 42 C 210 50, 420 110, 640 135 L0 135Z" fill="url(#sav-wave-a)" />
        <path d="M0 30 C 210 38, 430 102, 690 135" fill="none" stroke="#fff" strokeWidth="5" opacity="0.9" />
      </svg>

      {/* Hero photo (desktop: right side, fading into the background) */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-[272px] w-[50%] lg:block">
        <Image
          src="/images/sav/sav-hero-technicien.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,#000_16%)]"
        />
      </div>

      <div className="container relative mx-auto px-4 pb-24 pt-8 lg:px-8 lg:pb-[90px] lg:pt-10">
        {/* Hero */}
        <header className="lg:min-h-[232px] lg:max-w-[54%]">
          <div className="relative pl-5 lg:pl-9">
            <span className="absolute left-0 top-1 h-14 w-1.5 rounded-full bg-[#16B3A3] lg:h-[78px]" aria-hidden="true" />
            <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#10146B] sm:text-4xl lg:text-[44px] lg:leading-[1.1] xl:text-[50px]">
              {t('hero.title')}
            </h1>
            <p className="mt-3 max-w-[560px] text-base leading-relaxed text-[#10146B] lg:mt-4 lg:text-[21px]">
              {t('hero.subtitle')}
            </p>
            <span className="mt-5 block h-1.5 w-24 rounded-full bg-[#16B3A3] lg:mt-6" aria-hidden="true" />
          </div>
        </header>

        {/* Hero photo (mobile / tablet) */}
        <div className="relative mt-6 h-48 overflow-hidden rounded-2xl sm:h-64 lg:hidden">
          <Image
            src="/images/sav/sav-hero-technicien.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[62%_center]"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:mt-0 lg:grid-cols-[minmax(0,455fr)_minmax(0,863fr)] lg:gap-9">
          {/* Services */}
          <ul className="order-2 grid grid-cols-2 gap-4 self-start lg:order-1 lg:mt-[22px] lg:gap-5">
            {SERVICES.map(({ key, Icon }) => (
              <li
                key={key}
                className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#E4EEF9]/90 px-3 py-5 text-center shadow-[0_1px_2px_rgba(16,20,107,0.04)] lg:min-h-[174px] lg:gap-4 [&:nth-child(n+3)]:lg:min-h-[192px]"
              >
                <Icon className="h-14 w-14 lg:h-[84px] lg:w-[84px]" />
                <span className="text-base font-bold leading-snug text-[#10146B] lg:text-[21px]">{t(`services.${key}`)}</span>
              </li>
            ))}
          </ul>

          {/* Request form */}
          <div className="order-1 rounded-[22px] bg-white p-5 shadow-[0_10px_40px_-12px_rgba(16,20,107,0.18)] ring-1 ring-[#E3EAF4] sm:p-7 lg:order-2 lg:px-8 lg:pb-5 lg:pt-4">
            <div className="flex items-center gap-4">
              <FormHeaderIcon className="h-11 w-11 shrink-0 lg:h-[52px] lg:w-[52px]" />
              <h2 className="text-[22px] font-bold leading-tight text-[#10146B] lg:text-[31px]">{t('form.title')}</h2>
            </div>

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
                      className="mt-3 text-sm font-medium text-[#10146B] underline underline-offset-2"
                    >
                      {t('form.newRequest')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
                <div className="grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
                  <div>
                    {label('name')}
                    <IconField icon={<User className={iconCls} strokeWidth={1.8} />}>
                      <input id="sav-name" required autoComplete="name" placeholder={t('form.namePlaceholder')} value={form.name} onChange={set('name')} className={`${fieldBase} h-[38px] pl-12 pr-3`} />
                    </IconField>
                  </div>
                  <div>
                    {label('establishment')}
                    <IconField icon={<Building2 className={iconCls} strokeWidth={1.8} />}>
                      <input id="sav-establishment" required autoComplete="organization" placeholder={t('form.establishmentPlaceholder')} value={form.establishment} onChange={set('establishment')} className={`${fieldBase} h-[38px] pl-12 pr-3`} />
                    </IconField>
                  </div>
                  <div>
                    {label('phone')}
                    <IconField icon={<Phone className={iconCls} strokeWidth={1.8} />}>
                      <input id="sav-phone" type="tel" required autoComplete="tel" placeholder={t('form.phonePlaceholder')} value={form.phone} onChange={set('phone')} className={`${fieldBase} h-[38px] pl-12 pr-3`} />
                    </IconField>
                  </div>
                  <div>
                    {label('email')}
                    <IconField icon={<Mail className={iconCls} strokeWidth={1.8} />}>
                      <input id="sav-email" type="email" required autoComplete="email" placeholder={t('form.emailPlaceholder')} value={form.email} onChange={set('email')} className={`${fieldBase} h-[38px] pl-12 pr-3`} />
                    </IconField>
                  </div>
                  <div>
                    {label('equipment')}
                    <IconField icon={<Layers className={iconCls} strokeWidth={1.8} />}>
                      <select
                        id="sav-equipment"
                        required
                        value={form.equipment}
                        onChange={set('equipment')}
                        className={`${fieldBase} h-[38px] cursor-pointer appearance-none pl-12 pr-10 ${form.equipment ? '' : 'text-[#3B4256]'}`}
                      >
                        <option value="" disabled>
                          {t('form.equipmentPlaceholder')}
                        </option>
                        {EQUIPMENT_OPTIONS.map((key) => {
                          const optionLabel = t(`form.equipmentOptions.${key}`);
                          return (
                            <option key={key} value={optionLabel} className="text-[#10146B]">
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#10146B]" strokeWidth={2.2} aria-hidden="true" />
                    </IconField>
                  </div>
                  <div>
                    {label('serial', false)}
                    <IconField icon={<Barcode className={iconCls} strokeWidth={1.8} />}>
                      <input id="sav-serial" placeholder={t('form.serialPlaceholder')} value={form.serial} onChange={set('serial')} className={`${fieldBase} h-[38px] pl-12 pr-3`} />
                    </IconField>
                  </div>
                </div>
                <div>
                  {label('description')}
                  <div className="relative">
                    <FileEdit className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#10146B]" strokeWidth={1.8} aria-hidden="true" />
                    <textarea
                      id="sav-description"
                      required
                      rows={3}
                      placeholder={t('form.descriptionPlaceholder')}
                      value={form.description}
                      onChange={set('description')}
                      className={`${fieldBase} min-h-[90px] resize-y py-2.5 pl-14 pr-4 leading-snug`}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{errorText || t('form.error')}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between lg:pt-3">
                  <p className="text-[15px] text-[#1F2433]">
                    <span className="text-accent">*</span> {t('form.required')}
                  </p>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex h-[54px] items-center justify-center gap-4 rounded-xl bg-[#10146B] px-10 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#0A0EA4] disabled:opacity-60 lg:h-[60px] lg:min-w-[340px] lg:text-xl"
                  >
                    {status === 'sending' ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                    )}
                    {status === 'sending' ? t('form.sending') : t('form.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
