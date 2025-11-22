import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/banners/[id] - Get single banner
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
          ...(bannerData.title && { title: bannerData.title }),
          ...(bannerData.subtitle !== undefined && { subtitle: bannerData.subtitle || null }),
          ...(bannerData.description !== undefined && { description: bannerData.description || null }),
          ...(bannerData.imageUrl !== undefined && { imageUrl: bannerData.imageUrl || null }),
          ...(bannerData.backgroundUrl !== undefined && { backgroundUrl: bannerData.backgroundUrl || null }),
          ...(bannerData.ctaText !== undefined && { ctaText: bannerData.ctaText || null }),
          ...(bannerData.ctaUrl !== undefined && { ctaUrl: bannerData.ctaUrl || null }),
          ...(bannerData.ctaStyle && { ctaStyle: bannerData.ctaStyle }),
          ...(bannerData.position && { position: bannerData.position }),
          ...(bannerData.layout && { layout: bannerData.layout }),
          ...(bannerData.textAlign && { textAlign: bannerData.textAlign }),
          ...(bannerData.overlayOpacity !== undefined && { overlayOpacity: bannerData.overlayOpacity }),
          ...(bannerData.sortOrder !== undefined && { sortOrder: bannerData.sortOrder }),
          ...(bannerData.isActive !== undefined && { isActive: bannerData.isActive }),
          ...(bannerData.startDate !== undefined && { 
            startDate: bannerData.startDate ? new Date(bannerData.startDate) : null 
          }),
          ...(bannerData.endDate !== undefined && { 
            endDate: bannerData.endDate ? new Date(bannerData.endDate) : null 
          }),
        },
      });

      // Update translations if provided
      if (bannerData.translations) {
        // Update French translation
        if (bannerData.translations.fr) {
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

// DELETE /api/admin/banners/[id] - Delete banner
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

// Export handlers
export const GET = withAuth(getBanner);
export const PUT = withAuth(updateBanner);
export const DELETE = withAuth(deleteBanner);