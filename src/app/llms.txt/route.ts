import { getPublicPartnersWithProducts, getPublicRootCategories } from '@/lib/catalog/public-catalog';
import { COMPANY, STATIC_PAGES, isStaging, localeUrl, summarize } from '@/lib/seo/site';

// llms.txt (https://llmstxt.org): a short Markdown guide to the site for AI
// assistants and answer engines, built from the live catalogue.
export const dynamic = 'force-dynamic';

const phone = (p: string) => p.replace(/^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '+212 $1$2 $3 $4 $5');

export async function GET() {
  const [categories, partners] = await Promise.all([
    getPublicRootCategories('fr', { includeProductCount: true, includeHierarchy: true }).catch(() => []),
    getPublicPartnersWithProducts('fr').catch(() => []),
  ]);
  const enNames = new Map(
    (await getPublicRootCategories('en').catch(() => [])).map(c => [c.slug, c.name])
  );

  const lines: string[] = [];
  lines.push('# KITMED');
  lines.push('');
  lines.push(
    `> KITMED est un distributeur marocain d’équipements et de dispositifs médicaux, basé à Casablanca (Quartier des Hôpitaux) et au service des professionnels de santé depuis ${COMPANY.foundingDate}. KITMED vend sur devis (pas de prix publics), installe le matériel et assure le service après-vente au Maroc. / KITMED is a Moroccan distributor of medical equipment and devices based in Casablanca, serving healthcare professionals since ${COMPANY.foundingDate}; sales on quotation, installation and after-sales service.`
  );
  lines.push('');
  lines.push(
    'Site bilingue : français (/fr) et anglais (/en). Chaque fiche produit indique le nom, la marque, la référence fabricant, la description et la fiche technique.'
  );
  lines.push('');

  lines.push('## Domaines / Specialties');
  lines.push('');
  for (const c of categories) {
    const en = enNames.get(c.slug);
    const subs = (c.subcategories || []).slice(0, 8).map(s => s.name).join(', ');
    lines.push(
      `- [${c.name}${en && en !== c.name ? ` / ${en}` : ''}](${localeUrl('fr', `/products/disciplines/${c.slug}`)}): ${c.productCount} produits${subs ? ` — ${subs}` : ''}`
    );
  }
  lines.push('');

  if (partners.length) {
    lines.push('## Marques partenaires / Partner brands');
    lines.push('');
    for (const p of partners) {
      const desc = summarize(p.description, 140);
      lines.push(`- [${p.name}](${localeUrl('fr', `/partners/${p.slug}`)})${desc ? `: ${desc}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## Pages clés / Key pages');
  lines.push('');
  const key = ['home', 'disciplines', 'partners', 'catalogues', 'about', 'rfp', 'sav', 'contact'] as const;
  for (const k of key) {
    const page = STATIC_PAGES[k];
    lines.push(`- [${page.fr.title}](${localeUrl('fr', page.path)}): ${page.fr.description} (EN: ${localeUrl('en', page.path)})`);
  }
  lines.push('');

  lines.push('## Contact');
  lines.push('');
  lines.push(
    `- Direction : ${COMPANY.direction.streetAddress}, ${COMPANY.direction.addressLocality}, Maroc — Tél. ${COMPANY.direction.phones.map(phone).join(' / ')}`
  );
  lines.push(
    `- Showroom : ${COMPANY.showroom.streetAddress}, ${COMPANY.showroom.addressLocality}, Maroc — Tél. ${COMPANY.showroom.phones.map(phone).join(' / ')}`
  );
  lines.push(`- E-mail : ${COMPANY.email} (export : ${COMPANY.exportEmail})`);
  lines.push(`- Demande de devis / Request a quote: ${localeUrl('fr', STATIC_PAGES.rfp.path)}`);
  lines.push(`- Réseaux : ${COMPANY.sameAs.join(' · ')}`);
  lines.push('');

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Sitemap](${localeUrl('fr').replace(/\/fr$/, '')}/sitemap.xml): toutes les fiches produits, catégories et marques (fr + en)`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...(isStaging() ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
  });
}
