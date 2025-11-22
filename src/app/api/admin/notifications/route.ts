import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Notification schema
const notificationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['rfp', 'inventory', 'product', 'user', 'system', 'security']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
  userId: z.string().optional(),
  read: z.boolean().default(false),
  actionRequired: z.boolean().default(false),
  actionUrl: z.string().optional(),
  expiresAt: z.string().optional(),
});

// Mock notifications storage for development
let notifications = [
  {
    id: 'notif-001',
    type: 'rfp',
    priority: 'high',
    title: 'Nouveau devis urgent - Hôpital Mohammed VI',
    message: 'Demande de devis pour équipement IRM avec échéance dans 24h',
    data: {
      rfpId: 'rfp-2024-089',
      customerName: 'Hôpital Mohammed VI',
      amount: 2500000,
      deadline: '2024-11-10T15:00:00Z'
    },
    read: false,
    actionRequired: true,
    actionUrl: '/admin/rfp/rfp-2024-089',
    createdAt: '2024-11-09T10:30:00Z',
    expiresAt: '2024-12-10T15:00:00Z'
  },
  {
    id: 'notif-002',
    type: 'inventory',
    priority: 'medium',
    title: 'Stock faible - Scanner CT Philips',
    message: 'Le stock du Scanner CT Philips MX16 est en rupture (0 unités disponibles)',
    data: {
      productId: 'prod-scanner-ct-001',
      currentStock: 0,
      minThreshold: 2,
      productName: 'Scanner CT Philips MX16'
    },
    read: false,
    actionRequired: true,
    actionUrl: '/admin/products/prod-scanner-ct-001',
    createdAt: '2024-11-09T08:15:00Z'
  },
  {
    id: 'notif-003',
    type: 'product',
    priority: 'low',
    title: 'Nouveau produit ajouté',
    message: 'Échographe GE Voluson E10 ajouté au catalogue',
    data: {
      productId: 'prod-echo-ge-010',
      productName: 'Échographe GE Voluson E10',
      category: 'Imagerie Médicale'
    },
    read: true,
    actionRequired: false,
    actionUrl: '/admin/products/prod-echo-ge-010',
    createdAt: '2024-11-09T07:45:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const unreadOnly = searchParams.get('unread') === 'true';
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let filteredNotifications = [...notifications];

    // Filter by type
    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }

    // Filter unread only
    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    // Filter by user (for user-specific notifications)
    if (userId) {
      filteredNotifications = filteredNotifications.filter(
        n => !n.userId || n.userId === userId
      );
    }

    // Remove expired notifications
    const now = new Date();
    filteredNotifications = filteredNotifications.filter(
      n => !n.expiresAt || new Date(n.expiresAt) > now
    );

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Calculate stats
    const stats = {
      total: filteredNotifications.length,
      unread: filteredNotifications.filter(n => !n.read).length,
      critical: filteredNotifications.filter(n => n.priority === 'critical').length,
      actionRequired: filteredNotifications.filter(n => n.actionRequired).length,
      byType: {
        rfp: filteredNotifications.filter(n => n.type === 'rfp').length,
        inventory: filteredNotifications.filter(n => n.type === 'inventory').length,
        product: filteredNotifications.filter(n => n.type === 'product').length,
        user: filteredNotifications.filter(n => n.type === 'user').length,
        system: filteredNotifications.filter(n => n.type === 'system').length,
        security: filteredNotifications.filter(n => n.type === 'security').length,
      }
    };

    return NextResponse.json({
      notifications: paginatedNotifications,
      stats,
      pagination: {
        page,
        limit,
        total: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedNotification = notificationSchema.parse(body);
    
    const newNotification = {
      ...validatedNotification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);
    
    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Notification creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}