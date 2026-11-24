/**
 * auth.service.ts – Business logic for user registration, login, and profile lookup.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { User, IUser, UserRole } from '../models';
import { ApiError } from '../utils';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Sign a JWT containing the user's ID and role.
 */
export function generateToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Register a new customer account. Always assigns role `'customer'`.
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    throw new ApiError(409, 'Email is already registered', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
  });

  const token = generateToken(user._id.toString(), user.role);
  return { user: toPublicUser(user), token };
}

/**
 * Authenticate an existing user by email and password.
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  // Explicitly select passwordHash because `select: false` is set on the schema
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken(user._id.toString(), user.role);
  return { user: toPublicUser(user), token };
}

/**
 * Fetch the public profile for an authenticated user.
 */
export async function getMe(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found', 'NOT_FOUND');
  }
  return toPublicUser(user);
}
