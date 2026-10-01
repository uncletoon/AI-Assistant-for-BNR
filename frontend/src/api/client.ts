/**
 * AgriCredit AI API Client
 * Connects frontend directly to Express backend under /api/v1
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
  };
}

export interface CooperativeRecord {
  id: string;
  name: string;
  registrationNo: string;
  district: string;
  sector: string;
  yearFounded: number;
  memberCount: number;
  totalHectares: number;
  storageCapacityT: number;
  womenLed: boolean;
  hasDigitalHistory: boolean;
  recordQuality: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreReasonItem {
  id: string;
  rank: number;
  feature: string;
  impactPoints: number;
  shapValue?: number | null;
  statement: string;
  sourceType: string;
  recordIds: string[];
  documentSource?: string | null;
  messageEn: string;
}

export interface ScoreItem {
  id: string;
  loanCaseId: string;
  defaultProb: number;
  band: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'INSUFFICIENT_DATA';
  scorePoints: number;
  suggestedLimitRwf: string;
  uncertaintyFlag: boolean;
  isWhatIf: boolean;
  createdAt: string;
  reasons: ScoreReasonItem[];
}

export interface LoanCaseRecord {
  id: string;
  cooperativeId: string;
  lenderId: string | null;
  requestedAmountRwf: string;
  tenorMonths: number;
  purpose: string;
  status: 'DRAFT' | 'DOCUMENTS_COMPLETE' | 'SCORED' | 'DECIDED';
  createdAt: string;
  updatedAt: string;
  cooperative: CooperativeRecord;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  scores: ScoreItem[];
  decision?: {
    id: string;
    decision: 'APPROVE' | 'REJECT' | 'OVERRIDE_APPROVE' | 'OVERRIDE_REJECT';
    approvedAmountRwf: string;
    reason: string | null;
    recommendations: string | null;
    decidedAt: string;
  } | null;
}

export interface FairnessSummaryRow {
  women_led: boolean;
  sector: string;
  has_digital_history: boolean;
  total_cases: number;
  avg_default_prob: string | null;
  approval_rate: string;
}

const BASE_URL = '/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>('/health');
  },

  async getCooperatives(params?: { district?: string; sector?: string; search?: string }): Promise<{ status: string; data: CooperativeRecord[] }> {
    const searchParams = new URLSearchParams();
    if (params?.district) searchParams.set('district', params.district);
    if (params?.sector) searchParams.set('sector', params.sector);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = query ? `/cooperatives?${query}` : '/cooperatives';
    return fetchJson<{ status: string; data: CooperativeRecord[] }>(endpoint);
  },

  async getCooperative(id: string): Promise<{ status: string; data: CooperativeRecord }> {
    return fetchJson<{ status: string; data: CooperativeRecord }>(`/cooperatives/${id}`);
  },

  async getLoanCases(params?: { status?: string; band?: string }): Promise<{ status: string; data: LoanCaseRecord[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.band) searchParams.set('band', params.band);

    const query = searchParams.toString();
    const endpoint = query ? `/cases?${query}` : '/cases';
    return fetchJson<{ status: string; data: LoanCaseRecord[] }>(endpoint);
  },

  async getLoanCase(id: string): Promise<{ status: string; data: LoanCaseRecord }> {
    return fetchJson<{ status: string; data: LoanCaseRecord }>(`/cases/${id}`);
  },

  async getFairnessSummary(): Promise<{ status: string; data: FairnessSummaryRow[] }> {
    return fetchJson<{ status: string; data: FairnessSummaryRow[] }>('/monitoring/fairness');
  },

  async sendChatMessage(
    message: string,
    context?: {
      caseId?: string;
      cooperativeId?: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }
  ): Promise<ChatApiResponse> {
    return fetchJson<ChatApiResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },

  async evaluateLoan(payload: {
    applicationText?: string;
    offtakeText?: string;
    applicationData?: unknown;
    offtakeData?: unknown;
  }): Promise<{ status: string; data: unknown }> {
    return fetchJson<{ status: string; data: unknown }>('/scoring/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async scoreCase(caseId: string): Promise<{ status: string; data: unknown }> {
    return fetchJson<{ status: string; data: unknown }>(`/scoring/cases/${caseId}/score`, {
      method: 'POST',
    });
  },

  async extractDocuments(formData: FormData): Promise<{
    status: string;
    data: {
      extractedApplication: any;
      extractedOfftake?: any;
    };
  }> {
    return fetchJson('/scoring/extract', {
      method: 'POST',
      body: formData,
    });
  },

  async evaluateLoanMultipart(formData: FormData): Promise<{ status: string; data: any }> {
    return fetchJson('/scoring/evaluate', {
      method: 'POST',
      body: formData,
    });
  },

  async simulateScenario(
    caseId: string,
    payload: {
      requestedAmountRwf?: string;
      tenorMonths?: number;
      contractedVolumeKg?: number;
      agreedPriceRwfKg?: number;
      hasVerifiedOfftakeContract?: boolean;
      cultivatedHectares?: number;
      storageFacilityType?: string;
      season?: string;
    }
  ): Promise<{ status: string; data: any }> {
    return fetchJson(`/scoring/cases/${caseId}/simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recordDecision(
    caseId: string,
    payload: {
      decision: 'APPROVE' | 'REJECT' | 'OVERRIDE_APPROVE' | 'OVERRIDE_REJECT';
      approvedAmountRwf?: string;
      reason?: string;
      recommendations?: string;
      decidedBy?: string;
    }
  ): Promise<{ status: string; data: unknown }> {
    return fetchJson<{ status: string; data: unknown }>(`/scoring/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteLoanCase(caseId: string): Promise<{ status: string; message: string }> {
    return fetchJson<{ status: string; message: string }>(`/scoring/cases/${caseId}`, {
      method: 'DELETE',
    });
  },

  async deleteAllLoanCases(): Promise<{ status: string; message: string }> {
    return fetchJson<{ status: string; message: string }>('/scoring/cases', {
      method: 'DELETE',
    });
  },
};

export interface ChatApiResponse {
  status: 'success' | 'error';
  reply: string;
  source: string;
  data?: unknown;
}
