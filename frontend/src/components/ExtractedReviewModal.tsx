import React, { useState } from 'react';
import { X, CheckCircle, FileText, AlertTriangle, Sprout, ArrowRight } from 'lucide-react';

export interface ExtractedReviewData {
  cooperativeName: string;
  tin: string;
  registrationNo?: string;
  sector: string;
  requestedAmountRwf: number;
  tenorMonths: number;
  cropType: string;
  purpose: string;
  cultivatedHectares?: number;
  memberFarmers?: number;
  season?: 'SEASON_A' | 'SEASON_B';
  storageFacilityType?: 'AERATED_WAREHOUSE' | 'TRADITIONAL_SHED' | 'STANDARD_STORAGE';
  buyerName?: string;
  contractedVolumeKg?: number;
  agreedPriceRwfKg?: number;
}

interface ExtractedReviewModalProps {
  initialData: ExtractedReviewData;
  fileName?: string;
  onConfirm: (confirmedData: ExtractedReviewData) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const ExtractedReviewModal: React.FC<ExtractedReviewModalProps> = ({
  initialData,
  fileName,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState<ExtractedReviewData>(initialData);

  const handleChange = (field: keyof ExtractedReviewData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F6F5F] flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-5 h-5 text-[#6FCF97]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Extracted Document Review</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#6FCF97]/20 text-[#1F6F5F] border border-[#2FA084]/30">
                  Human-in-the-Loop
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {fileName ? `File: ${fileName}` : 'Gemini 3 Flash extracted values. Verify or edit before scoring.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Please verify all extracted fields against the signed cooperative documents. Confirmed figures will be stored directly into PostgreSQL under strict regulatory audit logging.
            </p>
          </div>

          {/* Section 1: Cooperative Identification */}
          <div>
            <h4 className="text-xs font-semibold text-[#1F6F5F] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> 1. Cooperative Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Cooperative Name</label>
                <input
                  type="text"
                  value={formData.cooperativeName}
                  onChange={(e) => handleChange('cooperativeName', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] focus:ring-1 focus:ring-[#2FA084] text-xs font-medium text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Rwandan TIN (9 digits)</label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => handleChange('tin', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] focus:ring-1 focus:ring-[#2FA084] text-xs font-mono font-medium text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Gasabo Sector</label>
                <select
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                >
                  <option value="Bumbogo">Bumbogo</option>
                  <option value="Gikomero">Gikomero</option>
                  <option value="Ndera">Ndera</option>
                  <option value="Rutunga">Rutunga</option>
                  <option value="Rusororo">Rusororo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">RCA Registration No.</label>
                <input
                  type="text"
                  value={formData.registrationNo || 'RCA/0482/2018'}
                  onChange={(e) => handleChange('registrationNo', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-mono font-medium text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Facility Request & Seasonal Factor */}
          <div className="pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold text-[#1F6F5F] uppercase tracking-wider mb-2.5">
              2. Facility Request & Agriculture Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Requested Amount (RWF)</label>
                <input
                  type="number"
                  value={formData.requestedAmountRwf}
                  onChange={(e) => handleChange('requestedAmountRwf', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-mono font-bold text-[#1F6F5F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Seasonal Tenor (Months)</label>
                <input
                  type="number"
                  value={formData.tenorMonths}
                  onChange={(e) => handleChange('tenorMonths', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Crop Type</label>
                <input
                  type="text"
                  value={formData.cropType}
                  onChange={(e) => handleChange('cropType', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Farmland (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cultivatedHectares ?? ''}
                  onChange={(e) => handleChange('cultivatedHectares', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Agricultural Season</label>
                <select
                  value={formData.season || 'SEASON_A'}
                  onChange={(e) => handleChange('season', e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                >
                  <option value="SEASON_A">Season A (Sept - Feb Peak)</option>
                  <option value="SEASON_B">Season B (Mar - June Short Rains)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Storage Facility Type</label>
                <select
                  value={formData.storageFacilityType || 'AERATED_WAREHOUSE'}
                  onChange={(e) => handleChange('storageFacilityType', e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                >
                  <option value="AERATED_WAREHOUSE">Aerated Warehouse (3% Loss Risk)</option>
                  <option value="STANDARD_STORAGE">Standard Covered Storage</option>
                  <option value="TRADITIONAL_SHED">Traditional Shed (12% Loss Risk)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Offtake Agreement */}
          <div className="pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold text-[#1F6F5F] uppercase tracking-wider mb-2.5">
              3. Commercial Off-Take Security
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Off-Take Buyer Partner</label>
                <input
                  type="text"
                  value={formData.buyerName ?? ''}
                  onChange={(e) => handleChange('buyerName', e.target.value)}
                  placeholder="e.g. ABC Trade Ltd"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Contract Volume (Kg)</label>
                <input
                  type="number"
                  value={formData.contractedVolumeKg ?? ''}
                  onChange={(e) => handleChange('contractedVolumeKg', Number(e.target.value))}
                  placeholder="e.g. 100000"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-mono font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Agreed Price (RWF / Kg)</label>
                <input
                  type="number"
                  value={formData.agreedPriceRwfKg ?? ''}
                  onChange={(e) => handleChange('agreedPriceRwfKg', Number(e.target.value))}
                  placeholder="e.g. 420"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#2FA084] text-xs font-mono font-medium text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#1F6F5F] hover:bg-[#18574a] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Calculating Credit Score...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-[#6FCF97]" />
                  <span>Confirm & Run Credit Scorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
