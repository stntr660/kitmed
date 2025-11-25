/**
 * React Hook for Feature Flags
 * 
 * Provides a React-friendly interface to the feature flags system
 * with caching and real-time updates.
 */

import { useState, useEffect } from 'react';
import { 
  getFeatureFlags, 
  isFeatureEnabled, 
  MigrationFeatureFlags,
  UIFeatureFlags,
  APIFeatureFlags,
  type FeatureFlags 
} from '@/lib/feature-flags';

interface UseFeatureFlagsReturn {
  flags: FeatureFlags | null;
  isLoading: boolean;
  error: Error | null;
  
  // Migration flags
  shouldUseDisciplines: boolean;
  shouldUseNewAPI: boolean;
  shouldSupportLegacy: boolean;
  isInMigrationMode: boolean;
  
  // UI flags
  shouldShowNewDisciplineUI: boolean;
  shouldShowNewAdminInterface: boolean;
  shouldEnableEnhancedFilters: boolean;
  
  // API flags
  shouldUseNewDisciplineEndpoints: boolean;
  shouldUseNewCategoryEndpoints: boolean;
  shouldIncludeLegacyFields: boolean;
  
  // Utility functions
  refreshFlags: () => Promise<void>;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

/**
 * Primary hook for accessing feature flags in React components
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load flags on mount and set up refresh interval
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const loadFlags = async () => {
      try {
        setError(null);
        const currentFlags = await getFeatureFlags();
        
        if (mounted) {
          setFlags(currentFlags);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load feature flags'));
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadFlags();

    // Set up periodic refresh (every 5 minutes)
    intervalId = setInterval(loadFlags, 5 * 60 * 1000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Manual refresh function
  const refreshFlags = async () => {
    setIsLoading(true);
    try {
      const currentFlags = await getFeatureFlags(true); // Force refresh
      setFlags(currentFlags);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh feature flags'));
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to check if a flag is enabled
  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags ? flags[flag] : false;
  };

  return {
    flags,
    isLoading,
    error,
    
    // Migration flags
    shouldUseDisciplines: flags?.SEPARATE_DISCIPLINES_CATEGORIES || false,
    shouldUseNewAPI: flags?.NEW_DISCIPLINE_API || false,
    shouldSupportLegacy: flags?.LEGACY_CATEGORY_SUPPORT || false,
    isInMigrationMode: flags?.MIGRATION_MODE || false,
    
    // UI flags
    shouldShowNewDisciplineUI: flags?.NEW_DISCIPLINE_UI || false,
    shouldShowNewAdminInterface: flags?.NEW_ADMIN_INTERFACE || false,
    shouldEnableEnhancedFilters: flags?.ENHANCED_PRODUCT_FILTERS || false,
    
    // API flags
    shouldUseNewDisciplineEndpoints: flags?.NEW_DISCIPLINE_API || false,
    shouldUseNewCategoryEndpoints: flags?.NEW_CATEGORY_API || false,
    shouldIncludeLegacyFields: flags?.LEGACY_CATEGORY_SUPPORT || false,
    
    // Utility functions
    refreshFlags,
    isEnabled,
  };
}

/**
 * Hook specifically for migration-related feature flags
 */
export function useMigrationFeatureFlags() {
  const { flags, isLoading, error, refreshFlags } = useFeatureFlags();
  const [dataSource, setDataSource] = useState<'legacy' | 'hybrid' | 'new'>('legacy');

  useEffect(() => {
    if (flags) {
      MigrationFeatureFlags.getDataSource().then(setDataSource);
    }
  }, [flags]);

  return {
    isLoading,
    error,
    refreshFlags,
    
    // Migration-specific flags
    shouldUseDisciplines: flags?.SEPARATE_DISCIPLINES_CATEGORIES || false,
    shouldUseNewAPI: flags?.NEW_DISCIPLINE_API || false,
    shouldSupportLegacy: flags?.LEGACY_CATEGORY_SUPPORT || false,
    isInMigrationMode: flags?.MIGRATION_MODE || false,
    dataSource,
    
    // Migration utility functions
    async shouldUseDisciplinesAsync() {
      return await MigrationFeatureFlags.shouldUseDisciplines();
    },
    
    async shouldUseNewAPIAsync() {
      return await MigrationFeatureFlags.shouldUseNewAPI();
    },
    
    async shouldSupportLegacyAsync() {
      return await MigrationFeatureFlags.shouldSupportLegacy();
    },
    
    async isInMigrationModeAsync() {
      return await MigrationFeatureFlags.isInMigrationMode();
    },
  };
}

/**
 * Hook for UI-specific feature flags
 */
export function useUIFeatureFlags() {
  const { flags, isLoading, error } = useFeatureFlags();

  return {
    isLoading,
    error,
    
    // UI-specific flags
    shouldShowNewDisciplineUI: flags?.NEW_DISCIPLINE_UI || false,
    shouldShowNewAdminInterface: flags?.NEW_ADMIN_INTERFACE || false,
    shouldEnableEnhancedFilters: flags?.ENHANCED_PRODUCT_FILTERS || false,
    
    // UI utility functions
    async shouldShowNewDisciplineUIAsync() {
      return await UIFeatureFlags.shouldShowNewDisciplineUI();
    },
    
    async shouldShowNewAdminInterfaceAsync() {
      return await UIFeatureFlags.shouldShowNewAdminInterface();
    },
    
    async shouldEnableEnhancedFiltersAsync() {
      return await UIFeatureFlags.shouldEnableEnhancedFilters();
    },
  };
}

/**
 * Hook for API-specific feature flags
 */
export function useAPIFeatureFlags() {
  const { flags, isLoading, error } = useFeatureFlags();

  return {
    isLoading,
    error,
    
    // API-specific flags
    shouldUseNewDisciplineEndpoints: flags?.NEW_DISCIPLINE_API || false,
    shouldUseNewCategoryEndpoints: flags?.NEW_CATEGORY_API || false,
    shouldIncludeLegacyFields: flags?.LEGACY_CATEGORY_SUPPORT || false,
    
    // API utility functions
    async shouldUseNewDisciplineEndpointsAsync() {
      return await APIFeatureFlags.shouldUseNewDisciplineEndpoints();
    },
    
    async shouldUseNewCategoryEndpointsAsync() {
      return await APIFeatureFlags.shouldUseNewCategoryEndpoints();
    },
    
    async shouldIncludeLegacyFieldsAsync() {
      return await APIFeatureFlags.shouldIncludeLegacyFields();
    },
  };
}

/**
 * Hook for checking a specific feature flag with real-time updates
 */
export function useFeatureFlag(flag: keyof FeatureFlags) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        const enabled = await isFeatureEnabled(flag);
        if (mounted) {
          setIsEnabled(enabled);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsEnabled(false);
          setIsLoading(false);
        }
      }
    };

    checkFlag();

    // Set up periodic refresh
    const intervalId = setInterval(checkFlag, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [flag]);

  return { isEnabled, isLoading };
}

/**
 * Provider component for feature flags context (optional)
 */
export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const flags = useFeatureFlags();

  useEffect(() => {
    // Log feature flag changes in development
    if (process.env.NODE_ENV === 'development' && flags.flags) {
      console.log('🚩 Feature Flags Updated:', flags.flags);
    }
  }, [flags.flags]);

  return <>{children}</>;
}