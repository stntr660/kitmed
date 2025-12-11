'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientOnly } from '@/components/ui/client-only';
import { getAdminToken, removeAdminToken } from '@/lib/auth-utils';

interface AuthDebugInfoProps {
  show?: boolean;
}

function AuthDebugInfoComponent({ show = false }: AuthDebugInfoProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(show);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAdminToken();
      const info = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'No token',
        localStorage: {
          keys: Object.keys(localStorage),
          adminToken: getAdminToken() ? 'Present' : 'Missing'
        },
        cookies: document.cookie ? document.cookie.split(';').map(c => c.trim()) : [],
        timestamp: new Date().toLocaleString()
      };
      setDebugInfo(info);
    }
  }, []);

  const testAuthEndpoint = async () => {
    const token = getAdminToken();
    try {
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      setDebugInfo(prev => ({
        ...prev,
        lastAuthTest: {
          status: response.status,
          success: response.ok,
          result,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Auth test error:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastAuthTest: {
          error: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  const testUsersEndpoint = async () => {
    const token = getAdminToken();
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      setDebugInfo(prev => ({
        ...prev,
        lastUsersTest: {
          status: response.status,
          success: response.ok,
          result,
          timestamp: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Users test error:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastUsersTest: {
          error: error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    }
  };

  const clearToken = () => {
    removeAdminToken();
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 bg-white shadow-lg z-50"
      >
        Debug Auth
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-white shadow-lg z-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Auth Debug Info</h3>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            ×
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-medium">Token Status:</div>
              <Badge variant={debugInfo.hasToken ? 'default' : 'destructive'}>
                {debugInfo.hasToken ? 'Present' : 'Missing'}
              </Badge>
              {debugInfo.hasToken && (
                <div className="text-xs text-gray-600 mt-1">
                  Length: {debugInfo.tokenLength} chars<br/>
                  Preview: {debugInfo.tokenPrefix}
                </div>
              )}
            </div>

            <div>
              <div className="font-medium">Storage:</div>
              <div className="text-xs text-gray-600">
                localStorage keys: {debugInfo.localStorage.keys.join(', ')}<br/>
                Admin token: {debugInfo.localStorage.adminToken}
              </div>
            </div>

            {debugInfo.lastAuthTest && (
              <div>
                <div className="font-medium">Last Auth Test:</div>
                <Badge variant={debugInfo.lastAuthTest.success ? 'default' : 'destructive'}>
                  {debugInfo.lastAuthTest.status}
                </Badge>
                <div className="text-xs text-gray-600 mt-1">
                  {debugInfo.lastAuthTest.timestamp}
                </div>
              </div>
            )}

            {debugInfo.lastUsersTest && (
              <div>
                <div className="font-medium">Last Users Test:</div>
                <Badge variant={debugInfo.lastUsersTest.success ? 'default' : 'destructive'}>
                  {debugInfo.lastUsersTest.status}
                </Badge>
                <div className="text-xs text-gray-600 mt-1">
                  {debugInfo.lastUsersTest.timestamp}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={testAuthEndpoint} size="sm" variant="outline" className="w-full">
                Test Auth Endpoint
              </Button>
              <Button onClick={testUsersEndpoint} size="sm" variant="outline" className="w-full">
                Test Users Endpoint
              </Button>
              <Button onClick={clearToken} size="sm" variant="destructive" className="w-full">
                Clear Token & Reload
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Last updated: {debugInfo.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AuthDebugInfo(props: AuthDebugInfoProps) {
  return (
    <ClientOnly fallback={null}>
      <AuthDebugInfoComponent {...props} />
    </ClientOnly>
  );
}