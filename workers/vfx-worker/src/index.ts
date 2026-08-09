import express, { Request, Response } from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { videoProcessor } from '@motion/media';
import { generateId } from '@motion/shared';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'vfx-processing';

// Zod schemas for validation
const ObjectRemovalSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  maskPath: z.string().optional(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
});

const BlurSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  blurType: z.enum(['gaussian', 'motion', 'radial', 'lens']),
  intensity: z.number().min(1).max(100),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
});

const ColorCorrectionSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  adjustments: z.object({
    brightness: z.number().min(-1).max(1).optional(),
    contrast: z.number().min(-100).max(100).optional(),
    saturation: z.number().min(-100).max(100).optional(),
    temperature: z.number().min(-100).max(100).optional(),
    gamma: z.number().min(0.1).max(10).optional(),
  }),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
});

const StabilizationSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  smoothness: z.number().min(1).max(100).optional(),
});

const TrimSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
});

const ConcatSchema = z.object({
  inputPaths: z.array(z.string().min(1)).min(2),
  outputPath: z.string().min(1),
});

const FadeSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  fadeIn: z.number().min(0).optional(),
  fadeOut: z.number().min(0).optional(),
});

const ScaleSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  width: z.number().min(1).max(8192),
  height: z.number().min(1).max(8192),
});

// Create queues
const vfxQueue = new Queue(QUEUE_NAME, { connection: { url: REDIS_URL } });

// Create worker
const vfxWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`[VFXWorker] Processing job ${job.id}: ${job.data.type}`);
    
    switch (job.data.type) {
      case 'object-removal':
        return await handleObjectRemoval(job);
      case 'blur':
        return await handleBlur(job);
      case 'color-correction':
        return await handleColorCorrection(job);
      case 'stabilization':
        return await handleStabilization(job);
      case 'trim':
        return await handleTrim(job);
      case 'concat':
        return await handleConcat(job);
      case 'fade':
        return await handleFade(job);
      case 'scale':
        return await handleScale(job);
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 1,
    limiter: { max: 5, duration: 60000 },
  }
);

