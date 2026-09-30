import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  FileText,
  FileCheck2,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  StructuredAiData,
  CreditAssessmentData,
  PortfolioData,
  ReportData,
} from '../types';

interface AiMessageRendererProps {
  content: string;
  structuredData?: StructuredAiData;
  onOpenReportModal?: (report: ReportData | CreditAssessmentData) => void;
  onApproveAction?: (applicant: string) => void;
}

export const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({
  content,
  structuredData,
  onOpenReportModal,
  onApproveAction,
}) => {
  const [approvedState, setApprovedState] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow' | 'risk'>('overview');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const handleApprove = (applicant: string) => {
    setApprovedState(true);
    if (onApproveAction) {
      onApproveAction(applicant);
    }
  };

  return (
    <div className="space-y-4 text-stone-800 text-sm leading-relaxed max-w-3xl">
      {/* Intro Prose Text */}
      <div className="whitespace-pre-line text-stone-800 font-normal">
        {content}
      </div>

      {/* Credit Assessment Structured View */}
      {structuredData?.type === 'credit_assessment' && structuredData.assessment && (
        <div className="mt-4 space-y-4">
          {/* Top Score & Summary Banner */}
          <div className="bg-gradient-to-br from-white to-stone-50 border border-stone-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900 text-base">
                    {structuredData.assessment.applicantName}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {structuredData.assessment.applicantType} · {structuredData.assessment.location}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenReportModal && onOpenReportModal(structuredData.assessment!)}
                  className="px-3 py-1.5 text-xs font-medium text-[#1F6F5F] bg-[#6FCF97]/20 hover:bg-[#6FCF97]/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Credit Memo</span>
                </button>
              </div>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {/* Card 1: Credit Score */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-stone-400 block uppercase tracking-wider">
                  Credit Score
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#1F6F5F] font-mono tabular-nums">
                    {structuredData.assessment.score}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    /{structuredData.assessment.maxScore}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2FA084]" />
                  <span className="text-[11px] font-semibold text-[#1F6F5F]">
                    {structuredData.assessment.riskLevel}
                  </span>
                </div>
              </div>

              {/* Card 2: Risk Level */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
                <span className="text-[11px] font-medium text-stone-400 block uppercase tracking-wider">
                  Default Probability
                </span>
                <div className="text-2xl font-bold text-stone-800 font-mono tabular-nums mt-1">
                  {structuredData.assessment.defaultProbability}
                </div>
                <p className="text-[11px] text-[#2FA084] font-medium mt-1.5">
                  Well below 8.0% threshold
                </p>
              </div>

              {/* Card 3: Recommended Limit */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs col-span-2 sm:col-span-2">
                <span className="text-[11px] font-medium text-stone-400 block uppercase tracking-wider">
                  Recommended Limit
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#1F6F5F] font-mono tabular-nums mt-1">
                  {structuredData.assessment.recommendedCreditLimit}
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  100% covered by warehoused maize collateral & contracts
                </p>
              </div>
            </div>

            {/* Key Factors */}
            <div className="mt-4 pt-4 border-t border-stone-100">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2.5">
                Key Assessment Factors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {structuredData.assessment.keyFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-stone-700 bg-white/80 p-2.5 rounded-lg border border-stone-100"
                  >
                    {factor.type === 'positive' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2FA084] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span>{factor.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs for Depth */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl border border-stone-200/60 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#1F6F5F] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Financial & Agronomic KPIs
            </button>
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
                activeTab === 'cashflow'
                  ? 'bg-white text-[#1F6F5F] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Seasonal Cash Flow Schedule
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
                activeTab === 'risk'
                  ? 'bg-white text-[#1F6F5F] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Risk Pillar Breakdown
            </button>
          </div>

          {/* TAB 1: Financial & Agronomic KPIs */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {structuredData.assessment.financialKpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-stone-200/70 shadow-2xs"
                >
                  <p className="text-[11px] text-stone-500 line-clamp-1">{kpi.label}</p>
                  <p className="text-lg font-bold text-stone-900 font-mono mt-1">
                    {kpi.value}
                  </p>
                  <p className="text-[10px] text-[#1F6F5F] font-medium mt-0.5">
                    {kpi.subtext}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Seasonal Cash Flow Chart */}
          {activeTab === 'cashflow' && (
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-semibold text-stone-800">
                    Monthly Cash Flow vs Scheduled Debt Repayment (RWF Millions)
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Harvest aggregation, sales realization & debt amortisation
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-stone-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2FA084]" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-stone-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#1F6F5F]" /> Debt Service
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-stone-100">
                {structuredData.assessment.cashFlowSchedule.map((pt, i) => {
                  const maxVal = 60; // scale
                  const revHeight = Math.min(100, (pt.projectedRevenue / maxVal) * 100);
                  const debtHeight = Math.min(100, (pt.scheduledDebtService / maxVal) * 100);
                  const isHovered = hoveredMonth === i;

                  return (
                    <div
                      key={pt.month}
                      onMouseEnter={() => setHoveredMonth(i)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-stone-900 text-white text-[10px] px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap">
                          <div>Rev: RWF {pt.projectedRevenue}M</div>
                          <div>Debt: RWF {pt.scheduledDebtService}M</div>
                        </div>
                      )}

                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-1/2 max-w-[16px] bg-[#2FA084] rounded-t-xs transition-all group-hover:bg-[#25876f]"
                        />
                        <div
                          style={{ height: `${debtHeight}%` }}
                          className="w-1/2 max-w-[16px] bg-[#1F6F5F] rounded-t-xs transition-all group-hover:bg-[#154e42]"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 mt-2">
                        {pt.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-[#2FA084]" />
                  Peak debt coverage occurs in Dec-Jan during harvest sales
                </span>
                <span className="font-mono text-[11px] text-[#1F6F5F]">Min Coverage: 1.5x</span>
              </div>
            </div>
          )}

          {/* TAB 3: Risk Breakdown */}
          {activeTab === 'risk' && (
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold text-stone-800">
                Risk Pillar Scores & Safeguards
              </h4>
              <div className="space-y-3">
                {structuredData.assessment.riskBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#1F6F5F]">
                          {item.score}/100
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          {item.level}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.score}%` }}
                        className="bg-[#2FA084] h-full rounded-full"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officer Approval Actions Bar */}
          <div className="bg-[#1F6F5F]/5 border border-[#1F6F5F]/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-[#2FA084] shrink-0" />
              <span>
                Recommended for approval with <strong>{structuredData.assessment.recommendedCreditLimit}</strong> under standard warehouse receipt covenants.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {approvedState ? (
                <div className="px-3.5 py-1.5 bg-[#2FA084] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Approved for Docket</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApprove(structuredData.assessment!.applicantName)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-[#2FA084] hover:bg-[#25876f] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  Approve Application
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenReportModal && onOpenReportModal(structuredData.assessment!)}
                className="w-full sm:w-auto px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span>Export Memo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Risk Structured View */}
      {structuredData?.type === 'portfolio_risk' && structuredData.portfolio && (
        <div className="mt-4 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Agricultural Lending Portfolio Risk (Q3 Assessment)
                </h3>
                <p className="text-xs text-stone-400">
                  Total cooperative loans tracked under BNR prudential criteria
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#6FCF97]/20 text-[#1F6F5F]">
                97.6% Performing
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 block">Total Exposure</span>
                <span className="text-lg font-bold text-[#1F6F5F] font-mono">
                  {structuredData.portfolio.totalExposure}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  142 active facilities
                </span>
              </div>
              <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 block">Non-Performing (NPL)</span>
                <span className="text-lg font-bold text-[#2FA084] font-mono">
                  {structuredData.portfolio.nplRate}
                </span>
                <span className="text-[10px] text-[#1F6F5F] block mt-0.5 font-medium">
                  BNR limit &lt; 5.0%
                </span>
              </div>
              <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 block">Weighted Avg Score</span>
                <span className="text-lg font-bold text-stone-800 font-mono">
                  {structuredData.portfolio.weightedCreditScore}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Category: Low Risk
                </span>
              </div>
              <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 block">Co-ops Monitored</span>
                <span className="text-lg font-bold text-stone-800 font-mono">
                  {structuredData.portfolio.cooperativeCount}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Across 30 districts
                </span>
              </div>
            </div>

            {/* Regional and Crop breakdown */}
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-stone-700 mb-2">
                  Regional Exposure Distribution
                </h4>
                <div className="space-y-2">
                  {structuredData.portfolio.regionalDistribution.map((reg) => (
                    <div key={reg.region} className="text-xs space-y-1">
                      <div className="flex justify-between text-stone-600">
                        <span className="truncate pr-2">{reg.region}</span>
                        <span className="font-mono text-stone-900 font-medium">
                          {reg.exposure} ({reg.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${reg.percentage * 2}%` }}
                          className="bg-[#2FA084] h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-stone-700 mb-2">
                  Commodity Concentration
                </h4>
                <div className="space-y-2">
                  {structuredData.portfolio.cropExposure.map((crop) => (
                    <div
                      key={crop.crop}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50/70 border border-stone-200/50 text-xs"
                    >
                      <span className="font-medium text-stone-800">{crop.crop}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-stone-600">{crop.percentage}%</span>
                        <span className="text-[10px] text-[#1F6F5F] font-semibold bg-[#6FCF97]/20 px-1.5 py-0.5 rounded">
                          {crop.riskRating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Report Structured View */}
      {structuredData?.type === 'risk_report' && structuredData.report && (
        <div className="mt-4 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1F6F5F]" />
                <h3 className="font-semibold text-stone-900 text-sm">
                  {structuredData.report.reportTitle}
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Docket: {structuredData.report.memoId} · Prepared for Credit Committee
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenReportModal && onOpenReportModal(structuredData.report!)}
              className="px-3 py-1.5 text-xs font-medium text-[#1F6F5F] bg-[#6FCF97]/25 hover:bg-[#6FCF97]/40 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Memorandum</span>
            </button>
          </div>

          <div className="text-xs text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 leading-relaxed">
            <span className="font-semibold text-stone-900 block mb-1">
              Executive Assessment
            </span>
            {structuredData.report.executiveSummary}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-stone-700 mb-2">
              Key Committee Findings
            </h4>
            <div className="space-y-1.5">
              {structuredData.report.keyFindings.map((finding, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2FA084] shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-stone-700 mb-2">
              Stress & Sensitivity Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {structuredData.report.sensitivityAnalysis.map((sen, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 text-xs"
                >
                  <p className="font-semibold text-stone-800">{sen.scenario}</p>
                  <p className="text-[11px] text-amber-700 mt-1">{sen.impact}</p>
                  <p className="text-[10px] text-stone-500 mt-1 pt-1 border-t border-stone-200/50">
                    {sen.resilience}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-[#1F6F5F]/5 border border-[#1F6F5F]/15 rounded-xl text-[11px] text-stone-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2FA084] shrink-0" />
            <span>{structuredData.report.regulatoryNotes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
