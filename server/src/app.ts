/**
 * app.ts – Express application setup.
 *
 * Configures security headers, CORS, body parsing, health check,
 * API routes, 404 fallback, and central error handling.
 * Does NOT call `listen()` so Supertest can import `app` directly.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { env, redis } from './config';
import { authRoutes, applicationRoutes, adminRoutes } from './routes';
import { errorHandler } from './middleware';
import { sendError, sendSuccess } from './utils';

const app = express();

// ── Security & CORS ─────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// ── Body parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const mongoStates: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  sendSuccess(res, {
    status: 'ok',
    mongo: mongoStates[mongoose.connection.readyState] ?? 'unknown',
    redis: redis.status,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler for unmatched routes ────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, 'Route not found', 'NOT_FOUND');
});

// ── Central error handler (must be last) ────────────────────────────
app.use(errorHandler);

export default app;
