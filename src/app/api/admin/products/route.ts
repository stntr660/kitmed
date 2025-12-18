import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { AdminSearchFilters } from '@/types/admin';
import { z } from 'zod';

// GET /api/admin/products - List products with filters
async function getProducts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      query: searchParams.get('query') || undefined,
      slug: searchParams.get('slug') || undefined,
      status: searchParams.getAll('status'),
      category: searchParams.getAll('category'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build where clause
    const where: any = {};

    // Slug filter (exact match)
    if (filters.slug) {
      where.slug = filters.slug;
    }

    // Text search in product translations
    if (filters.query) {
      where.OR = [
        { reference_fournisseur: { contains: filters.query } },
        { constructeur: { contains: filters.query } },
        {
          product_translations: {
            some: {
              nom: { contains: filters.query }
            }
          }
        },
        {
          product_translations: {
            some: {
              description: { contains: filters.query }
            }
          }
        }
      ];
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      where.category_id = { in: filters.category };
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
            take: 5, // Limit to first 5 media files
            select: {
              id: true,
              url: true,
              type: true,
              is_primary: true
            }
          },
          _count: {
            select: {
              product_media: true
            }
          }
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take,
      }),
      prisma.products.count({ where }),
    ]);

    // Transform the data to match expected format (camelCase for frontend)
    const transformedItems = items.map(product => ({
      id: product.id,
      referenceFournisseur: product.reference_fournisseur,
      reference_fournisseur: product.reference_fournisseur, // Keep snake_case for backwards compatibility
      constructeur: product.constructeur,
      slug: product.slug,
      categoryId: product.category_id,
      category_id: product.category_id, // Keep snake_case for backwards compatibility
      status: product.status,
      featured: product.is_featured,
      pdfBrochureUrl: product.pdf_brochure_url,
      pdf_brochure_url: product.pdf_brochure_url, // Keep snake_case for backwards compatibility
      createdAt: product.created_at,
      created_at: product.created_at, // Keep snake_case for backwards compatibility
      updatedAt: product.updated_at,
      updated_at: product.updated_at, // Keep snake_case for backwards compatibility
      // Create a name field from French translation for compatibility
      name: product.product_translations.find(t => t.language_code === 'fr')?.nom ||
            product.product_translations[0]?.nom ||
            'Unnamed Product',
      // Add shortDescription for compatibility
      shortDescription: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.description?.substring(0, 150) || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.description?.substring(0, 150) || '',
      },
      // Add sku field for compatibility
      sku: product.reference_fournisseur,
      // Create nom object for new structure
      nom: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.nom || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.nom || '',
      },
      description: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.description || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.description || '',
      },
      ficheTechnique: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.fiche_technique || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.fiche_technique || '',
      },
      fiche_technique: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.fiche_technique || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.fiche_technique || '',
      },
      category: product.categories ? {
        id: product.categories.id,
        name: {
          fr: product.categories.category_translations.find(t => t.language_code === 'fr')?.name || 'Non catégorisé',
          en: product.categories.category_translations.find(t => t.language_code === 'en')?.name || 'Uncategorized',
        },
        slug: product.categories.slug,
        image_url: product.categories.image_url
      } : null,
      // Add manufacturer object for compatibility
      manufacturer: {
        name: product.constructeur || 'Unknown Manufacturer'
      },
      // Add discipline object based on category for compatibility
      discipline: product.categories ? {
        name: {
          fr: product.categories.category_translations.find(t => t.language_code === 'fr')?.name || 'Discipline',
          en: product.categories.category_translations.find(t => t.language_code === 'en')?.name || 'Discipline',
        },
        color: '#3B82F6', // Default blue color
        image_url: product.categories.image_url
      } : {
        name: { fr: 'Non spécifiée', en: 'Unspecified' },
        color: '#6B7280',
        image_url: null
      },
      // Transform media to images format
      images: product.product_media.map(media => ({
        id: media.id,
        url: media.url,
        alt: {
          fr: `Image de ${product.product_translations.find(t => t.language_code === 'fr')?.nom || 'produit'}`,
          en: `Image of ${product.product_translations.find(t => t.language_code === 'en')?.nom || 'product'}`,
        },
        is_primary: media.is_primary
      })),
      // Add documents array for compatibility (empty for now)
      documents: [],
      // Add price field for compatibility
      price: null,
      _count: product._count,
      media: product.product_media,
      translations: product.product_translations,
    }));

    const result = {
      items: transformedItems,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
      filters,
    };

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
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

