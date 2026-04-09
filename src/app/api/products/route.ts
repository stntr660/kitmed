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

    // Smart fuzzy search - case-insensitive search across multiple fields
    if (query) {
      where.OR = [
        // Search by reference (SKU)
        { reference_fournisseur: { contains: query, mode: 'insensitive' } },
        // Search by manufacturer/constructeur
        { constructeur: { contains: query, mode: 'insensitive' } },
        // Search in product name (all languages)
        {
          product_translations: {
            some: {
              nom: { contains: query, mode: 'insensitive' }
            }
          }
        },
        // Search in product description (all languages)
        {
          product_translations: {
            some: {
              description: { contains: query, mode: 'insensitive' }
            }
          }
        },
        // Search by brand/manufacturer name via partner relation
        {
          partners: {
            name: { contains: query, mode: 'insensitive' }
          }
        },
        // Search in partner translations (multilingual brand names)
        {
          partners: {
            partner_translations: {
              some: {
                name: { contains: query, mode: 'insensitive' }
              }
            }
          }
        },
        // Search in category name
        {
          categories: {
            category_translations: {
              some: {
                name: { contains: query, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    // Category filter - handle both UUID and slug, include all descendant categories
    if (category) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);

      let rootCategoryId: string | null = null;

      if (isUUID) {
        rootCategoryId = category;
      } else {
        const categoryRecord = await prisma.categories.findFirst({
          where: {
            OR: [
              { slug: category, is_active: true },
              { id: category, is_active: true }
            ]
          }
        });
        if (categoryRecord) {
          rootCategoryId = categoryRecord.id;
        }
      }

      if (rootCategoryId) {
        // Collect all descendant category IDs (3 levels deep)
        const level1 = await prisma.categories.findMany({
          where: { parent_id: rootCategoryId, is_active: true },
          select: { id: true }
        });
        const level1Ids = level1.map(c => c.id);

        const level2 = level1Ids.length > 0 ? await prisma.categories.findMany({
          where: { parent_id: { in: level1Ids }, is_active: true },
          select: { id: true }
        }) : [];
        const level2Ids = level2.map(c => c.id);

        const level3 = level2Ids.length > 0 ? await prisma.categories.findMany({
          where: { parent_id: { in: level2Ids }, is_active: true },
          select: { id: true }
        }) : [];
        const level3Ids = level3.map(c => c.id);

        const allCategoryIds = [rootCategoryId, ...level1Ids, ...level2Ids, ...level3Ids];
        where.category_id = { in: allCategoryIds };
      }
    }

    // Manufacturer filter - handle both UUID and slug
    if (manufacturer) {
      // Check if it's a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(manufacturer);
      
      if (isUUID) {
        where.partner_id = manufacturer;
      } else {
        // It's a slug, find the partner first
        const partner = await prisma.partners.findUnique({
          where: { slug: manufacturer }
        });
        if (partner) {
          where.partner_id = partner.id;
        }
      }
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

    // Ophthalmology-specific brand ordering
    const OPHTHALMOLOGY_PRIORITY_SLUGS = [
      'nidek', 'haag-streit', 'moria', 'fci', 'keeler',
      'medicontur', 'medicontour', 'ophtec', 'rheon',
      'mediworks', 'espansione', 'espansionne', 'omni', 'omnilens'
    ];
    const OPHTHALMOLOGY_SLUGS = ['ophtalmologie', 'ophthalmology'];

    // Determine if filtering by ophthalmology category
    let isOphthalmologyFilter = false;
    if (category) {
      const categoryIds = where.category_id?.in as string[] | undefined;
      if (categoryIds) {
        const cats = await prisma.categories.findMany({ where: { id: { in: categoryIds.slice(0, 5) } }, select: { slug: true, parent_id: true } });
        isOphthalmologyFilter = cats.some(c => OPHTHALMOLOGY_SLUGS.includes(c.slug));
        if (!isOphthalmologyFilter) {
          // Check parents
          const parentIds = cats.map(c => c.parent_id).filter(Boolean) as string[];
          if (parentIds.length > 0) {
            const parents = await prisma.categories.findMany({ where: { id: { in: parentIds } }, select: { slug: true, parent_id: true } });
            isOphthalmologyFilter = parents.some(c => OPHTHALMOLOGY_SLUGS.includes(c.slug));
            if (!isOphthalmologyFilter) {
              const gpIds = parents.map(c => c.parent_id).filter(Boolean) as string[];
              if (gpIds.length > 0) {
                const gps = await prisma.categories.findMany({ where: { id: { in: gpIds } }, select: { slug: true } });
                isOphthalmologyFilter = gps.some(c => OPHTHALMOLOGY_SLUGS.includes(c.slug));
              }
            }
          }
        }
      }
    }

    // Execute queries - fetch all matching products for priority sorting, then paginate in JS
    const [allItems, total] = await Promise.all([
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
          },
          partners: {
            select: {
              id: true,
              name: true,
              slug: true,
              default_pdf_url: true,
              partner_translations: {
                select: {
                  name: true,
                  language_code: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.products.count({ where }),
    ]);

    // Sort: for ophthalmology categories, sort by brand priority; otherwise keep DB order
    if (isOphthalmologyFilter) {
      allItems.sort((a, b) => {
        const aSlug = (a.partners?.slug || '').toLowerCase();
        const bSlug = (b.partners?.slug || '').toLowerCase();
        const aIdx = OPHTHALMOLOGY_PRIORITY_SLUGS.findIndex(s => aSlug.includes(s));
        const bIdx = OPHTHALMOLOGY_PRIORITY_SLUGS.findIndex(s => bSlug.includes(s));
        if (aIdx !== -1 && bIdx === -1) return -1;
        if (aIdx === -1 && bIdx !== -1) return 1;
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        return 0;
      });
    }

    // Paginate after sorting
    const items = allItems.slice(skip, skip + take);

    // Transform the data to return localized strings
    const transformedItems = items.map(product => {
      const translation = product.product_translations.find(t => t.language_code === locale);
      const fallbackTranslation = product.product_translations.find(t => t.language_code === 'fr');

      const categoryTranslation = product.categories?.category_translations.find(t => t.language_code === locale);
      const categoryFallback = product.categories?.category_translations.find(t => t.language_code === 'fr');

      // Get manufacturer name from partner translations or fallback to partner name
      const partnerTranslation = product.partners?.partner_translations?.find(t => t.language_code === locale);
      const partnerFallback = product.partners?.partner_translations?.find(t => t.language_code === 'fr');
      const manufacturerName = partnerTranslation?.name || partnerFallback?.name || product.partners?.name || product.constructeur || 'Unknown Manufacturer';

      // Determine effective PDF URL - check multiple sources
      const productPdfUrl = product.pdf_brochure_url;
      const mediaPdfUrl = product.product_media.find(m => m.type === 'pdf')?.url;
      const manufacturerPdfUrl = product.partners?.default_pdf_url;
      
      const effectivePdfUrl = productPdfUrl || mediaPdfUrl || manufacturerPdfUrl || null;
      const pdfSource = productPdfUrl ? 'product' : 
                       mediaPdfUrl ? 'product' : 
                       manufacturerPdfUrl ? 'manufacturer' : null;

      return {
        id: product.id,
        slug: product.slug,
        referenceFournisseur: product.reference_fournisseur,
        constructeur: product.constructeur,
        status: product.status,
        isFeatured: product.is_featured,
        pdfBrochureUrl: effectivePdfUrl,
        pdfSource: pdfSource,
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
          name: manufacturerName
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