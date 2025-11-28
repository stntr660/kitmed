/**
 * Individual Discipline API Routes
 * 
 * Handles CRUD operations for specific disciplines with backward compatibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MigrationFeatureFlags } from '@/lib/feature-flags';

const prisma = new PrismaClient();

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/disciplines/[id]
 * 
 * Retrieve a specific discipline by ID.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeTranslations = searchParams.get('includeTranslations') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const locale = searchParams.get('locale') || 'fr';

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    let discipline;

    if (shouldUseDisciplines) {
      // Query new disciplines table
      const include: any = {};
      
      if (includeTranslations) {
        include.translations = {
          where: { languageCode: locale }
        };
      }
      
      if (includeProducts) {
        include.productDisciplines = {
          include: {
            product: {
              include: {
                translations: true,
                media: true,
                attributes: true
              }
            }
          }
        };
      }

      discipline = await prisma.discipline.findUnique({
        where: { id },
        include
      });

    } else {
      // Query legacy categories table with children
      const include: any = {
        translations: {
          where: { languageCode: locale }
        },
        children: {
          where: {
            isActive: true,
            type: 'equipment'
          },
          include: {
            translations: {
              where: { languageCode: locale }
            },
            _count: {
              select: {
                products: {
                  where: { status: 'active' }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      };
      
      if (includeProducts) {
        include.products = {
          include: {
            translations: true,
            media: true,
            attributes: true
          }
        };
      }

      discipline = await prisma.category.findFirst({
        where: { 
          OR: [
            { id },
            { slug: id }
          ],
          type: 'discipline',
          isActive: true
        },
        include
      });
    }

    if (!discipline) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'DISCIPLINE_NOT_FOUND', 
            message: 'Discipline not found'
          }
        },
        { status: 404 }
      );
    }

    // Transform the response for consistency
    let transformedData = discipline;
    
    if (!shouldUseDisciplines && discipline.children) {
      // Get translation or fallback to default name
      const translation = discipline.translations[0];
      const disciplineName = translation?.name || discipline.name;
      const disciplineDescription = translation?.description || discipline.description;

      // Transform children with proper translations and product counts
      const transformedChildren = discipline.children.map((child: any) => {
        const childTranslation = child.translations[0];
        return {
          id: child.id,
          name: childTranslation?.name || child.name,
          slug: child.slug,
          description: childTranslation?.description || child.description,
          imageUrl: child.imageUrl,
          productCount: child._count.products,
          type: child.type
        };
      });

      transformedData = {
        id: discipline.id,
        name: disciplineName,
        slug: discipline.slug,
        description: disciplineDescription,
        imageUrl: discipline.imageUrl,
        children: transformedChildren
      };
    }

    // Log access in migration mode
    if (isInMigrationMode) {
      console.log(`[MIGRATION] Discipline accessed: ${id} from ${shouldUseDisciplines ? 'disciplines' : 'categories'} table`);
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        source: shouldUseDisciplines ? 'disciplines' : 'categories',
        migrationMode: isInMigrationMode,
      }
    });

  } catch (error) {
    console.error('Error fetching discipline:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch discipline'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/disciplines/[id]
 * 
 * Update a specific discipline.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, slug, description, iconUrl, colorHex, sortOrder, isActive, metaTitle, metaDescription } = body;

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    let discipline;

    if (shouldUseDisciplines) {
      // Update in disciplines table
      discipline = await prisma.discipline.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(iconUrl !== undefined && { iconUrl }),
          ...(colorHex !== undefined && { colorHex }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
        },
        include: {
          translations: true
        }
      });

    } else {
      // Update in categories table
      discipline = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
        },
        include: {
          translations: true
        }
      });
    }

    // Log update in migration mode
    if (isInMigrationMode) {
      console.log(`[MIGRATION] Discipline updated: ${id} in ${shouldUseDisciplines ? 'disciplines' : 'categories'} table`);
      
      // Log activity
      await prisma.activity_logs?.create({
        data: {
          action: 'discipline_updated',
          resource_type: 'discipline',
          resource_id: id,
          details: {
            updatedFields: Object.keys(body),
            source: shouldUseDisciplines ? 'disciplines_table' : 'categories_table'
          }
        }
      }).catch(() => {
        // Ignore if activity_logs table doesn't exist
      });
    }

    return NextResponse.json({
      data: discipline,
      meta: {
        source: shouldUseDisciplines ? 'disciplines' : 'categories',
        migrationMode: isInMigrationMode,
      }
    });

  } catch (error) {
    console.error('Error updating discipline:', error);
    
    // Handle not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Discipline not found' },
        { status: 404 }
      );
    }
    
    // Handle unique constraint violations
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discipline with this slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update discipline',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/disciplines/[id]
 * 
 * Delete a specific discipline.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    // Check for existing relationships
    let hasProducts = false;

    if (shouldUseDisciplines) {
      const productCount = await prisma.productDiscipline.count({
        where: { disciplineId: id }
      });
      hasProducts = productCount > 0;
    } else {
      const productCount = await prisma.product.count({
        where: { categoryId: id }
      });
      hasProducts = productCount > 0;
    }

    if (hasProducts && !force) {
      return NextResponse.json(
        { 
          error: 'Cannot delete discipline with associated products',
          message: 'Use force=true to delete anyway, which will remove product associations'
        },
        { status: 409 }
      );
    }

    let discipline;

    if (shouldUseDisciplines) {
      // Delete from disciplines table
      // First delete product relationships if forced
      if (force && hasProducts) {
        await prisma.productDiscipline.deleteMany({
          where: { disciplineId: id }
        });
      }

      discipline = await prisma.discipline.delete({
        where: { id }
      });

    } else {
      // Update products to remove category association if forced
      if (force && hasProducts) {
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: null }
        });
      }

      discipline = await prisma.category.delete({
        where: { id }
      });
    }

    // Log deletion in migration mode
    if (isInMigrationMode) {
      console.log(`[MIGRATION] Discipline deleted: ${id} from ${shouldUseDisciplines ? 'disciplines' : 'categories'} table`);
      
      // Log activity
      await prisma.activity_logs?.create({
        data: {
          action: 'discipline_deleted',
          resource_type: 'discipline',
          resource_id: id,
          details: {
            forced: force,
            hadProducts: hasProducts,
            source: shouldUseDisciplines ? 'disciplines_table' : 'categories_table'
          }
        }
      }).catch(() => {
        // Ignore if activity_logs table doesn't exist
      });
    }

    return NextResponse.json({
      data: { id, deleted: true },
      meta: {
        source: shouldUseDisciplines ? 'disciplines' : 'categories',
        migrationMode: isInMigrationMode,
        forced: force,
        hadProducts: hasProducts
      }
    });

  } catch (error) {
    console.error('Error deleting discipline:', error);
    
    // Handle not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Discipline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete discipline',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}