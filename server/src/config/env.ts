/**
 * env.ts – Load and validate environment variables.
 *
 * We use dotenv to read from .env, then export a typed config object.
 * If a required variable is missing, the server crashes early with a
 * clear message instead of failing mysteriously later.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Helper: read an env var or throw if missing */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

/** Helper: read an env var with a fallback default */
function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/** Helper: sanitize MongoDB URI to ensure password special characters (like '@') are properly encoded */
function sanitizeMongoUri(rawUri: string): string {
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
  if (!match) return rawUri;
  const protocol = match[1];
  const body = match[2];
  const slashIndex = body.search(/[\/\?]/);
  const authAndHost = slashIndex === -1 ? body : body.slice(0, slashIndex);
  const restOfUri = slashIndex === -1 ? '' : body.slice(slashIndex);
  const lastAt = authAndHost.lastIndexOf('@');
  if (lastAt === -1) return rawUri;
  const credentials = authAndHost.slice(0, lastAt);
  const host = authAndHost.slice(lastAt + 1);
  const colonIndex = credentials.indexOf(':');
  if (colonIndex === -1) return rawUri;
  const rawUser = credentials.slice(0, colonIndex);
  const rawPass = credentials.slice(colonIndex + 1);
  const safeUser = encodeURIComponent(decodeURIComponent(rawUser));
  const safePass = encodeURIComponent(decodeURIComponent(rawPass));
  return `${protocol}${safeUser}:${safePass}@${host}${restOfUri}`;
}

/** Helper: resolve Redis URL from REDIS_URL or Upstash REST URL + Token */
function resolveRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (restUrl && token) {
    try {
      const hostname = new URL(restUrl.startsWith('http') ? restUrl : `https://${restUrl}`).hostname;
      return `rediss://default:${token}@${hostname}:6379`;
    } catch {
      const cleanHost = restUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return `rediss://default:${token}@${cleanHost}:6379`;
    }
  }
  return 'redis://localhost:6379';
}

/**
 * Centralised, typed config – import this everywhere
 * instead of reading process.env directly.
 */
export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),

  // MongoDB
  MONGODB_URI: sanitizeMongoUri(required('MONGODB_URI')),

  // Redis
  REDIS_URL: resolveRedisUrl(),
  UPSTASH_REDIS_REST_URL: optional('UPSTASH_REDIS_REST_URL', ''),
  UPSTASH_REDIS_REST_TOKEN: optional('UPSTASH_REDIS_REST_TOKEN', ''),

  // JWT
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  // CORS
  CLIENT_ORIGIN: optional('CLIENT_ORIGIN', 'http://localhost:5173'),

  /** true when NODE_ENV === 'production' */
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  /** true when NODE_ENV === 'test' */
  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },
};
