'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  User,
  Building2,
  Phone,
  Mail,
  LayoutGrid,
  Tag,
  MessagesSquare,
  Send,
  ChevronDown,
  FileEdit,
  Search,
  CheckCircle2,
  CheckCircle,
  ArrowRight,
  Award,
  Users,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const NAVY = '#10146B';

// Top-level catalogue categories (labels in rfp.page.categories.*)
const CATEGORY_KEYS = [
  'ophtalmologie',
  'orthoptie',
  'orl',
  'literie',
  'orthopedie',
  'dispositifs',
  'drapage',
] as const;

type FormState = {
  name: string;
  company: string;
  phone: string;
  email: string;
  category: string;
  product: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  company: '',
  phone: '',
  email: '',
  category: '',
  product: '',
  message: '',
};

const REQUIRED: (keyof FormState)[] = ['name', 'company', 'phone', 'email', 'category', 'message'];

const fieldBase =
  'block w-full rounded-[10px] border bg-white pl-10 pr-3 text-[13.5px] text-[#10146B] placeholder:text-[#4A5578] focus:outline-none focus:border-[#0B5CAD] focus:ring-2 focus:ring-[#0B5CAD]/20 transition-colors';

function Field({ icon, invalid, children }: { icon: ReactNode; invalid?: boolean; children: ReactNode }) {
  return (
    <div className={`relative ${invalid ? '[&_input]:border-accent-500 [&_select]:border-accent-500 [&_textarea]:border-accent-500' : ''}`}>
      <span className="pointer-events-none absolute left-3 top-[13px] text-[#10146B]">{icon}</span>
      {children}
    </div>
  );
}

/** Gold laurel wreath drawn around the "30 ans" badge. */
function Laurel({ className }: { className?: string }) {
  // Leaves placed along a circle (phi in degrees, SVG coordinates: 90 = bottom, 180 = left, 270 = top)
  const leaf = (phi: number, tilt: number, key: string) => {
    const rad = (phi * Math.PI) / 180;
    const x = 50 + 40 * Math.cos(rad);
    const y = 52 + 40 * Math.sin(rad);
    return (
      <ellipse key={key} cx={x} cy={y} rx={3.6} ry={8.5} transform={`rotate(${phi + tilt} ${x} ${y})`} fill="url(#rfp-laurel-gold)" />
    );
  };
  const left = Array.from({ length: 7 }, (_, i) => leaf(118 + i * 20, -28, `l${i}`));
  const right = Array.from({ length: 7 }, (_, i) => leaf(62 - i * 20, 28, `r${i}`));
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rfp-laurel-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E7C66A" />
          <stop offset="0.55" stopColor="#C49A2E" />
          <stop offset="1" stopColor="#9C7417" />
        </linearGradient>
      </defs>
      <path d="M44 92 A 40 40 0 0 1 22 22" fill="none" stroke="#C49A2E" strokeWidth="1.4" />
      <path d="M56 92 A 40 40 0 0 0 78 22" fill="none" stroke="#C49A2E" strokeWidth="1.4" />
      {left}
      {right}
      <circle cx="50" cy="94" r="2.2" fill="#C49A2E" />
    </svg>
  );
}

function RedSwoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 20" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 18 C 50 6, 120 1, 198 3 C 130 5, 60 10, 2 18 Z" fill="#ED1C24" />
    </svg>
  );
}

