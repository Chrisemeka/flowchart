export function cleanMerchantName(rawDescription: string): string {
  if (!rawDescription) return 'Unknown Merchant';
  
  let name = rawDescription.trim();

  // 1. Decode HTML entities (Common in web-generated PDFs)
  name = name.replace(/&#039;/g, "'");
  name = name.replace(/&amp;/g, "&");

  // 2. Remove Common Nigerian Banking Garbage
  const garbagePatterns = [
    /^POS (PYMT|PURCHASE|WD)/i,
    /^WEB (PYMT|PAYMENT)/i,
    /^NIP (TRANSFER|TRF)/i,
    /^NEFT (TRANSFER|TRF)/i,
    /^COMMISSION/i,
    /^VAT/i,
    /LANG$/i,           // "Lagos Nigeria" suffix (Common in Access Bank POS)
    /LAGOS NG$/i,       // "Lagos Nigeria" suffix
    /NIGERIA$/i,
    /\d{10,}$/          // Trailing long transaction IDs (like 00001426...)
  ];

  garbagePatterns.forEach(pattern => {
    name = name.replace(pattern, '');
  });

  // 3. Remove URLs and Emails
  name = name.replace(/\s+https?:\/\/\S+/gi, '');
  name = name.replace(/\s+[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, '');

  // 4. Final Cleanup
  name = name.replace(/\s+/g, ' ').trim(); // Collapse multiple spaces
  
  // 5. Title Case (Optional: Makes UI look consistent)
  // Converts "ZINNY ONE STOP" -> "Zinny One Stop"
  if (name.length > 0) {
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return name;
}