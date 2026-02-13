export function detectSource(filename = '', content = ''): string {
  const lowerFilename = (filename || '').toLowerCase();
  
  // 1. Access Bank
  if (
    lowerFilename.includes('access') || 
    /Access\s+Bank/i.test(content) || 
    /access\.bank/i.test(content)
  ) {
    return 'Access Bank';
  }

  // 2. PalmPay Detection
  // Checks for: "PalmPay", "Digital Finance", or the unique header layout
  if (
    lowerFilename.includes('palmpay') || 
    /PalmPay/i.test(content) || 
    /Digital\s+Finance/i.test(content) ||
    (/Account\s+Statement[\s\S]{0,100}Name[\s\S]{0,100}Phone\s+Number/i.test(content))
  ) {
    return 'PalmPay';
  }

  // 3. GTBank (Placeholder)
  if (lowerFilename.includes('gtb') || /Guaranty\s+Trust/i.test(content)) {
    return 'GTBank';
  }

  return 'Unknown';
}