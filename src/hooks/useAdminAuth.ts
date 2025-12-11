'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/types/admin';
import { getAdminToken, setAdminToken, removeAdminToken } from '@/lib/auth-utils';

interface UseAdminAuthReturn {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    setMounted(true);
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAdminToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        // Token is invalid, remove it
        removeAdminToken();
        setUser(null);
        if (response.status === 401) {
          setError('Session expired. Please login again.');
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Authentication check failed');
      removeAdminToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminToken(data.data.token);
        setUser(data.data.user);
        return true;
      } else {
        setError(data.error?.message || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAdminToken();
    setUser(null);
    setError(null);

    // Call logout endpoint to invalidate token on server
    fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAdminToken()}`,
      },
    }).catch(() => {
      // Ignore errors on logout
    });
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  return {
    user,
    loading: loading || !mounted, // Show loading until mounted and auth check completes
    error,
    login,
    logout,
    refreshUser,
  };
}

