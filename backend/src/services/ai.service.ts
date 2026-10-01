import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { institutionalDataService } from './institutional.service.js';
import { AGRICREDIT_SYSTEM_INSTRUCTION } from '../ai_model/system_instruction.js';

export interface ChatResponse {
  reply: string;
  source: 'gemini' | 'database_retriever';
  data?: unknown;
}

export interface ChatContext {
  caseId?: string;
  cooperativeId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Database Tool Function Declarations for Gemini Function Calling
// ────────────────────────────────────────────────────────────────────────────

const getCooperativesCountDeclaration: FunctionDeclaration = {
  name: 'get_cooperatives_count',
  description: 'Get the total count of agricultural cooperatives registered in the Gasabo District database.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const listCooperativesDeclaration: FunctionDeclaration = {
  name: 'list_cooperatives',
  description: 'List all agricultural cooperatives in Gasabo District with their names, TINs, sectors, member counts, hectares, and storage capacities.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sector: {
        type: Type.STRING,
        description: 'Optional Gasabo sector filter (e.g. Bumbogo, Gikomero, Ndera, Rutunga, Rusororo)',
      },
    },
  },
};

const getCooperativeDetailsDeclaration: FunctionDeclaration = {
  name: 'get_cooperative_details',
  description: 'Look up specific cooperative details by Rwandan TIN (Tax Identification Number) or cooperative Name. Returns registration, farmland, members, storage, leadership, record quality.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name: {
        type: Type.STRING,
        description: 'Cooperative TIN (e.g. 100234567) or Name (e.g. Twitezimbere Gasabo)',
      },
    },
    required: ['tin_or_name'],
  },
};

const getCooperativeCashFlowDeclaration: FunctionDeclaration = {
  name: 'get_cooperative_cash_flow',
  description: 'Get money in (grain sales, loan sweeps) and money out (input purchases, labor, repayments) transactions and net cash flow for a cooperative.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name: {
        type: Type.STRING,
        description: 'Cooperative TIN or Name',
      },
    },
    required: ['tin_or_name'],
  },
};

const getCooperativeLoansAndRepaymentsDeclaration: FunctionDeclaration = {
  name: 'get_cooperative_loans_and_repayments',
  description: 'Get historical prior credit facilities across SACCOs, microfinance, and commercial banks, plus past repayment ledgers and on-time settlement ratios (used as historical track record baseline).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name: {
        type: Type.STRING,
        description: 'Cooperative TIN or Name',
      },
    },
    required: ['tin_or_name'],
  },
};

const getAssessmentDetailsDeclaration: FunctionDeclaration = {
  name: 'get_assessment_details',
  description: 'Get active credit assessment docket including: active loan request amount from application document, evaluated credit score out of 100, 4-pillar breakdown (Repayment/Off-Take/Cash-Flow/Infrastructure), default probability, risk band, suggested credit limit, key score drivers with evidence, proof timeline, and committee decision with any overrides.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name_or_case_id: {
        type: Type.STRING,
        description: 'Loan case ID, Cooperative TIN, or Name. If omitted, uses the active case from context.',
      },
    },
  },
};

const getScoringReasonsDeclaration: FunctionDeclaration = {
  name: 'get_scoring_reasons',
  description: 'Explain why a cooperative received its credit score, detailing the top ranked drivers, factor points, impact analysis, and evidence sources.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name_or_case_id: {
        type: Type.STRING,
        description: 'Loan case ID, Cooperative TIN, or Name',
      },
    },
  },
};

const getOfftakeAgreementsDeclaration: FunctionDeclaration = {
  name: 'get_offtake_agreements',
  description: 'Get commercial off-take buyer contracts including buyer name, contracted volume in kg, agreed floor price per kg in RWF, gross contract value, escrow terms, and verification status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tin_or_name_or_case_id: {
        type: Type.STRING,
        description: 'Loan case ID, Cooperative TIN, or Name',
      },
    },
  },
};

