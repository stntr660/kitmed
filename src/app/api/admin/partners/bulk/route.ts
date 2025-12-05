import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// POST /api/admin/partners/bulk - Bulk operations on partners
const bulkOperationSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
  partnerIds: z.array(z.string().uuid()).min(1, 'At least one partner ID is required'),
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

    const { action, partnerIds } = validation.data;

    // Check if all partners exist
    const existingPartners = await prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true },
    });

    if (existingPartners.length !== partnerIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Some partners were not found',
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
        successMessage = `${partnerIds.length} partners activated successfully`;
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        successMessage = `${partnerIds.length} partners deactivated successfully`;
        break;
      case 'feature':
        updateData = { isFeatured: true };
        successMessage = `${partnerIds.length} partners featured successfully`;
        break;
      case 'unfeature':
        updateData = { isFeatured: false };
        successMessage = `${partnerIds.length} partners unfeatured successfully`;
        break;
      case 'delete':
        // Delete partners (cascading deletes will handle translations)
        await prisma.partner.deleteMany({
          where: { id: { in: partnerIds } },
        });
        return NextResponse.json({
          success: true,
          message: `${partnerIds.length} partners deleted successfully`,
          data: { deletedCount: partnerIds.length },
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
    const result = await prisma.partner.updateMany({
      where: { id: { in: partnerIds } },
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