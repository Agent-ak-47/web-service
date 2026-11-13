import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import flightsRouter from './routes/flights.js';
import internalRouter from './routes/internal.js';
import { UPLOADS_DIR } from './utils/imageStore.js';
import { fail, ok } from './utils/response.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('json spaces', 0);

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '5mb' }));

  app.get('/health', (_req, res) =>
    ok(res, { service: 'flight', status: 'ok', port: config.port }),
  );

  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
  app.use('/api/flights', flightsRouter);
  app.use('/api/internal/flights', internalRouter);

  app.use((_req, res) =>
    fail(res, 'NOT_FOUND', 'The requested endpoint does not exist.', 404),
  );

  // Centralised error handler: never leak a stack trace to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    console.error('[flight] unhandled error:', error);

    return fail(res, 'INTERNAL_ERROR', 'Internal server error.', 500);
  });

  return app;
}
