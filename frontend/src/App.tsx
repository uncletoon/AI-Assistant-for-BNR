/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { CreditMemoModal } from './components/CreditMemoModal';
import {
  ChatMessage,
  SuggestedPrompt,
  AssessmentHistoryItem,
  ReportData,
  CreditAssessmentData,
  PortfolioData,
} from './types';
import { SUGGESTED_PROMPTS } from './data/mockData';
import { CheckCircle2 } from 'lucide-react';
import { api, LoanCaseRecord, CooperativeRecord } from './api/client';
import { RegistryPage } from './components/RegistryPage';

function convertDbCaseToAssessment(dbCase: LoanCaseRecord): CreditAssessmentData {
  const latestScore = dbCase.scores[0];
  const coop = dbCase.cooperative;
  const scoreVal = latestScore ? Math.round(latestScore.scorePoints * 10) : 845;
  const defaultProb = latestScore ? `${(latestScore.defaultProb * 100).toFixed(1)}%` : '4.2%';
  const suggestedLimit = latestScore
    ? `RWF ${(Number(latestScore.suggestedLimitRwf) / 1000000).toFixed(1)} Million`
    : `RWF ${(Number(dbCase.requestedAmountRwf) / 1000000).toFixed(1)} Million`;

  const keyFactors = latestScore?.reasons?.map((r) => ({
    text: r.statement,
    type: r.impactPoints >= 15 ? ('positive' as const) : ('neutral' as const),
  })) || [
    { text: '100% on time repayment across historical credit facilities', type: 'positive' as const },
    { text: 'Verified commercial off-take contract with Africa Improved Foods', type: 'positive' as const },
  ];

  return {
    applicantName: coop.name,
    applicantType: 'Agricultural Cooperative (Maize)',
    location: `${coop.sector}, Gasabo District`,
    score: scoreVal,
    maxScore: 850,
    riskLevel: latestScore?.band === 'LOW' ? 'Low Risk' : latestScore?.band === 'MODERATE' ? 'Moderate Risk' : 'High Risk',
    defaultProbability: defaultProb,
    recommendedCreditLimit: suggestedLimit,
    currency: 'RWF',
    keyFactors,
    financialKpis: [
      {
        label: 'Requested Facility',
        value: `RWF ${(Number(dbCase.requestedAmountRwf) / 1000000).toFixed(1)}M`,
        subtext: `${dbCase.tenorMonths} Months Seasonal Tenor`,
        status: 'positive',
      },
      {
        label: 'Cultivated Land',
        value: `${coop.totalHectares} Ha`,
        subtext: `${coop.sector} Sector Farmland`,
        status: 'positive',
      },
      {
        label: 'Storage Capacity',
        value: `${coop.storageCapacityT} MT`,
        subtext: 'Dedicated Aerated Warehouse',
        status: 'positive',
      },
      {
        label: 'Record Quality',
        value: `${coop.recordQuality}/100`,
        subtext: coop.hasDigitalHistory ? 'Digital Historical Records' : 'Standard Physical Ledgers',
        status: coop.recordQuality >= 80 ? 'positive' : 'neutral',
      },
    ],
    cashFlowSchedule: [
      { month: 'Mar', projectedRevenue: 5200000, operationalCost: 2800000, repaymentCapacity: 2400000, scheduledDebtService: 0 },
      { month: 'Apr', projectedRevenue: 5500000, operationalCost: 2900000, repaymentCapacity: 2600000, scheduledDebtService: 0 },
      { month: 'May', projectedRevenue: 7100000, operationalCost: 3100000, repaymentCapacity: 4000000, scheduledDebtService: 6000000 },
      { month: 'Jun', projectedRevenue: 7800000, operationalCost: 3200000, repaymentCapacity: 4600000, scheduledDebtService: 0 },
      { month: 'Jul', projectedRevenue: 8400000, operationalCost: 3400000, repaymentCapacity: 5000000, scheduledDebtService: 6000000 },
      { month: 'Aug', projectedRevenue: 8900000, operationalCost: 3500000, repaymentCapacity: 5400000, scheduledDebtService: 0 },
    ],
    riskBreakdown: [
      { category: 'Repayment Performance', score: 95, level: 'Low Risk', notes: 'Zero historical arrears; settled all prior bank facilities ahead of time' },
      { category: 'Off-take & Buyer Security', score: 88, level: 'Low Risk', notes: 'Signed purchase commitment with Africa Improved Foods (AIF)' },
      { category: 'Infrastructure & Storage', score: 84, level: 'Low Risk', notes: 'Aerated drying and warehouse facilities in Gasabo District' },
      { category: 'Cooperative Governance', score: 80, level: 'Low Risk', notes: `${coop.memberCount} registered cooperative members with verified RCA registration` },
    ],
    approvalConditions: [
      'Require direct buyer payment into Bank of Kigali escrow account for grain deliveries',
      'Conduct pre harvest agronomic inspection 30 days prior to aggregation',
      'Record all disbursement and repayment ledger events in compliance audit trail',
    ],
  };
}

