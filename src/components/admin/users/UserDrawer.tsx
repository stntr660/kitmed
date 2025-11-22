'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

interface UserDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  mode: 'add' | 'edit' | 'view';
  onSave: (userData: Partial<User>) => Promise<void>;
}

export function UserDrawer({ open, onOpenChange, user, mode, onSave }: UserDrawerProps) {
  const t = useTranslations();
  
  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: 'editor',
    status: 'active',
    twoFactorEnabled: false,
    isActive: true,
  });

  // UI state
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // Reset form when user or mode changes
  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'view')) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        role: user.role || 'viewer',
        status: user.status || 'active',
        twoFactorEnabled: user.twoFactorEnabled || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
      setShowPasswordFields(false);
    } else if (mode === 'add') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        role: 'editor',
        status: 'active',
        twoFactorEnabled: false,
        isActive: true,
      });
      setShowPasswordFields(true);
    }
    setErrors({});
    setFormTouched(false);
  }, [user, mode, open]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('admin.users.form.validation.firstNameRequired');
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('admin.users.form.validation.lastNameRequired');
    }

    if (!formData.email?.trim()) {
      newErrors.email = t('admin.users.form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.users.form.validation.emailInvalid');
    }

    if (!formData.role) {
      newErrors.role = t('admin.users.form.validation.roleRequired');
    }

    if (formData.phone && !/^[+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('admin.users.form.validation.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      // Error handling would typically show a toast notification
    } finally {
      setSaving(false);
    }
  };

  // Handle drawer close
  const handleClose = () => {
    if (formTouched && mode !== 'view') {
      if (confirm(t('admin.users.form.actions.cancel'))) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  // Get title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'add':
        return t('admin.users.addUser');
      case 'edit':
        return t('admin.users.editUser');
      case 'view':
        return t('admin.users.viewUser');
      default:
        return t('admin.users.addUser');
    }
  };

  // Get subtitle based on mode
  const getSubtitle = () => {
    switch (mode) {
      case 'add':
        return t('admin.users.form.personalDetails');
      case 'edit':
        return `${user?.firstName} ${user?.lastName}`;
      case 'view':
        return `${user?.firstName} ${user?.lastName}`;
      default:
        return '';
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
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

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl max-h-screen overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-primary-600" />
                )}
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900 font-poppins">
                  {getTitle()}
                </SheetTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {getSubtitle()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick info badges for view/edit mode */}
          {(isViewMode || isEditMode) && user && (
            <div className="flex flex-wrap gap-2">
              <Badge className={getRoleColor(user.role)}>
                {t(`admin.users.roles.${user.role}`)}
              </Badge>
              <Badge variant={getStatusColor(user.status)}>
                {t(`admin.users.status.${user.status}`)}
              </Badge>
              {user.twoFactorEnabled && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  2FA
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserCircleIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('admin.users.form.basicInfo')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.firstName')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                      {user?.firstName || '-'}
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        placeholder={t('admin.users.form.placeholders.firstName')}
                        className={`h-12 ${errors.firstName ? 'border-red-500' : ''}`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.lastName')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-lg">
                      {user?.lastName || '-'}
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        placeholder={t('admin.users.form.placeholders.lastName')}
                        className={`h-12 ${errors.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.email')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-lg flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                      {user?.email || '-'}
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <EnvelopeIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder={t('admin.users.form.placeholders.email')}
                          className={`h-12 pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('admin.users.form.contactInfo')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.phone')}
                  </label>
                  {isViewMode ? (
                    <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-lg flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                      {user?.phone || '-'}
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <PhoneIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder={t('admin.users.form.placeholders.phone')}
                          className={`h-12 pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.department')}
                  </label>
                  {isViewMode ? (
                    <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-lg flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-500" />
                      {user?.department || '-'}
                    </div>
                  ) : (
                    <div className="relative">
                      <BuildingOfficeIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <Input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => handleFieldChange('department', e.target.value)}
                        placeholder={t('admin.users.form.placeholders.department')}
                        className="h-12 pl-10"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('admin.users.form.rolePermissions')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.role')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {isViewMode ? (
                    <div className="py-2">
                      <Badge className={getRoleColor(user?.role || 'viewer')}>
                        {t(`admin.users.roles.${user?.role || 'viewer'}`)}
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.role || 'editor'}
                        onChange={(e) => handleFieldChange('role', e.target.value as any)}
                        className={`w-full h-12 px-3 border rounded-lg bg-white ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="editor">{t('admin.users.roles.editor')}</option>
                        <option value="admin">{t('admin.users.roles.admin')}</option>
                      </select>
                      {errors.role && (
                        <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.fields.status')}
                  </label>
                  {isViewMode ? (
                    <div className="py-2">
                      <Badge variant={getStatusColor(user?.status || 'active')}>
                        {t(`admin.users.status.${user?.status || 'active'}`)}
                      </Badge>
                    </div>
                  ) : (
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => handleFieldChange('status', e.target.value as any)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="active">{t('admin.users.status.active')}</option>
                      <option value="inactive">{t('admin.users.status.inactive')}</option>
                      <option value="pending">{t('admin.users.status.pending')}</option>
                      <option value="suspended">{t('admin.users.status.suspended')}</option>
                    </select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          {!isViewMode && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <KeyIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('admin.users.form.securitySettings')}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {t('admin.users.form.enableTwoFactor')}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {t('admin.users.fields.twoFactorEnabled')}
                      </div>
                    </div>
                    <Switch
                      checked={formData.twoFactorEnabled || false}
                      onCheckedChange={(checked) => handleFieldChange('twoFactorEnabled', checked)}
                    />
                  </div>

                  {isAddMode && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {t('admin.users.form.sendWelcomeEmail')}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Send welcome email with login instructions
                        </div>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Activity (view mode only) */}
          {isViewMode && user && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.users.activity.title')}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">{t('admin.users.activity.lastActivity')}</div>
                    <div className="font-medium">
                      {user.lastLogin ? formatDate(user.lastLogin, 'time') : t('admin.users.neverLoggedIn')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">{t('admin.users.activity.ipAddress')}</div>
                    <div className="font-medium">{user.lastLoginIP || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">{t('admin.users.activity.failedAttempts')}</div>
                    <div className="font-medium">{user.loginAttempts || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">{t('admin.users.fields.dateCreated')}</div>
                    <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        {!isViewMode && (
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {t('admin.users.form.actions.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? (
                t('admin.users.form.actions.saving')
              ) : (
                isAddMode ? t('admin.users.form.actions.create') : t('admin.users.form.actions.update')
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}