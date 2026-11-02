import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { getRecursiveProductCounts } from '@/lib/catalog/category-counts';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

    const counts = await getRecursiveProductCounts();

    // Get active categories with translations, product count, and child categories
    const categories = await prisma.categories.findMany({
      where: {
        is_active: true,
        parent_id: null, // Only root categories
      },
      orderBy: {
        sort_order: 'asc',
      },
      include: {
        category_translations: true,
        other_categories: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
          include: {
            category_translations: true,
          }
        },
      }
    });

    // Process categories to include localized data
    const processedCategories = categories.map(category => {
      const translation = category.category_translations.find(t => t.language_code === locale);
      const fallbackTranslation = category.category_translations.find(t => t.language_code === 'fr');

      // Products anywhere below this category, not just one level down
      const totalProductCount = counts.get(category.id) || 0;

      // Process subcategories if hierarchy requested
      const subcategories = includeHierarchy ? (category.other_categories || []).map(sub => {
        const subTranslation = sub.category_translations.find(t => t.language_code === locale);
        const subFallback = sub.category_translations.find(t => t.language_code === 'fr');
        return {
          id: sub.id,
          name: subTranslation?.name || subFallback?.name || sub.name,
          slug: sub.slug,
          productCount: counts.get(sub.id) || 0
        };
      }).filter(sub => sub.productCount > 0) : undefined;

      return {
        id: category.id,
        name: translation?.name || fallbackTranslation?.name || category.name,
        slug: category.slug,
        description: translation?.description || fallbackTranslation?.description || category.description,
        imageUrl: category.image_url,
        sortOrder: category.sort_order,
        count: String(totalProductCount),
        ...(includeProductCount && {
          productCount: totalProductCount
        }),
        ...(includeHierarchy && {
          subcategories
        })
      };
    })
      // An empty category is an unfinished page ("catégorie en cours de
      // développement"); the public site never links to one.
      // Order is categories.sort_order (see orderBy above), which the catalogue
      // scripts own -- no hardcoded specialty priority.
      .filter(category => category.count !== '0');

    return NextResponse.json({
      success: true,
      data: processedCategories
    });

  } catch (error) {
    console.error('Public categories API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
