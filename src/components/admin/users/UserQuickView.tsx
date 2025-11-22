'use client';

import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

// User interface matching the extended structure
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'editor';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  permissions?: {
    resource: string;
    actions: ('create' | 'read' | 'update' | 'delete')[];
  }[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lastLoginIP?: string;
  isActive: boolean;
}

interface UserQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onEdit?: () => void;
}

export function UserQuickView({ open, onOpenChange, user, onEdit }: UserQuickViewProps) {
  const t = useTranslations();

  if (!user) return null;

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get security risk level
  const getSecurityRisk = () => {
    let riskLevel = 'low';
    let riskFactors = [];

    if (!user.twoFactorEnabled) {
      riskFactors.push('No 2FA enabled');
      riskLevel = 'medium';
    }

    if (user.loginAttempts > 3) {
      riskFactors.push('Multiple failed login attempts');
      riskLevel = 'high';
    }

    if (user.status === 'suspended') {
      riskFactors.push('Account suspended');
      riskLevel = 'high';
    }

    if (!user.lastLogin || new Date(user.lastLogin) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
      riskFactors.push('Inactive for >90 days');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return { level: riskLevel, factors: riskFactors };
  };

  const securityRisk = getSecurityRisk();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-primary-100 rounded-xl flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-primary-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900 font-poppins">
                  {user.firstName} {user.lastName}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {user.department && `${user.department} • `}{user.email}
                </p>
              </div>
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

          {/* Status & Role Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getRoleColor(user.role)}>
              <ShieldCheckIcon className="h-3 w-3 mr-1" />
              {t(`admin.users.roles.${user.role}`)}
            </Badge>
            <Badge variant={getStatusColor(user.status)}>
              {t(`admin.users.status.${user.status}`)}
            </Badge>
            {user.twoFactorEnabled ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                {t('admin.users.security.twoFactorEnabled')}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                {t('admin.users.security.twoFactorDisabled')}
              </Badge>
            )}
            {securityRisk.level === 'high' && (
              <Badge variant="destructive">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                {t('admin.users.security.securityRisk')}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                {t('admin.users.form.contactInfo')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.users.fields.email')}</div>
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">{t('admin.users.fields.phone')}</div>
                      <div className="text-sm font-medium text-gray-900">{user.phone}</div>
                    </div>
                  </div>
                )}

                {user.department && (
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">{t('admin.users.fields.department')}</div>
                      <div className="text-sm font-medium text-gray-900">{user.department}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.users.fields.dateCreated')}</div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                {t('admin.users.activity.title')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">{t('admin.users.activity.lastActivity')}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.lastLogin ? formatDate(user.lastLogin, 'time') : t('admin.users.neverLoggedIn')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">{t('admin.users.activity.ipAddress')}</div>
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {user.lastLoginIP || '-'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">{t('admin.users.activity.failedAttempts')}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.loginAttempts > 0 ? (
                        <span className={user.loginAttempts > 3 ? 'text-red-600' : 'text-gray-900'}>
                          {user.loginAttempts} {t('admin.users.attempts')}
                        </span>
                      ) : (
                        <span className="text-green-600">0 {t('admin.users.attempts')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">{t('admin.users.security.lastPasswordChange')}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(user.updatedAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Session Status</div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {user.status === 'active' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Assessment */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-600" />
                Security Assessment
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {user.twoFactorEnabled ? 'Enabled and active' : 'Not enabled - security risk'}
                    </div>
                  </div>
                  <Badge variant={user.twoFactorEnabled ? 'default' : 'destructive'}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                {user.loginAttempts > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Login Attempts</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {user.loginAttempts} failed attempts detected
                      </div>
                    </div>
                    <Badge variant={user.loginAttempts > 3 ? 'destructive' : 'outline'}>
                      {user.loginAttempts > 3 ? 'High Risk' : 'Monitor'}
                    </Badge>
                  </div>
                )}

                {securityRisk.factors.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm font-medium text-red-900 mb-2">Security Concerns</div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {securityRisk.factors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Overview */}
          {user.permissions && user.permissions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2 text-gray-600" />
                  {t('admin.users.permissions')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.permissions.map((permission, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {t(`admin.users.permissions.${permission.resource}`)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {permission.actions.map((action, actionIndex) => (
                          <span
                            key={actionIndex}
                            className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {onEdit && (
            <Button onClick={onEdit} className="bg-primary-600 hover:bg-primary-700">
              <PencilIcon className="h-4 w-4 mr-2" />
              {t('admin.users.editUser')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}