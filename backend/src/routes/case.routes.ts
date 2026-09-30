import { Router } from 'express';
import { listLoanCases, getLoanCase, getFairnessSummary } from '../controllers/case.controller.js';

export const caseRouter = Router();

caseRouter.get('/cases', listLoanCases);
caseRouter.get('/cases/:id', getLoanCase);
caseRouter.get('/monitoring/fairness', getFairnessSummary);
