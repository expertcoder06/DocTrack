/**
 * admin.schema.ts – Zod validation schemas for admin routes.
 */

import { z } from 'zod';
import { APPLICATION_STATUSES, APPLICATION_TYPES } from '../models';

/** Schema for GET /api/admin/applications */
export const adminListSchema = z.object({
  query: z.object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    type: z.enum(APPLICATION_TYPES).optional(),
    search: z.string().trim().optional().default(''),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

/** Schema for PATCH /api/admin/applications/:id/status */
export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
  }),
  body: z.object({
    status: z.enum(APPLICATION_STATUSES, {
      error: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
    }),
    note: z.string().trim().max(500).optional().default(''),
  }),
});

export type AdminListQuery = z.infer<typeof adminListSchema>['query'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
