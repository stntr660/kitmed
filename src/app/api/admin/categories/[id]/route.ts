import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.union([
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
  }).optional(),
});

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = context.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        translations: true,
        children: {
          include: {
            translations: true,
            _count: {
              select: {
                children: true,
                products: true,
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        parent: {
          include: {
            translations: true,
          }
        },
        _count: {
          select: {
            children: true,
            products: true,
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Process category to include computed fields
    const frTranslation = category.translations.find(t => t.languageCode === 'fr');
    const enTranslation = category.translations.find(t => t.languageCode === 'en');

    const processedCategory = {
      ...category,
      nom: {
        fr: frTranslation?.name || category.name,
        en: enTranslation?.name || '',
      },
      descriptionMultilingual: {
        fr: frTranslation?.description || category.description || '',
        en: enTranslation?.description || '',
      }
    };

    return NextResponse.json({
      message: 'Category retrieved successfully',
      data: processedCategory
    });

  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = context.params;
    const body = await request.json();
    const categoryData = categoryUpdateSchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { translations: true }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Validate parent relationship (prevent circular references)
    if (categoryData.parentId) {
      // Cannot set parent to self
      if (categoryData.parentId === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check if parent exists
      const parent = await prisma.category.findUnique({
        where: { id: categoryData.parentId }
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }

      // Prevent circular reference: check if the parent (or its ancestors) has this category as a parent
      const checkCircularReference = async (parentId: string, targetId: string): Promise<boolean> => {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
          select: { parentId: true }
        });

        if (!parent) return false;
        if (parent.parentId === targetId) return true;
        if (parent.parentId) {
          return await checkCircularReference(parent.parentId, targetId);
        }

        return false;
      };

      if (await checkCircularReference(categoryData.parentId, id)) {
        return NextResponse.json(
          { error: 'Circular reference detected: cannot set this parent' },
          { status: 400 }
        );
      }
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (categoryData.translations?.fr?.name &&
        categoryData.translations.fr.name !== existingCategory.name) {
      const newSlug = categoryData.translations.fr.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if new slug exists (excluding current category)
      let finalSlug = newSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.category.findUnique({
          where: { slug: finalSlug }
        });
        if (!existing || existing.id === id) break;
        finalSlug = `${newSlug}-${counter}`;
        counter++;
      }
      slug = finalSlug;
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(categoryData.translations?.fr?.name && {
          name: categoryData.translations.fr.name,
          slug
        }),
        ...(categoryData.translations?.fr?.description !== undefined && {
          description: categoryData.translations.fr.description
        }),
        ...(categoryData.parentId !== undefined && {
          parentId: categoryData.parentId
        }),
        ...(categoryData.sortOrder !== undefined && {
          sortOrder: categoryData.sortOrder
        }),
        ...(categoryData.isActive !== undefined && {
          isActive: categoryData.isActive
        }),
        ...(categoryData.imageUrl !== undefined && {
          imageUrl: categoryData.imageUrl
        }),
        ...(categoryData.translations?.fr?.metaTitle !== undefined && {
          metaTitle: categoryData.translations.fr.metaTitle
        }),
        ...(categoryData.translations?.fr?.metaDescription !== undefined && {
          metaDescription: categoryData.translations.fr.metaDescription
        }),
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

    // Update translations if provided
    if (categoryData.translations) {
      // Update French translation
      if (categoryData.translations.fr) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_languageCode: {
              categoryId: id,
              languageCode: 'fr'
            }
          },
          update: {
            name: categoryData.translations.fr.name,
            description: categoryData.translations.fr.description || null,
            metaTitle: categoryData.translations.fr.metaTitle || null,
            metaDescription: categoryData.translations.fr.metaDescription || null,
          },
          create: {
            categoryId: id,
            languageCode: 'fr',
            name: categoryData.translations.fr.name,
            description: categoryData.translations.fr.description || null,
            metaTitle: categoryData.translations.fr.metaTitle || null,
            metaDescription: categoryData.translations.fr.metaDescription || null,
          }
        });
      }

      // Update English translation if provided
      if (categoryData.translations.en?.name) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_languageCode: {
              categoryId: id,
              languageCode: 'en'
            }
          },
          update: {
            name: categoryData.translations.en.name,
            description: categoryData.translations.en.description || null,
            metaTitle: categoryData.translations.en.metaTitle || null,
            metaDescription: categoryData.translations.en.metaDescription || null,
          },
          create: {
            categoryId: id,
            languageCode: 'en',
            name: categoryData.translations.en.name,
            description: categoryData.translations.en.description || null,
            metaTitle: categoryData.translations.en.metaTitle || null,
            metaDescription: categoryData.translations.en.metaDescription || null,
          }
        });
      }
    }

    // Fetch updated category with translations
    const finalCategory = await prisma.category.findUnique({
      where: { id },
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
      message: 'Category updated successfully',
      data: finalCategory
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = context.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
        _count: {
          select: {
            children: true,
            products: true,
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has children
    if (category._count.children > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with subcategories',
          details: `This category has ${category._count.children} subcategories. Please move or delete them first.`
        },
        { status: 400 }
      );
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with products',
          details: `This category has ${category._count.products} products. Please move or delete them first.`
        },
        { status: 400 }
      );
    }

    // Delete category (translations will be deleted automatically via CASCADE)
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}