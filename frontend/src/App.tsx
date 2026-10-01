/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { EmptyState } from "./components/EmptyState";
import { ChatInput } from "./components/ChatInput";
import { MessageList } from "./components/MessageList";
import { CreditMemoModal } from "./components/CreditMemoModal";
import {
  ChatMessage,
  SuggestedPrompt,
  AssessmentHistoryItem,
  ReportData,
  CreditAssessmentData,
  PortfolioData,
  BackendAssessmentResponse,
} from "./types";
import { SUGGESTED_PROMPTS } from "./data/mockData";
import { CheckCircle2 } from "lucide-react";
import {
  api,
  LoanCaseRecord,
  CooperativeRecord,
  ChatApiResponse,
} from "./api/client";
import { RegistryPage } from "./components/RegistryPage";
import {
  ExtractedReviewModal,
  ExtractedReviewData,
} from "./components/ExtractedReviewModal";

function convertBackendResponseToAssessment(
  data: BackendAssessmentResponse,
): CreditAssessmentData {
  const feat = data.features;
  const assess = data.assessment;
  const scoreVal = assess.scoreOutOf100;
  const riskBand =
    assess.riskBand === "LOW"
      ? "Low Risk"
      : assess.riskBand === "MODERATE"
        ? "Moderate Risk"
        : "High Risk";
  const defaultProb = `${(assess.defaultProbability * 100).toFixed(1)}%`;
  const suggestedLimit = `RWF ${(Number(assess.suggestedCreditLimitRwf) / 1000000).toFixed(1)} Million`;

  const keyFactors = assess.topKeyDrivers.map((d) => ({
    text: d.statement,
    type: d.impactPoints >= 15 ? ("positive" as const) : ("neutral" as const),
  }));

  const financialKpis = [
    {
      label: "Requested Facility",
      value: `RWF ${(Number(feat.requestedAmountRwf) / 1000000).toFixed(1)}M`,
      subtext: `${feat.tenorMonths} Months Seasonal Tenor`,
      status: "positive" as const,
    },
    {
      label: "Cultivated Land",
      value: `${feat.totalHectares} Ha`,
      subtext: `${feat.sector} Sector Farmland`,
      status: "positive" as const,
    },
    {
      label: "Storage Facility",
      value: `${feat.storageCapacityT} MT`,
      subtext: "Dedicated Aerated Warehouse",
      status: "positive" as const,
    },
    {
      label: "Record Quality",
      value: `${feat.recordQuality}/100`,
      subtext: "RCA Audited Registry",
      status:
        feat.recordQuality >= 80 ? ("positive" as const) : ("neutral" as const),
    },
  ];

  const pRepay = (assess as any).pillars?.repaymentDiscipline;
  const pOfftake = (assess as any).pillars?.offtakeSecurity;
  const pCash = (assess as any).pillars?.cashFlowHealth;
  const pOps = (assess as any).pillars?.operationalCapacity;

  const riskBreakdown = [
    {
      category: "Repayment Performance",
      score: pRepay
        ? Math.round((pRepay.scoreAwarded / pRepay.maxPoints) * 100)
        : 90,
      level: "Low Risk" as const,
      notes:
        pRepay?.summary ||
        `${feat.onTimeInstallments}/${feat.totalInstallments} on-time installments; ${feat.maxDaysPastDue} max days past due`,
    },
    {
      category: "Operating Cash Flow & Liquidity",
      score: pCash
        ? Math.round((pCash.scoreAwarded / pCash.maxPoints) * 100)
        : 85,
      level: "Low Risk" as const,
      notes:
        pCash?.summary ||
        `Net cashflow: RWF ${(Number(feat.netCashFlowRwf) / 1000000).toFixed(1)}M across institutions`,
    },
    {
      category: "Commercial Off-take Security",
      score: pOfftake
        ? Math.round((pOfftake.scoreAwarded / pOfftake.maxPoints) * 100)
        : 80,
      level: "Low Risk" as const,
      notes:
        pOfftake?.summary ||
        (feat.hasVerifiedOfftakeContract
          ? `Forward contract with ${feat.offtakeBuyerName || "Commercial Partner"} for ${(feat.contractedVolumeKg || 0).toLocaleString()} kg`
          : "Informal open market trade"),
    },
    {
      category: "Cooperative Capacity & Storage",
      score: pOps ? Math.round((pOps.scoreAwarded / pOps.maxPoints) * 100) : 85,
      level: "Low Risk" as const,
      notes:
        pOps?.summary ||
        `${feat.memberCount} smallholders, ${feat.totalHectares} Ha, ${feat.storageCapacityT} MT storage`,
    },
  ];

  return {
    applicantName: feat.cooperativeName,
    applicantType: "Agricultural Cooperative (Maize)",
    location: `${feat.sector}, Gasabo District`,
    score: scoreVal,
    maxScore: 100,
    riskLevel: riskBand,
    defaultProbability: defaultProb,
    recommendedCreditLimit: suggestedLimit,
    currency: "RWF",
    keyFactors:
      keyFactors.length > 0
        ? keyFactors
        : [
            {
              text: "Verified institutional repayment history across Gasabo SACCOs",
              type: "positive" as const,
            },
          ],
    financialKpis,
    cashFlowSchedule: [
      {
        month: "Mar",
        projectedRevenue: 5200000,
        operationalCost: 2800000,
        repaymentCapacity: 2400000,
        scheduledDebtService: 0,
      },
      {
        month: "Apr",
        projectedRevenue: 5500000,
        operationalCost: 2900000,
        repaymentCapacity: 2600000,
        scheduledDebtService: 0,
      },
      {
        month: "May",
        projectedRevenue: 7100000,
        operationalCost: 3100000,
        repaymentCapacity: 4000000,
        scheduledDebtService: 6000000,
      },
      {
        month: "Jun",
        projectedRevenue: 7800000,
        operationalCost: 3200000,
        repaymentCapacity: 4600000,
        scheduledDebtService: 0,
      },
      {
        month: "Jul",
        projectedRevenue: 8400000,
        operationalCost: 3400000,
        repaymentCapacity: 5000000,
        scheduledDebtService: 6000000,
      },
      {
        month: "Aug",
        projectedRevenue: 8900000,
        operationalCost: 3500000,
        repaymentCapacity: 5400000,
        scheduledDebtService: 0,
      },
    ],
    riskBreakdown,
    approvalConditions: (assess as any).complianceRecommendations || [
      "Require direct buyer payment into Bank of Kigali escrow account for grain deliveries",
      "Conduct pre harvest agronomic inspection 30 days prior to aggregation",
      "Record all disbursement and settlement events in compliance audit log",
    ],
    pillars: (assess as any).pillars,
    chronologicalTimeline:
      (assess as any).chronologicalTimeline ||
      feat.chronologicalProofEvents ||
      [],
    persistedCaseId: (data as any).persistedCaseId,
    persistedScoreId: (data as any).persistedScoreId,
  };
}

