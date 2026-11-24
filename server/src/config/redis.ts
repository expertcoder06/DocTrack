/**
 * redis.ts – Redis client using ioredis.
 *
 * We export a single shared client. All Redis operations throughout the
 * app should import this client rather than creating their own.
 *
 * The client is configured to NOT crash the app on connection errors
 * (the cache layer will fall back to MongoDB).
 */

import Redis from 'ioredis';
import { env } from './env';

/** Create the ioredis client. maxRetriesPerRequest = null avoids throwing on transient errors. */
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,   // Let Socket.IO adapter and BullMQ work without errors
  retryStrategy(times: number) {
    // Retry with exponential backoff, cap at 3 seconds
    const delay = Math.min(times * 200, 3000);
    console.warn(`⏳ Redis retry attempt #${times}, next in ${delay}ms`);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err: Error) => {
  // Log but don't crash – the cache service has try/catch fallbacks
  console.error('⚠️  Redis error:', err.message);
});

export default redis;
