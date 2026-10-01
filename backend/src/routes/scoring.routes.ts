import { Router } from 'express';
import {
  evaluateCooperativeLoan,
  scoreLoanCase,
  recordLoanDecision,
  extractLoanDocuments,
  simulateLoanCaseScenario,
  deleteLoanCaseCascade,
  deleteAllLoanCasesCascade,
} from '../controllers/scoring.controller.js';
import { upload } from '../middleware/upload.js';

export const scoringRouter = Router();

// 1. Multimodal document extraction for human-in-the-loop review
scoringRouter.post('/extract', upload.any(), extractLoanDocuments);

// 2. Direct document/application evaluation with proof timeline (supports multipart file uploads and JSON)
scoringRouter.post('/evaluate', upload.any(), evaluateCooperativeLoan);

// 3. Score loan case from DB, persist score + reasons + audit log
scoringRouter.post('/cases/:id/score', scoreLoanCase);

// 4. What-If Sensitivity Simulator for counterfactual scenario analysis
scoringRouter.post('/cases/:id/simulate', simulateLoanCaseScenario);

// 5. Officer decision with override constraint verification
scoringRouter.post('/cases/:id/decision', recordLoanDecision);

// 6. Delete a specific loan case and cascade all database records
scoringRouter.delete('/cases/:id', deleteLoanCaseCascade);

// 7. Delete all loan cases and cascade all database records
scoringRouter.delete('/cases', deleteAllLoanCasesCascade);
