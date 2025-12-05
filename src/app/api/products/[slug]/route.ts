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
    const product = await prisma.products.findFirst({
      where: {
        slug: slug,
        status: 'active' // Only active products for public API
      },
      include: {
        product_translations: true,
        categories: {
          select: {
            id: true,
            slug: true,
            name: true,
            image_url: true,
            category_translations: {
              select: {
                name: true,
                language_code: true
              }
            }
          }
        },
        partners: {
          select: {
            id: true,
            name: true,
            logo_url: true,
            website_url: true
          }
        },
        product_media: {
          orderBy: [
            { is_primary: 'desc' },
            { sort_order: 'asc' }
          ],
          select: {
            id: true,
            url: true,
            type: true,
            is_primary: true,
            alt_text: true,
            title: true,
            sort_order: true
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
    const translation = product.product_translations.find(t => t.language_code === locale);
    const fallbackTranslation = product.product_translations.find(t => t.language_code === 'fr');

    const categoryTranslation = product.categories?.category_translations.find(t => t.language_code === locale);
    const categoryFallback = product.categories?.category_translations.find(t => t.language_code === 'fr');

    // Transform the product data
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      referenceFournisseur: product.reference_fournisseur,
      constructeur: product.constructeur,
      status: product.status,
      isFeatured: product.is_featured,
      pdfBrochureUrl: product.pdf_brochure_url,
      createdAt: product.created_at,
      updatedAt: product.updated_at,

      // Localized content
      translations: product.product_translations.map(t => ({
        languageCode: t.language_code,
        nom: t.nom,
        description: t.description,
        ficheTechnique: t.fiche_technique
      })),

      // Category info
      category: product.categories ? {
        id: product.categories.id,
        name: categoryTranslation?.name || categoryFallback?.name || product.categories.name,
        slug: product.categories.slug,
        imageUrl: product.categories.image_url
      } : null,

      // Partner/Manufacturer info
      partner: product.partners ? {
        id: product.partners.id,
        name: product.partners.name,
        logoUrl: product.partners.logo_url,
        websiteUrl: product.partners.website_url
      } : null,

      // Media files
      media: product.product_media.map(media => ({
        id: media.id,
        url: media.url,
        type: media.type,
        isPrimary: media.is_primary,
        altText: media.alt_text,
        title: media.title,
        sortOrder: media.sort_order
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