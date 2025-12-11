import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const notificationUpdateSchema = z.object({
  read: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Mock notifications storage (shared with main route)
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
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = notifications.find(n => n.id === params.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Notification fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
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
    const validatedData = notificationUpdateSchema.parse(body);

    const notificationIndex = notifications.findIndex(n => n.id === params.id);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update the notification
    const updatedNotification = {
      ...notifications[notificationIndex],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    notifications[notificationIndex] = updatedNotification;

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Notification update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationIndex = notifications.findIndex(n => n.id === params.id);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Remove the notification
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];

    return NextResponse.json(deletedNotification);
  } catch (error) {
    console.error('Notification deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}