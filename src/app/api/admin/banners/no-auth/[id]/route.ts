import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/banners/no-auth/[id] - Get single banner without auth
async function getBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
      include: {
        translations: true,
      },
    });

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banner not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: banner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Banner fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch banner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/banners/no-auth/[id] - Update banner without auth
const updateBannerSchema = z.object({
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
  imageUrl: z.string().optional().or(z.literal('')),
  backgroundUrl: z.string().optional().or(z.literal('')),
  ctaUrl: z.string().optional().or(z.literal('')),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  position: z.string().default('homepage'),
  layout: z.enum(['split', 'centered', 'full-width']).default('split'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  overlayOpacity: z.number().min(0).max(1).default(0.9),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

async function updateBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = updateBannerSchema.safeParse(body);
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

    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id },
      include: { translations: true },
    });

    if (!existingBanner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banner not found',
          },
        },
        { status: 404 }
      );
    }

    // Update banner
    const updatedBanner = await prisma.$transaction(async (tx) => {
      // Update main banner record
      const banner = await tx.banner.update({
        where: { id: params.id },
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
        },
      });

      // Update French translation
      await tx.bannerTranslation.upsert({
        where: {
          bannerId_languageCode: {
            bannerId: params.id,
            languageCode: 'fr',
          },
        },
        create: {
          bannerId: params.id,
          languageCode: 'fr',
          title: bannerData.translations.fr.title,
          subtitle: bannerData.translations.fr.subtitle || null,
          description: bannerData.translations.fr.description || null,
          ctaText: bannerData.translations.fr.ctaText || null,
        },
        update: {
          title: bannerData.translations.fr.title,
          subtitle: bannerData.translations.fr.subtitle || null,
          description: bannerData.translations.fr.description || null,
          ctaText: bannerData.translations.fr.ctaText || null,
        },
      });

      // Update English translation if provided
      if (bannerData.translations.en) {
        await tx.bannerTranslation.upsert({
          where: {
            bannerId_languageCode: {
              bannerId: params.id,
              languageCode: 'en',
            },
          },
          create: {
            bannerId: params.id,
            languageCode: 'en',
            title: bannerData.translations.en.title || bannerData.translations.fr.title,
            subtitle: bannerData.translations.en.subtitle || null,
            description: bannerData.translations.en.description || null,
            ctaText: bannerData.translations.en.ctaText || null,
          },
          update: {
            title: bannerData.translations.en.title || bannerData.translations.fr.title,
            subtitle: bannerData.translations.en.subtitle || null,
            description: bannerData.translations.en.description || null,
            ctaText: bannerData.translations.en.ctaText || null,
          },
        });
      }

      return tx.banner.findUnique({
        where: { id: params.id },
        include: { translations: true },
      });
    });

    return NextResponse.json({
      success: true,
      data: updatedBanner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Banner update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update banner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/no-auth/[id] - Delete banner without auth
async function deleteBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if banner exists
    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banner not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete banner (translations will be deleted automatically due to cascade)
    await prisma.banner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Banner deletion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete banner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers without auth
export const GET = getBanner;
export const PUT = updateBanner;
export const DELETE = deleteBanner;