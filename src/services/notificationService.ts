export type NotificationType = 'rfp' | 'inventory' | 'product' | 'user' | 'system' | 'security';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationData {
  [key: string]: any;
}

export interface CreateNotificationParams {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: NotificationData;
  userId?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  expiresAt?: string;
}

class NotificationService {
  private baseUrl = '/api/admin/notifications';

  async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          read: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
    } catch (error) {
      console.error('NotificationService: Failed to create notification:', error);
      throw error;
    }
  }

  // RFP Event Notifications
  async notifyNewRFP(rfpData: {
    id: string;
    customerName: string;
    amount?: number;
    deadline?: string;
    priority?: 'normal' | 'urgent';
  }): Promise<void> {
    const isUrgent = rfpData.priority === 'urgent' ||
      (rfpData.deadline && new Date(rfpData.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000));

    await this.createNotification({
      type: 'rfp',
      priority: isUrgent ? 'high' : 'medium',
      title: isUrgent ?
        `[URGENT] Nouveau devis - ${rfpData.customerName}` :
        `Nouveau devis - ${rfpData.customerName}`,
      message: isUrgent ?
        `Demande urgente nécessitant une réponse dans les 24h` :
        `Nouvelle demande de devis reçue et en attente de traitement`,
      data: rfpData,
      actionRequired: true,
      actionUrl: `/admin/rfp/${rfpData.id}`,
      expiresAt: rfpData.deadline,
    });
  }

  async notifyRFPStatusChange(rfpData: {
    id: string;
    customerName: string;
    status: string;
    amount?: number;
  }): Promise<void> {
    const statusMessages = {
      'quoted': 'Devis envoyé au client',
      'accepted': 'Devis accepté par le client',
      'rejected': 'Devis rejeté par le client',
      'expired': 'Devis expiré',
    };

    const priority: NotificationPriority =
      rfpData.status === 'accepted' ? 'high' :
      rfpData.status === 'rejected' ? 'medium' : 'low';

    await this.createNotification({
      type: 'rfp',
      priority,
      title: `Devis ${rfpData.customerName}`,
      message: statusMessages[rfpData.status as keyof typeof statusMessages] || `Statut mis à jour: ${rfpData.status}`,
      data: rfpData,
      actionRequired: rfpData.status === 'accepted',
      actionUrl: `/admin/rfp/${rfpData.id}`,
    });
  }

  // Inventory Event Notifications
  async notifyLowStock(productData: {
    id: string;
    name: string;
    currentStock: number;
    minThreshold: number;
    category?: string;
  }): Promise<void> {
    const isCritical = productData.currentStock === 0;

    await this.createNotification({
      type: 'inventory',
      priority: isCritical ? 'critical' : 'medium',
      title: isCritical ?
        `[ALERTE] Rupture de stock - ${productData.name}` :
        `Stock faible - ${productData.name}`,
      message: isCritical ?
        'Produit en rupture de stock. Réapprovisionnement urgent requis.' :
        `Stock actuel: ${productData.currentStock} unités (seuil: ${productData.minThreshold})`,
      data: productData,
      actionRequired: true,
      actionUrl: `/admin/products/${productData.id}`,
    });
  }

  async notifyStockReplenished(productData: {
    id: string;
    name: string;
    newStock: number;
    addedQuantity: number;
  }): Promise<void> {
    await this.createNotification({
      type: 'inventory',
      priority: 'low',
      title: `Stock réapprovisionné - ${productData.name}`,
      message: `+${productData.addedQuantity} unités ajoutées. Stock actuel: ${productData.newStock}`,
      data: productData,
      actionRequired: false,
      actionUrl: `/admin/products/${productData.id}`,
    });
  }

  // Product Event Notifications
  async notifyProductAdded(productData: {
    id: string;
    name: string;
    category: string;
    addedBy: string;
  }): Promise<void> {
    await this.createNotification({
      type: 'product',
      priority: 'low',
      title: `Nouveau produit ajouté`,
      message: `${productData.name} ajouté dans ${productData.category} par ${productData.addedBy}`,
      data: productData,
      actionRequired: false,
      actionUrl: `/admin/products/${productData.id}`,
    });
  }

  async notifyProductUpdated(productData: {
    id: string;
    name: string;
    changes: string[];
    updatedBy: string;
  }): Promise<void> {
    await this.createNotification({
      type: 'product',
      priority: 'low',
      title: `Produit mis à jour - ${productData.name}`,
      message: `Modifications: ${productData.changes.join(', ')} par ${productData.updatedBy}`,
      data: productData,
      actionRequired: false,
      actionUrl: `/admin/products/${productData.id}`,
    });
  }

  // User Event Notifications
  async notifyNewUserRegistration(userData: {
    id: string;
    name: string;
    email: string;
    role: string;
  }): Promise<void> {
    await this.createNotification({
      type: 'user',
      priority: 'medium',
      title: `Nouvel utilisateur - ${userData.name}`,
      message: `Nouvel utilisateur enregistré avec le rôle ${userData.role}`,
      data: userData,
      actionRequired: true,
      actionUrl: `/admin/users/${userData.id}`,
    });
  }

  async notifySuspiciousActivity(activityData: {
    userId?: string;
    activityType: string;
    ipAddress?: string;
    location?: string;
    details: string;
  }): Promise<void> {
    await this.createNotification({
      type: 'security',
      priority: 'high',
      title: `Activité suspecte détectée`,
      message: `${activityData.activityType}: ${activityData.details}`,
      data: activityData,
      actionRequired: true,
      actionUrl: `/admin/security/logs`,
    });
  }

  // System Event Notifications
  async notifySystemMaintenance(maintenanceData: {
    startTime: string;
    endTime: string;
    affectedServices: string[];
    description?: string;
  }): Promise<void> {
    await this.createNotification({
      type: 'system',
      priority: 'critical',
      title: `Maintenance système programmée`,
      message: `Maintenance de ${new Date(maintenanceData.startTime).toLocaleString('fr-FR')} à ${new Date(maintenanceData.endTime).toLocaleString('fr-FR')}`,
      data: maintenanceData,
      actionRequired: false,
      expiresAt: maintenanceData.endTime,
    });
  }

  async notifySystemUpdate(updateData: {
    version: string;
    features: string[];
    securityFixes?: string[];
  }): Promise<void> {
    const hasSecurityFixes = updateData.securityFixes && updateData.securityFixes.length > 0;

    await this.createNotification({
      type: 'system',
      priority: hasSecurityFixes ? 'high' : 'medium',
      title: hasSecurityFixes ?
        `[SECURITE] Mise à jour disponible v${updateData.version}` :
        `Nouvelle version disponible v${updateData.version}`,
      message: hasSecurityFixes ?
        'Mise à jour de sécurité critique disponible. Installation recommandée.' :
        `Nouvelles fonctionnalités: ${updateData.features.slice(0, 2).join(', ')}`,
      data: updateData,
      actionRequired: hasSecurityFixes,
      actionUrl: '/admin/system/updates',
    });
  }

  async notifyBackupStatus(backupData: {
    status: 'success' | 'failed' | 'partial';
    timestamp: string;
    size?: string;
    error?: string;
  }): Promise<void> {
    const priority: NotificationPriority =
      backupData.status === 'failed' ? 'high' :
      backupData.status === 'partial' ? 'medium' : 'low';

    const statusEmoji = {
      'success': '[OK]',
      'failed': '[ERREUR]',
      'partial': '[PARTIEL]'
    };

    await this.createNotification({
      type: 'system',
      priority,
      title: `${statusEmoji[backupData.status]} Sauvegarde ${backupData.status === 'success' ? 'réussie' : backupData.status === 'failed' ? 'échouée' : 'partielle'}`,
      message: backupData.status === 'success' ?
        `Sauvegarde terminée (${backupData.size || 'taille inconnue'})` :
        backupData.error || 'Erreur lors de la sauvegarde',
      data: backupData,
      actionRequired: backupData.status !== 'success',
      actionUrl: backupData.status !== 'success' ? '/admin/system/backups' : undefined,
    });
  }

  // Utility methods for bulk operations
  async notifyBulkStockUpdate(updates: {
    totalProducts: number;
    lowStockItems: number;
    criticalItems: number;
  }): Promise<void> {
    if (updates.criticalItems > 0 || updates.lowStockItems > 5) {
      await this.createNotification({
        type: 'inventory',
        priority: updates.criticalItems > 0 ? 'critical' : 'high',
        title: `Alerte stock multiple`,
        message: `${updates.criticalItems} produits en rupture, ${updates.lowStockItems} avec stock faible sur ${updates.totalProducts} vérifiés`,
        data: updates,
        actionRequired: true,
        actionUrl: '/admin/inventory/alerts',
      });
    }
  }

  async notifyDailyReport(reportData: {
    date: string;
    newRFPs: number;
    completedRFPs: number;
    revenue: number;
    lowStockAlerts: number;
  }): Promise<void> {
    await this.createNotification({
      type: 'system',
      priority: 'low',
      title: `Rapport quotidien - ${new Date(reportData.date).toLocaleDateString('fr-FR')}`,
      message: `${reportData.newRFPs} nouveaux devis, ${reportData.completedRFPs} finalisés, ${reportData.lowStockAlerts} alertes stock`,
      data: reportData,
      actionRequired: false,
      actionUrl: '/admin/reports/daily',
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper functions for common notification patterns
export const NotificationHelpers = {
  // Quick notification creators
  rfp: {
    created: (data: Parameters<typeof notificationService.notifyNewRFP>[0]) =>
      notificationService.notifyNewRFP(data),
    statusChanged: (data: Parameters<typeof notificationService.notifyRFPStatusChange>[0]) =>
      notificationService.notifyRFPStatusChange(data),
  },

  inventory: {
    lowStock: (data: Parameters<typeof notificationService.notifyLowStock>[0]) =>
      notificationService.notifyLowStock(data),
    restocked: (data: Parameters<typeof notificationService.notifyStockReplenished>[0]) =>
      notificationService.notifyStockReplenished(data),
  },

  product: {
    added: (data: Parameters<typeof notificationService.notifyProductAdded>[0]) =>
      notificationService.notifyProductAdded(data),
    updated: (data: Parameters<typeof notificationService.notifyProductUpdated>[0]) =>
      notificationService.notifyProductUpdated(data),
  },

  security: {
    suspicious: (data: Parameters<typeof notificationService.notifySuspiciousActivity>[0]) =>
      notificationService.notifySuspiciousActivity(data),
  },

  system: {
    maintenance: (data: Parameters<typeof notificationService.notifySystemMaintenance>[0]) =>
      notificationService.notifySystemMaintenance(data),
    update: (data: Parameters<typeof notificationService.notifySystemUpdate>[0]) =>
      notificationService.notifySystemUpdate(data),
    backup: (data: Parameters<typeof notificationService.notifyBackupStatus>[0]) =>
      notificationService.notifyBackupStatus(data),
  },
};