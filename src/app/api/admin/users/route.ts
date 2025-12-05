import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { hashPassword } from '@/lib/auth-utils';

async function getUsers(request: NextRequest) {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        items: users,
        total: users.length,
        page: 1,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

async function createUser(request: NextRequest) {
  try {
    const data = await request.json();
    const { first_name, last_name, email, password, role, is_active } = data;

    // Get current user from request context (set by withAuth middleware)
    const currentUser = (request as any).user;

    // Only admin users can create other users
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only administrators can create users.' },
        { status: 403 }
      );
    }

    // Validate role assignment permissions
    if (role === 'admin' && currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can create admin users.' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Use provided password or generate a temporary one
    const passwordToHash = password || Math.random().toString(36).slice(-8);
    const password_hash = await hashPassword(passwordToHash);

    const user = await prisma.users.create({
      data: {
        first_name,
        last_name,
        email,
        role,
        is_active,
        password_hash
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: password ? 'User created successfully' : `User created with temporary password: ${passwordToHash}`
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Export authenticated handlers
export const GET = withAuth(getUsers);
export const POST = withAuth(createUser);