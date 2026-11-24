/**
 * middleware/index.ts – Barrel export for all Express middleware.
 */

export { authenticate } from './auth';
export type { JwtPayload } from './auth';
export { requireRole } from './requireRole';
export { validate } from './validate';
export {
  loginRateLimiter,
  incrementFailedLogin,
  resetFailedLogin,
} from './rateLimiter';
export { errorHandler } from './errorHandler';
