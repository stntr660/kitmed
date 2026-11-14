import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumb: BreadcrumbItem[];
  /** Red bar left of the title (About / SAV / Catalogues mockup). */
  accent?: boolean;
}

/** Light-blue title band with breadcrumb (client mockups 2026-11). */
export function PageHeader({ title, breadcrumb, accent = false }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-50 via-primary-50 to-primary-100/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-[28rem] rounded-full border-[28px] border-white/50"
      />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <div className={accent ? 'border-l-4 border-accent-500 pl-5' : undefined}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 leading-tight break-words">
            {title}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-2">
            <ol className="flex flex-wrap items-center gap-x-2 text-sm text-slate-700">
              {breadcrumb.map((item, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <li key={`${item.label}-${i}`} className="flex items-center gap-x-2">
                    {last ? (
                      <span className="text-accent-500" aria-current="page">{item.label}</span>
                    ) : item.href ? (
                      <Link href={item.href} className="text-primary-600 hover:underline">{item.label}</Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {!last && <span className="text-slate-400">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}

export default PageHeader;
