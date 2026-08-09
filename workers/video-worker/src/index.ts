import express, { Request, Response } from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { videoProcessor, metadataExtractor, proxyGenerator } from '@motion/media';
import { generateId } from '@motion/shared';
import { z } from 'zod';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'video-processing';

// Zod schemas for validation
const ExtractMetadataSchema = z.object({
  assetId: z.string().min(1),
  assetPath: z.string().min(1),
});

const GenerateProxySchema = z.object({
  assetId: z.string().min(1),
  assetPath: z.string().min(1),
  outputDir: z.string().min(1),
});

const ExtractFramesSchema = z.object({
  assetPath: z.string().min(1),
  outputDir: z.string().min(1),
  fps: z.number().min(0.1).max(60).optional(),
  format: z.enum(['jpg', 'png', 'webp']).optional(),
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
});

const DetectScenesSchema = z.object({
  assetPath: z.string().min(1),
});

// Create queues
const videoQueue = new Queue(QUEUE_NAME, { connection: { url: REDIS_URL } });

// Create worker
const videoWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`[VideoWorker] Processing job ${job.id}: ${job.data.type}`);
    
    switch (job.data.type) {
      case 'extract-metadata':
        return await handleExtractMetadata(job);
      case 'generate-proxy':
        return await handleGenerateProxy(job);
      case 'extract-frames':
        return await handleExtractFrames(job);
      case 'detect-scenes':
        return await handleDetectScenes(job);
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 2,
    limiter: { max: 10, duration: 60000 },
  }
);

// Job handlers
async function handleExtractMetadata(job: Job) {
  const validation = ExtractMetadataSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { assetId, assetPath } = job.data;
  
  await job.updateProgress(10);
  const metadata = await metadataExtractor.extract(assetPath);
  await job.updateProgress(100);
  
  return { assetId, metadata };
}

async function handleGenerateProxy(job: Job) {
  const validation = GenerateProxySchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { assetId, assetPath, outputDir } = job.data;
  
  await job.updateProgress(10);
  const videoInfo = await videoProcessor.getVideoInfo(assetPath);
  await job.updateProgress(30);
  
  const proxies = await proxyGenerator.generateProxies(assetPath, outputDir, videoInfo);
  await job.updateProgress(100);
  
  return { assetId, proxies };
}

async function handleExtractFrames(job: Job) {
  const validation = ExtractFramesSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { assetPath, outputDir, fps, format, startTime, duration } = job.data;
  
  await job.updateProgress(10);
  const frames = await videoProcessor.extractFrames(assetPath, outputDir, {
    fps,
    format,
    startTime,
    duration,
  });
  await job.updateProgress(100);
  
  return { frameCount: frames.length, frames };
}

async function handleDetectScenes(job: Job) {
  const validation = DetectScenesSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { assetPath } = job.data;
  
  await job.updateProgress(10);
  const videoInfo = await videoProcessor.getVideoInfo(assetPath);
  await job.updateProgress(30);
  
  const tmpDir = `/tmp/motion-scenes-${generateId()}`;
  const fs = await import('fs');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const frames = await videoProcessor.extractFrames(assetPath, tmpDir, {
    fps: 1,
    format: 'jpg',
  });
  await job.updateProgress(70);
  
  const scenes = await metadataExtractor.extractSceneMetadata(assetPath);
  await job.updateProgress(100);
  
  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    console.warn(`Failed to cleanup temp dir: ${tmpDir}`);
  }
  
  return { scenes, videoInfo };
}

// Worker events
videoWorker.on('completed', (job) => {
  console.log(`[VideoWorker] Job ${job.id} completed`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`[VideoWorker] Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: 'video-worker', timestamp: new Date().toISOString() });
});

app.get('/jobs', async (_req: Request, res: Response) => {
  const jobs = await videoQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
  res.json({ jobs: jobs.map(j => ({ id: j.id, name: j.name, data: j.data, progress: j.progress })) });
});

app.post('/jobs', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }
  
  const job = await videoQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req: Request, res: Response) => {
  const job = await videoQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  res.json({
    jobId: job.id,
    state,
    progress,
    data: job.data,
    result: job.returnvalue,
  });
});

app.delete('/jobs/:jobId', async (req: Request, res: Response) => {
  const job = await videoQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  
  if (state === 'active') {
    return res.status(400).json({ error: 'Cannot delete active job. Use cancel instead.' });
  }
  
  await job.remove();
  res.json({ success: true });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[VideoWorker] Shutting down gracefully...');
  
  await videoWorker.close();
  await videoQueue.close();
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Cleanup temp files periodically
setInterval(async () => {
  const fs = await import('fs');
  const tmpDir = '/tmp';
  
  try {
    const files = fs.readdirSync(tmpDir);
    for (const file of files) {
      if (file.startsWith('motion-')) {
        const filePath = `${tmpDir}/${file}`;
        const stat = fs.statSync(filePath);
        const age = Date.now() - stat.mtimeMs;
        
        if (age > 24 * 60 * 60 * 1000) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[VideoWorker] Running on port ${PORT}`);
});
