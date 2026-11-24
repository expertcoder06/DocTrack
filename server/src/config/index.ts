/**
 * config/index.ts – Barrel export so the rest of the app can do:
 *   import { env, connectDB, redis } from './config';
 */

export { env } from './env';
export { connectDB, disconnectDB } from './db';
export { default as redis } from './redis';
