'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersResponse {
  success: boolean;
  data: {
    items: User[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function SimplifiedUsersManagement() {
  const t = useTranslations();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get authentication token
      const token = localStorage.getItem('admin-token');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required. Please login again.');
      }

      console.log('Fetching users with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result: UsersResponse = await response.json();
        console.log('Users API response:', result);
        setUsers(result.data.items);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to load users: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to load users';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Special handling for auth errors
        if (err.message.includes('Authentication') || err.message.includes('Session expired')) {
          // Clear invalid token
          localStorage.removeItem('admin-token');
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      isActive: true
    });
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '', // Don't populate existing password
      role: user.role,
      isActive: user.isActive
    });
    setShowForm(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedUser ? `/api/admin/users/${selectedUser.id}` : '/api/admin/users';
      const method = selectedUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadUsers();
        setShowForm(false);
        setSelectedUser(null);
      } else {
        throw new Error('Failed to save user');
      }
    } catch (err) {
      console.error('Failed to save user:', err);
      setError('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadUsers();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    searchQuery === '' || 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">Manage system users and their access</p>
        </div>
        <Button onClick={handleAddUser} className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <div className="flex justify-center space-x-3 mt-4">
                <Button onClick={loadUsers} variant="outline">
                  Try Again
                </Button>
                {error.includes('Authentication') || error.includes('Session expired') ? (
                  <Button onClick={() => window.location.href = '/fr/admin/login'} className="bg-primary-600 hover:bg-primary-700">
                    Login Again
                  </Button>
                ) : null}
              </div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created {formatDate(user.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getRoleColor(user.role)} capitalize`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin, 'time') : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
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
            <div className="p-6 text-center">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first user.</p>
              <div className="mt-6">
                <Button onClick={handleAddUser}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser ? 'Edit User' : 'Add User'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password {selectedUser && <span className="text-sm text-gray-500">(leave blank to keep current)</span>}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!selectedUser}
                  placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Update' : 'Create'} User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}