import '../src/config/env.js';
import {
  PrismaClient,
  Role,
  LenderType,
  LoanCaseStatus,
  ScoreBand,
  TransactionType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing records in dependency order
  console.log('Cleaning existing records...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_log CASCADE;');
  await prisma.decision.deleteMany();
  await prisma.scoreReason.deleteMany();
  await prisma.score.deleteMany();
  await prisma.accountTransaction.deleteMany();
  await prisma.repaymentHistory.deleteMany();
  await prisma.loanRecord.deleteMany();
  await prisma.offtakeAgreement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.loanCase.deleteMany();
  await prisma.cooperative.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lender.deleteMany();
  await prisma.modelVersion.deleteMany();

  // 2. Seed Lenders
  console.log('Seeding lenders...');
  const bk = await prisma.lender.create({
    data: {
      name: 'Bank of Kigali (Gasabo Branch)',
      type: LenderType.COMMERCIAL_BANK,
    },
  });

  // 3. Seed Users
  console.log('Seeding users...');
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const loanOfficer = await prisma.user.create({
    data: {
      fullName: 'Jean Paul Habimana',
      email: 'officer@bk.rw',
      passwordHash: defaultPasswordHash,
      role: Role.LOAN_OFFICER,
      lenderId: bk.id,
    },
  });

  const bnrMonitor = await prisma.user.create({
    data: {
      fullName: 'Aline Uwase',
      email: 'monitor@bnr.rw',
      passwordHash: defaultPasswordHash,
      role: Role.BNR_MONITOR,
      lenderId: null,
    },
  });

  const admin = await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@agricredit.rw',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      lenderId: null,
    },
  });

  // 4. Seed Model Version
  console.log('Seeding active model version...');
  const modelVersion = await prisma.modelVersion.create({
    data: {
      name: 'AgriCredit Deterministic Scorecard v1.0',
      algorithm: 'Weighted Factor Scorecard with Evidence Tracking',
      isActive: true,
      trainedAt: new Date('2026-01-15T00:00:00Z'),
      auc: 0.82,
      metrics: {
        featureWeights: {
          repaymentHistory: 0.30,
          offtakeCoverage: 0.25,
          storageCapacity: 0.15,
          cooperativeStability: 0.15,
          recordQuality: 0.15,
        },
        riskThresholds: {
          low: 75,
          moderate: 55,
          high: 40,
        },
      },
    },
  });

  // 5. Seed 5 Gasabo Maize Aggregators & Cooperatives with Rwandan TIN Numbers
  console.log('Seeding 5 Gasabo maize cooperatives with TINs...');
  const coopTwitezimbere = await prisma.cooperative.create({
    data: {
      name: 'Koperative Twitezimbere Gasabo',
      registrationNo: 'RCA/GAS/2018/001',
      tin: '100234567',
      district: 'Gasabo',
      sector: 'Bumbogo',
      yearFounded: 2018,
      memberCount: 145,
      totalHectares: 85.5,
      storageCapacityT: 120.0,
      womenLed: false,
      hasDigitalHistory: true,
      recordQuality: 95,
    },
  });

  const coopDuterimbere = await prisma.cooperative.create({
    data: {
      name: 'Koperative Duterimbere Gikomero',
      registrationNo: 'RCA/GAS/2019/042',
      tin: '100345678',
      district: 'Gasabo',
      sector: 'Gikomero',
      yearFounded: 2019,
      memberCount: 92,
      totalHectares: 48.0,
      storageCapacityT: 65.0,
      womenLed: true,
      hasDigitalHistory: true,
      recordQuality: 88,
    },
  });

  const coopUmusingi = await prisma.cooperative.create({
    data: {
      name: 'Koperative Umusingi Ndera',
      registrationNo: 'RCA/GAS/2016/015',
      tin: '100456789',
      district: 'Gasabo',
      sector: 'Ndera',
      yearFounded: 2016,
      memberCount: 210,
      totalHectares: 140.0,
      storageCapacityT: 250.0,
      womenLed: true,
      hasDigitalHistory: true,
      recordQuality: 98,
    },
  });

  const coopAbakundamurimo = await prisma.cooperative.create({
    data: {
      name: 'Koperative Abakundamurimo Rutunga',
      registrationNo: 'RCA/GAS/2021/108',
      tin: '100567890',
      district: 'Gasabo',
      sector: 'Rutunga',
      yearFounded: 2021,
      memberCount: 64,
      totalHectares: 32.0,
      storageCapacityT: 40.0,
      womenLed: false,
      hasDigitalHistory: false,
      recordQuality: 65,
    },
  });

  const coopDuhuzimbaraga = await prisma.cooperative.create({
    data: {
      name: 'Koperative Duhuzimbaraga Rusororo',
      registrationNo: 'RCA/GAS/2018/087',
      tin: '100678901',
      district: 'Gasabo',
      sector: 'Rusororo',
      yearFounded: 2018,
      memberCount: 168,
      totalHectares: 95.0,
      storageCapacityT: 150.0,
      womenLed: false,
      hasDigitalHistory: true,
      recordQuality: 91,
    },
  });

  const allCooperatives = [
    coopTwitezimbere,
    coopDuterimbere,
    coopUmusingi,
    coopAbakundamurimo,
    coopDuhuzimbaraga,
  ];

  // 6. Seed Cross-Institutional Historical Loan Records & Repayment Ledgers
  console.log('Seeding cross-institutional loans and repayment ledgers...');

  // Twitezimbere: Prior borrowing from Bumbogo SACCO & Bank of Kigali
  const loan1Twitezimbere = await prisma.loanRecord.create({
    data: {
      cooperativeId: coopTwitezimbere.id,
      institutionName: 'Bumbogo Umurenge SACCO',
      accountNo: 'SACCO-BMB-04821',
      facilityType: 'SEASONAL_INPUT',
      amountRwf: BigInt(12000000),
      tenorMonths: 6,
      disbursedOn: new Date('2024-03-01T00:00:00Z'),
      closedOn: new Date('2024-09-01T00:00:00Z'),
      status: 'CLOSED_SETTLED',
      isHistorical: true,
    },
  });

  await prisma.repaymentHistory.createMany({
    data: [
      {
        cooperativeId: coopTwitezimbere.id,
        loanRecordId: loan1Twitezimbere.id,
        installmentNo: 1,
        dueDate: new Date('2024-05-01T00:00:00Z'),
        paidDate: new Date('2024-04-28T00:00:00Z'),
        amountDueRwf: BigInt(4000000),
        amountPaidRwf: BigInt(4000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopTwitezimbere.id,
        loanRecordId: loan1Twitezimbere.id,
        installmentNo: 2,
        dueDate: new Date('2024-07-01T00:00:00Z'),
        paidDate: new Date('2024-06-30T00:00:00Z'),
        amountDueRwf: BigInt(4000000),
        amountPaidRwf: BigInt(4000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopTwitezimbere.id,
        loanRecordId: loan1Twitezimbere.id,
        installmentNo: 3,
        dueDate: new Date('2024-09-01T00:00:00Z'),
        paidDate: new Date('2024-08-29T00:00:00Z'),
        amountDueRwf: BigInt(4000000),
        amountPaidRwf: BigInt(4000000),
        daysPastDue: 0,
        isHistorical: true,
      },
    ],
  });

  // Active Loan Case for Twitezimbere
  const loanCase1 = await prisma.loanCase.create({
    data: {
      cooperativeId: coopTwitezimbere.id,
      lenderId: bk.id,
      createdById: loanOfficer.id,
      requestedAmountRwf: BigInt(25000000),
      tenorMonths: 9,
      purpose: 'Maize input financing and post harvest aggregation for Season 2026A',
      status: LoanCaseStatus.SCORED,
    },
  });

  const loan2Twitezimbere = await prisma.loanRecord.create({
    data: {
      cooperativeId: coopTwitezimbere.id,
      loanCaseId: loanCase1.id,
      institutionName: 'Bank of Kigali',
      accountNo: 'BK-100234567-01',
      facilityType: 'WORKING_CAPITAL',
      amountRwf: BigInt(18000000),
      tenorMonths: 8,
      disbursedOn: new Date('2025-02-15T00:00:00Z'),
      closedOn: new Date('2025-10-15T00:00:00Z'),
      status: 'CLOSED_SETTLED',
      isHistorical: true,
    },
  });

  await prisma.repaymentHistory.createMany({
    data: [
      {
        cooperativeId: coopTwitezimbere.id,
        loanCaseId: loanCase1.id,
        loanRecordId: loan2Twitezimbere.id,
        installmentNo: 1,
        dueDate: new Date('2025-05-15T00:00:00Z'),
        paidDate: new Date('2025-05-12T00:00:00Z'),
        amountDueRwf: BigInt(6000000),
        amountPaidRwf: BigInt(6000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopTwitezimbere.id,
        loanRecordId: loan2Twitezimbere.id,
        installmentNo: 2,
        dueDate: new Date('2025-07-15T00:00:00Z'),
        paidDate: new Date('2025-07-14T00:00:00Z'),
        amountDueRwf: BigInt(6000000),
        amountPaidRwf: BigInt(6000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopTwitezimbere.id,
        loanRecordId: loan2Twitezimbere.id,
        installmentNo: 3,
        dueDate: new Date('2025-09-15T00:00:00Z'),
        paidDate: new Date('2025-09-15T00:00:00Z'),
        amountDueRwf: BigInt(6000000),
        amountPaidRwf: BigInt(6000000),
        daysPastDue: 0,
        isHistorical: true,
      },
    ],
  });

  // Duterimbere (Women-Led in Gikomero): Prior borrowing from Duterimbere MFI
  const loanDuterimbere = await prisma.loanRecord.create({
    data: {
      cooperativeId: coopDuterimbere.id,
      institutionName: 'Duterimbere IMF',
      accountNo: 'DUT-GIK-0192',
      facilityType: 'SEASONAL_INPUT',
      amountRwf: BigInt(10000000),
      tenorMonths: 6,
      disbursedOn: new Date('2025-03-01T00:00:00Z'),
      closedOn: new Date('2025-09-01T00:00:00Z'),
      status: 'CLOSED_SETTLED',
      isHistorical: true,
    },
  });

  await prisma.repaymentHistory.createMany({
    data: [
      {
        cooperativeId: coopDuterimbere.id,
        loanRecordId: loanDuterimbere.id,
        installmentNo: 1,
        dueDate: new Date('2025-05-01T00:00:00Z'),
        paidDate: new Date('2025-04-30T00:00:00Z'),
        amountDueRwf: BigInt(3333334),
        amountPaidRwf: BigInt(3333334),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopDuterimbere.id,
        loanRecordId: loanDuterimbere.id,
        installmentNo: 2,
        dueDate: new Date('2025-07-01T00:00:00Z'),
        paidDate: new Date('2025-07-01T00:00:00Z'),
        amountDueRwf: BigInt(3333333),
        amountPaidRwf: BigInt(3333333),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopDuterimbere.id,
        loanRecordId: loanDuterimbere.id,
        installmentNo: 3,
        dueDate: new Date('2025-09-01T00:00:00Z'),
        paidDate: new Date('2025-08-31T00:00:00Z'),
        amountDueRwf: BigInt(3333333),
        amountPaidRwf: BigInt(3333333),
        daysPastDue: 0,
        isHistorical: true,
      },
    ],
  });

  // Umusingi (Ndera): Large capacity, prior borrowing from Urwego Bank
  const loanUmusingi = await prisma.loanRecord.create({
    data: {
      cooperativeId: coopUmusingi.id,
      institutionName: 'Urwego Bank',
      accountNo: 'URW-NDR-7721',
      facilityType: 'GRAIN_WAREHOUSE_AGGREGATION',
      amountRwf: BigInt(35000000),
      tenorMonths: 10,
      disbursedOn: new Date('2024-09-15T00:00:00Z'),
      closedOn: new Date('2025-07-15T00:00:00Z'),
      status: 'CLOSED_SETTLED',
      isHistorical: true,
    },
  });

  await prisma.repaymentHistory.createMany({
    data: [
      {
        cooperativeId: coopUmusingi.id,
        loanRecordId: loanUmusingi.id,
        installmentNo: 1,
        dueDate: new Date('2025-01-15T00:00:00Z'),
        paidDate: new Date('2025-01-10T00:00:00Z'),
        amountDueRwf: BigInt(11666667),
        amountPaidRwf: BigInt(11666667),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopUmusingi.id,
        loanRecordId: loanUmusingi.id,
        installmentNo: 2,
        dueDate: new Date('2025-04-15T00:00:00Z'),
        paidDate: new Date('2025-04-12T00:00:00Z'),
        amountDueRwf: BigInt(11666667),
        amountPaidRwf: BigInt(11666667),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopUmusingi.id,
        loanRecordId: loanUmusingi.id,
        installmentNo: 3,
        dueDate: new Date('2025-07-15T00:00:00Z'),
        paidDate: new Date('2025-07-15T00:00:00Z'),
        amountDueRwf: BigInt(11666666),
        amountPaidRwf: BigInt(11666666),
        daysPastDue: 0,
        isHistorical: true,
      },
    ],
  });

  // Duhuzimbaraga (Rusororo): Prior borrowing from Clecam Ejoheza
  const loanDuhuzimbaraga = await prisma.loanRecord.create({
    data: {
      cooperativeId: coopDuhuzimbaraga.id,
      institutionName: 'Clecam Ejoheza',
      accountNo: 'CLC-RSO-3301',
      facilityType: 'SEASONAL_WORKING_CAPITAL',
      amountRwf: BigInt(15000000),
      tenorMonths: 6,
      disbursedOn: new Date('2025-02-01T00:00:00Z'),
      closedOn: new Date('2025-08-01T00:00:00Z'),
      status: 'CLOSED_SETTLED',
      isHistorical: true,
    },
  });

  await prisma.repaymentHistory.createMany({
    data: [
      {
        cooperativeId: coopDuhuzimbaraga.id,
        loanRecordId: loanDuhuzimbaraga.id,
        installmentNo: 1,
        dueDate: new Date('2025-04-01T00:00:00Z'),
        paidDate: new Date('2025-04-01T00:00:00Z'),
        amountDueRwf: BigInt(5000000),
        amountPaidRwf: BigInt(5000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopDuhuzimbaraga.id,
        loanRecordId: loanDuhuzimbaraga.id,
        installmentNo: 2,
        dueDate: new Date('2025-06-01T00:00:00Z'),
        paidDate: new Date('2025-06-01T00:00:00Z'),
        amountDueRwf: BigInt(5000000),
        amountPaidRwf: BigInt(5000000),
        daysPastDue: 0,
        isHistorical: true,
      },
      {
        cooperativeId: coopDuhuzimbaraga.id,
        loanRecordId: loanDuhuzimbaraga.id,
        installmentNo: 3,
        dueDate: new Date('2025-08-01T00:00:00Z'),
        paidDate: new Date('2025-07-30T00:00:00Z'),
        amountDueRwf: BigInt(5000000),
        amountPaidRwf: BigInt(5000000),
        daysPastDue: 0,
        isHistorical: true,
      },
    ],
  });

  // 7. Seed Money In & Money Out Account Transactions (Cash Flow Ledgers)
  console.log('Seeding money in and money out account transactions...');

  // Twitezimbere Transactions across 2025
  await prisma.accountTransaction.createMany({
    data: [
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-01-15T10:00:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'INPUT_PURCHASE',
        amountRwf: BigInt(4500000),
        balanceAfterRwf: BigInt(7500000),
        reference: 'TUBURA-INPUT-2025A',
        description: 'Certified maize seed and inorganic fertilizer procurement',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-02-15T11:30:00Z'),
        transactionType: TransactionType.CREDIT,
        category: 'LOAN_DISBURSEMENT',
        amountRwf: BigInt(18000000),
        balanceAfterRwf: BigInt(25500000),
        reference: 'BK-DISB-2025-042',
        description: 'Bank of Kigali agricultural facility seasonal disbursement',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-03-20T14:15:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LABOR_PAYOUT',
        amountRwf: BigInt(2800000),
        balanceAfterRwf: BigInt(22700000),
        reference: 'WAGE-WEEDING-0325',
        description: 'Cooperative seasonal farm labor and weeding payout',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-05-12T09:00:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LOAN_REPAYMENT',
        amountRwf: BigInt(6000000),
        balanceAfterRwf: BigInt(16700000),
        reference: 'BK-REPAY-INST-1',
        description: 'Loan installment 1 principal and interest settlement',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-06-25T16:00:00Z'),
        transactionType: TransactionType.CREDIT,
        category: 'GRAIN_SALE',
        amountRwf: BigInt(32400000),
        balanceAfterRwf: BigInt(49100000),
        reference: 'AIF-SWEEP-2025-06',
        description: 'Africa Improved Foods commercial maize purchase settlement (90 MT)',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-07-14T10:30:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LOAN_REPAYMENT',
        amountRwf: BigInt(6000000),
        balanceAfterRwf: BigInt(43100000),
        reference: 'BK-REPAY-INST-2',
        description: 'Loan installment 2 principal and interest settlement',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-08-10T12:00:00Z'),
        transactionType: TransactionType.CREDIT,
        category: 'GRAIN_SALE',
        amountRwf: BigInt(21600000),
        balanceAfterRwf: BigInt(64700000),
        reference: 'MINIMEX-TRP-2025',
        description: 'Minimex grain procurement for secondary aggregation batch (60 MT)',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-09-15T14:00:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LOAN_REPAYMENT',
        amountRwf: BigInt(6000000),
        balanceAfterRwf: BigInt(58700000),
        reference: 'BK-REPAY-INST-3',
        description: 'Loan installment 3 final settlement with zero outstanding arrears',
      },
      {
        cooperativeId: coopTwitezimbere.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100234567-01',
        transactionDate: new Date('2025-10-05T15:30:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'MEMBER_DIVIDEND',
        amountRwf: BigInt(38000000),
        balanceAfterRwf: BigInt(20700000),
        reference: 'MEM-DIV-FY2025',
        description: 'Annual member harvest proceeds dividend distribution to 145 farmers',
      },
    ],
  });

  // Duterimbere (Gikomero): In & Out transactions
  await prisma.accountTransaction.createMany({
    data: [
      {
        cooperativeId: coopDuterimbere.id,
        institutionName: 'Bumbogo Umurenge SACCO',
        accountNo: 'SACCO-GIK-1104',
        transactionDate: new Date('2025-03-05T10:00:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'INPUT_PURCHASE',
        amountRwf: BigInt(3200000),
        balanceAfterRwf: BigInt(4800000),
        reference: 'AGRO-INP-2025',
        description: 'Certified drought resilient seed and organic manure purchase',
      },
      {
        cooperativeId: coopDuterimbere.id,
        institutionName: 'Bumbogo Umurenge SACCO',
        accountNo: 'SACCO-GIK-1104',
        transactionDate: new Date('2025-06-20T11:00:00Z'),
        transactionType: TransactionType.CREDIT,
        category: 'GRAIN_SALE',
        amountRwf: BigInt(18500000),
        balanceAfterRwf: BigInt(23300000),
        reference: 'AIF-GIK-2025',
        description: 'Africa Improved Foods commercial grain sales payment',
      },
      {
        cooperativeId: coopDuterimbere.id,
        institutionName: 'Bumbogo Umurenge SACCO',
        accountNo: 'SACCO-GIK-1104',
        transactionDate: new Date('2025-07-01T09:30:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LOAN_REPAYMENT',
        amountRwf: BigInt(3333333),
        balanceAfterRwf: BigInt(19966667),
        reference: 'DUT-REPAY-02',
        description: 'Monthly loan installment settlement to Duterimbere IMF',
      },
    ],
  });

  // Umusingi (Ndera): In & Out transactions
  await prisma.accountTransaction.createMany({
    data: [
      {
        cooperativeId: coopUmusingi.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100456789-01',
        transactionDate: new Date('2025-01-10T09:00:00Z'),
        transactionType: TransactionType.DEBIT,
        category: 'LOAN_REPAYMENT',
        amountRwf: BigInt(11666667),
        balanceAfterRwf: BigInt(38333333),
        reference: 'URW-PAY-01',
        description: 'Urwego Bank warehouse receipt loan repayment',
      },
      {
        cooperativeId: coopUmusingi.id,
        institutionName: 'Bank of Kigali',
        accountNo: 'BK-100456789-01',
        transactionDate: new Date('2025-07-10T14:00:00Z'),
        transactionType: TransactionType.CREDIT,
        category: 'GRAIN_SALE',
        amountRwf: BigInt(62000000),
        balanceAfterRwf: BigInt(100333333),
        reference: 'AIF-NDR-SWEEP',
        description: 'Africa Improved Foods bulk grain delivery sweep (160 MT)',
      },
    ],
  });



  // Consent
  await prisma.consent.create({
    data: {
      cooperativeId: coopTwitezimbere.id,
      loanCaseId: loanCase1.id,
      purpose: 'Credit risk assessment and historical record verification for Season 2026A',
      granted: true,
      signatoryName: 'Emmanuel Nkurunziza (President)',
      grantedAt: new Date('2026-02-01T09:30:00Z'),
    },
  });

  // Verified Offtake Agreement for Active Case
  await prisma.offtakeAgreement.create({
    data: {
      loanCaseId: loanCase1.id,
      buyerName: 'Africa Improved Foods Rwanda (AIF)',
      volumeKg: 150000,
      agreedPriceRwfKg: 380,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-08-31T00:00:00Z'),
      isVerified: true,
      isHistorical: false,
    },
  });

  // Score
  const score1 = await prisma.score.create({
    data: {
      loanCaseId: loanCase1.id,
      modelVersionId: modelVersion.id,
      inputSnapshot: {
        memberCount: 145,
        totalHectares: 85.5,
        storageCapacityT: 120.0,
        onTimeRepaymentRatio: 1.0,
        maxDaysPastDue: 0,
        offtakeCoverageRatio: 0.88,
        recordQuality: 95,
      },
      defaultProb: 0.042,
      band: ScoreBand.LOW,
      scorePoints: 84.5,
      suggestedLimitRwf: BigInt(28000000),
      uncertaintyFlag: false,
      isWhatIf: false,
    },
  });

  // Score Reasons
  await prisma.scoreReason.createMany({
    data: [
      {
        scoreId: score1.id,
        rank: 1,
        feature: 'repayment_performance',
        impactPoints: 28.5,
        shapValue: 0.35,
        statement: 'Flawless 100 percent on time repayment across past 3 institutional loans',
        sourceType: 'HISTORICAL_REPAYMENTS',
        recordIds: [loan2Twitezimbere.id],
        documentSource: 'Bank of Kigali historical credit ledger',
        messageEn: 'The cooperative settled all past credit instalments ahead of schedule with zero days past due.',
      },
      {
        scoreId: score1.id,
        rank: 2,
        feature: 'offtake_coverage',
        impactPoints: 24.0,
        shapValue: 0.28,
        statement: 'Verified offtake contract covers 88 percent of projected harvest volume',
        sourceType: 'OFFTAKE_AGREEMENT',
        recordIds: [],
        documentSource: 'AIF Offtake Contract 2026',
        messageEn: 'Signed purchase commitment with Africa Improved Foods guarantees buyer demand at 380 RWF per kilogram.',
      },
      {
        scoreId: score1.id,
        rank: 3,
        feature: 'storage_infrastructure',
        impactPoints: 14.5,
        shapValue: 0.16,
        statement: '120 metric tons modern drying and aerated warehouse capacity',
        sourceType: 'COOPERATIVE_PROFILE',
        recordIds: [],
        documentSource: 'Gasabo District Cooperative Audit',
        messageEn: 'Adequate dedicated warehouse capacity mitigates post harvest aflatoxin and crop spoilage risk.',
      },
    ],
  });

  // Audit Log entry
  await prisma.auditLog.create({
    data: {
      actorId: loanOfficer.id,
      action: 'SCORE_CALCULATED',
      entity: 'LoanCase',
      entityId: loanCase1.id,
      details: {
        scoreId: score1.id,
        band: 'LOW',
        scorePoints: 84.5,
        defaultProb: 0.042,
      },
    },
  });

  // 9. Apply SQL views and rules
  console.log('Applying SQL views, rules, and check constraints...');
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_override_reason') THEN
        ALTER TABLE decisions ADD CONSTRAINT check_override_reason CHECK (
          (decision NOT IN ('OVERRIDE_APPROVE', 'OVERRIDE_REJECT'))
          OR (reason IS NOT NULL AND length(trim(reason)) > 0)
        );
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW fairness_summary AS
    SELECT
      c.women_led,
      c.sector,
      c.has_digital_history,
      COUNT(DISTINCT lc.id)::int AS total_cases,
      ROUND(AVG(s.default_prob)::numeric, 4) AS avg_default_prob,
      ROUND(
        COALESCE(
          (COUNT(CASE WHEN d.decision IN ('APPROVE', 'OVERRIDE_APPROVE') THEN 1 END)::numeric /
          NULLIF(COUNT(d.id), 0)::numeric), 0
        ), 4
      ) AS approval_rate
    FROM cooperatives c
    LEFT JOIN loan_cases lc ON lc.cooperative_id = c.id
    LEFT JOIN scores s ON s.loan_case_id = lc.id AND s.is_what_if = false
    LEFT JOIN decisions d ON d.loan_case_id = lc.id
    GROUP BY c.women_led, c.sector, c.has_digital_history;
  `);

  console.log('Seeding finished successfully!');
  console.log(`5 Gasabo Maize Cooperatives seeded:`);
  console.log(`  1. Twitezimbere Gasabo (TIN: 100234567, Bumbogo)`);
  console.log(`  2. Duterimbere Gikomero (TIN: 100345678, Gikomero)`);
  console.log(`  3. Umusingi Ndera (TIN: 100456789, Ndera)`);
  console.log(`  4. Abakundamurimo Rutunga (TIN: 100567890, Rutunga)`);
  console.log(`  5. Duhuzimbaraga Rusororo (TIN: 100678901, Rusororo)`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
