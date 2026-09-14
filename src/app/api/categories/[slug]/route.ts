import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { getRecursiveProductCounts } from '@/lib/catalog/category-counts';

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

    // First, check if the category has children
    const categoryCheck = await prisma.categories.findFirst({
      where: {
        slug: params.slug,
        is_active: true
      },
      include: {
        other_categories: {
          where: { is_active: true },
          select: { id: true }
        }
      }
    });

    if (!categoryCheck) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 404 }
      );
    }

    const hasChildren = categoryCheck.other_categories && categoryCheck.other_categories.length > 0;
    // Always include products if no children exist OR if explicitly requested
    const shouldIncludeProducts = includeProducts || !hasChildren;

    // Find the category by slug with full details
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
        other_categories: includeChildren ? {
          where: { is_active: true },
          include: {
            category_translations: {
              where: { language_code: locale }
            },
            other_categories: {
              where: { is_active: true },
              include: {
                category_translations: {
                  where: { language_code: locale }
                },
                other_categories: {
                  where: { is_active: true },
                  include: {
                    category_translations: {
                      where: { language_code: locale }
                    },
                    _count: { select: { products: { where: { status: 'active' } } } }
                  },
                  orderBy: { sort_order: 'asc' }
                },
                _count: { select: { products: { where: { status: 'active' } } } }
              },
              orderBy: { sort_order: 'asc' }
            },
            _count: {
              select: { products: { where: { status: 'active' } } }
            }
          },
          orderBy: { sort_order: 'asc' }
        } : undefined,
        products: shouldIncludeProducts ? {
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
            { sort_order: 'asc' },
            { is_featured: 'desc' },
            { created_at: 'desc' }
          ]
        } : undefined,
        _count: {
          select: { products: { where: { status: 'active' } } }
        }
      }
    });

    // Totals include every descendant; a child with nothing below it is hidden
    const counts = await getRecursiveProductCounts();
    const countOf = (cat: any) => counts.get(cat.id) || 0;
    const nonEmpty = (list: any[]) => list.filter((c: any) => countOf(c) > 0);

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
        productCount: countOf(cat),
        ...(cat.other_categories && {
          children: nonEmpty(cat.other_categories).map((child: any) => {
            const childTranslation = child.category_translations?.[0];
            return {
              id: child.id,
              name: childTranslation?.name || child.name,
              slug: child.slug,
              description: childTranslation?.description || child.description,
              imageUrl: child.image_url,
              type: child.type,
              productCount: countOf(child),
              ...(nonEmpty(child.other_categories || []).length > 0 && {
                children: nonEmpty(child.other_categories).map((grandchild: any) => {
                  const gcTranslation = grandchild.category_translations?.[0];
                  return {
                    id: grandchild.id,
                    name: gcTranslation?.name || grandchild.name,
                    slug: grandchild.slug,
                    description: gcTranslation?.description || grandchild.description,
                    imageUrl: grandchild.image_url,
                    type: grandchild.type,
                    productCount: countOf(grandchild),
                    ...(nonEmpty(grandchild.other_categories || []).length > 0 && {
                      children: nonEmpty(grandchild.other_categories).map((ggchild: any) => {
                        const ggTranslation = ggchild.category_translations?.[0];
                        return {
                          id: ggchild.id,
                          name: ggTranslation?.name || ggchild.name,
                          slug: ggchild.slug,
                          description: ggTranslation?.description || ggchild.description,
                          imageUrl: ggchild.image_url,
                          type: ggchild.type,
                          productCount: countOf(ggchild)
                        };
                      })
                    })
                  };
                })
              })
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