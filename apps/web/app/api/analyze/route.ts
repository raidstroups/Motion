import { NextRequest, NextResponse } from 'next/server';
import { videoAnalyzerAgent } from '@motion/agents';
import { videoProcessor } from '@motion/media';
import { generateId } from '@motion/shared';

interface AnalyzeRequest {
  projectId: string;
  assetId: string;
  assetPath: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { projectId, assetId, assetPath } = body;

    if (!projectId || !assetId || !assetPath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get video info
    const videoInfo = await videoProcessor.getVideoInfo(assetPath);

    // Extract frames for analysis
    const framesDir = `/tmp/motion-analysis/${generateId()}`;
    const frames = await videoProcessor.extractFrames(assetPath, framesDir, {
      fps: 1, // 1 frame per second for analysis
      format: 'jpg',
      quality: 2,
    });

    // Run video analyzer agent
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

    return NextResponse.json({
      success: true,
      analysis,
      videoInfo,
      frameCount: frames.length,
    });
  } catch (error) {
    console.error('Analysis error:', error);
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
