/**
 * Feature Flags for Disciplines-Categories Separation
 *
 * This module manages feature flags for the gradual rollout of the new
 * disciplines and categories architecture. It provides safe fallbacks
 * and backward compatibility during the migration period.
 */

export interface FeatureFlags {
  // Core separation feature
  SEPARATE_DISCIPLINES_CATEGORIES: boolean;

  // API endpoints
  NEW_DISCIPLINE_API: boolean;
  NEW_CATEGORY_API: boolean;
  LEGACY_CATEGORY_SUPPORT: boolean;

  // Frontend features
  NEW_DISCIPLINE_UI: boolean;
  NEW_ADMIN_INTERFACE: boolean;
  ENHANCED_PRODUCT_FILTERS: boolean;

  // Data migration
  MIGRATION_MODE: boolean;
  DATA_VALIDATION_MODE: boolean;

  // Performance optimizations
  OPTIMIZED_QUERIES: boolean;
  CACHED_RELATIONSHIPS: boolean;
}

/**
 * Default feature flag values
 * Safe defaults that maintain backward compatibility
 */
const DEFAULT_FLAGS: FeatureFlags = {
  SEPARATE_DISCIPLINES_CATEGORIES: false,
  NEW_DISCIPLINE_API: false,
  NEW_CATEGORY_API: false,
  LEGACY_CATEGORY_SUPPORT: true,
  NEW_DISCIPLINE_UI: false,
  NEW_ADMIN_INTERFACE: false,
  ENHANCED_PRODUCT_FILTERS: false,
  MIGRATION_MODE: false,
  DATA_VALIDATION_MODE: false,
  OPTIMIZED_QUERIES: false,
  CACHED_RELATIONSHIPS: false,
};

/**
 * Environment-based feature flag configuration
 */
function loadEnvironmentFlags(): Partial<FeatureFlags> {
  const envFlags: Partial<FeatureFlags> = {};

  // Parse boolean environment variables
  const boolEnvVars: (keyof FeatureFlags)[] = [
    'SEPARATE_DISCIPLINES_CATEGORIES',
    'NEW_DISCIPLINE_API',
    'NEW_CATEGORY_API',
    'LEGACY_CATEGORY_SUPPORT',
    'NEW_DISCIPLINE_UI',
    'NEW_ADMIN_INTERFACE',
    'ENHANCED_PRODUCT_FILTERS',
    'MIGRATION_MODE',
    'DATA_VALIDATION_MODE',
    'OPTIMIZED_QUERIES',
    'CACHED_RELATIONSHIPS',
  ];

  boolEnvVars.forEach(flag => {
    const envValue = process.env[`FEATURE_${flag}`];
    if (envValue !== undefined) {
      envFlags[flag] = envValue.toLowerCase() === 'true';
    }
  });

  return envFlags;
}

/**
 * Database-based feature flag configuration
 * This allows for runtime feature flag changes without deployment
 */
async function loadDatabaseFlags(): Promise<Partial<FeatureFlags>> {
  try {
    // In a real implementation, you'd load from a feature flags table
    // For now, we'll return empty to use environment/default values
    return {};
  } catch (error) {

    return {};
  }
}

/**
 * Merge feature flags from multiple sources
 * Priority: Database > Environment > Defaults
 */
async function createFeatureFlags(): Promise<FeatureFlags> {
  const environmentFlags = loadEnvironmentFlags();
  const databaseFlags = await loadDatabaseFlags();

  return {
    ...DEFAULT_FLAGS,
    ...environmentFlags,
    ...databaseFlags,
  };
}

/**
 * Cached feature flags instance
 */
let cachedFlags: FeatureFlags | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current feature flags with caching
 */
export async function getFeatureFlags(forceRefresh = false): Promise<FeatureFlags> {
  const now = Date.now();

  if (!forceRefresh && cachedFlags && (now - lastCacheTime) < CACHE_TTL) {
    return cachedFlags;
  }

  cachedFlags = await createFeatureFlags();
  lastCacheTime = now;

  return cachedFlags;
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[feature];
}

/**
 * Migration-specific feature flag helpers
 */
export class MigrationFeatureFlags {
  /**
   * Check if we should use the new disciplines system
   */
  static async shouldUseDisciplines(): Promise<boolean> {
    return await isFeatureEnabled('SEPARATE_DISCIPLINES_CATEGORIES');
  }

