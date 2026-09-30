import {
  SuggestedPrompt,
  AssessmentHistoryItem,
  CreditAssessmentData,
  PortfolioData,
  ReportData,
  ChatMessage,
} from '../types';

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'assess-application',
    title: 'Assess a credit application',
    description: "Analyze an applicant's financial risk",
    icon: 'credit',
    defaultQuery: 'Assess the credit risk of Musanze Maize Cooperative for a seasonal working capital facility of RWF 75,000,000.',
  },
  {
    id: 'portfolio-risk',
    title: 'Analyze portfolio risk',
    description: 'Review current credit exposure',
    icon: 'chart',
    defaultQuery: 'Provide an analysis of the Q3 agricultural lending portfolio risk and exposure across cooperatives.',
  },
  {
    id: 'review-cooperative',
    title: 'Review a cooperative',
    description: 'Analyze cooperative creditworthiness',
    icon: 'cooperative',
    defaultQuery: 'Review the operational governance, off-take agreements, and creditworthiness of Kayonza Rice Farmers Union.',
  },
  {
    id: 'generate-report',
    title: 'Generate a risk report',
    description: 'Summarize credit risk findings',
    icon: 'report',
    defaultQuery: 'Generate a credit risk memorandum for the Nyagatare Dairy Cooperative facility renewal for the Credit Committee.',
  },
];

export const RECENT_ASSESSMENTS: AssessmentHistoryItem[] = [
  {
    id: 'rec-1',
    title: 'Musanze Maize Cooperative',
    category: 'Seasonal Crop Facility',
    date: 'Today, 09:20 AM',
    score: 742,
    riskLevel: 'Low Risk',
    preview: 'Assessed RWF 75M seasonal credit limit with 4.8% default probability.',
  },
  {
    id: 'rec-2',
    title: 'Nyagatare Dairy Credit Review',
    category: 'Livestock & Cold Chain',
    date: 'Yesterday',
    score: 680,
    riskLevel: 'Moderate Risk',
    preview: 'Milk yield variability mitigated by long-term processing off-take contracts.',
  },
  {
    id: 'rec-3',
    title: 'Kayonza Rice Farmers Union',
    category: 'Irrigated Cereal Facility',
    date: '28 Sep 2026',
    score: 795,
    riskLevel: 'Low Risk',
    preview: 'Strong cash flow, 98% member retention, zero historical loan delinquencies.',
  },
  {
    id: 'rec-4',
    title: 'Portfolio Risk Analysis Q3',
    category: 'Macro Exposure Review',
    date: '24 Sep 2026',
    preview: 'Portfolio NPL stable at 2.4% with total exposure at RWF 18.4 Billion.',
  },
  {
    id: 'rec-5',
    title: 'September BNR Credit Report',
    category: 'Regulatory Filing',
    date: '20 Sep 2026',
    preview: 'Central Bank prudential compliance audit and capital buffer analysis.',
  },
];

