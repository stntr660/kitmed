'use client';

import { ReactNode } from 'react';
import { useIsHydrated } from './hydration-safe';

interface SSRSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Component that prevents hydration mismatches by rendering fallback content during SSR
 */
export function SSRSafe({ children, fallback = null, className }: SSRSafeProps) {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
}

interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component for conditional rendering that prevents hydration mismatches
 */
export function ConditionalRender({ condition, children, fallback = null }: ConditionalRenderProps) {
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{condition ? children : fallback}</>;
}