  /**
   * Check if we should use new API endpoints
   */
  static async shouldUseNewAPI(): Promise<boolean> {
    return await isFeatureEnabled('NEW_DISCIPLINE_API');
  }

  /**
   * Check if we should maintain legacy support
   */
  static async shouldSupportLegacy(): Promise<boolean> {
    return await isFeatureEnabled('LEGACY_CATEGORY_SUPPORT');
  }

  /**
   * Check if we're in migration mode (extra validation, logging)
   */
  static async isInMigrationMode(): Promise<boolean> {
    return await isFeatureEnabled('MIGRATION_MODE');
  }

  /**
   * Get the appropriate data source based on feature flags
   */
  static async getDataSource(): Promise<'legacy' | 'hybrid' | 'new'> {
    const useDisciplines = await this.shouldUseDisciplines();
    const supportLegacy = await this.shouldSupportLegacy();

    if (useDisciplines && supportLegacy) {
      return 'hybrid';
    } else if (useDisciplines) {
      return 'new';
    } else {
      return 'legacy';
    }
  }
}

/**
 * API-specific feature flag helpers
 */
export class APIFeatureFlags {
  /**
   * Check if should use new discipline endpoints
   */
  static async shouldUseNewDisciplineEndpoints(): Promise<boolean> {
    return await isFeatureEnabled('NEW_DISCIPLINE_API');
  }

  /**
   * Check if should use new category endpoints
   */
  static async shouldUseNewCategoryEndpoints(): Promise<boolean> {
    return await isFeatureEnabled('NEW_CATEGORY_API');
  }

  /**
   * Check if should include legacy fields in responses
   */
  static async shouldIncludeLegacyFields(): Promise<boolean> {
    return await isFeatureEnabled('LEGACY_CATEGORY_SUPPORT');
  }
}

/**
 * UI-specific feature flag helpers
 */
export class UIFeatureFlags {
  /**
   * Check if should show new discipline UI
   */
  static async shouldShowNewDisciplineUI(): Promise<boolean> {
    return await isFeatureEnabled('NEW_DISCIPLINE_UI');
  }

  /**
   * Check if should show new admin interface
   */
  static async shouldShowNewAdminInterface(): Promise<boolean> {
    return await isFeatureEnabled('NEW_ADMIN_INTERFACE');
  }

  /**
   * Check if should enable enhanced filters
   */
  static async shouldEnableEnhancedFilters(): Promise<boolean> {
    return await isFeatureEnabled('ENHANCED_PRODUCT_FILTERS');
  }
}

/**
 * Performance feature flag helpers
 */
export class PerformanceFeatureFlags {
  /**
   * Check if should use optimized queries
   */
  static async shouldUseOptimizedQueries(): Promise<boolean> {
    return await isFeatureEnabled('OPTIMIZED_QUERIES');
  }

  /**
   * Check if should use cached relationships
   */
  static async shouldUseCachedRelationships(): Promise<boolean> {
    return await isFeatureEnabled('CACHED_RELATIONSHIPS');
  }
}

/**
 * Development and testing helpers
 */
export class DevFeatureFlags {
  /**
   * Enable all new features (for testing)
   */
  static async enableAll(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('enableAll() can only be used in development');
    }

    cachedFlags = Object.keys(DEFAULT_FLAGS).reduce((flags, key) => {
      flags[key as keyof FeatureFlags] = true;
      return flags;
    }, {} as FeatureFlags);

    lastCacheTime = Date.now();
  }

  /**
   * Disable all new features (safe mode)
   */
  static async disableAll(): Promise<void> {
    cachedFlags = { ...DEFAULT_FLAGS };
    lastCacheTime = Date.now();
  }

  /**
   * Get current flag state for debugging
   */
  static async getDebugInfo(): Promise<{ flags: FeatureFlags; source: string }> {
    const flags = await getFeatureFlags();
    const source = cachedFlags ? 'cache' : 'fresh';

    return { flags, source };
  }
}

/**
 * Export commonly used flags as constants for performance
 */
export const FEATURE_FLAGS = {
  MigrationFeatureFlags,
  APIFeatureFlags,
  UIFeatureFlags,
  PerformanceFeatureFlags,
  DevFeatureFlags,
} as const;