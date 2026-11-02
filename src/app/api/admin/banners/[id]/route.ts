import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// GET /api/admin/banners/[id] - Get single banner
async function getBanner(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const banner = await prisma.banners.findUnique({
      where: { id },
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
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
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

async function updateBanner(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bannerId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateBannerSchema.safeParse(body);
    if (!validation.success) {
      console.error('Banner update validation error:', {
        bannerId,
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
      where: { id: bannerId },
      include: { banner_translations: true },
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
        where: { id: bannerId },
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
          const frTitle = bannerData.translations.fr.title || existingBanner.title;
          await tx.banner_translations.upsert({
            where: {
              banner_id_language_code: {
                banner_id: bannerId,
                language_code: 'fr',
              },
            },
            create: {
              id: randomUUID(),
              banner_id: bannerId,
              language_code: 'fr',
              title: frTitle,
              subtitle: bannerData.translations.fr.subtitle || null,
              description: bannerData.translations.fr.description || null,
              cta_text: bannerData.translations.fr.ctaText || null,
            },
            update: {
              title: frTitle,
              subtitle: bannerData.translations.fr.subtitle || null,
              description: bannerData.translations.fr.description || null,
              cta_text: bannerData.translations.fr.ctaText || null,
            },
          });
        }

        // Update English translation
        if (bannerData.translations.en) {
          const enTitle = bannerData.translations.en.title || existingBanner.title;
          await tx.banner_translations.upsert({
            where: {
              banner_id_language_code: {
                banner_id: bannerId,
                language_code: 'en',
              },
            },
            create: {
              id: randomUUID(),
              banner_id: bannerId,
              language_code: 'en',
              title: enTitle,
              subtitle: bannerData.translations.en.subtitle || null,
              description: bannerData.translations.en.description || null,
              cta_text: bannerData.translations.en.ctaText || null,
            },
            update: {
              title: enTitle,
              subtitle: bannerData.translations.en.subtitle || null,
              description: bannerData.translations.en.description || null,
              cta_text: bannerData.translations.en.ctaText || null,
            },
          });
        }
      }

      return tx.banners.findUnique({
        where: { id: bannerId },
        include: { banner_translations: true },
      });
    });

    // Transform response to camelCase for frontend compatibility
    const transformedBanner = updatedBanner ? {
      id: updatedBanner.id,
      title: updatedBanner.title,
      subtitle: updatedBanner.subtitle,
      description: updatedBanner.description,
      imageUrl: updatedBanner.image_url,
      backgroundUrl: updatedBanner.background_url,
      ctaText: updatedBanner.cta_text,
      ctaUrl: updatedBanner.cta_url,
      ctaStyle: updatedBanner.cta_style,
      position: updatedBanner.position,
      layout: updatedBanner.layout,
      textAlign: updatedBanner.text_align,
      overlayOpacity: updatedBanner.overlay_opacity,
      sortOrder: updatedBanner.sort_order,
      isActive: updatedBanner.is_active,
      startDate: updatedBanner.start_date,
      endDate: updatedBanner.end_date,
      createdAt: updatedBanner.created_at,
      updatedAt: updatedBanner.updated_at,
      translations: updatedBanner.banner_translations?.map((t: any) => ({
        id: t.id,
        bannerId: t.banner_id,
        languageCode: t.language_code,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        ctaText: t.cta_text,
      })) || [],
    } : null;

    return NextResponse.json({
      success: true,
      data: transformedBanner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error: any) {
    console.error('Banner update error:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });

    // Extract detailed error info
    let errorMessage = 'Failed to update banner';
    let errorDetails = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || error.message;
    }

    // Handle Prisma-specific errors
    if (error?.code) {
      errorDetails = `Prisma error ${error.code}: ${error.message}`;
      if (error.meta) {
        errorDetails += ` (${JSON.stringify(error.meta)})`;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error?.code || 'INTERNAL_ERROR',
          message: errorMessage,
          details: errorDetails,
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
async function deleteBanner(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bannerId } = await params;
    // Check if banner exists
    const existingBanner = await prisma.banners.findUnique({
      where: { id: bannerId },
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
      where: { id: bannerId },
    });

    return NextResponse.json({
      success: true,
      data: { id: bannerId },
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