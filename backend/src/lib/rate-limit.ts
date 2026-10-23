import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * 🛡️ In-Memory Sliding Window Rate Limiter
 * ==============================================================================
 * Protects authentication, OTP, registration, and sensitive endpoints against
 * brute force, credential stuffing, and denial-of-service abuse.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired buckets every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000).unref();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // If multiple IPs are forwarded, the first is the real client IP
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return "127.0.0.1";
}

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { keyPrefix, limit, windowSeconds } = options;
  const storeKey = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = rateLimitStore.get(storeKey);

  if (!record || record.resetTime <= now) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetSeconds: windowSeconds,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  return {
    allowed: record.count <= limit,
    limit,
    remaining,
    resetSeconds,
  };
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: `Too many requests. Please try again in ${result.resetSeconds} seconds.`,
      error: "RATE_LIMIT_EXCEEDED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.resetSeconds.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetSeconds.toString(),
      },
    }
  );
}
