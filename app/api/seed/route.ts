import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      ok: true,
      message: `Successfully seeded ${result.classesCount} error classes (${result.occurrencesCount} occurrences).`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to seed demo data' }, { status: 500 });
  }
}
