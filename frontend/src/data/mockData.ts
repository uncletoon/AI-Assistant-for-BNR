import { SuggestedPrompt } from '../types';

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'query-count',
    title: 'How many cooperatives in DB?',
    description: 'Query total registered in Gasabo District',
    icon: 'chart',
    defaultQuery: 'How many cooperatives do we have in database?',
  },
  {
    id: 'query-names',
    title: 'What are their names & TINs?',
    description: 'List all maize cooperatives with TIN numbers',
    icon: 'cooperative',
    defaultQuery: 'What are their names and TIN numbers?',
  },
];

/**
 * Standard document templates corresponding to the four PRD document categories:
 * 1. Loan Records
 * 2. Repayment History
 * 3. Cooperative Profile
 * 4. Off-Take Agreements
 */
export const SAMPLE_DOCUMENTS = [
  {
    name: 'Gasabo_Cooperative_Loan_Records.csv',
    size: '1.2 MB',
    type: 'Historical Loan Records',
  },
  {
    name: 'Repayment_Ledger_2023_2025.csv',
    size: '860 KB',
    type: 'Repayment Ledger',
  },
  {
    name: 'Cooperative_Profile_RCA_Certified.pdf',
    size: '2.4 MB',
    type: 'Cooperative Profile',
  },
  {
    name: 'Commercial_Offtake_Agreement_AIF.pdf',
    size: '1.8 MB',
    type: 'Off-Take Contract',
  },
];
