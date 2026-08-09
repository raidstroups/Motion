import { NextRequest, NextResponse } from 'next/server';
import { directorAgent } from '@motion/agents';
import { agentRunRepository, projectRepository, editOperationRepository } from '@motion/database';
import { ProcessRequestSchema } from '@motion/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = ProcessRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, instruction, videoAnalysis } = validation.data;

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const run = await agentRunRepository.create({
      projectId,
      agentType: 'director',
      input: { instruction, videoAnalysis },
      model: 'gpt-4o',
    });

    try {
      await agentRunRepository.update(run.id, { status: 'analyzing' });

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

      await agentRunRepository.update(run.id, { status: 'executing' });

      for (const operation of editPlan.operations) {
        await editOperationRepository.create({
          projectId,
          type: operation.type,
          sourceClipId: operation.sourceClipId,
          startTime: operation.startTime,
          endTime: operation.endTime,
          priority: operation.priority,
          status: 'planned',
          confidence: operation.confidence,
          dependencies: { ids: operation.dependencies },
          parameters: (operation as any).parameters || {},
        });
      }

      const tokenUsage = directorAgent.getTokenUsage();

      await agentRunRepository.complete(run.id, { editPlan }, tokenUsage as any);

      return NextResponse.json({
        success: true,
        runId: run.id,
        editPlan,
        operationCount: editPlan.operations.length,
      });
    } catch (error) {
      await agentRunRepository.fail(run.id, error instanceof Error ? error.message : 'Processing failed');
      throw error;
    }
  } catch (error) {
    console.error('POST /api/process error:', error);
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
