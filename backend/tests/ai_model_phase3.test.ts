import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Phase 3: Scoring & Decision REST API Endpoints', () => {
  const app = createApp();

  afterAll(async () => {
    const cases = await prisma.loanCase.findMany({
      where: {
        purpose: {
          in: [
            'Seasonal maize test aggregation',
            'Decision override test',
            'Seasonal maize aggregation for Season 2026A',
          ],
        },
      },
      select: { id: true },
    });
    const ids = cases.map((c) => c.id);
    if (ids.length > 0) {
      await prisma.document.deleteMany({ where: { loanCaseId: { in: ids } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
      await prisma.scoreReason.deleteMany({ where: { score: { loanCaseId: { in: ids } } } });
      await prisma.decision.deleteMany({ where: { loanCaseId: { in: ids } } });
      await prisma.score.deleteMany({ where: { loanCaseId: { in: ids } } });
      await prisma.loanCase.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('POST /api/v1/scoring/evaluate evaluates application and returns chronological proof', async () => {
    const rawApplication = `
      BANK OF KIGALI COOPERATIVE CREDIT INTAKE
      Cooperative Name: Koperative Twitezimbere Gasabo
      TIN: 100234567
      Sector: Bumbogo
      Requested Amount: 25,000,000 RWF
      Tenor: 6 months
      Purpose: Seasonal maize aggregation for Season 2026A
      Farmland Hectares: 85.5
      Member Farmers: 145
      Off-take Partner: ABC Trade Ltd
      Contracted Volume: 200,000 kg
      Floor Price: 420 RWF
    `;

    const res = await request(app)
      .post('/api/v1/scoring/evaluate')
      .send({ applicationText: rawApplication });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.assessment.scoreOutOf100).toBeGreaterThanOrEqual(75);
    expect(res.body.data.formattedNarrativeProof).toContain('Chronological Ledger & Transaction Proof');
    expect(res.body.data.formattedNarrativeProof).toContain('Bumbogo');
  });

  it('POST /api/v1/scoring/cases/:id/score scores existing case, persists score reasons and audit log', async () => {
    const coop = await prisma.cooperative.findFirst();
    expect(coop).toBeDefined();
    const officer = await prisma.user.findFirst();
    expect(officer).toBeDefined();
    if (!officer || !coop) return;

    const testCase = await prisma.loanCase.create({
      data: {
        cooperative: { connect: { id: coop.id } },
        createdBy: { connect: { id: officer.id } },
        requestedAmountRwf: 25000000n,
        tenorMonths: 6,
        purpose: 'Seasonal maize test aggregation',
        status: 'DRAFT',
      },
      include: { cooperative: true },
    });

    const res = await request(app)
      .post(`/api/v1/scoring/cases/${testCase.id}/score`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.score.id).toBeDefined();
    expect(res.body.data.score.reasons.length).toBeGreaterThan(0);

    // Verify database state
    const updatedCase = await prisma.loanCase.findUnique({
      where: { id: testCase.id },
    });
    expect(updatedCase?.status).toBe('SCORED');

    // Verify audit log entry
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'SCORE_CALCULATED', entityId: res.body.data.score.id },
    });
    expect(audit).toBeDefined();
  });

  it('POST /api/v1/scoring/cases/:id/decision enforces non empty reason on overrides', async () => {
    const coop = await prisma.cooperative.findFirst();
    const officer = await prisma.user.findFirst();
    expect(coop).toBeDefined();
    expect(officer).toBeDefined();
    if (!coop || !officer) return;

    const decisionCase = await prisma.loanCase.create({
      data: {
        cooperative: { connect: { id: coop.id } },
        createdBy: { connect: { id: officer.id } },
        requestedAmountRwf: 20000000n,
        tenorMonths: 6,
        purpose: 'Decision override test',
        status: 'SCORED',
      },
    });

    // Score it first
    await request(app).post(`/api/v1/scoring/cases/${decisionCase.id}/score`).send();

    // 1. Override without reason must fail with 400 Bad Request
    const failedRes = await request(app)
      .post(`/api/v1/scoring/cases/${decisionCase.id}/decision`)
      .send({
        decision: 'OVERRIDE_APPROVE',
        approvedAmountRwf: '20000000',
        reason: '',
      });

    expect(failedRes.status).toBe(400);
    expect(failedRes.body.message).toContain('reason is strictly required for decision overrides');
  });
});
