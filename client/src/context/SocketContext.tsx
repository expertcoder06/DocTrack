/**
 * SocketContext.tsx – Authenticated Socket.IO connection, admin presence,
 * live status updates, toast notifications, and clean reconnect handling.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  APPLICATION_STATUS_LABELS,
  ApplicationCreatedEvent,
  StatusUpdatedEvent,
} from '../types';

export interface ToastMessage {
  id: number;
  title: string;
  body: string;
  tone: 'info' | 'success' | 'warning';
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  adminOnline: boolean;
  toasts: ToastMessage[];
  dismissToast: (id: number) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = toastIdRef.current++;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setConnected(false);
      setAdminOnline(false);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleAdminPresence = (payload: { online: boolean }) => {
      setAdminOnline(payload.online);
    };

    const handleStatusUpdated = (payload: StatusUpdatedEvent) => {
      const label = APPLICATION_STATUS_LABELS[payload.status] ?? payload.status;
      addToast({
        title: `Status updated to ${label}`,
        body: payload.note
          ? `Note: ${payload.note}`
          : 'An admin updated your application status.',
        tone:
          payload.status === 'COMPLETED'
            ? 'success'
            : payload.status === 'DOCS_NEEDED' || payload.status === 'REJECTED'
              ? 'warning'
              : 'info',
      });
    };

    const handleApplicationCreated = (payload: ApplicationCreatedEvent) => {
      addToast({
        title: 'New Application Submitted',
        body: `${payload.title} (${payload.type})`,
        tone: 'info',
      });
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('presence:adminOnline', handleAdminPresence);
    s.on('application:statusUpdated', handleStatusUpdated);
    s.on('application:created', handleApplicationCreated);

    setSocket(s);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('presence:adminOnline', handleAdminPresence);
      s.off('application:statusUpdated', handleStatusUpdated);
      s.off('application:created', handleApplicationCreated);
      s.disconnect();
    };
  }, [token, user, addToast]);

  return (
    <SocketContext.Provider
      value={{ socket, connected, adminOnline, toasts, dismissToast, addToast }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used inside a SocketProvider');
  }
  return ctx;
}
