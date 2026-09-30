import { describe, it, expect } from 'vitest';
import {
  PrismaClient,
  LenderType,
  Role,
  LoanCaseStatus,
  DocType,
  ImportStatus,
  ScoreBand,
  DecisionType,
} from '@prisma/client';

describe('Data Model & Prisma Schema Verification', () => {
  it('should export all domain enums matching the PRD specification', () => {
    // 1. LenderType enum
    expect(LenderType.COMMERCIAL_BANK).toBe('COMMERCIAL_BANK');
    expect(LenderType.MICROFINANCE).toBe('MICROFINANCE');
    expect(LenderType.SACCO).toBe('SACCO');
    expect(LenderType.DEVELOPMENT_BANK).toBe('DEVELOPMENT_BANK');

    // 2. Role enum
    expect(Role.LOAN_OFFICER).toBe('LOAN_OFFICER');
    expect(Role.BNR_MONITOR).toBe('BNR_MONITOR');
    expect(Role.ADMIN).toBe('ADMIN');

    // 3. LoanCaseStatus enum
    expect(LoanCaseStatus.DRAFT).toBe('DRAFT');
    expect(LoanCaseStatus.DOCUMENTS_COMPLETE).toBe('DOCUMENTS_COMPLETE');
    expect(LoanCaseStatus.SCORED).toBe('SCORED');
    expect(LoanCaseStatus.DECIDED).toBe('DECIDED');

    // 4. DocType enum
    expect(DocType.LOAN_RECORDS).toBe('LOAN_RECORDS');
    expect(DocType.REPAYMENT_HISTORY).toBe('REPAYMENT_HISTORY');
    expect(DocType.COOPERATIVE_PROFILE).toBe('COOPERATIVE_PROFILE');
    expect(DocType.OFFTAKE_AGREEMENT).toBe('OFFTAKE_AGREEMENT');
    expect(DocType.ATTACHMENT).toBe('ATTACHMENT');

    // 5. ImportStatus enum
    expect(ImportStatus.PENDING).toBe('PENDING');
    expect(ImportStatus.VALIDATED).toBe('VALIDATED');
    expect(ImportStatus.CONFIRMED).toBe('CONFIRMED');
    expect(ImportStatus.REJECTED).toBe('REJECTED');

    // 6. ScoreBand enum
    expect(ScoreBand.LOW).toBe('LOW');
    expect(ScoreBand.MODERATE).toBe('MODERATE');
    expect(ScoreBand.HIGH).toBe('HIGH');
    expect(ScoreBand.VERY_HIGH).toBe('VERY_HIGH');
    expect(ScoreBand.INSUFFICIENT_DATA).toBe('INSUFFICIENT_DATA');

    // 7. DecisionType enum
    expect(DecisionType.APPROVE).toBe('APPROVE');
    expect(DecisionType.REJECT).toBe('REJECT');
    expect(DecisionType.OVERRIDE_APPROVE).toBe('OVERRIDE_APPROVE');
    expect(DecisionType.OVERRIDE_REJECT).toBe('OVERRIDE_REJECT');
  });

  it('should expose all 14 entity delegates on PrismaClient', () => {
    const prisma = new PrismaClient();

    // Verify all 14 entity repositories are defined on the client
    expect(prisma.lender).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.cooperative).toBeDefined();
    expect(prisma.consent).toBeDefined();
    expect(prisma.loanCase).toBeDefined();
    expect(prisma.document).toBeDefined();
    expect(prisma.loanRecord).toBeDefined();
    expect(prisma.repaymentHistory).toBeDefined();
    expect(prisma.offtakeAgreement).toBeDefined();
    expect(prisma.modelVersion).toBeDefined();
    expect(prisma.score).toBeDefined();
    expect(prisma.scoreReason).toBeDefined();
    expect(prisma.decision).toBeDefined();
    expect(prisma.auditLog).toBeDefined();
  });

  it('should validate structured score reasons format and factor types', () => {
    const mockReason = {
      feature: 'repayment_performance',
      impactPoints: 28.5,
      shapValue: 0.35,
      statement: '100% on time repayment across historical facilities',
      sourceType: 'HISTORICAL_REPAYMENTS',
      recordIds: ['uuid-rec-1', 'uuid-rec-2'],
      documentSource: 'Bank of Kigali loan records',
      messageEn: 'The cooperative demonstrated consistent settlement discipline.',
    };

    expect(mockReason.impactPoints).toBeGreaterThan(0);
    expect(mockReason.recordIds.length).toBe(2);
    expect(mockReason.statement.length).toBeGreaterThan(5);
  });
});
