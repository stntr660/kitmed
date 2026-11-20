import { prisma } from '@/lib/database';
import { getRecursiveProductCounts } from '@/lib/catalog/category-counts';

/**
 * Public catalogue payloads, shared by the public API routes (client-side
 * fetches) and the server pages (first HTML for search engines / AI crawlers,
 * generateMetadata, JSON-LD). One source so the server-rendered page and the
 * client refetch always see the same data.
 *
 * Results are JSON-safe (Dates as ISO strings) so they can be passed as props
 * to client components.
 */

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

// ---------------------------------------------------------------------------
// Product detail (GET /api/products/[slug])
// ---------------------------------------------------------------------------

export async function getPublicProduct(slug: string, locale: string) {
  const product = await prisma.products.findFirst({
    where: {
      slug,
      status: 'active', // Only active products for public pages
    },
    include: {
      product_translations: true,
      categories: {
        select: {
          id: true,
          slug: true,
          name: true,
          image_url: true,
          parent_id: true,
          category_translations: {
            select: { name: true, language_code: true },
          },
        },
      },
      partners: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo_url: true,
          website_url: true,
          default_pdf_url: true,
          partner_translations: {
            select: { name: true, language_code: true },
          },
        },
      },
      product_media: {
        orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
        select: {
          id: true,
          url: true,
          type: true,
          is_primary: true,
          alt_text: true,
          title: true,
          sort_order: true,
        },
      },
    },
  });

  if (!product) return null;

  const categoryTranslation = product.categories?.category_translations.find(t => t.language_code === locale);
  const categoryFallback = product.categories?.category_translations.find(t => t.language_code === 'fr');

  const partnerTranslation = product.partners?.partner_translations?.find(t => t.language_code === locale);
  const partnerFallback = product.partners?.partner_translations?.find(t => t.language_code === 'fr');
  const manufacturerName =
    partnerTranslation?.name || partnerFallback?.name || product.partners?.name || product.constructeur || '';

  // Effective PDF URL: product, then product media, then manufacturer default
  const productPdfUrl = product.pdf_brochure_url;
  const mediaPdfUrl = product.product_media.find(m => m.type === 'pdf')?.url;
  const manufacturerPdfUrl = product.partners?.default_pdf_url;
  const effectivePdfUrl = productPdfUrl || mediaPdfUrl || manufacturerPdfUrl || null;

  return {
    id: product.id,
    slug: product.slug,
    referenceFournisseur: product.reference_fournisseur,
    constructeur: product.constructeur,
    status: product.status,
    isFeatured: product.is_featured,
    isNewArrival: product.is_new_arrival,
    pdfBrochureUrl: effectivePdfUrl,
    pdfSource: (productPdfUrl ? 'product' : mediaPdfUrl ? 'product' : manufacturerPdfUrl ? 'manufacturer' : null) as
      | 'product'
      | 'manufacturer'
      | null,
    createdAt: iso(product.created_at) as string,
    updatedAt: iso(product.updated_at) as string,

    translations: product.product_translations.map(t => ({
      languageCode: t.language_code,
      nom: t.nom,
      description: t.description,
      ficheTechnique: t.fiche_technique,
      metaTitle: t.meta_title,
      metaDescription: t.meta_description,
    })),

    category: product.categories
      ? {
          id: product.categories.id,
          name: categoryTranslation?.name || categoryFallback?.name || product.categories.name,
          slug: product.categories.slug,
          imageUrl: product.categories.image_url,
          parentId: product.categories.parent_id,
        }
      : null,

    partner: product.partners
      ? {
          id: product.partners.id,
          slug: product.partners.slug,
          name: manufacturerName,
          logoUrl: product.partners.logo_url,
          websiteUrl: product.partners.website_url,
        }
      : null,

    media: product.product_media.map(media => ({
      id: media.id,
      url: media.url,
      type: media.type,
      isPrimary: media.is_primary,
      altText: media.alt_text,
      title: media.title,
      sortOrder: media.sort_order,
    })),
  };
}

export type PublicProduct = NonNullable<Awaited<ReturnType<typeof getPublicProduct>>>;

// ---------------------------------------------------------------------------
// Category detail (GET /api/categories/[slug])
// ---------------------------------------------------------------------------

