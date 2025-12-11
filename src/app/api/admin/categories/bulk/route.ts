import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete', 'reorder']),
  categoryIds: z.array(z.string()).min(1, 'At least one category ID is required'),
  newOrder: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
    parentId: z.string().optional().nullable(),
  })).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, categoryIds, newOrder } = bulkActionSchema.parse(body);

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await prisma.category.updateMany({
          where: {
            id: { in: categoryIds }
          },
          data: {
            isActive: true
          }
        });
        message = `${result.count} categories activated successfully`;
        break;

      case 'deactivate':
        result = await prisma.category.updateMany({
          where: {
            id: { in: categoryIds }
          },
          data: {
            isActive: false
          }
        });
        message = `${result.count} categories deactivated successfully`;
        break;

      case 'delete':
        // Check for categories with children or products
        const categoriesWithDependencies = await prisma.category.findMany({
          where: {
            id: { in: categoryIds }
          },
          include: {
            _count: {
              select: {
                children: true,
                products: true,
              }
            }
          }
        });

        const blockedCategories = categoriesWithDependencies.filter(
          cat => cat._count.children > 0 || cat._count.products > 0
        );

        if (blockedCategories.length > 0) {
          const blockedNames = blockedCategories.map(cat =>
            `${cat.name} (${cat._count.children} subcategories, ${cat._count.products} products)`
          );

          return NextResponse.json(
            {
              error: 'Some categories cannot be deleted',
              details: `The following categories have dependencies: ${blockedNames.join(', ')}`
            },
            { status: 400 }
          );
        }

        // Delete categories that can be safely deleted
        const deletableIds = categoriesWithDependencies.map(cat => cat.id);

        result = await prisma.category.deleteMany({
          where: {
            id: { in: deletableIds }
          }
        });
        message = `${result.count} categories deleted successfully`;
        break;

      case 'reorder':
        if (!newOrder || newOrder.length === 0) {
          return NextResponse.json(
            { error: 'New order data is required for reorder action' },
            { status: 400 }
          );
        }

        // Validate that all provided categories exist
        const existingCategories = await prisma.category.findMany({
          where: {
            id: { in: newOrder.map(item => item.id) }
          },
          select: { id: true }
        });

        const existingIds = existingCategories.map(cat => cat.id);
        const missingIds = newOrder
          .map(item => item.id)
          .filter(id => !existingIds.includes(id));

        if (missingIds.length > 0) {
          return NextResponse.json(
            { error: `Categories not found: ${missingIds.join(', ')}` },
            { status: 400 }
          );
        }

        // Update each category's order and parent
        const updatePromises = newOrder.map(item =>
          prisma.category.update({
            where: { id: item.id },
            data: {
              sortOrder: item.sortOrder,
              ...(item.parentId !== undefined && { parentId: item.parentId })
            }
          })
        );

        await Promise.all(updatePromises);
        message = `${newOrder.length} categories reordered successfully`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message,
      data: { affected: result?.count || newOrder?.length || 0 }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}