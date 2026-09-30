import { Router } from 'express';
import {
  evaluateCooperativeLoan,
  scoreLoanCase,
  recordLoanDecision,
} from '../controllers/scoring.controller.js';

export const scoringRouter = Router();

// 1. Direct document/application evaluation with proof timeline
scoringRouter.post('/evaluate', evaluateCooperativeLoan);

// 2. Score loan case from DB, persist score + reasons + audit log
scoringRouter.post('/cases/:id/score', scoreLoanCase);

// 3. Officer decision with override constraint verification
scoringRouter.post('/cases/:id/decision', recordLoanDecision);
