import { NextResponse } from 'next/server';
import { matchError } from '@/lib/matching';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.error_message) {
      return NextResponse.json({ error: 'error_message is required' }, { status: 400 });
    }

    const result = await matchError({
      error_message: body.error_message,
      stack_trace: body.stack_trace,
      context: body.context,
      project: body.project,
      technology: body.technology,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to check error.' },
      { status: 500 }
    );
  }
}
