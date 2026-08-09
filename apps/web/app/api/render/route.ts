import { NextRequest, NextResponse } from 'next/server';
import { renderEngine, RenderConfig } from '@motion/render';
import { jobRepository, projectRepository } from '@motion/database';
import { RenderRequestSchema } from '@motion/schemas';
import { generateId } from '@motion/shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = RenderRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, editPlanId, assets, operations, outputFormat, quality } = validation.data;

    const project = await projectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
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

    const job = await jobRepository.create({
      projectId,
      operationId: editPlanId,
      type: 'rendering',
      priority: 'normal',
      inputAssets: assets.map(a => a.path),
      maxRetries: 2,
    });

    const renderJob = await renderEngine.render({
      assets,
      operations,
      output: {
        path: outputPath,
        config,
      },
    }, projectId);

    await jobRepository.update(job.id, {
      status: renderJob.status === 'completed' ? 'completed' : renderJob.status === 'failed' ? 'failed' : 'running',
      progress: renderJob.progress,
      outputAssets: renderJob.status === 'completed' ? [renderJob.outputPath] : undefined,
      error: renderJob.error,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      renderJobId: renderJob.id,
      status: renderJob.status,
      outputPath: renderJob.outputPath,
    });
  } catch (error) {
    console.error('POST /api/render error:', error);
    return NextResponse.json(
      { error: 'Render failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    const jobs = renderEngine.getAllJobs();
    return NextResponse.json({
      success: true,
      jobs: jobs.map(j => ({
        id: j.id,
        status: j.status,
        progress: j.progress,
        outputPath: j.outputPath,
      })),
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
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      outputPath: job.outputPath,
      startTime: job.startTime,
      endTime: job.endTime,
      error: job.error,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Missing jobId query parameter' },
      { status: 400 }
    );
  }

  const success = renderEngine.cancelJob(jobId);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Job not found or cannot be cancelled' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
