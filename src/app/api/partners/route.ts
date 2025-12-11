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
      where.is_featured = true;
    }

    // Fetch partners with translations
    const partners = await prisma.partners.findMany({
      where,
      include: {
        partner_translations: true,
      },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' },
      ],
      take: limit,
    });

    // Transform the data for public consumption
    const transformedPartners = partners.map(partner => ({
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      isFeatured: partner.is_featured,
      name: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.name || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.name || '',
      },
      description: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.description || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.description || '',
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