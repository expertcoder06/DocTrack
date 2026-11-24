/**
 * db.ts – MongoDB connection using Mongoose.
 *
 * Configured with dbName: 'doctrack' so that connecting to MongoDB Atlas
 * (even with a connection string lacking an explicit database name)
 * will always target the 'doctrack' database.
 */

import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(uri?: string): Promise<void> {
  const connectionUri = uri || env.MONGODB_URI;

  if (connectionUri.includes('<db_password>') || connectionUri.includes('<password>')) {
    console.error(
      '\n❌ Error: Your MONGODB_URI in server/.env still contains the placeholder "<db_password>".\n' +
        '👉 Please replace "<db_password>" with your actual MongoDB Atlas database user password.\n'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(connectionUri, {
      dbName: 'doctrack',
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host} (db: ${mongoose.connection.name})`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown helper – call from your process exit handlers.
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
}
