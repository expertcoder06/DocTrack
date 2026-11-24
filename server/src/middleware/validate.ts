/**
 * validate.ts – Generic Zod request validation middleware.
 *
 * Validates `req.body`, `req.query`, and `req.params` against a Zod schema.
 * Stores the parsed (coerced & defaulted) values on `req.validated` so
 * controllers can safely read them without mutating Express 5's read-only
 * `req.query` getter. Also updates `req.body` when present.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from '../utils';

export interface ValidatedRequestData {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

declare global {
  namespace Express {
    interface Request {
      validated?: ValidatedRequestData;
    }
  }
}

export const validate =
  (schema: z.ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as ValidatedRequestData;

      req.validated = parsed;

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(err);
      }
    }
  };
