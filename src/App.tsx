/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { CreditMemoModal } from './components/CreditMemoModal';
import {
  ChatMessage,
  SuggestedPrompt,
  AssessmentHistoryItem,
  ReportData,
  CreditAssessmentData,
} from './types';
import {
  SUGGESTED_PROMPTS,
  RECENT_ASSESSMENTS,
  MUSANZE_MAIZE_ASSESSMENT,
  NYAGATARE_DAIRY_ASSESSMENT,
  KAYONZA_RICE_ASSESSMENT,
  PORTFOLIO_MOCK_DATA,
  RISK_REPORT_MOCK_DATA,
} from './data/mockData';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [selectedMemoData, setSelectedMemoData] = useState<ReportData | CreditAssessmentData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch to new blank assessment
  const handleNewAssessment = () => {
    setMessages([]);
    setActiveAssessmentId(null);
  };

  // Load a historical assessment into view
  const handleSelectHistoricalAssessment = (item: AssessmentHistoryItem) => {
    setActiveAssessmentId(item.id);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (item.title.includes('Musanze')) {
        setMessages([
          {
            id: 'hist-user-1',
            role: 'user',
            content: 'Assess the credit risk of Musanze Maize Cooperative (COOPAMA) for a seasonal working capital facility of RWF 75,000,000.',
            timestamp: item.date,
          },
          {
            id: 'hist-ai-1',
            role: 'assistant',
            content:
              'Based on the audited financial statements, electronic warehouse receipts (EAX), and Sentinel-2 satellite biomass indices, AgriCredit AI has completed the risk assessment for Musanze Maize Cooperative (COOPAMA).\n\nThe cooperative scores 742/850, placing it in the LOW RISK tier. Repayment stability is reinforced by guaranteed commercial off-take agreements with Africa Improved Foods and Minimex.',
            timestamp: item.date,
            structuredData: {
              type: 'credit_assessment',
              assessment: MUSANZE_MAIZE_ASSESSMENT,
            },
          },
        ]);
      } else if (item.title.includes('Nyagatare')) {
        setMessages([
          {
            id: 'hist-user-2',
            role: 'user',
            content: 'Review Nyagatare Dairy Farmers Union for facility renewal and prepare risk findings.',
            timestamp: item.date,
          },
          {
            id: 'hist-ai-2',
            role: 'assistant',
            content:
              'Credit risk review completed for Nyagatare Dairy Farmers Union. The cooperative demonstrates reliable milk intake volumes (14,200 L/day) and stable off-take with Inyange Industries, though dry-season pasture variability warrants an automated cash escrow mechanism.',
            timestamp: item.date,
            structuredData: {
              type: 'credit_assessment',
              assessment: NYAGATARE_DAIRY_ASSESSMENT,
            },
          },
        ]);
      } else if (item.title.includes('Kayonza')) {
        setMessages([
          {
            id: 'hist-user-3',
            role: 'user',
            content: 'Review Kayonza Rice Farmers Union credit score and irrigation security.',
            timestamp: item.date,
          },
          {
            id: 'hist-ai-3',
            role: 'assistant',
            content:
              'Credit evaluation completed for Kayonza Rice Farmers Union (CORIKA). Irrigated valley infrastructure provides insulation against drought risks, yielding a top-tier credit score of 795/850 with an estimated default probability of just 2.1%.',
            timestamp: item.date,
            structuredData: {
              type: 'credit_assessment',
              assessment: KAYONZA_RICE_ASSESSMENT,
            },
          },
        ]);
      } else if (item.title.includes('Portfolio')) {
        setMessages([
          {
            id: 'hist-user-4',
            role: 'user',
            content: 'Analyze current Q3 agricultural lending portfolio risk across cooperatives.',
            timestamp: item.date,
          },
          {
            id: 'hist-ai-4',
            role: 'assistant',
            content:
              'Executive portfolio exposure summary for Q3 2026. The agricultural loan portfolio stands at RWF 18.45 Billion with a Non-Performing Loan (NPL) ratio of 2.4%, well below the BNR 5.0% prudential threshold.',
            timestamp: item.date,
            structuredData: {
              type: 'portfolio_risk',
              portfolio: PORTFOLIO_MOCK_DATA,
            },
          },
        ]);
      } else {
        setMessages([
          {
            id: 'hist-user-5',
            role: 'user',
            content: 'Generate the September BNR Prudential Credit Risk Report for the regulatory filing.',
            timestamp: item.date,
          },
          {
            id: 'hist-ai-5',
            role: 'assistant',
            content:
              'Generated the formal Credit Committee Risk Assessment Memorandum for Central Bank compliance review.',
            timestamp: item.date,
            structuredData: {
              type: 'risk_report',
              report: RISK_REPORT_MOCK_DATA,
            },
          },
        ]);
      }
    }, 350);
  };

  // User sends a message or clicks a suggestion card
  const handleSendMessage = (
    text: string,
    attachments?: { name: string; size: string; type: string }[]
  ) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
      attachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Realistic intelligent response routing
    setTimeout(() => {
      setIsLoading(false);
      const lower = text.toLowerCase();

      let aiResponse: ChatMessage;

      if (
        lower.includes('portfolio') ||
        lower.includes('exposure') ||
        lower.includes('macro') ||
        lower.includes('npl')
      ) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            'Agricultural portfolio risk analysis conducted across all 88 active cooperative credit facilities.\n\nTotal exposure is currently RWF 18.45 Billion. Portfolio health remains strong with 97.6% performing loans and an aggregate NPL rate of 2.4% (well within BNR prudential guidelines). Maize and export coffee comprise the largest loan asset concentrations.',
          timestamp: 'Just now',
          structuredData: {
            type: 'portfolio_risk',
            portfolio: PORTFOLIO_MOCK_DATA,
          },
        };
      } else if (
        lower.includes('report') ||
        lower.includes('committee') ||
        lower.includes('memorandum') ||
        lower.includes('bnr') ||
        lower.includes('docket')
      ) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            'I have prepared the formal Credit Committee Risk Assessment Memorandum Docket. Sensitivity stress tests show acceptable debt service resilience (min DSCR 1.24x under drought conditions).',
          timestamp: 'Just now',
          structuredData: {
            type: 'risk_report',
            report: RISK_REPORT_MOCK_DATA,
          },
        };
      } else if (lower.includes('kayonza') || lower.includes('rice')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            'Based on satellite Sentinel-2 imagery, audited cooperative statements, and MINALOC off-take agreements, AgriCredit AI has completed the assessment of Kayonza Rice Farmers Union (CORIKA).\n\nThe cooperative has achieved an exceptional credit score of 795/850, characterized by zero historical arrears and comprehensive marshland gravity irrigation.',
          timestamp: 'Just now',
          structuredData: {
            type: 'credit_assessment',
            assessment: KAYONZA_RICE_ASSESSMENT,
          },
        };
      } else if (lower.includes('nyagatare') || lower.includes('dairy') || lower.includes('milk')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            'Assessment completed for Nyagatare Dairy Farmers Union (KAZOO Dairy). The cooperative holds an estimated credit score of 680/850 (Moderate Risk). High asset collateral coverage (160%) and steady supply to Inyange Industries provide reliable debt servicing, subject to dry-season fodder provisions.',
          timestamp: 'Just now',
          structuredData: {
            type: 'credit_assessment',
            assessment: NYAGATARE_DAIRY_ASSESSMENT,
          },
        };
      } else {
        // Default / Musanze / Standard Application
        aiResponse = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            'Based on the available financial statements, electronic warehouse receipts (EAX), and Sentinel-2 satellite agronomic data, the cooperative has an estimated credit score of 742/850.\n\nThe cooperative demonstrates strong debt servicing capability with a projected DSCR of 2.42x, supported by binding off-take contracts with Africa Improved Foods (AIF) and Minimex.',
          timestamp: 'Just now',
          structuredData: {
            type: 'credit_assessment',
            assessment: MUSANZE_MAIZE_ASSESSMENT,
          },
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    }, 850);
  };

  const handleSelectPrompt = (prompt: SuggestedPrompt) => {
    handleSendMessage(prompt.defaultQuery);
  };

  const handleApproveAction = (applicant: string) => {
    showToast(`Application for ${applicant} approved and added to Credit Committee Docket.`);
  };

  const activeTitle =
    (activeAssessmentId &&
      RECENT_ASSESSMENTS.find((a) => a.id === activeAssessmentId)?.title) ||
    undefined;

  return (
    <div className="min-h-screen bg-[#EEEEEE] flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1F6F5F] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-[#6FCF97]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#6FCF97]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Outer App Frame / Canvas (matches the screenshot's floating card design) */}
      <div className="flex-1 max-w-7xl w-full mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-300/30 border border-stone-200/90 overflow-hidden flex flex-col transition-all">
        {/* Top Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewAssessment={handleNewAssessment}
          activeConversationTitle={activeTitle}
        />

        {/* Content Body with Sidenav (toggled by hamburger menu) + Central Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Recent Assessments Sidebar Drawer */}
          <Sidebar
            assessments={RECENT_ASSESSMENTS}
            activeId={activeAssessmentId}
            onSelectAssessment={handleSelectHistoricalAssessment}
            onNewAssessment={handleNewAssessment}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Central Workspace */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {messages.length === 0 ? (
              /* State 1: Centered Greeting & Suggested Prompts (Visual Reference Screenshot) */
              <div className="flex-1 flex flex-col justify-between py-4 sm:py-6 overflow-y-auto">
                <EmptyState
                  prompts={SUGGESTED_PROMPTS}
                  onSelectPrompt={handleSelectPrompt}
                />
                <div className="pb-4">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            ) : (
              /* State 2: Active Conversation State */
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  onOpenReportModal={(data) => setSelectedMemoData(data)}
                  onApproveAction={handleApproveAction}
                />
                <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-xs border-t border-stone-100">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Credit Memorandum Modal */}
      {selectedMemoData && (
        <CreditMemoModal
          data={selectedMemoData}
          onClose={() => setSelectedMemoData(null)}
        />
      )}
    </div>
  );
}
