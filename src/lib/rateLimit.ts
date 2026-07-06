interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

// Clean up stale rate limits every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (now > bucket.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Basic in-memory IP rate limiter.
 * @param ip Client IP address.
 * @param limit Max allowed requests within duration window.
 * @param windowMs Duration window in milliseconds.
 * @returns boolean True if rate limited (exceeded), False if allowed.
 */
export function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now > bucket.resetTime) {
    // Initialize bucket
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  bucket.count++;
  if (bucket.count > limit) {
    return true;
  }

  return false;
}