export default function NewRFPPage() {
  const t = useTranslations('rfp.page');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // reference number ('' when unknown)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const isMissing = (key: keyof FormState) => touched && REQUIRED.includes(key) && !form[key].trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (REQUIRED.some(k => !form[k].trim())) {
      setError(t('form.required'));
      return;
    }
    if (!emailValid) {
      setError(t('form.invalidEmail'));
      return;
    }

    const categoryLabel = t(`categories.${form.category}` as 'categories.ophtalmologie');
    const lines = [
      `${t('form.messageCategory')} : ${categoryLabel}`,
      form.product.trim() ? `${t('form.messageProduct')} : ${form.product.trim()}` : null,
      '',
      `${t('form.messageDetails')} :`,
      form.message.trim(),
    ].filter((l): l is string => l !== null);

    const payload = {
      customer_name: form.name.trim(),
      customer_email: form.email.trim(),
      customer_phone: form.phone.trim(),
      company_name: form.company.trim(),
      contact_person: form.name.trim(),
      message: lines.join('\n'),
      urgency_level: 'normal',
      preferred_contact_method: 'email',
      items: [],
    };

    setLoading(true);
    try {
      const response = await fetch('/api/rfp-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(t('form.sendError'));
      }
      setSuccess(result?.data?.reference_number ?? '');
      setForm(EMPTY_FORM);
      setTouched(false);
    } catch {
      setError(t('form.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: <FileEdit className="h-10 w-10 lg:h-12 lg:w-12" strokeWidth={1.7} />, title: t('how.step1Title'), text: t('how.step1Text') },
    { icon: <Search className="h-10 w-10 lg:h-12 lg:w-12" strokeWidth={1.9} />, title: t('how.step2Title'), text: t('how.step2Text') },
    { icon: <CheckCircle className="h-10 w-10 lg:h-12 lg:w-12" strokeWidth={1.9} />, title: t('how.step3Title'), text: t('how.step3Text') },
  ];

  const whyItems = [
    { icon: <Award className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10" strokeWidth={1.5} />, label: t('why.expertise') },
    { icon: <Users className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10" strokeWidth={1.5} />, label: t('why.support') },
    { icon: <Truck className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10" strokeWidth={1.5} />, label: t('why.delivery') },
    { icon: <ShieldCheck className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10" strokeWidth={1.5} />, label: t('why.sav') },
  ];

  return (
    <div className="relative flex flex-col overflow-hidden bg-white not-italic">
      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-b from-[#CFE1F5] via-[#E3EEF9] to-[#F3F7FC]">
        {/* soft white glow behind the text */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 45% 70% at 12% 45%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)' }}
        />

        {/* Building photo, desktop: centre column blending into the sky */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 top-6 hidden lg:block lg:left-[33%] lg:w-[28%] xl:left-[35%] xl:w-[25%]"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 16%, #000 90%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, #000 16%, #000 90%, transparent 100%)',
          }}
        >
          <div
            className="relative h-full w-full"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 82%, transparent 100%)',
            }}
          >
            <Image
              src="/images/home/band-building.jpg"
              alt=""
              fill
              priority
              sizes="40vw"
              className="object-cover object-[85%_0%]"
            />
          </div>
        </div>

        {/* Blue / red swoosh, bottom-left */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[50px] w-[70%] sm:h-[64px] lg:h-[78px] lg:w-[46%]"
          viewBox="0 0 700 110"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rfp-hero-blue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0B3F96" />
              <stop offset="0.55" stopColor="#0B5CAD" stopOpacity="0.9" />
              <stop offset="1" stopColor="#0B5CAD" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rfp-hero-red" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ED1C24" />
              <stop offset="0.7" stopColor="#ED1C24" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ED1C24" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 40 C 180 64, 420 92, 700 104 L 700 110 L 0 110 Z" fill="url(#rfp-hero-blue)" />
          <path d="M0 22 C 200 52, 440 84, 700 98 C 440 88, 200 66, 0 40 Z" fill="url(#rfp-hero-red)" />
          <path d="M0 6 C 220 40, 460 74, 700 92 C 460 80, 220 56, 0 18 Z" fill="#FFFFFF" opacity="0.85" />
        </svg>

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[44px] xl:px-[52px] pt-8 pb-12 lg:py-[22px] lg:pb-[26px]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_516px] lg:gap-8 items-start">
            {/* ---- Left: text ---- */}
            <div className="relative z-10 max-w-[470px] lg:max-w-[450px] lg:pt-[42px]">
              <div className="flex items-center gap-4">
                <span className="text-[13px] sm:text-[15px] lg:text-[17px] font-semibold uppercase tracking-[0.18em] text-[#10146B]">
                  {t('kicker')}
                </span>
                <span className="h-[2px] w-12 sm:w-[72px] bg-accent-500" aria-hidden="true" />
              </div>
              <h1 className="mt-3 text-[#10146B] leading-[1.08]">
                <span className="block text-[32px] sm:text-[40px] lg:text-[44px] font-normal">{t('titleLight')}</span>
                <span className="block text-[34px] sm:text-[42px] lg:text-[46px] font-bold">{t('titleBold')}</span>
              </h1>
              <p className="mt-5 text-[15px] sm:text-[17px] lg:text-[17.5px] leading-[1.5] text-[#10146B] not-italic">
                {t('intro')}
              </p>

              <div className="mt-6 lg:mt-7 flex items-center gap-4">
                <div className="relative h-[84px] w-[84px] sm:h-[96px] sm:w-[96px] shrink-0">
                  <Laurel className="absolute inset-0 h-full w-full" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#10146B] leading-none">
                    <span className="text-[26px] sm:text-[30px] font-bold tracking-tight">{t('badgeNumber')}</span>
                    <span className="text-[14px] sm:text-[16px] font-semibold -mt-0.5">{t('badgeUnit')}</span>
                  </div>
                </div>
                <span className="h-[52px] w-[2px] bg-accent-500" aria-hidden="true" />
                <div className="text-[#10146B]">
                  <p className="text-[16px] sm:text-[19px] font-semibold leading-tight">{t('badgeLine1')}</p>
                  <p className="text-[15px] sm:text-[18px] leading-tight mt-1">{t('badgeLine2')}</p>
                  <RedSwoosh className="mt-1 ml-10 h-[8px] w-[120px] sm:w-[140px]" />
                </div>
              </div>
            </div>

            {/* Building photo, mobile / tablet */}
            <div
              aria-hidden="true"
              className="relative -mx-4 sm:-mx-6 h-[240px] sm:h-[320px] lg:hidden"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 75%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 75%, transparent 100%)',
              }}
            >
              <Image
                src="/images/home/band-building.jpg"
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-[35%_0%]"
              />
            </div>

            {/* ---- Right: form card ---- */}
            <div
              id="rfp-form"
              className="relative z-10 -mt-16 sm:-mt-24 lg:mt-0 rounded-[20px] bg-white px-4 py-6 sm:px-6 lg:px-[22px] lg:pt-[22px] lg:pb-[22px] shadow-[0_14px_44px_rgba(16,20,107,0.14)]"
            >
              {success !== null ? (
                <div className="py-10 text-center" role="status">
                  <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
                  <h2 className="mb-3 text-2xl font-bold text-[#10146B]">{t('form.successTitle')}</h2>
                  <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-gray-600">{t('form.successMessage')}</p>
                  {success && (
                    <p className="mt-3 text-sm font-semibold text-[#0B5CAD]">{t('form.reference', { ref: success })}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuccess(null)}
                    className="mt-6 inline-flex items-center justify-center rounded-[10px] border border-[#0B5CAD] px-5 py-2.5 text-sm font-semibold text-[#0B5CAD] hover:bg-[#0B5CAD] hover:text-white transition-colors"
                  >
                    {t('form.sendAnother')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <Send className="mt-1 h-10 w-10 sm:h-12 sm:w-12 shrink-0 -rotate-12 text-[#0B3F96]" strokeWidth={1.6} fill="#0B3F96" />
                    <div>
                      <h2 className="text-[22px] sm:text-[26px] font-bold leading-tight text-[#10146B]">{t('form.title')}</h2>
                      <p className="mt-1 text-[13.5px] sm:text-[14px] leading-snug text-[#10146B]/85">{t('form.subtitle')}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-3.5 sm:gap-y-3">
                    <Field icon={<User className="h-[18px] w-[18px]" strokeWidth={1.7} />} invalid={isMissing('name')}>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={set('name')}
                        placeholder={`${t('form.name')} *`}
                        aria-label={t('form.name')}
                        aria-required="true"
                        className={`${fieldBase} h-[44px] border-[#C9D4E3]`}
                      />
                    </Field>
                    <Field icon={<Building2 className="h-[18px] w-[18px]" strokeWidth={1.7} />} invalid={isMissing('company')}>
                      <input
                        type="text"
                        name="company"
                        autoComplete="organization"
                        value={form.company}
                        onChange={set('company')}
                        placeholder={`${t('form.company')} *`}
                        aria-label={t('form.company')}
                        aria-required="true"
                        className={`${fieldBase} h-[44px] border-[#C9D4E3]`}
                      />
                    </Field>
                    <Field icon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.7} />} invalid={isMissing('phone')}>
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder={`${t('form.phone')} *`}
                        aria-label={t('form.phone')}
                        aria-required="true"
                        className={`${fieldBase} h-[44px] border-[#C9D4E3]`}
                      />
                    </Field>
                    <Field
                      icon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.7} />}
                      invalid={isMissing('email') || (touched && !!form.email.trim() && !emailValid)}
                    >
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder={`${t('form.email')} *`}
                        aria-label={t('form.email')}
                        aria-required="true"
                        className={`${fieldBase} h-[44px] border-[#C9D4E3]`}
                      />
                    </Field>
                    <Field icon={<LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.7} />} invalid={isMissing('category')}>
                      <select
                        name="category"
                        value={form.category}
                        onChange={set('category')}
                        aria-label={t('form.category')}
                        aria-required="true"
                        className={`${fieldBase} h-[44px] appearance-none border-[#C9D4E3] pr-9 font-medium ${form.category ? '' : 'text-[#10146B]'}`}
                      >
                        <option value="" disabled>
                          {`${t('form.category')} *`}
                        </option>
                        {CATEGORY_KEYS.map(key => (
                          <option key={key} value={key}>
                            {t(`categories.${key}`)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-[13px] h-[18px] w-[18px] text-[#10146B]" />
                    </Field>
                    <Field icon={<Tag className="h-[18px] w-[18px]" strokeWidth={1.7} />}>
                      <input
                        type="text"
                        name="product"
                        value={form.product}
                        onChange={set('product')}
                        aria-label={t('form.product')}
                        className={`${fieldBase} h-[44px] border-[#C9D4E3]`}
                      />
                      {!form.product && (
                        <span className="pointer-events-none absolute inset-y-0 left-10 right-3 flex flex-col justify-center text-[13.5px] leading-[1.15] text-[#10146B]">
                          <span className="truncate font-medium">{t('form.productLabel')}</span>
                          <span className="truncate text-[12.5px] text-[#4A5578]">{t('form.optional')}</span>
                        </span>
                      )}
                    </Field>
                    <div className="sm:col-span-2">
                      <Field icon={<MessagesSquare className="h-[18px] w-[18px]" strokeWidth={1.7} />} invalid={isMissing('message')}>
                        <textarea
                          name="message"
                          rows={3}
                          value={form.message}
                          onChange={set('message')}
                          placeholder={`${t('form.message')} *`}
                          aria-label={t('form.message')}
                          aria-required="true"
                          className={`${fieldBase} min-h-[88px] resize-y border-[#C9D4E3] pt-3`}
                        />
                      </Field>
                    </div>

                    {error && (
                      <div className="sm:col-span-2 flex items-start gap-2 rounded-[10px] border border-accent-200 bg-accent-50 px-3 py-2.5 text-[13.5px] text-accent-700" role="alert">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="sm:col-span-2 mt-1 inline-flex h-[48px] w-full items-center justify-center gap-3 rounded-[10px] bg-[#0B3F96] text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(11,63,150,0.28)] transition-colors hover:bg-[#10146B] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5 -rotate-12" fill="currentColor" strokeWidth={1.5} />
                      )}
                      {loading ? t('form.sending') : t('form.submit')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="relative bg-white pt-10 pb-10 lg:pt-[30px] lg:pb-[44px]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[52px]">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <span className="hidden sm:block h-[2px] w-[90px] lg:w-[184px] bg-[#0B5CAD]/70" aria-hidden="true" />
            <h2 className="text-center text-[28px] sm:text-[34px] lg:text-[40px] font-bold leading-tight" style={{ color: NAVY }}>
              {t('how.title')}
            </h2>
            <span className="hidden sm:block h-[2px] w-[90px] lg:w-[184px] bg-[#0B5CAD]/70" aria-hidden="true" />
          </div>
          <p className="mt-3 text-center text-[15px] sm:text-[17px] text-[#10146B]">
            {t('how.subtitleStart')}
            <strong className="font-semibold">{t('how.subtitleBold')}</strong>
            {t('how.subtitleEnd')}
          </p>

          <div className="mt-9 lg:mt-11 grid grid-cols-1 gap-7 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-5 xl:gap-6 xl:px-[24px]">
            {steps.map((step, i) => (
              <div key={step.title} className="contents">
                <div className="flex items-start gap-5">
                  <div className="flex h-[84px] w-[84px] lg:h-[96px] lg:w-[96px] shrink-0 items-center justify-center rounded-full bg-[#E4EEFA] text-[#10146B]">
                    {step.icon}
                  </div>
                  <div className="pt-1.5 lg:pt-1">
                    <h3 className="text-[19px] lg:text-[19px] xl:text-[21px] font-bold leading-tight text-[#10146B]">{step.title}</h3>
                    <p className="mt-2 text-[15px] lg:text-[16px] leading-[1.5] text-[#10146B]/90">{step.text}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block mt-[38px] h-8 w-8 text-[#0B5CAD]" strokeWidth={1.8} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY KITMED ================= */}
      <section className="relative bg-white pb-[80px] lg:pb-[92px]">
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-5">
          <div className="rounded-[22px] bg-[#EEF3FA] px-4 py-7 sm:px-8 lg:px-[30px] lg:py-[22px] shadow-[0_4px_20px_rgba(16,20,107,0.05)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-0">
              <div className="shrink-0 lg:pr-8 lg:border-r-2 lg:border-[#10146B]/70">
                <h2 className="text-[24px] sm:text-[28px] lg:text-[30px] font-bold leading-tight text-[#10146B]">{t('why.title')}</h2>
                <RedSwoosh className="mt-1 ml-[28%] h-[9px] w-[150px]" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-0">
                {whyItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 sm:gap-3 lg:justify-center lg:px-4 ${i > 0 ? 'lg:border-l lg:border-[#10146B]/25' : ''}`}
                  >
                    <span className="shrink-0 text-[#0B3F96]">{item.icon}</span>
                    <span className="min-w-0 text-[13px] sm:text-[14px] lg:text-[15px] leading-snug text-[#10146B] max-w-[150px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blue / red wave at the bottom */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[70px] lg:h-[96px] w-full"
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rfp-wave-blue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0B5CAD" stopOpacity="0.15" />
              <stop offset="0.5" stopColor="#0B5CAD" stopOpacity="0.85" />
              <stop offset="1" stopColor="#0B3F96" />
            </linearGradient>
            <linearGradient id="rfp-wave-red" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ED1C24" stopOpacity="0" />
              <stop offset="0.6" stopColor="#ED1C24" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ED1C24" />
            </linearGradient>
          </defs>
          <path d="M0 60 C 420 92, 960 92, 1440 20 L 1440 96 L 0 96 Z" fill="#E6EEF8" />
          <path d="M0 80 C 480 100, 1000 86, 1440 40 L 1440 96 L 0 96 Z" fill="url(#rfp-wave-blue)" />
          <path d="M600 84 C 900 82, 1200 64, 1440 46 L 1440 60 C 1200 76, 900 88, 600 84 Z" fill="url(#rfp-wave-red)" />
        </svg>
      </section>
    </div>
  );
}