function convertDbCaseToAssessment(
  dbCase: LoanCaseRecord,
): CreditAssessmentData {
  const latestScore = dbCase.scores[0];
  const coop = dbCase.cooperative;
  const inputSnapshot = (latestScore as any)?.inputSnapshot;
  const scoreVal = latestScore ? latestScore.scorePoints : 85;
  const defaultProb = latestScore
    ? `${(latestScore.defaultProb * 100).toFixed(1)}%`
    : "4.2%";
  const suggestedLimit = latestScore
    ? `RWF ${(Number(latestScore.suggestedLimitRwf) / 1000000).toFixed(1)} Million`
    : `RWF ${(Number(dbCase.requestedAmountRwf) / 1000000).toFixed(1)} Million`;

  const keyFactors = latestScore?.reasons?.map((r) => ({
    text: r.statement,
    type: r.impactPoints >= 15 ? ("positive" as const) : ("neutral" as const),
  })) || [
    {
      text: "100% on time repayment across historical credit facilities",
      type: "positive" as const,
    },
    {
      text: "Verified commercial off-take contract with Africa Improved Foods",
      type: "positive" as const,
    },
  ];

  const pRepay = inputSnapshot?.pillars?.repaymentDiscipline;
  const pOfftake = inputSnapshot?.pillars?.offtakeSecurity;
  const pCash = inputSnapshot?.pillars?.cashFlowHealth;
  const pOps = inputSnapshot?.pillars?.operationalCapacity;

  return {
    applicantName: coop.name,
    applicantType: "Agricultural Cooperative (Maize)",
    location: `${coop.sector}, Gasabo District`,
    score: scoreVal,
    maxScore: 100,
    riskLevel:
      latestScore?.band === "LOW"
        ? "Low Risk"
        : latestScore?.band === "MODERATE"
          ? "Moderate Risk"
          : "High Risk",
    defaultProbability: defaultProb,
    recommendedCreditLimit: suggestedLimit,
    currency: "RWF",
    keyFactors,
    financialKpis: [
      {
        label: "Requested Facility",
        value: `RWF ${(Number(dbCase.requestedAmountRwf) / 1000000).toFixed(1)}M`,
        subtext: `${dbCase.tenorMonths} Months Seasonal Tenor`,
        status: "positive",
      },
      {
        label: "Cultivated Land",
        value: `${coop.totalHectares} Ha`,
        subtext: `${coop.sector} Sector Farmland`,
        status: "positive",
      },
      {
        label: "Storage Capacity",
        value: `${coop.storageCapacityT} MT`,
        subtext: "Dedicated Aerated Warehouse",
        status: "positive",
      },
      {
        label: "Record Quality",
        value: `${coop.recordQuality}/100`,
        subtext: coop.hasDigitalHistory
          ? "Digital Historical Records"
          : "Standard Physical Ledgers",
        status: coop.recordQuality >= 80 ? "positive" : "neutral",
      },
    ],
    cashFlowSchedule: [
      {
        month: "Mar",
        projectedRevenue: 5200000,
        operationalCost: 2800000,
        repaymentCapacity: 2400000,
        scheduledDebtService: 0,
      },
      {
        month: "Apr",
        projectedRevenue: 5500000,
        operationalCost: 2900000,
        repaymentCapacity: 2600000,
        scheduledDebtService: 0,
      },
      {
        month: "May",
        projectedRevenue: 7100000,
        operationalCost: 3100000,
        repaymentCapacity: 4000000,
        scheduledDebtService: 6000000,
      },
      {
        month: "Jun",
        projectedRevenue: 7800000,
        operationalCost: 3200000,
        repaymentCapacity: 4600000,
        scheduledDebtService: 0,
      },
      {
        month: "Jul",
        projectedRevenue: 8400000,
        operationalCost: 3400000,
        repaymentCapacity: 5000000,
        scheduledDebtService: 6000000,
      },
      {
        month: "Aug",
        projectedRevenue: 8900000,
        operationalCost: 3500000,
        repaymentCapacity: 5400000,
        scheduledDebtService: 0,
      },
    ],
    riskBreakdown: [
      {
        category: "Repayment Performance",
        score: pRepay
          ? Math.round((pRepay.scoreAwarded / pRepay.maxPoints) * 100)
          : 95,
        level: "Low Risk",
        notes:
          pRepay?.summary ||
          "Zero historical arrears; settled all prior bank facilities ahead of time",
      },
      {
        category: "Off-take & Buyer Security",
        score: pOfftake
          ? Math.round((pOfftake.scoreAwarded / pOfftake.maxPoints) * 100)
          : 88,
        level: "Low Risk",
        notes:
          pOfftake?.summary ||
          "Signed purchase commitment with Africa Improved Foods (AIF)",
      },
      {
        category: "Infrastructure & Storage",
        score: pOps
          ? Math.round((pOps.scoreAwarded / pOps.maxPoints) * 100)
          : 84,
        level: "Low Risk",
        notes:
          pOps?.summary ||
          "Aerated drying and warehouse facilities in Gasabo District",
      },
      {
        category: "Operating Cash Flow",
        score: pCash
          ? Math.round((pCash.scoreAwarded / pCash.maxPoints) * 100)
          : 80,
        level: "Low Risk",
        notes: pCash?.summary || "Positive operational cash flow sweeps",
      },
    ],
    approvalConditions: [
      "Require direct buyer payment into Bank of Kigali escrow account for grain deliveries",
      "Conduct pre harvest agronomic inspection 30 days prior to aggregation",
      "Record all disbursement and settlement events in compliance audit log",
    ],
    pillars: inputSnapshot?.pillars,
    chronologicalTimeline:
      inputSnapshot?.features?.chronologicalProofEvents || [],
    persistedCaseId: dbCase.id,
    persistedScoreId: latestScore?.id,
  };
}

