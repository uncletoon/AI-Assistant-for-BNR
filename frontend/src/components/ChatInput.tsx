import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Paperclip,
  X,
  FileSpreadsheet,
  FileText,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/mockData';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    attachments?: { name: string; size: string; type: string }[]
  ) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  initialValue = '',
}) => {
  const [input, setInput] = useState(initialValue);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    { name: string; size: string; type: string }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && selectedAttachments.length === 0) || isLoading) return;

    onSendMessage(
      input.trim() || 'Assess the attached cooperative credit documents.',
      selectedAttachments.length > 0 ? selectedAttachments : undefined
    );

    setInput('');
    setSelectedAttachments([]);
    setShowAttachmentMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleAttachment = (doc: (typeof SAMPLE_DOCUMENTS)[0]) => {
    const exists = selectedAttachments.some((a) => a.name === doc.name);
    if (exists) {
      setSelectedAttachments((prev) => prev.filter((a) => a.name !== doc.name));
    } else {
      setSelectedAttachments((prev) => [...prev, doc]);
    }
  };

  const removeAttachment = (name: string) => {
    setSelectedAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-0">
      {/* Attached Files Pill Container */}
      {selectedAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          {selectedAttachments.map((doc) => (
            <div
              key={doc.name}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1F6F5F]" />
              <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
              <span className="text-stone-400 text-[10px]">({doc.size})</span>
              <button
                type="button"
                onClick={() => removeAttachment(doc.name)}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Rounded Input Bar */}
      <div className="relative bg-white rounded-full sm:rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md focus-within:border-[#2FA084] focus-within:ring-2 focus-within:ring-[#2FA084]/20 transition-all duration-200">
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-2.5 sm:px-3 py-2 gap-2"
        >
          {/* Attachment Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              title="Attach cooperative audit or satellite records"
              className="p-2 sm:p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center cursor-pointer"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
            </button>

            {/* Attachment Popover Menu */}
            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-30 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-800">
                    Attach Credit Documents
                  </span>
                  <span className="text-[10px] text-stone-400">RCA / EAX Repo</span>
                </div>

                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {SAMPLE_DOCUMENTS.map((doc) => {
                    const isSelected = selectedAttachments.some(
                      (a) => a.name === doc.name
                    );
                    return (
                      <button
                        key={doc.name}
                        type="button"
                        onClick={() => toggleAttachment(doc)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#6FCF97]/20 border border-[#2FA084]/30 text-stone-900'
                            : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-[#1F6F5F]' : 'text-stone-400'
                            }`}
                          />
                          <div className="truncate">
                            <p className="font-medium truncate">{doc.name}</p>
                            <p className="text-[10px] text-stone-400">
                              {doc.type} · {doc.size}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#1F6F5F] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 text-[11px] text-stone-400 flex items-center gap-1 border-t border-stone-100">
                  <ShieldAlert className="w-3 h-3 text-[#2FA084]" />
                  <span>Files encrypted under BNR banking standards</span>
                </div>
              </div>
            )}
          </div>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about credit risk, an applicant, or a cooperative..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 resize-none py-1.5 sm:py-2 text-stone-800 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-0 max-h-24 overflow-y-auto"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={
              (!input.trim() && selectedAttachments.length === 0) || isLoading
            }
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
              input.trim() || selectedAttachments.length > 0
                ? 'bg-[#2FA084] hover:bg-[#25876f] text-white shadow-sm'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
            title="Send query"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </button>
        </form>
      </div>

      {/* Subtle Bottom Note */}
      <p className="mt-3 text-center text-[11px] text-stone-400 tracking-wide font-normal">
        AgriCredit AI analyzes cooperative financial records, agronomic satellite indices, and historical repayment data.
      </p>
    </div>
  );
};
