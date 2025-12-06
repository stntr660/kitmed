import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const manufacturer = searchParams.get('manufacturer');
    const partner = searchParams.get('partner');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const status = searchParams.getAll('status');

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Build where clause
    const where: any = {
      status: 'active', // Only active products for public API
    };

    // Text search in product translations
    if (query) {
      where.OR = [
        { reference_fournisseur: { contains: query } },
        { constructeur: { contains: query } },
        {
          product_translations: {
            some: {
              nom: { contains: query }
            }
          }
        },
        {
          product_translations: {
            some: {
              description: { contains: query }
            }
          }
        }
      ];
    }

    // Category filter
    if (category) {
      where.category_id = category;
    }

    // Manufacturer filter
    if (manufacturer) {
      where.partner_id = manufacturer;
    }

    // Partner filter
    if (partner) {
      where.partner_id = partner;
    }

    // Featured products filter
    if (featured === 'true') {
      where.is_featured = true;
    }

    // Status filter (for potential future use)
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: {
          product_translations: true,
          categories: {
            select: {
              id: true,
              slug: true,
              image_url: true,
              category_translations: {
                select: {
                  name: true,
                  language_code: true
                }
              }
            }
          },
          product_media: {
            orderBy: {
              is_primary: 'desc'
            },
            take: 5,
            select: {
              id: true,
              url: true,
              type: true,
              is_primary: true,
              alt_text: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      prisma.products.count({ where }),
    ]);

    // Transform the data to return localized strings
    const transformedItems = items.map(product => {
      const translation = product.product_translations.find(t => t.language_code === locale);
      const fallbackTranslation = product.product_translations.find(t => t.language_code === 'fr');

      const categoryTranslation = product.categories?.category_translations.find(t => t.language_code === locale);
      const categoryFallback = product.categories?.category_translations.find(t => t.language_code === 'fr');

      return {
        id: product.id,
        slug: product.slug,
        referenceFournisseur: product.reference_fournisseur,
        constructeur: product.constructeur,
        status: product.status,
        isFeatured: product.is_featured,
        pdfBrochureUrl: product.pdf_brochure_url,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        // Return localized strings, not objects
        name: translation?.nom || fallbackTranslation?.nom || 'Unnamed Product',
        description: translation?.description || fallbackTranslation?.description || '',
        shortDescription: (translation?.description || fallbackTranslation?.description || '').substring(0, 150),
        category: product.categories ? {
          id: product.categories.id,
          name: categoryTranslation?.name || categoryFallback?.name || 'Uncategorized',
          slug: product.categories.slug,
          imageUrl: product.categories.image_url
        } : null,
        manufacturer: {
          name: product.constructeur || 'Unknown Manufacturer'
        },
        discipline: product.categories ? {
          name: categoryTranslation?.name || categoryFallback?.name || 'Discipline',
          color: '#3B82F6',
          imageUrl: product.categories.image_url
        } : {
          name: 'Unspecified',
          color: '#6B7280',
          imageUrl: null
        },
        // Transform media
        media: product.product_media.map(media => ({
          id: media.id,
          url: media.url,
          type: media.type,
          isPrimary: media.is_primary,
          altText: media.alt_text
        }))
      };
    });

    const result = {
      items: transformedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Products list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve products',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}