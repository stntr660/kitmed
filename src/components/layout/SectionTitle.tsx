import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  align?: 'left' | 'center';
  className?: string;
}

/** Navy section title with the short red bar under it (client mockups). */
export function SectionTitle({ title, align = 'center', className }: SectionTitleProps) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      <h2 className="text-2xl font-bold text-[#10146B] sm:text-3xl lg:text-4xl">{title}</h2>
      <span
        aria-hidden="true"
        className={cn('mt-3 block h-1 w-14 rounded-full bg-accent', align === 'center' && 'mx-auto')}
      />
    </div>
  );
}

export default SectionTitle;
