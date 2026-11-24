/**
 * models/index.ts – Barrel export for all Mongoose models.
 *
 * Usage:
 *   import { User, Application, StatusHistory } from '../models';
 */

export { default as User } from './User';
export type { IUser, UserRole } from './User';

export { default as Application } from './Application';
export type { IApplication, IDocumentMeta, ApplicationType, ApplicationStatus } from './Application';
export { APPLICATION_TYPES, APPLICATION_STATUSES, VALID_TRANSITIONS } from './Application';

export { default as StatusHistory } from './StatusHistory';
export type { IStatusHistory } from './StatusHistory';
