import express from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { videoProcessor } from '@motion/media';
import { generateId } from '@motion/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const vfxQueue = new Queue('vfx-processing', { connection: { url: REDIS_URL } });

// Create worker
const vfxWorker = new Worker(
  'vfx-processing',
  async (job: Job) => {
    console.log(`Processing job ${job.id}: ${job.data.type}`);
    
    switch (job.data.type) {
      case 'object-removal':
        return await handleObjectRemoval(job);
      case 'blur':
        return await handleBlur(job);
      case 'color-correction':
        return await handleColorCorrection(job);
      case 'stabilization':
        return await handleStabilization(job);
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 1,
  }
);

// Job handlers
async function handleObjectRemoval(job: Job) {
  const { inputPath, outputPath, maskPath, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  // Create temporary directory for processing
  const tmpDir = `/tmp/vfx-${generateId()}`;
  await execAsync(`mkdir -p ${tmpDir}`);
  
  await job.updateProgress(20);
  
  // Extract frames in the affected range
  const frames = await videoProcessor.extractFrames(inputPath, `${tmpDir}/frames`, {
    fps: 30,
    format: 'png',
    startTime,
    duration: endTime - startTime,
  });
  
  await job.updateProgress(40);
  
  // Apply inpainting (simplified - in production would use AI models)
  // For now, we'll use FFmpeg's inpainting filter
  const duration = endTime - startTime;
  
  await execAsync(
    `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} ` +
    `-vf "delogo=x=0:y=0:w=0:h=0:enable='between(t,${startTime},${endTime})'" ` +
    `-c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(90);
  
  // Cleanup
  await execAsync(`rm -rf ${tmpDir}`);
  
  await job.updateProgress(100);
  
  return { outputPath, framesProcessed: frames.length };
}

async function handleBlur(job: Job) {
  const { inputPath, outputPath, blurType, intensity, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const duration = endTime - startTime;
  let filter = '';
  
  switch (blurType) {
    case 'gaussian':
      filter = `boxblur=${intensity}:${intensity}`;
      break;
    case 'motion':
      filter = `motionblur=${intensity}:0:0`;
      break;
    default:
      filter = `boxblur=${intensity}:${intensity}`;
  }
  
  await execAsync(
    `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} ` +
    `-vf "${filter}" -c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleColorCorrection(job: Job) {
  const { inputPath, outputPath, adjustments, startTime, endTime } = job.data;
  
  await job.updateProgress(10);
  
  const duration = endTime - startTime;
  const filters: string[] = [];
  
  if (adjustments.brightness) {
    filters.push(`eq=brightness=${adjustments.brightness}`);
  }
  if (adjustments.contrast) {
    filters.push(`eq=contrast=${adjustments.contrast}`);
  }
  if (adjustments.saturation) {
    filters.push(`eq=saturation=${adjustments.saturation}`);
  }
  if (adjustments.temperature) {
    filters.push(`colortemperature=temperature=${adjustments.temperature}`);
  }
  
  const filterStr = filters.length > 0 ? filters.join(',') : 'null';
  
  await execAsync(
    `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} ` +
    `-vf "${filterStr}" -c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(100);
  
  return { outputPath };
}

async function handleStabilization(job: Job) {
  const { inputPath, outputPath, smoothness } = job.data;
  
  await job.updateProgress(10);
  
  // Two-pass stabilization using FFmpeg
  const analysisFile = `/tmp/stab-${generateId()}.txt`;
  
  // Pass 1: Analyze motion
  await execAsync(
    `ffmpeg -i "${inputPath}" -vf vidstabdetect=shakiness=5:accuracy=15:result="${analysisFile}" -f null -`
  );
  
  await job.updateProgress(50);
  
  // Pass 2: Apply stabilization
  await execAsync(
    `ffmpeg -i "${inputPath}" -vf vidstabtransform=input="${analysisFile}":zoom=1:smoothing=${smoothness}:optzoom=2 -c:a copy "${outputPath}"`
  );
  
  await job.updateProgress(90);
  
  // Cleanup
  await execAsync(`rm -f ${analysisFile}`);
  
  await job.updateProgress(100);
  
  return { outputPath };
}

// Worker events
vfxWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

vfxWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: 'vfx-worker' });
});

app.post('/jobs', async (req, res) => {
  const { type, data } = req.body;
  
  const job = await vfxQueue.add(type, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`VFX worker running on port ${PORT}`);
});
