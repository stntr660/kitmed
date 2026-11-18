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
 * Locale of the current [locale] route segment.
 * The segment is known on the server and on the client, so it is read directly
 * (same value during SSR and hydration -> no mismatch). It used to go through
 * useHydrationSafeParams, which returned the fallback ('fr') on the first render:
 * pages fetched their data twice (fr, then en) and the French response could land
 * last, so /en listing pages showed French category and product names.
 */
export function useHydrationSafeLocale(fallback: string = 'fr'): string {
  const params = useParams();
  return (params?.locale as string) || fallback;
}