import { NextRequest, NextResponse } from 'next/server';
import { renderEngine, RenderConfig } from '@motion/render';
import { generateId } from '@motion/shared';

interface RenderRequest {
  projectId: string;
  editPlanId: string;
  assets: { path: string; startTime?: number; endTime?: number }[];
  operations: { type: string; parameters: Record<string, unknown> }[];
  outputFormat?: string;
  quality?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const { 
      projectId, 
      editPlanId, 
      assets, 
      operations, 
      outputFormat = 'mp4',
      quality = 'standard'
    } = body;

    if (!projectId || !editPlanId || !assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config: RenderConfig = {
      outputFormat: outputFormat as RenderConfig['outputFormat'],
      codec: 'h264',
      quality: quality as RenderConfig['quality'],
      hardwareAcceleration: true,
      preset: 'medium',
    };

    const outputPath = `/tmp/motion-renders/${projectId}/${generateId()}.mp4`;

    const renderJob = await renderEngine.render({
      assets,
      operations,
      output: {
        path: outputPath,
        config,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: renderJob.id,
      status: renderJob.status,
      outputPath: renderJob.outputPath,
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: 'Render failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({
      message: 'Render endpoint',
      methods: ['POST', 'GET'],
    });
  }

  const job = renderEngine.getJob(jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job,
  });
}
