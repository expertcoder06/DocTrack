/**
 * application.api.ts – API calls for customer and admin application workflows.
 */

import api from './axios';
import {
  ApiResponse,
  Application,
  ApplicationStatus,
  ApplicationType,
  DocumentMeta,
  PaginatedApplications,
  StatusHistoryEntry,
  StatusStats,
} from '../types';

export interface CreateApplicationPayload {
  type: ApplicationType;
  title: string;
  documents: DocumentMeta[];
}

export interface AdminApplicationFilters {
  status?: ApplicationStatus | '';
  type?: ApplicationType | '';
  search?: string;
  page?: number;
  limit?: number;
}

export async function createApplication(
  payload: CreateApplicationPayload
): Promise<Application> {
  const res = await api.post<ApiResponse<{ application: Application }>>(
    '/applications',
    payload
  );
  return res.data.data!.application;
}

export async function fetchMyApplications(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedApplications> {
  const res = await api.get<ApiResponse<PaginatedApplications>>(
    '/applications/mine',
    { params: { page, limit } }
  );
  return res.data.data!;
}

export async function fetchApplicationDetail(
  id: string
): Promise<{ application: Application; history: StatusHistoryEntry[] }> {
  const res = await api.get<
    ApiResponse<{ application: Application; history: StatusHistoryEntry[] }>
  >(`/applications/${id}`);
  return res.data.data!;
}

export async function fetchAdminApplications(
  filters: AdminApplicationFilters
): Promise<PaginatedApplications> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.search) params.search = filters.search;

  const res = await api.get<ApiResponse<PaginatedApplications>>(
    '/admin/applications',
    { params }
  );
  return res.data.data!;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note: string = ''
): Promise<{ application: Application; historyEntry: StatusHistoryEntry }> {
  const res = await api.patch<
    ApiResponse<{ application: Application; historyEntry: StatusHistoryEntry }>
  >(`/admin/applications/${id}/status`, { status, note });
  return res.data.data!;
}

export async function fetchAdminStats(): Promise<StatusStats> {
  const res = await api.get<ApiResponse<{ stats: StatusStats }>>('/admin/stats');
  return res.data.data!.stats;
}
