'use client';

import { useAdminAuth } from './useAdminAuth';
import { AdminUser } from '@/types/admin';

/**
 * Hook for checking admin permissions and role-based access control
 * 
 * This hook provides utilities to check if the current user has permission
 * to perform specific actions based on their role and permissions.
 */
export function useAdminPermissions() {
  const { user } = useAdminAuth();

  /**
   * Check if user has permission for a specific resource/action
   */
  const hasPermission = (resource: string, action: string = 'read'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    return user.permissions?.some(p => 
      p.resource === resource && p.actions.includes(action)
    ) || false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  /**
   * Check if user is editor
   */
  const isEditor = (): boolean => {
    return user?.role === 'editor';
  };

  /**
   * Check if user can perform CRUD operations on a resource
   */
  const canCreate = (resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Editor restrictions based on resource
    switch (resource) {
      case 'users':
        return false; // Only admins can create users
      case 'categories':
        return false; // Only admins can create categories
      case 'products':
        return true; // Editors can create products
      case 'partners':
        return true; // Editors can create partners
      case 'content':
        return true; // Editors can create content
      default:
        return hasPermission(resource, 'create');
    }
  };

  const canUpdate = (resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Editor restrictions
    switch (resource) {
      case 'users':
        return false; // Only admins can update users
      case 'categories':
        return true; // Editors can update categories (limited)
      case 'products':
        return true; // Editors can update products
      case 'partners':
        return true; // Editors can update partners
      case 'content':
        return true; // Editors can update content
      case 'settings':
        return false; // Only admins can update settings
      default:
        return hasPermission(resource, 'update');
    }
  };

  const canDelete = (resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Editor restrictions - limited delete permissions
    switch (resource) {
      case 'users':
        return false; // Only admins can delete users
      case 'categories':
        return false; // Only admins can delete categories
      case 'products':
        return false; // Editors cannot delete products
      case 'partners':
        return false; // Editors cannot delete partners
      case 'content':
        return true; // Editors can delete content
      default:
        return hasPermission(resource, 'delete');
    }
  };

  const canExport = (resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Editor restrictions
    switch (resource) {
      case 'analytics':
        return false; // Only admins can export analytics
      case 'users':
        return false; // Only admins can export users
      default:
        return hasPermission(resource, 'export') || hasPermission(resource, 'read');
    }
  };

  const canImport = (resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Editor restrictions
    switch (resource) {
      case 'users':
        return false; // Only admins can import users
      case 'categories':
        return false; // Only admins can import categories
      default:
        return hasPermission(resource, 'import') || canCreate(resource);
    }
  };

  return {
    user,
    hasPermission,
    isAdmin,
    isEditor,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canImport,
  };
}