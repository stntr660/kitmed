import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// GET /api/admin/rfp-requests - List RFP requests
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

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (query) {
      where.OR = [
        { reference_number: { contains: query } },
        { customer_name: { contains: query } },
        { customer_email: { contains: query } },
        { company_name: { contains: query } },
      ];
    }

    // Get total count
    const total = await prisma.rfp_requests.count({ where });

    // Get paginated results
    const skip = (page - 1) * pageSize;
    const rfpRequests = await prisma.rfp_requests.findMany({
      where,
      include: {
        rfp_items: {
          include: {
            products: {
              include: {
                product_translations: true,
              },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    });

    // Transform the response for frontend compatibility
    const transformedRequests = rfpRequests.map(rfp => ({
      id: rfp.id,
      referenceNumber: rfp.reference_number,
      status: rfp.status,
      customerName: rfp.customer_name,
      customerEmail: rfp.customer_email,
      customerPhone: rfp.customer_phone,
      companyName: rfp.company_name,
      companyAddress: rfp.company_address,
      contactPerson: rfp.contact_person,
      message: rfp.message,
      totalAmount: rfp.total_amount,
      adminNotes: rfp.admin_notes,
      createdAt: rfp.created_at,
      updatedAt: rfp.updated_at,
      items: rfp.rfp_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        specialRequirements: item.special_requirements,
        quotedPrice: item.quoted_price,
        product: item.products ? {
          id: item.products.id,
          name: item.products.product_translations.find(t => t.language_code === 'fr')?.nom || 
                item.products.reference_fournisseur,
          reference: item.products.reference_fournisseur,
          manufacturer: item.products.constructeur,
        } : null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: transformedRequests,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        filters: {
          query,
          status,
          sortBy,
          sortOrder,
        },
      },
      meta: {
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
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/rfp-requests - Create new RFP request
const createRFPSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  message: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    specialRequirements: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

async function createRFPRequest(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createRFPSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid RFP request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique reference number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const referenceNumber = `RFP-${timestamp}-${random}`;

    // Create RFP request with items
    const rfpRequest = await prisma.rfp_requests.create({
      data: {
        id: crypto.randomUUID(),
        reference_number: referenceNumber,
        status: 'pending',
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        company_name: data.companyName,
        company_address: data.companyAddress,
        contact_person: data.contactPerson,
        message: data.message,
        rfp_items: {
          create: data.items.map(item => ({
            id: crypto.randomUUID(),
            product_id: item.productId,
            quantity: item.quantity,
            special_requirements: item.specialRequirements,
          })),
        },
      },
      include: {
        rfp_items: {
          include: {
            products: {
              include: {
                product_translations: true,
              },
            },
          },
        },
      },
    });

    // Transform response
    const transformedRequest = {
      id: rfpRequest.id,
      referenceNumber: rfpRequest.reference_number,
      status: rfpRequest.status,
      customerName: rfpRequest.customer_name,
      customerEmail: rfpRequest.customer_email,
      customerPhone: rfpRequest.customer_phone,
      companyName: rfpRequest.company_name,
      companyAddress: rfpRequest.company_address,
      contactPerson: rfpRequest.contact_person,
      message: rfpRequest.message,
      totalAmount: rfpRequest.total_amount,
      adminNotes: rfpRequest.admin_notes,
      createdAt: rfpRequest.created_at,
      updatedAt: rfpRequest.updated_at,
      items: rfpRequest.rfp_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        specialRequirements: item.special_requirements,
        quotedPrice: item.quoted_price,
        product: item.products ? {
          id: item.products.id,
          name: item.products.product_translations.find(t => t.language_code === 'fr')?.nom || 
                item.products.reference_fournisseur,
          reference: item.products.reference_fournisseur,
          manufacturer: item.products.constructeur,
        } : null,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
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
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getRFPRequests);
export const POST = withAuth(createRFPRequest);