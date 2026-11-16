import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { DomainTile, DOMAIN_GRID } from './DomainTile';

export interface CategoryCardItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  href: string;
}

/** A category with this many children or fewer shows big pillar cards; more shows the tile grid. */
// 0 = every level uses the same tile grid (owner, 2026-11-15: « everything should be unified »)
export const PILLAR_MAX = 0;

function Placeholder({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <span className="text-3xl font-bold text-primary-300">{name.charAt(0)}</span>
    </div>
  );
}

/** Big cards: wide photo, uppercase title, one-line description, blue button. */
export function PillarCards({ items, buttonLabel }: { items: CategoryCardItem[]; buttonLabel: string }) {
  const cols = items.length >= 3 ? 'md:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : '';
  return (
    <div className={`grid grid-cols-1 gap-6 ${cols} ${items.length === 4 ? 'lg:grid-cols-4' : ''}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-shadow"
        >
          <div className="relative aspect-[2/1] overflow-hidden bg-slate-100">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Placeholder name={item.name} />
            )}
          </div>
          <div className="flex flex-1 flex-col p-5 lg:p-6">
            <h3 className="text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-primary-900 break-words">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-2 text-base text-slate-700 leading-snug">{item.description}</p>
            )}
            <span className="mt-auto pt-5">
              <span className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-5 py-2.5 font-semibold text-white group-hover:bg-primary-600 transition-colors">
                {buttonLabel}
                <ChevronRight className="h-4 w-4" />
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Tile grid: the site's single category card (same as the homepage domains), collage photos in 3:1. */
export function TileGrid({ items, linkLabel }: { items: CategoryCardItem[]; linkLabel: string }) {
  return (
    <div className={DOMAIN_GRID}>
      {items.map((item) => (
        <DomainTile key={item.id} href={item.href} title={item.name} imageUrl={item.imageUrl} linkLabel={linkLabel} ratio="3/1" />
      ))}
    </div>
  );
}

/** Pillar cards for few children, tile grid otherwise. */
export function CategoryCards({ items, buttonLabel, linkLabel }: { items: CategoryCardItem[]; buttonLabel: string; linkLabel: string }) {
  return items.length <= PILLAR_MAX
    ? <PillarCards items={items} buttonLabel={buttonLabel} />
    : <TileGrid items={items} linkLabel={linkLabel} />;
}
