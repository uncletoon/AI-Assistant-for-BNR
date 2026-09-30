import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/db.js';

const startTime = Date.now();

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbHealth = await checkDatabaseConnection(3000);
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const payload = {
    status: dbHealth.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      ...(dbHealth.latencyMs !== undefined ? { latencyMs: dbHealth.latencyMs } : {}),
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
  };

  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json(payload);
}