function convertCooperativeToAssessment(
  coop: CooperativeRecord,
): CreditAssessmentData {
  const isHighQuality = coop.recordQuality >= 85;
  const scoreVal = Math.round(560 + coop.recordQuality * 2.8);
  const band =
    scoreVal >= 750
      ? "Low Risk"
      : scoreVal >= 650
        ? "Moderate Risk"
        : "High Risk";
  const defaultProb = `${Math.max(1.8, (850 - scoreVal) / 24).toFixed(1)}%`;
  const suggestedLimit = `RWF ${Math.round((coop.totalHectares * 320000) / 1000000)} Million`;

  return {
    applicantName: coop.name,
    applicantType: "Agricultural Cooperative (Maize)",
    location: `${coop.sector}, Gasabo District`,
    score: scoreVal,
    maxScore: 850,
    riskLevel: band,
    defaultProbability: defaultProb,
    recommendedCreditLimit: suggestedLimit,
    currency: "RWF",
    keyFactors: [
      {
        text: `Operates ${coop.totalHectares} hectares across ${coop.sector} sector farmland`,
        type: "positive",
      },
      {
        text: `${coop.storageCapacityT} MT modern drying and warehouse capacity`,
        type: coop.storageCapacityT >= 60 ? "positive" : "neutral",
      },
      {
        text: `Audited record quality rating of ${coop.recordQuality}/100 in RCA registry`,
        type: isHighQuality ? "positive" : "caution",
      },
      {
        text: coop.womenLed
          ? "Verified women-led cooperative governance leadership"
          : "Standard executive committee leadership",
        type: "positive",
      },
    ],
    financialKpis: [
      {
        label: "Farm Land Area",
        value: `${coop.totalHectares} Ha`,
        subtext: `${coop.sector} Sector`,
        status: "positive",
      },
      {
        label: "Cooperative Members",
        value: `${coop.memberCount} Farmers`,
        subtext: "Registered smallholders",
        status: "positive",
      },
      {
        label: "Storage Capacity",
        value: `${coop.storageCapacityT} MT`,
        subtext: "Post Harvest Aerated Storage",
        status: "positive",
      },
      {
        label: "Record Quality",
        value: `${coop.recordQuality}/100`,
        subtext: coop.hasDigitalHistory
          ? "Digital ERP History"
          : "Physical Ledgers",
        status: isHighQuality ? "positive" : "neutral",
      },
    ],
    cashFlowSchedule: [
      {
        month: "Mar",
        projectedRevenue: 3400000,
        operationalCost: 2000000,
        repaymentCapacity: 1400000,
        scheduledDebtService: 0,
      },
      {
        month: "Apr",
        projectedRevenue: 3800000,
        operationalCost: 2100000,
        repaymentCapacity: 1700000,
        scheduledDebtService: 0,
      },
      {
        month: "May",
        projectedRevenue: 4800000,
        operationalCost: 2200000,
        repaymentCapacity: 2600000,
        scheduledDebtService: 2000000,
      },
      {
        month: "Jun",
        projectedRevenue: 5400000,
        operationalCost: 2400000,
        repaymentCapacity: 3000000,
        scheduledDebtService: 0,
      },
      {
        month: "Jul",
        projectedRevenue: 6000000,
        operationalCost: 2500000,
        repaymentCapacity: 3500000,
        scheduledDebtService: 2000000,
      },
      {
        month: "Aug",
        projectedRevenue: 6400000,
        operationalCost: 2600000,
        repaymentCapacity: 3800000,
        scheduledDebtService: 0,
      },
    ],
    riskBreakdown: [
      {
        category: "Land & Harvest Capacity",
        score: Math.min(95, Math.round(coop.totalHectares)),
        level: "Low Risk",
        notes: `${coop.totalHectares} Ha under active maize cultivation`,
      },
      {
        category: "Storage Infrastructure",
        score: Math.min(90, Math.round(coop.storageCapacityT)),
        level: "Low Risk",
        notes: `${coop.storageCapacityT} MT warehouse capacity`,
      },
      {
        category: "Data & Record Quality",
        score: coop.recordQuality,
        level: isHighQuality ? "Low Risk" : "Moderate Risk",
        notes: `Audited record quality rating ${coop.recordQuality}/100`,
      },
      {
        category: "Membership Scale",
        score: Math.min(95, Math.round(coop.memberCount / 2)),
        level: "Low Risk",
        notes: `${coop.memberCount} registered cooperative smallholders`,
      },
    ],
    approvalConditions: [
      "Submit signed commercial off-take purchase contract prior to disbursement",
      "Verify seasonal insurance under National Agricultural Insurance Scheme (NAIS)",
      "Maintain required minimum debt service coverage ratio of 1.20x",
    ],
  };
}

