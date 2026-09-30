import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export async function listLoanCases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, band } = req.query;

    const where: Record<string, unknown> = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (band && typeof band === 'string') {
      where.scores = {
        some: {
          band,
          isWhatIf: false,
        },
      };
    }

    const cases = await prisma.loanCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cooperative: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        scores: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            reasons: {
              orderBy: { rank: 'asc' },
            },
          },
        },
        decision: true,
      },
    });

    res.json({
      status: 'success',
      data: cases,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLoanCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const loanCase = await prisma.loanCase.findUnique({
      where: { id },
      include: {
        cooperative: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        consents: true,
        documents: true,
        loanRecords: true,
        repaymentHistory: {
          orderBy: { dueDate: 'asc' },
        },
        offtakeAgreements: true,
        scores: {
          orderBy: { createdAt: 'desc' },
          include: {
            reasons: {
              orderBy: { rank: 'asc' },
            },
          },
        },
        decision: true,
      },
    });

    if (!loanCase) {
      res.status(404).json({
        status: 'error',
        message: `Loan case with ID ${id} not found`,
      });
      return;
    }

    res.json({
      status: 'success',
      data: loanCase,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFairnessSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await prisma.$queryRaw`SELECT * FROM fairness_summary ORDER BY sector;`;
    res.json({
      status: 'success',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}