export const MUSANZE_MAIZE_ASSESSMENT: CreditAssessmentData = {
  applicantName: 'Musanze Maize Cooperative (COOPAMA)',
  applicantType: 'Agricultural Producer Cooperative · 1,420 Active Smallholders',
  location: 'Northern Province, Musanze District, Rwanda',
  score: 742,
  maxScore: 850,
  riskLevel: 'Low Risk',
  defaultProbability: '4.8%',
  recommendedCreditLimit: 'RWF 75,000,000',
  currency: 'RWF',
  keyFactors: [
    { text: 'Strong repayment history with 100% on-time settlement over past 4 seasons', type: 'positive' },
    { text: 'Stable seasonal cash flow supported by post-harvest aggregation storage', type: 'positive' },
    { text: 'Active guaranteed off-take contracts with Africa Improved Foods (AIF) & Minimex', type: 'positive' },
    { text: 'Manageable overall debt exposure with DSCR comfortably exceeding 2.4x', type: 'positive' },
    { text: 'Slight harvest yield sensitivity to unseasonal rainfall in highland plots', type: 'caution' },
  ],
  financialKpis: [
    { label: 'Debt Service Coverage (DSCR)', value: '2.42x', subtext: 'Benchmark: > 1.30x', status: 'positive' },
    { label: 'NDVI Satellite Crop Index', value: '0.84', subtext: 'Vegetation health optimal', status: 'positive' },
    { label: 'Warehouse Collateral Cover', value: '142%', subtext: 'RWF 106.5M stored stock', status: 'positive' },
    { label: 'Member Delivery Rate', value: '96.4%', subtext: 'Low side-selling leak', status: 'positive' },
  ],
  cashFlowSchedule: [
    { month: 'Oct 26', projectedRevenue: 18.5, operationalCost: 9.2, repaymentCapacity: 9.3, scheduledDebtService: 6.2 },
    { month: 'Nov 26', projectedRevenue: 24.0, operationalCost: 11.0, repaymentCapacity: 13.0, scheduledDebtService: 9.5 },
    { month: 'Dec 26', projectedRevenue: 42.5, operationalCost: 14.8, repaymentCapacity: 27.7, scheduledDebtService: 18.0 },
    { month: 'Jan 27', projectedRevenue: 58.0, operationalCost: 16.5, repaymentCapacity: 41.5, scheduledDebtService: 24.5 },
    { month: 'Feb 27', projectedRevenue: 35.0, operationalCost: 12.0, repaymentCapacity: 23.0, scheduledDebtService: 12.8 },
    { month: 'Mar 27', projectedRevenue: 21.0, operationalCost: 8.5, repaymentCapacity: 12.5, scheduledDebtService: 4.0 },
  ],
  riskBreakdown: [
    { category: 'Financial & Repayment Health', score: 88, level: 'Low Risk', notes: 'Audited accounts for FY2024 & FY2025; debt/equity ratio 0.42.' },
    { category: 'Agronomic & Climate Resilience', score: 79, level: 'Low Risk', notes: 'Sentinel-2 satellite imagery validates robust biomass across 680 hectares.' },
    { category: 'Governance & Management Quality', score: 84, level: 'Low Risk', notes: 'Elected board complies with RCA guidelines; computerized bookkeeping.' },
    { category: 'Market Off-Take Security', score: 92, level: 'Low Risk', notes: '90% of expected output bound under pre-agreed floor price contracts.' },
  ],
  approvalConditions: [
    'First ranking pledge over electronic warehouse receipts issued by EAX Musanze facility',
    'Direct tripartite payment settlement through off-taker account with Africa Improved Foods',
    'Maintain minimum cooperative reserve fund of RWF 12,000,000 throughout tenure',
    'Quarterly agronomic satellite monitoring updates prior to tranche disbursements',
  ],
};

export const NYAGATARE_DAIRY_ASSESSMENT: CreditAssessmentData = {
  applicantName: 'Nyagatare Dairy Farmers Union (KAZOO Dairy)',
  applicantType: 'Livestock Cooperative Union · 860 Dairy Farmers',
  location: 'Eastern Province, Nyagatare District, Rwanda',
  score: 680,
  maxScore: 850,
  riskLevel: 'Moderate Risk',
  defaultProbability: '8.4%',
  recommendedCreditLimit: 'RWF 45,000,000',
  currency: 'RWF',
  keyFactors: [
    { text: 'Consistent daily chilling volume (14,200 liters/day)', type: 'positive' },
    { text: 'Direct supply contract with Inyange Industries for 70% of collection', type: 'positive' },
    { text: 'Dry season fodder scarcity causes 18% seasonal milk output fluctuations', type: 'caution' },
    { text: 'Working capital constrained by pending receivables from regional distributors', type: 'caution' },
  ],
  financialKpis: [
    { label: 'Debt Service Coverage (DSCR)', value: '1.65x', subtext: 'Benchmark: > 1.30x', status: 'positive' },
    { label: 'Daily Collection Volume', value: '14.2k L', subtext: '+6.5% YoY growth', status: 'positive' },
    { label: 'Chiller Asset Utilization', value: '78%', subtext: 'Installed 20k L capacity', status: 'neutral' },
    { label: 'Overdue Receivables', value: '18.2%', subtext: 'Watchlist from trade buyers', status: 'caution' },
  ],
  cashFlowSchedule: [
    { month: 'Oct 26', projectedRevenue: 14.0, operationalCost: 9.5, repaymentCapacity: 4.5, scheduledDebtService: 3.5 },
    { month: 'Nov 26', projectedRevenue: 15.2, operationalCost: 9.8, repaymentCapacity: 5.4, scheduledDebtService: 3.5 },
    { month: 'Dec 26', projectedRevenue: 16.8, operationalCost: 10.2, repaymentCapacity: 6.6, scheduledDebtService: 3.5 },
    { month: 'Jan 27', projectedRevenue: 13.5, operationalCost: 9.0, repaymentCapacity: 4.5, scheduledDebtService: 3.5 },
    { month: 'Feb 27', projectedRevenue: 12.8, operationalCost: 8.9, repaymentCapacity: 3.9, scheduledDebtService: 3.5 },
    { month: 'Mar 27', projectedRevenue: 14.5, operationalCost: 9.4, repaymentCapacity: 5.1, scheduledDebtService: 3.5 },
  ],
  riskBreakdown: [
    { category: 'Financial & Repayment Health', score: 68, level: 'Moderate Risk', notes: 'Moderate leverage; working capital cycle stretched to 42 days.' },
    { category: 'Agronomic & Climate Resilience', score: 62, level: 'Moderate Risk', notes: 'Pasture degradation during prolonged dry spells requires silage reserves.' },
    { category: 'Governance & Management Quality', score: 74, level: 'Low Risk', notes: 'Experienced veterinary and collection team; clean audit report.' },
    { category: 'Market Off-Take Security', score: 85, level: 'Low Risk', notes: 'Strong institutional customer base anchored by Inyange.' },
  ],
  approvalConditions: [
    'Formal escrow account for milk sales proceeds with mandatory automated loan sweep',
    'Insurance coverage verification on 2 refrigerated transport trucks and cooling tanks',
    'Submission of monthly milk intake and rejection telemetry logs to bank portal',
  ],
};