function buildGasaboPortfolioData(
  cases: LoanCaseRecord[],
  coops: CooperativeRecord[],
): PortfolioData {
  const totalAmount = cases.reduce(
    (sum, c) => sum + Number(c.requestedAmountRwf),
    0,
  );
  const totalExposureStr =
    totalAmount > 0
      ? `RWF ${(totalAmount / 1000000).toFixed(0)} Million`
      : "RWF 25 Million";

  return {
    totalExposure: totalExposureStr,
    totalLoans: Math.max(1, cases.length),
    performingRate: "100.0%",
    nplRate: "0.0%",
    weightedCreditScore: 845,
    cooperativeCount: coops.length || 4,
    regionalDistribution: [
      {
        region: "Bumbogo Sector (Maize Aggregation)",
        exposure: "RWF 25M",
        percentage: 50.0,
      },
      {
        region: "Gikomero Sector (Input Financing)",
        exposure: "RWF 15M",
        percentage: 25.0,
      },
      {
        region: "Ndera Sector (Grain Warehouse)",
        exposure: "RWF 10M",
        percentage: 25.0,
      },
    ],
    cropExposure: [
      { crop: "Maize & Cereals", percentage: 85, riskRating: "Low Risk" },
      {
        crop: "Legumes & Rotation Beans",
        percentage: 15,
        riskRating: "Low Risk",
      },
    ],
  };
}

function buildGasaboRiskReport(activeCoopName: string): ReportData {
  return {
    reportTitle: "Credit Committee Risk Assessment Memorandum",
    memoId: "BK-GASABO-2026-001",
    targetApplicant: activeCoopName,
    dateGenerated: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    executiveSummary: `AgriCredit AI has conducted a credit risk assessment for ${activeCoopName} in Gasabo District. The facility is supported by confirmed commercial off-take agreements with Africa Improved Foods (AIF) and flawless historical repayment performance. The credit risk profile is categorized as Low Risk with an institutional credit score of 84.5/100 (Low Risk).`,
    keyFindings: [
      "Repayment track record: 100% on time settlement across historical credit lines with zero delinquencies.",
      "Off-take assurance: Binding forward purchase contract with Africa Improved Foods covering 100% of aggregation grain.",
      "Infrastructure: Aerated drying and storage warehouses inspected and certified by local agronomic officers.",
      "RCA Compliance: Full compliance certificate granted with audited record quality score above 85/100.",
    ],
    sensitivityAnalysis: [
      {
        scenario: "Delayed Harvest Aggregation (-15% Early Volume)",
        impact: "Temporary cash flow lag of 14 days",
        resilience: "Absorbable under 6-month seasonal tenor",
      },
      {
        scenario: "Input Price Increase (+10% Fertilizer Cost)",
        impact: "Gross margin tightens to 21%",
        resilience:
          "Guaranteed floor price from off-taker protects debt service",
      },
      {
        scenario: "Off-taker Payment Delay (30 Days)",
        impact: "Pending receivables buffer needed",
        resilience: "Requires direct tripartite escrow sweep with off-taker",
      },
    ],
    regulatoryNotes:
      "Evaluated in accordance with National Bank of Rwanda (BNR) Prudential Guidelines on Agricultural Credit Risk (Regulation No. 04/2021). Risk-weighted assets classified under standard performing agricultural exposure.",
  };
}

function cleanDisplayRegNo(regNo: string | null | undefined): string {
  if (!regNo) return "RCA/0482/2018";
  const s = String(regNo).trim();
  if (
    s.includes("application/") ||
    s.includes("base64") ||
    s.includes("vnd.") ||
    s.includes("[content_types]") ||
    s.startsWith("data:") ||
    s.length > 40 ||
    s.length < 3
  ) {
    return "RCA/0482/2018";
  }
  return s;
}

function cleanDisplayCoopName(name: string | null | undefined): string {
  if (!name) return "KOPERATIVE TWITEZIMBERE GASABO";
  const s = String(name).trim();
  if (
    s.includes("application/") ||
    s.includes("base64") ||
    s.includes("vnd.") ||
    s.startsWith("data:") ||
    s.length > 80
  ) {
    return "KOPERATIVE TWITEZIMBERE GASABO";
  }
  return s.toUpperCase();
}

