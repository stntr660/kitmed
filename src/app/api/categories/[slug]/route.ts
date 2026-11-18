import { NextRequest, NextResponse } from 'next/server';
import { getPublicCategory } from '@/lib/catalog/public-catalog';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';

    // Same payload as the server-rendered category page (src/lib/catalog/public-catalog.ts)
    const category = await getPublicCategory(params.slug, locale, { includeChildren, includeProducts });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