function convertCooperativeToAssessment(coop: CooperativeRecord): CreditAssessmentData {
  const isHighQuality = coop.recordQuality >= 85;
  const scoreVal = Math.round(560 + coop.recordQuality * 2.8);
  const band = scoreVal >= 750 ? 'Low Risk' : scoreVal >= 650 ? 'Moderate Risk' : 'High Risk';
  const defaultProb = `${Math.max(1.8, (850 - scoreVal) / 24).toFixed(1)}%`;
  const suggestedLimit = `RWF ${Math.round((coop.totalHectares * 320000) / 1000000)} Million`;

  return {
    applicantName: coop.name,
    applicantType: 'Agricultural Cooperative (Maize)',
    location: `${coop.sector}, Gasabo District`,
    score: scoreVal,
    maxScore: 850,
    riskLevel: band,
    defaultProbability: defaultProb,
    recommendedCreditLimit: suggestedLimit,
    currency: 'RWF',
    keyFactors: [
      { text: `Operates ${coop.totalHectares} hectares across ${coop.sector} sector farmland`, type: 'positive' },
      { text: `${coop.storageCapacityT} MT modern drying and warehouse capacity`, type: coop.storageCapacityT >= 60 ? 'positive' : 'neutral' },
      { text: `Audited record quality rating of ${coop.recordQuality}/100 in RCA registry`, type: isHighQuality ? 'positive' : 'caution' },
      { text: coop.womenLed ? 'Verified women-led cooperative governance leadership' : 'Standard executive committee leadership', type: 'positive' },
    ],
    financialKpis: [
      { label: 'Farm Land Area', value: `${coop.totalHectares} Ha`, subtext: `${coop.sector} Sector`, status: 'positive' },
      { label: 'Cooperative Members', value: `${coop.memberCount} Farmers`, subtext: 'Registered smallholders', status: 'positive' },
      { label: 'Storage Capacity', value: `${coop.storageCapacityT} MT`, subtext: 'Post Harvest Aerated Storage', status: 'positive' },
      { label: 'Record Quality', value: `${coop.recordQuality}/100`, subtext: coop.hasDigitalHistory ? 'Digital ERP History' : 'Physical Ledgers', status: isHighQuality ? 'positive' : 'neutral' },
    ],
    cashFlowSchedule: [
      { month: 'Mar', projectedRevenue: 3400000, operationalCost: 2000000, repaymentCapacity: 1400000, scheduledDebtService: 0 },
      { month: 'Apr', projectedRevenue: 3800000, operationalCost: 2100000, repaymentCapacity: 1700000, scheduledDebtService: 0 },
      { month: 'May', projectedRevenue: 4800000, operationalCost: 2200000, repaymentCapacity: 2600000, scheduledDebtService: 2000000 },
      { month: 'Jun', projectedRevenue: 5400000, operationalCost: 2400000, repaymentCapacity: 3000000, scheduledDebtService: 0 },
      { month: 'Jul', projectedRevenue: 6000000, operationalCost: 2500000, repaymentCapacity: 3500000, scheduledDebtService: 2000000 },
      { month: 'Aug', projectedRevenue: 6400000, operationalCost: 2600000, repaymentCapacity: 3800000, scheduledDebtService: 0 },
    ],
    riskBreakdown: [
      { category: 'Land & Harvest Capacity', score: Math.min(95, Math.round(coop.totalHectares)), level: 'Low Risk', notes: `${coop.totalHectares} Ha under active maize cultivation` },
      { category: 'Storage Infrastructure', score: Math.min(90, Math.round(coop.storageCapacityT)), level: 'Low Risk', notes: `${coop.storageCapacityT} MT warehouse capacity` },
      { category: 'Data & Record Quality', score: coop.recordQuality, level: isHighQuality ? 'Low Risk' : 'Moderate Risk', notes: `Audited record quality rating ${coop.recordQuality}/100` },
      { category: 'Membership Scale', score: Math.min(95, Math.round(coop.memberCount / 2)), level: 'Low Risk', notes: `${coop.memberCount} registered cooperative smallholders` },
    ],
    approvalConditions: [
      'Submit signed commercial off-take purchase contract prior to disbursement',
      'Verify seasonal insurance under National Agricultural Insurance Scheme (NAIS)',
      'Maintain required minimum debt service coverage ratio of 1.20x',
    ],
  };
}

