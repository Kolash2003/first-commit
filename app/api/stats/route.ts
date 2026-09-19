import { NextResponse } from 'next/server';
import { getStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to get stats' }, { status: 500 });
  }
}
