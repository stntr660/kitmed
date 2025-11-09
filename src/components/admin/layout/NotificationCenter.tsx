'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  CubeIcon,
  UserIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface NotificationCenterProps {
  locale?: 'fr' | 'en';
}

export function NotificationCenter({ locale = 'fr' }: NotificationCenterProps) {
  const t = useTranslations();
  const {
    notifications,
    stats,
    loading,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = cn(
      'h-5 w-5',
      priority === 'critical' ? 'text-red-500' :
      priority === 'high' ? 'text-orange-500' :
      priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
    );

    switch (type) {
      case 'rfp':
        return <DocumentTextIcon className={iconClass} />;
      case 'inventory':
        return <CubeIcon className={iconClass} />;
      case 'product':
        return <CubeIcon className={iconClass} />;
      case 'user':
        return <UserIcon className={iconClass} />;
      case 'security':
        return <ShieldExclamationIcon className={iconClass} />;
      case 'system':
        return <InformationCircleIcon className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.read;
    if (activeFilter === 'critical') return notification.priority === 'critical';
    if (activeFilter === 'action') return notification.actionRequired;
    return notification.type === activeFilter;
  });

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
          isOpen 
            ? 'text-primary-600 bg-primary-50' 
            : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50',
          criticalCount > 0 && 'animate-pulse'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">{t('admin.header.viewNotifications')}</span>
        {unreadCount > 0 ? (
          <BellSolid className="h-6 w-6" aria-hidden="true" />
        ) : (
          <BellIcon className="h-6 w-6" aria-hidden="true" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full text-xs font-medium min-w-[20px] h-5 px-1',
            criticalCount > 0 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-blue-500 text-white'
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Critical Alert Indicator */}
        {criticalCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-20" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/5 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('dashboard.notifications')}
                </h3>
                {stats.total > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.unread} non lues • {stats.critical} critiques
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshNotifications}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Actualiser"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { key: 'all', label: 'Toutes', count: stats.total },
                  { key: 'unread', label: 'Non lues', count: stats.unread },
                  { key: 'critical', label: 'Critiques', count: stats.critical },
                  { key: 'action', label: 'Action requise', count: stats.actionRequired },
                  { key: 'rfp', label: 'Devis', count: stats.byType.rfp },
                  { key: 'inventory', label: 'Stock', count: stats.byType.inventory },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                      activeFilter === filter.key
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {filter.label}
                    {filter.count > 0 && (
                      <span className="ml-1 text-xs opacity-75">({filter.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {filteredNotifications.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100">
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <CheckIcon className="h-3 w-3 inline mr-1" />
                  Tout marquer comme lu
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <BellIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        'relative group cursor-pointer transition-colors',
                        notification.read ? 'hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start p-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mr-3">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p className={cn(
                                'text-sm font-medium truncate',
                                notification.read ? 'text-gray-900' : 'text-gray-900'
                              )}>
                                {notification.title}
                              </p>
                              
                              {/* Message */}
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>

                              {/* Metadata */}
                              <div className="flex items-center mt-2 gap-2">
                                <span className={cn(
                                  'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
                                  getPriorityColor(notification.priority)
                                )}>
                                  {notification.priority === 'critical' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                                  {notification.priority === 'critical' ? 'Critique' :
                                   notification.priority === 'high' ? 'Élevée' :
                                   notification.priority === 'medium' ? 'Moyenne' : 'Faible'}
                                </span>

                                {notification.actionRequired && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 border border-amber-200 text-amber-800">
                                    Action requise
                                  </span>
                                )}
                                
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                    locale: locale === 'fr' ? fr : enUS
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-start gap-2 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                              
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionMenu(showActionMenu === notification.id ? null : notification.id);
                                }}
                              >
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      {showActionMenu === notification.id && (
                        <div className="absolute right-4 top-12 z-10 w-32 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          {!notification.read && (
                            <button
                              className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                                setShowActionMenu(null);
                              }}
                            >
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Marquer lu
                            </button>
                          )}
                          <button
                            className="flex w-full items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                          >
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/admin/notifications';
                  }}
                >
                  Voir toutes les notifications ({stats.total})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}