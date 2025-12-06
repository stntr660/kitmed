import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';

    // Find the category by slug
    const category = await prisma.categories.findFirst({
      where: { 
        slug: params.slug,
        is_active: true
      },
      include: {
        category_translations: {
          where: { language_code: locale }
        },
        categories: {
          include: {
            category_translations: {
              where: { language_code: locale }
            },
            categories: {
              include: {
                category_translations: {
                  where: { language_code: locale }
                },
                categories: {
                  include: {
                    category_translations: {
                      where: { language_code: locale }
                    }
                  }
                }
              }
            }
          }
        },
        ...(includeChildren && {
          other_categories: {
            where: { is_active: true },
            include: {
              category_translations: {
                where: { language_code: locale }
              },
              _count: {
                select: { products: true }
              }
            },
            orderBy: { sort_order: 'asc' }
          }
        }),
        ...(includeProducts && {
          products: {
            where: { status: 'active' },
            include: {
              product_translations: {
                where: { language_code: locale }
              },
              product_media: {
                where: { is_primary: true },
                take: 1
              },
              partners: {
                include: {
                  partner_translations: {
                    where: { language_code: locale }
                  }
                }
              }
            },
            take: 100,
            orderBy: [
              { is_featured: 'desc' },
              { created_at: 'desc' }
            ]
          }
        }),
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found' 
        },
        { status: 404 }
      );
    }

    // Transform the category data
    const transformCategory = (cat: any) => {
      const translation = cat.category_translations?.[0];
      return {
        id: cat.id,
        name: translation?.name || cat.name,
        slug: cat.slug,
        description: translation?.description || cat.description,
        imageUrl: cat.image_url,
        type: cat.type,
        productCount: cat._count?.products || 0,
        ...(cat.other_categories && {
          children: cat.other_categories.map((child: any) => {
            const childTranslation = child.category_translations?.[0];
            return {
              id: child.id,
              name: childTranslation?.name || child.name,
              slug: child.slug,
              description: childTranslation?.description || child.description,
              imageUrl: child.image_url,
              type: child.type,
              productCount: child._count?.products || 0
            };
          })
        }),
        ...(cat.products && {
          products: cat.products.map((product: any) => {
            const productTranslation = product.product_translations?.[0];
            const partnerTranslation = product.partners?.partner_translations?.[0];
            return {
              id: product.id,
              referenceFournisseur: product.reference_fournisseur,
              constructeur: partnerTranslation?.name || product.constructeur,
              slug: product.slug,
              status: product.status,
              isFeatured: product.is_featured,
              pdfBrochureUrl: product.pdf_brochure_url,
              primaryImage: product.product_media?.[0]?.url,
              translations: [{
                languageCode: locale,
                nom: productTranslation?.nom || `Product ${product.reference_fournisseur}`,
                description: productTranslation?.description || ''
              }]
            };
          })
        }),
        ...(cat.categories && {
          parent: transformCategory(cat.categories)
        })
      };
    };

    const transformedCategory = transformCategory(category);

    return NextResponse.json({
      success: true,
      data: transformedCategory
    });

  } catch (error) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}