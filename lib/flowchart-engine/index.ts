// src/lib/flowchart-engine/index.ts

// 1. USE THE LEGACY BUILD (Critical for Node.js)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import { detectSource } from './utils';
import { parseAccessBankPDF } from './parsers/access';
import { parsePalmPayPDF } from './parsers/palmpay';
import { parseOPayPDF } from './parsers/opay';
import { parseZenithBankPDF } from './parsers/zenith';
import { parseKudaBankPDF } from './parsers/kuda';
import { parseUnionBankPDF } from './parsers/union';

export async function parseBankStatement(fileBuffer: ArrayBuffer) {
  try {
    // 2. Convert to Uint8Array (Required by PDF.js)
    const data = new Uint8Array(fileBuffer);

    // 3. LOAD DOCUMENT WITH FALLBACKS
    // standardFontDataUrl: fixes font loading errors
    // disableFontFace: prevents crash if fonts are missing
    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: true,
      useSystemFonts: true,
      standardFontDataUrl: `node_modules/pdfjs-dist/standard_fonts/`, 
    });

    const pdf = await loadingTask.promise;
    
    // 4. Extract Text Page by Page
    const maxPages = 10;
    const pageTexts: string[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // JOIN STRATEGY:
      // Use '  ' (double space) to safely separate columns visually
      const text = textContent.items
        .map((item: any) => item.str)
        .join('  '); 
        
      pageTexts.push(text);
    }

    const fullText = pageTexts.join('\n\n'); // Separate pages with newlines

    // --- DEBUG LOGS (Keep these until it works) ---
    console.log('--- RAW PDF TEXT START ---');
    console.log(fullText.substring(0, 500)); 
    console.log('--- RAW PDF TEXT END ---');
    // ---------------------------------------------

    if (!fullText.trim()) {
      return {
        status: 'error',
        message: 'PDF is empty or image-based (Scanned). Try a digital statement.',
        detected: 'Unknown'
      };
    }

    // 5. Detect and Parse
    const bankName = detectSource('upload.pdf', fullText); 
    console.log(`Detected Bank: ${bankName}`);

    switch (bankName) {
      case 'Access Bank':
        return {
          status: 'success',
          bank: bankName,
          transactions: parseAccessBankPDF(pageTexts)
        };
      case 'PalmPay':  // <--- ADD THIS BLOCK
        return {
          status: 'success',
          bank: bankName,
          transactions: parsePalmPayPDF(pageTexts)
        };
      case 'OPay': // <--- NEW
        return {
          status: 'success',
          bank: bankName,
          transactions: parseOPayPDF(pageTexts)
        };
      case 'Zenith Bank':
        return {
          status: 'success',
          bank: bankName,
          transactions: parseZenithBankPDF(pageTexts)
        };
      case 'Kuda Bank':
        return {
          status: 'success',
          bank: bankName,
          transactions: parseKudaBankPDF(pageTexts)
        };
     case 'Union Bank':
        return {
          status: 'success',
          bank: bankName,
          transactions: parseUnionBankPDF(pageTexts)
        };
      default:
        return {
          status: 'error',
          message: 'Bank not recognized in text.',
          detected: bankName
        };
    }

  } catch (error: any) {
    console.error('PDF Parsing Crash:', error);
    return {
      status: 'error',
      message: 'Server failed to process PDF',
      error: error.message
    };
  }
}