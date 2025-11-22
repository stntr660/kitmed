/**
 * Environment Variable Validation
 * Ensures all required environment variables are set for production deployment
 */

interface EnvironmentConfig {
  JWT_SECRET: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
}

/**
 * Validates that all required environment variables are set
 * Throws an error if any critical variables are missing
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  
  // Critical variables that must be set
  const requiredVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // JWT_SECRET security validation
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    if (process.env.JWT_SECRET.includes('fallback') || process.env.JWT_SECRET.includes('default')) {
      errors.push('JWT_SECRET contains insecure fallback value - change immediately');
    }
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Additional production requirements
    if (!process.env.ADMIN_EMAIL) {
      errors.push('ADMIN_EMAIL required for production deployment');
    }
    if (!process.env.ADMIN_PASSWORD_HASH) {
      errors.push('ADMIN_PASSWORD_HASH required for production deployment');
    }
    
    // Database URL validation for production
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgresql://')) {
      console.warn('⚠️  Warning: Production should use PostgreSQL database');
    }
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    const errorMessage = `❌ Environment validation failed:\n${errors.map(err => `  - ${err}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  // Return validated config
  return {
    JWT_SECRET: process.env.JWT_SECRET!,
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: process.env.NODE_ENV!,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };
}

/**
 * Validates environment on application startup
 * Call this in your main app initialization
 */
export function initializeEnvironment(): void {
  try {
    const config = validateEnvironment();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment validation passed');
      console.log(`📊 Database: ${config.DATABASE_URL.includes('postgresql') ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`🔐 JWT Secret length: ${config.JWT_SECRET.length} characters`);
    }
    
  } catch (error) {
    console.error('🚨 CRITICAL: Environment validation failed');
    console.error((error as Error).message);
    
    // In production, exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get secure logging function that respects environment
 */
export function getLogger() {
  return {
    error: (message: string, context?: any) => {
      if (isDevelopment()) {
        console.error(message, context);
      }
      // In production, send to proper logging service
      // TODO: Integrate with logging service (e.g., Sentry, LogRocket)
    },
    warn: (message: string, context?: any) => {
      if (isDevelopment()) {
        console.warn(message, context);
      }
      // TODO: Production warning logging
    },
    info: (message: string, context?: any) => {
      if (isDevelopment()) {
        console.log(message, context);
      }
      // TODO: Production info logging
    }
  };
}