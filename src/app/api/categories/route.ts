import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';

    // Get active categories with translations and product count
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Only root categories for homepage
      },
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        translations: true,
        ...(includeProductCount && {
          _count: {
            select: {
              products: {
                where: {
                  status: 'active'
                }
              }
            }
          }
        })
      }
    });

    // Process categories to include localized data
    const processedCategories = categories.map(category => {
      const translation = category.translations.find(t => t.languageCode === locale);
      const fallbackTranslation = category.translations.find(t => t.languageCode === 'fr');
      
      return {
        id: category.id,
        name: translation?.name || fallbackTranslation?.name || category.name,
        slug: category.slug,
        description: translation?.description || fallbackTranslation?.description || category.description,
        imageUrl: category.imageUrl,
        sortOrder: category.sortOrder,
        ...(includeProductCount && {
          productCount: category._count?.products || 0,
          count: `${category._count?.products || 0}+ produits`
        })
      };
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