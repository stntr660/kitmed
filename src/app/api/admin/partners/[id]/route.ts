import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// GET /api/admin/partners/[id] - Get single partner
async function getPartner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const partner = await prisma.partners.findUnique({
      where: { id: params.id },
      include: {
        partner_translations: true,
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
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      defaultPdfUrl: partner.default_pdf_url,
      type: partner.type,
      status: partner.status,
      featured: partner.is_featured,
      sortOrder: partner.sort_order,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      nom: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.name || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.name || '',
      },
      description: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.description || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.description || '',
      },
      translations: partner.partner_translations,
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
  defaultPdfUrl: z.string().optional(),
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
    const existingPartner = await prisma.partners.findUnique({
      where: { id: params.id },
      include: { partner_translations: true },
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
    const existingWithSlug = await prisma.partners.findFirst({
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
    const partner = await prisma.partners.update({
      where: { id: params.id },
      data: {
        name: partnerData.nom.fr, // Use French name as primary
        slug,
        website_url: partnerData.websiteUrl || null,
        logo_url: partnerData.logoUrl || null,
        default_pdf_url: partnerData.defaultPdfUrl || null,
        type: partnerData.type,
        status: partnerData.status,
        is_featured: partnerData.featured,
        partner_translations: {
          deleteMany: {}, // Delete existing translations
          create: [
            {
              id: randomUUID(),
              language_code: 'fr',
              name: partnerData.nom.fr,
              description: partnerData.description?.fr || null,
            },
            ...(partnerData.nom.en ? [{
              id: randomUUID(),
              language_code: 'en',
              name: partnerData.nom.en,
              description: partnerData.description?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        partner_translations: true,
      },
    });

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      defaultPdfUrl: partner.default_pdf_url,
      type: partner.type,
      status: partner.status,
      featured: partner.is_featured,
      sortOrder: partner.sort_order,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      nom: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.name || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.name || '',
      },
      description: {
        fr: partner.partner_translations.find(t => t.language_code === 'fr')?.description || '',
        en: partner.partner_translations.find(t => t.language_code === 'en')?.description || '',
      },
      translations: partner.partner_translations,
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

// PATCH /api/admin/partners/[id] - Partial update partner (for quick updates like featured status)
const patchPartnerSchema = z.object({
  isFeatured: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

async function patchPartner(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = patchPartnerSchema.safeParse(body);
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

    // Map field names to database columns
    const updateData: any = {};
    if (validation.data.isFeatured !== undefined) {
      updateData.is_featured = validation.data.isFeatured;
    }
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status;
    }

    // Check if partner exists
    const existingPartner = await prisma.partners.findUnique({
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

    // Update partner with only provided fields
    const partner = await prisma.partners.update({
      where: { id: params.id },
      data: updateData,
      include: {
        partner_translations: true,
      },
    });

    // Transform the response to match expected format
    const transformedPartner = {
      id: partner.id,
      slug: partner.slug,
      name: partner.name,
      websiteUrl: partner.website_url,
      logoUrl: partner.logo_url,
      defaultPdfUrl: partner.default_pdf_url,
      type: partner.type,
      status: partner.status,
      isFeatured: partner.is_featured,
      sortOrder: partner.sort_order,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      translations: partner.partner_translations,
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
    console.error('Partner patch error:', error);

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
    const existingPartner = await prisma.partners.findUnique({
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
    await prisma.partners.delete({
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
export const PATCH = withAuth(patchPartner);
export const DELETE = withAuth(deletePartner);