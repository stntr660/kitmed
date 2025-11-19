import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/partners - Public endpoint to fetch active partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const featured = searchParams.get('featured') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Build where clause - only active partners for public view
    const where: any = {
      status: 'active',
    };

    if (featured) {
      where.isFeatured = true;
    }

    // Fetch partners with translations
    const partners = await prisma.partner.findMany({
      where,
      include: {
        translations: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Transform the data for public consumption
    const transformedPartners = partners.map(partner => ({
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      isFeatured: partner.isFeatured,
      name: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.name || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.name || '',
      },
      description: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.description || '',
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedPartners,
      meta: {
        total: transformedPartners.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Public partners fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch partners',
        },
      },
      { status: 500 }
    );
  }
}