export const KAYONZA_RICE_ASSESSMENT: CreditAssessmentData = {
  applicantName: 'Kayonza Rice Farmers Union (CORIKA)',
  applicantType: 'Irrigated Rice Cooperative · 2,150 Smallholders',
  location: 'Eastern Province, Kayonza Marshland Valley, Rwanda',
  score: 795,
  maxScore: 850,
  riskLevel: 'Low Risk',
  defaultProbability: '2.1%',
  recommendedCreditLimit: 'RWF 120,000,000',
  currency: 'RWF',
  keyFactors: [
    { text: 'Full marshland gravity irrigation infrastructure minimizes drought exposure', type: 'positive' },
    { text: 'Certified premium grade rice commanding 14% price premium in Kigali markets', type: 'positive' },
    { text: 'Flawless 5-year banking repayment track record across all lines', type: 'positive' },
    { text: 'Diversified institutional off-takers including MINALOC school feeding program', type: 'positive' },
  ],
  financialKpis: [
    { label: 'Debt Service Coverage (DSCR)', value: '3.18x', subtext: 'Superior debt servicing room', status: 'positive' },
    { label: 'Irrigated Hectare Yield', value: '5.8 MT/ha', subtext: '+22% above national avg', status: 'positive' },
    { label: 'Operating Profit Margin', value: '26.4%', subtext: 'Healthy cooperative reserve', status: 'positive' },
    { label: 'Farmer Retention Rate', value: '98.8%', subtext: 'High loyalty and stability', status: 'positive' },
  ],
  cashFlowSchedule: [
    { month: 'Oct 26', projectedRevenue: 28.0, operationalCost: 14.0, repaymentCapacity: 14.0, scheduledDebtService: 8.0 },
    { month: 'Nov 26', projectedRevenue: 32.0, operationalCost: 15.0, repaymentCapacity: 17.0, scheduledDebtService: 10.0 },
    { month: 'Dec 26', projectedRevenue: 65.0, operationalCost: 20.0, repaymentCapacity: 45.0, scheduledDebtService: 28.0 },
    { month: 'Jan 27', projectedRevenue: 85.0, operationalCost: 22.0, repaymentCapacity: 63.0, scheduledDebtService: 42.0 },
    { month: 'Feb 27', projectedRevenue: 40.0, operationalCost: 16.0, repaymentCapacity: 24.0, scheduledDebtService: 18.0 },
    { month: 'Mar 27', projectedRevenue: 25.0, operationalCost: 12.0, repaymentCapacity: 13.0, scheduledDebtService: 14.0 },
  ],
  riskBreakdown: [
    { category: 'Financial & Repayment Health', score: 94, level: 'Low Risk', notes: 'RWF 48M in unencumbered reserve fund; low leverage.' },
    { category: 'Agronomic & Climate Resilience', score: 88, level: 'Low Risk', notes: 'Canal irrigation system maintained by Rwanda Water Resources Board.' },
    { category: 'Governance & Management Quality', score: 91, level: 'Low Risk', notes: 'Tier-1 cooperative ranking by Rwanda Cooperative Agency (RCA).' },
    { category: 'Market Off-Take Security', score: 95, level: 'Low Risk', notes: 'Binding forward contracts covering 95% of expected harvest.' },
  ],
  approvalConditions: [
    'Pledge over paddy stock stored in licensed Kayonza cooperative silos',
    'Standard seasonal draw-down schedule tied to input procurement invoices',
  ],
};

