'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HydrationError {
  timestamp: string;
  error: string;
  component?: string;
  stack?: string;
}

interface HydrationDebuggerProps {
  enabled?: boolean;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export function HydrationDebugger({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}: HydrationDebuggerProps) {
  const [hydrationErrors, setHydrationErrors] = useState<HydrationError[]>([]);
  const [hydrationStatus, setHydrationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setIsVisible(true);

    // Listen for hydration errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');

      // Detect hydration-related errors
      if (
        message.includes('hydration') ||
        message.includes('server HTML') ||
        message.includes('client-side') ||
        message.includes('Text content does not match') ||
        message.includes('Expected server HTML')
      ) {
        const error: HydrationError = {
          timestamp: new Date().toISOString(),
          error: message,
          stack: args.find(arg => arg?.stack)?.stack
        };

        setHydrationErrors(prev => [...prev, error]);
        setHydrationStatus('error');
      }

      originalError(...args);
    };

    // Check for successful hydration
    const timer = setTimeout(() => {
      if (hydrationErrors.length === 0) {
        setHydrationStatus('success');
      }
    }, 3000);

    return () => {
      console.error = originalError;
      clearTimeout(timer);
    };
  }, [enabled, hydrationErrors.length]);

  if (!enabled || !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const getStatusIcon = () => {
    switch (hydrationStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (hydrationStatus) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <Card className={`${getStatusColor()} shadow-lg`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            Hydration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize font-medium">{hydrationStatus}</span>
            </div>
            <div className="flex justify-between">
              <span>Errors:</span>
              <span className={hydrationErrors.length > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                {hydrationErrors.length}
              </span>
            </div>
          </div>

          {hydrationErrors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Recent Errors:
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {hydrationErrors.slice(-3).map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-white rounded border">
                    <div className="text-gray-500 mb-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-red-700 break-words">
                      {error.error.substring(0, 100)}
                      {error.error.length > 100 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hydrationStatus === 'success' && (
            <div className="text-sm text-green-700">
              ✅ No hydration mismatches detected
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            Development mode only
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to monitor hydration status
 */
export function useHydrationMonitor() {
  const [errors, setErrors] = useState<HydrationError[]>([]);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const originalError = console.error;

    console.error = (...args: any[]) => {
      const message = args.join(' ');

      if (message.includes('hydration') || message.includes('server HTML')) {
        const error: HydrationError = {
          timestamp: new Date().toISOString(),
          error: message,
        };

        setErrors(prev => [...prev, error]);
        setStatus('error');
      }

      originalError(...args);
    };

    const timer = setTimeout(() => {
      if (errors.length === 0) {
        setStatus('success');
      }
    }, 2000);

    return () => {
      console.error = originalError;
      clearTimeout(timer);
    };
  }, [errors.length]);

  return { errors, status, hasErrors: errors.length > 0 };
}