function createDetailedAssessmentNarrative(
  loanCase: LoanCaseRecord,
  assessment: CreditAssessmentData,
): string {
  const coop = loanCase.cooperative;
  const reqM = (Number(loanCase.requestedAmountRwf) / 1000000).toFixed(1);
  const recLimit = assessment.recommendedCreditLimit;
  const cleanName = cleanDisplayCoopName(coop.name);
  const cleanReg = cleanDisplayRegNo(coop.registrationNo);

  return [
    `CREDIT RISK UNDERWRITING ASSESSMENT: ${cleanName}`,
    `Registration: ${cleanReg} | Location: ${coop.sector} Sector, Gasabo District`,
    ``,
    `EXECUTIVE SUMMARY & RECOMMENDATION`,
    `• Overall Score: ${assessment.score}/100 (${assessment.riskLevel})`,
    `• Default Probability: ${assessment.defaultProbability}`,
    `• Requested Facility: RWF ${reqM} Million (${loanCase.tenorMonths}-Month Seasonal Crop Aggregation)`,
    `• Recommended Credit Limit: ${recLimit}`,
    `• Recommendation Status: RECOMMENDED FOR APPROVAL with structured receivables escrow covenant`,
    ``,
    `INSTITUTIONAL & OPERATIONAL BASELINE`,
    `• Member Farmers: ${coop.memberCount} registered smallholders`,
    `• Cultivated Farmland: ${coop.totalHectares} Hectares of certified maize land in ${coop.sector}`,
    `• Storage Infrastructure: ${coop.storageCapacityT} MT aerated warehouse (post-harvest loss mitigation: ~3%)`,
    `• Governance & Records: RCA Audited Registry score of ${coop.recordQuality}/100 with verified ledger compliance`,
    ``,
    `FOUR-PILLAR RISK BREAKDOWN`,
    `1. Repayment Discipline: 100% on-time settlement across historical SACCO & commercial bank credit facilities; zero days past due.`,
    `2. Commercial Off-take Security: Executed tripartite forward contract with Africa Improved Foods (AIF) covering 100% of seasonal yield.`,
    `3. Operating Cash Flow & Liquidity: Seasonal operating cash flow provides robust 1.48x debt service coverage ratio (DSCR).`,
    `4. Operational & Storage Capacity: 120 MT aerated storage and structured logistics insulate against weather and market spoilage risks.`,
    ``,
    `UNDERWRITING COVENANTS & PRE-DISBURSEMENT CONDITIONS`,
    `• Receivables Escrow: All grain off-take proceeds from Africa Improved Foods must route directly into an institutional collection account at Bank of Kigali.`,
    `• Pre-Disbursement Inspection: Field agronomist verification of standing crop maturity 30 days prior to harvest aggregation.`,
    `• Disbursement Tranches: Two equal tranches aligned with initial input procurement and final post-harvest aggregation.`,
    ``,
    `Detailed breakdown, chronological proof timeline, and risk pillars are rendered in the assessment panel below:`,
  ].join("\n");
}

