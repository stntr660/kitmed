import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET - Get single contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submission = await prisma.contact_submissions.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Contact submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        firstName: submission.first_name,
        lastName: submission.last_name,
        email: submission.email,
        phone: submission.phone,
        company: submission.company,
        subject: submission.subject,
        message: submission.message,
        status: submission.status,
        notes: submission.notes,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching contact submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact submission' },
      { status: 500 }
    );
  }
}

// PATCH - Update contact submission (status, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, notes } = body;

    // Validate status if provided
    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const submission = await prisma.contact_submissions.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        firstName: submission.first_name,
        lastName: submission.last_name,
        email: submission.email,
        phone: submission.phone,
        company: submission.company,
        subject: submission.subject,
        message: submission.message,
        status: submission.status,
        notes: submission.notes,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating contact submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact submission' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact_submissions.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact submission' },
      { status: 500 }
    );
  }
}