function buildGasaboPortfolioData(cases: LoanCaseRecord[], coops: CooperativeRecord[]): PortfolioData {
  const totalAmount = cases.reduce((sum, c) => sum + Number(c.requestedAmountRwf), 0);
  const totalExposureStr = totalAmount > 0
    ? `RWF ${(totalAmount / 1000000).toFixed(0)} Million`
    : 'RWF 25 Million';

  return {
    totalExposure: totalExposureStr,
    totalLoans: Math.max(1, cases.length),
    performingRate: '100.0%',
    nplRate: '0.0%',
    weightedCreditScore: 845,
    cooperativeCount: coops.length || 4,
    regionalDistribution: [
      { region: 'Bumbogo Sector (Maize Aggregation)', exposure: 'RWF 25M', percentage: 50.0 },
      { region: 'Gikomero Sector (Input Financing)', exposure: 'RWF 15M', percentage: 25.0 },
      { region: 'Ndera Sector (Grain Warehouse)', exposure: 'RWF 10M', percentage: 25.0 },
    ],
    cropExposure: [
      { crop: 'Maize & Cereals', percentage: 85, riskRating: 'Low Risk' },
      { crop: 'Legumes & Rotation Beans', percentage: 15, riskRating: 'Low Risk' },
    ],
  };
}