export async function getPublicCategory(
  slug: string,
  locale: string,
  opts: { includeChildren?: boolean; includeProducts?: boolean } = {}
) {
  const includeChildren = !!opts.includeChildren;

  // First, check if the category has children
  const categoryCheck = await prisma.categories.findFirst({
    where: { slug, is_active: true },
    include: {
      other_categories: {
        where: { is_active: true },
        select: { id: true },
      },
    },
  });

  if (!categoryCheck) return null;

  const hasChildren = categoryCheck.other_categories && categoryCheck.other_categories.length > 0;
  // Always include products if no children exist OR if explicitly requested
  const shouldIncludeProducts = !!opts.includeProducts || !hasChildren;

  const category = await prisma.categories.findFirst({
    where: { slug, is_active: true },
    include: {
      category_translations: { where: { language_code: locale } },
      categories: {
        include: {
          category_translations: { where: { language_code: locale } },
          categories: {
            include: {
              category_translations: { where: { language_code: locale } },
              categories: {
                include: {
                  category_translations: { where: { language_code: locale } },
                },
              },
            },
          },
        },
      },
      other_categories: includeChildren
        ? {
            where: { is_active: true },
            include: {
              category_translations: { where: { language_code: locale } },
              other_categories: {
                where: { is_active: true },
                include: {
                  category_translations: { where: { language_code: locale } },
                  other_categories: {
                    where: { is_active: true },
                    include: {
                      category_translations: { where: { language_code: locale } },
                      _count: { select: { products: { where: { status: 'active' } } } },
                    },
                    orderBy: { sort_order: 'asc' },
                  },
                  _count: { select: { products: { where: { status: 'active' } } } },
                },
                orderBy: { sort_order: 'asc' },
              },
              _count: { select: { products: { where: { status: 'active' } } } },
            },
            orderBy: { sort_order: 'asc' },
          }
        : undefined,
      products: shouldIncludeProducts
        ? {
            where: { status: 'active' },
            include: {
              product_translations: { where: { language_code: locale } },
              product_media: { where: { is_primary: true }, take: 1 },
              partners: {
                include: {
                  partner_translations: { where: { language_code: locale } },
                },
              },
            },
            take: 100,
            orderBy: [{ sort_order: 'asc' }, { is_featured: 'desc' }, { created_at: 'desc' }],
          }
        : undefined,
      _count: { select: { products: { where: { status: 'active' } } } },
    },
  });

  if (!category) return null;

  // Totals include every descendant; a child with nothing below it is hidden
  const counts = await getRecursiveProductCounts();
  const countOf = (cat: any) => counts.get(cat.id) || 0;
  const nonEmpty = (list: any[]) => list.filter((c: any) => countOf(c) > 0);

  const transformCategory = (cat: any): any => {
    const translation = cat.category_translations?.[0];
    return {
      id: cat.id,
      name: translation?.name || cat.name,
      slug: cat.slug,
      description: translation?.description || cat.description,
      metaTitle: translation?.meta_title || cat.meta_title || null,
      metaDescription: translation?.meta_description || cat.meta_description || null,
      imageUrl: cat.image_url,
      type: cat.type,
      updatedAt: iso(cat.updated_at),
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
                        productCount: countOf(ggchild),
                      };
                    }),
                  }),
                };
              }),
            }),
          };
        }),
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
            isNewArrival: product.is_new_arrival,
            pdfBrochureUrl: product.pdf_brochure_url,
            primaryImage: product.product_media?.[0]?.url,
            translations: [
              {
                languageCode: locale,
                nom: productTranslation?.nom || `Product ${product.reference_fournisseur}`,
                description: productTranslation?.description || '',
              },
            ],
          };
        }),
      }),
      ...(cat.categories && {
        parent: transformCategory(cat.categories),
      }),
    };
  };

  return transformCategory(category);
}

// ---------------------------------------------------------------------------
// Discipline detail (GET /api/disciplines/[slug])
// ---------------------------------------------------------------------------

export async function getPublicDiscipline(slug: string, locale: string) {
  const discipline = await prisma.categories.findFirst({
    where: { slug, type: 'discipline', is_active: true },
    include: {
      category_translations: { where: { language_code: locale } },
      other_categories: {
        where: { is_active: true },
        include: {
          category_translations: { where: { language_code: locale } },
          other_categories: {
            where: { is_active: true },
            include: {
              _count: { select: { products: { where: { status: 'active' } } } },
            },
          },
          _count: { select: { products: { where: { status: 'active' } } } },
        },
        orderBy: { sort_order: 'asc' },
      },
      _count: { select: { products: { where: { status: 'active' } } } },
    },
  });

  if (!discipline) return null;

  const counts = await getRecursiveProductCounts();
  const translation = discipline.category_translations?.[0];
  return {
    id: discipline.id,
    name: translation?.name || discipline.name,
    slug: discipline.slug,
    description: translation?.description || discipline.description,
    metaTitle: translation?.meta_title || discipline.meta_title || null,
    metaDescription: translation?.meta_description || discipline.meta_description || null,
    imageUrl: discipline.image_url,
    type: discipline.type,
    productCount: counts.get(discipline.id) || 0,
    other_categories: discipline.other_categories
      .map((category: any) => {
        const categoryTranslation = category.category_translations?.[0];
        // Products anywhere below this category, not just one level down
        const totalProducts = counts.get(category.id) || 0;
        return {
          id: category.id,
          name: categoryTranslation?.name || category.name,
          slug: category.slug,
          description: categoryTranslation?.description || category.description,
          imageUrl: category.image_url,
          type: category.type,
          productCount: totalProducts,
          childCount: (category.other_categories || []).filter((child: any) => (counts.get(child.id) || 0) > 0).length,
        };
      })
      // A category with no product anywhere below it is never shown
      .filter((cat: any) => cat.productCount > 0),
  };
}

