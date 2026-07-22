import { getRedis } from "@/lib/redis/client";

const ipRequests = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60000;

export interface RateLimitResult {
  success: boolean;
  resetAt?: number;
  remaining?: number;
}

/** In-process rate limit (single Node instance). */
export function rateLimit(
  ip: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, resetAt: record.resetAt, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

/**
 * Distributed rate limit backed by Redis when `REDIS_URL` is set; otherwise
 * falls back to the in-process map above.
 */
export async function rateLimitAsync(
  ip: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
  redis = getRedis(),
): Promise<RateLimitResult> {
  if (!redis) {
    return rateLimit(ip, limit, windowMs);
  }

  const key = `fintech:ratelimit:${ip}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }

    const ttlMs = await redis.pttl(key);
    const resetAt = ttlMs > 0 ? Date.now() + ttlMs : Date.now() + windowMs;

    if (count > limit) {
      return { success: false, resetAt, remaining: 0 };
    }

    return { success: true, resetAt, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.error("[fintech-dashboard][redis] rateLimitAsync failed:", err);
    return rateLimit(ip, limit, windowMs);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}
