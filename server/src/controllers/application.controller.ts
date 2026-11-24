/**
 * application.controller.ts – HTTP handlers for /api/applications routes.
 */

import { Request, Response } from 'express';
import { applicationService } from '../services';
import { CreateApplicationInput, ListMyApplicationsQuery } from '../schemas';
import { ApiError, sendSuccess } from '../utils';

/** POST /api/applications */
export async function createApplication(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'UNAUTHORIZED');
  }
  const body = req.body as CreateApplicationInput;
  const application = await applicationService.createApplication(
    req.user._id.toString(),
    body
  );
  sendSuccess(res, { application }, 201);
}

/** GET /api/applications/mine */
export async function getMyApplications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'UNAUTHORIZED');
  }
  const query = (req.validated?.query ?? { page: 1, limit: 10 }) as ListMyApplicationsQuery;
  const result = await applicationService.getMyApplications(
    req.user._id.toString(),
    query.page,
    query.limit
  );
  sendSuccess(res, result);
}

/** GET /api/applications/:id */
export async function getApplicationById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'UNAUTHORIZED');
  }
  const { id } = (req.validated?.params ?? req.params) as { id: string };
  const result = await applicationService.getApplicationById(
    id,
    req.user._id.toString(),
    req.user.role
  );
  sendSuccess(res, result);
}
