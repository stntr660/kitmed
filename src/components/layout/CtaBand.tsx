import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface CtaBandProps {
  title: string;
  buttonLabel: string;
  href: string;
}

export function CtaBand({ title, buttonLabel, href }: CtaBandProps) {
  return (
    <section className="bg-gradient-to-r from-[#DDEFFE] via-[#E9F4FE] to-[#CFE6FC]">
      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
          <h2 className="border-l-4 border-[#E3040D] pl-5 text-2xl lg:text-3xl font-bold text-[#00007C]">
            {title}
          </h2>
          <Link
            href={href}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-[#E3040D] px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#B9030B]"
          >
            {buttonLabel}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CtaBand;