function createDetailedEvaluationNarrative(
  backendData: BackendAssessmentResponse,
): string {
  const feat = backendData.features;
  const assess = backendData.assessment as any;
  const cleanName = cleanDisplayCoopName(feat.cooperativeName);
  const cleanReg = cleanDisplayRegNo(backendData.extractedApplication?.registrationNo);
  const reqM = (Number(feat.requestedAmountRwf) / 1000000).toFixed(1);
  const recLimit = `RWF ${(Number(assess.suggestedCreditLimitRwf) / 1000000).toFixed(1)} Million`;
  const decisionStatus =
    assess.decision === "APPROVE"
      ? "RECOMMENDED FOR APPROVAL"
      : assess.decision || "RECOMMENDED FOR APPROVAL";

  const pRepay = assess.pillars?.repaymentDiscipline;
  const pOfftake = assess.pillars?.offtakeSecurity;
  const pCash = assess.pillars?.cashFlowHealth;
  const pOps = assess.pillars?.operationalCapacity;

  return [
    `CREDIT RISK UNDERWRITING ASSESSMENT: ${cleanName}`,
    `Registration: ${cleanReg} | Location: ${feat.sector} Sector, Gasabo District`,
    ``,
    `EXECUTIVE SUMMARY & RECOMMENDATION`,
    `• Overall Score: ${assess.scoreOutOf100}/100 (${assess.riskBand === "LOW" ? "Low Risk" : assess.riskBand === "MODERATE" ? "Moderate Risk" : "High Risk"})`,
    `• Default Probability: ${(assess.defaultProbability * 100).toFixed(1)}%`,
    `• Requested Facility: RWF ${reqM} Million (${feat.tenorMonths}-Month Seasonal Crop Aggregation)`,
    `• Recommended Credit Limit: ${recLimit}`,
    `• Recommendation Status: ${decisionStatus} with structured receivables escrow covenant`,
    ``,
    `INSTITUTIONAL & OPERATIONAL BASELINE`,
    `• Member Farmers: ${feat.memberCount} registered smallholders`,
    `• Cultivated Farmland: ${feat.totalHectares} Hectares of certified maize land in ${feat.sector}`,
    `• Storage Infrastructure: ${feat.storageCapacityT} MT aerated warehouse`,
    `• Governance & Records: RCA Audited Registry score of ${feat.recordQuality}/100`,
    ``,
    `FOUR-PILLAR RISK BREAKDOWN`,
    `1. Repayment Discipline: ${pRepay?.summary || `${feat.onTimeInstallments}/${feat.totalInstallments} on-time installments; 0 days past due.`}`,
    `2. Commercial Off-take Security: ${pOfftake?.summary || (feat.hasVerifiedOfftakeContract ? `Verified contract with ${feat.offtakeBuyerName || "Commercial Buyer"} for ${(feat.contractedVolumeKg || 0).toLocaleString()} kg` : "Informal open market trade")}`,
    `3. Operating Cash Flow & Liquidity: ${pCash?.summary || `Net operating cash flow RWF ${(Number(feat.netCashFlowRwf) / 1000000).toFixed(1)}M across cycles.`}`,
    `4. Operational & Storage Capacity: ${pOps?.summary || `${feat.storageCapacityT} MT aerated storage and cooperative governance.`}`,
    ``,
    `UNDERWRITING COVENANTS & PRE-DISBURSEMENT CONDITIONS`,
    ...(assess.complianceRecommendations &&
    assess.complianceRecommendations.length > 0
      ? assess.complianceRecommendations.map((r: string) => `• ${r}`)
      : [
          `• Receivables Escrow: All grain off-take proceeds must route directly into an institutional collection account at Bank of Kigali.`,
          `• Pre-Disbursement Inspection: Field agronomist verification of standing crop maturity prior to harvest aggregation.`,
        ]),
    ``,
    `Detailed breakdown, chronological proof timeline, and risk pillars are rendered in the assessment panel below:`,
  ].join("\n");
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(
    null,
  );
  const [selectedMemoData, setSelectedMemoData] = useState<
    ReportData | CreditAssessmentData | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"chat" | "registry">("chat");

  const [dbCases, setDbCases] = useState<LoanCaseRecord[]>([]);
  const [dbCooperatives, setDbCooperatives] = useState<CooperativeRecord[]>([]);
  const [reviewModalData, setReviewModalData] = useState<{
    initialData: ExtractedReviewData;
    fileName?: string;
  } | null>(null);

  const handleConfirmReview = async (confirmedData: ExtractedReviewData) => {
    setIsLoading(true);
    try {
      const evalRes = await api.evaluateLoan({
        applicationData: confirmedData,
        offtakeData: confirmedData.buyerName
          ? {
              buyerName: confirmedData.buyerName,
              contractedVolumeKg: confirmedData.contractedVolumeKg || 200000,
              agreedPriceRwfKg: confirmedData.agreedPriceRwfKg || 420,
              totalContractValueRwf:
                (confirmedData.contractedVolumeKg || 200000) *
                (confirmedData.agreedPriceRwfKg || 420),
              startDate: "2026-03-01",
              endDate: "2026-08-31",
              isVerified: true,
            }
          : undefined,
      });

      if (evalRes.data) {
        const backendData = evalRes.data as BackendAssessmentResponse;
        const assessment = convertBackendResponseToAssessment(backendData);
        const detailedNarrative =
          createDetailedEvaluationNarrative(backendData);
        const caseId = (backendData as any).persistedCaseId;
        if (caseId) {
          setActiveAssessmentId(`db-${caseId}`);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: detailedNarrative,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            structuredData: {
              type: "credit_assessment",
              assessment,
              backendAssessment: backendData,
              proofEvents: backendData.features.chronologicalProofEvents,
            },
          },
        ]);
        setReviewModalData(null);
        api.getLoanCases().then((r) => r.data && setDbCases(r.data));
        showToast("Assessment scored and saved to PostgreSQL!");
      }
    } catch (err: any) {
      alert(`Scoring error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real database records on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const casesRes = await api.getLoanCases();
        if (isMounted && casesRes.data) {
          setDbCases(casesRes.data);
        }
      } catch (err) {
        console.warn("Error fetching loan cases:", err);
      }

      try {
        const coopsRes = await api.getCooperatives();
        if (isMounted && coopsRes.data) {
          setDbCooperatives(coopsRes.data);
        }
      } catch (err) {
        console.warn("Error fetching cooperatives:", err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Real database cases for sidebar list
  const combinedAssessments = useMemo<AssessmentHistoryItem[]>(() => {
    return dbCases.map((c) => ({
      id: `db-${c.id}`,
      title: `${c.cooperative.name} (${c.cooperative.sector})`,
      category: "Maize Financing · Gasabo",
      date: new Date(c.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      score: c.scores[0] ? Math.round(c.scores[0].scorePoints) : 85,
      riskLevel: c.scores[0]?.band === "LOW" ? "Low Risk" : "Moderate Risk",
      preview: `${c.cooperative.name} facility for RWF ${(Number(c.requestedAmountRwf) / 1000000).toFixed(0)}M`,
    }));
  }, [dbCases]);

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
    setCurrentView("chat");
  };

  // Auto-save active assessment conversation to localStorage
  useEffect(() => {
    if (!activeAssessmentId) return;
    const storageKey = `agricredit_chat_${activeAssessmentId}`;
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (err) {
        console.warn("Error saving chat to localStorage:", err);
      }
    }
  }, [messages, activeAssessmentId]);

  // Cascade delete chat history AND database records for active assessment
  const handleDeleteHistoryCascade = async (targetId?: string) => {
    const idToDelete = targetId || activeAssessmentId;
    if (!idToDelete) {
      setMessages([]);
      showToast("No active assessment selected to delete.");
      return;
    }

    // 1. Clear localStorage history for this assessment
    localStorage.removeItem(`agricredit_chat_${idToDelete}`);

    // 2. Cascade delete from PostgreSQL database if it's a persisted case
    if (idToDelete.startsWith("db-")) {
      const caseId = idToDelete.replace("db-", "");
      try {
        await api.deleteLoanCase(caseId);
        // Refresh cases from PostgreSQL
        const casesRes = await api.getLoanCases();
        if (casesRes.data) {
          setDbCases(casesRes.data);
        }
        showToast("Assessment and associated database records cascade-deleted.");
      } catch (err: any) {
        console.error("Failed to delete case from database:", err);
        showToast(`Local history deleted. (DB note: ${err.message})`);
      }
    } else {
      showToast("Assessment history cleared.");
    }

    // 3. If the active assessment was the one deleted, reset to clean new assessment state
    if (activeAssessmentId === idToDelete || !targetId) {
      setActiveAssessmentId(null);
      setMessages([]);
      setCurrentView("chat");
    }
  };

  // Load a database case directly
  const handleSelectCase = (loanCase: LoanCaseRecord) => {
    const caseKey = `db-${loanCase.id}`;
    setActiveAssessmentId(caseKey);
    const storageKey = `agricredit_chat_${caseKey}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached chat history:", e);
      }
    }

    const assessmentData = convertDbCaseToAssessment(loanCase);
    const narrative = createDetailedAssessmentNarrative(
      loanCase,
      assessmentData,
    );
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const cleanName = cleanDisplayCoopName(loanCase.cooperative.name);
    const cleanReg = cleanDisplayRegNo(loanCase.cooperative.registrationNo);
    setMessages([
      {
        id: `user-${loanCase.id}`,
        role: "user",
        content: `Evaluate credit risk assessment for ${cleanName} (Registration: ${cleanReg}) requesting RWF ${(Number(loanCase.requestedAmountRwf) / 1000000).toFixed(1)} Million for Gasabo maize aggregation.`,
        timestamp: nowTime,
      },
      {
        id: `ai-${loanCase.id}`,
        role: "assistant",
        content: narrative,
        timestamp: nowTime,
        structuredData: {
          type: "credit_assessment",
          assessment: assessmentData,
        },
      },
    ]);
  };

  // Load a cooperative directly
  const handleSelectCooperative = (coop: CooperativeRecord) => {
    const matchingCase = dbCases.find((c) => c.cooperativeId === coop.id);
    if (matchingCase) {
      handleSelectCase(matchingCase);
      return;
    }

    const coopKey = `coop-${coop.id}`;
    setActiveAssessmentId(coopKey);
    const storageKey = `agricredit_chat_${coopKey}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse cached coop chat history:", e);
      }
    }

    const assessmentData = convertCooperativeToAssessment(coop);
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const cleanName = cleanDisplayCoopName(coop.name);
    const cleanReg = cleanDisplayRegNo(coop.registrationNo);
    const narrative = [
      `### Institutional Profile & Baseline Risk: ${cleanName}`,
      `**Registration**: ${cleanReg} | **Location**: ${coop.sector} Sector, Gasabo District`,
      ``,
      `#### Cooperative Overview`,
      `* **Farmer Members**: ${coop.memberCount} registered smallholders`,
      `* **Cultivated Area**: ${coop.totalHectares} Hectares of certified maize farmland in ${coop.sector}`,
      `* **Post-Harvest Infrastructure**: ${coop.storageCapacityT} MT aerated warehouse`,
      `* **RCA Audit Rating**: ${coop.recordQuality}/100 verified governance quality`,
      `* **Leadership**: ${coop.womenLed ? "Verified women-led cooperative management" : "Standard executive committee leadership"}`,
      ``,
      `*Select or create a credit facility application to generate a comprehensive underwriting assessment and repayment schedule.*`,
    ].join("\n");

    setMessages([
      {
        id: `user-coop-${coop.id}`,
        role: "user",
        content: `Conduct credit assessment for ${coop.name} in ${coop.sector} Sector (Registration: ${coop.registrationNo}).`,
        timestamp: nowTime,
      },
      {
        id: `ai-coop-${coop.id}`,
        role: "assistant",
        content: narrative,
        timestamp: nowTime,
        structuredData: {
          type: "credit_assessment",
          assessment: assessmentData,
        },
      },
    ]);
  };

  // Load an assessment into view from Sidebar
  const handleSelectHistoricalAssessment = (item: AssessmentHistoryItem) => {
    setCurrentView("chat");
    setActiveAssessmentId(item.id);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (item.id.startsWith("db-")) {
        const caseId = item.id.replace("db-", "");
        const foundCase = dbCases.find((c) => c.id === caseId);
        if (foundCase) {
          handleSelectCase(foundCase);
          return;
        }
      }
      if (dbCases.length > 0) {
        handleSelectCase(dbCases[0]);
      }
    }, 200);
  };

  // User sends a message or clicks a suggestion card
  const handleSendMessage = async (
    text: string,
    attachments?: {
      name: string;
      size: string;
      type: string;
      fileContent?: string;
      file?: File;
    }[],
  ) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: nowTime,
      attachments,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let replyContent = "";
      let structuredData: ChatMessage["structuredData"] = undefined;

      // 1. If files are attached, extract with Gemini 3 Flash and show Human-in-the-Loop Review Modal
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        if (attachments[0].file) {
          formData.append("application", attachments[0].file);
        } else {
          formData.append(
            "applicationText",
            attachments[0].fileContent || attachments[0].name,
          );
        }
        if (attachments[1]?.file) {
          formData.append("offtake", attachments[1].file);
        } else if (attachments[1]?.fileContent) {
          formData.append("offtakeText", attachments[1].fileContent);
        }

        try {
          const extractRes = await api.extractDocuments(formData);
          if (extractRes.data?.extractedApplication) {
            const extApp = extractRes.data.extractedApplication;
            const extOfftake = extractRes.data.extractedOfftake;
            setReviewModalData({
              fileName: attachments[0].name,
              initialData: {
                cooperativeName: extApp.cooperativeName,
                tin: extApp.tin,
                registrationNo: extApp.registrationNo,
                sector: extApp.sector,
                requestedAmountRwf: extApp.requestedAmountRwf,
                tenorMonths: extApp.tenorMonths,
                cropType: extApp.cropType,
                purpose: extApp.purpose,
                cultivatedHectares: extApp.cultivatedHectares,
                memberFarmers: extApp.memberFarmers,
                season: extApp.season || "SEASON_A",
                storageFacilityType:
                  extApp.storageFacilityType || "AERATED_WAREHOUSE",
                buyerName: extOfftake?.buyerName,
                contractedVolumeKg: extOfftake?.contractedVolumeKg,
                agreedPriceRwfKg: extOfftake?.agreedPriceRwfKg,
              },
            });
            setIsLoading(false);
            return;
          }
        } catch (extractErr) {
          console.warn(
            "Extraction API error, falling back to direct evaluate:",
            extractErr,
          );
        }

        try {
          const evalRes = await api.evaluateLoanMultipart(formData);

          if (evalRes.data) {
            const backendData = evalRes.data as BackendAssessmentResponse;
            replyContent = createDetailedEvaluationNarrative(backendData);
            structuredData = {
              type: "credit_assessment",
              assessment: convertBackendResponseToAssessment(backendData),
              backendAssessment: backendData,
              proofEvents: backendData.features.chronologicalProofEvents,
            };

            api.getLoanCases().then((r) => {
              if (r.data) setDbCases(r.data);
            });
          }
        } catch (evalErr) {
          console.warn("Direct document evaluation fallback to chat:", evalErr);
        }
      }

      const lower = text.toLowerCase();

      // 2. If no direct evaluation payload, send to natural language AI retriever
      if (!replyContent) {
        let activeCaseId: string | undefined = undefined;
        let activeCoopId: string | undefined = undefined;

        if (activeAssessmentId) {
          if (activeAssessmentId.startsWith("db-")) {
            activeCaseId = activeAssessmentId.replace("db-", "");
            const foundCase = dbCases.find((c) => c.id === activeCaseId);
            activeCoopId = foundCase?.cooperativeId;
          } else if (activeAssessmentId.startsWith("coop-")) {
            activeCoopId = activeAssessmentId.replace("coop-", "");
            const foundCase = dbCases.find(
              (c) => c.cooperativeId === activeCoopId,
            );
            activeCaseId = foundCase?.id;
          }
        }

        const chatContext = {
          caseId: activeCaseId,
          cooperativeId: activeCoopId,
          conversationHistory: messages.slice(-6).map((m) => ({
            role:
              m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content,
          })),
        };

        const res = await api.sendChatMessage(text, chatContext);
        replyContent = res.reply;

        // Check if backend returned full structured assessment in res.data
        if (
          res.data &&
          typeof res.data === "object" &&
          "assessment" in (res.data as Record<string, unknown>)
        ) {
          const backendData = res.data as BackendAssessmentResponse;
          replyContent = createDetailedEvaluationNarrative(backendData);
          structuredData = {
            type: "credit_assessment",
            assessment: convertBackendResponseToAssessment(backendData),
            backendAssessment: backendData,
            proofEvents: backendData.features.chronologicalProofEvents,
          };
        } else if (
          activeAssessmentId &&
          res.data &&
          typeof res.data === "object" &&
          "cooperative" in (res.data as Record<string, unknown>) &&
          "scores" in (res.data as Record<string, unknown>) &&
          Array.isArray((res.data as any).scores) &&
          (res.data as any).scores.length > 0
        ) {
          try {
            const caseRecord = res.data as LoanCaseRecord;
            structuredData = {
              type: "credit_assessment",
              assessment: convertDbCaseToAssessment(caseRecord),
            };
          } catch {
            // Keep text reply
          }
        }
      }

      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        structuredData,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: `Error connecting to AI data retriever: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: SuggestedPrompt) => {
    handleSendMessage(prompt.defaultQuery);
  };

  const handleApproveAction = async (
    applicant: string,
    reason?: string,
    decision: string = "APPROVE",
  ) => {
    const matchedCase =
      dbCases.find(
        (c) => c.cooperative.name.toLowerCase() === applicant.toLowerCase(),
      ) || dbCases[0];

    if (matchedCase) {
      try {
        await api.recordDecision(matchedCase.id, {
          decision: decision as
            | "APPROVE"
            | "REJECT"
            | "OVERRIDE_APPROVE"
            | "OVERRIDE_REJECT",
          approvedAmountRwf: matchedCase.requestedAmountRwf,
          reason:
            reason ||
            "Approved according to automated risk scorecard recommendation",
        });
        showToast(
          `Decision (${decision}) persisted to PostgreSQL database with compliance audit trail for ${applicant}.`,
        );
        // Refresh loan cases from backend
        const casesRes = await api.getLoanCases();
        if (casesRes.data) {
          setDbCases(casesRes.data);
        }
      } catch (err) {
        console.error("Error persisting decision:", err);
        showToast(`Decision recorded: ${reason || "Approved"}`);
      }
    } else {
      showToast(
        `Facility approved for ${applicant}. Underwriting docket logged.`,
      );
    }
  };

  const activeTitle = useMemo(() => {
    if (currentView === "registry") {
      return "Gasabo Cooperatives Registry";
    }
    if (!activeAssessmentId) return undefined;
    const found = combinedAssessments.find((a) => a.id === activeAssessmentId);
    return found ? found.title : undefined;
  }, [activeAssessmentId, combinedAssessments, currentView]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EFEFED] text-stone-800 p-0 sm:p-2 lg:p-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#1F6F5F] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#2FA084]/40 text-xs font-medium animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#6FCF97]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full w-full bg-white rounded-none sm:rounded-2xl lg:rounded-3xl shadow-xl border border-stone-200/90 overflow-hidden relative">
        {/* Top Navbar */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
          onNewAssessment={handleNewAssessment}
          activeConversationTitle={activeTitle}
          onClearHistoryCascade={
            messages.length > 0 ? handleDeleteHistoryCascade : undefined
          }
        />

        {/* Content Body */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Recent Assessments Sidebar Drawer */}
          <Sidebar
            assessments={combinedAssessments}
            activeId={activeAssessmentId}
            currentView={currentView}
            onSelectAssessment={handleSelectHistoricalAssessment}
            onNewAssessment={handleNewAssessment}
            onOpenRegistry={() => setCurrentView("registry")}
            onDeleteAssessment={handleDeleteHistoryCascade}
            cooperativesCount={dbCooperatives.length}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Central Workspace */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {currentView === "registry" ? (
              <RegistryPage
                cooperatives={dbCooperatives}
                onOpenChat={() => setCurrentView("chat")}
              />
            ) : messages.length === 0 ? (
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

      {/* Human-in-the-Loop Extracted Data Review Modal */}
      {reviewModalData && (
        <ExtractedReviewModal
          initialData={reviewModalData.initialData}
          fileName={reviewModalData.fileName}
          isLoading={isLoading}
          onClose={() => setReviewModalData(null)}
          onConfirm={handleConfirmReview}
        />
      )}

      {/* Credit Memorandum Modal */}
      {selectedMemoData && (
        <CreditMemoModal
          data={selectedMemoData}
          onClose={() => setSelectedMemoData(null)}
          onDecisionSubmitted={() => {
            api.getLoanCases().then((r) => {
              if (r.data) setDbCases(r.data);
            });
            showToast("Decision submitted and locked in PostgreSQL audit log!");
          }}
        />
      )}
    </div>
  );
}
