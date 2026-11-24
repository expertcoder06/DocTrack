/**
 * User.ts – Mongoose model for user accounts.
 *
 * Fields:
 *   - name:         Display name
 *   - email:        Unique, lowercase, used for login
 *   - passwordHash: bcrypt hash (never sent in API responses)
 *   - role:         "customer" (default) or "admin"
 *
 * Index: unique on email (Mongoose creates this from `unique: true`).
 *
 * Note: We store `passwordHash` rather than `password` to make it
 * obvious at the schema level that raw passwords are never persisted.
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Types ───────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ──────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       // Creates a unique index automatically
      lowercase: true,    // Always store lowercase
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,      // Never returned by default in queries
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  {
    timestamps: true,     // Adds createdAt and updatedAt automatically
  }
);

// ── Export ───────────────────────────────────────────────────────────
const User = mongoose.model<IUser>('User', userSchema);
export default User;
