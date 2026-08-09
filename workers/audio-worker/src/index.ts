import express from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { audioProcessor } from '@motion/media';
import { generateId } from '@motion/shared';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const audioQueue = new Queue('audio-processing', { connection: { url: REDIS_URL } });

// Create worker
const audioWorker = new Worker(
  'audio-processing',
  async (job: Job) => {
    console.log(`Processing job ${job.id}: ${job.data.type}`);
    
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
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 2,
  }
);

// Job handlers
async function handleExtractAudio(job: Job) {
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
  const { inputPath, outputPath, targetLoudness } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.normalizeAudio(inputPath, outputPath, targetLoudness);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleApplyEQ(job: Job) {
  const { inputPath, outputPath, bands } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyEQ(inputPath, outputPath, bands);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleApplyGain(job: Job) {
  const { inputPath, outputPath, gainDb } = job.data;
  
  await job.updateProgress(10);
  const result = await audioProcessor.applyGain(inputPath, outputPath, gainDb);
  await job.updateProgress(100);
  
  return { outputPath: result };
}

async function handleGenerateWaveform(job: Job) {
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

// Worker events
audioWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

audioWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: 'audio-worker' });
});

app.post('/jobs', async (req, res) => {
  const { type, data } = req.body;
  
  const job = await audioQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Audio worker running on port ${PORT}`);
});