export const PORTFOLIO_MOCK_DATA: PortfolioData = {
  totalExposure: 'RWF 18.45 Billion',
  totalLoans: 142,
  performingRate: '97.6%',
  nplRate: '2.4%',
  weightedCreditScore: 734,
  cooperativeCount: 88,
  regionalDistribution: [
    { region: 'Northern Province (Maize, Potato)', exposure: 'RWF 5.8B', percentage: 31.5 },
    { region: 'Eastern Province (Rice, Dairy, Cassava)', exposure: 'RWF 5.2B', percentage: 28.2 },
    { region: 'Western Province (Tea, Coffee)', exposure: 'RWF 4.4B', percentage: 23.8 },
    { region: 'Southern Province (Coffee, Horticulture)', exposure: 'RWF 3.05B', percentage: 16.5 },
  ],
  cropExposure: [
    { crop: 'Maize & Cereals', percentage: 36, riskRating: 'Low Risk' },
    { crop: 'Export Coffee & Tea', percentage: 28, riskRating: 'Low Risk' },
    { crop: 'Irrigated Rice', percentage: 18, riskRating: 'Very Low Risk' },
    { crop: 'Dairy & Cold Chain', percentage: 11, riskRating: 'Moderate Risk' },
    { crop: 'Horticulture & Tubers', percentage: 7, riskRating: 'Moderate Risk' },
  ],
};

export const RISK_REPORT_MOCK_DATA: ReportData = {
  reportTitle: 'Credit Committee Risk Assessment Memorandum',
  memoId: 'AC-MEMO-2026-09-084',
  targetApplicant: 'Nyagatare Dairy Farmers Union (KAZOO Dairy)',
  dateGenerated: '30 September 2026',
  executiveSummary:
    'AgriCredit AI has conducted a comprehensive assessment of the RWF 45,000,000 working capital line renewal for Nyagatare Dairy Farmers Union. The overall risk rating is categorized as MODERATE RISK (Credit Score 680/850). The facility is supported by confirmed commercial off-take agreements with Inyange Industries and satisfactory debt service coverage (1.65x DSCR). We recommend approval subject to strict cash escrow routing and seasonal fodder reserve covenants.',
  keyFindings: [
    'Repayment track record: 100% principal settled on prior cycle, with an average payment settlement latency of 3.8 days.',
    'Climate vulnerability: Eastern province rainfall deficit during July-August reduced chilling volumes by 14%, impacting peak cash flow.',
    'Collateral backing: Fixed cooling tanks, generators, and refrigerated transport assets valued at RWF 72M (160% collateral cover).',
    'RCA Compliance: Full compliance certificate granted with audited financials submitted on 15 August 2026.',
  ],
  sensitivityAnalysis: [
    { scenario: 'Severe Dry Season (-25% Milk Volume)', impact: 'DSCR declines to 1.24x', resilience: 'Viable with RWF 10M reserve buffer' },
    { scenario: 'Feed Cost Spike (+20% Fodder Price)', impact: 'Net margin tightens to 8.2%', resilience: 'Absorbable under existing retail milk floor pricing' },
    { scenario: 'Off-taker Payment Delay (60 Days)', impact: 'Temporary liquidity shortfall', resilience: 'Requires automated escrow sweep covenant' },
  ],
  regulatoryNotes:
    'Evaluated in accordance with National Bank of Rwanda (BNR) Prudential Guidelines on Agricultural Credit Risk (Regulation No. 04/2021). Risk-weighted assets allocation classified at standard performing Tier-2 agricultural risk weight (75%).',
};

// Sample documents that credit officers can attach or reference
export const SAMPLE_DOCUMENTS = [
  { name: 'Musanze_Coop_Audited_Financials_FY2025.xlsx', size: '2.4 MB', type: 'Financial Audit' },
  { name: 'Sentinel2_NDVI_Vegetation_Index_Q3.pdf', size: '4.8 MB', type: 'Agronomic Satellite Data' },
  { name: 'AIF_Commercial_Offtake_Agreement.pdf', size: '1.2 MB', type: 'Off-Take Contract' },
  { name: 'RCA_Cooperative_Compliance_Certificate.pdf', size: '840 KB', type: 'Regulatory Certificate' },
  { name: 'Warehouse_Receipt_Collateral_EAX.pdf', size: '1.1 MB', type: 'Warehouse Receipt' },
];
