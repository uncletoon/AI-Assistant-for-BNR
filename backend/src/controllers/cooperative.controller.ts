import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { institutionalDataService } from '../services/institutional.service.js';

export async function listCooperatives(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { district, sector, search } = req.query;

    const where: Record<string, unknown> = {};

    if (district && typeof district === 'string') {
      where.district = { equals: district, mode: 'insensitive' };
    }

    if (sector && typeof sector === 'string') {
      where.sector = { equals: sector, mode: 'insensitive' };
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tin: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const cooperatives = await prisma.cooperative.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      status: 'success',
      data: cooperatives,
    });
  } catch (err) {
    next(err);
  }
}

export async function searchCooperatives(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await institutionalDataService.searchCooperatives(query);

    res.json({
      status: 'success',
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCooperative(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const cooperative = await prisma.cooperative.findUnique({
      where: { id },
      include: {
        loanCases: {
          orderBy: { createdAt: 'desc' },
          include: {
            scores: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!cooperative) {
      res.status(404).json({
        status: 'error',
        message: `Cooperative with ID ${id} not found`,
      });
      return;
    }

    res.json({
      status: 'success',
      data: cooperative,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCooperativeInstitutionalProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const profile = await institutionalDataService.getInstitutionalProfile(id);

    if (!profile) {
      res.status(404).json({
        status: 'error',
        message: `Cooperative with ID ${id} not found`,
      });
      return;
    }

    res.json({
      status: 'success',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}
