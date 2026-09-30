import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Endpoints (/api/v1)', () => {
  const app = createApp();

  it('GET /api/v1/cooperatives returns list of Gasabo cooperatives', async () => {
    const res = await request(app).get('/api/v1/cooperatives');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].district).toBe('Gasabo');
  });

  it('GET /api/v1/cases returns seeded loan cases with cooperative and score details', async () => {
    const res = await request(app).get('/api/v1/cases');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstCase = res.body.data[0];
    expect(firstCase.cooperative).toBeDefined();
    expect(firstCase.scores.length).toBeGreaterThan(0);
    expect(firstCase.scores[0].band).toBe('LOW');
  });

  it('GET /api/v1/monitoring/fairness returns aggregated metrics from SQL view', async () => {
    const res = await request(app).get('/api/v1/monitoring/fairness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
