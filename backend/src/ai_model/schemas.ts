import { z } from 'zod';

export const DocumentTypeEnum = z.enum([
  'APPLICATION_FORM',
  'OFFTAKE_AGREEMENT',
  'REPAYMENT_HISTORY',
  'LOAN_RECORDS',
  'COOPERATIVE_PROFILE',
  'ATTACHMENT',
]);

export type DocumentType = z.infer<typeof DocumentTypeEnum>;

// Schema for structured application form extraction
export const ExtractedApplicationFormSchema = z.object({
  cooperativeName: z.string(),
  tin: z.string(),
  registrationNo: z.string().optional(),
  sector: z.string(),
  requestedAmountRwf: z.number().positive(),
  tenorMonths: z.number().int().positive(),
  cropType: z.string().default('Maize'),
  purpose: z.string(),
  cultivatedHectares: z.number().positive().optional(),
  memberFarmers: z.number().int().positive().optional(),
  projectedHarvestTons: z.number().positive().optional(),
  season: z.enum(['SEASON_A', 'SEASON_B']).default('SEASON_A').optional(),
  storageFacilityType: z.enum(['AERATED_WAREHOUSE', 'TRADITIONAL_SHED', 'STANDARD_STORAGE']).default('AERATED_WAREHOUSE').optional(),
  documentConfidence: z.number().min(0).max(1).default(0.95),
  extractionNotes: z.string().optional(),
});

export type ExtractedApplicationForm = z.infer<typeof ExtractedApplicationFormSchema>;

// Schema for structured off-take agreement extraction
export const ExtractedOfftakeAgreementSchema = z.object({
  buyerName: z.string(),
  buyerTin: z.string().optional(),
  contractedVolumeKg: z.number().positive(),
  agreedPriceRwfKg: z.number().positive(),
  totalContractValueRwf: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
  isVerified: z.boolean().default(true),
  paymentTerms: z.string().optional(),
  deliveryLocation: z.string().optional(),
  documentConfidence: z.number().min(0).max(1).default(0.95),
});

export type ExtractedOfftakeAgreement = z.infer<typeof ExtractedOfftakeAgreementSchema>;

// Chronological Proof Event
export interface ProofEvent {
  period: string;
  eventType: 'LOAN_DISBURSED' | 'LOAN_REPAID' | 'GRAIN_SALE' | 'INPUT_EXPENSE' | 'CONTRACT_SIGNED' | 'AUDIT_RECORD';
  description: string;
  amountRwf?: string;
  institutionOrBuyer?: string;
  referenceId?: string;
  status: 'positive' | 'warning' | 'neutral';
  timestamp?: number;
}

// Blended feature set linking extracted docs with PostgreSQL records
export interface AggregatedCreditFeatures {
  cooperativeId: string;
  cooperativeName: string;
  tin: string;
  sector: string;
  requestedAmountRwf: string;
  tenorMonths: number;
  purpose: string;

  // Institutional Loan Records
  historicalTotalBorrowedRwf: string;
  facilitiesCount: number;
  settledFacilitiesCount: number;
  lendingInstitutions: string[];

  // Institutional Repayment Ledger Performance
  totalInstallments: number;
  onTimeInstallments: number;
  onTimeRepaymentRatio: number;
  maxDaysPastDue: number;
  totalPenaltiesRwf: string;

  // Cash Flow Account Transactions
  totalInflowRwf: string;
  totalOutflowRwf: string;
  netCashFlowRwf: string;
  currentBalanceRwf: string;
  grainSalesVolumeRwf: string;
  transactionCount: number;

  // Commercial Offtake Agreements
  hasVerifiedOfftakeContract: boolean;
  offtakeBuyerName?: string;
  contractedVolumeKg: number;
  agreedPriceRwfKg: number;
  totalContractValueRwf: string;
  offtakeCoverageRatio: number;

  // Agricultural Operational Capacity
  totalHectares: number;
  memberCount: number;
  storageCapacityT: number;
  storageFacilityType?: 'AERATED_WAREHOUSE' | 'TRADITIONAL_SHED' | 'STANDARD_STORAGE';
  agriculturalSeason?: 'SEASON_A' | 'SEASON_B';
  postHarvestLossRiskPct?: number;
  recordQuality: number;
  hasDigitalHistory: boolean;
  womenLed: boolean;

  // Detailed Proof Timeline
  chronologicalProofEvents: ProofEvent[];
}

// Pillar breakdown out of 100 points
export interface ScoringPillar {
  pillarName: string;
  scoreAwarded: number;
  maxPoints: number;
  summary: string;
}

// Credit Assessment Result
export interface CreditAssessmentResult {
  scoreOutOf100: number;
  riskBand: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'INSUFFICIENT_DATA';
  defaultProbability: number;
  suggestedCreditLimitRwf: string;
  isEligibleForSeasonalLoan: boolean;
  uncertaintyFlag: boolean;
  pillars: {
    repaymentDiscipline: ScoringPillar;
    offtakeSecurity: ScoringPillar;
    cashFlowHealth: ScoringPillar;
    operationalCapacity: ScoringPillar;
  };
  narrativeProof: string;
  chronologicalTimeline: ProofEvent[];
  topKeyDrivers: Array<{
    rank: number;
    factor: string;
    impactPoints: number;
    statement: string;
    sourceType: string;
    recordIds: string[];
  }>;
  complianceRecommendations: string[];
}
