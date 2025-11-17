import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';

// Validation schema for updates
const updateRFPSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed']).optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  message: z.string().optional(),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  quoteAmount: z.number().optional(),
  quoteValidUntil: z.string().datetime().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Get single RFP request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const rfpRequest = await prisma.rFPRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!rfpRequest) {
      return NextResponse.json(
        { success: false, error: 'RFP request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rfpRequest,
    });

  } catch (error) {
    console.error('RFP request fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update RFP request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = updateRFPSchema.parse(body);

    // Check if RFP request exists
    const existingRFP = await prisma.rFPRequest.findUnique({
      where: { id },
    });

    if (!existingRFP) {
      return NextResponse.json(
        { success: false, error: 'RFP request not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
    };

    // Convert string date to Date object if provided
    if (validatedData.quoteValidUntil) {
      updateData.quoteValidUntil = new Date(validatedData.quoteValidUntil);
    }

    // Update RFP request
    const updatedRFP = await prisma.rFPRequest.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRFP,
      message: 'RFP request updated successfully',
    });

  } catch (error) {
    console.error('RFP request update error:', error);
    
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete RFP request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if RFP request exists
    const existingRFP = await prisma.rFPRequest.findUnique({
      where: { id },
    });

    if (!existingRFP) {
      return NextResponse.json(
        { success: false, error: 'RFP request not found' },
        { status: 404 }
      );
    }

    // Delete RFP request (items will be cascade deleted)
    await prisma.rFPRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'RFP request deleted successfully',
    });

  } catch (error) {
    console.error('RFP request deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}