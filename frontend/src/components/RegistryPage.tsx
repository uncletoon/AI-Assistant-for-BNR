import React from 'react';
import {
  Building2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { CooperativeRecord } from '../api/client';

interface RegistryPageProps {
  cooperatives: CooperativeRecord[];
  onOpenChat: () => void;
}

export const RegistryPage: React.FC<RegistryPageProps> = ({
  cooperatives,
  onOpenChat,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F7] overflow-y-auto">
      {/* Top action bar */}
      <div className="bg-white border-b border-stone-200/80 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1F6F5F]/10 border border-[#1F6F5F]/20 flex items-center justify-center text-[#1F6F5F]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <span>Gasabo Cooperatives Registry</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {cooperatives.length} Registered
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Verified agricultural maize aggregators in Gasabo District, Rwanda.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 py-2 px-3.5 bg-[#1F6F5F] hover:bg-[#18594c] active:bg-[#14483d] text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6FCF97]" />
          <span>Ask AI Assistant</span>
          <ArrowLeft className="w-3 h-3 rotate-180" />
        </button>
      </div>

      {/* Main content table */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Registry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-400 block mb-1">
              Active Cooperatives
            </span>
            <span className="text-lg font-bold text-stone-900">
              {cooperatives.length} Aggregators
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-400 block mb-1">
              Total Farmland
            </span>
            <span className="text-lg font-bold text-stone-900">
              {cooperatives.reduce((sum, c) => sum + c.totalHectares, 0).toFixed(1)} Ha
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-400 block mb-1">
              Registered Farmers
            </span>
            <span className="text-lg font-bold text-stone-900">
              {cooperatives.reduce((sum, c) => sum + c.memberCount, 0)} Members
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-400 block mb-1">
              Storage Capacity
            </span>
            <span className="text-lg font-bold text-stone-900">
              {cooperatives.reduce((sum, c) => sum + c.storageCapacityT, 0)} MT
            </span>
          </div>
        </div>

        {/* Cooperatives Table */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Cooperative Name</th>
                  <th className="py-3 px-3">TIN Number</th>
                  <th className="py-3 px-3">RCA Reg</th>
                  <th className="py-3 px-3">Sector</th>
                  <th className="py-3 px-3 text-right">Land (Ha)</th>
                  <th className="py-3 px-3 text-right">Members</th>
                  <th className="py-3 px-3 text-right">Storage</th>
                  <th className="py-3 px-3 text-center">Record Quality</th>
                  <th className="py-3 px-4 text-center">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {cooperatives.map((coop) => {
                  const tin = (coop as unknown as { tin?: string }).tin || '100' + coop.registrationNo.replace(/\D/g, '').slice(0, 6);
                  return (
                    <tr
                      key={coop.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#1F6F5F]" />
                          <span>{coop.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-stone-800">
                        {tin}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-stone-500 text-[11px]">
                        {coop.registrationNo}
                      </td>
                      <td className="py-3.5 px-3 text-stone-600">
                        {coop.sector}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-stone-800">
                        {coop.totalHectares} Ha
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-700">
                        {coop.memberCount}
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-700">
                        {coop.storageCapacityT} MT
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            coop.recordQuality >= 85
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {coop.recordQuality}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {coop.womenLed ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Women Led
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium text-stone-500 bg-stone-100">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
