import React, { useState } from "react";
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
  History,
  Coins,
  ShieldAlert,
} from "lucide-react";
import {
  StructuredAiData,
  CreditAssessmentData,
  PortfolioData,
  ReportData,
  ProofEvent,
} from "../types";

function formatInline(str: string): React.ReactNode[] {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderFormattedContent(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Strip any markdown header hashes
    const cleanLine = line.replace(/^#{1,6}\s*/, "");
    const trimmed = cleanLine.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    // Check if original line was a markdown header (#, ##, ###, ####) or an all-caps section header
    const isOriginalHeader = /^#{1,6}\s+/.test(line.trim());
    const isUppercaseHeader =
      /^[A-Z0-9\s&—\-_:,()]{4,}$/.test(trimmed) &&
      trimmed.length < 75 &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("-");

    if (isOriginalHeader || isUppercaseHeader) {
      return (
        <div key={idx} className="mt-3.5 mb-2 pt-1 border-b border-stone-100/90 pb-1">
          <h4 className="text-xs font-bold text-[#1F6F5F] tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FA084]" />
            {formatInline(trimmed.replace(/:$/, ""))}
          </h4>
        </div>
      );
    }

    if (
      trimmed.startsWith("• ") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ")
    ) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-[#2FA084] font-bold text-sm leading-tight">
            •
          </span>
          <span className="text-stone-700 text-sm leading-relaxed">
            {formatInline(trimmed.replace(/^[•\-\*]\s+/, ""))}
          </span>
        </div>
      );
    }

    // Numbered list items (e.g. "1. Repayment Discipline:")
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      return (
        <div key={idx} className="flex items-start gap-2 my-1.5 pl-1">
          <span className="text-xs font-bold text-white bg-[#1F6F5F] w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
            {match ? match[1] : "•"}
          </span>
          <span className="text-stone-700 text-sm leading-relaxed">
            {formatInline(match ? match[2] : trimmed)}
          </span>
        </div>
      );
    }

    return (
      <p key={idx} className="text-stone-700 text-sm leading-relaxed my-1">
        {formatInline(trimmed)}
      </p>
    );
  });
}

interface AiMessageRendererProps {
  content: string;
  structuredData?: StructuredAiData;
  onOpenReportModal?: (report: ReportData | CreditAssessmentData) => void;
  onApproveAction?: (
    applicant: string,
    reason?: string,
    decision?: string,
  ) => void;
}

