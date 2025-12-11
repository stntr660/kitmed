import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// POST /api/admin/products/bulk - Bulk operations on products
const bulkOperationSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
});

async function bulkOperations(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = bulkOperationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bulk operation data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { action, productIds } = validation.data;

    // Check if all products exist
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Some products were not found',
          },
        },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        successMessage = `${productIds.length} products activated successfully`;
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        successMessage = `${productIds.length} products deactivated successfully`;
        break;
      case 'feature':
        updateData = { isFeatured: true };
        successMessage = `${productIds.length} products featured successfully`;
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        successMessage = `${productIds.length} products unfeatured successfully`;
        break;
      case 'delete':
        // Delete products (cascading deletes will handle translations)
        await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        });
        return NextResponse.json({
          success: true,
          message: `${productIds.length} products deleted successfully`,
          data: { deletedCount: productIds.length },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        });
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid bulk action',
            },
          },
          { status: 400 }
        );
    }

    // Perform bulk update
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: { updatedCount: result.count },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Bulk operation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to perform bulk operation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const POST = bulkOperations;