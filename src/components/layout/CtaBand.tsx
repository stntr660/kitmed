import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CtaBandProps {
  title: string;
  buttonLabel: string;
  href: string;
  /** 'outline': centred, red outlined button (product pages mockup).
   *  'solid': red bar + filled red button (About mockup). */
  variant?: 'outline' | 'solid';
}

/** Light-blue call-to-action band. */
export function CtaBand({ title, buttonLabel, href, variant = 'outline' }: CtaBandProps) {
  if (variant === 'solid') {
    return (
      <section className="bg-gradient-to-r from-primary-50 via-primary-50 to-primary-100/70">
        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
            <h2 className="border-l-4 border-accent-500 pl-5 text-2xl lg:text-3xl font-bold text-primary-900">{title}</h2>
            <Link
              href={href}
              className="inline-flex w-fit items-center gap-2 rounded-md bg-accent-500 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              {buttonLabel}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="bg-gradient-to-r from-primary-50 via-primary-50 to-primary-100/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-center">
        <p className="text-xl lg:text-2xl font-bold text-primary-900">{title}</p>
        <Link
          href={href}
          className="inline-flex items-center rounded-md border-2 border-accent-500 bg-white px-6 py-2 font-medium text-accent-500 hover:bg-accent-500 hover:text-white transition-colors"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}

export default CtaBand;
