import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/products/[id] - Get single product
async function getProduct(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        translations: true,
        _count: {
          select: {
            media: true
          }
        }
      },
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
    console.error('Product fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
const updateProductSchema = z.object({
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
});

async function updateProduct(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = updateProductSchema.safeParse(body);
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: { translations: true },
    });

    if (!existingProduct) {
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

    // Generate new slug if French name changed
    const baseSlug = productData.nom.fr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Only add timestamp if the slug would conflict
    let slug = baseSlug;
    const existingWithSlug = await prisma.product.findFirst({
      where: { 
        slug: baseSlug,
        id: { not: params.id }
      }
    });
    
    if (existingWithSlug) {
      const timestamp = Date.now().toString().slice(-6);
      slug = `${baseSlug}-${timestamp}`;
    }

    // Update product in database
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        referenceFournisseur: productData.referenceFournisseur,
        constructeur: productData.constructeur,
        categoryId: productData.categoryId,
        slug,
        status: productData.status,
        isFeatured: productData.featured,
        pdfBrochureUrl: productData.pdfBrochureUrl || null,
        translations: {
          deleteMany: {}, // Delete existing translations
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
    console.error('Product update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
async function deleteProduct(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
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

    // Delete product (cascading deletes will handle translations)
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete product',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers with auth middleware
export const GET = withAuth(getProduct);
export const PUT = withAuth(updateProduct);
export const DELETE = withAuth(deleteProduct);