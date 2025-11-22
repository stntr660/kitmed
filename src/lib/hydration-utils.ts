/**
 * Hydration utilities for preventing SSR/client mismatches
 */
import React from 'react';

let idCounter = 0;

/**
 * Generates consistent IDs for SSR and client-side rendering
 * Uses a counter instead of Math.random() to ensure consistency
 */
export function generateStableId(prefix: string = 'id'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Generates unique ID that's stable across SSR/client hydration
 * Falls back to provided ID or generates stable one
 */
export function getStableId(id?: string, prefix?: string): string {
  if (id) return id;
  return generateStableId(prefix);
}

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safe accessor for window/document that won't break SSR
 */
export function safeWindow<T = any>(accessor: (window: Window) => T, fallback?: T): T | undefined {
  if (!isBrowser()) return fallback;
  try {
    return accessor(window);
  } catch {
    return fallback;
  }
}

/**
 * Safely access localStorage with SSR fallback
 */
export function safeLocalStorage() {
  if (!isBrowser()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return localStorage;
}

/**
 * Format date consistently for SSR and client
 * Uses stable formatting to prevent hydration mismatches
 */
export function formatDateStable(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Use UTC formatting to ensure consistency across server/client
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Debounce function for preventing rapid state updates during hydration
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Hook for managing hydration state
 */
export function useHydrationState() {
  if (!isBrowser()) {
    return { isHydrated: false, isClient: false };
  }
  
  const [isHydrated, setIsHydrated] = React.useState(false);
  
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  return { isHydrated, isClient: true };
}