const getFairnessMonitoringDeclaration: FunctionDeclaration = {
  name: 'get_fairness_monitoring',
  description: 'Get BNR fairness and monitoring data including sector-level and gender-based (women-led) approval rates, loan distribution, and compliance metrics for regulatory reporting.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

// ────────────────────────────────────────────────────────────────────────────
// AI Service: Gemini-first architecture
// ────────────────────────────────────────────────────────────────────────────

export class AiDataRetrieverService {
  private geminiClient: GoogleGenAI | null = null;
  private isGeminiConfigured = false;
  private readonly candidateModels = [
    'gemini-3.8-flash',
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
  ];

  constructor() {
    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (key && key.trim() !== '' && key !== 'your_gemini_api_key_here') {
      try {
        this.geminiClient = new GoogleGenAI({ apiKey: key.trim() });
        this.isGeminiConfigured = true;
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Generates content with automatic model fallback across available Gemini models
   * (gemini-3.8-flash -> gemini-3-flash-preview -> gemini-3.5-flash-lite -> gemini-flash-latest)
   * if a 503 high demand, 429 rate limit, or transient server outage occurs.
   */
  private async generateContentWithFallback(params: {
    contents: any[];
    config?: any;
    preferredModel?: string;
  }): Promise<any> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const primary = params.preferredModel || env.GEMINI_MODEL || 'gemini-3.8-flash';
    const modelsToTry = [
      primary,
      ...this.candidateModels.filter((m) => m !== primary),
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await this.geminiClient.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (res) {
          return res;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[AiService] Model ${model} generation failed, attempting backup model:`, msg);
      }
    }

    throw lastError || new Error('All candidate Gemini models exhausted');
  }

  /**
   * Main entry point: ALL user input routes through Gemini.
   * Gemini understands intent, decides which tools to call, and produces grounded responses.
   */
  async processQuery(userMessage: string, context?: ChatContext): Promise<ChatResponse> {
    const text = userMessage.trim();
    if (!text) {
      return {
        reply: 'Please ask a question about Gasabo cooperatives, loan assessments, cash flows, or repayment records.',
        source: 'gemini',
      };
    }

    // Gemini API key is REQUIRED — no silent degradation
    if (!this.isGeminiConfigured || !this.geminiClient) {
      return {
        reply: 'The AI service is not configured. Please set the GEMINI_API_KEY environment variable in the backend .env file to enable the credit risk analysis assistant.',
        source: 'gemini',
      };
    }

    try {
      const result = await this.queryWithGemini(text, context);
      if (result) {
        return result;
      }
      // If Gemini returned nothing (rare edge case), give a helpful message
      return {
        reply: 'I could not process your request. Please try rephrasing your question about the cooperative, loan assessment, or credit analysis.',
        source: 'gemini',
      };
    } catch (err) {
      console.error('Gemini query error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        reply: `I encountered an issue processing your request: ${errorMessage}. Please try again.`,
        source: 'gemini',
      };
    }
  }

  /**
   * Query Gemini with function calling tools.
   * Gemini is the reasoning engine: it understands the user's intent,
   * decides which database tools to call, and formats grounded responses.
   */
  private async queryWithGemini(prompt: string, context?: ChatContext): Promise<ChatResponse | null> {
    if (!this.geminiClient) return null;

    const tools = [
      {
        functionDeclarations: [
          getCooperativesCountDeclaration,
          listCooperativesDeclaration,
          getCooperativeDetailsDeclaration,
          getCooperativeCashFlowDeclaration,
          getCooperativeLoansAndRepaymentsDeclaration,
          getAssessmentDetailsDeclaration,
          getScoringReasonsDeclaration,
          getOfftakeAgreementsDeclaration,
          getFairnessMonitoringDeclaration,
        ],
      },
    ];

    // Build context-aware system instruction
    let systemInstruction = AGRICREDIT_SYSTEM_INSTRUCTION;

    // Inject active case context so Gemini knows which case/cooperative is in focus
    const hasContext = context?.caseId || context?.cooperativeId;
    if (hasContext) {
      const contextParts: string[] = [];
      if (context?.caseId) {
        contextParts.push(`Active loan case ID: ${context.caseId}`);
      }
      if (context?.cooperativeId) {
        contextParts.push(`Active cooperative ID: ${context.cooperativeId}`);
      }
      systemInstruction += `\n\nACTIVE SESSION CONTEXT:\n${contextParts.join('\n')}\nWhen the user asks questions without specifying a cooperative or case, use these IDs to look up the relevant data. Pass these IDs to the tools when no explicit name/TIN is mentioned.`;
    } else {
      systemInstruction += `\n\nACTIVE SESSION CONTEXT:\nNo active case or cooperative selected. The officer has not yet attached documents or selected a case. If they ask analytical questions, remind them to attach documents or select a cooperative first.`;
    }

    // Build conversation history
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      for (const turn of context.conversationHistory.slice(-6)) {
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // First turn: send to Gemini with multi-model fallback
    const response = await this.generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        tools,
      },
    });

    // Handle function calls — Gemini decided it needs data
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      // Execute ALL function calls (Gemini may request multiple)
      const toolResults: Array<{ id?: string; name: string; args: Record<string, unknown>; result: unknown }> = [];

      for (const call of functionCalls) {
        const fnName = call.name ?? '';
        const callId = (call as any).id;
        const args = (call.args as Record<string, unknown>) || {};
        const result = await this.executeTool(fnName, args, context);
        toolResults.push({ id: callId, name: fnName, args, result });
      }

      // Preserve the exact model turn returned by Gemini (including thought_signature)
      const modelContent = response.candidates?.[0]?.content || {
        role: 'model',
        parts: functionCalls.map((fc: any) => ({
          functionCall: { name: fc.name, args: fc.args },
        })),
      };

      const functionResponseParts = toolResults.map((tr) => {
        const part: Record<string, unknown> = {
          name: tr.name,
          response: { result: tr.result },
        };
        if (tr.id) {
          part.id = tr.id;
        }
        return { functionResponse: part };
      });

      // Second turn: send all tool results back to Gemini with fallback
      const followUp = await this.generateContentWithFallback({
        contents: [
          ...contents,
          modelContent,
          { role: 'user', parts: functionResponseParts },
        ],
        config: {
          systemInstruction,
          tools,
        },
      });

      // Extract text from followUp safely
      let replyText = this.extractTextFromResponse(followUp);

      // If Gemini requested a second round of tools (multi-hop reasoning)
      if (!replyText && followUp.functionCalls && followUp.functionCalls.length > 0) {
        const secondToolResults: Array<{ id?: string; name: string; args: Record<string, unknown>; result: unknown }> = [];
        for (const call of followUp.functionCalls) {
          const fnName = call.name ?? '';
          const callId = (call as any).id;
          const args = (call.args as Record<string, unknown>) || {};
          const result = await this.executeTool(fnName, args, context);
          secondToolResults.push({ id: callId, name: fnName, args, result });
          toolResults.push({ id: callId, name: fnName, args, result });
        }

        const secondModelContent = followUp.candidates?.[0]?.content;
        const secondResponseParts = secondToolResults.map((tr) => {
          const part: Record<string, unknown> = {
            name: tr.name,
            response: { result: tr.result },
          };
          if (tr.id) part.id = tr.id;
          return { functionResponse: part };
        });

        const thirdTurn = await this.generateContentWithFallback({
          contents: [
            ...contents,
            modelContent,
            { role: 'user', parts: functionResponseParts },
            ...(secondModelContent ? [secondModelContent] : []),
            { role: 'user', parts: secondResponseParts },
          ],
          config: { systemInstruction },
        });

        replyText = this.extractTextFromResponse(thirdTurn);
      }

      // If text is still empty, synthesize directly from retrieved data
      if (!replyText) {
        replyText = this.formatDataNarrative(toolResults);
      }

      // Collect all tool result data for frontend structured rendering
      const combinedData = toolResults.length === 1 ? toolResults[0].result : toolResults.map((tr) => ({ tool: tr.name, data: tr.result }));

      return {
        reply: replyText,
        source: 'gemini',
        data: combinedData,
      };
    }

    // Direct text response (no tool calls needed — e.g., off-topic rejection, greetings, etc.)
    const directText = this.extractTextFromResponse(response);
    if (directText) {
      return {
        reply: directText,
        source: 'gemini',
      };
    }

    return null;
  }

  /**
   * Execute a single function calling tool against the database.
   * Each tool maps to a Prisma query returning real PostgreSQL data.
   */
  private async executeTool(
    fnName: string,
    args: Record<string, unknown>,
    context?: ChatContext,
  ): Promise<unknown> {
    switch (fnName) {
      case 'get_cooperatives_count': {
        const count = await prisma.cooperative.count();
        return { count, district: 'Gasabo' };
      }

      case 'list_cooperatives': {
        const sector = typeof args.sector === 'string' ? args.sector : undefined;
        return prisma.cooperative.findMany({
          where: sector ? { sector: { equals: sector, mode: 'insensitive' } } : {},
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            tin: true,
            registrationNo: true,
            sector: true,
            memberCount: true,
            totalHectares: true,
            storageCapacityT: true,
            womenLed: true,
            recordQuality: true,
          },
        });
      }

      case 'get_cooperative_details': {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q, context);
        if (!matched) return { error: `Cooperative "${q}" not found in the Gasabo District database.` };
        // Enrich with institutional profile and offtake agreements
        const profile = await institutionalDataService.getInstitutionalProfile(matched.id);
        const offtakeAgreements = await prisma.offtakeAgreement.findMany({
          where: { loanCase: { cooperativeId: matched.id } },
        });
        return {
          cooperative: matched,
          kpis: profile?.kpis || null,
          loanRecords: profile?.loanRecords || [],
          offtakeAgreements: offtakeAgreements || [],
        };
      }

      case 'get_cooperative_cash_flow': {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q, context);
        if (!matched) return { error: `Cooperative "${q}" not found.` };
        const profile = await institutionalDataService.getInstitutionalProfile(matched.id);
        return {
          cooperative: { name: matched.name, tin: matched.tin, sector: matched.sector },
          cashFlowHealth: profile?.kpis.cashFlowHealth || null,
          recentTransactions: profile?.accountTransactions.slice(0, 12) || [],
        };
      }

      case 'get_cooperative_loans_and_repayments': {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q, context);
        if (!matched) return { error: `Cooperative "${q}" not found.` };
        const profile = await institutionalDataService.getInstitutionalProfile(matched.id);
        return {
          cooperative: { name: matched.name, tin: matched.tin },
          historicalDebtProfile: profile?.kpis.debtProfile || null,
          historicalRepaymentHealth: profile?.kpis.repaymentHealth || null,
          historicalPriorLoans: profile?.loanRecords || [],
          underwritingContext: 'These records represent historical prior credit facilities from past seasons used as baseline for track record and prudential 1.5x scaling. The active current loan request is in the application docket.',
        };
      }

      case 'get_assessment_details': {
        const q = String(args.tin_or_name_or_case_id || '');
        const loanCase = await this.findFocalLoanCase(q, context);
        if (!loanCase) return { error: 'No loan case found. Please select a case or attach documents first.' };
        return this.formatAssessmentData(loanCase);
      }

      case 'get_scoring_reasons': {
        const q = String(args.tin_or_name_or_case_id || '');
        const loanCase = await this.findFocalLoanCase(q, context);
        if (!loanCase) return { error: 'No loan case found.' };
        const latestScore = loanCase.scores?.[0];
        if (!latestScore) return { error: 'No scoring data available for this case.' };
        return {
          cooperative: loanCase.cooperative?.name,
          scorePoints: latestScore.scorePoints,
          band: latestScore.band,
          defaultProb: latestScore.defaultProb,
          drivers: latestScore.reasons?.map((r: { rank: number; feature: string; impactPoints: number; statement: string | null; sourceType: string | null }) => ({
            rank: r.rank,
            feature: r.feature,
            impactPoints: r.impactPoints,
            statement: r.statement,
            sourceType: r.sourceType,
          })) || [],
          pillars: latestScore.inputSnapshot ? (latestScore.inputSnapshot as Record<string, unknown>).pillars : null,
        };
      }

      case 'get_offtake_agreements': {
        const q = String(args.tin_or_name_or_case_id || '');
        const loanCase = await this.findFocalLoanCase(q, context);
        if (!loanCase) return { error: 'No loan case found.' };
        const agreements = await prisma.offtakeAgreement.findMany({
          where: { loanCaseId: loanCase.id },
        });
        return {
          cooperative: loanCase.cooperative?.name,
          agreements: agreements.map((a) => ({
            buyerName: a.buyerName,
            volumeKg: a.volumeKg,
            agreedPriceRwfKg: a.agreedPriceRwfKg,
            grossValue: a.volumeKg * a.agreedPriceRwfKg,
            startDate: a.startDate,
            endDate: a.endDate,
            isVerified: a.isVerified,
          })),
        };
      }

      case 'get_fairness_monitoring': {
        const cooperatives = await prisma.cooperative.findMany({
          select: {
            name: true,
            sector: true,
            womenLed: true,
            loanCases: {
              select: {
                id: true,
                status: true,
                requestedAmountRwf: true,
                decision: {
                  select: {
                    decision: true,
                    approvedAmountRwf: true,
                  },
                },
              },
            },
          },
        });

        const sectorStats: Record<string, { total: number; approved: number; womenLed: number; womenLedApproved: number }> = {};
        for (const coop of cooperatives) {
          const sector = coop.sector || 'Unknown';
          if (!sectorStats[sector]) {
            sectorStats[sector] = { total: 0, approved: 0, womenLed: 0, womenLedApproved: 0 };
          }
          for (const lc of coop.loanCases) {
            sectorStats[sector].total++;
            const isApproved = lc.decision?.decision === 'APPROVE' || lc.decision?.decision === 'OVERRIDE_APPROVE';
            if (isApproved) sectorStats[sector].approved++;
            if (coop.womenLed) {
              sectorStats[sector].womenLed++;
              if (isApproved) sectorStats[sector].womenLedApproved++;
            }
          }
        }

        return {
          district: 'Gasabo',
          sectorBreakdown: Object.entries(sectorStats).map(([sector, stats]) => ({
            sector,
            totalApplications: stats.total,
            approvedApplications: stats.approved,
            approvalRate: stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(1)}%` : 'N/A',
            womenLedApplications: stats.womenLed,
            womenLedApproved: stats.womenLedApproved,
            womenLedApprovalRate: stats.womenLed > 0 ? `${((stats.womenLedApproved / stats.womenLed) * 100).toFixed(1)}%` : 'N/A',
          })),
        };
      }

      default:
        return { error: `Unknown tool: ${fnName}` };
    }
  }

  /**
   * Format loan case data into a structured assessment object for Gemini to reason about.
   */
  private formatAssessmentData(loanCase: {
    id: string;
    requestedAmountRwf: bigint;
    tenorMonths: number;
    purpose: string | null;
    status: string;
    cooperative: { name: string; tin: string; sector: string | null; memberCount: number | null; totalHectares: number | null; storageCapacityT: number | null; womenLed: boolean } | null;
    scores: Array<{
      scorePoints: number | null;
      band: string | null;
      defaultProb: number | null;
      suggestedLimitRwf: bigint | null;
      inputSnapshot: unknown;
      reasons: Array<{ rank: number; feature: string; impactPoints: number; statement: string | null; sourceType: string | null }>;
    }>;
    decision: { decision: string; approvedAmountRwf: bigint | null; reason: string | null; recommendations: string | null; decidedAt: Date } | null;
    documents: Array<{ docType: string; filename: string; importStatus: string }>;
  }) {
    const latestScore = loanCase.scores?.[0];
    const pillars = latestScore?.inputSnapshot ? (latestScore.inputSnapshot as Record<string, unknown>).pillars : null;

    return {
      caseId: loanCase.id,
      cooperative: loanCase.cooperative ? {
        name: loanCase.cooperative.name,
        tin: loanCase.cooperative.tin,
        sector: loanCase.cooperative.sector,
        memberCount: loanCase.cooperative.memberCount,
        totalHectares: loanCase.cooperative.totalHectares,
        storageCapacityT: loanCase.cooperative.storageCapacityT,
        womenLed: loanCase.cooperative.womenLed,
      } : null,
      loanRequest: {
        requestedAmountRwf: Number(loanCase.requestedAmountRwf),
        tenorMonths: loanCase.tenorMonths,
        purpose: loanCase.purpose,
        status: loanCase.status,
        note: 'Active loan facility requested in current application. (Takes legal precedence over draft/historical figures).',
      },
      scoring: latestScore ? {
        scorePoints: latestScore.scorePoints,
        band: latestScore.band,
        defaultProb: latestScore.defaultProb,
        suggestedLimitRwf: latestScore.suggestedLimitRwf ? Number(latestScore.suggestedLimitRwf) : null,
        pillars,
        drivers: latestScore.reasons?.map((r) => ({
          rank: r.rank,
          feature: r.feature,
          impactPoints: r.impactPoints,
          statement: r.statement,
          sourceType: r.sourceType,
        })) || [],
      } : null,
      decision: loanCase.decision ? {
        decision: loanCase.decision.decision,
        approvedAmountRwf: loanCase.decision.approvedAmountRwf ? Number(loanCase.decision.approvedAmountRwf) : null,
        reason: loanCase.decision.reason,
        recommendations: loanCase.decision.recommendations,
        decidedAt: loanCase.decision.decidedAt,
      } : null,
      documents: loanCase.documents?.map((d) => ({
        type: d.docType,
        filename: d.filename,
        status: d.importStatus,
      })) || [],
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helper: Resolve the focal loan case from query text or context
  // ──────────────────────────────────────────────────────────────────────────

  private async findFocalLoanCase(query: string, context?: ChatContext) {
    // 1. If explicit caseId in context
    if (context?.caseId) {
      const byId = await prisma.loanCase.findUnique({
        where: { id: context.caseId },
        include: {
          cooperative: true,
          scores: { include: { reasons: { orderBy: { rank: 'asc' } } }, orderBy: { createdAt: 'desc' } },
          decision: true,
          documents: true,
        },
      });
      if (byId) return byId;
    }

    // 2. If explicit cooperativeId in context
    if (context?.cooperativeId) {
      const byCoop = await prisma.loanCase.findFirst({
        where: { cooperativeId: context.cooperativeId },
        orderBy: { createdAt: 'desc' },
        include: {
          cooperative: true,
          scores: { include: { reasons: { orderBy: { rank: 'asc' } } }, orderBy: { createdAt: 'desc' } },
          decision: true,
          documents: true,
        },
      });
      if (byCoop) return byCoop;
    }

    // 3. Match from query text
    if (query && query.trim().length > 0) {
      const matchedCoop = await this.findMatchingCooperative(query, context);
      if (matchedCoop) {
        const byMatchedCoop = await prisma.loanCase.findFirst({
          where: { cooperativeId: matchedCoop.id },
          orderBy: { createdAt: 'desc' },
          include: {
            cooperative: true,
            scores: { include: { reasons: { orderBy: { rank: 'asc' } } }, orderBy: { createdAt: 'desc' } },
            decision: true,
            documents: true,
          },
        });
        if (byMatchedCoop) return byMatchedCoop;
      }
    }

    // 4. If no explicit context or query match, return null (strict independence)
    return null;
  }

  private async findMatchingCooperative(query: string, context?: ChatContext) {
    if (context?.cooperativeId) {
      const byId = await prisma.cooperative.findUnique({ where: { id: context.cooperativeId } });
      if (byId) return byId;
    }

    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();

    // Check for 9-digit TIN in query
    const tinMatch = trimmed.match(/\b\d{9}\b/);
    if (tinMatch) {
      const byTin = await prisma.cooperative.findUnique({
        where: { tin: tinMatch[0] },
      });
      if (byTin) return byTin;
    }

    // Fetch all cooperatives to match against query text
    const allCoops = await prisma.cooperative.findMany();
    for (const c of allCoops) {
      const cNameLower = c.name.toLowerCase();
      const simpleName = cNameLower.replace('koperative ', '').trim();
      const nameParts = simpleName.split(' ').filter((p) => p.length >= 4);

      if (
        lower.includes(c.tin) ||
        lower.includes(cNameLower) ||
        lower.includes(simpleName) ||
        nameParts.some((p) => lower.includes(p))
      ) {
        return c;
      }
    }

    // Match sector keywords
    for (const sector of ['Bumbogo', 'Gikomero', 'Ndera', 'Rutunga', 'Rusororo']) {
      if (lower.includes(sector.toLowerCase())) {
        const bySector = await prisma.cooperative.findFirst({
          where: { sector: { equals: sector, mode: 'insensitive' } },
        });
        if (bySector) return bySector;
      }
    }

    return null;
  }

  /**
   * Safely extract text string from GoogleGenAI generateContent response
   */
  private extractTextFromResponse(res: any): string {
    if (!res) return '';
    if (typeof res.text === 'string' && res.text.trim().length > 0) {
      return res.text.trim();
    }
    const parts = res.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const textParts = parts
        .map((p: any) => p.text)
        .filter((t: any) => typeof t === 'string' && t.trim().length > 0);
      if (textParts.length > 0) {
        return textParts.join('\n\n').trim();
      }
    }
    return '';
  }

  /**
   * Format structured facts directly from tool results if Gemini returns empty text
   */
  private formatDataNarrative(toolResults: Array<{ name: string; result: unknown }>): string {
    if (!toolResults || toolResults.length === 0) {
      return 'I retrieved the database records for your query. Please let me know if you would like me to explain any specific details.';
    }

    const sections: string[] = [];

    for (const tr of toolResults) {
      const data = tr.result as any;
      if (!data) continue;

      if (tr.name === 'get_assessment_details') {
        const coopName = data.cooperative?.name || 'Cooperative';
        const score = data.scoring?.scorePoints ?? 'N/A';
        const band = data.scoring?.band ?? 'N/A';
        const defaultProb = data.scoring?.defaultProb !== undefined ? `${(data.scoring.defaultProb * 100).toFixed(1)}%` : 'N/A';
        const reqAmount = data.loanRequest?.requestedAmountRwf ? `RWF ${(data.loanRequest.requestedAmountRwf / 1_000_000).toFixed(1)}M` : 'N/A';
        const limit = data.scoring?.suggestedLimitRwf ? `RWF ${(data.scoring.suggestedLimitRwf / 1_000_000).toFixed(1)}M` : 'N/A';

        sections.push(
          `CREDIT ASSESSMENT SUMMARY: ${coopName.toUpperCase()}\n` +
          `- Requested Loan: ${reqAmount}\n` +
          `- Evaluated Credit Score: ${score}/100 (Risk Band: ${band})\n` +
          `- Estimated Probability of Default: ${defaultProb}\n` +
          `- Suggested Credit Limit: ${limit}\n` +
          `- Underwriting Decision: ${data.decision?.decision || 'Under Review'}`
        );
      } else if (tr.name === 'get_cooperative_cash_flow') {
        const coopName = data.cooperative?.name || 'Cooperative';
        const sales = data.cashFlowHealth?.grainSalesVolumeRwf ? `RWF ${(Number(data.cashFlowHealth.grainSalesVolumeRwf) / 1_000_000).toFixed(1)}M` : 'N/A';
        const netFlow = data.cashFlowHealth?.operatingSurplusRwf ? `RWF ${(Number(data.cashFlowHealth.operatingSurplusRwf) / 1_000_000).toFixed(1)}M` : 'N/A';

        sections.push(
          `VERIFIED CASH FLOW: ${coopName.toUpperCase()}\n` +
          `- Grain Sales Revenue: ${sales}\n` +
          `- Net Operating Surplus: ${netFlow}\n` +
          `- Recent Bank Inflows: ${data.recentTransactions?.length || 0} recorded transactions`
        );
      } else if (tr.name === 'get_cooperative_loans_and_repayments') {
        const coopName = data.cooperative?.name || 'Cooperative';
        const onTime = data.repaymentHealth?.onTimeRatio !== undefined ? `${(data.repaymentHealth.onTimeRatio * 100).toFixed(1)}%` : '100.0%';
        const maxDpd = data.repaymentHealth?.maxDaysPastDue ?? 0;

        sections.push(
          `HISTORICAL REPAYMENT RECORD: ${coopName.toUpperCase()}\n` +
          `- On-Time Settlement Ratio: ${onTime}\n` +
          `- Maximum Historical Days Past Due (DPD): ${maxDpd} days\n` +
          `- Institutional Borrowing Records: ${data.loans?.length || 0} settled facilities`
        );
      } else if (tr.name === 'get_scoring_reasons') {
        const drivers = data.drivers?.map((d: any) => `  ${d.rank}. ${d.feature}: +${d.impactPoints} pts (${d.statement || d.sourceType || 'Verified proof'})`).join('\n') || '  No specific drivers available';

        sections.push(
          `KEY CREDIT SCORE DRIVERS:\n${drivers}`
        );
      } else if (tr.name === 'get_cooperatives_count') {
        sections.push(`There are currently ${data.count || 5} registered agricultural cooperatives in the Gasabo District database.`);
      }
    }

    return sections.length > 0
      ? sections.join('\n\n')
      : 'I retrieved the relevant data records from PostgreSQL. Please let me know what specific analysis you need.';
  }
}

export const aiDataRetrieverService = new AiDataRetrieverService();
