/**
 * types/index.ts – Shared TypeScript types for the DocTrack frontend.
 */

export type UserRole = 'customer' | 'admin';

export type ApplicationType =
  | 'PASSPORT'
  | 'DRIVING_LICENCE'
  | 'AADHAAR_UPDATE'
  | 'OTHER';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCS_NEEDED'
  | 'COMPLETED'
  | 'REJECTED';

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  PASSPORT: 'Passport',
  DRIVING_LICENCE: 'Driving Licence',
  AADHAAR_UPDATE: 'Aadhaar Update',
  OTHER: 'Other',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCS_NEEDED: 'Docs Needed',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['DOCS_NEEDED', 'COMPLETED', 'REJECTED'],
  DOCS_NEEDED: ['UNDER_REVIEW', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface DocumentMeta {
  name: string;
  type: string;
  notes?: string;
}

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface Application {
  _id: string;
  userId: string | PopulatedUser;
  type: ApplicationType;
  title: string;
  documents: DocumentMeta[];
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  _id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedBy: string | PopulatedUser;
  note: string;
  createdAt: string;
}

export interface PaginatedApplications {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type StatusStats = Record<ApplicationStatus, number> & { total: number };

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  } | null;
}

export interface StatusUpdatedEvent {
  applicationId: string;
  status: ApplicationStatus;
  note: string;
  updatedAt: string;
}

export interface ApplicationCreatedEvent {
  applicationId: string;
  type: ApplicationType;
  title: string;
}
