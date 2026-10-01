import { CreditAssessmentResult, AggregatedCreditFeatures } from './schemas.js';

export class ExplainabilityEngineService {
  /**
   * Generate clean, rich, chronological narrative proof in easy English
   */
  generateDetailedProofExplanation(
    features: AggregatedCreditFeatures,
    result: CreditAssessmentResult
  ): string {
    const lines: string[] = [];

    lines.push(`## Credit Assessment Report: ${features.cooperativeName} (${features.sector} Sector, Gasabo District)`);
    lines.push(`**Overall Credit Score:** ${result.scoreOutOf100}/100% · **Risk Rating:** ${result.riskBand} Risk`);
    lines.push(`**Estimated Default Probability:** ${(result.defaultProbability * 100).toFixed(1)}%`);
    lines.push(`**Requested Facility:** RWF ${(Number(features.requestedAmountRwf) / 1000000).toFixed(1)} Million (${features.tenorMonths} months tenor)`);
    lines.push(`**Recommended Credit Limit:** RWF ${(Number(result.suggestedCreditLimitRwf) / 1000000).toFixed(1)} Million`);
    lines.push('');

    lines.push('### Chronological Ledger & Transaction Proof');
    lines.push('Here is the verified chronological proof of what the cooperative did month by month across lending institutions and commercial buyers:');
    lines.push('');

    if (result.chronologicalTimeline.length === 0) {
      lines.push('• No historical transactions found in database.');
    } else {
      for (const event of result.chronologicalTimeline) {
        lines.push(`• **${event.period}**: ${event.description}`);
      }
    }

    lines.push('');
    lines.push('### 4 Weighted Assessment Pillars');
    lines.push(`1. **${result.pillars.repaymentDiscipline.pillarName} (${result.pillars.repaymentDiscipline.scoreAwarded}/${result.pillars.repaymentDiscipline.maxPoints} pts)**:`);
    lines.push(`   ${result.pillars.repaymentDiscipline.summary}`);
    lines.push(`2. **${result.pillars.offtakeSecurity.pillarName} (${result.pillars.offtakeSecurity.scoreAwarded}/${result.pillars.offtakeSecurity.maxPoints} pts)**:`);
    lines.push(`   ${result.pillars.offtakeSecurity.summary}`);
    lines.push(`3. **${result.pillars.cashFlowHealth.pillarName} (${result.pillars.cashFlowHealth.scoreAwarded}/${result.pillars.cashFlowHealth.maxPoints} pts)**:`);
    lines.push(`   ${result.pillars.cashFlowHealth.summary}`);
    lines.push(`4. **${result.pillars.operationalCapacity.pillarName} (${result.pillars.operationalCapacity.scoreAwarded}/${result.pillars.operationalCapacity.maxPoints} pts)**:`);
    lines.push(`   ${result.pillars.operationalCapacity.summary}`);

    lines.push('');
    lines.push('### Underwriting Conditions & Next Steps');
    for (const rec of result.complianceRecommendations) {
      lines.push(`• ${rec}`);
    }

    return lines.join('\n');
  }
}

export const explainabilityEngine = new ExplainabilityEngineService();
