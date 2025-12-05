import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/banners - Get active banners for public display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'homepage';
    const locale = searchParams.get('locale') || 'fr';

    // Get current date for active banner filtering
    const now = new Date();

    const banners = await prisma.banners.findMany({
      where: {
        position,
        is_active: true,
        OR: [
          { start_date: null },
          { start_date: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { end_date: null },
              { end_date: { gte: now } },
            ],
          },
        ],
      },
      include: {
        banner_translations: {
          where: {
            language_code: locale,
          },
        },
      },
      orderBy: {
        sort_order: 'asc',
      },
    });

    // Transform data to include translation data at the root level
    const transformedBanners = banners.map(banner => {
      const translation = banner.banner_translations[0];
      return {
        id: banner.id,
        title: translation?.title || banner.title,
        subtitle: translation?.subtitle || banner.subtitle,
        description: translation?.description || banner.description,
        imageUrl: banner.image_url,
        backgroundUrl: banner.background_url,
        ctaText: translation?.cta_text || banner.cta_text,
        ctaUrl: banner.cta_url,
        ctaStyle: banner.cta_style,
        position: banner.position,
        layout: banner.layout,
        textAlign: banner.text_align,
        overlayOpacity: banner.overlay_opacity,
        sortOrder: banner.sort_order,
        isActive: banner.is_active,
        startDate: banner.start_date,
        endDate: banner.end_date,
        createdAt: banner.created_at,
        updatedAt: banner.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedBanners,
      meta: {
        count: transformedBanners.length,
        position,
        locale,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Public banners fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch banners',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}