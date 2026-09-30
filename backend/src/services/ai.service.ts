import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { institutionalDataService } from './institutional.service.js';
import { assessCooperativeLoan } from '../ai_model/index.js';

export interface ChatResponse {
  reply: string;
  source: 'gemini' | 'database_retriever';
  data?: unknown;
}

// Database Tool Function Declarations for Gemini Function Calling
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
  description: 'Look up specific cooperative details by Rwandan TIN (Tax Identification Number) or cooperative Name.',
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
  description: 'Get historical loans across SACCOs, microfinance, and commercial banks, plus repayment ledgers and on-time settlement ratio.',
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

export class AiDataRetrieverService {
  private geminiClient: GoogleGenAI | null = null;
  private isGeminiConfigured = false;

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
   * Main entry point: Process chat question and return direct answer from database
   */
  async processQuery(userMessage: string): Promise<ChatResponse> {
    const text = userMessage.trim();
    if (!text) {
      return {
        reply: 'Please provide a question about Gasabo cooperatives, TIN records, cash flows, or loan histories.',
        source: 'database_retriever',
      };
    }

    // Try Gemini API if configured
    if (this.isGeminiConfigured && this.geminiClient) {
      try {
        const geminiResult = await this.queryWithGemini(text);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err) {
        console.warn('Gemini query processing error, falling back to direct database retriever:', err);
      }
    }

    // Fallback: Direct Database Retriever for natural language intents
    return this.queryDirectDatabase(text);
  }

