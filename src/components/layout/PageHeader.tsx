import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumb: BreadcrumbItem[];
}

export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-[#D6EBFE] via-[#E6F2FE] to-[#CFE6FC]">
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="border-l-4 border-[#E3040D] pl-5">
          <h1 className="text-3xl lg:text-4xl font-bold text-[#00007C]">{title}</h1>
          <nav aria-label="Breadcrumb" className="mt-2 text-sm text-gray-700">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumb.map((item, i) => (
                <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {item.href ? (
                    <Link href={item.href} className="text-[#00007C] underline underline-offset-2 hover:text-[#E3040D]">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}

export default PageHeader;
