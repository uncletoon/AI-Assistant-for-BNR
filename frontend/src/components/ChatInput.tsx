import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Paperclip,
  X,
  FileSpreadsheet,
  FileText,
  Check,
  ShieldAlert,
  Upload,
  FileUp,
} from 'lucide-react';

export interface FileAttachmentItem {
  name: string;
  size: string;
  type: string;
  fileContent?: string;
  file?: File;
}

interface ChatInputProps {
  onSendMessage: (
    message: string,
    attachments?: FileAttachmentItem[]
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
  const [selectedAttachments, setSelectedAttachments] = useState<FileAttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processUploadedFiles = async (files: FileList | File[]) => {
    const newItems: FileAttachmentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr = formatFileSize(file.size);

      // Read file content
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        if (
          file.type.includes('text') ||
          file.type.includes('csv') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv')
        ) {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        } else {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }
      });

      newItems.push({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
        fileContent: content,
        file,
      });
    }

    setSelectedAttachments((prev) => [...prev, ...newItems]);
    setShowAttachmentMenu(false);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFiles(e.dataTransfer.files);
    }
  };

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

  const removeAttachment = (name: string) => {
    setSelectedAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-0">
      {/* Hidden File Input for Native File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,.docx,.txt,.png,.jpg,.jpeg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Attached Files Pill Container */}
      {selectedAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          {selectedAttachments.map((doc) => (
            <div
              key={doc.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#2FA084]/40 rounded-xl text-xs text-stone-800 shadow-2xs"
            >
              {doc.name.endsWith('.pdf') ? (
                <FileText className="w-3.5 h-3.5 text-red-500" />
              ) : doc.name.endsWith('.xlsx') || doc.name.endsWith('.csv') ? (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileUp className="w-3.5 h-3.5 text-[#1F6F5F]" />
              )}
              <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
              <span className="text-stone-400 text-[10px]">({doc.size})</span>
              <button
                type="button"
                onClick={() => removeAttachment(doc.name)}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded-xs cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Rounded Input Bar with Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white rounded-full sm:rounded-2xl border transition-all duration-200 ${
          isDragging
            ? 'border-[#2FA084] ring-4 ring-[#2FA084]/20 bg-[#6FCF97]/10'
            : 'border-stone-200/90 shadow-sm hover:shadow-md focus-within:border-[#2FA084] focus-within:ring-2 focus-within:ring-[#2FA084]/20'
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 rounded-2xl pointer-events-none">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6F5F]">
              <Upload className="w-4 h-4 animate-bounce" />
              <span>Drop application form or offtake contract here</span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center px-2.5 sm:px-3 py-2 gap-2"
        >
          {/* Attachment Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              title="Attach loan application, contract, or ledger"
              className="p-2 sm:p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center cursor-pointer"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
            </button>

            {/* Attachment Popover Menu */}
            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-3 z-30 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <span className="text-xs font-semibold text-stone-800">
                    Upload Loan Evidence
                  </span>
                  <span className="text-[10px] text-stone-400">PDF / XLSX / Docs</span>
                </div>

                {/* Direct Upload Button from Computer */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachmentMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1F6F5F] hover:bg-[#18574a] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse Device Files (.pdf, .png, .txt)</span>
                </button>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-center">
                  <FileUp className="w-6 h-6 text-[#1F6F5F] mx-auto mb-1 opacity-80" />
                  <p className="text-[11px] font-medium text-stone-700">Drag & drop documents here</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Supports signed loan forms, offtake agreements & ledgers</p>
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
            placeholder="Ask about credit risk or attach cooperative loan documents..."
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
