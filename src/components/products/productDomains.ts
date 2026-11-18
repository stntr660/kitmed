/**
 * The domains of the owner's « Solutions médicales complètes » mockup (2026-11-17), in its
 * order, shown as photo tiles on the Partenaires page. Photos cropped from the mockup
 * (Orthoptie = the owner's own photo, child with occluder). Contactologie became a top-level
 * category on 2026-11-18 (script 104); its photo is the homepage expertise tile.
 */
export const PRODUCT_DOMAINS = [
  { key: 'ophtalmologie', slug: 'ophtalmologie' },
  { key: 'orthoptie', slug: 'orthoptie' },
  { key: 'contactologie', slug: 'oph-contactology' },
  { key: 'orl', slug: 'orl-oto-rhino-laryngologie' },
  { key: 'literie', slug: 'mobilier-et-literie-hospitaliers' },
  { key: 'orthopedie', slug: 'orthopedics' },
  { key: 'dispositifs', slug: 'dispositifs-medicaux' },
  { key: 'drapage', slug: 'drapage' },
] as const;

export const domainPhoto = (slug: string) => `/images/products/domaine-${slug}.jpg`;

/** Category slug -> domain photo, for the slugs that have one. */
export const DOMAIN_PHOTOS: Record<string, string> = Object.fromEntries(
  PRODUCT_DOMAINS.map((d) => [d.slug, domainPhoto(d.slug)])
);
