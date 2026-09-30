import { prisma } from '../config/db.js';
import { TransactionType } from '@prisma/client';

export interface FinancialHealthKpis {
  repaymentHealth: {
    totalInstallments: number;
    onTimeInstallments: number;
    onTimeRatio: number;
    maxDaysPastDue: number;
    totalPenaltiesRwf: string;
  };
  cashFlowHealth: {
    totalInflowRwf: string;
    totalOutflowRwf: string;
    netCashFlowRwf: string;
    currentBalanceRwf: string;
    grainSalesVolumeRwf: string;
    transactionCount: number;
  };
  debtProfile: {
    totalHistoricalBorrowingRwf: string;
    activeDebtRwf: string;
    settledDebtRwf: string;
    facilitiesCount: number;
    institutions: string[];
  };
}

export class InstitutionalDataService {
  /**
   * Search cooperatives by TIN, Name, Registration Number, or Sector
   */
  async searchCooperatives(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return prisma.cooperative.findMany({
        take: 10,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          tin: true,
          registrationNo: true,
          sector: true,
          district: true,
          memberCount: true,
          totalHectares: true,
          storageCapacityT: true,
          womenLed: true,
          recordQuality: true,
        },
      });
    }

    return prisma.cooperative.findMany({
      where: {
        OR: [
          { tin: { contains: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
          { registrationNo: { contains: trimmed, mode: 'insensitive' } },
          { sector: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        tin: true,
        registrationNo: true,
        sector: true,
        district: true,
        memberCount: true,
        totalHectares: true,
        storageCapacityT: true,
        womenLed: true,
        recordQuality: true,
      },
    });
  }

  /**
   * Look up cooperative by unique TIN number
   */
  async getByTin(tin: string) {
    return prisma.cooperative.findUnique({
      where: { tin: tin.trim() },
      include: {
        loanRecords: {
          orderBy: { disbursedOn: 'desc' },
        },
        repaymentHistory: {
          orderBy: { dueDate: 'desc' },
          take: 50,
        },
        accountTransactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
      },
    });
  }

  /**
   * Retrieve full cross-institutional records for a cooperative
   */
  async getInstitutionalProfile(cooperativeId: string) {
    const coop = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: {
        loanRecords: {
          orderBy: { disbursedOn: 'desc' },
          include: {
            repayments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
        repaymentHistory: {
          orderBy: { dueDate: 'asc' },
        },
        accountTransactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!coop) {
      return null;
    }

    const kpis = await this.calculateFinancialHealthKpis(cooperativeId);

    return {
      cooperative: {
        id: coop.id,
        name: coop.name,
        tin: coop.tin,
        registrationNo: coop.registrationNo,
        district: coop.district,
        sector: coop.sector,
        yearFounded: coop.yearFounded,
        memberCount: coop.memberCount,
        totalHectares: coop.totalHectares,
        storageCapacityT: coop.storageCapacityT,
        womenLed: coop.womenLed,
        hasDigitalHistory: coop.hasDigitalHistory,
        recordQuality: coop.recordQuality,
      },
      kpis,
      loanRecords: coop.loanRecords.map((lr) => ({
        id: lr.id,
        institutionName: lr.institutionName,
        accountNo: lr.accountNo,
        facilityType: lr.facilityType,
        amountRwf: lr.amountRwf.toString(),
        tenorMonths: lr.tenorMonths,
        disbursedOn: lr.disbursedOn,
        closedOn: lr.closedOn,
        status: lr.status,
        isHistorical: lr.isHistorical,
        repayments: lr.repayments.map((r) => ({
          id: r.id,
          installmentNo: r.installmentNo,
          dueDate: r.dueDate,
          paidDate: r.paidDate,
          amountDueRwf: r.amountDueRwf.toString(),
          amountPaidRwf: r.amountPaidRwf.toString(),
          daysPastDue: r.daysPastDue,
          penaltyRwf: r.penaltyRwf.toString(),
        })),
      })),
      repaymentHistory: coop.repaymentHistory.map((r) => ({
        id: r.id,
        loanRecordId: r.loanRecordId,
        installmentNo: r.installmentNo,
        dueDate: r.dueDate,
        paidDate: r.paidDate,
        amountDueRwf: r.amountDueRwf.toString(),
        amountPaidRwf: r.amountPaidRwf.toString(),
        daysPastDue: r.daysPastDue,
        penaltyRwf: r.penaltyRwf.toString(),
        isHistorical: r.isHistorical,
      })),
      accountTransactions: coop.accountTransactions.map((tx) => ({
        id: tx.id,
        institutionName: tx.institutionName,
        accountNo: tx.accountNo,
        transactionDate: tx.transactionDate,
        transactionType: tx.transactionType,
        category: tx.category,
        amountRwf: tx.amountRwf.toString(),
        balanceAfterRwf: tx.balanceAfterRwf.toString(),
        reference: tx.reference,
        description: tx.description,
      })),
    };
  }

  /**
   * Deterministic SQL Financial KPI calculation
   */
  async calculateFinancialHealthKpis(cooperativeId: string): Promise<FinancialHealthKpis> {
    const repayments = await prisma.repaymentHistory.findMany({
      where: { cooperativeId },
    });

    const totalInstallments = repayments.length;
    const onTimeInstallments = repayments.filter((r) => r.daysPastDue === 0).length;
    const onTimeRatio = totalInstallments > 0
      ? Number((onTimeInstallments / totalInstallments).toFixed(4))
      : 1.0;
    const maxDaysPastDue = repayments.reduce((max, r) => Math.max(max, r.daysPastDue), 0);
    const totalPenaltiesRwf = repayments.reduce(
      (sum, r) => sum + BigInt(r.penaltyRwf || 0),
      BigInt(0)
    );

    const transactions = await prisma.accountTransaction.findMany({
      where: { cooperativeId },
      orderBy: { transactionDate: 'asc' },
    });

    let totalInflow = BigInt(0);
    let totalOutflow = BigInt(0);
    let grainSalesVolume = BigInt(0);

    for (const tx of transactions) {
      if (tx.transactionType === TransactionType.CREDIT) {
        totalInflow += BigInt(tx.amountRwf);
        if (tx.category === 'GRAIN_SALE') {
          grainSalesVolume += BigInt(tx.amountRwf);
        }
      } else {
        totalOutflow += BigInt(tx.amountRwf);
      }
    }

    const netCashFlow = totalInflow - totalOutflow;
    const latestTx = transactions[transactions.length - 1];
    const currentBalance = latestTx ? latestTx.balanceAfterRwf : BigInt(0);

    const loans = await prisma.loanRecord.findMany({
      where: { cooperativeId },
    });

    let totalHistoricalBorrowing = BigInt(0);
    let activeDebt = BigInt(0);
    let settledDebt = BigInt(0);
    const institutionsSet = new Set<string>();

    for (const loan of loans) {
      const amount = BigInt(loan.amountRwf);
      totalHistoricalBorrowing += amount;
      institutionsSet.add(loan.institutionName);
      if (loan.status === 'ACTIVE') {
        activeDebt += amount;
      } else if (loan.status === 'CLOSED_SETTLED') {
        settledDebt += amount;
      }
    }

    return {
      repaymentHealth: {
        totalInstallments,
        onTimeInstallments,
        onTimeRatio,
        maxDaysPastDue,
        totalPenaltiesRwf: totalPenaltiesRwf.toString(),
      },
      cashFlowHealth: {
        totalInflowRwf: totalInflow.toString(),
        totalOutflowRwf: totalOutflow.toString(),
        netCashFlowRwf: netCashFlow.toString(),
        currentBalanceRwf: currentBalance.toString(),
        grainSalesVolumeRwf: grainSalesVolume.toString(),
        transactionCount: transactions.length,
      },
      debtProfile: {
        totalHistoricalBorrowingRwf: totalHistoricalBorrowing.toString(),
        activeDebtRwf: activeDebt.toString(),
        settledDebtRwf: settledDebt.toString(),
        facilitiesCount: loans.length,
        institutions: Array.from(institutionsSet),
      },
    };
  }
}

export const institutionalDataService = new InstitutionalDataService();
