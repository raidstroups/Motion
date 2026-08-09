import express, { Request, Response } from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { audioProcessor } from '@motion/media';
import { generateId } from '@motion/shared';
import { z } from 'zod';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'audio-processing';

// Zod schemas for validation
const ExtractAudioSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  codec: z.string().optional(),
  sampleRate: z.number().min(1).optional(),
  channels: z.number().min(1).optional(),
  bitrate: z.string().optional(),
});

const NormalizeAudioSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  targetLoudness: z.number().min(-70).max(0).optional(),
});

const ApplyEQSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  bands: z.array(z.object({
    frequency: z.number().min(20).max(20000),
    gain: z.number().min(-20).max(20),
    q: z.number().min(0.1).max(10),
  })),
});

const ApplyGainSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  gainDb: z.number().min(-70).max(70),
});

const GenerateWaveformSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  width: z.number().min(100).max(4000).optional(),
  height: z.number().min(100).max(2000).optional(),
  color: z.string().optional(),
  bgColor: z.string().optional(),
});

const NoiseReductionSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  intensity: z.number().min(0).max(1).optional(),
  preserveSpeech: z.boolean().optional(),
});

const CompressorSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  threshold: z.number().min(-100).max(0).optional(),
  ratio: z.number().min(1).max(20).optional(),
  attack: z.number().min(0).max(2000).optional(),
  release: z.number().min(10).max(5000).optional(),
});

const PitchShiftSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  semitones: z.number().min(-24).max(24),
});

const TimeStretchSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  speed: z.number().min(0.1).max(10),
});

// Create queues
const audioQueue = new Queue(QUEUE_NAME, { connection: { url: REDIS_URL } });

// Create worker
const audioWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`[AudioWorker] Processing job ${job.id}: ${job.data.type}`);
    
    switch (job.data.type) {
      case 'extract-audio':
        return await handleExtractAudio(job);
      case 'normalize-audio':
        return await handleNormalizeAudio(job);
      case 'apply-eq':
        return await handleApplyEQ(job);
      case 'apply-gain':
        return await handleApplyGain(job);
      case 'generate-waveform':
        return await handleGenerateWaveform(job);
      case 'noise-reduction':
        return await handleNoiseReduction(job);
      case 'compressor':
        return await handleCompressor(job);
      case 'pitch-shift':
        return await handlePitchShift(job);
      case 'time-stretch':
        return await handleTimeStretch(job);
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
async function handleExtractAudio(job: Job) {
  const validation = ExtractAudioSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, codec, sampleRate, channels, bitrate } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.extractAudio(inputPath, outputPath, {
    codec,
    sampleRate,
    channels,
    bitrate,
  });
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleNormalizeAudio(job: Job) {
  const validation = NormalizeAudioSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, targetLoudness } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.normalizeAudio(inputPath, outputPath, targetLoudness);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleApplyEQ(job: Job) {
  const validation = ApplyEQSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, bands } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyEQ(inputPath, outputPath, bands);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleApplyGain(job: Job) {
  const validation = ApplyGainSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, gainDb } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyGain(inputPath, outputPath, gainDb);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleGenerateWaveform(job: Job) {
  const validation = GenerateWaveformSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, width, height, color, bgColor } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.generateWaveform(inputPath, outputPath, {
    width,
    height,
    color,
    bgColor,
  });
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleNoiseReduction(job: Job) {
  const validation = NoiseReductionSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, intensity, preserveSpeech } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyNoiseReduction(inputPath, outputPath, {
    intensity,
    preserveSpeech,
  });
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleCompressor(job: Job) {
  const validation = CompressorSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, threshold, ratio, attack, release } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyCompressor(inputPath, outputPath, {
    threshold,
    ratio,
    attack,
    release,
  });
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handlePitchShift(job: Job) {
  const validation = PitchShiftSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, semitones } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyPitchShift(inputPath, outputPath, semitones);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleTimeStretch(job: Job) {
  const validation = TimeStretchSchema.safeParse(job.data);
  if (!validation.success) {
    throw new Error(`Invalid job data: ${validation.error.message}`);
  }

  const { inputPath, outputPath, speed } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyTimeStretch(inputPath, outputPath, speed);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

// Worker events
audioWorker.on('completed', (job) => {
  console.log(`[AudioWorker] Job ${job.id} completed`);
});

audioWorker.on('failed', (job, err) => {
  console.error(`[AudioWorker] Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', worker: 'audio-worker', timestamp: new Date().toISOString() });
});

app.get('/jobs', async (_req: Request, res: Response) => {
  const jobs = await audioQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
  res.json({ jobs: jobs.map(j => ({ id: j.id, name: j.name, data: j.data, progress: j.progress })) });
});

app.post('/jobs', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }
  
  const job = await audioQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req: Request, res: Response) => {
  const job = await audioQueue.getJob(req.params.jobId);
  
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
  const job = await audioQueue.getJob(req.params.jobId);
  
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
  
  console.log('[AudioWorker] Shutting down gracefully...');
  
  await audioWorker.close();
  await audioQueue.close();
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[AudioWorker] Running on port ${PORT}`);
});
