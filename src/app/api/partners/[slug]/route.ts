/**
 * Individual Partner API Routes
 *
 * Handles CRUD operations for specific partners.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteContext {
  params: { slug: string };
}

/**
 * GET /api/partners/[slug]
 *
 * Retrieve a specific partner by slug.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'fr';

    const partner = await prisma.partners.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug }
        ],
        status: 'active'
      },
      include: {
        partner_translations: {
          where: { language_code: locale }
        }
      }
    });

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Partner not found'
          }
        },
        { status: 404 }
      );
    }

    // Get translation or fallback to default name
    const translation = partner.partner_translations[0];
    const partnerName = translation?.name || partner.name;
    const partnerDescription = translation?.description || partner.description;

    // Get product count separately to avoid timeout
    const productCount = await prisma.products.count({
      where: {
        partner_id: partner.id,
        status: 'active'
      }
    });

    const transformedData = {
      id: partner.id,
      name: partnerName,
      slug: partner.slug,
      description: partnerDescription,
      logoUrl: partner.logo_url,
      websiteUrl: partner.website_url,
      isFeatured: partner.is_featured,
      productCount: productCount,
      type: partner.type,
      status: partner.status
    };

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Error fetching partner:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch partner'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/partners/[slug]
 *
 * Update a specific partner.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { name, description, websiteUrl, logoUrl, isFeatured, status } = body;

    const partner = await prisma.partners.update({
      where: { slug },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(websiteUrl !== undefined && { website_url: websiteUrl }),
        ...(logoUrl !== undefined && { logo_url: logoUrl }),
        ...(isFeatured !== undefined && { is_featured: isFeatured }),
        ...(status !== undefined && { status }),
      },
      include: {
        partner_translations: true
      }
    });

    return NextResponse.json({
      success: true,
      data: partner
    });

  } catch (error) {
    console.error('Error updating partner:', error);

    // Handle not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Partner not found'
          }
        },
        { status: 404 }
      );
    }

    // Handle unique constraint violations
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: 'Partner with this slug already exists'
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update partner'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partners/[slug]
 *
 * Delete a specific partner.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    // First find the partner to get its ID
    const partnerToDelete = await prisma.partners.findUnique({
      where: { slug }
    });

    if (!partnerToDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Partner not found'
          }
        },
        { status: 404 }
      );
    }

    // Check for existing relationships
    const productCount = await prisma.products.count({
      where: {
        partner_id: partnerToDelete.id,
        status: 'active'
      }
    });

    if (productCount > 0 && !force) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_PRODUCTS',
            message: 'Cannot delete partner with associated products',
            details: `Use force=true to delete anyway, which will unlink ${productCount} products`
          }
        },
        { status: 409 }
      );
    }

    // If forced, update products to remove partner association
    if (force && productCount > 0) {
      await prisma.products.updateMany({
        where: { partner_id: partnerToDelete.id },
        data: { partner_id: null }
      });
    }

    const partner = await prisma.partners.delete({
      where: { slug }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        slug: partner.slug,
        deleted: true
      },
      meta: {
        forced: force,
        hadProducts: productCount > 0
      }
    });

  } catch (error) {
    console.error('Error deleting partner:', error);

    // Handle not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Partner not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete partner'
        }
      },
      { status: 500 }
    );
  }
}