'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserDrawer } from './UserDrawer';
import { UserQuickView } from './UserQuickView';
import { PermissionMatrix } from './PermissionMatrix';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { formatDate, truncate } from '@/lib/utils';

// Extended User interface with additional security features
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
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

interface UserWithDetails extends User {
  _count?: {
    activityLogs: number;
    loginAttempts: number;
  };
}

interface UsersManagementProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function UsersManagement({ initialFilters = {} }: UsersManagementProps) {
  const t = useTranslations();
  
  // Data state
  const [users, setUsers] = useState<AdminSearchResult<UserWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [permissionMatrixOpen, setPermissionMatrixOpen] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    category: [], // For role filtering
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  // Mock data for development
  const mockUsers: UserWithDetails[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@kitmed.com',
      role: 'admin',
      status: 'active',
      lastLogin: new Date('2024-01-15T10:30:00'),
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-15T10:30:00'),
      phone: '+1234567890',
      department: 'IT Administration',
      twoFactorEnabled: true,
      loginAttempts: 0,
      lastLoginIP: '192.168.1.100',
      isActive: true,
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      _count: {
        activityLogs: 245,
        loginAttempts: 0
      }
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@kitmed.com',
      role: 'manager',
      status: 'active',
      lastLogin: new Date('2024-01-14T16:45:00'),
      createdAt: new Date('2024-01-02T00:00:00'),
      updatedAt: new Date('2024-01-14T16:45:00'),
      phone: '+1234567891',
      department: 'Product Management',
      twoFactorEnabled: true,
      loginAttempts: 1,
      lastLoginIP: '192.168.1.101',
      isActive: true,
      permissions: [
        { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'categories', actions: ['create', 'read', 'update'] },
        { resource: 'partners', actions: ['read', 'update'] }
      ],
      _count: {
        activityLogs: 156,
        loginAttempts: 1
      }
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@kitmed.com',
      role: 'editor',
      status: 'inactive',
      lastLogin: new Date('2024-01-10T09:15:00'),
      createdAt: new Date('2024-01-03T00:00:00'),
      updatedAt: new Date('2024-01-13T12:00:00'),
      phone: '+1234567892',
      department: 'Content',
      twoFactorEnabled: false,
      loginAttempts: 2,
      lastLoginIP: '192.168.1.102',
      isActive: false,
      permissions: [
        { resource: 'products', actions: ['read', 'update'] },
        { resource: 'categories', actions: ['read', 'update'] }
      ],
      _count: {
        activityLogs: 89,
        loginAttempts: 2
      }
    },
    {
      id: '4',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@kitmed.com',
      role: 'viewer',
      status: 'pending',
      lastLogin: undefined,
      createdAt: new Date('2024-01-14T00:00:00'),
      updatedAt: new Date('2024-01-14T00:00:00'),
      phone: '+1234567893',
      department: 'Sales',
      twoFactorEnabled: false,
      loginAttempts: 0,
      isActive: false,
      permissions: [
        { resource: 'products', actions: ['read'] },
        { resource: 'categories', actions: ['read'] },
        { resource: 'partners', actions: ['read'] }
      ],
      _count: {
        activityLogs: 0,
        loginAttempts: 0
      }
    },
    {
      id: '5',
      firstName: 'Alex',
      lastName: 'Thompson',
      email: 'alex.thompson@kitmed.com',
      role: 'editor',
      status: 'suspended',
      lastLogin: new Date('2024-01-12T14:30:00'),
      createdAt: new Date('2024-01-05T00:00:00'),
      updatedAt: new Date('2024-01-13T09:00:00'),
      phone: '+1234567894',
      department: 'Marketing',
      twoFactorEnabled: false,
      loginAttempts: 5,
      lastLoginIP: '192.168.1.103',
      isActive: false,
      permissions: [
        { resource: 'products', actions: ['read', 'update'] }
      ],
      _count: {
        activityLogs: 34,
        loginAttempts: 5
      }
    }
  ];

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on current filters
      let filteredUsers = [...mockUsers];
      
      // Apply search filter
      if (filters.query) {
        const query = filters.query.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.department?.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        filteredUsers = filteredUsers.filter(user => 
          filters.status!.includes(user.status)
        );
      }
      
      // Apply role filter (using category filter for roles)
      if (filters.category && filters.category.length > 0) {
        filteredUsers = filteredUsers.filter(user => 
          filters.category!.includes(user.role)
        );
      }

      // Apply sorting
      filteredUsers.sort((a, b) => {
        const field = filters.sortBy || 'createdAt';
        const order = filters.sortOrder || 'desc';
        
        let aValue: any = a[field as keyof UserWithDetails];
        let bValue: any = b[field as keyof UserWithDetails];
        
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return order === 'desc' ? -result : result;
      });
      
      // Apply pagination
      const startIndex = ((filters.page || 1) - 1) * (filters.pageSize || 10);
      const endIndex = startIndex + (filters.pageSize || 10);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers({
        items: paginatedUsers,
        total: filteredUsers.length,
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
        totalPages: Math.ceil(filteredUsers.length / (filters.pageSize || 10)),
        filters: filters
      });
    } catch (err) {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  // Unified action handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const handleEditUser = (user: UserWithDetails) => {
    setSelectedUser(user);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleQuickView = (user: UserWithDetails) => {
    setSelectedUser(user);
    setQuickViewOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadUsers();
      setDrawerOpen(false);
      setSelectedUser(null);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('admin.users.deleteConfirm'))) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadUsers();
    } catch (error) {
      // Handle error silently
    }
  };

  // Filter handlers
  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status) 
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1,
    }));
  };

  const handleRoleFilter = (role: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category?.includes(role) 
        ? prev.category.filter(r => r !== role)
        : [...(prev.category || []), role],
      page: 1,
    }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (!users) return;
    
    const allSelected = users.items.every(user => 
      selectedUsers.includes(user.id)
    );
    
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.items.map(user => user.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'reset2fa') => {
    if (selectedUsers.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadUsers();
      setSelectedUsers([]);
    } catch (err) {
      // Handle bulk action error silently
    }
  };

  const handleExport = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock CSV content
      const csvContent = mockUsers.map(user => 
        `${user.firstName},${user.lastName},${user.email},${user.role},${user.status}`
      ).join('\n');
      
      const blob = new Blob(['First Name,Last Name,Email,Role,Status\n' + csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Handle export error silently
    }
  };

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

  if (loading && !users) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.users.title')}</h1>
        </div>
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('admin.users.title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>{t('common.export')}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setPermissionMatrixOpen(true)}
            className="flex items-center space-x-2"
          >
            <ShieldCheckIcon className="h-5 w-5" />
            <span>{t('admin.users.permissions')}</span>
          </Button>
          <Button
            onClick={handleAddUser}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{t('admin.users.addUser')}</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('admin.users.searchPlaceholder')}
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* Status filters */}
              {['active', 'inactive', 'pending', 'suspended'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize h-12 px-6"
                >
                  {t(`admin.users.status.${status}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Role filters */}
          <div className="mt-4 flex gap-3">
            <span className="text-sm font-medium text-gray-700 self-center">{t('admin.users.roleFilter')}:</span>
            {['admin', 'manager', 'editor', 'viewer'].map((role) => (
              <Button
                key={role}
                variant={filters.category?.includes(role) ? 'default' : 'outline'}
                onClick={() => handleRoleFilter(role)}
                className="capitalize h-10 px-4"
                size="sm"
              >
                {t(`admin.users.roles.${role}`)}
              </Button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedUsers.length} {selectedUsers.length === 1 ? t('admin.users.userSelected') : t('admin.users.usersSelected')}
                </span>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {t('admin.users.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {t('admin.users.deactivate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('reset2fa')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {t('admin.users.reset2FA')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-gray-200/60">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadUsers} variant="outline">
                {t('errors.tryAgain')}
              </Button>
            </div>
          ) : users?.items && users.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={users.items.every(user => 
                          selectedUsers.includes(user.id)
                        )}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 h-5 w-5"
                      />
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('firstName')}
                    >
                      {t('admin.users.table.user')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      {t('admin.users.table.email')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('role')}
                    >
                      {t('admin.users.table.role')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      {t('admin.users.table.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.users.table.security')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastLogin')}
                    >
                      {t('admin.users.table.lastLogin')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.items.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 h-5 w-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                            ) : (
                              <UserCircleIcon className="h-8 w-8 text-primary-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.department && (
                              <div className="text-sm text-gray-600 mt-1">
                                {user.department}
                              </div>
                            )}
                            {user.phone && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getRoleColor(user.role)} font-medium`}>
                          {t(`admin.users.roles.${user.role}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(user.status)}>
                          {t(`admin.users.status.${user.status}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {user.twoFactorEnabled ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              2FA
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              No 2FA
                            </Badge>
                          )}
                          {user.loginAttempts > 3 && (
                            <Badge variant="destructive" className="text-xs">
                              {user.loginAttempts} {t('admin.users.attempts')}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.lastLogin ? (
                          <div>
                            <div>{formatDate(user.lastLogin)}</div>
                            {user.lastLoginIP && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user.lastLoginIP}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">{t('admin.users.neverLoggedIn')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickView(user)}
                            className="hover:bg-blue-50 hover:text-blue-700"
                            aria-label={t('admin.users.viewUser')}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user)}
                            className="hover:bg-amber-50 hover:text-amber-700"
                            aria-label={t('admin.users.editUser')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-gray-600 hover:text-gray-700"
                            aria-label={t('admin.users.deleteUser')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.users.noUsers')}</h3>
              <p className="text-gray-600 mb-6">{t('admin.users.getStarted')}</p>
              <Button onClick={handleAddUser} className="bg-primary-600 hover:bg-primary-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('admin.users.addFirstUser')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {users && users.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 font-medium">
            {t('search.showingResults', {
              start: ((users.page - 1) * users.pageSize) + 1,
              end: Math.min(users.page * users.pageSize, users.total),
              total: users.total
            })}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={users.page === 1}
              onClick={() => handlePageChange(users.page - 1)}
              className="h-10 px-4"
            >
              {t('common.previous')}
            </Button>
            
            {[...Array(Math.min(5, users.totalPages))].map((_, i) => {
              const page = users.page - 2 + i;
              if (page < 1 || page > users.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === users.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-10 w-10"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              disabled={users.page === users.totalPages}
              onClick={() => handlePageChange(users.page + 1)}
              className="h-10 px-4"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* User Drawer for Add/Edit */}
      <UserDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={selectedUser}
        mode={drawerMode}
        onSave={handleSaveUser}
      />

      {/* Quick View Modal */}
      <UserQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        user={selectedUser}
        onEdit={() => {
          setQuickViewOpen(false);
          handleEditUser(selectedUser!);
        }}
      />

      {/* Permission Matrix Modal */}
      <PermissionMatrix
        open={permissionMatrixOpen}
        onOpenChange={setPermissionMatrixOpen}
      />
    </div>
  );
}