'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface NotificationData {
  [key: string]: any;
}

interface Notification {
  id: string;
  type: 'rfp' | 'inventory' | 'product' | 'user' | 'system' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: NotificationData;
  userId?: string;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  actionRequired: number;
  byType: {
    rfp: number;
    inventory: number;
    product: number;
    user: number;
    system: number;
    security: number;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  criticalCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (type?: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
  userId?: string;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    actionRequired: 0,
    byType: {
      rfp: 0,
      inventory: 0,
      product: 0,
      user: 0,
      system: 0,
      security: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const unreadCount = stats.unread;
  const criticalCount = stats.critical;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }
      params.append('limit', '50'); // Get more notifications

      const response = await fetch(`/api/admin/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));

    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async (type?: string) => {
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }
      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/admin/notifications/mark-all-read?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Refresh notifications to get updated state
      await fetchNotifications();

    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update stats
      if (deletedNotification) {
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          unread: deletedNotification.read ? prev.unread : Math.max(0, prev.unread - 1),
          critical: deletedNotification.priority === 'critical' ? Math.max(0, prev.critical - 1) : prev.critical,
          actionRequired: deletedNotification.actionRequired ? Math.max(0, prev.actionRequired - 1) : prev.actionRequired,
          byType: {
            ...prev.byType,
            [deletedNotification.type]: Math.max(0, prev.byType[deletedNotification.type] - 1),
          },
        }));
      }

    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const newNotification = await response.json();

      // Add to local state
      setNotifications(prev => [newNotification, ...prev]);

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        unread: newNotification.read ? prev.unread : prev.unread + 1,
        critical: newNotification.priority === 'critical' ? prev.critical + 1 : prev.critical,
        actionRequired: newNotification.actionRequired ? prev.actionRequired + 1 : prev.actionRequired,
        byType: {
          ...prev.byType,
          [newNotification.type]: prev.byType[newNotification.type] + 1,
        },
      }));

      return newNotification;
    } catch (err) {
      console.error('Failed to add notification:', err);
      throw err;
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  // Real-time simulation for new notifications (in production, this would be WebSocket/SSE)
  useEffect(() => {
    const simulateRealTimeNotifications = () => {
      // Randomly add new notifications to simulate real-time updates
      const shouldAddNotification = Math.random() < 0.1; // 10% chance every minute

      if (shouldAddNotification && notifications.length < 20) {
        const notificationTypes = [
          {
            type: 'rfp' as const,
            priority: 'high' as const,
            title: 'Nouvelle demande de devis',
            message: 'Nouvelle demande reçue nécessitant une réponse rapide',
            actionRequired: true,
          },
          {
            type: 'inventory' as const,
            priority: 'medium' as const,
            title: 'Alerte stock',
            message: 'Un produit atteint le seuil minimum de stock',
            actionRequired: true,
          },
          {
            type: 'system' as const,
            priority: 'low' as const,
            title: 'Mise à jour système',
            message: 'Le système a été mis à jour avec succès',
            actionRequired: false,
          },
        ];

        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

        addNotification({
          ...randomNotification,
          read: false,
          actionUrl: '/admin/dashboard',
        }).catch(console.error);
      }
    };

    // Start simulation after 10 seconds, then every minute
    const initialTimeout = setTimeout(simulateRealTimeNotifications, 10000);
    const interval = setInterval(simulateRealTimeNotifications, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [notifications.length]);

  const value: NotificationContextType = {
    notifications,
    stats,
    loading,
    error,
    unreadCount,
    criticalCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}