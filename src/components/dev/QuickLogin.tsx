'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function QuickLogin() {
  const [email, setEmail] = useState('admin@kitmed.ma');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        localStorage.setItem('admin-token', data.data.token);
        setResult({
          success: true,
          message: 'Login successful! Token saved.',
          token: data.data.token.substring(0, 20) + '...'
        });

        // Reload page to update auth state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setResult({
          success: false,
          message: data.error?.message || 'Login failed'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-96 mx-auto mt-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Login (Dev Only)</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kitmed.ma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login & Save Token'}
          </Button>

          {result && (
            <div className="mt-4">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Error'}
              </Badge>
              <p className="text-sm mt-2 text-gray-600">{result.message}</p>
              {result.token && (
                <p className="text-xs mt-1 text-gray-500">Token: {result.token}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}