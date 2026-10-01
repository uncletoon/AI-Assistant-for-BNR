import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

/**
 * Chat API tests for the Gemini-first architecture.
 *
 * Since responses come from Gemini (non-deterministic), these tests focus on:
 * 1. API contract (200/400 status codes, response shape)
 * 2. The 'source' field verifying Gemini is the engine
 * 3. Tool result data being passed through
 * 4. Error handling (missing API key, empty message)
 *
 * Tests that assert specific response wording are integration tests
 * that require a live Gemini API key. They are conditionally skipped.
 */

const hasGeminiKey = process.env.TEST_LIVE_GEMINI === 'true' && !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

describe('Chat API (POST /api/v1/chat)', () => {
  const app = createApp();

  it('returns 400 bad request if message is empty', async () => {
    const res = await request(app).post('/api/v1/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 bad request if message is not a string', async () => {
    const res = await request(app).post('/api/v1/chat').send({ message: 123 });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with a reply for any valid message', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'hello' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
    expect(res.body.source).toBeDefined();
  });

  it('accepts context with caseId and cooperativeId', async () => {
    const casesRes = await request(app).get('/api/v1/cases');
    if (!casesRes.body.data || casesRes.body.data.length === 0) return;

    const focalCase = casesRes.body.data[0];
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        message: 'tell me about this case',
        context: { caseId: focalCase.id, cooperativeId: focalCase.cooperativeId },
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(typeof res.body.reply).toBe('string');
  });

  it('accepts context with conversationHistory', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        message: 'what about the risks?',
        context: {
          conversationHistory: [
            { role: 'user' as const, content: 'tell me about the assessment' },
            { role: 'assistant' as const, content: 'The cooperative scored 72.5 out of 100.' },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(typeof res.body.reply).toBe('string');
  });

  it('handles empty string message gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: '   ' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Please ask a question');
  });
});

// Integration tests that require a live Gemini API key
// These verify Gemini correctly calls tools and produces grounded responses
describe.skipIf(!hasGeminiKey)('Gemini Integration Tests (live API)', () => {
  const app = createApp();

  it('answers cooperative count questions using get_cooperatives_count tool', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'how many cooperatives do we have in the database?' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    // Gemini should mention the count (5) somewhere in the response
    expect(res.body.reply).toMatch(/5/);
  }, 30000);

  it('lists cooperatives with names and details', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'list all the cooperatives with their names and TINs' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    // Should mention at least one known cooperative
    expect(res.body.reply).toMatch(/Twitezimbere|Duterimbere|Umusingi|Abahinzi|Isonga/i);
  }, 30000);

  it('retrieves cooperative details by name', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'Tell me about Koperative Twitezimbere Gasabo' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    expect(res.body.reply).toMatch(/Twitezimbere/i);
    expect(res.body.reply).toMatch(/Bumbogo|100234567/i);
  }, 30000);

  it('retrieves assessment details with context', async () => {
    const casesRes = await request(app).get('/api/v1/cases');
    if (!casesRes.body.data || casesRes.body.data.length === 0) return;

    const focalCase = casesRes.body.data[0];
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        message: 'what is the assessment result?',
        context: { caseId: focalCase.id, cooperativeId: focalCase.cooperativeId },
      });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    // Should reference scoring data
    expect(res.body.reply).toMatch(/score|risk|pillar/i);
  }, 30000);

  it('politely declines off-topic questions', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({ message: 'What is the weather like in Kigali today?' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    // Should decline and mention what it CAN help with
    expect(res.body.reply).toMatch(/credit|cooperative|loan|assessment|agricultural/i);
  }, 30000);

  it('does not leak internal debug tags', async () => {
    const casesRes = await request(app).get('/api/v1/cases');
    if (!casesRes.body.data || casesRes.body.data.length === 0) return;

    const focalCase = casesRes.body.data[0];
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        message: 'explain the scoring',
        context: { caseId: focalCase.id, cooperativeId: focalCase.cooperativeId },
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).not.toContain('[HISTORICAL_REPAYMENTS]');
    expect(res.body.reply).not.toContain('[sourceType]');
  }, 30000);
});
