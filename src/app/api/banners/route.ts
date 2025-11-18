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

    const banners = await prisma.banner.findMany({
      where: {
        position,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        translations: {
          where: {
            languageCode: locale,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Transform data to include translation data at the root level
    const transformedBanners = banners.map(banner => {
      const translation = banner.translations[0];
      return {
        id: banner.id,
        title: translation?.title || banner.title,
        subtitle: translation?.subtitle || banner.subtitle,
        description: translation?.description || banner.description,
        imageUrl: banner.imageUrl,
        backgroundUrl: banner.backgroundUrl,
        ctaText: translation?.ctaText || banner.ctaText,
        ctaUrl: banner.ctaUrl,
        ctaStyle: banner.ctaStyle,
        position: banner.position,
        layout: banner.layout,
        textAlign: banner.textAlign,
        overlayOpacity: banner.overlayOpacity,
        sortOrder: banner.sortOrder,
        isActive: banner.isActive,
        startDate: banner.startDate,
        endDate: banner.endDate,
        createdAt: banner.createdAt,
        updatedAt: banner.updatedAt,
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