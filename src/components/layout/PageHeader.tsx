import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  breadcrumb: { label: string; href?: string }[];
}

/** Light-blue title band with a red left bar and a breadcrumb (client mockups). */
export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-[#DCEEFD] via-[#E8F4FE] to-[#F3F9FF]">
      <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <div className="border-l-4 border-accent pl-4 sm:pl-6">
          <h1 className="text-3xl font-bold text-[#10146B] lg:text-4xl">{title}</h1>
          {breadcrumb.length > 0 && (
            <nav aria-label="Breadcrumb" className="mt-2 text-sm text-[#10146B]">
              {breadcrumb.map((item, i) => (
                <span key={`${item.label}-${i}`}>
                  {i > 0 && <span className="mx-1.5 text-gray-500">/</span>}
                  {item.href ? (
                    <Link href={item.href} className="underline underline-offset-2 hover:text-accent">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default PageHeader;
