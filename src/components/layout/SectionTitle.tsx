import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionTitle({ title, align = 'left', className }: SectionTitleProps) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      <h2 className="text-2xl lg:text-3xl font-bold text-[#00007C]">{title}</h2>
      <span
        aria-hidden="true"
        className={cn('mt-3 block h-1 w-16 rounded-full bg-[#E3040D]', align === 'center' && 'mx-auto')}
      />
    </div>
  );
}

export default SectionTitle;
