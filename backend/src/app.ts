import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, AppError } from './middleware/errors.js';
import { healthRouter } from './routes/health.routes.js';
import { cooperativeRouter } from './routes/cooperative.routes.js';
import { caseRouter } from './routes/case.routes.js';
import { chatRouter } from './routes/chat.routes.js';

// Polyfill BigInt JSON serialization for API responses
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

export function createApp(): express.Application {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new AppError(`Origin ${origin} not allowed by CORS`, 403));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));

  // API v1 routes
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', cooperativeRouter);
  app.use('/api/v1', caseRouter);
  app.use('/api/v1', chatRouter);

  // Catch-all 404 for unmatched routes
  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}

