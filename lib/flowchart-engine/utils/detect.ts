export function detectSource(filename = '', content = ''): string {
  const lowerFilename = (filename || '').toLowerCase();
  
  // 1. Kuda Bank (Check this first to avoid OPay false positives)
  if (
    lowerFilename.includes('kuda') || 
    /Kuda\s+Microfinance/i.test(content) || 
    /Kuda\s+Technologies/i.test(content) ||
    /Kuda\s+MF\s+Bank/i.test(content)
  ) {
    return 'Kuda Bank';
  }

  // 2. Zenith Bank
  if (
    lowerFilename.includes('zenith') || 
    /ZENITH\s+BANK\s+PLC/i.test(content) || 
    /www\.zenithbank\.com/i.test(content)
  ) {
    return 'Zenith Bank';
  }

  // 3. Union Bank
  if (
    lowerFilename.includes('union') || 
    /Union\s+Bank\s+of\s+Nigeria/i.test(content) || 
    /UNION\s+BANK/i.test(content)
  ) {
    return 'Union Bank';
  }

  // 4. OPay Detection
  if (
    lowerFilename.includes('opay') || 
    (content.includes('Wallet Account') && content.includes('Trans. Time') && content.includes('Balance After')) ||
    /opayweb\.com/i.test(content)
  ) {
    return 'OPay';
  }

  // 5. PalmPay Detection
  if (
    lowerFilename.includes('palmpay') || 
    /PalmPay/i.test(content) || 
    /Digital\s+Finance/i.test(content) ||
    (/Account\s+Statement[\s\S]{0,100}Name[\s\S]{0,100}Phone\s+Number/i.test(content))
  ) {
    return 'PalmPay';
  }

  // 6. Access Bank Detection
  if (
    lowerFilename.includes('access') || 
    /Access\s+Bank/i.test(content) || 
    /access\.bank/i.test(content)
  ) {
    return 'Access Bank';
  }

  return 'Unknown';
}