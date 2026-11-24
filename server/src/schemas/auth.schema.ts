/**
 * auth.schema.ts – Zod validation schemas for authentication routes.
 */

import { z } from 'zod';

/** Schema for POST /api/auth/register */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .transform((v) => v.toLowerCase()),
    password: z
      .string({ error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be at most 100 characters'),
  }),
});

/** Schema for POST /api/auth/login */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .transform((v) => v.toLowerCase()),
    password: z
      .string({ error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
