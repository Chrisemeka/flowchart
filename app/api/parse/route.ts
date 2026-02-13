// src/app/api/parse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseBankStatement } from '@/lib/flowchart-engine';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Call the Engine
    const result = await parseBankStatement(arrayBuffer);

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}