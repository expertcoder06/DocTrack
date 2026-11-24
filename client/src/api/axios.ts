/**
 * axios.ts – Configured Axios instance with JWT request interceptor.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('doctrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Helper to extract a human-readable error message from an Axios error.
 */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const apiMsg = err.response?.data?.error?.message;
    const details = err.response?.data?.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      return `${apiMsg}: ${details.map((d: { message: string }) => d.message).join(', ')}`;
    }
    if (apiMsg) return apiMsg;
    if (err.message) return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export default api;
