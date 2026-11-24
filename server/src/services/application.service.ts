/**
 * application.service.ts – Business logic for applications, status transitions,
 * audit history, admin queries, cache invalidation, and Socket.IO notifications.
 */

import mongoose from 'mongoose';
import {
  Application,
  StatusHistory,
  User,
  IApplication,
  IStatusHistory,
  ApplicationStatus,
  APPLICATION_STATUSES,
  VALID_TRANSITIONS,
  UserRole,
} from '../models';
import { CreateApplicationInput, AdminListQuery } from '../schemas';
import { ApiError } from '../utils';
import { CACHE_KEYS, invalidateCache } from './cache.service';
import { getIO } from '../sockets';

export interface PaginatedApplications {
  applications: IApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationWithHistory {
  application: IApplication;
  history: IStatusHistory[];
}

export type StatusStats = Record<ApplicationStatus, number> & { total: number };

/**
 * Create a new document application (initial status: SUBMITTED)
 * and record its initial StatusHistory entry.
 */
export async function createApplication(
  userId: string,
  data: CreateApplicationInput
): Promise<IApplication> {
  const application = await Application.create({
    userId: new mongoose.Types.ObjectId(userId),
    type: data.type,
    title: data.title,
    documents: data.documents ?? [],
    status: 'SUBMITTED',
  });

  await StatusHistory.create({
    applicationId: application._id,
    fromStatus: null,
    toStatus: 'SUBMITTED',
    changedBy: new mongoose.Types.ObjectId(userId),
    note: 'Application submitted',
  });

  // Invalidate admin caches so new applications appear immediately
  await invalidateCache([`${CACHE_KEYS.APP_LIST_PREFIX}*`, CACHE_KEYS.STATS]);

  // Alert online admins via Socket.IO
  getIO()?.to('admins').emit('application:created', {
    applicationId: application._id.toString(),
    type: application.type,
    title: application.title,
  });

  return application;
}

/**
 * List applications belonging to a specific customer (paginated).
 */
export async function getMyApplications(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedApplications> {
  const filter = { userId: new mongoose.Types.ObjectId(userId) };
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Fetch a single application and its full status history timeline.
 * Customers may only view their own applications; admins can view any.
 */
export async function getApplicationById(
  applicationId: string,
  requesterId: string,
  requesterRole: UserRole
): Promise<ApplicationWithHistory> {
  const application = await Application.findById(applicationId).populate(
    'userId',
    'name email'
  );

  if (!application) {
    throw new ApiError(404, 'Application not found', 'NOT_FOUND');
  }

  // Extract owner ID whether populated or raw ObjectId
  const ownerId =
    application.userId instanceof mongoose.Types.ObjectId
      ? application.userId.toString()
      : (application.userId as unknown as { _id: mongoose.Types.ObjectId })._id.toString();

  if (requesterRole === 'customer' && ownerId !== requesterId) {
    throw new ApiError(403, 'You do not have access to this application', 'FORBIDDEN');
  }

  const history = await StatusHistory.find({ applicationId: application._id })
    .sort({ createdAt: 1 })
    .populate('changedBy', 'name email role');

  return { application, history };
}

/**
 * Update an application's status (admin only), enforcing VALID_TRANSITIONS,
 * writing a StatusHistory audit record, invalidating Redis caches,
 * and emitting a real-time Socket.IO event to the owning customer.
 */
export async function updateStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  adminUserId: string,
  note: string = ''
): Promise<{ application: IApplication; historyEntry: IStatusHistory }> {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new ApiError(404, 'Application not found', 'NOT_FOUND');
  }

  const currentStatus = application.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus];

  if (!allowedNext.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  application.status = newStatus;
  await application.save();

  const historyEntry = await StatusHistory.create({
    applicationId: application._id,
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedBy: new mongoose.Types.ObjectId(adminUserId),
    note: note.trim(),
  });

  // Invalidate admin list & stats caches
  await invalidateCache([`${CACHE_KEYS.APP_LIST_PREFIX}*`, CACHE_KEYS.STATS]);

  // Notify owning customer in real time via their private room
  const ownerRoom = `user:${application.userId.toString()}`;
  getIO()?.to(ownerRoom).emit('application:statusUpdated', {
    applicationId: application._id.toString(),
    status: application.status,
    note: historyEntry.note,
    updatedAt: application.updatedAt,
  });

  return { application, historyEntry };
}

/**
 * Admin query: list all applications with optional status/type filters,
 * search (matches title or customer name/email), and pagination.
 */
export async function getAdminApplications(
  filters: AdminListQuery
): Promise<PaginatedApplications> {
  const { status, type, search, page, limit } = filters;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (type) query.type = type;

  if (search && search.trim().length > 0) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const matchingUsers = await User.find({
      $or: [{ name: regex }, { email: regex }],
    }).select('_id');

    const matchingUserIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { title: regex },
      ...(matchingUserIds.length > 0 ? [{ userId: { $in: matchingUserIds } }] : []),
    ];
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    applications,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Aggregate application counts grouped by status for the admin dashboard.
 */
export async function getStats(): Promise<StatusStats> {
  const aggregated = await Application.aggregate<{ _id: ApplicationStatus; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats: StatusStats = {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    DOCS_NEEDED: 0,
    COMPLETED: 0,
    REJECTED: 0,
    total: 0,
  };

  for (const row of aggregated) {
    if (APPLICATION_STATUSES.includes(row._id)) {
      stats[row._id] = row.count;
      stats.total += row.count;
    }
  }

  return stats;
}
