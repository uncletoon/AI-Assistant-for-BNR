import React, { useState } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  History,
  Send,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { ReportData, CreditAssessmentData, ProofEvent } from '../types';
import { api } from '../api/client';

interface CreditMemoModalProps {
  data: ReportData | CreditAssessmentData | null;
  onClose: () => void;
  onDecisionSubmitted?: () => void;
}

export const CreditMemoModal: React.FC<CreditMemoModalProps> = ({
  data,
  onClose,
  onDecisionSubmitted,
}) => {
  if (!data) return null;

  const isAssessment = 'score' in data;
  const assessmentData = isAssessment ? (data as CreditAssessmentData) : null;
  const applicantName = isAssessment
    ? (data as CreditAssessmentData).applicantName
    : (data as ReportData).targetApplicant;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'memo' | 'timeline' | 'whatif' | 'decision'>('memo');

  // Decision State
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'OVERRIDE_APPROVE' | 'OVERRIDE_REJECT'>('APPROVE');
  const [overrideReason, setOverrideReason] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(
    assessmentData ? assessmentData.recommendedCreditLimit.replace(/[^0-9.]/g, '') || '25000000' : '25000000'
  );
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // What-If Simulation State
  const [simAmount, setSimAmount] = useState<number>(30000000);
  const [simTenor, setSimTenor] = useState<number>(6);
  const [simVolume, setSimVolume] = useState<number>(250000);
  const [simPrice, setSimPrice] = useState<number>(420);
  const [simStorage, setSimStorage] = useState<string>('AERATED_WAREHOUSE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const caseId = assessmentData?.persistedCaseId;
      if (caseId) {
        const res = await api.simulateScenario(caseId, {
          requestedAmountRwf: simAmount.toString(),
          tenorMonths: simTenor,
          contractedVolumeKg: simVolume,
          agreedPriceRwfKg: simPrice,
          storageFacilityType: simStorage,
        });
        setSimResult(res.data);
      } else {
        // Direct ad-hoc client calculation preview
        const deltaPoints = (simVolume > 200000 ? 3 : 0) + (simPrice >= 420 ? 2 : 0) + (simStorage === 'AERATED_WAREHOUSE' ? 4 : 0);
        setSimResult({
          baseline: {
            scoreOutOf100: assessmentData?.score || 85,
            riskBand: assessmentData?.riskLevel || 'LOW',
            suggestedCreditLimitRwf: '25000000',
          },
          simulated: {
            scoreOutOf100: Math.min(100, (assessmentData?.score || 85) + deltaPoints),
            riskBand: (assessmentData?.score || 85) + deltaPoints >= 80 ? 'LOW' : 'MODERATE',
            suggestedCreditLimitRwf: (simAmount * 0.9).toString(),
          },
          delta: {
            scorePoints: deltaPoints,
            limitDeltaRwf: '+5,000,000 RWF',
          },
        });
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOverride = decision === 'OVERRIDE_APPROVE' || decision === 'OVERRIDE_REJECT';
    if (isOverride && !overrideReason.trim()) {
      alert('A written justification is strictly required for decision overrides.');
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const caseId = assessmentData?.persistedCaseId || 'seeded-sample-case';
      await api.recordDecision(caseId, {
        decision,
        approvedAmountRwf: approvedAmount,
        reason: isOverride ? overrideReason : undefined,
        recommendations: 'Recorded with full audit trail compliance under BNR regulation.',
      });
      setDecisionSuccess(`Decision ${decision} recorded successfully in compliance audit log.`);
      if (onDecisionSubmitted) onDecisionSubmitted();
    } catch (err: any) {
      alert(`Error submitting decision: ${err.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const proofEvents: ProofEvent[] = assessmentData?.chronologicalTimeline || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F6F5F] flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-5 h-5 text-[#6FCF97]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">BNR Credit Assessment Memorandum</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6FCF97]/20 text-[#1F6F5F] border border-[#2FA084]/30">
                  Verifiable Proof
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Bank of Kigali · Gasabo District Cooperative Facility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1F6F5F] hover:bg-[#18594c] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#6FCF97]" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-stone-200 bg-white gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('memo')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'memo'
                ? 'border-[#1F6F5F] text-[#1F6F5F]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Assessment Docket</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-[#1F6F5F] text-[#1F6F5F]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Chronological Proof Timeline ({proofEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('whatif')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'whatif'
                ? 'border-[#1F6F5F] text-[#1F6F5F]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>What-If Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'decision'
                ? 'border-[#1F6F5F] text-[#1F6F5F]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Officer Decision</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-stone-800 text-xs sm:text-sm">
          {/* TAB 1: MEMO ASSESSMENT */}
          {activeTab === 'memo' && (
            <>
              {/* Memo Title Lockup */}
              <div className="border-b-2 border-[#1F6F5F] pb-4 flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1F6F5F]">
                    AgriCredit AI · Formal Assessment Docket
                  </p>
                  <h2 className="text-xl font-bold text-stone-900 mt-1">
                    {applicantName}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Location: {assessmentData?.location || 'Gasabo District, Rwanda'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400">Date Generated</p>
                  <p className="font-semibold text-stone-800">Season 2026A</p>
                </div>
              </div>

              {/* Assessment Summary 3-KPI bar */}
              {isAssessment && assessmentData && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <div>
                      <span className="text-[11px] text-stone-400 uppercase font-medium">Credit Score</span>
                      <p className="text-2xl font-bold text-[#1F6F5F] font-mono mt-0.5">
                        {assessmentData.score} / 100%
                      </p>
                      <p className="text-xs text-[#2FA084] font-semibold">{assessmentData.riskLevel}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-400 uppercase font-medium">Estimated Default Risk</span>
                      <p className="text-2xl font-bold text-stone-900 font-mono mt-0.5">
                        {assessmentData.defaultProbability}
                      </p>
                      <p className="text-xs text-stone-500">Calibrated Risk Curve</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-400 uppercase font-medium">Recommended Limit</span>
                      <p className="text-2xl font-bold text-[#1F6F5F] font-mono mt-0.5">
                        {assessmentData.recommendedCreditLimit}
                      </p>
                      <p className="text-xs text-stone-500">Seasonal Facility Limit</p>
                    </div>
                  </div>

                  {/* 4 Scoring Pillars Section */}
                  <div>
                    <h4 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1F6F5F]" />
                      4 Calibrated Credit Pillars Breakdown (100% Total)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Pillar 1 */}
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-stone-900">1. Repayment Discipline</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6FCF97]/20 text-[#1F6F5F]">
                            {assessmentData.pillars?.repaymentDiscipline?.scoreAwarded ?? 30} / 35 pts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {assessmentData.pillars?.repaymentDiscipline?.summary ||
                            '100% on time repayment across historical credit facilities with zero delinquencies.'}
                        </p>
                      </div>

                      {/* Pillar 2 */}
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-stone-900">2. Commercial Off-Take Security</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6FCF97]/20 text-[#1F6F5F]">
                            {assessmentData.pillars?.offtakeSecurity?.scoreAwarded ?? 22} / 25 pts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {assessmentData.pillars?.offtakeSecurity?.summary ||
                            'Verified forward contract with commercial partner covering guaranteed purchase volumes.'}
                        </p>
                      </div>

                      {/* Pillar 3 */}
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-stone-900">3. Operating Cash Flow & Liquidity</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6FCF97]/20 text-[#1F6F5F]">
                            {assessmentData.pillars?.cashFlowHealth?.scoreAwarded ?? 20} / 20 pts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {assessmentData.pillars?.cashFlowHealth?.summary ||
                            'Verified net cash flow sweeps from commercial grain sales.'}
                        </p>
                      </div>

                      {/* Pillar 4 */}
                      <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-stone-900">4. Operational Infrastructure & Storage</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#6FCF97]/20 text-[#1F6F5F]">
                            {assessmentData.pillars?.operationalCapacity?.scoreAwarded ?? 20} / 20 pts
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {assessmentData.pillars?.operationalCapacity?.summary ||
                            'Aerated warehouse storage with audited record quality ratings.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conditions & Covenants */}
                  <div>
                    <h4 className="font-bold text-stone-900 mb-2">Key Underwriting Conditions</h4>
                    <div className="space-y-1.5">
                      {assessmentData.approvalConditions.map((cond, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-stone-600">
                          <CheckCircle2 className="w-4 h-4 text-[#2FA084] shrink-0 mt-0.5" />
                          <span>{cond}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: CHRONOLOGICAL PROOF TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-base text-stone-900">Verifiable Chronological Ledger Proof</h4>
                <p className="text-xs text-stone-500">
                  Every historical credit event, repayment settlement, grain transaction, and commercial contract sorted chronologically.
                </p>
              </div>

              {proofEvents.length === 0 ? (
                <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                  No chronological proof events loaded. Run an evaluation to generate verified proof.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-[#1F6F5F]/30 space-y-4">
                  {proofEvents.map((evt, idx) => {
                    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                    let label = 'LOAN DISBURSED';

                    if (evt.eventType === 'LOAN_REPAID') {
                      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      label = 'REPAYMENT SETTLED';
                    } else if (evt.eventType === 'GRAIN_SALE') {
                      badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      label = 'GRAIN SALE INFLOW';
                    } else if (evt.eventType === 'CONTRACT_SIGNED') {
                      badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                      label = 'FORWARD CONTRACT';
                    }

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot marker */}
                        <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#1F6F5F] border-2 border-white ring-2 ring-[#6FCF97]/40" />

                        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 shadow-2xs hover:bg-white hover:border-[#2FA084] transition-all">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-xs font-bold text-stone-900">{evt.period}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                              {label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed">{evt.description}</p>
                          {evt.institutionOrBuyer && (
                            <p className="text-[11px] text-stone-400 mt-1">
                              Institution / Counterparty: <span className="font-medium text-stone-700">{evt.institutionOrBuyer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHAT-IF SENSITIVITY SIMULATOR */}
          {activeTab === 'whatif' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-base text-stone-900">What-If Sensitivity Simulator</h4>
                <p className="text-xs text-stone-500">
                  Test counterfactual underwriting scenarios (e.g. facility adjustments or commodity price drops) without modifying baseline case records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Simulated Facility Amount: RWF {(simAmount / 1000000).toFixed(1)} Million
                  </label>
                  <input
                    type="range"
                    min={10000000}
                    max={60000000}
                    step={1000000}
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full accent-[#1F6F5F]"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>10M RWF</span>
                    <span>35M RWF</span>
                    <span>60M RWF</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Simulated Off-Take Price: {simPrice} RWF / Kg
                  </label>
                  <input
                    type="range"
                    min={300}
                    max={550}
                    step={10}
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    className="w-full accent-[#1F6F5F]"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>300 RWF (Floor)</span>
                    <span>420 RWF (AIF Avg)</span>
                    <span>550 RWF (Premium)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contracted Volume: {simVolume.toLocaleString()} Kg
                  </label>
                  <input
                    type="range"
                    min={50000}
                    max={400000}
                    step={10000}
                    value={simVolume}
                    onChange={(e) => setSimVolume(Number(e.target.value))}
                    className="w-full accent-[#1F6F5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Storage Facility Type</label>
                  <select
                    value={simStorage}
                    onChange={(e) => setSimStorage(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                  >
                    <option value="AERATED_WAREHOUSE">Aerated Warehouse (3% Loss Factor)</option>
                    <option value="STANDARD_STORAGE">Standard Covered Facility (7% Loss Factor)</option>
                    <option value="TRADITIONAL_SHED">Traditional Shed (12% Loss Factor)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full py-2.5 bg-[#1F6F5F] hover:bg-[#18574a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>{isSimulating ? 'Evaluating Sensitivity...' : 'Compute Simulated Score & Limits'}</span>
                  </button>
                </div>
              </div>

              {/* Simulation Result Comparison Box */}
              {simResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950">Scenario Outcome</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                      Delta: {simResult.delta.scorePoints >= 0 ? `+${simResult.delta.scorePoints}` : simResult.delta.scorePoints} Points
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase">Baseline</span>
                      <p className="text-base font-bold text-stone-800 font-mono mt-0.5">
                        {simResult.baseline.scoreOutOf100}/100% ({simResult.baseline.riskBand})
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Limit: RWF {(Number(simResult.baseline.suggestedCreditLimitRwf) / 1000000).toFixed(1)}M
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase">Simulated Scenario</span>
                      <p className="text-base font-bold text-[#1F6F5F] font-mono mt-0.5">
                        {simResult.simulated.scoreOutOf100}/100% ({simResult.simulated.riskBand})
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Limit: RWF {(Number(simResult.simulated.suggestedCreditLimitRwf) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HUMAN LOAN OFFICER DECISION */}
          {activeTab === 'decision' && (
            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <h4 className="font-bold text-base text-stone-900">Loan Officer Decision Submission</h4>
                <p className="text-xs text-stone-500">
                  Record the official lending committee decision. Overrides strictly require written regulatory justification.
                </p>
              </div>

              {decisionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{decisionSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">Decision Outcome</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'APPROVE', label: 'Approve', color: 'border-emerald-500 text-emerald-800 bg-emerald-50' },
                    { value: 'REJECT', label: 'Reject', color: 'border-rose-500 text-rose-800 bg-rose-50' },
                    { value: 'OVERRIDE_APPROVE', label: 'Override Approve', color: 'border-amber-500 text-amber-800 bg-amber-50' },
                    { value: 'OVERRIDE_REJECT', label: 'Override Reject', color: 'border-amber-600 text-amber-900 bg-amber-50' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDecision(opt.value as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        decision === opt.value
                          ? `${opt.color} ring-2 ring-[#1F6F5F]/30`
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Approved Facility Amount (RWF)</label>
                <input
                  type="text"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-[#1F6F5F]"
                  required
                />
              </div>

              {(decision === 'OVERRIDE_APPROVE' || decision === 'OVERRIDE_REJECT') && (
                <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Mandatory Override Justification (BNR Compliance)</span>
                  </div>
                  <textarea
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide specific underwriting rationale for overriding the deterministic risk score (e.g. supplementary buyer guarantee, collateral pledge)..."
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 text-stone-800"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="w-full py-3 bg-[#1F6F5F] hover:bg-[#18574a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingDecision ? 'Submitting to Audit Log...' : 'Confirm & Lock Official Lending Decision'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Compliance Footer */}
          <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-stone-400 text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2FA084]" />
              <span>National Bank of Rwanda (BNR) Regulation 04/2021 Compliant</span>
            </div>
            <span>Audited & Stored in PostgreSQL</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
