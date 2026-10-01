import React, { useEffect, useRef } from "react";
import { Sprout, User, FileSpreadsheet } from "lucide-react";
import { ChatMessage, ReportData, CreditAssessmentData } from "../types";
import { AiMessageRenderer } from "./AiMessageRenderer";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onOpenReportModal?: (report: ReportData | CreditAssessmentData) => void;
  onApproveAction?: (
    applicant: string,
    reason?: string,
    decision?: string,
  ) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onOpenReportModal,
  onApproveAction,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Centered Antigravity-style inner chat container with balanced margins on both sides */}
      <div className="w-full max-w-3xl lg:max-w-4xl mx-auto space-y-6">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-3 ${
                  isUser
                    ? "flex-row-reverse max-w-[90%] sm:max-w-[78%]"
                    : "flex-row w-full max-w-full"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    isUser
                      ? "bg-[#1F6F5F] text-white font-medium text-xs"
                      : "bg-[#1F6F5F] text-white"
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sprout className="w-4 h-4 text-[#6FCF97]" />
                  )}
                </div>

                {/* Message Content Container */}
                <div
                  className={`flex flex-col space-y-1 ${isUser ? "items-end" : "items-start w-full"}`}
                >
                  <div
                    className={`rounded-2xl px-4 sm:px-5 py-3.5 text-xs sm:text-sm shadow-xs ${
                      isUser
                        ? "bg-[#1F6F5F] text-white rounded-tr-xs font-medium"
                        : "w-full bg-white border border-stone-200 text-stone-900 rounded-tl-xs"
                    }`}
                  >
                    {/* Attachments if any */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2.5 pb-2 border-b border-white/25 flex flex-wrap gap-2">
                        {message.attachments.map((att) => (
                          <div
                            key={att.name}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-xs font-medium text-white"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[220px]">
                              {att.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Body text / Structured AI Render */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-stone-50 font-medium text-sm">
                        {message.content}
                      </p>
                    ) : (
                      <AiMessageRenderer
                        content={message.content}
                        structuredData={message.structuredData}
                        onOpenReportModal={onOpenReportModal}
                        onApproveAction={onApproveAction}
                      />
                    )}
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`text-[11px] font-medium text-stone-500 px-1 ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading AI State */}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex items-start gap-3 max-w-full">
              <div className="w-8 h-8 rounded-xl bg-[#1F6F5F] flex items-center justify-center shrink-0 text-white shadow-2xs">
                <Sprout className="w-4 h-4 text-[#6FCF97] animate-pulse" />
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2FA084] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-[#2FA084] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#2FA084] animate-bounce" />
                  </div>
                  <span className="text-xs text-stone-800 font-semibold">
                    Evaluating cooperative records, Extracting data, wait a
                    bit...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
