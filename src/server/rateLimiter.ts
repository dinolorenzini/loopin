/**
 * Token Bucket Rate Limiter for WebSocket actions and HTTP requests.
 * Lightweight, in-memory, zero external dependencies.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly fillRatePerMs: number;

  constructor(capacity: number, refillPerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.fillRatePerMs = refillPerSecond / 1000;
  }

  public tryConsume(tokens = 1): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRatePerMs);
    this.lastRefill = now;

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}

/**
 * IP-based Rate Limiter for HTTP endpoints (e.g. /api/gifs)
 */
export class IpRateLimiter {
  private limits = new Map<string, TokenBucketRateLimiter>();
  private readonly capacity: number;
  private readonly refillPerSecond: number;

  constructor(capacity = 30, refillPerSecond = 5) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
  }

  public check(ip: string): boolean {
    let limiter = this.limits.get(ip);
    if (!limiter) {
      limiter = new TokenBucketRateLimiter(this.capacity, this.refillPerSecond);
      this.limits.set(ip, limiter);

      // Clean up stale entries periodically to prevent memory leaks
      if (this.limits.size > 2000) {
        this.limits.clear();
      }
    }
    return limiter.tryConsume(1);
  }
}
