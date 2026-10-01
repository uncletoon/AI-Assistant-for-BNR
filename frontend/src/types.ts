export type RiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';

export interface FinancialKPI {
  label: string;
  value: string;
  subtext: string;
  status: 'positive' | 'neutral' | 'caution';
}

export interface MonthlyCashFlowPoint {
  month: string;
  projectedRevenue: number;
  operationalCost: number;
  repaymentCapacity: number;
  scheduledDebtService: number;
}

export interface RiskFactor {
  category: string;
  score: number; // 0-100
  level: RiskLevel;
  notes: string;
}

export interface ScoringPillarItem {
  pillarName: string;
  scoreAwarded: number;
  maxPoints: number;
  summary: string;
}

export interface CreditAssessmentData {
  applicantName: string;
  applicantType: string;
  location: string;
  score: number;
  maxScore: number;
  riskLevel: RiskLevel;
  defaultProbability: string;
  recommendedCreditLimit: string;
  currency: string;
  keyFactors: {
    text: string;
    type: 'positive' | 'neutral' | 'caution';
  }[];
  financialKpis: FinancialKPI[];
  cashFlowSchedule: MonthlyCashFlowPoint[];
  riskBreakdown: RiskFactor[];
  approvalConditions: string[];
  pillars?: {
    repaymentDiscipline?: ScoringPillarItem;
    offtakeSecurity?: ScoringPillarItem;
    cashFlowHealth?: ScoringPillarItem;
    operationalCapacity?: ScoringPillarItem;
  };
  chronologicalTimeline?: ProofEvent[];
  persistedCaseId?: string;
  persistedScoreId?: string;
}

export interface PortfolioData {
  totalExposure: string;
  totalLoans: number;
  performingRate: string;
  nplRate: string;
  weightedCreditScore: number;
  cooperativeCount: number;
  regionalDistribution: { region: string; exposure: string; percentage: number }[];
  cropExposure: { crop: string; percentage: number; riskRating: string }[];
}

export interface ReportData {
  reportTitle: string;
  memoId: string;
  executiveSummary: string;
  targetApplicant: string;
  dateGenerated: string;
  keyFindings: string[];
  sensitivityAnalysis: {
    scenario: string;
    impact: string;
    resilience: string;
  }[];
  regulatoryNotes: string;
}

export interface ProofEvent {
  period: string;
  eventType: 'LOAN_DISBURSED' | 'LOAN_REPAID' | 'GRAIN_SALE' | 'CONTRACT_SIGNED';
  description: string;
  amountRwf?: string;
  institutionOrBuyer?: string;
  referenceId?: string;
  status: 'positive' | 'warning' | 'neutral';
  timestamp?: number;
}

export interface AiScoringResult {
  scoreOutOf100: number;
  defaultProbability: number;
  riskBand: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'INSUFFICIENT_DATA';
  suggestedCreditLimitRwf: string;
  uncertaintyFlag: boolean;
  pillars: {
    repaymentHealthScore: number;
    cashFlowLiquidityScore: number;
    offtakeCoverageScore: number;
    cooperativeCapacityScore: number;
  };
  topKeyDrivers: {
    rank: number;
    factor: string;
    impactPoints: number;
    statement: string;
    sourceType: string;
  }[];
  recommendationSummary: string;
  approvalConditions: string[];
}

export interface BackendAssessmentResponse {
  extractedApplication: {
    cooperativeName: string;
    tin: string;
    sector: string;
    registrationNo: string;
    requestedAmountRwf: number;
    tenorMonths: number;
    cropType: string;
    purpose: string;
    cultivatedHectares?: number;
    memberFarmers?: number;
    documentConfidence: number;
  };
  extractedOfftake?: {
    buyerName: string;
    contractedVolumeKg: number;
    agreedPriceRwfKg: number;
    buyerRating?: string;
    confidence: number;
  };
  features: {
    cooperativeName: string;
    tin: string;
    sector: string;
    requestedAmountRwf: string;
    tenorMonths: number;
    historicalTotalBorrowedRwf: string;
    facilitiesCount: number;
    settledFacilitiesCount: number;
    lendingInstitutions: string[];
    totalInstallments: number;
    onTimeInstallments: number;
    onTimeRepaymentRatio: number;
    maxDaysPastDue: number;
    totalPenaltiesRwf: string;
    totalInflowRwf: string;
    totalOutflowRwf: string;
    netCashFlowRwf: string;
    currentBalanceRwf: string;
    grainSalesVolumeRwf: string;
    hasVerifiedOfftakeContract: boolean;
    offtakeBuyerName?: string;
    contractedVolumeKg?: number;
    totalContractValueRwf?: string;
    totalHectares: number;
    memberCount: number;
    storageCapacityT: number;
    recordQuality: number;
    chronologicalProofEvents: ProofEvent[];
  };
  assessment: AiScoringResult;
  formattedNarrativeProof: string;
}

export interface StructuredAiData {
  type: 'credit_assessment' | 'portfolio_risk' | 'cooperative_review' | 'risk_report';
  assessment?: CreditAssessmentData;
  portfolio?: PortfolioData;
  report?: ReportData;
  backendAssessment?: BackendAssessmentResponse;
  proofEvents?: ProofEvent[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  structuredData?: StructuredAiData;
  attachments?: {
    name: string;
    size: string;
    type: string;
    fileContent?: string;
    file?: File;
  }[];
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  description: string;
  icon: 'credit' | 'chart' | 'cooperative' | 'report';
  defaultQuery: string;
}

export interface AssessmentHistoryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  score?: number;
  riskLevel?: RiskLevel;
  preview: string;
}
