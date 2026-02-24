// Helper function to safely generate an ISO string without crashing
function safeISOString(year: number, month: number, day: number): string {
  try {
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  // 1. Handle Kuda Format: DD/MM/YY HH:MM:SS
  const kudaPattern = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+\d{2}:\d{2}:\d{2}/;
  const kudaMatch = dateStr.match(kudaPattern);
  if (kudaMatch) {
    const [_, day, month, yearShort] = kudaMatch;
    const year = yearShort.length === 2 ? parseInt(`20${yearShort}`) : parseInt(yearShort);
    return safeISOString(year, parseInt(month), parseInt(day));
  }

  // 2. Handle OPay Format: DD MMM YYYY
  const opayPattern = /^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/;
  const opayMatch = dateStr.match(opayPattern);
  if (opayMatch) {
    const [_, day, monthStr, year] = opayMatch;
    const months: { [key: string]: number } = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
    return safeISOString(parseInt(year), months[monthStr.toUpperCase()] || 1, parseInt(day));
  }

  // 3. Handle Digital/Union Format: DD-MMM-YY or DD-MMM-YYYY
  const digitalPattern = /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/;
  const digitalMatch = dateStr.match(digitalPattern);
  if (digitalMatch) {
    const [_, day, monthStr, yearStr] = digitalMatch;
    const months: { [key: string]: number } = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
    const year = yearStr.length === 2 ? parseInt(`20${yearStr}`) : parseInt(yearStr);
    return safeISOString(year, months[monthStr.toUpperCase()] || 1, parseInt(day));
  }

  // 4. Handle Slashed Formats (Zenith DD/MM/YYYY vs PalmPay MM/DD/YYYY)
  const slashPattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/;
  const slashMatch = dateStr.match(slashPattern);
  if (slashMatch) {
    const part1 = parseInt(slashMatch[1]);
    const part2 = parseInt(slashMatch[2]);
    const year = parseInt(slashMatch[3]);

    // If the first part is > 12 (like 31/12/2025), it MUST be DD/MM/YYYY
    if (part1 > 12) {
      return safeISOString(year, part2, part1);
    } 
    // If the second part is > 12, it MUST be MM/DD/YYYY
    else if (part2 > 12) {
      return safeISOString(year, part1, part2);
    } 
    // If it's ambiguous (like 05/05/2026), default to the Nigerian standard: DD/MM/YYYY
    else {
      return safeISOString(year, part2, part1);
    }
  }

  // 5. Ultimate Fallback
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}