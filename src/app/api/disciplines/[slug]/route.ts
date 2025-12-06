import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    // Find the discipline by slug
    const discipline = await prisma.categories.findFirst({
      where: { 
        slug: params.slug,
        type: 'discipline',
        is_active: true
      },
      include: {
        category_translations: {
          where: { language_code: locale }
        },
        other_categories: {
          where: { is_active: true },
          include: {
            category_translations: {
              where: { language_code: locale }
            },
            _count: {
              select: { products: true }
            }
          },
          orderBy: { sort_order: 'asc' }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!discipline) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Discipline not found' 
        },
        { status: 404 }
      );
    }

    // Transform the discipline data
    const translation = discipline.category_translations?.[0];
    const transformedDiscipline = {
      id: discipline.id,
      name: translation?.name || discipline.name,
      slug: discipline.slug,
      description: translation?.description || discipline.description,
      imageUrl: discipline.image_url,
      type: discipline.type,
      productCount: discipline._count.products,
      children: discipline.other_categories.map((category: any) => {
        const categoryTranslation = category.category_translations?.[0];
        return {
          id: category.id,
          name: categoryTranslation?.name || category.name,
          slug: category.slug,
          description: categoryTranslation?.description || category.description,
          imageUrl: category.image_url,
          type: category.type,
          productCount: category._count.products,
          children: [] // Will be loaded dynamically when needed
        };
      })
    };

    return NextResponse.json({
      success: true,
      data: transformedDiscipline
    });

  } catch (error) {
    console.error('Discipline fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}