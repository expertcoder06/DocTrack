/**
 * rateLimiter.ts – Redis-based login rate limiter.
 *
 * Tracks failed login attempts in Redis using key `login:fail:<identifier>`
 * with a 15-minute (900s) TTL. Blocks after 5 failed attempts with HTTP 429.
 *
 * Fails open: if Redis is temporarily unavailable, requests are still allowed
 * so an outage in Redis does not break authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config';
import { ApiError } from '../utils';

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function buildKey(identifier: string): string {
  return `login:fail:${identifier.trim().toLowerCase()}`;
}

function getIdentifier(req: Request): string {
  const email = req.body?.email;
  if (typeof email === 'string' && email.trim().length > 0) {
    return email.trim().toLowerCase();
  }
  return req.ip || 'unknown';
}

/**
 * Middleware placed on POST /api/auth/login.
 * Rejects the request with 429 if the failure counter has reached MAX_FAILED_ATTEMPTS.
 */
export async function loginRateLimiter(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const key = buildKey(getIdentifier(req));
  try {
    const raw = await redis.get(key);
    const attempts = raw ? parseInt(raw, 10) : 0;

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      next(
        new ApiError(
          429,
          'Too many failed login attempts. Please try again in 15 minutes.',
          'RATE_LIMITED'
        )
      );
      return;
    }
  } catch (err) {
    console.warn('⚠️  Redis rate-limiter check failed, failing open:', (err as Error).message);
  }
  next();
}

/**
 * Increment the failed login counter for an identifier.
 * Sets a 15-minute expiry when the counter is first created.
 */
export async function incrementFailedLogin(identifier: string): Promise<void> {
  const key = buildKey(identifier);
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
  } catch (err) {
    console.warn('⚠️  Redis incrementFailedLogin error:', (err as Error).message);
  }
}

/**
 * Clear the failed login counter after a successful login.
 */
export async function resetFailedLogin(identifier: string): Promise<void> {
  const key = buildKey(identifier);
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('⚠️  Redis resetFailedLogin error:', (err as Error).message);
  }
}
