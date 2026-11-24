/**
 * sockets/index.ts – Socket.IO server setup, JWT handshake auth, rooms, and presence.
 *
 * Rooms:
 *   - `user:<userId>` : private room per user so status updates go only to the owner.
 *   - `admins`        : room joined by all admin sockets for new application alerts.
 *
 * Presence:
 *   - Tracks active admin socket IDs so `presence:adminOnline` only flips to false
 *     when the last connected admin socket disconnects.
 */

import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { User, UserRole } from '../models';
import { JwtPayload } from '../middleware';

interface SocketUser {
  userId: string;
  role: UserRole;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user?: SocketUser;
  };
}

let ioInstance: Server | null = null;
const adminSocketIds = new Set<string>();

/**
 * Attach Socket.IO to the shared HTTP server.
 */
export function setupSocket(httpServer: http.Server): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  // Authenticate every socket handshake via JWT
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ?? undefined);

      if (!token) {
        next(new Error('UNAUTHORIZED: Authentication token required'));
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        next(new Error('UNAUTHORIZED: User not found'));
        return;
      }

      socket.data.user = {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
      };
      next();
    } catch {
      next(new Error('UNAUTHORIZED: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Join personal room for targeted updates
    socket.join(`user:${user.userId}`);

    if (user.role === 'admin') {
      socket.join('admins');
      const wasOffline = adminSocketIds.size === 0;
      adminSocketIds.add(socket.id);
      if (wasOffline) {
        io.emit('presence:adminOnline', { online: true });
      }
    }

    // Send current admin presence immediately to the newly connected client
    socket.emit('presence:adminOnline', { online: adminSocketIds.size > 0 });

    socket.on('disconnect', () => {
      if (user.role === 'admin') {
        adminSocketIds.delete(socket.id);
        if (adminSocketIds.size === 0) {
          io.emit('presence:adminOnline', { online: false });
        }
      }
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Return the initialized Socket.IO Server instance, or null (e.g. during unit/Supertest runs).
 */
export function getIO(): Server | null {
  return ioInstance;
}

/**
 * Helper to check if at least one admin is currently connected via Socket.IO.
 */
export function isAdminOnline(): boolean {
  return adminSocketIds.size > 0;
}
