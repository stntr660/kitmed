import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';
    const excludeZeroProducts = searchParams.get('excludeZeroProducts') === 'true';
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

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
            _count: {
              select: {
                products: {
                  where: { status: 'active' }
                }
              }
            }
          }
        },
        _count: {
          select: {
            products: {
              where: { status: 'active' }
            }
          }
        }
      }
    });

    // Process categories to include localized data
    const processedCategories = categories.map(category => {
      const translation = category.category_translations.find(t => t.language_code === locale);
      const fallbackTranslation = category.category_translations.find(t => t.language_code === 'fr');

      // Count direct products plus all products in child categories
      const directProducts = category._count?.products || 0;
      const childProducts = (category.other_categories || []).reduce(
        (sum, child) => sum + (child._count?.products || 0),
        0
      );
      const totalProductCount = directProducts + childProducts;

      // Process subcategories if hierarchy requested
      const subcategories = includeHierarchy ? (category.other_categories || []).map(sub => {
        const subTranslation = sub.category_translations.find(t => t.language_code === locale);
        const subFallback = sub.category_translations.find(t => t.language_code === 'fr');
        return {
          id: sub.id,
          name: subTranslation?.name || subFallback?.name || sub.name,
          slug: sub.slug,
          productCount: sub._count?.products || 0
        };
      }).filter(sub => !excludeZeroProducts || sub.productCount > 0) : undefined;

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
    }).filter(category => {
      if (excludeZeroProducts && includeProductCount) {
        return (category as any).productCount > 0;
      }
      return true;
    });

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
