import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    // Find product by slug
    const product = await prisma.product.findFirst({
      where: {
        slug: slug,
        status: 'active' // Only active products for public API
      },
      include: {
        translations: true,
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
            imageUrl: true,
            translations: {
              select: {
                name: true,
                languageCode: true
              }
            }
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            websiteUrl: true
          }
        },
        media: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ],
          select: {
            id: true,
            url: true,
            type: true,
            isPrimary: true,
            altText: true,
            title: true,
            sortOrder: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    // Get translations for the requested locale with fallback
    const translation = product.translations.find(t => t.languageCode === locale);
    const fallbackTranslation = product.translations.find(t => t.languageCode === 'fr');
    
    const categoryTranslation = product.category?.translations.find(t => t.languageCode === locale);
    const categoryFallback = product.category?.translations.find(t => t.languageCode === 'fr');

    // Transform the product data
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      referenceFournisseur: product.referenceFournisseur,
      constructeur: product.constructeur,
      status: product.status,
      isFeatured: product.isFeatured,
      pdfBrochureUrl: product.pdfBrochureUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Localized content
      translations: product.translations.map(t => ({
        languageCode: t.languageCode,
        nom: t.nom,
        description: t.description,
        ficheTechnique: t.ficheTechnique
      })),
      
      // Category info
      category: product.category ? {
        id: product.category.id,
        name: categoryTranslation?.name || categoryFallback?.name || product.category.name,
        slug: product.category.slug,
        imageUrl: product.category.imageUrl
      } : null,
      
      // Partner/Manufacturer info
      partner: product.partner ? {
        id: product.partner.id,
        name: product.partner.name,
        logoUrl: product.partner.logoUrl,
        websiteUrl: product.partner.websiteUrl
      } : null,
      
      // Media files
      media: product.media.map(media => ({
        id: media.id,
        url: media.url,
        type: media.type,
        isPrimary: media.isPrimary,
        altText: media.altText,
        title: media.title,
        sortOrder: media.sortOrder
      }))
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error('Product detail error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve product',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}