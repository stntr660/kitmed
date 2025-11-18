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
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'sortOrder',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build where clause
    const where: any = {};

    if (filters.position) {
      where.position = filters.position;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        include: {
          translations: true,
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take,
      }),
      prisma.banner.count({ where }),
    ]);

    const result = {
      items,
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
  imageUrl: z.string().url().optional().or(z.literal('')),
  backgroundUrl: z.string().url().optional().or(z.literal('')),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal('')),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  position: z.string().default('homepage'),
  layout: z.enum(['split', 'centered', 'full-width']).default('split'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  overlayOpacity: z.number().min(0).max(1).default(0.9),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  translations: z.object({
    fr: z.object({
      title: z.string().min(1, 'French title is required'),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      ctaText: z.string().optional(),
    }),
    en: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      ctaText: z.string().optional(),
    }).optional(),
  }),
});

async function createBanner(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createBannerSchema.safeParse(body);
    if (!validation.success) {
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
    const banner = await prisma.banner.create({
      data: {
        title: bannerData.translations.fr.title,
        subtitle: bannerData.translations.fr.subtitle || null,
        description: bannerData.translations.fr.description || null,
        imageUrl: bannerData.imageUrl || null,
        backgroundUrl: bannerData.backgroundUrl || null,
        ctaText: bannerData.translations.fr.ctaText || null,
        ctaUrl: bannerData.ctaUrl || null,
        ctaStyle: bannerData.ctaStyle,
        position: bannerData.position,
        layout: bannerData.layout,
        textAlign: bannerData.textAlign,
        overlayOpacity: bannerData.overlayOpacity,
        sortOrder: bannerData.sortOrder,
        isActive: bannerData.isActive,
        startDate: bannerData.startDate ? new Date(bannerData.startDate) : null,
        endDate: bannerData.endDate ? new Date(bannerData.endDate) : null,
        translations: {
          create: [
            {
              languageCode: 'fr',
              title: bannerData.translations.fr.title,
              subtitle: bannerData.translations.fr.subtitle || null,
              description: bannerData.translations.fr.description || null,
              ctaText: bannerData.translations.fr.ctaText || null,
            },
            ...(bannerData.translations.en ? [{
              languageCode: 'en',
              title: bannerData.translations.en.title || bannerData.translations.fr.title,
              subtitle: bannerData.translations.en.subtitle || null,
              description: bannerData.translations.en.description || null,
              ctaText: bannerData.translations.en.ctaText || null,
            }] : []),
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: banner,
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