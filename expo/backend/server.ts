import { serve } from '@hono/node-server';
import app from './hono';
import { initSurrealDB } from './lib/surrealdb';

const port = Number(process.env.PORT || 8787);
const nodeEnv = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    console.log('[startup] Validating configuration...');

    // Validate required environment variables
    const requiredEnvVars = ['RORK_DB_ENDPOINT', 'RORK_DB_NAMESPACE', 'RORK_DB_TOKEN'];
    const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (nodeEnv === 'production' && missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set in production');
    }

    console.log('[startup] Initializing SurrealDB...');
    await initSurrealDB();
    console.log('[startup] SurrealDB ready');

    const server = serve({ fetch: app.fetch, port }, (info) => {
      console.log(`[startup] Server listening on http://localhost:${info.port}`);
    });

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`[shutdown] Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          console.log('[shutdown] Server closed');
          process.exit(0);
        });
        setTimeout(() => {
          console.error('[shutdown] Forced shutdown after 10s');
          process.exit(1);
        }, 10000);
      });
    });
  } catch (error) {
    console.error('[startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
