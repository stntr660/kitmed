import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/partners - Public endpoint to fetch active partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const featured = searchParams.get('featured') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const categoryId = searchParams.get('category');
    const categorySlug = searchParams.get('categorySlug');

    // Build where clause - only active partners for public view
    const where: any = {
      status: 'active',
    };

    if (featured) {
      where.is_featured = true;
    }

    // If filtering by category, find partners that have products in that category
    if (categoryId || categorySlug) {
      let targetCategoryId = categoryId;

      // If slug provided, look up the category ID
      if (categorySlug && !categoryId) {
        const category = await prisma.categories.findUnique({
          where: { slug: categorySlug },
          select: { id: true },
        });
        if (category) {
          targetCategoryId = category.id;
        }
      }

      if (targetCategoryId) {
        // Get all child categories as well (for parent categories)
        const childCategories = await prisma.categories.findMany({
          where: { parent_id: targetCategoryId },
          select: { id: true },
        });

        const categoryIds = [targetCategoryId, ...childCategories.map(c => c.id)];

        // Find partner IDs that have products in these categories
        const partnersWithProducts = await prisma.products.findMany({
          where: {
            category_id: { in: categoryIds },
            partner_id: { not: null },
            status: 'active',
          },
          select: { partner_id: true },
          distinct: ['partner_id'],
        });

        const partnerIds = partnersWithProducts
          .map(p => p.partner_id)
          .filter((id): id is string => id !== null);

        where.id = { in: partnerIds };
      }
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