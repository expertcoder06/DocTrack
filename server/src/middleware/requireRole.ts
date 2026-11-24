/**
 * requireRole.ts – Role-based authorization middleware.
 *
 * Usage:
 *   router.get('/admin/stats', authenticate, requireRole('admin'), controller.getStats);
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models';
import { ApiError } from '../utils';

export const requireRole =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Not authenticated', 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ApiError(
          403,
          'You do not have permission to perform this action',
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
