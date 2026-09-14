import { prisma } from '@/lib/database';

/**
 * Active-product totals per category, INCLUDING every active descendant.
 *
 * The public catalogue is a tree up to four levels deep (discipline > family >
 * sub-family > ...). Prisma's `_count` only sees products attached directly to
 * a row, so a family whose products all live in its sub-families reported 0 --
 * the menu then hid "Unités de consultation", "Bloc opératoire", etc. while
 * empty leaves like "Punchs & Trépans" still showed "catégorie en cours de
 * développement". Every public surface should read counts from here and hide a
 * category whose total is 0.
 *
 * A product under an inactive category is unreachable, so inactive branches
 * contribute nothing.
 */
export async function getRecursiveProductCounts(): Promise<Map<string, number>> {
  const [categories, grouped] = await Promise.all([
    prisma.categories.findMany({
      where: { is_active: true },
      select: { id: true, parent_id: true },
    }),
    prisma.products.groupBy({
      by: ['category_id'],
      where: { status: 'active' },
      _count: { _all: true },
    }),
  ]);

  const direct = new Map<string, number>();
  for (const row of grouped) direct.set(row.category_id, row._count._all);

  const children = new Map<string, string[]>();
  for (const cat of categories) {
    if (!cat.parent_id) continue;
    const list = children.get(cat.parent_id) || [];
    list.push(cat.id);
    children.set(cat.parent_id, list);
  }

  const totals = new Map<string, number>();
  const total = (id: string, seen: Set<string>): number => {
    const cached = totals.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0; // guard against a parent_id cycle
    seen.add(id);
    let sum = direct.get(id) || 0;
    for (const child of children.get(id) || []) sum += total(child, seen);
    totals.set(id, sum);
    return sum;
  };

  for (const cat of categories) total(cat.id, new Set());
  return totals;
}
