/**
 * Enhanced Categories API Route
 *
 * Updated categories endpoint that works with the new disciplines-categories separation.
 * Provides backward compatibility while enabling new functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MigrationFeatureFlags, APIFeatureFlags } from '@/lib/feature-flags';

const prisma = new PrismaClient();

/**
 * GET /api/categories/enhanced
 *
 * Enhanced categories endpoint that can return:
 * - Equipment categories only (when disciplines are separated)
 * - Legacy categories with type filtering (backward compatibility)
 * - Combined view with proper relationships
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // 'equipment', 'discipline', or null for all
    const parentId = searchParams.get('parentId');
    const active = searchParams.get('active');
    const includeTranslations = searchParams.get('includeTranslations') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const hierarchical = searchParams.get('hierarchical') === 'true';

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const shouldSupportLegacy = await MigrationFeatureFlags.shouldSupportLegacy();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    let categories = [];
    let total = 0;

    if (shouldUseDisciplines && type !== 'discipline') {
      // Use enhanced logic - categories table now only contains equipment categories
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (parentId !== null && parentId !== undefined) {
        where.parentId = parentId;
      }

      if (active !== null && active !== undefined) {
        where.isActive = active === 'true';
      }

      const include: any = {
        translations: includeTranslations
      };

      if (includeProducts) {
        include.productCategories = {
          include: {
            product: {
              include: {
                translations: true
              }
            }
          }
        };
      }

      // Get total count
      total = await prisma.category.count({ where });

      // Get paginated results
      categories = await prisma.category.findMany({
        where,
        include,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        skip: hierarchical ? 0 : (page - 1) * limit,
        take: hierarchical ? undefined : limit,
      });

    } else {
      // Use legacy logic or handle discipline requests
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Filter by type if specified
      if (type) {
        where.type = type;
      }

      if (parentId !== null && parentId !== undefined) {
        where.parentId = parentId;
      }

      if (active !== null && active !== undefined) {
        where.isActive = active === 'true';
      }

      const include: any = {
        translations: includeTranslations
      };

      if (includeProducts) {
        include.products = {
          include: {
            translations: true
          }
        };
      }

      // Get total count
      total = await prisma.category.count({ where });

      // Get paginated results
      categories = await prisma.category.findMany({
        where,
        include,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        skip: hierarchical ? 0 : (page - 1) * limit,
        take: hierarchical ? undefined : limit,
      });
    }

    // Transform data for enhanced response
    const enhancedCategories = categories.map((category: any) => {
      const baseCategory = {
        ...category,
        // Ensure consistent field naming
        meta_title: category.metaTitle || category.meta_title,
        meta_description: category.metaDescription || category.meta_description,
        sort_order: category.sortOrder || category.sort_order,
        is_active: category.isActive !== undefined ? category.isActive : category.is_active,
        created_at: category.createdAt || category.created_at,
        updated_at: category.updatedAt || category.updated_at,
      };

      // Add relationship information based on feature flags
      if (shouldUseDisciplines) {
        // In the new system, add information about the separation
        baseCategory.entity_type = 'category'; // This is an equipment category
        baseCategory.has_disciplines_separation = true;

        // Transform product relationships if they exist
        if (category.productCategories) {
          baseCategory.products = category.productCategories.map((pc: any) => pc.product);
          baseCategory.product_count = category.productCategories.length;
        }
      } else {
        // Legacy system information
        baseCategory.entity_type = category.type || 'category';
        baseCategory.has_disciplines_separation = false;

        if (category.products) {
          baseCategory.product_count = category.products.length;
        }
      }

      return baseCategory;
    });

    // Build hierarchical structure if requested
    let result = enhancedCategories;
    if (hierarchical) {
      result = buildCategoryTree(enhancedCategories);
    }

    // Log access in migration mode
    if (isInMigrationMode) {

    }

    // Add migration-specific headers
    const headers: Record<string, string> = {};
    if (isInMigrationMode) {
      headers['X-Migration-Mode'] = 'active';
      headers['X-Data-Source'] = shouldUseDisciplines ? 'separated' : 'legacy';
    }

    if (!shouldUseDisciplines && shouldSupportLegacy) {
      headers['X-API-Deprecation-Warning'] = 'This API will be updated when disciplines separation is complete';
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      data: result,
      meta: {
        pagination: {
          page: hierarchical ? 1 : page,
          limit: hierarchical ? result.length : limit,
          total: hierarchical ? result.length : total,
          totalPages: hierarchical ? 1 : totalPages,
          hasNext: hierarchical ? false : hasNext,
          hasPrev: hierarchical ? false : hasPrev,
        },
        features: {
          disciplines_separated: shouldUseDisciplines,
          legacy_support: shouldSupportLegacy,
          migration_mode: isInMigrationMode,
          hierarchical: hierarchical,
        },
        query: {
          type,
          search: search || null,
          parentId: parentId || null,
          active: active || null,
        }
      }
    }, { headers });

  } catch (error) {
    console.error('Error in enhanced categories API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to build category hierarchy
 */
function buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // Create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build tree structure
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id);

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  // Sort function
  const sortChildren = (cats: any[]) => {
    cats.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        cat.children.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        sortChildren(cat.children);
      }
    });
  };

  rootCategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  sortChildren(rootCategories);

  return rootCategories;
}

/**
 * POST /api/categories/enhanced
 *
 * Create a new category with enhanced logic for the disciplines-categories separation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    // In the new system, categories are equipment categories only
    // Disciplines should be created via /api/disciplines endpoint
    if (shouldUseDisciplines && body.type === 'discipline') {
      return NextResponse.json(
        {
          error: 'Disciplines should be created via /api/disciplines endpoint',
          redirect: '/api/disciplines',
          message: 'Use the dedicated disciplines API for better functionality'
        },
        { status: 400 }
      );
    }

    // Prepare category data
    const categoryData = {
      ...body,
      type: shouldUseDisciplines ? 'equipment' : (body.type || 'equipment')
    };

    // Generate slug from name
    const slug = (categoryData.name || categoryData.translations?.fr?.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: categoryData.name || categoryData.translations?.fr?.name,
        slug: finalSlug,
        description: categoryData.description || categoryData.translations?.fr?.description,
        type: categoryData.type,
        parentId: categoryData.parentId || null,
        sortOrder: categoryData.sortOrder || 0,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
        imageUrl: categoryData.imageUrl || null,
        metaTitle: categoryData.metaTitle || null,
        metaDescription: categoryData.metaDescription || null,
        // Create translations if provided
        ...(categoryData.translations && {
          translations: {
            create: [
              {
                languageCode: 'fr',
                name: categoryData.translations.fr.name,
                description: categoryData.translations.fr.description || null,
                metaTitle: categoryData.translations.fr.metaTitle || null,
                metaDescription: categoryData.translations.fr.metaDescription || null,
              },
              ...(categoryData.translations.en?.name ? [{
                languageCode: 'en',
                name: categoryData.translations.en.name,
                description: categoryData.translations.en.description || null,
                metaTitle: categoryData.translations.en.metaTitle || null,
                metaDescription: categoryData.translations.en.metaDescription || null,
              }] : [])
            ]
          }
        })
      },
      include: {
        translations: true
      }
    });

    // Log creation in migration mode
    if (isInMigrationMode) {

    }

    return NextResponse.json({
      data: {
        ...category,
        entity_type: 'category',
        has_disciplines_separation: shouldUseDisciplines
      },
      meta: {
        created_via: 'enhanced_api',
        disciplines_separated: shouldUseDisciplines,
        migration_mode: isInMigrationMode
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category via enhanced API:', error);

    return NextResponse.json(
      {
        error: 'Failed to create category',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}