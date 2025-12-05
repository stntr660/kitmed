import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// Validation schemas
const createRFPSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  company_address: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  urgency_level: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  preferred_contact_method: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().min(1).default(1),
    special_requirements: z.string().nullable().optional(),
  })).optional().default([]),
});

const querySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('10'),
  status: z.string().optional(),
  urgency: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Generate reference number
function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `RFP${year}${month}${day}${random}`;
}

// GET - List RFP requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10',
      status: searchParams.get('status') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const page = parseInt(query.page);
    const pageSize = Math.min(parseInt(query.pageSize), 100);
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.urgency) {
      where.urgency_level = query.urgency;
    }

    if (query.search) {
      where.OR = [
        { customer_name: { contains: query.search } },
        { customer_email: { contains: query.search } },
        { company_name: { contains: query.search } },
        { reference_number: { contains: query.search } },
      ];
    }

    // Get total count
    const total = await prisma.rfp_requests.count({ where });

    // Get RFP requests
    const rfpRequests = await prisma.rfp_requests.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        items: rfpRequests,
        total,
        page,
        pageSize,
        totalPages,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });

  } catch (error) {
    console.error('RFP requests fetch error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new RFP request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRFPSchema.parse(body);

    // Generate unique reference number
    let reference_number: string;
    let isUnique = false;
    let attempts = 0;

    do {
      reference_number = generateReferenceNumber();
      const existing = await prisma.rfp_requests.findUnique({
        where: { reference_number },
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Unable to generate unique reference number' },
        { status: 500 }
      );
    }

    // Create RFP request with items
    const rfpRequest = await prisma.rfp_requests.create({
      data: {
        reference_number,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        company_name: validatedData.company_name,
        company_address: validatedData.company_address,
        contact_person: validatedData.contact_person,
        message: validatedData.message,
        urgency_level: validatedData.urgency_level,
        preferred_contact_method: validatedData.preferred_contact_method,
        status: 'pending',
        items: {
          create: validatedData.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            special_requirements: item.special_requirements,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: rfpRequest,
      message: `Quote request created with reference ${reference_number}`,
    }, { status: 201 });

  } catch (error) {
    console.error('RFP request creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
