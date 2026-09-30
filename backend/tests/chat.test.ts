import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AI Data Retriever & Chat API (POST /api/v1/chat)', () => {
  const app = createApp();

  it('answers how many cooperatives we have in database', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'how many cooperatives do we have in database?' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toContain('5 agricultural cooperatives registered in the Gasabo District database');
  });

  it('answers with the names and TIN numbers of the cooperatives', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'what are their names?' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toContain('Twitezimbere Gasabo');
    expect(res.body.reply).toContain('100234567');
    expect(res.body.reply).toContain('Duterimbere Gikomero');
    expect(res.body.reply).toContain('100345678');
    expect(res.body.reply).toContain('Umusingi Ndera');
  });

  it('retrieves specific cooperative profile by TIN or Name', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'Tell me details about Koperative Twitezimbere Gasabo' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toContain('Koperative Twitezimbere Gasabo');
    expect(res.body.reply).toContain('100234567');
    expect(res.body.reply).toContain('Bumbogo');
  });

  it('retrieves cash flow and money in/out for a cooperative', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'Show me cash flow and transactions for Twitezimbere' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toContain('Total Money In');
    expect(res.body.reply).toContain('Africa Improved Foods');
  });

  it('retrieves loan history and SACCO repayment track record', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'What is the loan and repayment history of Twitezimbere?' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toContain('On-Time Repayment Ratio');
    expect(res.body.reply).toContain('100.0%');
  });

  it('returns 400 bad request if message is empty', async () => {
    const res = await request(app).post('/api/v1/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
