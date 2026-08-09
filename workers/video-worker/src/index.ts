import express from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { videoProcessor, metadataExtractor, proxyGenerator } from '@motion/media';
import { generateId } from '@motion/shared';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const videoQueue = new Queue('video-processing', { connection: { url: REDIS_URL } });

// Create worker
const videoWorker = new Worker(
  'video-processing',
  async (job: Job) => {
    console.log(`Processing job ${job.id}: ${job.data.type}`);
    
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
  }
);

// Job handlers
async function handleExtractMetadata(job: Job) {
  const { assetId, assetPath } = job.data;
  
  await job.updateProgress(10);
  const metadata = await metadataExtractor.extract(assetPath);
  await job.updateProgress(100);
  
  return { assetId, metadata };
}

async function handleGenerateProxy(job: Job) {
  const { assetId, assetPath, outputDir } = job.data;
  
  await job.updateProgress(10);
  const videoInfo = await videoProcessor.getVideoInfo(assetPath);
  await job.updateProgress(30);
  
  const proxies = await proxyGenerator.generateProxies(assetPath, outputDir, videoInfo);
  await job.updateProgress(100);
  
  return { assetId, proxies };
}

async function handleExtractFrames(job: Job) {
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
  const { assetPath } = job.data;
  
  await job.updateProgress(10);
  const videoInfo = await videoProcessor.getVideoInfo(assetPath);
  await job.updateProgress(30);
  
  const tmpDir = `/tmp/motion-scenes-${generateId()}`;
  const frames = await videoProcessor.extractFrames(assetPath, tmpDir, {
    fps: 1,
    format: 'jpg',
  });
  await job.updateProgress(70);
  
  const scenes = await metadataExtractor.extractSceneMetadata(assetPath);
  await job.updateProgress(100);
  
  return { scenes, videoInfo };
}

// Worker events
videoWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: 'video-worker' });
});

app.post('/jobs', async (req, res) => {
  const { type, data } = req.body;
  
  const job = await videoQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Video worker running on port ${PORT}`);
});
