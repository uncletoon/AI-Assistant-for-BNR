import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SuggestedPrompt } from '../types';

interface EmptyStateProps {
  prompts: SuggestedPrompt[];
  onSelectPrompt: (prompt: SuggestedPrompt) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  prompts,
  onSelectPrompt,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 max-w-2xl mx-auto w-full text-center">
      {/* Pilot Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F6F5F]/10 text-[#1F6F5F] border border-[#1F6F5F]/20 rounded-full text-xs font-medium mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-[#1F6F5F]" />
        <span>Bank of Kigali · Gasabo Pilot</span>
      </div>

      {/* Clean AI Assistant Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mb-2">
        AgriCredit AI Assistant
      </h1>

      <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
        Ask questions to retrieve cooperative counts, names, Rwandan TIN numbers, historical loan records, or cash flows from the database.
      </p>

      {/* Exactly 2 Quick Check Prompt Chips */}
      <div className="w-full max-w-lg space-y-2 text-left">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1">
          Quick checks
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {prompts.slice(0, 2).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt)}
              className="group text-left p-3.5 bg-white hover:bg-stone-50/80 rounded-xl border border-stone-200/90 hover:border-[#1F6F5F]/40 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-xs text-stone-800 group-hover:text-[#1F6F5F] transition-colors">
                  {prompt.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#1F6F5F] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-stone-500 leading-normal">
                {prompt.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
