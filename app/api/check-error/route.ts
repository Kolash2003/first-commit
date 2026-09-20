import { NextResponse } from 'next/server';
import { matchError } from '@/lib/matching';
import { eventBus } from '@/lib/event-bus';

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


    if (result.match && result.error_class_id) {
      eventBus.emit({
        type: 'check_match',
        errorClassId: result.error_class_id,
        title: result.root_cause || body.error_message.substring(0, 80),
        occurrenceCount: result.occurrence_count || 1,
        project: body.project,
        technologies: body.technology,
        timestamp: new Date().toISOString(),
      });
    } else if (!result.match) {
      eventBus.emit({
        type: 'check_new',
        errorClassId: '',
        title: body.error_message.substring(0, 80),
        occurrenceCount: 0,
        project: body.project,
        technologies: body.technology,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to check error.' },
      { status: 500 }
    );
  }
}
