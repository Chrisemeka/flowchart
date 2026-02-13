export function parseAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.abs(amountStr);
  }

  if (!amountStr) return 0;

  // 1. Remove currency symbols (₦, NGN, $) and whitespace
  // We keep digits, dots, commas, and negative signs
  let cleaned = String(amountStr).replace(/[^\d.\-,]/g, '');

  // 2. Handle comma as thousands separator (Standard in Nigeria: 1,000.00)
  // Logic: If both comma and dot exist, comma is likely the separator.
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } 
  // If only commas exist (e.g. "1,000"), we assume it's a separator, NOT a decimal.
  // Exception: If the last part is exactly 2 digits (e.g. "50,00"), it might be a decimal (rare in NG).
  else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const num = parseFloat(cleaned);
  return (isNaN(num) || !isFinite(num)) ? 0 : Math.abs(num);
}