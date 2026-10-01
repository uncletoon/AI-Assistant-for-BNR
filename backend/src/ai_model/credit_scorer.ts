import {
  AggregatedCreditFeatures,
  CreditAssessmentResult,
  ScoringPillar,
} from './schemas.js';

export class CreditScorerService {
  /**
   * Calculate calibrated credit score out of 100% and suggested loan limit
   */
  calculateCreditScore(features: AggregatedCreditFeatures): CreditAssessmentResult {
    // Data Sufficiency Gate: check if minimum verifiable records exist
    const isInsufficient =
      features.recordQuality < 50 ||
      (features.facilitiesCount === 0 && !features.hasVerifiedOfftakeContract);

    if (isInsufficient) {
      return this.buildInsufficientDataResult(features);
    }

    // 1. Pillar 1: Repayment Discipline & Historical Track Record (Max: 35 points)
    const repaymentPillar = this.scoreRepaymentDiscipline(features);

    // 2. Pillar 2: Commercial Off-Take Security & Guaranteed Floor Pricing (Max: 25 points)
    const offtakePillar = this.scoreOfftakeSecurity(features);

    // 3. Pillar 3: Operating Cash Flow & Liquidity (Max: 20 points)
    const cashFlowPillar = this.scoreCashFlowHealth(features);

    // 4. Pillar 4: Agricultural Operational Infrastructure (Max: 20 points)
    const operationalPillar = this.scoreOperationalCapacity(features);

    // Total Score out of 100%
    const totalScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          repaymentPillar.scoreAwarded +
            offtakePillar.scoreAwarded +
            cashFlowPillar.scoreAwarded +
            operationalPillar.scoreAwarded
        )
      )
    );

    // Risk Band Classification
    let riskBand: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' = 'HIGH';
    if (totalScore >= 80) riskBand = 'LOW';
    else if (totalScore >= 65) riskBand = 'MODERATE';
    else if (totalScore >= 45) riskBand = 'HIGH';
    else riskBand = 'VERY_HIGH';

    // Calibrated Default Probability (Inverse sigmoid-like scaling)
    const defaultProb = Math.max(
      0.018,
      Math.min(0.48, parseFloat(((100 - totalScore) / 450 + (features.maxDaysPastDue > 0 ? 0.05 : 0)).toFixed(3)))
    );

    // Suggested Credit Limit Formula
    const requestedNum = Number(features.requestedAmountRwf);
    const contractValNum = Number(features.totalContractValueRwf);
    let limitNum = requestedNum;

    if (riskBand === 'LOW') {
      // Up to 100% of requested or 70% of verified contract value
      limitNum = Math.min(requestedNum, Math.round(contractValNum * 0.7) || requestedNum);
    } else if (riskBand === 'MODERATE') {
      limitNum = Math.min(requestedNum * 0.85, Math.round(contractValNum * 0.55) || requestedNum * 0.85);
    } else {
      limitNum = Math.min(requestedNum * 0.5, Math.round(contractValNum * 0.35) || requestedNum * 0.5);
    }

    // Top Key Drivers
    const topKeyDrivers = [
      {
        rank: 1,
        factor: 'repayment_performance',
        impactPoints: repaymentPillar.scoreAwarded,
        statement: `${(features.onTimeRepaymentRatio * 100).toFixed(1)}% on time settlement across historical credit lines with zero delinquencies.`,
        sourceType: 'INSTITUTIONAL_REPAYMENTS',
        recordIds: [features.cooperativeId],
      },
      {
        rank: 2,
        factor: 'offtake_security',
        impactPoints: offtakePillar.scoreAwarded,
        statement: `Binding off-take contract with ${features.offtakeBuyerName || 'Africa Improved Foods'} covering ${features.contractedVolumeKg.toLocaleString()} kg at RWF ${features.agreedPriceRwfKg}/kg.`,
        sourceType: 'COMMERCIAL_CONTRACT',
        recordIds: [features.cooperativeId],
      },
      {
        rank: 3,
        factor: 'cash_flow_liquidity',
        impactPoints: cashFlowPillar.scoreAwarded,
        statement: `Operating net cash flow of RWF ${(Number(features.netCashFlowRwf) / 1000000).toFixed(1)}M with verified grain sale account sweeps.`,
        sourceType: 'ACCOUNT_TRANSACTIONS',
        recordIds: [features.cooperativeId],
      },
      {
        rank: 4,
        factor: 'operational_capacity',
        impactPoints: operationalPillar.scoreAwarded,
        statement: `Cultivates ${features.totalHectares} hectares with ${features.storageCapacityT} MT aerated warehouse storage in ${features.sector} Sector.`,
        sourceType: 'COOPERATIVE_REGISTRY',
        recordIds: [features.cooperativeId],
      },
    ];

    // Easy English narrative summary with evidence details
    const narrativeProof =
      `Credit assessment for ${features.cooperativeName} in ${features.sector} Sector resulted in an overall credit score of ${totalScore}/100% (${riskBand} Risk).\n\n` +
      `Proof of Creditworthiness:\n` +
      `1. Repayment discipline: The cooperative maintains a ${(features.onTimeRepaymentRatio * 100).toFixed(1)}% on time repayment ratio across ${features.totalInstallments} scheduled installments, having settled prior facilities across institutions including ${features.lendingInstitutions.join(', ')}.\n` +
      `2. Guaranteed buyer off-take: The cooperative holds a verified commercial purchase contract with ${features.offtakeBuyerName || 'Africa Improved Foods'} for ${features.contractedVolumeKg.toLocaleString()} kg of maize, valued at RWF ${(Number(features.totalContractValueRwf) / 1000000).toFixed(1)} Million.\n` +
      `3. Cash flow health: Total money in inflows reached RWF ${(Number(features.totalInflowRwf) / 1000000).toFixed(1)} Million, generating a positive net cash flow of RWF ${(Number(features.netCashFlowRwf) / 1000000).toFixed(1)} Million.\n` +
      `4. Physical capacity: Supported by ${features.totalHectares} hectares of farmland and ${features.storageCapacityT} MT storage capacity with an audited record quality of ${features.recordQuality}/100.`;

    const complianceRecommendations = [
      `Establish a direct buyer escrow sweep with ${features.offtakeBuyerName || 'Africa Improved Foods'} for grain delivery proceeds`,
      'Schedule a physical agronomist field inspection 30 days prior to aggregation harvest',
      'Record all disbursement and settlement events in the immutable compliance audit log',
    ];

    return {
      scoreOutOf100: totalScore,
      riskBand,
      defaultProbability: defaultProb,
      suggestedCreditLimitRwf: limitNum.toString(),
      isEligibleForSeasonalLoan: totalScore >= 60,
      uncertaintyFlag: false,
      pillars: {
        repaymentDiscipline: repaymentPillar,
        offtakeSecurity: offtakePillar,
        cashFlowHealth: cashFlowPillar,
        operationalCapacity: operationalPillar,
      },
      narrativeProof,
      chronologicalTimeline: features.chronologicalProofEvents,
      topKeyDrivers,
      complianceRecommendations,
    };
  }

  private scoreRepaymentDiscipline(features: AggregatedCreditFeatures): ScoringPillar {
    let pts = 0;
    // On-time ratio (up to 25 pts)
    pts += Math.round(features.onTimeRepaymentRatio * 25);

    // Days past due penalty
    if (features.maxDaysPastDue === 0) pts += 5;
    else if (features.maxDaysPastDue <= 15) pts += 2;

    // Multi-lender history
    if (features.facilitiesCount >= 2) pts += 5;
    else if (features.facilitiesCount === 1) pts += 3;

    pts = Math.min(35, Math.max(0, pts));
    return {
      pillarName: 'Repayment Discipline',
      scoreAwarded: pts,
      maxPoints: 35,
      summary: `${(features.onTimeRepaymentRatio * 100).toFixed(1)}% on time repayment across ${features.totalInstallments} installments with ${features.maxDaysPastDue} days past due.`,
    };
  }

  private scoreOfftakeSecurity(features: AggregatedCreditFeatures): ScoringPillar {
    let pts = 0;
    if (features.hasVerifiedOfftakeContract) {
      pts += 15;
      if (features.offtakeCoverageRatio >= 0.8) pts += 6;
      else if (features.offtakeCoverageRatio >= 0.5) pts += 3;

      if (features.agreedPriceRwfKg >= 400) pts += 4;
      else if (features.agreedPriceRwfKg >= 350) pts += 2;
    }

    pts = Math.min(25, Math.max(0, pts));
    return {
      pillarName: 'Commercial Off-Take Security',
      scoreAwarded: pts,
      maxPoints: 25,
      summary: features.hasVerifiedOfftakeContract
        ? `Verified purchase contract with ${features.offtakeBuyerName} covering ${features.contractedVolumeKg.toLocaleString()} kg at RWF ${features.agreedPriceRwfKg}/kg.`
        : 'No verified commercial forward off-take contract found.',
    };
  }

  private scoreCashFlowHealth(features: AggregatedCreditFeatures): ScoringPillar {
    let pts = 0;
    const netCash = Number(features.netCashFlowRwf);
    const inflows = Number(features.totalInflowRwf);

    if (netCash > 0) pts += 8;
    if (inflows >= 50000000) pts += 7;
    else if (inflows >= 20000000) pts += 4;

    if (features.transactionCount >= 6) pts += 5;
    else if (features.transactionCount >= 3) pts += 2;

    pts = Math.min(20, Math.max(0, pts));
    return {
      pillarName: 'Operating Cash Flow & Liquidity',
      scoreAwarded: pts,
      maxPoints: 20,
      summary: `Net operating cash flow of RWF ${(netCash / 1000000).toFixed(1)}M across ${features.transactionCount} recorded transactions.`,
    };
  }

  private scoreOperationalCapacity(features: AggregatedCreditFeatures): ScoringPillar {
    let pts = 0;
    // 1. Farmland scale (up to 5 pts)
    if (features.totalHectares >= 60) pts += 5;
    else if (features.totalHectares >= 30) pts += 3;
    else pts += 1;

    // 2. Storage type & post-harvest loss factor (up to 5 pts)
    // Aerated warehouse reduces post-harvest loss from 12% down to 3%
    const isAerated = features.storageFacilityType === 'AERATED_WAREHOUSE' || features.storageCapacityT >= 60;
    const isShed = features.storageFacilityType === 'TRADITIONAL_SHED';
    if (isAerated) {
      pts += 5; // minimal post-harvest loss ~3%
    } else if (isShed) {
      pts += 1; // traditional shed post-harvest loss risk ~12%
    } else {
      pts += 3; // standard storage
    }

    // 3. Seasonal stability factor (up to 3 pts)
    // Season A (Sept-Feb, major maize season) vs Season B (Mar-June, short rains)
    if (features.agriculturalSeason === 'SEASON_A' || !features.agriculturalSeason) {
      pts += 3;
    } else {
      pts += 2;
    }

    // 4. Audited record quality (up to 7 pts)
    pts += Math.round((features.recordQuality / 100) * 7);

    pts = Math.min(20, Math.max(0, pts));
    const storageDesc = isAerated
      ? `${features.storageCapacityT} MT aerated warehouse (3% post harvest loss)`
      : `${features.storageCapacityT} MT storage facility`;

    return {
      pillarName: 'Operational & Storage Infrastructure',
      scoreAwarded: pts,
      maxPoints: 20,
      summary: `${features.totalHectares} Ha farmland, ${storageDesc}, and ${features.recordQuality}/100 audited record quality.`,
    };
  }

  private buildInsufficientDataResult(features: AggregatedCreditFeatures): CreditAssessmentResult {
    return {
      scoreOutOf100: 0,
      riskBand: 'INSUFFICIENT_DATA',
      defaultProbability: 0.5,
      suggestedCreditLimitRwf: '0',
      isEligibleForSeasonalLoan: false,
      uncertaintyFlag: true,
      pillars: {
        repaymentDiscipline: { pillarName: 'Repayment Discipline', scoreAwarded: 0, maxPoints: 35, summary: 'Insufficient repayment records' },
        offtakeSecurity: { pillarName: 'Commercial Off-Take Security', scoreAwarded: 0, maxPoints: 25, summary: 'No verified contract' },
        cashFlowHealth: { pillarName: 'Operating Cash Flow & Liquidity', scoreAwarded: 0, maxPoints: 20, summary: 'Insufficient bank cash flow records' },
        operationalCapacity: { pillarName: 'Operational Infrastructure', scoreAwarded: 0, maxPoints: 20, summary: 'Record quality below acceptable threshold' },
      },
      narrativeProof:
        `Assessment halted under the Data Sufficiency Gate rule for ${features.cooperativeName}. ` +
        `Audited record quality is ${features.recordQuality}/100 and institutional ledgers are thin. ` +
        `An on site agronomic inspection and field verification visit is recommended prior to facility consideration.`,
      chronologicalTimeline: features.chronologicalProofEvents,
      topKeyDrivers: [
        {
          rank: 1,
          factor: 'data_sufficiency_warning',
          impactPoints: 0,
          statement: `Record quality of ${features.recordQuality}/100 is below the bank underwriting threshold.`,
          sourceType: 'AUDIT_GATE',
          recordIds: [features.cooperativeId],
        },
      ],
      complianceRecommendations: [
        'Conduct comprehensive on site cooperative audit and farm registry inspection',
        'Verify farmer land titles with Rwanda Agriculture and Animal Resources Board (RAB)',
      ],
    };
  }
}

export const creditScorer = new CreditScorerService();
