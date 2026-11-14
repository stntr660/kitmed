import Link from 'next/link';

interface CtaBandProps {
  title: string;
  buttonLabel: string;
  href: string;
}

/** Light-blue call-to-action band: title + red outlined button. */
export function CtaBand({ title, buttonLabel, href }: CtaBandProps) {
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
