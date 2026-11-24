/**
 * ApiError.ts – Custom error class for operational errors.
 *
 * Throw this anywhere in the service/controller layer and the
 * central error-handling middleware will catch it and format a
 * clean JSON response.
 *
 * Example:
 *   throw new ApiError(404, 'Application not found', 'NOT_FOUND');
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown[];

  constructor(
    statusCode: number,
    message: string,
    code: string = 'ERROR',
    details?: unknown[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace in V8 (Node/Chrome)
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
