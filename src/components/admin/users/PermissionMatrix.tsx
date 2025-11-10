'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  ShieldCheckIcon,
  CheckIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PermissionMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Permission definitions
const resources = [
  'products',
  'categories', 
  'partners',
  'rfps',
  'users',
  'content',
  'analytics',
  'settings'
] as const;

const actions = [
  'create',
  'read', 
  'update',
  'delete',
  'export',
  'import'
] as const;

const roles = [
  'admin',
  'manager',
  'editor',
  'viewer'
] as const;

type Resource = typeof resources[number];
type Action = typeof actions[number];
type Role = typeof roles[number];

interface Permission {
  resource: Resource;
  action: Action;
  allowed: boolean;
}

interface RolePermissions {
  role: Role;
  permissions: Permission[];
}

// Default permission matrix
const getDefaultPermissions = (): Record<Role, RolePermissions> => {
  const createPermissions = (role: Role): Permission[] => {
    return resources.flatMap(resource => 
      actions.map(action => ({
        resource,
        action,
        allowed: getDefaultPermission(role, resource, action)
      }))
    );
  };

  return {
    admin: {
      role: 'admin',
      permissions: createPermissions('admin')
    },
    manager: {
      role: 'manager', 
      permissions: createPermissions('manager')
    },
    editor: {
      role: 'editor',
      permissions: createPermissions('editor')
    },
    viewer: {
      role: 'viewer',
      permissions: createPermissions('viewer')
    }
  };
};

// Permission logic
const getDefaultPermission = (role: Role, resource: Resource, action: Action): boolean => {
  // Admin has all permissions
  if (role === 'admin') return true;

  // Viewer can only read
  if (role === 'viewer') return action === 'read';

  // Manager permissions
  if (role === 'manager') {
    // Cannot manage users or settings
    if (resource === 'users' || resource === 'settings') {
      return action === 'read';
    }
    // Full access to business resources
    if (['products', 'categories', 'partners', 'rfps', 'analytics'].includes(resource)) {
      return true;
    }
    // Limited content access
    if (resource === 'content') {
      return ['read', 'update', 'export'].includes(action);
    }
    return false;
  }

  // Editor permissions
  if (role === 'editor') {
    // No user management or settings
    if (resource === 'users' || resource === 'settings') {
      return false;
    }
    // Cannot delete critical resources
    if (['partners', 'categories'].includes(resource) && action === 'delete') {
      return false;
    }
    // Read-only for analytics
    if (resource === 'analytics') {
      return action === 'read';
    }
    // Standard CRUD for most resources
    return ['create', 'read', 'update', 'export'].includes(action);
  }

  return false;
};

export function PermissionMatrix({ open, onOpenChange }: PermissionMatrixProps) {
  const t = useTranslations();
  
  const [permissions, setPermissions] = useState<Record<Role, RolePermissions>>(getDefaultPermissions());
  const [activeRole, setActiveRole] = useState<Role>('viewer');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Toggle permission
  const togglePermission = (role: Role, resource: Resource, action: Action) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const permission = newPermissions[role].permissions.find(
        p => p.resource === resource && p.action === action
      );
      if (permission) {
        permission.allowed = !permission.allowed;
        setHasChanges(true);
      }
      return newPermissions;
    });
  };

  // Check if permission is allowed
  const isPermissionAllowed = (role: Role, resource: Resource, action: Action): boolean => {
    const permission = permissions[role].permissions.find(
      p => p.resource === resource && p.action === action
    );
    return permission?.allowed || false;
  };

  // Get resource permissions count
  const getResourcePermissionsCount = (role: Role, resource: Resource): { total: number; allowed: number } => {
    const resourcePermissions = permissions[role].permissions.filter(p => p.resource === resource);
    return {
      total: resourcePermissions.length,
      allowed: resourcePermissions.filter(p => p.allowed).length
    };
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (confirm(t('admin.users.permissionMatrix.resetToDefaults'))) {
      setPermissions(getDefaultPermissions());
      setHasChanges(true);
    }
  };

  // Save changes
  const saveChanges = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      // Show success message (would typically use toast)
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get role color
  const getRoleColor = (role: Role): string => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 font-poppins">
                {t('admin.users.permissionMatrix.title')}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t('admin.users.permissionMatrix.subtitle')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                variant={activeRole === role ? 'default' : 'outline'}
                onClick={() => setActiveRole(role)}
                className="flex items-center space-x-2"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                <span className="capitalize">{t(`admin.users.roles.${role}`)}</span>
              </Button>
            ))}
          </div>
        </DialogHeader>

        {/* Permission matrix */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full">
            <CardContent className="p-0 h-full overflow-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                  <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium text-gray-900">
                    <div className="text-left">{t('admin.users.permissionMatrix.resource')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.create')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.read')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.update')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.delete')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.export')}</div>
                    <div className="text-center">{t('admin.users.permissionMatrix.import')}</div>
                  </div>
                </div>

                {/* Permissions grid */}
                <div className="divide-y divide-gray-200">
                  {resources.map((resource) => {
                    const counts = getResourcePermissionsCount(activeRole, resource);
                    return (
                      <div key={resource} className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900 capitalize">
                            {t(`admin.users.permissions.${resource}`)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {counts.allowed}/{counts.total}
                          </Badge>
                        </div>

                        {actions.map((action) => {
                          const allowed = isPermissionAllowed(activeRole, resource, action);
                          const isRestricted = activeRole === 'admin' || 
                            (activeRole === 'viewer' && action !== 'read');

                          return (
                            <div key={action} className="flex justify-center">
                              {isRestricted && activeRole === 'admin' ? (
                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                  <LockClosedIcon className="h-4 w-4 text-purple-600" />
                                </div>
                              ) : (
                                <Switch
                                  checked={allowed}
                                  onCheckedChange={() => togglePermission(activeRole, resource, action)}
                                  disabled={activeRole === 'admin'}
                                  className="data-[state=checked]:bg-primary-600"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary card */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                  <Badge className={getRoleColor(activeRole)}>
                    {t(`admin.users.roles.${activeRole}`)}
                  </Badge>
                  <span>Permissions Summary</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {(() => {
                    const totalPermissions = permissions[activeRole].permissions.length;
                    const allowedPermissions = permissions[activeRole].permissions.filter(p => p.allowed).length;
                    return `${allowedPermissions}/${totalPermissions} permissions enabled`;
                  })()}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {activeRole === 'admin' && (
                  <span className="flex items-center text-purple-600">
                    <LockClosedIcon className="h-4 w-4 mr-1" />
                    Full admin access
                  </span>
                )}
                {activeRole === 'viewer' && (
                  <span className="text-gray-500">Read-only access</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t mt-6">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>{t('admin.users.permissionMatrix.resetToDefaults')}</span>
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!hasChanges || saving}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {saving ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : t('admin.users.permissionMatrix.saveChanges')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}