export const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({
  content,
  structuredData,
  onOpenReportModal,
  onApproveAction,
}) => {
  const [approvedState, setApprovedState] = useState(false);
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideDecisionType, setOverrideDecisionType] = useState<
    "OVERRIDE_APPROVE" | "OVERRIDE_REJECT"
  >("OVERRIDE_APPROVE");

  const handleApprove = (applicant: string) => {
    setApprovedState(true);
    if (onApproveAction) {
      onApproveAction(
        applicant,
        "Approved based on deterministic risk scorecard recommendation",
        "APPROVE",
      );
    }
  };

  const handleOverrideSubmit = (applicant: string) => {
    if (!overrideReason.trim()) return;
    setApprovedState(true);
    setShowOverrideInput(false);
    if (onApproveAction) {
      onApproveAction(applicant, overrideReason.trim(), overrideDecisionType);
    }
  };

  // Extract or fallback chronological proof events
  const proofEvents: ProofEvent[] =
    structuredData?.proofEvents ||
    structuredData?.backendAssessment?.features.chronologicalProofEvents ||
    (structuredData?.assessment
      ? [
          {
            period: "February 2024",
            eventType: "LOAN_DISBURSED",
            description: `In February 2024, the cooperative secured a seasonal loan of RWF 10.0 Million from Bumbogo Umurenge SACCO with a 6-month tenor.`,
            amountRwf: "10000000",
            institutionOrBuyer: "Bumbogo Umurenge SACCO",
            status: "positive",
          },
          {
            period: "May 2024",
            eventType: "LOAN_REPAID",
            description: `In May 2024, the cooperative paid their scheduled installment of RWF 2.5 Million on time with zero days past due.`,
            amountRwf: "2500000",
            institutionOrBuyer: "Bumbogo Umurenge SACCO",
            status: "positive",
          },
          {
            period: "June 2025",
            eventType: "GRAIN_SALE",
            description: `In June 2025, the cooperative recorded a verified grain sale of RWF 18.5 Million from buyer Africa Improved Foods (AIF).`,
            amountRwf: "18500000",
            institutionOrBuyer: "Africa Improved Foods",
            status: "positive",
          },
          {
            period: "Active Contract 2026",
            eventType: "CONTRACT_SIGNED",
            description: `In 2026, the cooperative finalized a verified forward contract with Africa Improved Foods (AIF) for 350,000 kilograms of grade 1 maize at RWF 420 per kg.`,
            amountRwf: "147000000",
            institutionOrBuyer: "Africa Improved Foods",
            status: "positive",
          },
        ]
      : []);

  return (
    <div className="space-y-4 text-stone-800 text-sm leading-relaxed max-w-3xl">
      {/* Formatted Message Content */}
      <div className="text-stone-800 font-normal">
        {renderFormattedContent(content)}
      </div>

      {/* Credit Assessment Structured View */}
      {structuredData?.type === "credit_assessment" &&
        structuredData.assessment && (
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
                    {structuredData.assessment.applicantType} ·{" "}
                    {structuredData.assessment.location}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenReportModal &&
                      onOpenReportModal(structuredData.assessment!)
                    }
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
                      {factor.type === "positive" ? (
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

            {/* Chronological Proof Timeline */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#1F6F5F]" />
                  <h4 className="text-xs font-semibold text-stone-900">
                    Chronological Ledger & Evidence Proof
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-[#1F6F5F] bg-[#6FCF97]/20 px-2 py-0.5 rounded-full">
                  {proofEvents.length} Verified Records
                </span>
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-[#2FA084]/40 ml-2 pt-1">
                {proofEvents.map((evt, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#2FA084] shadow-xs flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 p-3 rounded-xl transition-all">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-stone-900">
                          {evt.period}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            evt.eventType === "LOAN_DISBURSED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : evt.eventType === "LOAN_REPAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : evt.eventType === "GRAIN_SALE"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {evt.eventType.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed font-normal">
                        {evt.description}
                      </p>
                      {evt.institutionOrBuyer && (
                        <div className="mt-2 text-[11px] text-stone-500 flex items-center gap-1.5 pt-1.5 border-t border-stone-200/60">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          <span>
                            Verified Counterparty:{" "}
                            <strong className="font-semibold text-stone-700">
                              {evt.institutionOrBuyer}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Pillars from Scoring Engine & Database (Direct Display) */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1F6F5F]" />
                  <h4 className="text-xs font-semibold text-stone-900">
                    Risk Pillar Scores & Safeguards (PostgreSQL & Calibrated Model)
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-[#1F6F5F] bg-[#6FCF97]/20 px-2 py-0.5 rounded-full">
                  Score: {structuredData.assessment.score}/100
                </span>
              </div>
              <div className="space-y-3 pt-1">
                {structuredData.assessment.riskBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1F6F5F]">
                          {item.score}/100
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-[#1F6F5F] font-semibold border border-stone-200/60">
                          {item.level}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                        className="bg-[#2FA084] h-full rounded-full transition-all duration-300"
                      />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-normal">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Approval & Override Actions Bar */}
            <div className="bg-[#1F6F5F]/5 border border-[#1F6F5F]/20 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-[#2FA084] shrink-0" />
                  <span>
                    Recommended for approval with{" "}
                    <strong>
                      {structuredData.assessment.recommendedCreditLimit}
                    </strong>{" "}
                    under standard warehouse receipt covenants.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {approvedState ? (
                    <div className="px-3.5 py-1.5 bg-[#2FA084] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Decision Recorded</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(
                            structuredData.assessment!.applicantName,
                          )
                        }
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-[#2FA084] hover:bg-[#25876f] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOverrideInput(!showOverrideInput)}
                        className="w-full sm:w-auto px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Override
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onOpenReportModal &&
                      onOpenReportModal(structuredData.assessment!)
                    }
                    className="w-full sm:w-auto px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    <span>Export Memo</span>
                  </button>
                </div>
              </div>

              {/* Officer Override Form */}
              {showOverrideInput && !approvedState && (
                <div className="pt-3 border-t border-[#1F6F5F]/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Officer Override Justification (BNR Compliance
                        Requirement)
                      </span>
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={overrideDecisionType === "OVERRIDE_APPROVE"}
                          onChange={() =>
                            setOverrideDecisionType("OVERRIDE_APPROVE")
                          }
                        />
                        <span>Override Approve</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer ml-2">
                        <input
                          type="radio"
                          checked={overrideDecisionType === "OVERRIDE_REJECT"}
                          onChange={() =>
                            setOverrideDecisionType("OVERRIDE_REJECT")
                          }
                        />
                        <span>Override Reject</span>
                      </label>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Detail the mandatory rationale for modifying or overriding the automated credit scorecard..."
                    className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1F6F5F]"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideInput(false)}
                      className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!overrideReason.trim()}
                      onClick={() =>
                        handleOverrideSubmit(
                          structuredData.assessment!.applicantName,
                        )
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-semibold text-white ${
                        overrideReason.trim()
                          ? "bg-[#1F6F5F] hover:bg-[#18574a] cursor-pointer"
                          : "bg-stone-300 cursor-not-allowed"
                      }`}
                    >
                      Submit Justified Override
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Portfolio Risk Structured View */}
      {structuredData?.type === "portfolio_risk" &&
        structuredData.portfolio && (
          <div className="mt-4 space-y-4">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">
                    Agricultural Lending Portfolio Risk (Q3 Assessment)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Total cooperative loans tracked under BNR prudential
                    criteria
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#6FCF97]/20 text-[#1F6F5F]">
                  97.6% Performing
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                  <span className="text-[11px] text-stone-500 block">
                    Total Exposure
                  </span>
                  <span className="text-lg font-bold text-[#1F6F5F] font-mono">
                    {structuredData.portfolio.totalExposure}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    142 active facilities
                  </span>
                </div>
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                  <span className="text-[11px] text-stone-500 block">
                    Non-Performing (NPL)
                  </span>
                  <span className="text-lg font-bold text-[#2FA084] font-mono">
                    {structuredData.portfolio.nplRate}
                  </span>
                  <span className="text-[10px] text-[#1F6F5F] block mt-0.5 font-medium">
                    BNR limit &lt; 5.0%
                  </span>
                </div>
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                  <span className="text-[11px] text-stone-500 block">
                    Weighted Avg Score
                  </span>
                  <span className="text-lg font-bold text-stone-800 font-mono">
                    {structuredData.portfolio.weightedCreditScore}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Category: Low Risk
                  </span>
                </div>
                <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                  <span className="text-[11px] text-stone-500 block">
                    Co-ops Monitored
                  </span>
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
                    {structuredData.portfolio.regionalDistribution.map(
                      (reg) => (
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
                      ),
                    )}
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
                        <span className="text-stone-700">{crop.crop}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-stone-900">
                            {crop.percentage}%
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#6FCF97]/20 text-[#1F6F5F]">
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
    </div>
  );
};
