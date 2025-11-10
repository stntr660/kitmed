import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// User schema
const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
  twoFactorEnabled: z.boolean().default(false),
  lastLogin: z.string().optional(), // ISO date string
});

// Mock users storage
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
  },
  {
    id: 'user-2',
    email: 'editor@kitmed.fr',
    firstName: 'Fatima',
    lastName: 'Editor',
    role: 'editor',
    isActive: true,
    permissions: ['content.read', 'content.write', 'products.read'],
    twoFactorEnabled: false,
    lastLogin: '2024-11-08T14:20:00Z',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-11-08T14:20:00Z',
    activityCount: 87,
    loginHistory: [
      { date: '2024-11-08T14:20:00Z', ip: '192.168.1.105', device: 'Firefox/Windows' },
    ]
  },
  {
    id: 'user-3',
    email: 'viewer@kitmed.fr',
    firstName: 'Ahmed',
    lastName: 'Viewer',
    role: 'viewer',
    isActive: false,
    permissions: ['content.read', 'products.read'],
    twoFactorEnabled: false,
    lastLogin: '2024-10-15T09:15:00Z',
    createdAt: '2024-03-10T12:30:00Z',
    updatedAt: '2024-10-15T09:15:00Z',
    activityCount: 23,
    loginHistory: []
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    let filteredUsers = users;

    // Filter by role
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Filter by status
    if (status === 'active') {
      filteredUsers = filteredUsers.filter(user => user.isActive);
    } else if (status === 'inactive') {
      filteredUsers = filteredUsers.filter(user => !user.isActive);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredUsers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit),
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedUser = userSchema.parse(body);
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === validatedUser.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    const newUser = {
      ...validatedUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityCount: 0,
      loginHistory: [],
    };

    users.unshift(newUser);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid user data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}