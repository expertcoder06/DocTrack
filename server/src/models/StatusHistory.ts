/**
 * StatusHistory.ts – Mongoose model for the audit trail.
 *
 * Every time an admin changes an application's status, we create
 * a StatusHistory entry recording:
 *   - Which application
 *   - What the status was before (null for the initial "SUBMITTED")
 *   - What the status changed to
 *   - Who made the change
 *   - An optional note explaining why
 *
 * Index: { applicationId, createdAt: 1 } for fast timeline queries.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { APPLICATION_STATUSES, ApplicationStatus } from './Application';

// ── Types ───────────────────────────────────────────────────────────
export interface IStatusHistory extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  fromStatus: ApplicationStatus | null;  // null = first entry (creation)
  toStatus: ApplicationStatus;
  changedBy: mongoose.Types.ObjectId;    // User who made the change
  note: string;
  createdAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────
const statusHistorySchema = new Schema<IStatusHistory>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    fromStatus: {
      type: String,
      enum: [...APPLICATION_STATUSES, null],
      default: null,
    },
    toStatus: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
  }
);

// ── Index for timeline queries ──────────────────────────────────────
statusHistorySchema.index({ applicationId: 1, createdAt: 1 });

// ── Export ───────────────────────────────────────────────────────────
const StatusHistory = mongoose.model<IStatusHistory>('StatusHistory', statusHistorySchema);
export default StatusHistory;
