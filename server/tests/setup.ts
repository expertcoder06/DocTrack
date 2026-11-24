/**
 * tests/setup.ts – Connect to a test database before the test suite and clean up after.
 *
 * Automatically uses `dbName: 'doctrack-test'` with Mongoose so it isolates
 * test data from development data without fragile URL string manipulations.
 */

import mongoose from 'mongoose';
import { env, redis } from '../src/config';

beforeAll(async () => {
  if (env.MONGODB_URI.includes('<db_password>') || env.MONGODB_URI.includes('<password>')) {
    console.warn('⚠️ MONGODB_URI has placeholder <db_password>, tests requiring live DB will fail.');
    return;
  }
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'doctrack-test',
      serverSelectionTimeoutMS: 15000,
    });
  } catch (err) {
    console.warn('⚠️ Test MongoDB connection failed:', (err as Error).message);
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.dropDatabase();
    } catch {
      // ignore drop errors
    }
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  try {
    redis.disconnect();
  } catch {
    // ignore
  }
});
