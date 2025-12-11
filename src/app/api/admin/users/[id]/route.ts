import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth';

const prisma = new PrismaClient();

async function updateUser(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { first_name, last_name, email, password, role, is_active } = data;

    // Get current user from request context (set by withAuth middleware)
    const currentUser = (request as any).user;

    // Only admin users can update other users
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only administrators can update users.' },
        { status: 403 }
      );
    }

    // Validate role assignment permissions
    if (role === 'admin' && currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can assign admin role.' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      first_name,
      last_name,
      email,
      role,
      is_active,
      updated_at: new Date()
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      const { hashPassword } = await import('@/lib/auth-utils');
      updateData.password_hash = await hashPassword(password);
    }

    const user = await prisma.users.update({
      where: { id: params.id },
      data: updateData,
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
      data: user
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

async function deleteUser(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user from request context (set by withAuth middleware)
    const currentUser = (request as any).user;

    // Only admin users can delete other users
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only administrators can delete users.' },
        { status: 403 }
      );
    }

    // Prevent users from deleting themselves
    if (currentUser.userId === params.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account.' },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Export authenticated handlers
export const PUT = withAuth(updateUser);
export const DELETE = withAuth(deleteUser);