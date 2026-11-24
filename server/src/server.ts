/**
 * server.ts – Bootstrap the HTTP + Socket.IO server.
 */

import http from 'http';
import app from './app';
import { env, connectDB, disconnectDB, redis } from './config';
import { setupSocket } from './sockets';

async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server and attach Socket.IO
  const server = http.createServer(app);
  setupSocket(server);

  // 3. Start listening
  server.listen(env.PORT, () => {
    console.log(`🚀 DocTrack server running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close();
    await disconnectDB();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});
