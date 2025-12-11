import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { productDb, rfpDb, partnerDb, categoryDb } from '@/lib/database';

async function getDashboardStats(request: NextRequest) {
  try {
    // Fetch all stats in parallel
    const [
      productStats,
      rfpStats,
      partnerStats,
      categoryStats,
    ] = await Promise.all([
      productDb.getStats(),
      rfpDb.getStats(),
      partnerDb.getStats(),
      categoryDb.getStats(),
    ]);

    const stats = {
      products: productStats,
      rfpRequests: rfpStats,
      partners: partnerStats,
      categories: categoryStats,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve dashboard statistics',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardStats, {
  roles: ['ADMIN', 'admin', 'editor', 'viewer', 'user'],
});