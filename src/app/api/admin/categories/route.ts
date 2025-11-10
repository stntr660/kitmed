import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().nullable().optional().or(z.literal(null)),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  translations: z.object({
    fr: z.object({
      name: z.string().min(1, 'French name is required'),
      description: z.string().nullable().optional(),
      metaTitle: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
    }),
    en: z.object({
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      metaTitle: z.string().nullable().optional(),
      metaDescription: z.string().nullable().optional(),
    }).optional(),
  }),
});

const categoriesQuerySchema = z.object({
  query: z.string().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.string().optional().transform(val => val === 'true'),
  hierarchical: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '50')),
  sortBy: z.string().optional().default('sortOrder'),
  sortOrder: z.string().optional().default('asc'),
});

interface CategoryWithTranslations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    id: string;
    languageCode: string;
    name: string;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  }>;
  children?: CategoryWithTranslations[];
  _count?: { children: number; products: number };
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
    
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
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

  // Sort children by sortOrder
  const sortChildren = (cats: CategoryWithTranslations[]) => {
    cats.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        cat.children.sort((a, b) => a.sortOrder - b.sortOrder);
        sortChildren(cat.children);
      }
    });
  };

  rootCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  sortChildren(rootCategories);

  return rootCategories;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const {
      query,
      parentId,
      isActive,
      hierarchical,
      page,
      pageSize,
      sortBy,
      sortOrder
    } = categoriesQuerySchema.parse(params);

    // Build the where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        {
          translations: {
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

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    // For hierarchical view, don't filter by parentId
    const isHierarchicalView = hierarchical && parentId === undefined;
    
    if (isHierarchicalView) {
      delete where.parentId;
    }

    // Get total count
    const total = await prisma.category.count({ where });

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else {
      orderBy.sortOrder = sortOrder;
    }

    // Get categories with translations and counts
    const categories = await prisma.category.findMany({
      where,
      orderBy,
      skip: isHierarchicalView ? 0 : (page - 1) * pageSize,
      take: isHierarchicalView ? undefined : pageSize,
      include: {
        translations: true,
        _count: {
          select: {
            children: true,
            products: true,
          }
        }
      }
    }) as CategoryWithTranslations[];

    // Process categories to include computed fields
    const processedCategories = categories.map(category => {
      // Get French translation for primary name
      const frTranslation = category.translations.find(t => t.languageCode === 'fr');
      const enTranslation = category.translations.find(t => t.languageCode === 'en');
      
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
    const categoryData = categoryCreateSchema.parse(body);

    // Generate slug from French name
    const slug = categoryData.translations.fr.name
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

    // Validate parent exists if provided
    if (categoryData.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });
      
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    // Create category with translations
    const category = await prisma.category.create({
      data: {
        name: categoryData.translations.fr.name,
        slug: finalSlug,
        description: categoryData.translations.fr.description || null,
        parentId: categoryData.parentId,
        sortOrder: categoryData.sortOrder,
        isActive: categoryData.isActive,
        imageUrl: categoryData.imageUrl,
        metaTitle: categoryData.translations.fr.metaTitle || null,
        metaDescription: categoryData.translations.fr.metaDescription || null,
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
      },
      include: {
        translations: true,
        _count: {
          select: {
            children: true,
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