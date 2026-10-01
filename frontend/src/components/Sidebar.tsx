import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Search,
  Building2,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
  X,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { AssessmentHistoryItem } from '../types';

interface SidebarProps {
  assessments: AssessmentHistoryItem[];
  activeId: string | null;
  currentView: 'chat' | 'registry';
  onSelectAssessment: (item: AssessmentHistoryItem) => void;
  onNewAssessment: () => void;
  onOpenRegistry: () => void;
  onDeleteAssessment?: (id: string) => void;
  cooperativesCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  assessments,
  activeId,
  currentView,
  onSelectAssessment,
  onNewAssessment,
  onOpenRegistry,
  onDeleteAssessment,
  cooperativesCount,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Backdrop when drawer is open */}
      {isOpen && (
        <div
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/25 backdrop-blur-2xs z-30 transition-opacity duration-200"
          title="Click to close menu"
        />
      )}

      {/* Sidebar Panel: Slide-in overlay drawer */}
      <aside
        className={`absolute inset-y-0 left-0 z-40 w-72 sm:w-80 bg-[#F9F9F8] border-r border-stone-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with New Assessment button & Registry Page button */}
        <div className="p-4 border-b border-stone-200/70 space-y-2.5 bg-white/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              AgriCredit Pilot
            </span>
            <button
              onClick={onClose}
              title="Close menu"
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* + New Assessment button */}
          <button
            onClick={() => {
              onNewAssessment();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1F6F5F] hover:bg-[#18594c] active:bg-[#14483d] text-white rounded-xl text-xs font-medium shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#6FCF97]" />
            <span>+ New Assessment</span>
          </button>

          {/* Cooperatives Registry page button (placed directly below + New Assessment) */}
          <button
            onClick={() => {
              onOpenRegistry();
              onClose();
            }}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              currentView === 'registry'
                ? 'bg-emerald-50 text-[#1F6F5F] border-emerald-200 font-semibold'
                : 'bg-white hover:bg-stone-100/70 text-stone-700 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1F6F5F]" />
              <span>Cooperatives Registry</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
              {cooperativesCount}
            </span>
          </button>

          {/* Quick filter search */}
          <div className="relative pt-1">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search past audits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#2FA084] focus:ring-1 focus:ring-[#2FA084] text-stone-800 placeholder-stone-400"
            />
          </div>
        </div>

        {/* List of Assessments */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-stone-400">
            Recent Assessments
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-stone-400">
              No assessments matching query
            </div>
          ) : (
            filtered.map((item) => {
              const isActive = activeId === item.id;
              return (
                <div
                  key={item.id}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all duration-150 group relative flex flex-col gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-xs border border-stone-200/90 text-stone-900'
                      : 'hover:bg-stone-200/50 text-stone-700'
                  }`}
                  onClick={() => {
                    onSelectAssessment(item);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-medium text-stone-900 line-clamp-1 group-hover:text-[#1F6F5F] transition-colors flex-1">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.score && (
                        <span className="text-[10px] font-semibold text-[#1F6F5F] bg-[#6FCF97]/25 px-1.5 py-0.5 rounded">
                          {item.score}
                        </span>
                      )}
                      {onDeleteAssessment && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete assessment for ${item.title} and its records from database?`)) {
                              onDeleteAssessment(item.id);
                            }
                          }}
                          title="Delete assessment and records from database"
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="truncate">{item.category}</span>
                    <span className="shrink-0">{item.date}</span>
                  </div>

                  {item.riskLevel && (
                    <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          item.riskLevel === 'Low Risk'
                            ? 'bg-[#2FA084]'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={
                          item.riskLevel === 'Low Risk'
                            ? 'text-[#1F6F5F] font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {item.riskLevel}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-stone-200/70 bg-stone-100/50 text-[11px] text-stone-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2FA084]" />
            <span>Rwanda Co-op Base (RCA)</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">v2.4</span>
        </div>
      </aside>
    </>
  );
};
