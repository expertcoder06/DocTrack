/**
 * admin.controller.ts – HTTP handlers for /api/admin routes with Redis cache-aside.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { applicationService, cacheService } from '../services';
import { AdminListQuery, UpdateStatusInput } from '../schemas';
import { ApiError, sendSuccess } from '../utils';

function buildListCacheKey(query: AdminListQuery): string {
  const normalized = JSON.stringify({
    status: query.status ?? null,
    type: query.type ?? null,
    search: query.search ?? '',
    page: query.page,
    limit: query.limit,
  });
  const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 16);
  return `${cacheService.CACHE_KEYS.APP_LIST_PREFIX}${hash}`;
}

/** GET /api/admin/applications */
export async function getAdminApplications(req: Request, res: Response): Promise<void> {
  const query = (req.validated?.query ?? {
    page: 1,
    limit: 10,
    search: '',
  }) as AdminListQuery;

  const cacheKey = buildListCacheKey(query);
  const cached = await cacheService.getCache<applicationService.PaginatedApplications>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const result = await applicationService.getAdminApplications(query);
  await cacheService.setCache(cacheKey, result);
  sendSuccess(res, result);
}

/** PATCH /api/admin/applications/:id/status */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'UNAUTHORIZED');
  }
  const { id } = (req.validated?.params ?? req.params) as { id: string };
  const { status, note } = req.body as UpdateStatusInput;

  const result = await applicationService.updateStatus(
    id,
    status,
    req.user._id.toString(),
    note
  );
  sendSuccess(res, result);
}

/** GET /api/admin/stats */
export async function getStats(_req: Request, res: Response): Promise<void> {
  const cached = await cacheService.getCache<applicationService.StatusStats>(
    cacheService.CACHE_KEYS.STATS
  );
  if (cached) {
    sendSuccess(res, { stats: cached });
    return;
  }

  const stats = await applicationService.getStats();
  await cacheService.setCache(cacheService.CACHE_KEYS.STATS, stats);
  sendSuccess(res, { stats });
}
