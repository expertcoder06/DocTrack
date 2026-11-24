/**
 * application.schema.ts – Zod validation schemas for customer application routes.
 */

import { z } from 'zod';
import { APPLICATION_TYPES } from '../models';

/** Document metadata schema (no real file upload in v1) */
const documentMetaSchema = z.object({
  name: z
    .string({ error: 'Document name is required' })
    .trim()
    .min(1, 'Document name cannot be empty')
    .max(150, 'Document name is too long'),
  type: z
    .string({ error: 'Document type is required' })
    .trim()
    .min(1, 'Document type cannot be empty')
    .max(100, 'Document type is too long'),
  notes: z.string().trim().max(500).optional().default(''),
});

/** Schema for POST /api/applications */
export const createApplicationSchema = z.object({
  body: z.object({
    type: z.enum(APPLICATION_TYPES, {
      error: `Type must be one of: ${APPLICATION_TYPES.join(', ')}`,
    }),
    title: z
      .string({ error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be at most 200 characters'),
    documents: z.array(documentMetaSchema).optional().default([]),
  }),
});

/** Schema for GET /api/applications/mine */
export const listMyApplicationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

/** Schema for GET /api/applications/:id */
export const applicationIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
  }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
export type ListMyApplicationsQuery = z.infer<typeof listMyApplicationsSchema>['query'];
