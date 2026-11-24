/**
 * tests/helpers.ts – Shared test utilities.
 */

import supertest from 'supertest';
import app from '../src/app';

export const request = supertest(app);

/**
 * Register a user and return their auth token.
 */
export async function registerAndGetToken(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; userId: string }> {
  const res = await request
    .post('/api/auth/register')
    .send({ name, email, password })
    .expect(201);

  return {
    token: res.body.data.token,
    userId: res.body.data.user.id,
  };
}

/**
 * Login and return the token.
 */
export async function loginAndGetToken(
  email: string,
  password: string
): Promise<string> {
  const res = await request
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return res.body.data.token;
}
