/**
 * seedAdmin.ts – Convenience script to create or promote an admin user.
 *
 * Run with:
 *   npx tsx src/scripts/seedAdmin.ts
 */

import bcrypt from 'bcrypt';
import { connectDB, disconnectDB, redis } from '../config';
import { User } from '../models';

async function seedAdmin(): Promise<void> {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@doctrack.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.SEED_ADMIN_NAME || 'DocTrack Admin';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`✅ Updated existing user ${email} to role 'admin'`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
    });
    console.log(`✅ Created admin user: ${email} / ${password}`);
  }

  await disconnectDB();
  redis.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
