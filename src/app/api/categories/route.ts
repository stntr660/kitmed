import { NextRequest, NextResponse } from 'next/server';
import { getPublicRootCategories } from '@/lib/catalog/public-catalog';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

    // Same payload as the server-rendered disciplines page (src/lib/catalog/public-catalog.ts)
    const processedCategories = await getPublicRootCategories(locale, { includeProductCount, includeHierarchy });

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
