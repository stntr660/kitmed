import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/banners - List banners with filters
async function getBanners(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      position: searchParams.get('position') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true : searchParams.get('is_active') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'sort_order',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build where clause
    const where: any = {};

    if (filters.position) {
      where.position = filters.position;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.banners.findMany({
        where,
        include: {
          banner_translations: true,
        },
        orderBy: { [filters.sortBy]: filters.sort_order },
        skip,
        take,
      }),
      prisma.banners.count({ where }),
    ]);

    // Transform items to camelCase for frontend compatibility
    const transformedItems = items.map(banner => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.image_url,
      backgroundUrl: banner.background_url,
      ctaText: banner.cta_text,
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
      translations: banner.banner_translations.map(t => ({
        id: t.id,
        bannerId: t.banner_id,
        languageCode: t.language_code,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        ctaText: t.cta_text,
      })),
    }));

    const result = {
      items: transformedItems,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
      filters,
    };

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Banners list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve banners',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create new banner
const createBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional().or(z.literal('')),
  background_url: z.string().optional().or(z.literal('')),
  cta_text: z.string().optional(),
  cta_url: z.string().optional().or(z.literal('')),
  cta_style: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  position: z.string().default('homepage'),
  layout: z.enum(['split', 'centered', 'full-width']).default('split'),
  text_align: z.enum(['left', 'center', 'right']).default('left'),
  overlay_opacity: z.number().min(0).max(1).default(0.9),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  translations: z.object({
    fr: z.object({
      title: z.string().min(1, 'French title is required'),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      cta_text: z.string().optional(),
    }),
    en: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      cta_text: z.string().optional(),
    }).optional(),
  }),
});

async function createBanner(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = createBannerSchema.safeParse(body);
    if (!validation.success) {
      console.error('Banner validation error:', {
        body,
        errors: validation.error.issues
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid banner data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const bannerData = validation.data;

    // Create banner in database
    const banner = await prisma.banners.create({
      data: {
        title: bannerData.translations.fr.title,
        subtitle: bannerData.translations.fr.subtitle || null,
        description: bannerData.translations.fr.description || null,
        image_url: bannerData.image_url || null,
        background_url: bannerData.background_url || null,
        cta_text: bannerData.translations.fr.cta_text || null,
        cta_url: bannerData.cta_url || null,
        cta_style: bannerData.cta_style,
        position: bannerData.position,
        layout: bannerData.layout,
        text_align: bannerData.text_align,
        overlay_opacity: bannerData.overlay_opacity,
        sort_order: bannerData.sort_order,
        is_active: bannerData.is_active,
        start_date: bannerData.start_date ? new Date(bannerData.start_date) : null,
        end_date: bannerData.end_date ? new Date(bannerData.end_date) : null,
        banner_translations: {
          create: [
            {
              language_code: 'fr',
              title: bannerData.translations.fr.title,
              subtitle: bannerData.translations.fr.subtitle || null,
              description: bannerData.translations.fr.description || null,
              cta_text: bannerData.translations.fr.cta_text || null,
            },
            ...(bannerData.translations.en ? [{
              language_code: 'en',
              title: bannerData.translations.en.title || bannerData.translations.fr.title,
              subtitle: bannerData.translations.en.subtitle || null,
              description: bannerData.translations.en.description || null,
              cta_text: bannerData.translations.en.cta_text || null,
            }] : []),
          ],
        },
      },
      include: {
        banner_translations: true,
      },
    });

    // Transform response to camelCase for frontend compatibility
    const transformedBanner = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.image_url,
      backgroundUrl: banner.background_url,
      ctaText: banner.cta_text,
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
      translations: banner.banner_translations.map(t => ({
        id: t.id,
        bannerId: t.banner_id,
        languageCode: t.language_code,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        ctaText: t.cta_text,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedBanner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Banner creation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create banner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withAuth(getBanners);
export const POST = withAuth(createBanner);