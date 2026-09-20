import { NextResponse } from 'next/server';
import { logResolution } from '@/lib/capture';
import { eventBus } from '@/lib/event-bus';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.error_message || !body.root_cause || !body.fix || !body.explanation) {
      return NextResponse.json(
        { error: 'Missing required fields: error_message, root_cause, fix, explanation.' },
        { status: 400 }
      );
    }

    const result = await logResolution({
      error_message: body.error_message,
      stack_trace: body.stack_trace,
      root_cause: body.root_cause,
      fix: body.fix,
      explanation: body.explanation,
      diagrams: body.diagrams,
      technology: body.technology,
      files: body.files,
      project: body.project,
      concepts: body.concepts,
      matched_error_class_id: body.matched_error_class_id,
      user_solved_unaided: body.user_solved_unaided,
    });


    eventBus.emit({
      type: 'capture',
      errorClassId: result.error_class_id,
      title: result.title,
      occurrenceCount: result.occurrence_count,
      project: body.project,
      technologies: body.technology,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to log resolution.' },
      { status: 500 }
    );
  }
}
