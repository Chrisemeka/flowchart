import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processBankStatement } from '@/lib/services/bank-statement';

export async function POST(request: Request) {
  try {
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
