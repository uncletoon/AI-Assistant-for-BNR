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
  {
    id: 'query-cashflow',
    title: 'Cooperative Cash Flows',
    description: 'Query money in / out transactions for Twitezimbere Gasabo',
    icon: 'chart',
    defaultQuery: 'Show cash flow and grain sale transactions for Twitezimbere Gasabo',
  },
  {
    id: 'query-loans',
    title: 'Historical Loan Records',
    description: 'Query borrowing and repayment history across SACCOs',
    icon: 'cooperative',
    defaultQuery: 'Show historical loans and repayment performance for Twitezimbere Gasabo',
  },
];
