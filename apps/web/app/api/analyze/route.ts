import { NextRequest, NextResponse } from 'next/server';
import { videoAnalyzerAgent } from '@motion/agents';
import { videoProcessor } from '@motion/media';
import { agentRunRepository, projectRepository } from '@motion/database';
import { AnalyzeRequestSchema } from '@motion/schemas';
import { generateId } from '@motion/shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = AnalyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, assetId, assetPath } = validation.data;

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const run = await agentRunRepository.create({
      projectId,
      agentType: 'video_analyzer',
      input: { assetId, assetPath },
      model: 'gpt-4o',
    });

    try {
      await agentRunRepository.update(run.id, { status: 'analyzing' });

      const videoInfo = await videoProcessor.getVideoInfo(assetPath);
      await agentRunRepository.update(run.id, { status: 'planning' });

      const framesDir = `/tmp/motion-analysis/${generateId()}`;
      const frames = await videoProcessor.extractFrames(assetPath, framesDir, {
        fps: 1,
        format: 'jpg',
        quality: 2,
      });

      await agentRunRepository.update(run.id, { status: 'executing' });

      const analysis = await videoAnalyzerAgent.execute(
        {
          assetId,
          frames,
        },
        {
          projectId,
          userId: 'system',
          assets: [{ id: assetId, path: assetPath }],
          operations: [],
        }
      );

      const tokenUsage = videoAnalyzerAgent.getTokenUsage();

      await agentRunRepository.complete(run.id, { analysis, videoInfo }, tokenUsage as any);

      return NextResponse.json({
        success: true,
        runId: run.id,
        analysis,
        videoInfo,
        frameCount: frames.length,
      });
    } catch (error) {
      await agentRunRepository.fail(run.id, error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    }
  } catch (error) {
    console.error('POST /api/analyze error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Video analysis endpoint',
    methods: ['POST'],
  });
}
