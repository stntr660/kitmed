import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/banners/[id] - Get single banner
async function getBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const banner = await prisma.banners.findUnique({
      where: { id: params.id },
      include: {
        banner_translations: true,
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

    // Transform response to camelCase for frontend compatibility
    const transformedBanner = banner ? {
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
    } : null;

    return NextResponse.json({
      success: true,
      data: transformedBanner,
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

// PUT /api/admin/banners/[id] - Update banner
const updateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  backgroundUrl: z.string().optional().or(z.literal('')),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional().or(z.literal('')),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']).optional(),
  position: z.string().optional(),
  layout: z.enum(['split', 'centered', 'full-width']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  translations: z.object({
    fr: z.object({
      title: z.string().min(1, 'French title is required').optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      ctaText: z.string().optional(),
    }).optional(),
    en: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      ctaText: z.string().optional(),
    }).optional(),
  }).optional(),
});

async function updateBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = updateBannerSchema.safeParse(body);
    if (!validation.success) {
      console.error('Banner update validation error:', {
        bannerId: params.id,
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

    // Check if banner exists
    const existingBanner = await prisma.banners.findUnique({
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
      const banner = await tx.banners.update({
        where: { id: params.id },
        data: {
          ...(bannerData.title && { title: bannerData.title }),
          ...(bannerData.subtitle !== undefined && { subtitle: bannerData.subtitle || null }),
          ...(bannerData.description !== undefined && { description: bannerData.description || null }),
          ...(bannerData.imageUrl !== undefined && { image_url: bannerData.imageUrl || null }),
          ...(bannerData.backgroundUrl !== undefined && { background_url: bannerData.backgroundUrl || null }),
          ...(bannerData.ctaText !== undefined && { cta_text: bannerData.ctaText || null }),
          ...(bannerData.ctaUrl !== undefined && { cta_url: bannerData.ctaUrl || null }),
          ...(bannerData.ctaStyle && { cta_style: bannerData.ctaStyle }),
          ...(bannerData.position && { position: bannerData.position }),
          ...(bannerData.layout && { layout: bannerData.layout }),
          ...(bannerData.textAlign && { text_align: bannerData.textAlign }),
          ...(bannerData.overlayOpacity !== undefined && { overlay_opacity: bannerData.overlayOpacity }),
          ...(bannerData.sortOrder !== undefined && { sort_order: bannerData.sortOrder }),
          ...(bannerData.isActive !== undefined && { is_active: bannerData.isActive }),
          ...(bannerData.startDate !== undefined && {
            start_date: bannerData.startDate ? new Date(bannerData.startDate) : null
          }),
          ...(bannerData.endDate !== undefined && {
            end_date: bannerData.endDate ? new Date(bannerData.endDate) : null
          }),
        },
      });

      // Update translations if provided
      if (bannerData.translations) {
        // Update French translation
        if (bannerData.translations.fr) {
          await tx.banner_translations.upsert({
            where: {
              banner_id_language_code: {
                banner_id: params.id,
                language_code: 'fr',
              },
            },
            create: {
              banner_id: params.id,
              language_code: 'fr',
              title: bannerData.translations.fr.title || existingBanner.title,
              subtitle: bannerData.translations.fr.subtitle || null,
              description: bannerData.translations.fr.description || null,
              ctaText: bannerData.translations.fr.ctaText || null,
            },
            update: {
              ...(bannerData.translations.fr.title && { title: bannerData.translations.fr.title }),
              ...(bannerData.translations.fr.subtitle !== undefined && {
                subtitle: bannerData.translations.fr.subtitle || null
              }),
              ...(bannerData.translations.fr.description !== undefined && {
                description: bannerData.translations.fr.description || null
              }),
              ...(bannerData.translations.fr.ctaText !== undefined && {
                ctaText: bannerData.translations.fr.ctaText || null
              }),
            },
          });
        }

        // Update English translation
        if (bannerData.translations.en) {
          await tx.banner_translations.upsert({
            where: {
              banner_id_language_code: {
                banner_id: params.id,
                language_code: 'en',
              },
            },
            create: {
              banner_id: params.id,
              language_code: 'en',
              title: bannerData.translations.en.title || existingBanner.title,
              subtitle: bannerData.translations.en.subtitle || null,
              description: bannerData.translations.en.description || null,
              ctaText: bannerData.translations.en.ctaText || null,
            },
            update: {
              ...(bannerData.translations.en.title && { title: bannerData.translations.en.title }),
              ...(bannerData.translations.en.subtitle !== undefined && {
                subtitle: bannerData.translations.en.subtitle || null
              }),
              ...(bannerData.translations.en.description !== undefined && {
                description: bannerData.translations.en.description || null
              }),
              ...(bannerData.translations.en.ctaText !== undefined && {
                ctaText: bannerData.translations.en.ctaText || null
              }),
            },
          });
        }
      }

      return tx.banners.findUnique({
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

// DELETE /api/admin/banners/[id] - Delete banner
async function deleteBanner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if banner exists
    const existingBanner = await prisma.banners.findUnique({
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
    await prisma.banners.delete({
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

// Export handlers
export const GET = withAuth(getBanner);
export const PUT = withAuth(updateBanner);
export const DELETE = withAuth(deleteBanner);