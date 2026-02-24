import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ❌ DO NOT statically import the service here!
// import { processBankStatement } from '@/lib/services/bank-statement'; 

export async function POST(request: Request) {
  try {
    // --- 1. THE VERCEL POLYFILL BUNKER ---
    // These MUST run before the PDF library is loaded into memory
    if (typeof global.DOMMatrix === 'undefined') {
      (global as any).DOMMatrix = class DOMMatrix {};
    }
    if (typeof global.Path2D === 'undefined') {
      (global as any).Path2D = class Path2D {};
    }
    if (typeof global.ImageData === 'undefined') {
      (global as any).ImageData = class ImageData {
        constructor() {}
      };
    }
    // -------------------------------------

    // --- 2. DYNAMIC IMPORT ---
    // Safely load your service now that the polyfills are active
    const { processBankStatement } = await import('@/lib/services/bank-statement');

    // 1. Authenticate the User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract File from Request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ status: 'error', message: 'No file provided' }, { status: 400 });
    }

    // 3. Process the Bank Statement
    const result = await processBankStatement(file, user, supabase);

    if (result.status === 'error') {
      let status = 400;
      if (result.message.includes('already uploaded')) {
        status = 409;
      } else if (result.message.includes('Server error')) {
        status = 500;
      }
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Server error',
      details: error.message
    }, { status: 500 });
  }
}