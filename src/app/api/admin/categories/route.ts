import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['discipline', 'equipment']),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  description: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  image_url: z.union([
    z.string().refine(
      (val) => {
        if (!val || val.trim() === '') return true; // empty string is valid
        // Allow relative URLs starting with / or full URLs
        return val.startsWith('/') || /^https?:\/\//.test(val);
      },
      { message: 'Must be a valid URL or relative path starting with /' }
    ),
    z.null(),
    z.literal('')
  ]).optional(),
  translations: z.object({
    fr: z.object({
      name: z.string().min(1, 'French name is required'),
      description: z.string().nullable().optional(),
      meta_title: z.string().nullable().optional(),
      meta_description: z.string().nullable().optional(),
    }),
    en: z.object({
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      meta_title: z.string().nullable().optional(),
      meta_description: z.string().nullable().optional(),
    }).optional(),
  }),
});

const categoriesQuerySchema = z.object({
  query: z.string().optional(),
  parent_id: z.string().optional().nullable(),
  is_active: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  hierarchical: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '50')),
  sortBy: z.string().optional().default('sort_order'),
  sort_order: z.string().optional().default('asc'),
});

interface CategoryWithTranslations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
  category_translations: Array<{
    id: string;
    language_code: string;
    name: string;
    description: string | null;
    meta_title: string | null;
    meta_description: string | null;
  }>;
  children?: CategoryWithTranslations[];
  _count?: { other_categories: number; products: number };
}

// Helper function to build category hierarchy
function buildCategoryTree(categories: CategoryWithTranslations[]): CategoryWithTranslations[] {
  const categoryMap = new Map<string, CategoryWithTranslations>();
  const rootCategories: CategoryWithTranslations[] = [];

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id)!;

    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryNode);
      } else {
        // Parent not found, treat as root
        rootCategories.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  // Sort children by sort_order
  const sortChildren = (cats: CategoryWithTranslations[]) => {
    cats.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        cat.children.sort((a, b) => a.sort_order - b.sort_order);
        sortChildren(cat.children);
      }
    });
  };

  rootCategories.sort((a, b) => a.sort_order - b.sort_order);
  sortChildren(rootCategories);

  return rootCategories;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const {
      query,
      parent_id,
      is_active,
      hierarchical,
      page,
      pageSize,
      sortBy,
      sort_order
    } = categoriesQuerySchema.parse(params);

    // Build the where clause
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        {
          category_translations: {
            some: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } }
              ]
            }
          }
        }
      ];
    }

    if (typeof is_active === 'boolean') {
      where.is_active = is_active;
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }

    // For hierarchical view, don't filter by parent_id
    const isHierarchicalView = hierarchical && parent_id === undefined;

    if (isHierarchicalView) {
      delete where.parent_id;
    }

    // Get total count
    const total = await prisma.categories.count({ where });

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sort_order;
    } else if (sortBy === 'created_at') {
      orderBy.created_at = sort_order;
    } else if (sortBy === 'updated_at') {
      orderBy.updated_at = sort_order;
    } else {
      orderBy.sort_order = sort_order;
    }

    // Get categories with translations and counts
    const categories = await prisma.categories.findMany({
      where,
      orderBy,
      skip: isHierarchicalView ? 0 : (page - 1) * pageSize,
      take: isHierarchicalView ? undefined : pageSize,
      include: {
        category_translations: true,
        _count: {
          select: {
            other_categories: true,
            products: true,
          }
        }
      }
    }) as CategoryWithTranslations[];

    // Process categories to include computed fields
    const processedCategories = categories.map(category => {
      // Get French translation for primary name
      const frTranslation = category.category_translations.find(t => t.language_code === 'fr');
      const enTranslation = category.category_translations.find(t => t.language_code === 'en');

      return {
        ...category,
        name: frTranslation?.name || category.name,
        description: frTranslation?.description || category.description,
        nom: {
          fr: frTranslation?.name || category.name,
          en: enTranslation?.name || '',
        },
        descriptionMultilingual: {
          fr: frTranslation?.description || category.description || '',
          en: enTranslation?.description || '',
        }
      };
    });

    // Build hierarchical structure if requested
    let result;
    if (isHierarchicalView) {
      result = buildCategoryTree(processedCategories);
    } else {
      result = processedCategories;
    }

    return NextResponse.json({
      message: 'Categories retrieved successfully',
      data: {
        items: result,
        total: isHierarchicalView ? result.length : total,
        page: isHierarchicalView ? 1 : page,
        pageSize: isHierarchicalView ? result.length : pageSize,
        totalPages: isHierarchicalView ? 1 : Math.ceil(total / pageSize),
        hierarchical: isHierarchicalView,
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    console.log('🔥 RAW REQUEST:', JSON.stringify(body, null, 2));

    // Infer type if not provided: parent_id exists = equipment, otherwise = discipline
    if (!body.type) {
      body.type = body.parent_id ? 'equipment' : 'discipline';

    }

    const categoryData = categoryCreateSchema.parse(body);

    // Generate slug from French name
    const slug = categoryData.translations.fr.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.categories.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Validate parent exists if provided
    if (categoryData.parent_id) {
      const parent = await prisma.categories.findUnique({
        where: { id: categoryData.parent_id }
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    // Create category with translations

    const category = await prisma.categories.create({
      data: {
        name: categoryData.translations.fr.name,
        slug: finalSlug,
        description: categoryData.translations.fr.description || null,
        type: categoryData.type,
        parent_id: categoryData.parent_id,
        sort_order: categoryData.sort_order,
        is_active: categoryData.is_active,
        image_url: categoryData.image_url,
        meta_title: null,
        meta_description: null,
        category_translations: {
          create: [
            {
              language_code: 'fr',
              name: categoryData.translations.fr.name,
              description: categoryData.translations.fr.description || null,
              meta_title: null,
              meta_description: null,
            },
            ...(categoryData.translations.en?.name ? [{
              language_code: 'en',
              name: categoryData.translations.en.name,
              description: categoryData.translations.en.description || null,
              meta_title: null,
              meta_description: null,
            }] : [])
          ]
        }
      },
      include: {
        category_translations: true,
        _count: {
          select: {
            other_categories: true,
            products: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}