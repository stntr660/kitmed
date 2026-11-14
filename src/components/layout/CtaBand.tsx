import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CtaBandProps {
  title: string;
  buttonLabel: string;
  href: string;
}

/** Light-blue call-to-action band: title with a red left bar + red button (client mockups). */
export function CtaBand({ title, buttonLabel, href }: CtaBandProps) {
  return (
    <section className="bg-gradient-to-r from-[#DCEEFD] via-[#E8F4FE] to-[#F3F9FF]">
      <div className="container mx-auto flex flex-col items-start gap-5 px-4 py-10 sm:flex-row sm:items-center sm:gap-10 lg:px-8">
        <h2 className="border-l-4 border-accent pl-4 text-2xl font-bold text-[#10146B] lg:text-3xl">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
        >
          {buttonLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default CtaBand;
