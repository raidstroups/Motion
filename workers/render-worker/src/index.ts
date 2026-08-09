import express, { Request, Response } from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { renderEngine, RenderConfig } from '@motion/render';
import { generateId } from '@motion/shared';
import { z } from 'zod';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'render-processing';

// Zod schemas for validation
const RenderSchema = z.object({
  projectId: z.string().min(1),
  assets: z.array(z.object({
    path: z.string().min(1),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
  })).min(1),
  operations: z.array(z.object({
    type: z.string(),
    parameters: z.record(z.unknown()),
  })),
  outputConfig: z.object({
    format: z.enum(['mp4', 'mov', 'avi', 'mkv', 'webm']).optional(),
    codec: z.enum(['h264', 'h265', 'av1', 'prores', 'dnxhr']).optional(),
    quality: z.enum(['draft', 'standard', 'high', 'ultra']).optional(),
  }).optional(),
});

const RenderPreviewSchema = z.object({
  assets: z.array(z.object({
    path: z.string().min(1),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
  })).min(1),
  operations: z.array(z.object({
    type: z.string(),
    parameters: z.record(z.unknown()),
  })),
  options: z.object({
    maxWidth: z.number().min(100).max(4000).optional(),
    maxHeight: z.number().min(100).max(4000).optional(),
    fps: z.number().min(1).max(60).optional(),
    quality: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

// Create queues
const renderQueue = new Queue(QUEUE_NAME, { connection: { url: REDIS_URL } });

// Create worker
const renderWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`[RenderWorker] Processing job ${job.id}: ${job.data.type}`);
    
    switch (job.data.type) {
      case 'render':
        return await handleRender(job);
      case 'render-preview':
        return await handleRenderPreview(job);
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 1,
    limiter: { max: 3, duration: 60000 },
  }
);

// Job handlers
async function handleRender(job: Job) {
  const validation = RenderSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { projectId, assets, operations, outputConfig } = job.data;
  
  await job.updateProgress(10);
  
  const config: RenderConfig = {
    outputFormat: outputConfig?.format || 'mp4',
    codec: outputConfig?.codec || 'h264',
    quality: outputConfig?.quality || 'standard',
    hardwareAcceleration: true,
    preset: 'medium',
  };
  
  const outputPath = `/tmp/motion-renders/${generateId()}.mp4`;
  
  const renderJob = await renderEngine.render({
    assets,
    operations,
    output: {
      path: outputPath,
      config,
    },
  }, projectId);
  
  // Monitor progress
  const progressInterval = setInterval(() => {
    const jobStatus = renderEngine.getJob(renderJob.id);
    if (jobStatus) {
      job.updateProgress(10 + jobStatus.progress * 0.9);
    }
  }, 1000);
  
  // Wait for render to complete
  while (renderJob.status === 'rendering') {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  clearInterval(progressInterval);
  
  await job.updateProgress(100);
  
  return { 
    outputPath: renderJob.outputPath,
    status: renderJob.status,
    duration: renderJob.endTime && renderJob.startTime 
      ? renderJob.endTime.getTime() - renderJob.startTime.getTime()
      : 0,
  };
}

async function handleRenderPreview(job: Job) {
  const validation = RenderPreviewSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { assets, operations, options } = job.data;
  
  await job.updateProgress(10);
  
  const outputPath = `/tmp/motion-renders/${generateId()}_preview.mp4`;
  
  const previewPath = await renderEngine.createPreview(
    {
      assets,
      operations,
      output: {
        path: outputPath,
        config: {
          outputFormat: 'mp4',
          codec: 'h264',
          quality: 'draft',
          hardwareAcceleration: true,
          preset: 'fast',
        },
      },
    },
    options
  );
  
  await job.updateProgress(100);
  
  return { outputPath: previewPath };
}

// Worker events
renderWorker.on('completed', (job) => {
  console.log(`[RenderWorker] Job ${job.id} completed`);
});

renderWorker.on('failed', (job, err) => {
  console.error(`[RenderWorker] Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: 'render-worker', timestamp: new Date().toISOString() });
});

app.get('/jobs', (_req: Request, res: Response) => {
  const jobs = renderEngine.getAllJobs();
  res.json({ jobs: jobs.map(j => ({ id: j.id, status: j.status, progress: j.progress })) });
});

app.get('/jobs/:jobId', (req: Request, res: Response) => {
  const job = renderEngine.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    outputPath: job.outputPath,
    startTime: job.startTime,
    endTime: job.endTime,
    error: job.error,
  });
});

app.post('/jobs', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }
  
  const job = await renderQueue.add(type, data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.delete('/jobs/:jobId', (req: Request, res: Response) => {
  const success = renderEngine.cancelJob(req.params.jobId);
  
  if (!success) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({ success: true });
});

app.delete('/jobs', (req: Request, res: Response) => {
  const { jobId } = req.query;
  
  if (jobId) {
    const success = renderEngine.deleteJob(jobId as string);
    if (!success) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ success: true });
  }
  
  res.status(400).json({ error: 'Missing jobId query parameter' });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[RenderWorker] Shutting down gracefully...');
  
  // Cancel all rendering jobs
  const jobs = renderEngine.getAllJobs();
  for (const job of jobs) {
    if (job.status === 'rendering') {
      renderEngine.cancelJob(job.id);
    }
  }
  
  await renderWorker.close();
  await renderQueue.close();
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`[RenderWorker] Running on port ${PORT}`);
});
