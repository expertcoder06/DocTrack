/**
 * response.ts – Helpers for the consistent response shape.
 *
 * Every API response follows:
 *   { success: boolean, data: T | null, error: { code, message, details? } | null }
 *
 * This makes the client's life simple: check `success`, then read
 * `data` or `error`.
 */

import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

interface ErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

/**
 * Send a success response.
 * @param res    Express response object
 * @param data   Payload to send
 * @param status HTTP status code (default 200)
 */
export function sendSuccess<T>(res: Response, data: T, status: number = 200): void {
  const body: SuccessResponse<T> = {
    success: true,
    data,
    error: null,
  };
  res.status(status).json(body);
}

/**
 * Send an error response.
 * @param res      Express response object
 * @param status   HTTP status code
 * @param message  Human-readable error message
 * @param code     Machine-readable error code
 * @param details  Optional array of field-level errors
 */
export function sendError(
  res: Response,
  status: number,
  message: string,
  code: string = 'ERROR',
  details?: unknown[]
): void {
  const body: ErrorResponse = {
    success: false,
    data: null,
    error: { code, message, details },
  };
  res.status(status).json(body);
}