// POST /api/admin/products - Create new product
// Accept both camelCase (frontend) and snake_case (legacy) field names
const createProductSchema = z.object({
  // Accept both naming conventions
  referenceFournisseur: z.string().min(1, 'Référence fournisseur est requise').optional(),
  reference_fournisseur: z.string().min(1, 'Référence fournisseur est requise').optional(),
  constructeur: z.string().min(1, 'Constructeur est requis'),
  categoryId: z.string().min(1, 'Catégorie est requise').optional(),
  category_id: z.string().min(1, 'Catégorie est requise').optional(),
  nom: z.object({
    fr: z.string().min(1, 'Nom en français est requis'),
    en: z.string().optional(), // English is optional for French-first approach
  }),
  description: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  ficheTechnique: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  fiche_technique: z.object({
    fr: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  pdfBrochureUrl: z.string().url().optional().or(z.literal('')).or(z.literal(null)),
  pdf_brochure_url: z.string().url().optional().or(z.literal('')).or(z.literal(null)),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.boolean().default(false),
  seo: z.object({
    title: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    canonical: z.string().url().optional(),
    noIndex: z.boolean().optional(),
  }).optional(),
}).refine(data => data.referenceFournisseur || data.reference_fournisseur, {
  message: 'Référence fournisseur est requise',
}).refine(data => data.categoryId || data.category_id, {
  message: 'Catégorie est requise',
});

async function createProduct(request: NextRequest) {
  try {
    const user = (request as any).user;
    const body = await request.json();

    // Validate request body
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const productData = validation.data;

    // Normalize field names (accept both camelCase and snake_case)
    const referenceFournisseur = productData.referenceFournisseur || productData.reference_fournisseur;
    const categoryId = productData.categoryId || productData.category_id;
    const ficheTechnique = productData.ficheTechnique || productData.fiche_technique;
    const pdfBrochureUrl = productData.pdfBrochureUrl || productData.pdf_brochure_url;

    // Generate unique slug from French name (primary language)
    const baseSlug = productData.nom.fr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const slug = `${baseSlug}-${timestamp}`;

    // Create product in database
    const product = await prisma.products.create({
      data: {
        reference_fournisseur: referenceFournisseur,
        constructeur: productData.constructeur,
        category_id: categoryId,
        slug,
        status: productData.status,
        is_featured: productData.featured,
        pdf_brochure_url: pdfBrochureUrl || null,
        product_translations: {
          create: [
            {
              language_code: 'fr',
              nom: productData.nom.fr,
              description: productData.description?.fr || null,
              fiche_technique: ficheTechnique?.fr || null,
            },
            ...(productData.nom.en ? [{
              language_code: 'en',
              nom: productData.nom.en,
              description: productData.description?.en || null,
              fiche_technique: ficheTechnique?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        product_translations: true,
        _count: {
          select: {
            product_media: true
          }
        }
      },
    });

    // Transform the response to match expected format (camelCase for frontend)
    const transformedProduct = {
      id: product.id,
      referenceFournisseur: product.reference_fournisseur,
      reference_fournisseur: product.reference_fournisseur, // Keep snake_case for backwards compatibility
      constructeur: product.constructeur,
      categoryId: product.category_id,
      category_id: product.category_id, // Keep snake_case for backwards compatibility
      status: product.status,
      featured: product.is_featured,
      pdfBrochureUrl: product.pdf_brochure_url,
      pdf_brochure_url: product.pdf_brochure_url, // Keep snake_case for backwards compatibility
      createdAt: product.created_at,
      created_at: product.created_at, // Keep snake_case for backwards compatibility
      updatedAt: product.updated_at,
      updated_at: product.updated_at, // Keep snake_case for backwards compatibility
      nom: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.nom || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.nom || '',
      },
      description: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.description || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.description || '',
      },
      ficheTechnique: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.fiche_technique || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.fiche_technique || '',
      },
      fiche_technique: {
        fr: product.product_translations.find(t => t.language_code === 'fr')?.fiche_technique || '',
        en: product.product_translations.find(t => t.language_code === 'en')?.fiche_technique || '',
      },
      _count: product._count,
      translations: product.product_translations,
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Product creation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create product',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getProducts);
export const POST = withAuth(createProduct, {
  resource: 'products',
  action: 'create',
});