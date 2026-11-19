import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DomainTileProps {
  href: string;
  title: string;
  imageUrl?: string | null;
  linkLabel: string;
  /** Photo ratio: 3/2 for photos (homepage domains, disciplines), 3/1 for the category collages (shown 5:2 so the devices are less cropped; owner 2026-11-18). */
  ratio?: '3/2' | '3/1';
}

/**
 * The one category card of the site, from « Nos domaines d'expertise » on the homepage
 * (owner 2026-11-16: category pages and « Nos produits » unified with it):
 * rounded photo, centred uppercase navy title, « Voir les produits › » with a red chevron.
 */
export function DomainTile({ href, title, imageUrl, linkLabel, ratio = '3/2' }: DomainTileProps) {
  return (
    <Link href={href} className="group w-full text-center sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gray-100 shadow-sm',
          ratio === '3/1' ? 'aspect-[5/2]' : 'aspect-[3/2]'
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-white">
            <span className="text-3xl font-bold text-primary-300">{title.charAt(0)}</span>
          </div>
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold uppercase text-[#10146B] xl:text-[22px]">{title}</h3>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#0B5CAD] group-hover:text-accent xl:text-[18px]">
        {linkLabel}
        <ChevronRight className="h-4 w-4 text-accent" />
      </span>
    </Link>
  );
}

/** Layout used with DomainTile everywhere: 1 per row on phones, 2 on tablets, 3 on desktop; an incomplete last row is centred (owner 2026-11-19). */
export const DOMAIN_GRID = 'flex flex-wrap justify-center gap-x-6 gap-y-8';
