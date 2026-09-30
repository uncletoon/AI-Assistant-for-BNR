import React from 'react';
import {
  CreditCard,
  TrendingUp,
  Building2,
  FileText,
  Sparkles,
  ArrowRight,
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
  const getIcon = (type: SuggestedPrompt['icon']) => {
    switch (type) {
      case 'credit':
        return <CreditCard className="w-5 h-5 text-[#1F6F5F]" />;
      case 'chart':
        return <TrendingUp className="w-5 h-5 text-[#2FA084]" />;
      case 'cooperative':
        return <Building2 className="w-5 h-5 text-[#1F6F5F]" />;
      case 'report':
        return <FileText className="w-5 h-5 text-[#2FA084]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto w-full text-center">
      {/* Greeting Header */}
      <div className="mb-8 sm:mb-12 max-w-2xl mx-auto">
        <p className="text-base sm:text-lg font-medium text-stone-600 mb-2">
          Hello, Credit Officer
        </p>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 mb-3 text-balance">
          What would you like to assess?
        </h1>

        <p className="text-sm sm:text-base text-stone-500 max-w-xl mx-auto leading-relaxed">
          Ask AgriCredit AI about credit risk, applicants, portfolio performance, or cooperative financial data.
        </p>
      </div>

      {/* Suggested Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full mb-8">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelectPrompt(prompt)}
            className="group relative flex flex-col text-left p-4 sm:p-4.5 bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#2FA084]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FA084]"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-3 group-hover:bg-[#6FCF97]/20 group-hover:border-[#6FCF97]/40 transition-colors">
              {getIcon(prompt.icon)}
            </div>

            <div className="font-semibold text-stone-900 text-sm mb-1 group-hover:text-[#1F6F5F] transition-colors line-clamp-1">
              {prompt.title}
            </div>

            <p className="text-xs text-stone-500 leading-normal line-clamp-2">
              {prompt.description}
            </p>

            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-medium text-stone-400 group-hover:text-[#2FA084] transition-colors">
              <span>Start assessment</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
