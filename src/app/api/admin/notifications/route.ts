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

// Mock notifications storage with realistic KITMED data
let notifications: any[] = [
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
    expiresAt: '2024-11-10T15:00:00Z'
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
    message: 'Échographe GE Voluson E10 ajouté au catalogue par Dr. Amina Benali',
    data: {
      productId: 'prod-echo-ge-010',
      productName: 'Échographe GE Voluson E10',
      addedBy: 'Dr. Amina Benali',
      category: 'Imagerie Médicale'
    },
    read: true,
    actionRequired: false,
    actionUrl: '/admin/products/prod-echo-ge-010',
    createdAt: '2024-11-09T07:45:00Z'
  },
  {
    id: 'notif-004',
    type: 'user',
    priority: 'medium',
    title: 'Tentative de connexion suspecte',
    message: 'Tentative de connexion depuis une adresse IP inhabituelle (197.15.45.12)',
    data: {
      userId: 'user-admin-001',
      ipAddress: '197.15.45.12',
      location: 'Casablanca, Maroc',
      blocked: true
    },
    read: false,
    actionRequired: true,
    actionUrl: '/admin/security/logs',
    createdAt: '2024-11-09T06:20:00Z'
  },
  {
    id: 'notif-005',
    type: 'system',
    priority: 'critical',
    title: 'Maintenance système programmée',
    message: 'Maintenance planifiée dimanche 10 novembre de 02:00 à 06:00 (GMT+1)',
    data: {
      maintenanceId: 'maint-2024-11-10',
      startTime: '2024-11-10T01:00:00Z',
      endTime: '2024-11-10T05:00:00Z',
      affectedServices: ['API', 'Base de données', 'Notifications']
    },
    read: false,
    actionRequired: false,
    createdAt: '2024-11-08T14:00:00Z',
    expiresAt: '2024-11-10T06:00:00Z'
  },
  {
    id: 'notif-006',
    type: 'rfp',
    priority: 'medium',
    title: 'Devis accepté - Clinique Atlas',
    message: 'Clinique Atlas a accepté le devis pour 3 moniteurs patients (450,000 DH)',
    data: {
      rfpId: 'rfp-2024-087',
      customerName: 'Clinique Atlas',
      amount: 450000,
      status: 'accepted',
      products: ['Moniteur Patient Philips MP50', 'Moniteur Patient Philips MP60']
    },
    read: true,
    actionRequired: false,
    actionUrl: '/admin/rfp/rfp-2024-087',
    createdAt: '2024-11-08T16:30:00Z'
  },
  {
    id: 'notif-007',
    type: 'inventory',
    priority: 'high',
    title: 'Réapprovisionnement urgent requis',
    message: 'Plusieurs produits sous le seuil critique de stock',
    data: {
      lowStockCount: 12,
      criticalProducts: [
        'Table de Chirurgie Maquet',
        'Défibrillateur Zoll X-Series',
        'Ventilateur Hamilton C6'
      ]
    },
    read: false,
    actionRequired: true,
    actionUrl: '/admin/inventory/low-stock',
    createdAt: '2024-11-08T12:00:00Z'
  },
  {
    id: 'notif-008',
    type: 'security',
    priority: 'high',
    title: 'Mise à jour de sécurité disponible',
    message: 'Mise à jour de sécurité critique disponible pour le système KITMED',
    data: {
      version: 'v2.1.3',
      securityLevel: 'critical',
      vulnerabilities: ['CVE-2024-001', 'CVE-2024-002'],
      estimatedDuration: '30 minutes'
    },
    read: false,
    actionRequired: true,
    actionUrl: '/admin/system/updates',
    createdAt: '2024-11-08T09:15:00Z'
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

    let filteredNotifications = notifications;

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