// ---------------------------------------------------------------------------
// Root categories (GET /api/categories)
// ---------------------------------------------------------------------------

export async function getPublicRootCategories(
  locale: string,
  opts: { includeProductCount?: boolean; includeHierarchy?: boolean } = {}
) {
  const includeProductCount = !!opts.includeProductCount;
  const includeHierarchy = !!opts.includeHierarchy;

  const counts = await getRecursiveProductCounts();

  const categories = await prisma.categories.findMany({
    where: {
      is_active: true,
      parent_id: null, // Only root categories
    },
    orderBy: { sort_order: 'asc' },
    include: {
      category_translations: true,
      other_categories: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: {
          category_translations: true,
          // third level (e.g. Ophtalmologie > Appareillage > Lampe à fente) for the header menu
          ...(includeHierarchy && {
            other_categories: {
              where: { is_active: true },
              orderBy: { sort_order: 'asc' },
              include: { category_translations: true },
            },
          }),
        },
      },
    },
  });

  return (
    categories
      .map(category => {
        const translation = category.category_translations.find(t => t.language_code === locale);
        const fallbackTranslation = category.category_translations.find(t => t.language_code === 'fr');

        // Products anywhere below this category, not just one level down
        const totalProductCount = counts.get(category.id) || 0;

        const localize = (c: {
          id: string;
          name: string;
          slug: string;
          category_translations: { language_code: string; name: string }[];
        }) => ({
          id: c.id,
          name:
            c.category_translations.find(t => t.language_code === locale)?.name ||
            c.category_translations.find(t => t.language_code === 'fr')?.name ||
            c.name,
          slug: c.slug,
          productCount: counts.get(c.id) || 0,
        });
        const subcategories = includeHierarchy
          ? (category.other_categories || [])
              .map((sub: any) => ({
                ...localize(sub),
                subcategories: (sub.other_categories || [])
                  .map(localize)
                  .filter((c: { productCount: number }) => c.productCount > 0),
              }))
              .filter(sub => sub.productCount > 0)
          : undefined;

        return {
          id: category.id,
          name: translation?.name || fallbackTranslation?.name || category.name,
          slug: category.slug,
          description: translation?.description || fallbackTranslation?.description || category.description,
          imageUrl: category.image_url,
          sortOrder: category.sort_order,
          count: String(totalProductCount),
          ...(includeProductCount && { productCount: totalProductCount }),
          ...(includeHierarchy && { subcategories }),
        };
      })
      // An empty category is an unfinished page ("catégorie en cours de
      // développement"); the public site never links to one.
      // Order is categories.sort_order (see orderBy above), which the catalogue
      // scripts own -- no hardcoded specialty priority.
      .filter(category => category.count !== '0')
  );
}

// ---------------------------------------------------------------------------
// Partner detail (GET /api/partners/[slug]) -- for metadata / JSON-LD
// ---------------------------------------------------------------------------

export async function getPublicPartner(slug: string, locale: string) {
  const partner = await prisma.partners.findFirst({
    where: { OR: [{ id: slug }, { slug }], status: 'active' },
    include: { partner_translations: { where: { language_code: locale } } },
  });
  if (!partner) return null;

  const translation = partner.partner_translations[0];
  const productCount = await prisma.products.count({
    where: { partner_id: partner.id, status: 'active' },
  });

  return {
    id: partner.id,
    name: translation?.name || partner.name,
    slug: partner.slug,
    description: translation?.description || partner.description,
    logoUrl: partner.logo_url,
    websiteUrl: partner.website_url,
    isFeatured: partner.is_featured,
    productCount,
    type: partner.type,
    status: partner.status,
  };
}

/** Active partners that have at least one active product (public brand list). */
export async function getPublicPartnersWithProducts(locale: string) {
  const partners = await prisma.partners.findMany({
    where: { status: 'active', products: { some: { status: 'active' } } },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    include: { partner_translations: { where: { language_code: locale } } },
  });
  return partners.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.partner_translations[0]?.name || p.name,
    description: p.partner_translations[0]?.description || p.description,
    logoUrl: p.logo_url,
    websiteUrl: p.website_url,
    updatedAt: iso(p.updated_at),
  }));
}
