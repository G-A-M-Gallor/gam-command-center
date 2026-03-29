// ===================================================
// WATI Resilience & Reliability Utils
// ===================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime,
    };
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === finalConfig.maxRetries) {
        break; // Don't wait after the last attempt
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = finalConfig.baseDelay *
        Math.pow(finalConfig.backoffMultiplier, attempt);

      const delay = Math.min(exponentialDelay, finalConfig.maxDelay);

      // Add jitter to prevent thundering herd
      const finalDelay = finalConfig.jitter
        ? delay * (0.5 + Math.random() * 0.5)
        : delay;

      console.warn(`WATI attempt ${attempt + 1} failed, retrying in ${Math.round(finalDelay)}ms:`, error);
      await sleep(finalDelay);
    }
  }

  throw new Error(`WATI failed after ${finalConfig.maxRetries + 1} attempts. Last error: ${lastError}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Circuit breakers for different WATI operations
export const watiCircuitBreakers = {
  getContacts: new CircuitBreaker(5, 30000),
  getMessages: new CircuitBreaker(5, 30000),
  sendMessage: new CircuitBreaker(3, 60000), // More strict for sending
};

// Enhanced WATI request wrapper
export async function resilientWatiRequest<T>(
  operation: () => Promise<T>,
  operationType: keyof typeof watiCircuitBreakers,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  const circuitBreaker = watiCircuitBreakers[operationType];

  return circuitBreaker.execute(() =>
    retryWithBackoff(operation, retryConfig)
  );
}

// Health check utilities
export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  details: Record<string, any>;
}

export class HealthChecker {
  private status: HealthStatus = {
    isHealthy: true,
    lastCheck: 0,
    consecutiveFailures: 0,
    details: {},
  };

  async check(checkFn: () => Promise<any>): Promise<HealthStatus> {
    try {
      const result = await checkFn();
      this.status = {
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        details: { result },
      };
    } catch (error) {
      this.status = {
        isHealthy: false,
        lastCheck: Date.now(),
        consecutiveFailures: this.status.consecutiveFailures + 1,
        details: { error: String(error) },
      };
    }

    return this.status;
  }

  getStatus(): HealthStatus {
    return this.status;
  }
}

export const watiHealthChecker = new HealthChecker();