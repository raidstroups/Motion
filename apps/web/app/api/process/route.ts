import { NextRequest, NextResponse } from 'next/server';
import { directorAgent } from '@motion/agents';
import { generateId } from '@motion/shared';

interface ProcessRequest {
  projectId: string;
  instruction: string;
  videoAnalysis?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { projectId, instruction, videoAnalysis } = body;

    if (!projectId || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Run director agent to create edit plan
    const editPlan = await directorAgent.execute(
      {
        instruction,
        videoAnalysis,
      },
      {
        projectId,
        userId: 'system',
        assets: [],
        operations: [],
      }
    );

    return NextResponse.json({
      success: true,
      editPlan,
      operationCount: editPlan.operations.length,
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Processing endpoint',
    methods: ['POST'],
  });
}
