import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// User update schema
const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

// Mock users storage (shared with main route)
let users: any[] = [
  {
    id: 'user-1',
    email: 'admin@kitmed.fr',
    firstName: 'Mohamed',
    lastName: 'Admin',
    role: 'super_admin',
    isActive: true,
    permissions: ['all'],
    twoFactorEnabled: true,
    lastLogin: '2024-11-09T08:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-09T08:30:00Z',
    activityCount: 145,
    loginHistory: [
      { date: '2024-11-09T08:30:00Z', ip: '192.168.1.100', device: 'Chrome/MacOS' },
      { date: '2024-11-08T16:45:00Z', ip: '192.168.1.100', device: 'Chrome/MacOS' },
    ]
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = users.find(u => u.id === params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);
    
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === validatedData.email && u.id !== params.id);
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update the user
    const updatedUser = {
      ...users[userIndex],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };
    
    users[userIndex] = updatedUser;
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid user data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of super admin
    if (users[userIndex].role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin user' },
        { status: 403 }
      );
    }
    
    // Remove the user
    const deletedUser = users.splice(userIndex, 1)[0];
    
    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}