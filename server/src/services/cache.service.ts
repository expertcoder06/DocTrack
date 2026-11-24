/**
 * cache.service.ts – Redis cache-aside helper with graceful fallback.
 *
 * All operations wrap Redis calls in try/catch so that if Redis is
 * temporarily unreachable, the application transparently falls back to MongoDB.
 */

import { redis } from '../config';

export const CACHE_TTL_SECONDS = 60;
export const CACHE_KEYS = {
  STATS: 'stats:statusCounts',
  APP_LIST_PREFIX: 'apps:list:',
} as const;

/**
 * Retrieve and parse a cached JSON value. Returns null on miss or Redis error.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`⚠️  Redis getCache(${key}) error:`, (err as Error).message);
    return null;
  }
}

/**
 * Serialize and store a value in Redis with an expiration TTL (default 60s).
 */
export async function setCache(
  key: string,
  data: unknown,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`⚠️  Redis setCache(${key}) error:`, (err as Error).message);
  }
}

/**
 * Invalidate all keys matching the given glob patterns (e.g. ['stats:*', 'apps:list:*']).
 */
export async function invalidateCache(patterns: string[]): Promise<void> {
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (err) {
    console.warn('⚠️  Redis invalidateCache error:', (err as Error).message);
  }
}
