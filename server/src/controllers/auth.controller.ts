/**
 * auth.controller.ts – HTTP handlers for /api/auth routes.
 */

import { Request, Response } from 'express';
import { authService } from '../services';
import {
  incrementFailedLogin,
  resetFailedLogin,
} from '../middleware';
import { LoginInput, RegisterInput } from '../schemas';
import { ApiError, sendSuccess } from '../utils';

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as RegisterInput;
  const result = await authService.register(name, email, password);
  sendSuccess(res, result, 201);
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  try {
    const result = await authService.login(email, password);
    await resetFailedLogin(email);
    sendSuccess(res, result);
  } catch (err) {
    // Only count invalid credential errors toward rate limiting
    if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
      await incrementFailedLogin(email);
    }
    throw err;
  }
}

/** GET /api/auth/me */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'UNAUTHORIZED');
  }
  const user = await authService.getMe(req.user._id.toString());
  sendSuccess(res, { user });
}