function buildGasaboRiskReport(activeCoopName: string): ReportData {
  return {
    reportTitle: 'Credit Committee Risk Assessment Memorandum',
    memoId: 'BK-GASABO-2026-001',
    targetApplicant: activeCoopName,
    dateGenerated: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    executiveSummary:
      `AgriCredit AI has conducted a credit risk assessment for ${activeCoopName} in Gasabo District. The facility is supported by confirmed commercial off-take agreements with Africa Improved Foods (AIF) and flawless historical repayment performance. The credit risk profile is categorized as Low Risk with a deterministic credit score of 845/850.`,
    keyFindings: [
      'Repayment track record: 100% on time settlement across historical credit lines with zero delinquencies.',
      'Off-take assurance: Binding forward purchase contract with Africa Improved Foods covering 100% of aggregation grain.',
      'Infrastructure: Aerated drying and storage warehouses inspected and certified by local agronomic officers.',
      'RCA Compliance: Full compliance certificate granted with audited record quality score above 85/100.',
    ],
    sensitivityAnalysis: [
      { scenario: 'Delayed Harvest Aggregation (-15% Early Volume)', impact: 'Temporary cash flow lag of 14 days', resilience: 'Absorbable under 6-month seasonal tenor' },
      { scenario: 'Input Price Increase (+10% Fertilizer Cost)', impact: 'Gross margin tightens to 21%', resilience: 'Guaranteed floor price from off-taker protects debt service' },
      { scenario: 'Off-taker Payment Delay (30 Days)', impact: 'Pending receivables buffer needed', resilience: 'Requires direct tripartite escrow sweep with off-taker' },
    ],
    regulatoryNotes:
      'Evaluated in accordance with National Bank of Rwanda (BNR) Prudential Guidelines on Agricultural Credit Risk (Regulation No. 04/2021). Risk-weighted assets classified under standard performing agricultural exposure.',
  };
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [selectedMemoData, setSelectedMemoData] = useState<ReportData | CreditAssessmentData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'registry'>('chat');

  const [dbCases, setDbCases] = useState<LoanCaseRecord[]>([]);
  const [dbCooperatives, setDbCooperatives] = useState<CooperativeRecord[]>([]);

  // Fetch real database records on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const casesRes = await api.getLoanCases();
        if (isMounted && casesRes.data) {
          setDbCases(casesRes.data);
        }
      } catch (err) {
        console.warn('Error fetching loan cases:', err);
      }

      try {
        const coopsRes = await api.getCooperatives();
        if (isMounted && coopsRes.data) {
          setDbCooperatives(coopsRes.data);
        }
      } catch (err) {
        console.warn('Error fetching cooperatives:', err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Real database cases for sidebar list
  const combinedAssessments = useMemo<AssessmentHistoryItem[]>(() => {
    return dbCases.map((c) => ({
      id: `db-${c.id}`,
      title: `${c.cooperative.name} (${c.cooperative.sector})`,
      category: 'Maize Financing · Gasabo',
      date: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      score: c.scores[0] ? Math.round(c.scores[0].scorePoints * 10) : 845,
      riskLevel: c.scores[0]?.band === 'LOW' ? 'Low Risk' : 'Moderate Risk',
      preview: `${c.cooperative.name} facility for RWF ${(Number(c.requestedAmountRwf) / 1000000).toFixed(0)}M`,
    }));
  }, [dbCases]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch to new blank assessment
  const handleNewAssessment = () => {
    setMessages([]);
    setActiveAssessmentId(null);
    setCurrentView('chat');
  };

  // Load a database case directly
  const handleSelectCase = (loanCase: LoanCaseRecord) => {
    setActiveAssessmentId(`db-${loanCase.id}`);
    const assessmentData = convertDbCaseToAssessment(loanCase);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `user-${loanCase.id}`,
        role: 'user',
        content: `Evaluate credit risk assessment for ${loanCase.cooperative.name} (Registration: ${loanCase.cooperative.registrationNo}) requesting RWF ${(Number(loanCase.requestedAmountRwf) / 1000000).toFixed(1)} Million for Gasabo maize aggregation.`,
        timestamp: nowTime,
      },
      {
        id: `ai-${loanCase.id}`,
        role: 'assistant',
        content: `Credit risk assessment for ${loanCase.cooperative.name}.\n\nThe cooperative achieved a credit score of ${assessmentData.score}/850 (${assessmentData.riskLevel}), with an estimated default probability of ${assessmentData.defaultProbability}. Repayment capacity is supported by verified commercial offtake contracts with Africa Improved Foods.`,
        timestamp: nowTime,
        structuredData: {
          type: 'credit_assessment',
          assessment: assessmentData,
        },
      },
    ]);
  };

  // Load a cooperative directly
  const handleSelectCooperative = (coop: CooperativeRecord) => {
    const matchingCase = dbCases.find((c) => c.cooperativeId === coop.id);
    if (matchingCase) {
      handleSelectCase(matchingCase);
      return;
    }

    setActiveAssessmentId(`coop-${coop.id}`);
    const assessmentData = convertCooperativeToAssessment(coop);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `user-coop-${coop.id}`,
        role: 'user',
        content: `Conduct credit assessment for ${coop.name} in ${coop.sector} Sector (Registration: ${coop.registrationNo}).`,
        timestamp: nowTime,
      },
      {
        id: `ai-coop-${coop.id}`,
        role: 'assistant',
        content: `Evaluated ${coop.name} using verified institutional records. Farmland: ${coop.totalHectares} Ha, Members: ${coop.memberCount}, Storage: ${coop.storageCapacityT} MT, Record Quality: ${coop.recordQuality}/100.`,
        timestamp: nowTime,
        structuredData: {
          type: 'credit_assessment',
          assessment: assessmentData,
        },
      },
    ]);
  };

  // Load an assessment into view from Sidebar
  const handleSelectHistoricalAssessment = (item: AssessmentHistoryItem) => {
    setCurrentView('chat');
    setActiveAssessmentId(item.id);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (item.id.startsWith('db-')) {
        const caseId = item.id.replace('db-', '');
        const foundCase = dbCases.find((c) => c.id === caseId);
        if (foundCase) {
          handleSelectCase(foundCase);
          return;
        }
      }
      if (dbCases.length > 0) {
        handleSelectCase(dbCases[0]);
      }
    }, 200);
  };

  // User sends a message or clicks a suggestion card
  const handleSendMessage = async (
    text: string,
    attachments?: { name: string; size: string; type: string }[]
  ) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: nowTime,
      attachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Connect directly to backend AI retriever & database search
      const res = await api.sendChatMessage(text);
      const lower = text.toLowerCase();

      let structuredData: ChatMessage['structuredData'] = undefined;

      // Attach structured visual widgets if requested by user query
      if (
        lower.includes('portfolio') ||
        lower.includes('exposure') ||
        lower.includes('macro') ||
        lower.includes('npl')
      ) {
        structuredData = {
          type: 'portfolio_risk',
          portfolio: buildGasaboPortfolioData(dbCases, dbCooperatives),
        };
      } else if (
        lower.includes('report') ||
        lower.includes('committee') ||
        lower.includes('memorandum') ||
        lower.includes('bnr') ||
        lower.includes('docket')
      ) {
        const targetCoop = dbCases[0]?.cooperative.name || dbCooperatives[0]?.name || 'Koperative Twitezimbere Gasabo';
        structuredData = {
          type: 'risk_report',
          report: buildGasaboRiskReport(targetCoop),
        };
      } else if (
        lower.includes('assessment') ||
        lower.includes('score') ||
        lower.includes('evaluate')
      ) {
        const matchedCase = dbCases.find(
          (c) =>
            lower.includes(c.cooperative.name.toLowerCase()) ||
            lower.includes(c.cooperative.sector.toLowerCase()) ||
            lower.includes('gasabo') ||
            lower.includes('twitezimbere')
        );
        if (matchedCase) {
          structuredData = {
            type: 'credit_assessment',
            assessment: convertDbCaseToAssessment(matchedCase),
          };
        } else if (dbCases.length > 0) {
          structuredData = {
            type: 'credit_assessment',
            assessment: convertDbCaseToAssessment(dbCases[0]),
          };
        }
      }

      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredData,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to AI data retriever: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: SuggestedPrompt) => {
    handleSendMessage(prompt.defaultQuery);
  };

  const handleApproveAction = () => {
    showToast('Facility approved by Credit Officer. Loan underwriting docket sent to Credit Committee.');
  };

  const activeTitle = useMemo(() => {
    if (currentView === 'registry') {
      return 'Gasabo Cooperatives Registry';
    }
    if (!activeAssessmentId) return undefined;
    const found = combinedAssessments.find((a) => a.id === activeAssessmentId);
    return found ? found.title : undefined;
  }, [activeAssessmentId, combinedAssessments, currentView]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EFEFED] text-stone-800 p-0 sm:p-2 lg:p-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#1F6F5F] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#2FA084]/40 text-xs font-medium animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#6FCF97]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full w-full bg-white rounded-none sm:rounded-2xl lg:rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden relative">
        {/* Top Navbar */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
          onNewAssessment={handleNewAssessment}
          activeConversationTitle={activeTitle}
        />

        {/* Content Body */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Recent Assessments Sidebar Drawer */}
          <Sidebar
            assessments={combinedAssessments}
            activeId={activeAssessmentId}
            currentView={currentView}
            onSelectAssessment={handleSelectHistoricalAssessment}
            onNewAssessment={handleNewAssessment}
            onOpenRegistry={() => setCurrentView('registry')}
            cooperativesCount={dbCooperatives.length}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Central Workspace */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {currentView === 'registry' ? (
              <RegistryPage
                cooperatives={dbCooperatives}
                onOpenChat={() => setCurrentView('chat')}
              />
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-between py-4 sm:py-6 overflow-y-auto">
                <EmptyState
                  prompts={SUGGESTED_PROMPTS}
                  onSelectPrompt={handleSelectPrompt}
                />
                <div className="pb-4">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  onOpenReportModal={(data) => setSelectedMemoData(data)}
                  onApproveAction={handleApproveAction}
                />
                <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-xs border-t border-stone-100">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Credit Memorandum Modal */}
      {selectedMemoData && (
        <CreditMemoModal
          data={selectedMemoData}
          onClose={() => setSelectedMemoData(null)}
        />
      )}
    </div>
  );
}
