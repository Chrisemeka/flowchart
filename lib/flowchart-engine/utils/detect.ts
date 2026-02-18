export function detectSource(filename = '', content = ''): string {
  const lowerFilename = (filename || '').toLowerCase();
  
  // 1. OPay Detection (Bulletproof Table Headers & OCR Typo Fix)
  // Checks for exact table columns from the PDF or the "DPAY" OCR glitch
  if (
    lowerFilename.includes('opay') || 
    (content.includes('Wallet Account') && content.includes('Trans. Time') && content.includes('Balance After')) ||
    /opayweb\.com/i.test(content) ||
    /OPAY\s+DIGITAL/i.test(content) ||
    /DPAY\s+DIGITAL/i.test(content) 
  ) {
    return 'OPay';
  }

  // 2. PalmPay Detection
  if (
    lowerFilename.includes('palmpay') || 
    /PalmPay/i.test(content) || 
    /Digital\s+Finance/i.test(content) ||
    (/Account\s+Statement[\s\S]{0,100}Name[\s\S]{0,100}Phone\s+Number/i.test(content))
  ) {
    return 'PalmPay';
  }

  // 3. Access Bank Detection
  if (
    lowerFilename.includes('access') || 
    /Access\s+Bank/i.test(content) || 
    /access\.bank/i.test(content)
  ) {
    return 'Access Bank';
  }

  return 'Unknown';
}