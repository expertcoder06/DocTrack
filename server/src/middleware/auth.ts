/**
 * auth.ts – JWT authentication middleware.
 *
 * Extracts the Bearer token from the `Authorization` header, verifies it,
 * loads the user from MongoDB (without passwordHash), and attaches it to `req.user`.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { User, IUser, UserRole } from '../models';
import { ApiError } from '../utils';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token is missing', 'UNAUTHORIZED');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new ApiError(401, 'Authentication token is missing', 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'User no longer exists', 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    if (err instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Authentication token expired', 'TOKEN_EXPIRED'));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid authentication token', 'INVALID_TOKEN'));
      return;
    }
    next(err);
  }
}
