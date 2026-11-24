/**
 * auth.test.ts – Tests for the /api/auth endpoints.
 *
 * Tests:
 *   1. Register a new customer successfully
 *   2. Register with duplicate email → 409
 *   3. Register with invalid data → 400
 *   4. Login with correct credentials
 *   5. Login with wrong password → 401
 *   6. GET /me with valid token
 */

import { request } from './helpers';

const testUser = {
  name: 'Test Customer',
  email: `auth-test-${Date.now()}@test.com`,
  password: 'StrongPass123',
};

let authToken: string;

describe('POST /api/auth/register', () => {
  it('should register a new customer and return a token', async () => {
    const res = await request.post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.role).toBe('customer');
    // Password hash should NOT be in the response
    expect(res.body.data.user.passwordHash).toBeUndefined();
    authToken = res.body.data.token;
  });

  it('should reject duplicate email with 409', async () => {
    const res = await request.post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('should reject invalid registration data with 400', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: '12' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject wrong password with 401', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('should return the current user profile', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });
});
