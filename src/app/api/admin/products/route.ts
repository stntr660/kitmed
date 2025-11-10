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
      status: searchParams.getAll('status'),
      category: searchParams.getAll('category'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build where clause
    const where: any = {};

    // Text search in product translations
    if (filters.query) {
      where.OR = [
        { referenceFournisseur: { contains: filters.query, mode: 'insensitive' } },
        { constructeur: { contains: filters.query, mode: 'insensitive' } },
        { 
          translations: {
            some: {
              nom: { contains: filters.query, mode: 'insensitive' }
            }
          }
        },
        {
          translations: {
            some: {
              description: { contains: filters.query, mode: 'insensitive' }
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
      where.categoryId = { in: filters.category };
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          translations: true,
          _count: {
            select: {
              media: true
            }
          }
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform the data to match expected format
    const transformedItems = items.map(product => ({
      id: product.id,
      referenceFournisseur: product.referenceFournisseur,
      constructeur: product.constructeur,
      categoryId: product.categoryId,
      status: product.status,
      featured: product.isFeatured,
      pdfBrochureUrl: product.pdfBrochureUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Create a name field from French translation for compatibility
      name: product.translations.find(t => t.languageCode === 'fr')?.nom || 
            product.translations[0]?.nom || 
            'Unnamed Product',
      // Create nom object for new structure
      nom: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.nom || '',
        en: product.translations.find(t => t.languageCode === 'en')?.nom || '',
      },
      description: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: product.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      ficheTechnique: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.ficheTechnique || '',
        en: product.translations.find(t => t.languageCode === 'en')?.ficheTechnique || '',
      },
      _count: product._count,
      translations: product.translations,
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
const createProductSchema = z.object({
  referenceFournisseur: z.string().min(1, 'Référence fournisseur est requise'),
  constructeur: z.string().min(1, 'Constructeur est requis'),
  categoryId: z.string().min(1, 'Catégorie est requise'),
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
  pdfBrochureUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.boolean().default(false),
  seo: z.object({
    title: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    canonical: z.string().url().optional(),
    noIndex: z.boolean().optional(),
  }).optional(),
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

    // Generate unique slug from French name (primary language)
    const baseSlug = productData.nom.fr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const slug = `${baseSlug}-${timestamp}`;

    // Create product in database
    const product = await prisma.product.create({
      data: {
        referenceFournisseur: productData.referenceFournisseur,
        constructeur: productData.constructeur,
        categoryId: productData.categoryId,
        slug,
        status: productData.status,
        isFeatured: productData.featured,
        pdfBrochureUrl: productData.pdfBrochureUrl || null,
        translations: {
          create: [
            {
              languageCode: 'fr',
              nom: productData.nom.fr,
              description: productData.description?.fr || null,
              ficheTechnique: productData.ficheTechnique?.fr || null,
            },
            ...(productData.nom.en ? [{
              languageCode: 'en',
              nom: productData.nom.en,
              description: productData.description?.en || null,
              ficheTechnique: productData.ficheTechnique?.en || null,
            }] : []),
          ],
        },
      },
      include: {
        translations: true,
        _count: {
          select: {
            media: true
          }
        }
      },
    });

    // Transform the response to match expected format
    const transformedProduct = {
      id: product.id,
      referenceFournisseur: product.referenceFournisseur,
      constructeur: product.constructeur,
      categoryId: product.categoryId,
      status: product.status,
      featured: product.isFeatured,
      pdfBrochureUrl: product.pdfBrochureUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      nom: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.nom || '',
        en: product.translations.find(t => t.languageCode === 'en')?.nom || '',
      },
      description: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.description || '',
        en: product.translations.find(t => t.languageCode === 'en')?.description || '',
      },
      ficheTechnique: {
        fr: product.translations.find(t => t.languageCode === 'fr')?.ficheTechnique || '',
        en: product.translations.find(t => t.languageCode === 'en')?.ficheTechnique || '',
      },
      _count: product._count,
      translations: product.translations,
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

// Export handlers (authentication temporarily disabled for testing)
export const GET = getProducts;
export const POST = createProduct;