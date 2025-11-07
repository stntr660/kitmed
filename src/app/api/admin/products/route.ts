import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { productDb, activityDb } from '@/lib/database';
import { AdminSearchFilters } from '@/types/admin';
import { z } from 'zod';

// GET /api/admin/products - List products with filters
async function getProducts(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: AdminSearchFilters = {
      query: searchParams.get('query') || undefined,
      status: searchParams.getAll('status'),
      category: searchParams.getAll('category'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Handle date range if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const result = await productDb.search(filters);

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
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
const createProductSchema = z.object({
  name: z.record(z.string(), z.string()).refine(
    (obj) => obj.en && obj.en.length > 0,
    { message: 'English name is required' }
  ),
  description: z.record(z.string(), z.string()).optional(),
  shortDescription: z.record(z.string(), z.string()).optional(),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().uuid('Invalid category ID'),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  featured: z.boolean().default(false),
  specifications: z.array(z.object({
    name: z.record(z.string(), z.string()),
    value: z.record(z.string(), z.string()),
    unit: z.string().optional(),
    category: z.string(),
    order: z.number().default(0),
  })).optional(),
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
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const productData = validation.data;

    // Generate slug from English name
    const slug = productData.name.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create product in database
    const product = await productDb.create({
      name: productData.name.en,
      slug,
      sku: productData.sku,
      categoryId: productData.categoryId,
      shortDescription: productData.shortDescription?.en,
      longDescription: productData.description?.en,
      status: productData.status,
      isFeatured: productData.featured,
      metaTitle: productData.seo?.title?.en,
      metaDescription: productData.seo?.description?.en,
      specifications: productData.specifications ? JSON.stringify(productData.specifications) : null,
      // Add translations
      translations: {
        create: Object.entries(productData.name).map(([lang, name]) => ({
          languageCode: lang,
          name,
          shortDescription: productData.shortDescription?.[lang],
          longDescription: productData.description?.[lang],
          metaTitle: productData.seo?.title?.[lang],
          metaDescription: productData.seo?.description?.[lang],
          specifications: productData.specifications ? JSON.stringify(productData.specifications) : null,
        })),
      },
    });

    // Log activity
    await activityDb.log({
      userId: user.id,
      action: 'create',
      resourceType: 'product',
      resourceId: product.id,
      details: { name: productData.name.en, sku: productData.sku },
      ipAddress: request.ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: product,
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
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getProducts, {
  resource: 'products',
  action: 'read',
});

export const POST = withAuth(createProduct, {
  resource: 'products',
  action: 'create',
});