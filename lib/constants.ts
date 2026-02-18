export const TRANSACTION_CATEGORIES = [
    'Food & Dining',
    'Groceries',
    'Transport',
    'Housing & Utilities',
    'Shopping & Services',
    'Health & Wellness',
    'Subscriptions & Entertainment',
    'Bank Fees & Taxes',
    'Transfers',
    'Income',
    'Refunds',
    'Miscellaneous'
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];
