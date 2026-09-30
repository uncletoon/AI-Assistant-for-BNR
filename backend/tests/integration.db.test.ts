import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { Role, LenderType, ScoreBand } from '@prisma/client';

describe('Database Integration & Seed Verification', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('queries seeded lenders and verifies Bank of Kigali', async () => {
    const lenders = await prisma.lender.findMany();
    expect(lenders.length).toBeGreaterThan(0);
    const bk = lenders.find((l) => l.name.includes('Bank of Kigali'));
    expect(bk).toBeDefined();
    expect(bk?.type).toBe(LenderType.COMMERCIAL_BANK);
  });

  it('queries seeded users and confirms role separation', async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThanOrEqual(3);

    const officer = users.find((u) => u.email === 'officer@bk.rw');
    const monitor = users.find((u) => u.email === 'monitor@bnr.rw');
    const admin = users.find((u) => u.email === 'admin@agricredit.rw');

    expect(officer).toBeDefined();
    expect(officer?.role).toBe(Role.LOAN_OFFICER);
    expect(officer?.lenderId).not.toBeNull();

    expect(monitor).toBeDefined();
    expect(monitor?.role).toBe(Role.BNR_MONITOR);

    expect(admin).toBeDefined();
    expect(admin?.role).toBe(Role.ADMIN);
  });

  it('queries seeded Gasabo cooperatives and validates attributes', async () => {
    const coops = await prisma.cooperative.findMany();
    expect(coops.length).toBeGreaterThanOrEqual(4);

    for (const coop of coops) {
      expect(coop.district).toBe('Gasabo');
      expect(coop.totalHectares).toBeGreaterThan(0);
      expect(coop.storageCapacityT).toBeGreaterThan(0);
      expect(coop.recordQuality).toBeGreaterThanOrEqual(0);
      expect(coop.recordQuality).toBeLessThanOrEqual(100);
    }
  });

  it('queries sample loan case with historical records, score, and reasons', async () => {
    const loanCases = await prisma.loanCase.findMany({
      include: {
        cooperative: true,
        loanRecords: true,
        repaymentHistory: true,
        offtakeAgreements: true,
        scores: {
          include: {
            reasons: true,
          },
        },
      },
    });

    expect(loanCases.length).toBeGreaterThan(0);
    const sampleCase = loanCases[0];
    expect(sampleCase.cooperative).toBeDefined();
    expect(sampleCase.loanRecords.length).toBeGreaterThan(0);
    expect(sampleCase.repaymentHistory.length).toBeGreaterThan(0);
    expect(sampleCase.offtakeAgreements.length).toBeGreaterThan(0);
    expect(sampleCase.scores.length).toBeGreaterThan(0);

    const score = sampleCase.scores[0];
    expect(score.band).toBe(ScoreBand.LOW);
    expect(score.reasons.length).toBeGreaterThan(0);
    expect(score.reasons[0].impactPoints).toBeGreaterThan(0);
  });

  it('queries SQL view fairness_summary with aggregations by sector and women_led', async () => {
    interface FairnessRow {
      women_led: boolean;
      sector: string;
      has_digital_history: boolean;
      total_cases: number;
      avg_default_prob: string | null;
      approval_rate: string;
    }

    const rows = await prisma.$queryRaw<FairnessRow[]>`SELECT * FROM fairness_summary ORDER BY sector;`;
    expect(rows.length).toBeGreaterThan(0);

    const bumbogo = rows.find((r) => r.sector === 'Bumbogo');
    expect(bumbogo).toBeDefined();
    expect(bumbogo?.total_cases).toBeGreaterThanOrEqual(1);
  });

  it('enforces append only rule on audit_log preventing direct deletions', async () => {
    const logsBefore = await prisma.auditLog.findMany();
    expect(logsBefore.length).toBeGreaterThan(0);

    // Attempt direct delete via raw SQL (intercepted by PostgreSQL DO INSTEAD NOTHING rule)
    await prisma.$executeRawUnsafe(`DELETE FROM audit_log WHERE id = ${logsBefore[0].id};`);

    const logsAfter = await prisma.auditLog.findMany();
    expect(logsAfter.length).toBe(logsBefore.length);
  });

  it('enforces check constraint requiring reason for decision overrides', async () => {
    const loanCases = await prisma.loanCase.findMany();
    const scores = await prisma.score.findMany();
    const users = await prisma.user.findMany({ where: { role: Role.LOAN_OFFICER } });

    expect(loanCases.length).toBeGreaterThan(0);
    expect(scores.length).toBeGreaterThan(0);
    expect(users.length).toBeGreaterThan(0);

    // Attempting an override with empty/null reason must fail check constraint
    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO decisions (id, loan_case_id, score_id, decided_by, decision, approved_amount_rwf, reason, decided_at, created_at, updated_at)
        VALUES (gen_random_uuid(), '${loanCases[0].id}', '${scores[0].id}', '${users[0].id}', 'OVERRIDE_APPROVE', 20000000, '', NOW(), NOW(), NOW());
      `)
    ).rejects.toThrow();
  });
});