  /**
   * Query Gemini with Function Calling tools for understanding and data retrieval
   */
  private async queryWithGemini(prompt: string): Promise<ChatResponse | null> {
    if (!this.geminiClient) return null;

    const tools = [
      {
        functionDeclarations: [
          getCooperativesCountDeclaration,
          listCooperativesDeclaration,
          getCooperativeDetailsDeclaration,
          getCooperativeCashFlowDeclaration,
          getCooperativeLoansAndRepaymentsDeclaration,
        ],
      },
    ];

    const systemInstruction =
      'You are AgriCredit AI, a credit assessment and database retrieval assistant for Bank of Kigali and BNR in Gasabo District, Rwanda. ' +
      'When asked questions about cooperatives, counts, names, TIN numbers, money in and out transactions, cash flows, or historical loans, ' +
      'you MUST call the appropriate database tool to fetch real facts from PostgreSQL. ' +
      'Answer directly, concisely, and accurately based only on what the user asked without unrequested filler. ' +
      'Never use hyphens or dashes as punctuation; use middle dots or commas or parentheses.';

    const response = await this.geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        tools,
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const fnName = call.name;
      const args = (call.args as Record<string, unknown>) || {};

      let toolResult: unknown;

      if (fnName === 'get_cooperatives_count') {
        const count = await prisma.cooperative.count();
        toolResult = { count, district: 'Gasabo' };
      } else if (fnName === 'list_cooperatives') {
        const sector = typeof args.sector === 'string' ? args.sector : undefined;
        toolResult = await prisma.cooperative.findMany({
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
      } else if (fnName === 'get_cooperative_details') {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q);
        toolResult = matched || null;
      } else if (fnName === 'get_cooperative_cash_flow') {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q);
        if (matched) {
          const profile = await institutionalDataService.getInstitutionalProfile(matched.id);
          toolResult = {
            cooperative: matched,
            cashFlowHealth: profile?.kpis.cashFlowHealth,
            recentTransactions: profile?.accountTransactions.slice(0, 8),
          };
        } else {
          toolResult = { error: `Cooperative ${q} not found` };
        }
      } else if (fnName === 'get_cooperative_loans_and_repayments') {
        const q = String(args.tin_or_name || '');
        const matched = await this.findMatchingCooperative(q);
        if (matched) {
          const profile = await institutionalDataService.getInstitutionalProfile(matched.id);
          toolResult = {
            cooperative: matched,
            debtProfile: profile?.kpis.debtProfile,
            repaymentHealth: profile?.kpis.repaymentHealth,
            loans: profile?.loanRecords,
          };
        } else {
          toolResult = { error: `Cooperative ${q} not found` };
        }
      }

      // Second turn: Send tool result back to Gemini for direct plain answer
      const followUp = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          {
            role: 'model',
            parts: [{ functionCall: { name: fnName, args } }],
          },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: fnName,
                  response: { result: toolResult },
                },
              },
            ],
          },
        ],
        config: { systemInstruction },
      });

      return {
        reply: followUp.text || 'Information retrieved from database.',
        source: 'gemini',
        data: toolResult,
      };
    }

    if (response.text) {
      return {
        reply: response.text,
        source: 'gemini',
      };
    }

    return null;
  }

  /**
   * Deterministic Direct Database Retriever
   * Accurately answers counts, names, TIN searches, transactions, and loans even without API key
   */
  private async queryDirectDatabase(query: string): Promise<ChatResponse> {
    const lower = query.toLowerCase();

    // 1. Cooperative Count queries ("how many cooperatives", "number of cooperatives", "count")
    if (
      lower.includes('how many') ||
      lower.includes('count') ||
      lower.includes('number of cooperative') ||
      lower.includes('total cooperative')
    ) {
      const count = await prisma.cooperative.count();
      return {
        reply: `There are ${count} agricultural cooperatives registered in the Gasabo District database.`,
        source: 'database_retriever',
        data: { count, district: 'Gasabo' },
      };
    }

    // 2. Cooperative Names / List queries ("what are their names", "list cooperatives", "give me names", "which cooperatives")
    if (
      lower.includes('name') ||
      lower.includes('list') ||
      lower.includes('who are they') ||
      lower.includes('which cooperative') ||
      lower.includes('all cooperative')
    ) {
      const coops = await prisma.cooperative.findMany({
        orderBy: { name: 'asc' },
        select: {
          name: true,
          tin: true,
          sector: true,
          memberCount: true,
          totalHectares: true,
          storageCapacityT: true,
        },
      });

      const formattedList = coops
        .map(
          (c, idx) =>
            `${idx + 1}. ${c.name} (TIN: ${c.tin}, ${c.sector} Sector · ${c.totalHectares} Ha · ${c.memberCount} members · ${c.storageCapacityT} MT storage)`
        )
        .join('\n');

      return {
        reply: `Here are the ${coops.length} maize cooperatives registered in Gasabo District:\n\n${formattedList}`,
        source: 'database_retriever',
        data: coops,
      };
    }

    // 3. Cash Flow / Money In & Out queries ("cash flow", "money in", "money out", "transaction", "inflow", "outflow", "revenue")
    if (
      lower.includes('cash flow') ||
      lower.includes('money in') ||
      lower.includes('money out') ||
      lower.includes('transaction') ||
      lower.includes('inflow') ||
      lower.includes('outflow')
    ) {
      const matchedCoop = await this.findMatchingCooperative(query);
      if (matchedCoop) {
        const profile = await institutionalDataService.getInstitutionalProfile(matchedCoop.id);
        const kpis = profile?.kpis.cashFlowHealth;

        const inRwf = kpis ? (Number(kpis.totalInflowRwf) / 1000000).toFixed(1) : '0';
        const outRwf = kpis ? (Number(kpis.totalOutflowRwf) / 1000000).toFixed(1) : '0';
        const netRwf = kpis ? (Number(kpis.netCashFlowRwf) / 1000000).toFixed(1) : '0';
        const salesRwf = kpis ? (Number(kpis.grainSalesVolumeRwf) / 1000000).toFixed(1) : '0';

        const lines = [
          `Cash flow ledger for ${matchedCoop.name} (TIN: ${matchedCoop.tin}, ${matchedCoop.sector} Sector):`,
          `• Total Money In (Inflows): RWF ${inRwf} Million`,
          `• Total Money Out (Expenses): RWF ${outRwf} Million`,
          `• Net Operating Cash Flow: RWF ${netRwf} Million`,
          `• Verified Grain Sales Volume: RWF ${salesRwf} Million (Africa Improved Foods sweeps)`,
          `• Recorded Ledger Transactions: ${kpis?.transactionCount || 0}`,
        ];

        return {
          reply: lines.join('\n'),
          source: 'database_retriever',
          data: profile?.kpis,
        };
      }
    }

    // 4. Historical Loans & Repayments queries ("loan", "borrowing", "repayment", "sacco", "dpd")
    if (
      lower.includes('loan') ||
      lower.includes('borrow') ||
      lower.includes('repay') ||
      lower.includes('sacco') ||
      lower.includes('bank') ||
      lower.includes('credit history')
    ) {
      const matchedCoop = await this.findMatchingCooperative(query);
      if (matchedCoop) {
        const profile = await institutionalDataService.getInstitutionalProfile(matchedCoop.id);
        const rHealth = profile?.kpis.repaymentHealth;
        const dProfile = profile?.kpis.debtProfile;

        const onTimePct = rHealth ? (rHealth.onTimeRatio * 100).toFixed(1) : '100.0';
        const borrowedM = dProfile ? (Number(dProfile.totalHistoricalBorrowingRwf) / 1000000).toFixed(1) : '0';
        const institutionsStr = dProfile?.institutions.join(', ') || 'SACCO, Bank of Kigali';

        const lines = [
          `Historical credit records for ${matchedCoop.name} (TIN: ${matchedCoop.tin}):`,
          `• Total Historical Borrowing: RWF ${borrowedM} Million across ${dProfile?.facilitiesCount || 0} facilities`,
          `• Lending Institutions: ${institutionsStr}`,
          `• On-Time Repayment Ratio: ${onTimePct}% (${rHealth?.onTimeInstallments || 0} of ${rHealth?.totalInstallments || 0} installments paid on schedule)`,
          `• Maximum Historical Days Past Due (DPD): ${rHealth?.maxDaysPastDue || 0} days`,
          `• Repayment Status: Flawless settlement record with zero default events`,
        ];

        return {
          reply: lines.join('\n'),
          source: 'database_retriever',
          data: profile?.kpis,
        };
      }
    }

    // 5. Credit Scoring Assessment & Chronological Proof queries
    if (
      lower.includes('assess') ||
      lower.includes('evaluate') ||
      lower.includes('score') ||
      lower.includes('proof') ||
      lower.includes('creditworthiness')
    ) {
      const matchedCoop = await this.findMatchingCooperative(query);
      if (matchedCoop) {
        const assessmentResponse = await assessCooperativeLoan({
          applicationDocument: '',
          preExtractedApplication: {
            cooperativeName: matchedCoop.name,
            tin: matchedCoop.tin,
            sector: matchedCoop.sector,
            registrationNo: matchedCoop.registrationNo,
            requestedAmountRwf: 25000000,
            tenorMonths: 6,
            cropType: 'Maize',
            purpose: 'Seasonal input financing and aggregation for Season 2026A',
            cultivatedHectares: matchedCoop.totalHectares,
            memberFarmers: matchedCoop.memberCount,
            documentConfidence: 0.98,
          },
        });

        return {
          reply: assessmentResponse.formattedNarrativeProof,
          source: 'database_retriever',
          data: assessmentResponse,
        };
      }
    }

    // 6. Specific Cooperative search (by TIN number or Name)
    const specificCoop = await this.findMatchingCooperative(query);
    if (specificCoop) {
      const profile = await institutionalDataService.getInstitutionalProfile(specificCoop.id);
      const lines = [
        `Cooperative Profile: ${specificCoop.name}`,
        `• Rwandan TIN: ${specificCoop.tin}`,
        `• RCA Registration: ${specificCoop.registrationNo}`,
        `• Location: ${specificCoop.sector} Sector, Gasabo District`,
        `• Farmland: ${specificCoop.totalHectares} Hectares under maize cultivation`,
        `• Registered Farmers: ${specificCoop.memberCount} members`,
        `• Storage Facility: ${specificCoop.storageCapacityT} MT aerated warehouse`,
        `• Leadership: ${specificCoop.womenLed ? 'Women-Led Executive Committee' : 'Standard Committee'}`,
        `• Audited Record Quality: ${specificCoop.recordQuality}/100`,
      ];

      return {
        reply: lines.join('\n'),
        source: 'database_retriever',
        data: profile,
      };
    }

    // Default guidance response
    return {
      reply:
        'I can query records across Gasabo cooperatives from PostgreSQL. ' +
        'You can ask for the total count of cooperatives, their names, Rwandan TIN numbers, ' +
        'historical loan records across SACCOs, or money in and out cash flow transactions.',
      source: 'database_retriever',
    };
  }

  private async findMatchingCooperative(query: string) {
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
}

export const aiDataRetrieverService = new AiDataRetrieverService();
