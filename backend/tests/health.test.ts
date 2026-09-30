import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import * as dbConfig from '../src/config/db.js';

describe('Health API (/api/v1/health)', () => {
  it('returns healthy status when database is reachable', async () => {
    vi.spyOn(dbConfig, 'checkDatabaseConnection').mockResolvedValueOnce({
      connected: true,
      latencyMs: 5,
    });

    const app = createApp();
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.database.status).toBe('connected');
    expect(response.body.database.latencyMs).toBe(5);
  });

  it('returns degraded status with 503 when database is unreachable', async () => {
    vi.spyOn(dbConfig, 'checkDatabaseConnection').mockResolvedValueOnce({
      connected: false,
      error: 'Connection refused',
    });

    const app = createApp();
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.database.status).toBe('disconnected');
    expect(response.body.database.error).toBe('Connection refused');
  });

  it('returns 404 for unknown endpoints', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Route not found');
  });
});

