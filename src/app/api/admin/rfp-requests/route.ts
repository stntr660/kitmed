import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { rfpDb } from '@/lib/database';

async function getRFPRequests(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract pagination and filter parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const status = searchParams.get('status');
    const query = searchParams.get('query');

    // Build filters
    const filters = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: query || undefined,
      status: status ? [status] : undefined,
    };

    const result = await rfpDb.search(filters);

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        filters: result.filters,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });

  } catch (error) {
    console.error('RFP requests list error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve RFP requests',
        },
      },
      { status: 500 }
    );
  }
}

async function createRFPRequest(request: NextRequest) {
  try {
    const body = await request.json();
    
    const rfpRequest = await rfpDb.create(body);

    return NextResponse.json({
      success: true,
      data: rfpRequest,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });

  } catch (error) {
    console.error('RFP request creation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create RFP request',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getRFPRequests, {
  roles: ['ADMIN', 'admin', 'editor', 'viewer'],
});

export const POST = withAuth(createRFPRequest, {
  roles: ['ADMIN', 'admin', 'editor'],
});