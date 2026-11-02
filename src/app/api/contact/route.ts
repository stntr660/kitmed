import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET - List all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.contact_submissions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.contact_submissions.count({ where }),
    ]);

    // Transform to camelCase
    const transformedSubmissions = submissions.map(s => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      phone: s.phone,
      company: s.company,
      subject: s.subject,
      message: s.message,
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: transformedSubmissions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact submissions' },
      { status: 500 }
    );
  }
}

// POST - Create new contact submission (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company, subject, message } = body;

    // Validate required fields (name, email, phone)
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.contact_submissions.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company: company || null,
        subject: subject || '',
        message: message || '',
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        message: 'Contact submission received successfully',
      },
    });
  } catch (error) {
    console.error('Error creating contact submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
