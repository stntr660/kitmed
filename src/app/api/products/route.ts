import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const query = searchParams.get('query');
    const category = searchParams.get('category');
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
        { referenceFournisseur: { contains: query } },
        { constructeur: { contains: query } },
        { 
          translations: {
            some: {
              nom: { contains: query }
            }
          }
        },
        {
          translations: {
            some: {
              description: { contains: query }
            }
          }
        }
      ];
    }

    // Category filter
    if (category) {
      where.categoryId = category;
    }

    // Status filter (for potential future use)
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          translations: true,
          category: {
            select: {
              id: true,
              slug: true,
              imageUrl: true,
              translations: {
                select: {
                  name: true,
                  languageCode: true
                }
              }
            }
          },
          media: {
            orderBy: {
              isPrimary: 'desc'
            },
            take: 5,
            select: {
              id: true,
              url: true,
              type: true,
              isPrimary: true,
              altText: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform the data to return localized strings
    const transformedItems = items.map(product => {
      const translation = product.translations.find(t => t.languageCode === locale);
      const fallbackTranslation = product.translations.find(t => t.languageCode === 'fr');
      
      const categoryTranslation = product.category?.translations.find(t => t.languageCode === locale);
      const categoryFallback = product.category?.translations.find(t => t.languageCode === 'fr');

      return {
        id: product.id,
        slug: product.slug,
        referenceFournisseur: product.referenceFournisseur,
        constructeur: product.constructeur,
        status: product.status,
        isFeatured: product.isFeatured,
        pdfBrochureUrl: product.pdfBrochureUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Return localized strings, not objects
        name: translation?.nom || fallbackTranslation?.nom || 'Unnamed Product',
        description: translation?.description || fallbackTranslation?.description || '',
        shortDescription: (translation?.description || fallbackTranslation?.description || '').substring(0, 150),
        category: product.category ? {
          id: product.category.id,
          name: categoryTranslation?.name || categoryFallback?.name || 'Uncategorized',
          slug: product.category.slug,
          imageUrl: product.category.imageUrl
        } : null,
        manufacturer: {
          name: product.constructeur || 'Unknown Manufacturer'
        },
        discipline: product.category ? {
          name: categoryTranslation?.name || categoryFallback?.name || 'Discipline',
          color: '#3B82F6',
          imageUrl: product.category.imageUrl
        } : {
          name: 'Unspecified',
          color: '#6B7280',
          imageUrl: null
        },
        // Transform media
        media: product.media.map(media => ({
          id: media.id,
          url: media.url,
          type: media.type,
          isPrimary: media.isPrimary,
          altText: media.altText
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