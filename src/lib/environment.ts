// Environment configuration utility for GAM Command Center
// Handles production, staging, and development environments

export type Environment = 'production' | 'staging' | 'development';

export interface EnvironmentConfig {
  name: Environment;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  apiUrl: string;
  supabaseUrl: string;
  showDebugInfo: boolean;
  enableAnalytics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  features: {
    stagingBanner: boolean;
    debugPanel: boolean;
    performanceMonitoring: boolean;
    experimentalFeatures: boolean;
  };
}

// Determine current environment
export function getCurrentEnvironment(): Environment {
  // Check explicit staging indicators
  if (process.env.STAGING_MODE === 'true' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'staging') {
    return 'staging';
  }

  // Check for production
  if (process.env.NODE_ENV === 'production' &&
      !process.env.STAGING_MODE) {
    return 'production';
  }

  // Default to development
  return 'development';
}

// Get environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();

  const baseConfig = {
    apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  };

  switch (env) {
    case 'production':
      return {
        name: 'production',
        isProduction: true,
        isStaging: false,
        isDevelopment: false,
        ...baseConfig,
        showDebugInfo: false,
        enableAnalytics: true,
        logLevel: 'info',
        features: {
          stagingBanner: false,
          debugPanel: false,
          performanceMonitoring: true,
          experimentalFeatures: false,
        },
      };

    case 'staging':
      return {
        name: 'staging',
        isProduction: false,
        isStaging: true,
        isDevelopment: false,
        ...baseConfig,
        showDebugInfo: true,
        enableAnalytics: false,
        logLevel: 'debug',
        features: {
          stagingBanner: true,
          debugPanel: true,
          performanceMonitoring: true,
          experimentalFeatures: true,
        },
      };

    case 'development':
      return {
        name: 'development',
        isProduction: false,
        isStaging: false,
        isDevelopment: true,
        ...baseConfig,
        showDebugInfo: true,
        enableAnalytics: false,
        logLevel: 'debug',
        features: {
          stagingBanner: false,
          debugPanel: true,
          performanceMonitoring: false,
          experimentalFeatures: true,
        },
      };

    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

// Utility functions
export const env = getEnvironmentConfig();

export function isProduction(): boolean {
  return env.isProduction;
}

export function isStaging(): boolean {
  return env.isStaging;
}

export function isDevelopment(): boolean {
  return env.isDevelopment;
}

// Feature flags based on environment
export function shouldShowStagingBanner(): boolean {
  return env.features.stagingBanner;
}

export function shouldShowDebugPanel(): boolean {
  return env.features.debugPanel;
}

export function shouldEnablePerformanceMonitoring(): boolean {
  return env.features.performanceMonitoring;
}

export function shouldEnableExperimentalFeatures(): boolean {
  return env.features.experimentalFeatures;
}

// Environment-specific configurations
export const environmentConfig = {
  database: {
    maxConnections: isProduction() ? 20 : isStaging() ? 10 : 5,
    connectionTimeout: isProduction() ? 30000 : isStaging() ? 20000 : 10000,
    poolSize: isProduction() ? 'auto' : isStaging() ? 'medium' : 'small',
  },

  cache: {
    ttl: isProduction() ? 3600 : isStaging() ? 1800 : 300, // seconds
    maxSize: isProduction() ? '1gb' : isStaging() ? '500mb' : '100mb',
    strategy: isProduction() ? 'redis' : isStaging() ? 'memory' : 'none',
  },

  api: {
    rateLimit: {
      requests: isProduction() ? 100 : isStaging() ? 200 : 1000,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    timeout: isProduction() ? 30000 : isStaging() ? 45000 : 60000,
  },

  monitoring: {
    errorReporting: isProduction() || isStaging(),
    performanceTracking: isProduction() || isStaging(),
    debugLogging: isStaging() || isDevelopment(),
  },

  features: {
    cronJobs: {
      enabled: isProduction() || isStaging(),
      frequency: isProduction() ? 'normal' : isStaging() ? 'reduced' : 'disabled',
    },

    notifications: {
      email: isProduction(),
      slack: isProduction() || isStaging(),
      push: isProduction(),
    },

    backup: {
      enabled: isProduction() || isStaging(),
      retention: isProduction() ? 30 : isStaging() ? 7 : 1, // days
      frequency: isProduction() ? 'daily' : isStaging() ? 'weekly' : 'manual',
    },
  },
};

// Log current environment on import
if (typeof window === 'undefined') {
  console.log(`🌍 GAM Command Center - Environment: ${env.name.toUpperCase()}`);
  if (env.isStaging) {
    console.log('⚠️  STAGING MODE: Enhanced debugging enabled');
  }
}