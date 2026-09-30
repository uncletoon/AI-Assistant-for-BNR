import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { institutionalDataService } from '../src/services/institutional.service.js';

describe('Cross-Institutional Financial Records & TIN Lookups', () => {
  const app = createApp();

  it('verifies all 5 Gasabo maize cooperatives are registered with unique TINs', async () => {
    const coops = await prisma.cooperative.findMany({
      orderBy: { name: 'asc' },
    });

    expect(coops.length).toBe(5);

    const tins = coops.map((c) => c.tin);
    expect(new Set(tins).size).toBe(5);

    expect(tins).toContain('100234567'); // Twitezimbere Gasabo
    expect(tins).toContain('100345678'); // Duterimbere Gikomero
    expect(tins).toContain('100456789'); // Umusingi Ndera
    expect(tins).toContain('100567890'); // Abakundamurimo Rutunga
    expect(tins).toContain('100678901'); // Duhuzimbaraga Rusororo
  });

  it('searches cooperative by Rwandan TIN number', async () => {
    const res = await request(app).get('/api/v1/cooperatives/search?q=100234567');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].tin).toBe('100234567');
    expect(res.body.data[0].name).toBe('Koperative Twitezimbere Gasabo');
    expect(res.body.data[0].sector).toBe('Bumbogo');
  });

  it('searches cooperative by Name and Sector', async () => {
    const resName = await request(app).get('/api/v1/cooperatives/search?q=Duterimbere');
    expect(resName.status).toBe(200);
    expect(resName.body.count).toBe(1);
    expect(resName.body.data[0].name).toBe('Koperative Duterimbere Gikomero');
    expect(resName.body.data[0].tin).toBe('100345678');

    const resSector = await request(app).get('/api/v1/cooperatives/search?q=Ndera');
    expect(resSector.status).toBe(200);
    expect(resSector.body.count).toBe(1);
    expect(resSector.body.data[0].name).toBe('Koperative Umusingi Ndera');
  });

  it('retrieves full institutional profile with loan records, repayments, and money in/out transactions', async () => {
    const coop = await prisma.cooperative.findUnique({
      where: { tin: '100234567' },
    });
    expect(coop).toBeDefined();

    const res = await request(app).get(`/api/v1/cooperatives/${coop!.id}/institutional-profile`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const profile = res.body.data;
    expect(profile.cooperative.tin).toBe('100234567');
    expect(profile.cooperative.name).toBe('Koperative Twitezimbere Gasabo');

    // Historical loans from multiple institutions
    expect(profile.loanRecords.length).toBeGreaterThanOrEqual(2);
    const lenders = profile.loanRecords.map((l: { institutionName: string }) => l.institutionName);
    expect(lenders).toContain('Bumbogo Umurenge SACCO');
    expect(lenders).toContain('Bank of Kigali');

    // Repayment history
    expect(profile.repaymentHistory.length).toBeGreaterThanOrEqual(6);
    expect(profile.kpis.repaymentHealth.onTimeRatio).toBe(1.0);
    expect(profile.kpis.repaymentHealth.maxDaysPastDue).toBe(0);

    // Account transactions (Money In and Out)
    expect(profile.accountTransactions.length).toBeGreaterThanOrEqual(5);
    const txTypes = profile.accountTransactions.map((t: { transactionType: string }) => t.transactionType);
    expect(txTypes).toContain('CREDIT');
    expect(txTypes).toContain('DEBIT');

    // Cash flow KPIs
    expect(BigInt(profile.kpis.cashFlowHealth.totalInflowRwf)).toBeGreaterThan(BigInt(0));
    expect(BigInt(profile.kpis.cashFlowHealth.totalOutflowRwf)).toBeGreaterThan(BigInt(0));
    expect(BigInt(profile.kpis.cashFlowHealth.grainSalesVolumeRwf)).toBeGreaterThan(BigInt(0));
  });

  it('calculates deterministic financial health KPIs via InstitutionalDataService', async () => {
    const coop = await prisma.cooperative.findUnique({
      where: { tin: '100234567' },
    });
    expect(coop).toBeDefined();

    const kpis = await institutionalDataService.calculateFinancialHealthKpis(coop!.id);

    expect(kpis.repaymentHealth.onTimeRatio).toBe(1.0);
    expect(kpis.repaymentHealth.maxDaysPastDue).toBe(0);
    expect(kpis.debtProfile.institutions).toContain('Bumbogo Umurenge SACCO');
    expect(kpis.debtProfile.institutions).toContain('Bank of Kigali');
    expect(BigInt(kpis.cashFlowHealth.grainSalesVolumeRwf)).toBeGreaterThan(BigInt(30000000));
  });
});
