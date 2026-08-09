import express from 'express';
import { Queue, Worker, Job } from 'bullmq';
import { renderEngine, RenderConfig } from '@motion/render';
import { generateId } from '@motion/shared';

const app = express();
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
const renderQueue = new Queue('render-processing', { connection: { url: REDIS_URL } });

// Create worker
const renderWorker = new Worker(
  'render-processing',
  async (job: Job) => {
    console.log(`Processing job ${job.id}: ${job.data.type}`);
    
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
  }
);

// Job handlers
async function handleRender(job: Job) {
  const { assets, operations, outputConfig } = job.data;
  
  await job.updateProgress(10);
  
  const config: RenderConfig = {
    outputFormat: outputConfig.format || 'mp4',
    codec: outputConfig.codec || 'h264',
    quality: outputConfig.quality || 'standard',
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
  });
  
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
  console.log(`Job ${job.id} completed`);
});

renderWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: 'render-worker' });
});

app.post('/jobs', async (req, res) => {
  const { type, data } = req.body;
  
  const job = await renderQueue.add(type, data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  });
  
  res.json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:jobId', async (req, res) => {
  const job = await renderQueue.getJob(req.params.jobId);
  
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
const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Render worker running on port ${PORT}`);
});
