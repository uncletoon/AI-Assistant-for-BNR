import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Sprout } from 'lucide-react';
import { ReportData, CreditAssessmentData } from '../types';

interface CreditMemoModalProps {
  data: ReportData | CreditAssessmentData | null;
  onClose: () => void;
}

export const CreditMemoModal: React.FC<CreditMemoModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const isAssessment = 'score' in data;
  const applicantName = isAssessment
    ? (data as CreditAssessmentData).applicantName
    : (data as ReportData).targetApplicant;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F6F5F] flex items-center justify-center text-white">
              <Sprout className="w-4 h-4 text-[#6FCF97]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                BNR Credit Assessment Memorandum
              </h3>
              <p className="text-[11px] text-stone-500">
                Official Document · National Bank of Rwanda Guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1F6F5F] hover:bg-[#18594c] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#6FCF97]" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Memo Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-stone-800 text-xs sm:text-sm">
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
                Facility Assessment ID: AGC-RW-2026-{(Math.random() * 8000 + 1000).toFixed(0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Date Generated</p>
              <p className="font-semibold text-stone-800">30 September 2026</p>
            </div>
          </div>

          {/* Assessment Summary */}
          {isAssessment ? (
            <>
              <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[11px] text-stone-400 uppercase">
                    Credit Rating
                  </span>
                  <p className="text-xl font-bold text-[#1F6F5F] font-mono mt-0.5">
                    {(data as CreditAssessmentData).score} / 850
                  </p>
                  <p className="text-xs text-[#2FA084] font-medium">
                    {(data as CreditAssessmentData).riskLevel}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase">
                    Default Probability
                  </span>
                  <p className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                    {(data as CreditAssessmentData).defaultProbability}
                  </p>
                  <p className="text-xs text-stone-500">Tier-1 Rating</p>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 uppercase">
                    Recommended Line
                  </span>
                  <p className="text-xl font-bold text-[#1F6F5F] font-mono mt-0.5">
                    {(data as CreditAssessmentData).recommendedCreditLimit}
                  </p>
                  <p className="text-xs text-stone-500">Seasonal Facility</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-stone-900 mb-2">
                  Key Evaluation Covenants & Safeguards
                </h4>
                <div className="space-y-1.5">
                  {(data as CreditAssessmentData).approvalConditions.map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-stone-600">
                      <CheckCircle2 className="w-4 h-4 text-[#2FA084] shrink-0 mt-0.5" />
                      <span>{cond}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                {(data as ReportData).executiveSummary}
              </p>
            </div>
          )}

          {/* Compliance Footer */}
          <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-stone-400 text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2FA084]" />
              <span>National Bank of Rwanda (BNR) Regulation 04/2021 Compliant</span>
            </div>
            <span>Authorized Officer Sign-off: E. Mugabo</span>
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
