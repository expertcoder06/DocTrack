/**
 * auth.api.ts – API calls for authentication.
 */

import api from './axios';
import { ApiResponse, User } from '../types';

export interface AuthPayload {
  user: User;
  token: string;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthPayload> {
  const res = await api.post<ApiResponse<AuthPayload>>('/auth/register', {
    name,
    email,
    password,
  });
  return res.data.data!;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthPayload> {
  const res = await api.post<ApiResponse<AuthPayload>>('/auth/login', {
    email,
    password,
  });
  return res.data.data!;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return res.data.data!.user;
}
