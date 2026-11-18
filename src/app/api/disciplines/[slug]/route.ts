import { NextRequest, NextResponse } from 'next/server';
import { getPublicDiscipline } from '@/lib/catalog/public-catalog';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    // Same payload as the server-rendered discipline page (src/lib/catalog/public-catalog.ts)
    const discipline = await getPublicDiscipline(params.slug, locale);

    if (!discipline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Discipline not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discipline
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
