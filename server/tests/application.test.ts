/**
 * application.test.ts – Tests for application CRUD and status update endpoints.
 *
 * Tests:
 *   7. Customer creates an application successfully
 *   8. Customer lists their own applications
 *   9. Admin updates status (valid transition)
 *  10. Admin rejects an invalid status transition → 400
 *  11. Customer cannot access admin routes → 403
 */

import bcrypt from 'bcrypt';
import { request, loginAndGetToken, registerAndGetToken } from './helpers';
import User from '../src/models/User';

let customerToken: string;
let adminToken: string;
let applicationId: string;

beforeAll(async () => {
  // Create a customer
  const customer = await registerAndGetToken(
    'App Test Customer',
    `app-cust-${Date.now()}@test.com`,
    'CustPass123'
  );
  customerToken = customer.token;

  // Create an admin user directly in the DB
  const adminEmail = `app-admin-${Date.now()}@test.com`;
  const passwordHash = await bcrypt.hash('AdminPass123', 10);
  await User.create({
    name: 'App Test Admin',
    email: adminEmail,
    passwordHash,
    role: 'admin',
  });
  adminToken = await loginAndGetToken(adminEmail, 'AdminPass123');
});

describe('POST /api/applications', () => {
  it('should let a customer create an application', async () => {
    const res = await request
      .post('/api/applications')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        type: 'PASSPORT',
        title: 'Fresh passport for testing',
        documents: [
          { name: 'Aadhaar card', type: 'ID Proof', notes: 'Front and back' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe('SUBMITTED');
    expect(res.body.data.application.type).toBe('PASSPORT');
    applicationId = res.body.data.application._id;
  });
});

describe('GET /api/applications/mine', () => {
  it("should return the customer's own applications", async () => {
    const res = await request
      .get('/api/applications/mine')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.applications.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PATCH /api/admin/applications/:id/status', () => {
  it('should let an admin update status (SUBMITTED → UNDER_REVIEW)', async () => {
    const res = await request
      .patch(`/api/admin/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'UNDER_REVIEW', note: 'Reviewing documents now' });
    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe('UNDER_REVIEW');
    expect(res.body.data.historyEntry.fromStatus).toBe('SUBMITTED');
    expect(res.body.data.historyEntry.toStatus).toBe('UNDER_REVIEW');
  });

  it('should reject an invalid status transition with 400', async () => {
    const res = await request
      .patch(`/api/admin/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUBMITTED' }); // UNDER_REVIEW → SUBMITTED is invalid
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});

describe('Admin route protection', () => {
  it('should forbid customer from accessing admin routes', async () => {
    const res = await request
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
