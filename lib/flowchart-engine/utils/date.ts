export function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();

  // 1. Handle OPay Format: DD MMM YYYY (e.g., 18 Jan 2026 16:57:24)
  const opayPattern = /^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/;
  const opayMatch = dateStr.match(opayPattern);

  if (opayMatch) {
    const [_, day, monthStr, year] = opayMatch;
    const months: { [key: string]: string } = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const month = months[monthStr.toUpperCase()] || '01';
    return new Date(`${year}-${month}-${day}`).toISOString();
  }

  // 2. Handle PalmPay Format: MM/DD/YYYY
  const palmPayPattern = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const palmMatch = dateStr.match(palmPayPattern);

  if (palmMatch) {
    const [_, month, day, year] = palmMatch;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }

  // 3. Handle Digital Format (Access): DD-MMM-YY
  const digitalPattern = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})/;
  const digitalMatch = dateStr.match(digitalPattern);

  if (digitalMatch) {
    const [_, day, monthStr, yearShort] = digitalMatch;
    const months: { [key: string]: string } = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const month = months[monthStr.toUpperCase()] || '01';
    const year = `20${yearShort}`;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }

  // 4. Handle Scanned/Generic Format: DD/MM/YYYY
  const classicPattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/;
  const match = dateStr.match(classicPattern);

  if (match) {
    const [_, day, month, year] = match;
    return new Date(`${year}-${month}-${day}`).toISOString();
  }

  // 5. Fallback
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}