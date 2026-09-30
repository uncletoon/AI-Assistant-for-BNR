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

export interface StructuredAiData {
  type: 'credit_assessment' | 'portfolio_risk' | 'cooperative_review' | 'risk_report';
  assessment?: CreditAssessmentData;
  portfolio?: PortfolioData;
  report?: ReportData;
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
