/**
 * errorHandler.ts – Central Express error-handling middleware.
 *
 * Catches all errors passed via `next(err)` (or thrown in Express 5 async handlers)
 * and formats them into the standard `{ success: false, data: null, error }` shape.
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { env } from '../config';
import { ApiError, sendError } from '../utils';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Operational errors thrown intentionally with ApiError
  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  // 2. Mongoose schema validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', details);
    return;
  }

  // 3. Mongoose invalid ObjectId cast errors
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, `Invalid ${err.path}: ${err.value}`, 'INVALID_ID');
    return;
  }

  // 4. MongoDB duplicate key error (e.g. unique email)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    sendError(res, 409, 'Resource already exists', 'DUPLICATE_KEY');
    return;
  }

  // 5. Unexpected programming/system errors
  console.error('💥 Unhandled error:', err);
  const message = env.isProduction
    ? 'Internal server error'
    : err instanceof Error
      ? err.message
      : 'Internal server error';

  sendError(res, 500, message, 'INTERNAL_ERROR');
}