// Job handlers
async function handleObjectRemoval(job: Job) {
  const validation = ObjectRemovalSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const tmpDir = `/tmp/vfx-${generateId()}`;
  await execAsync(`mkdir -p ${tmpDir}`);
  
  await job.updateProgress(20);
  
  const duration = endTime - startTime;
  
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -ss ${startTime} -t ${duration} ` +
    `-vf "delogo=x=0:y=0:w=0:h=0:enable='between(t,${startTime},${endTime})'" ` +
    `-c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(90);
  
  try {
    await execAsync(`rm -rf ${tmpDir}`);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleBlur(job: Job) {
  const validation = BlurSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, blurType, intensity, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const duration = endTime !== undefined && startTime !== undefined ? endTime - startTime : undefined;
  let filter = '';
  
  switch (blurType) {
    case 'gaussian':
      filter = `boxblur=${intensity}:${intensity}`;
      break;
    case 'motion':
      filter = `motionblur=${intensity}:0:0`;
      break;
    case 'radial':
      filter = `gblur=sigma=${intensity}`;
      break;
    case 'lens':
      filter = `lenscorrection=cx=0.5:cy=0.5:k1=${intensity * 0.01}`;
      break;
    default:
      filter = `boxblur=${intensity}:${intensity}`;
  }
  
  let command = `ffmpeg -y -i "${inputPath}"`;
  
  if (startTime !== undefined) {
    command += ` -ss ${startTime}`;
  }
  if (duration !== undefined) {
    command += ` -t ${duration}`;
  }
  
  command += ` -vf "${filter}" -c:a copy "${outputPath}"`;
  
  await execAsync(command);
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleColorCorrection(job: Job) {
  const validation = ColorCorrectionSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, adjustments, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const duration = endTime !== undefined && startTime !== undefined ? endTime - startTime : undefined;
  const filters: string[] = [];
  
  if (adjustments.brightness !== undefined) {
    filters.push(`eq=brightness=${adjustments.brightness}`);
  }
  if (adjustments.contrast !== undefined) {
    filters.push(`eq=contrast=${adjustments.contrast}`);
  }
  if (adjustments.saturation !== undefined) {
    filters.push(`eq=saturation=${adjustments.saturation}`);
  }
  if (adjustments.temperature !== undefined) {
    filters.push(`colortemperature=temperature=${adjustments.temperature}`);
  }
  if (adjustments.gamma !== undefined) {
    filters.push(`eq=gamma=${adjustments.gamma}`);
  }
  
  const filterStr = filters.length > 0 ? filters.join(',') : 'null';
  
  let command = `ffmpeg -y -i "${inputPath}"`;
  
  if (startTime !== undefined) {
    command += ` -ss ${startTime}`;
  }
  if (duration !== undefined) {
    command += ` -t ${duration}`;
  }
  
  command += ` -vf "${filterStr}" -c:a copy "${outputPath}"`;
  
  await execAsync(command);
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleStabilization(job: Job) {
  const validation = StabilizationSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, smoothness = 10 } = job.data;
  
  await job.updateProgress(10);
  
  const analysisFile = `/tmp/stab-${generateId()}.txt`;
  
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -vf vidstabdetect=shakiness=5:accuracy=15:result="${analysisFile}" -f null -`
  );
  
  await job.updateProgress(50);
  
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -vf vidstabtransform=input="${analysisFile}":zoom=1:smoothing=${smoothness}:optzoom=2 -c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(90);
  
  try {
    await execAsync(`rm -f ${analysisFile}`);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleTrim(job: Job) {
  const validation = TrimSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const duration = endTime - startTime;
  
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`
  );
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleConcat(job: Job) {
  const validation = ConcatSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPaths, outputPath } = job.data;
  
  await job.updateProgress(10);
  
  const fs = await import('fs');
  const listFile = `${outputPath}_list.txt`;
  
  fs.writeFileSync(
    listFile,
    inputPaths.map((p: string) => `file '${p}'`).join('\n')
  );
  
  await execAsync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputPath}"`
  );
  
  try {
    fs.unlinkSync(listFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleFade(job: Job) {
  const validation = FadeSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, fadeIn, fadeOut } = job.data;
  
  await job.updateProgress(10);
  
  const filters: string[] = [];
  
  if (fadeIn && fadeIn > 0) {
    filters.push(`fade=t=in:st=0:d=${fadeIn}`);
  }
  
  if (fadeOut && fadeOut > 0) {
    const videoInfo = await videoProcessor.getVideoInfo(inputPath);
    const fadeStart = Math.max(0, videoInfo.duration - fadeOut);
    filters.push(`fade=t=out:st=${fadeStart}:d=${fadeOut}`);
  }
  
  if (filters.length === 0) {
    await execAsync(`cp "${inputPath}" "${outputPath}"`);
  } else {
    await execAsync(
      `ffmpeg -y -i "${inputPath}" -vf "${filters.join(',')}" -c:a copy "${outputPath}"`
    );
  }
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleScale(job: Job) {
  const validation = ScaleSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, width, height } = job.data;
  
  await job.updateProgress(10);
  
  await execAsync(
    `ffmpeg -y -i "${inputPath}" -vf "scale=${width}:${height}" -c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(100);
  
  return { outputPath };
}

// Worker events
vfxWorker.on('completed', (job) => {
  console.log(`[VFXWorker] Job ${job.id} completed`);
});

vfxWorker.on('failed', (job, err) => {
  console.error(`[VFXWorker] Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: 'vfx-worker', timestamp: new Date().toISOString() });
});

app.get('/jobs', async (_req: Request, res: Response) => {
  const jobs = await vfxQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
  res.json({ jobs: jobs.map(j => ({ id: j.id, name: j.name, data: j.data, progress: j.progress })) });
});

app.post('/jobs', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }
  
  const job = await vfxQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req: Request, res: Response) => {
  const job = await vfxQueue.getJob(req.params.jobId);
  
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
  const job = await vfxQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  
  if (state === 'active') {
    return res.status(400).json({ error: 'Cannot delete active job' });
  }
  
  await job.remove();
  res.json({ success: true });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[VFXWorker] Shutting down gracefully...');
  
  await vfxWorker.close();
  await vfxQueue.close();
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`[VFXWorker] Running on port ${PORT}`);
});
