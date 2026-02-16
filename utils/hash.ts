import crypto from 'crypto';

/**
 * Creates a unique SHA-256 hash for a transaction.
 * If the exact same transaction happens on the exact same day for the exact same amount,
 * it will generate the same hash, preventing duplicates in the database.
 */
export function generateTransactionHash(transaction: {
  date: string;
  amount: number;
  type: string;
  description: string;
}): string {
  // Combine the core data points into a single string
  // Using toFixed(2) ensures floating point math doesn't ruin the hash
  const rawString = `${transaction.date}-${transaction.amount.toFixed(2)}-${transaction.type}-${transaction.description.trim()}`;
  
  // Generate a standard SHA-256 hash
  return crypto.createHash('sha256').update(rawString).digest('hex');
}