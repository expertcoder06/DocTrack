/**
 * Application.ts – Mongoose model for service applications.
 *
 * Each application belongs to a customer (userId) and has:
 *   - type:      What the customer is applying for
 *   - title:     Short description of the application
 *   - documents: Array of metadata objects (no real file uploads)
 *   - status:    Current stage in the workflow
 *
 * Indexes (see bottom of file):
 *   - { userId, createdAt: -1 }   → Fast "my applications" query
 *   - { status, createdAt: -1 }   → Fast admin filtering by status
 *   - { type }                    → Fast admin filtering by type
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Enums ───────────────────────────────────────────────────────────
export const APPLICATION_TYPES = [
  'PASSPORT',
  'DRIVING_LICENCE',
  'AADHAAR_UPDATE',
  'OTHER',
] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

export const APPLICATION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCS_NEEDED',
  'COMPLETED',
  'REJECTED',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Valid status transitions – used in the service layer to reject
 * illegal moves (e.g. COMPLETED → SUBMITTED).
 */
export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED:    ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['DOCS_NEEDED', 'COMPLETED', 'REJECTED'],
  DOCS_NEEDED:  ['UNDER_REVIEW', 'REJECTED'],
  COMPLETED:    [],   // Terminal state
  REJECTED:     [],   // Terminal state
};

// ── Sub-document: document metadata ─────────────────────────────────
export interface IDocumentMeta {
  name: string;   // e.g. "Passport photo"
  type: string;   // e.g. "ID Proof", "Address Proof"
  notes?: string; // Optional extra info
}

const documentMetaSchema = new Schema<IDocumentMeta>(
  {
    name:  { type: String, required: true, trim: true },
    type:  { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false } // No separate _id for sub-documents
);

// ── Main document ───────────────────────────────────────────────────
export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ApplicationType;
  title: string;
  documents: IDocumentMeta[];
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: APPLICATION_TYPES,
      required: [true, 'Application type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    documents: {
      type: [documentMetaSchema],
      default: [],
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'SUBMITTED',
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound indexes for common queries ─────────────────────────────
applicationSchema.index({ userId: 1, createdAt: -1 });   // Customer's own apps
applicationSchema.index({ status: 1, createdAt: -1 });   // Admin filter by status
applicationSchema.index({ type: 1 });                     // Admin filter by type

// ── Export ───────────────────────────────────────────────────────────
const Application = mongoose.model<IApplication>('Application', applicationSchema);
export default Application;
