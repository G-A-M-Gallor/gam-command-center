/**
 * Rate limiting for API routes.
 *
 * Uses in-memory sliding window per IP. On Vercel serverless, each instance
 * has its own map — this provides per-instance protection (enough for single-_user
 * internal app). For multi-instance protection, Vercel Firewall dashboard rules
 * are the additional layer.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limiters = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitConfig {
  /** Unique name for this limiter (e.g., "ai-chat", "auth") */
  name: string;
  /** Max requests per window */
  limit: number;
  /** Window in seconds */
  windowSeconds: number;
}

// Preset configs for different route categories
export const RATE_LIMITS = {
  /** AI routes — expensive, burn Claude API tokens */
  ai: { name: "ai", limit: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Auth routes — brute force protection */
  auth: { name: "auth", limit: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Work Manager — heavy multi-agent calls */
  workManager: { name: "work-manager", limit: 10, windowSeconds: 60 } as RateLimitConfig,
  /** General API — default for other routes */
  general: { name: "general", limit: 60, windowSeconds: 60 } as RateLimitConfig,
  /** Webhooks — external services calling us */
  webhook: { name: "webhook", limit: 100, windowSeconds: 60 } as RateLimitConfig,
} as const;

function getClientIp(_request: Request): string {
  const _headers = request.headers;
  // Vercel sets x-forwarded-for; take the first (client) IP
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/**
 * Check rate limit for a request.
 * Returns { limited: false } if OK, or a 429 Response if rate limited.
 */
export function checkRateLimit(
  _request: Request,
  config: RateLimitConfig
): { limited: false } | { limited: true; response: Response } {
  const ip = getClientIp(_request);
  const key = `${config.name}:${ip}`;

  if (!limiters.has(config.name)) {
    limiters.set(config.name, new Map());
  }
  const store = limiters.get(config.name)!;

  const now = Date.now();
  const entry = store.get(key);

  // Clean expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { limited: false };
  }

  entry.count++;

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      limited: true,
      response: new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      ),
    };
  }

  return { limited: false };
}
