/**
 * Disciplines API Route
 *
 * New endpoint for managing medical disciplines separately from equipment categories.
 * Includes backward compatibility and feature flag support.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MigrationFeatureFlags, APIFeatureFlags } from '@/lib/feature-flags';

const prisma = new PrismaClient();

/**
 * GET /api/disciplines
 *
 * Retrieve all medical disciplines with optional filtering.
 * Supports both new discipline table and legacy category table based on feature flags.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const includeTranslations = searchParams.get('includeTranslations') === 'true';
    const includeProducts = searchParams.get('includeProducts') === 'true';

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const shouldSupportLegacy = await MigrationFeatureFlags.shouldSupportLegacy();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    let disciplines;
    let total;

    if (shouldUseDisciplines) {
      // Use new disciplines table
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (active !== null && active !== undefined) {
        where.isActive = active === 'true';
      }

      const include: any = {};

      if (includeTranslations) {
        include.translations = true;
      }

      if (includeProducts) {
        include.productDisciplines = {
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
      total = await prisma.discipline.count({ where });

      // Get paginated results
      disciplines = await prisma.discipline.findMany({
        where,
        include,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      });

      // Transform data if needed for backward compatibility
      if (shouldSupportLegacy) {
        disciplines = disciplines.map((discipline: any) => ({
          ...discipline,
          // Add legacy fields for compatibility
          type: 'discipline',
          categoryId: discipline.id,
          // Map new fields to legacy names
          meta_title: discipline.metaTitle,
          meta_description: discipline.metaDescription,
          sort_order: discipline.sortOrder,
          is_active: discipline.isActive,
          created_at: discipline.createdAt,
          updated_at: discipline.updatedAt,
        }));
      }

    } else {
      // Use legacy categories table with discipline filter
      const where: any = {
        type: 'discipline'
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (active !== null && active !== undefined) {
        where.isActive = active === 'true';
      }

      const include: any = {};

      if (includeTranslations) {
        include.translations = true;
      }

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
      disciplines = await prisma.category.findMany({
        where,
        include,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    // Add migration mode logging
    if (isInMigrationMode) {

    }

    // Add deprecation warning for legacy usage
    const headers: Record<string, string> = {};
    if (!shouldUseDisciplines) {
      headers['X-API-Deprecation-Warning'] = 'Using legacy category table. Migrate to disciplines table soon.';
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      data: disciplines,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
        source: shouldUseDisciplines ? 'disciplines' : 'categories',
        migrationMode: isInMigrationMode,
      }
    }, { headers });

  } catch (error) {
    console.error('Error in disciplines API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch disciplines'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/disciplines
 *
 * Create a new medical discipline.
 * Routes to appropriate table based on feature flags.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, iconUrl, colorHex, sortOrder, isActive, metaTitle, metaDescription } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name and slug are required' },
        { status: 400 }
      );
    }

    // Check feature flags
    const shouldUseDisciplines = await MigrationFeatureFlags.shouldUseDisciplines();
    const isInMigrationMode = await MigrationFeatureFlags.isInMigrationMode();

    let discipline;

    if (shouldUseDisciplines) {
      // Create in new disciplines table
      discipline = await prisma.discipline.create({
        data: {
          name,
          slug,
          description,
          iconUrl,
          colorHex,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          metaTitle,
          metaDescription,
        },
        include: {
          translations: true
        }
      });

      // Log creation in migration mode
      if (isInMigrationMode) {

        // Also log in activity log
        await prisma.activity_logs?.create({
          data: {
            action: 'discipline_created',
            resource_type: 'discipline',
            resource_id: discipline.id,
            details: {
              name: discipline.name,
              slug: discipline.slug,
              source: 'disciplines_table'
            }
          }
        }).catch(() => {
          // Ignore if activity_logs table doesn't exist yet
        });
      }

    } else {
      // Create in legacy categories table
      discipline = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          type: 'discipline',
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          metaTitle,
          metaDescription,
        },
        include: {
          translations: true
        }
      });

      if (isInMigrationMode) {

      }
    }

    return NextResponse.json({
      data: discipline,
      meta: {
        source: shouldUseDisciplines ? 'disciplines' : 'categories',
        migrationMode: isInMigrationMode,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating discipline:', error);

    // Handle unique constraint violations
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Discipline with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create discipline',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}