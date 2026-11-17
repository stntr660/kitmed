'use client';

import { useState, type ReactNode, type SVGProps } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  PhoneCall,
  Phone,
  Mail,
  Send,
  CheckCircle,
  Printer,
  MessageCircle,
  Timer,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react';

// lucide-react 0.294 has no Handshake icon: same drawing as lucide's later "handshake".
function HandshakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
  );
}

const SUBJECT_KEYS = ['quote', 'product', 'sav', 'partnership', 'other'] as const;

const NAVY = 'text-[#10146B]';
const fieldClass =
  'block w-full h-10 rounded-lg border border-[#C9D4E3] bg-white px-4 text-[15px] text-[#10146B] placeholder:text-[#6B7489] focus:outline-none focus:border-[#0B5CAD] focus:ring-2 focus:ring-[#0B5CAD]/20 transition-colors';
const labelClass = `block mb-2 text-[16px] font-semibold leading-none ${NAVY}`;

function Req() {
  return <span className="ml-1 text-accent-600" aria-hidden="true">*</span>;
}

function CoordRow({ icon, children, last = false }: { icon: ReactNode; children: ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-start gap-4 sm:gap-5 py-3.5 ${last ? '' : 'border-b border-[#DCE3EC]'}`}>
      <div className="w-9 shrink-0 flex justify-center pt-0.5 text-accent-600">{icon}</div>
      <div className={`min-w-0 text-[17px] sm:text-[18px] leading-[1.4] ${NAVY}`}>{children}</div>
    </div>
  );
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          message: '',
        });
      } else {
        // Translate error codes
        const errorKey = result.error;
        if (errorKey === 'MISSING_REQUIRED_FIELDS') {
          setError(t('form.errors.missingFields'));
        } else if (errorKey === 'INVALID_EMAIL') {
          setError(t('form.errors.invalidEmail'));
        } else {
          setError(t('form.errors.general'));
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(t('form.errors.general'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col bg-[#EDF3FA]">
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center rounded-[22px] bg-white px-6 py-12 shadow-[0_10px_40px_rgba(16,20,107,0.08)]">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-[#0B5CAD]" />
              </div>
              <h1 className={`text-3xl lg:text-4xl font-bold ${NAVY} mb-6`}>
                {t('success.title')}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t('success.message')}
              </p>
              <Button size="lg" onClick={() => setIsSubmitted(false)}>
                {t('success.sendAnother')}
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const perks = [
    { key: 'fastReply', icon: <Timer className="h-12 w-12" strokeWidth={1.8} /> },
    { key: 'team', icon: <Users className="h-12 w-12" strokeWidth={1.4} fill="currentColor" /> },
    { key: 'support', icon: <HandshakeIcon className="h-12 w-12" strokeWidth={1.8} /> },
    { key: 'sav', icon: <Settings className="h-12 w-12" strokeWidth={1.8} /> },
  ] as const;

  return (
    <div className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#F1F6FC] via-[#ECF2F9] to-[#E7EFF8]">
      {/* Hero */}
      <section className="relative">
        {/* Blurred exam-room photo, right side (red swoosh is part of the photo) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-[78%] sm:w-[52%] lg:w-[470px] xl:w-[34%] opacity-40 sm:opacity-70 lg:opacity-100"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 32%)',
            maskImage: 'linear-gradient(to right, transparent 0%, #000 32%)',
          }}
        >
          <Image
            src="/images/contact/contact-hero-device.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 34vw, 78vw"
            className="object-cover object-[left_top] lg:object-[left_bottom]"
          />
        </div>

        {/* Blue swoosh, left */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0 bottom-[-6px] w-[170px] sm:w-[240px] lg:w-[320px] h-auto"
          viewBox="0 0 320 100"
          fill="none"
        >
          <defs>
            <linearGradient id="contact-swoosh-blue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0B5CAD" />
              <stop offset="0.65" stopColor="#0B5CAD" stopOpacity="0.85" />
              <stop offset="1" stopColor="#0B5CAD" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 0 C 90 34, 190 70, 320 94 C 200 84, 100 66, 0 34 Z" fill="url(#contact-swoosh-blue)" />
        </svg>

        <div className="relative mx-auto max-w-[1304px] px-4 pt-7 pb-10 sm:pt-9 lg:pt-[38px] lg:pb-[58px]">
          <div className="flex items-start gap-4 sm:gap-6 lg:gap-0">
            <div className="relative shrink-0 lg:w-[145px] lg:pl-[6px] lg:pt-[18px] text-[#0A4A93]">
              <MessageCircle className="h-12 w-12 sm:h-20 sm:w-20 lg:h-[104px] lg:w-[104px]" strokeWidth={2} />
              <Phone
                className="absolute h-5 w-5 sm:h-8 sm:w-8 lg:h-[42px] lg:w-[42px] left-[14px] top-[14px] sm:left-[24px] sm:top-[24px] lg:left-[37px] lg:top-[49px]"
                strokeWidth={0}
                fill="currentColor"
              />
            </div>
            <div className="min-w-0">
              <h1 className={`text-[30px] min-[400px]:text-[34px] sm:text-[50px] lg:text-[56px] font-bold leading-[1.1] tracking-[-0.01em] ${NAVY}`}>
                {t('hero.title')}
              </h1>
              <span className="mt-3 lg:mt-[14px] block h-1 w-16 lg:w-[92px] rounded-full bg-accent-600" />
              <p className="mt-4 lg:mt-[20px] text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.5] text-[#1E2744] max-w-[760px] -ml-[64px] sm:ml-0">
                <span className="block lg:max-w-[490px]">{t('hero.question')}</span>
                <span className="block">{t('hero.answer')}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coordonnées + formulaire */}
      <section className="relative pb-10 lg:pb-[52px]">
        {/* Decorative photos (desktop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[88px] hidden xl:block h-[390px] w-[80px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 15%, #000 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 15%, #000 80%, transparent 100%)',
          }}
        >
          <Image src="/images/contact/contact-plant.jpg" alt="" fill sizes="80px" className="object-cover object-right" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 bottom-0 hidden lg:block w-[54%] aspect-[778/234]"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 22%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 22%)',
          }}
        >
          <Image src="/images/contact/contact-desk-headset.jpg" alt="" fill sizes="54vw" className="object-cover object-top" />
        </div>

        <div className="relative mx-auto max-w-[1304px] px-4">
          <div className="grid gap-5 lg:gap-[15px] lg:grid-cols-[685fr_603fr] items-start">
            {/* Nos Coordonnées */}
            <div className="order-2 lg:order-1 rounded-[22px] bg-white/95 shadow-[0_12px_40px_rgba(16,20,107,0.08)] px-5 py-7 sm:px-8 lg:pl-[45px] lg:pr-[24px] lg:pt-[30px] lg:pb-[26px]">
              <h2 className={`text-[28px] sm:text-[34px] lg:text-[37px] font-bold leading-tight ${NAVY}`}>
                {t('info.title')}
              </h2>
              <span className="mt-3 block h-1 w-[90px] rounded-full bg-accent-600" />

              <div className="mt-6 lg:mt-[26px] grid gap-6 md:grid-cols-[292px_1fr] md:gap-0">
                <div className="md:pr-[22px] md:border-r md:border-[#E3E9F0]">
                  <CoordRow icon={<MapPin className="h-9 w-9" fill="currentColor" stroke="white" strokeWidth={1.8} />}>
                    <p className="font-bold">{t('info.headOffice')}</p>
                    <p>{t('info.addressLine1')}</p>
                    <p>{t('info.addressLine2')}</p>
                    <p>{t('info.addressLine3')}</p>
                  </CoordRow>
                  <CoordRow icon={<PhoneCall className="h-8 w-8" strokeWidth={2.2} />}>
                    <a href="tel:+212522860366" className="block font-medium hover:text-[#0B5CAD] transition-colors">+212 522 86 03 66</a>
                    <a href="tel:+212522860431" className="block font-medium hover:text-[#0B5CAD] transition-colors">+212 522 86 04 31</a>
                  </CoordRow>
                  <CoordRow icon={<Printer className="h-8 w-8" strokeWidth={2.2} />}>
                    <span className="sr-only">Fax : </span>
                    <span className="font-medium">+212 522 86 04 16</span>
                  </CoordRow>
                  <CoordRow last icon={<Mail className="h-8 w-8" strokeWidth={2.2} />}>
                    <a href="mailto:INFO@KITMED.MA" className="block font-semibold break-all hover:text-[#0B5CAD] transition-colors">INFO@KITMED.MA</a>
                    <a href="mailto:EXPORT@KITMED.MA" className="block font-semibold break-all hover:text-[#0B5CAD] transition-colors">EXPORT@KITMED.MA</a>
                  </CoordRow>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-1 md:gap-y-0 md:pl-[34px] md:pt-1 md:flex md:flex-col md:justify-around">
                  {perks.map(p => (
                    <li key={p.key} className="flex items-center gap-3 sm:gap-6 md:min-h-[80px]">
                      <span className="shrink-0 text-[#0B5CAD]">{p.icon}</span>
                      <span className={`text-[15px] sm:text-[17px] font-semibold leading-snug md:whitespace-pre-line ${NAVY}`}>
                        {t(`info.perks.${p.key}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div className="order-1 lg:order-2 rounded-[22px] bg-[#0A4A93] shadow-[0_12px_40px_rgba(16,20,107,0.12)] overflow-hidden">
              <div className="flex items-center gap-4 sm:gap-6 px-5 sm:px-8 h-[64px] lg:h-[75px]">
                <Send className="h-8 w-8 lg:h-10 lg:w-10 text-white -rotate-[8deg]" strokeWidth={1.8} />
                <h2 className="text-[22px] sm:text-[26px] lg:text-[31px] font-bold text-white leading-none">
                  {t('form.title')}
                </h2>
              </div>
              <div className="bg-white rounded-t-[18px] px-5 sm:px-[33px] pt-6 lg:pt-[26px] pb-7 lg:pb-[27px]">
                <form onSubmit={handleSubmit} className="space-y-[18px]">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-x-[23px]">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>
                        {t('form.firstName')}<Req />
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={fieldClass}
                        placeholder={t('form.placeholders.firstName')}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>
                        {t('form.lastName')}<Req />
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={fieldClass}
                        placeholder={t('form.placeholders.lastName')}
                      />
                    </div>
                  </div>

                  <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-x-[23px]">
                    <div>
                      <label htmlFor="email" className={labelClass}>
                        {t('form.email')}<Req />
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={fieldClass}
                        placeholder={t('form.placeholders.email')}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        {t('form.phone')}<Req />
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={fieldClass}
                        placeholder={t('form.placeholders.phone')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className={labelClass}>
                      {t('form.company')}
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={fieldClass}
                      placeholder={t('form.placeholders.company')}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className={labelClass}>
                      {t('form.subject')}<Req />
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`${fieldClass} appearance-none pr-11 cursor-pointer ${formData.subject ? '' : 'text-[#3B4560]'}`}
                      >
                        <option value="" disabled>{t('form.subjectPlaceholder')}</option>
                        {SUBJECT_KEYS.map(k => (
                          <option key={k} value={t(`form.subjects.${k}`)}>{t(`form.subjects.${k}`)}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#10146B]" strokeWidth={2} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className={labelClass}>
                      {t('form.message')}<Req />
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`${fieldClass} h-[102px] py-3 resize-y`}
                      placeholder={t('form.placeholders.message')}
                    />
                  </div>

                  <div className="pt-3 flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full sm:w-auto sm:min-w-[332px] h-[56px] lg:h-[60px] items-center justify-center gap-4 rounded-[10px] bg-accent-700 px-8 text-[18px] lg:text-[21px] font-bold text-white shadow-[0_8px_20px_rgba(185,28,28,0.25)] hover:bg-accent-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        tCommon('loading')
                      ) : (
                        <>
                          <Send className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2} />
                          {t('form.submit')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
