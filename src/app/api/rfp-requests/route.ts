import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// Validation schemas
const createRFPSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  message: z.string().optional(),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1).default(1),
    specialRequirements: z.string().optional(),
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
      where.urgencyLevel = query.urgency;
    }

    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.rFPRequest.count({ where });

    // Get RFP requests
    const rfpRequests = await prisma.rFPRequest.findMany({
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
    let referenceNumber: string;
    let isUnique = false;
    let attempts = 0;

    do {
      referenceNumber = generateReferenceNumber();
      const existing = await prisma.rFPRequest.findUnique({
        where: { referenceNumber },
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
    const rfpRequest = await prisma.rFPRequest.create({
      data: {
        referenceNumber,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        companyName: validatedData.companyName,
        companyAddress: validatedData.companyAddress,
        contactPerson: validatedData.contactPerson,
        message: validatedData.message,
        urgencyLevel: validatedData.urgencyLevel,
        preferredContactMethod: validatedData.preferredContactMethod,
        status: 'pending',
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            specialRequirements: item.specialRequirements,
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
      message: `Quote request created with reference ${referenceNumber}`,
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