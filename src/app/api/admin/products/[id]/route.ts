import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/products/[id] - Get single product
async function getProduct(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.products.findUnique({
      where: { id: params.id },
      include: {
        product_translations: true,
        product_media: {
          orderBy: { is_primary: 'desc' },
        },
        categories: {
          select: {
            id: true,
            slug: true,
            category_translations: {
              select: {
                name: true,
                language_code: true
              }
            }
          }
        },
        _count: {
          select: {
            product_media: true
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

    // Transform the response to match expected format (camelCase for frontend)
    const transformedProduct = {
      id: product.id,
      referenceFournisseur: product.reference_fournisseur,
      reference_fournisseur: product.reference_fournisseur,
      constructeur: product.constructeur,
      categoryId: product.category_id,
      category_id: product.category_id,
      status: product.status,
      featured: product.is_featured,
      pdfBrochureUrl: product.pdf_brochure_url,
      pdf_brochure_url: product.pdf_brochure_url,
      createdAt: product.created_at,
      created_at: product.created_at,
      updatedAt: product.updated_at,
      updated_at: product.updated_at,
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
          fr: product.categories.category_translations.find(t => t.language_code === 'fr')?.name || '',
          en: product.categories.category_translations.find(t => t.language_code === 'en')?.name || '',
        },
        slug: product.categories.slug,
      } : null,
      media: product.product_media.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type,
        isPrimary: m.is_primary,
        is_primary: m.is_primary,
      })),
      images: product.product_media.filter(m => m.type === 'image').map(m => ({
        id: m.id,
        url: m.url,
        isPrimary: m.is_primary,
        is_primary: m.is_primary,
      })),
      _count: {
        media: product._count.product_media,
        product_media: product._count.product_media,
      },
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
// Accept both camelCase (frontend) and snake_case (legacy) field names
const updateProductSchema = z.object({
  referenceFournisseur: z.string().min(1, 'Référence fournisseur est requise').optional(),
  reference_fournisseur: z.string().min(1, 'Référence fournisseur est requise').optional(),
  constructeur: z.string().min(1, 'Constructeur est requis'),
  categoryId: z.string().min(1, 'Catégorie est requise').optional(),
  category_id: z.string().min(1, 'Catégorie est requise').optional(),
  nom: z.object({
    fr: z.string().min(1, 'Nom en français est requis'),
    en: z.string().optional(),
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
}).refine(data => data.referenceFournisseur || data.reference_fournisseur, {
  message: 'Référence fournisseur est requise',
}).refine(data => data.categoryId || data.category_id, {
  message: 'Catégorie est requise',
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

    // Normalize field names (accept both camelCase and snake_case)
    const referenceFournisseur = productData.referenceFournisseur || productData.reference_fournisseur;
    const categoryId = productData.categoryId || productData.category_id;
    const ficheTechnique = productData.ficheTechnique || productData.fiche_technique;
    const pdfBrochureUrl = productData.pdfBrochureUrl || productData.pdf_brochure_url;

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: params.id },
      include: { product_translations: true },
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
    const existingWithSlug = await prisma.products.findFirst({
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
    const product = await prisma.products.update({
      where: { id: params.id },
      data: {
        reference_fournisseur: referenceFournisseur,
        constructeur: productData.constructeur,
        category_id: categoryId,
        slug,
        status: productData.status,
        is_featured: productData.featured,
        pdf_brochure_url: pdfBrochureUrl || null,
        product_translations: {
          deleteMany: {},
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
        product_media: {
          orderBy: { is_primary: 'desc' },
        },
        _count: {
          select: {
            product_media: true
          }
        }
      },
    });

    // Transform the response to match expected format
    const transformedProduct = {
      id: product.id,
      referenceFournisseur: product.reference_fournisseur,
      reference_fournisseur: product.reference_fournisseur,
      constructeur: product.constructeur,
      categoryId: product.category_id,
      category_id: product.category_id,
      status: product.status,
      featured: product.is_featured,
      pdfBrochureUrl: product.pdf_brochure_url,
      pdf_brochure_url: product.pdf_brochure_url,
      createdAt: product.created_at,
      created_at: product.created_at,
      updatedAt: product.updated_at,
      updated_at: product.updated_at,
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
      media: product.product_media.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type,
        isPrimary: m.is_primary,
        is_primary: m.is_primary,
      })),
      _count: {
        media: product._count.product_media,
        product_media: product._count.product_media,
      },
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
    const existingProduct = await prisma.products.findUnique({
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

    // Use transaction to handle all related deletions
    await prisma.$transaction(async (tx) => {
      try {
        // Delete RFP items that reference this product
        await tx.rfp_items.deleteMany({
          where: { product_id: params.id },
        });

        // Delete product files associations if they exist
        try {
          await tx.product_files.deleteMany({
            where: { product_id: params.id },
          });
        } catch (fileError) {
          // Ignore if table doesn't exist
        }

        // Delete product media
        await tx.product_media.deleteMany({
          where: { product_id: params.id },
        });

        // Delete product attributes
        await tx.product_attributes.deleteMany({
          where: { product_id: params.id },
        });

        // Delete product translations
        await tx.product_translations.deleteMany({
          where: { product_id: params.id },
        });

        // Finally delete the product itself
        await tx.products.delete({
          where: { id: params.id },
        });
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
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
