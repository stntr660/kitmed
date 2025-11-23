'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A hydration-safe wrapper for useParams that prevents SSR/client mismatches
 * Returns empty params during SSR and actual params after hydration
 */
export function useHydrationSafeParams() {
  const params = useParams();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Return empty params during SSR to match server-side rendering
  return isHydrated ? params : {};
}

/**
 * Hook to get locale safely during SSR
 */
export function useHydrationSafeLocale(fallback: string = 'fr'): string {
  const params = useHydrationSafeParams();
  return (params?.locale as string) || fallback;
}