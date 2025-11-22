'use client';

import { useState, useEffect } from 'react';
import { AdminUser } from '@/types/admin';

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

      const token = getAuthToken();
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
        removeAuthToken();
        setUser(null);
        if (response.status === 401) {
          setError('Session expired. Please login again.');
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Authentication check failed');
      removeAuthToken();
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
        setAuthToken(data.data.token);
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
    removeAuthToken();
    setUser(null);
    setError(null);

    // Call logout endpoint to invalidate token on server
    fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
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

// Token management utilities
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // In development, use localStorage first (HTTP-only cookies not accessible to JS)
  if (process.env.NODE_ENV === 'development') {
    return localStorage.getItem('admin-token');
  }
  
  // In production, try cookies first, then localStorage as fallback
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('admin-token=')
  );
  
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  // Fallback to localStorage
  return localStorage.getItem('admin-token');
}

function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for testing (httpOnly cookies are handled server-side)
  localStorage.setItem('admin-token', token);
}

function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  // Remove cookie
  document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  
  // Remove from localStorage
  localStorage.removeItem('admin-token');
}