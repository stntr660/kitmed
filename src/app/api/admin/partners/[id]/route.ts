import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/partners/[id] - Get single partner
async function getPartner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        translations: true,
      },
    });

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partner not found',
          },
        },
        { status: 404 }
      );
    }

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      type: partner.type,
      status: partner.status,
      featured: partner.isFeatured,
      sortOrder: partner.sortOrder,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      nom: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.name || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.name || '',
      },
      description: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      translations: partner.translations,
    };

    return NextResponse.json({
      success: true,
      data: transformedPartner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Partner fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch partner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/partners/[id] - Update partner
const updatePartnerSchema = z.object({
  nom: z.object({
    fr: z.string().min(1, 'Nom en français est requis'),
    en: z.string().optional(), // English is optional for French-first approach
  }),
  description: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  type: z.enum(['manufacturer', 'distributor', 'service', 'technology']).default('manufacturer'),
  status: z.enum(['active', 'inactive']).default('active'),
  featured: z.boolean().default(false),
});

async function updatePartner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = updatePartnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid partner data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const partnerData = validation.data;

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: { translations: true },
    });

    if (!existingPartner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partner not found',
          },
        },
        { status: 404 }
      );
    }

    // Generate new slug if French name changed
    const baseSlug = partnerData.nom.fr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Only add timestamp if the slug would conflict
    let slug = baseSlug;
    const existingWithSlug = await prisma.partner.findFirst({
      where: { 
        slug: baseSlug,
        id: { not: params.id }
      }
    });
    
    if (existingWithSlug) {
      const timestamp = Date.now().toString().slice(-6);
      slug = `${baseSlug}-${timestamp}`;
    }

    // Update partner in database
    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        name: partnerData.nom.fr, // Use French name as primary
        slug,
        websiteUrl: partnerData.websiteUrl || null,
        logoUrl: partnerData.logoUrl || null,
        type: partnerData.type,
        status: partnerData.status,
        isFeatured: partnerData.featured,
        translations: {
          deleteMany: {}, // Delete existing translations
          create: [
            {
              languageCode: 'fr',
              name: partnerData.nom.fr,
              description: partnerData.description?.fr || null,
            },
            ...(partnerData.nom.en ? [{
              languageCode: 'en',
              name: partnerData.nom.en,
              description: partnerData.description?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        translations: true,
      },
    });

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      type: partner.type,
      status: partner.status,
      featured: partner.isFeatured,
      sortOrder: partner.sortOrder,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      nom: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.name || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.name || '',
      },
      description: {
        fr: partner.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: partner.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      translations: partner.translations,
    };

    return NextResponse.json({
      success: true,
      data: transformedPartner,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Partner update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update partner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/partners/[id] - Delete partner
async function deletePartner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!existingPartner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partner not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete partner (cascading deletes will handle translations)
    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Partner deletion error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete partner',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const GET = withAuth(getPartner);
export const PUT = withAuth(updatePartner);
export const DELETE = withAuth(deletePartner);