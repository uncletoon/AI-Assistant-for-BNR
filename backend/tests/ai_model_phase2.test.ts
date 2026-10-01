import { describe, it, expect } from 'vitest';
import {
  creditScorer,
  explainabilityEngine,
  assessCooperativeLoan,
} from '../src/ai_model/index.js';
import { AggregatedCreditFeatures } from '../src/ai_model/schemas.js';

describe('Phase 2: Core Credit Scoring Engine & Chronological Proof Generation', () => {
  const mockFeatures: AggregatedCreditFeatures = {
    cooperativeId: 'coop-123',
    cooperativeName: 'Koperative Twitezimbere Gasabo',
    tin: '100234567',
    sector: 'Bumbogo',
    requestedAmountRwf: '25000000',
    tenorMonths: 6,
    purpose: 'Maize aggregation for Season 2026A',
    historicalTotalBorrowedRwf: '30000000',
    facilitiesCount: 2,
    settledFacilitiesCount: 2,
    lendingInstitutions: ['Bumbogo Umurenge SACCO', 'Bank of Kigali'],
    totalInstallments: 6,
    onTimeInstallments: 6,
    onTimeRepaymentRatio: 1.0,
    maxDaysPastDue: 0,
    totalPenaltiesRwf: '0',
    totalInflowRwf: '72000000',
    totalOutflowRwf: '63300000',
    netCashFlowRwf: '8700000',
    currentBalanceRwf: '20700000',
    grainSalesVolumeRwf: '54000000',
    transactionCount: 9,
    hasVerifiedOfftakeContract: true,
    offtakeBuyerName: 'Africa Improved Foods (AIF)',
    contractedVolumeKg: 350000,
    agreedPriceRwfKg: 420,
    totalContractValueRwf: '147000000',
    offtakeCoverageRatio: 0.95,
    totalHectares: 85.5,
    memberCount: 145,
    storageCapacityT: 120,
    recordQuality: 95,
    hasDigitalHistory: true,
    womenLed: false,
    chronologicalProofEvents: [
      {
        period: 'February 2024',
        eventType: 'LOAN_DISBURSED',
        description: 'In February 2024, the cooperative secured a seasonal loan of RWF 10.0 Million from Bumbogo Umurenge SACCO with a 6 month tenor.',
        amountRwf: '10000000',
        status: 'positive',
      },
      {
        period: 'May 2024',
        eventType: 'LOAN_REPAID',
        description: 'In May 2024, the cooperative paid their scheduled installment of RWF 2.5 Million on time with zero days past due.',
        amountRwf: '2500000',
        status: 'positive',
      },
      {
        period: 'October 2024',
        eventType: 'GRAIN_SALE',
        description: 'In October 2024, the cooperative recorded a verified grain sale of RWF 28.0 Million from buyer Africa Improved Foods (AIF).',
        amountRwf: '2800000',
        status: 'positive',
      },
    ],
  };

  it('calculates score out of 100% and calibrated risk band', () => {
    const assessment = creditScorer.calculateCreditScore(mockFeatures);

    expect(assessment.scoreOutOf100).toBeGreaterThanOrEqual(80);
    expect(assessment.scoreOutOf100).toBeLessThanOrEqual(100);
    expect(assessment.riskBand).toBe('LOW');
    expect(assessment.defaultProbability).toBeLessThan(0.1);
    expect(assessment.isEligibleForSeasonalLoan).toBe(true);

    // Verify 4 pillars
    expect(assessment.pillars.repaymentDiscipline.scoreAwarded).toBeGreaterThanOrEqual(30);
    expect(assessment.pillars.offtakeSecurity.scoreAwarded).toBeGreaterThanOrEqual(20);
    expect(assessment.pillars.cashFlowHealth.scoreAwarded).toBeGreaterThanOrEqual(15);
    expect(assessment.pillars.operationalCapacity.scoreAwarded).toBeGreaterThanOrEqual(15);
  });

  it('generates chronological proof narrative in easy English', () => {
    const assessment = creditScorer.calculateCreditScore(mockFeatures);
    const explanation = explainabilityEngine.generateDetailedProofExplanation(mockFeatures, assessment);

    expect(explanation).toContain('Credit Assessment Report: Koperative Twitezimbere Gasabo');
    expect(explanation).toContain('February 2024');
    expect(explanation).toContain('May 2024');
    expect(explanation).toContain('October 2024');
    expect(explanation).toContain('4 Weighted Assessment Pillars');
    expect(explanation).toContain('Underwriting Conditions');
  });

  it('triggers Insufficient Data gate when record quality is below threshold', () => {
    const poorFeatures = {
      ...mockFeatures,
      recordQuality: 30,
      facilitiesCount: 0,
      hasVerifiedOfftakeContract: false,
    };

    const assessment = creditScorer.calculateCreditScore(poorFeatures);
    expect(assessment.riskBand).toBe('INSUFFICIENT_DATA');
    expect(assessment.uncertaintyFlag).toBe(true);
    expect(assessment.suggestedCreditLimitRwf).toBe('0');
    expect(assessment.isEligibleForSeasonalLoan).toBe(false);
  });

  it('runs the end to end assessCooperativeLoan pipeline from raw text inputs', async () => {
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
    `;

    const rawContract = `
      OFFTAKE PURCHASE AGREEMENT
      Buyer: Africa Improved Foods (AIF)
      Contracted Quantity: 350,000 kg
      Purchase Price: 420 RWF per kg
      Valid: 2026-03-01 to 2026-08-31
    `;

    const result = await assessCooperativeLoan({
      applicationDocument: rawApplication,
      offtakeDocument: rawContract,
    });

    expect(result.extractedApplication.cooperativeName).toBe('Koperative Twitezimbere Gasabo');
    expect(result.features.tin).toBe('100234567');
    expect(result.assessment.scoreOutOf100).toBeGreaterThanOrEqual(75);
    expect(result.formattedNarrativeProof).toContain('Koperative Twitezimbere Gasabo');
    expect(result.formattedNarrativeProof).toContain('Chronological Ledger & Transaction Proof');
  });
});
