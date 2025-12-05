'use client';

import { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * HydrationBoundary - Prevents hydration mismatches by ensuring consistent SSR/client rendering
 * Only renders children after hydration is complete
 */
export function HydrationBoundary({ children, fallback = null }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    setIsHydrated(true);
  }, []);

  // During SSR and before hydration, show fallback
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // After hydration, show actual children
  return <>{children}</>;
}

/**
 * ClientOnly - Component that only renders on client side
 * Use for components that should never render during SSR
 */
export function ClientOnly({ children, fallback = null }: HydrationBoundaryProps) {
  return <HydrationBoundary fallback={fallback}>{children}</HydrationBoundary>;
}

/**
 * SSRSafe - Wrapper for components that need consistent server/client rendering
 */
interface SSRSafeProps {
  children: React.ReactNode;
  condition: () => boolean;
  fallback?: React.ReactNode;
}

export function SSRSafe({ children, condition, fallback = null }: SSRSafeProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(condition());
  }, [condition]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}