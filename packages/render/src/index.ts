import ffmpeg from 'fluent-ffmpeg';
import { generateId } from '@motion/shared';
import { ChildProcess } from 'child_process';

export interface RenderConfig {
  outputFormat: 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm';
  codec: 'h264' | 'h265' | 'av1' | 'prores' | 'dnxhr';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  hardwareAcceleration: boolean;
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  outputPath: string;
  config: RenderConfig;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  process?: ChildProcess;
}

export interface RenderInput {
  assets: { path: string; startTime?: number; endTime?: number }[];
  operations: { type: string; parameters: Record<string, unknown> }[];
  output: { path: string; config: RenderConfig };
}

export interface RenderProgressCallback {
  (jobId: string, progress: number): void;
}

const defaultConfig: RenderConfig = {
  outputFormat: 'mp4',
  codec: 'h264',
  quality: 'standard',
  hardwareAcceleration: true,
  preset: 'medium',
};

export class RenderEngine {
  private jobs: Map<string, RenderJob> = new Map();
  private progressCallbacks: Map<string, RenderProgressCallback> = new Map();

  onProgress(jobId: string, callback: RenderProgressCallback): void {
    this.progressCallbacks.set(jobId, callback);
  }

  private notifyProgress(jobId: string, progress: number): void {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(jobId, progress);
    }
  }

  async render(input: RenderInput, projectId?: string): Promise<RenderJob> {
    const jobId = generateId();
    
    const job: RenderJob = {
      id: jobId,
      projectId: projectId || '',
      status: 'queued',
      progress: 0,
      outputPath: input.output.path,
      config: input.output.config || defaultConfig,
    };
    
    this.jobs.set(jobId, job);
    
    try {
      job.status = 'rendering';
      job.startTime = new Date();
      
      await this.processRender(input, job);
      
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      this.notifyProgress(jobId, 100);
    } catch (error) {
      if (job.status === 'cancelled') {
        job.endTime = new Date();
      } else {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = new Date();
      }
    } finally {
      this.progressCallbacks.delete(jobId);
    }
    
    return job;
  }

  private async processRender(input: RenderInput, job: RenderJob): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();
      
      input.assets.forEach(asset => {
        command = command.input(asset.path);
        
        if (asset.startTime !== undefined) {
          command = command.inputOptions(['-ss', asset.startTime.toString()]);
        }
        
        if (asset.endTime !== undefined) {
          command = command.inputOptions(['-to', asset.endTime.toString()]);
        }
      });
      
      const filters: string[] = [];
      
      input.operations.forEach(op => {
        switch (op.type) {
          case 'scale':
            filters.push(`scale=${op.parameters.width}:${op.parameters.height}`);
            break;
          case 'fps':
            filters.push(`fps=${op.parameters.fps}`);
            break;
          case 'crop':
            filters.push(`crop=${op.parameters.width}:${op.parameters.height}:${op.parameters.x}:${op.parameters.y}`);
            break;
          case 'fade':
            filters.push(`fade=t=in:st=${op.parameters.start}:d=${op.parameters.duration}`);
            break;
        }
      });
      
      if (filters.length > 0) {
        command = command.videoFilters(filters.join(','));
      }
      
      const config = job.config;
      
      switch (config.codec) {
        case 'h264':
          command = command.videoCodec('libx264');
          break;
        case 'h265':
          command = command.videoCodec('libx265');
          break;
        case 'av1':
          command = command.videoCodec('libaom-av1');
          break;
        case 'prores':
          command = command.videoCodec('prores_ks');
          command = command.outputOptions(['-profile:v', '3']);
          break;
        case 'dnxhr':
          command = command.videoCodec('dnxhd');
          command = command.outputOptions(['-profile:v', 'dnxhr_hq']);
          break;
      }
      
      switch (config.quality) {
        case 'draft':
          command = command.outputOptions(['-crf', '28', '-preset', 'ultrafast']);
          break;
        case 'standard':
          command = command.outputOptions(['-crf', '23', '-preset', 'medium']);
          break;
        case 'high':
          command = command.outputOptions(['-crf', '18', '-preset', 'slow']);
          break;
        case 'ultra':
          command = command.outputOptions(['-crf', '15', '-preset', 'veryslow']);
          break;
      }
      
      if (config.hardwareAcceleration) {
        command = command.outputOptions([
          '-hwaccel', 'auto',
          '-hwaccel_output_format', 'auto',
        ]);
      }
      
      const ffmpegProcess = command
        .output(job.outputPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            job.progress = Math.round(progress.percent);
            this.notifyProgress(job.id, job.progress);
          }
        })
        .on('end', () => resolve())
        .on('error', (err: Error) => {
          if (job.status === 'cancelled') {
            resolve();
          } else {
            reject(err);
          }
        })
        .run();
      
      job.process = ffmpegProcess as any;
    });
  }

  getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): RenderJob[] {
    return Array.from(this.jobs.values());
  }

  getJobsByProject(projectId: string): RenderJob[] {
    return Array.from(this.jobs.values()).filter(job => job.projectId === projectId);
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'rendering' && job.process) {
      job.process.kill('SIGKILL');
    }
    
    job.status = 'cancelled';
    job.endTime = new Date();
    
    return true;
  }

  deleteJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'rendering') {
      this.cancelJob(jobId);
    }
    
    this.jobs.delete(jobId);
    this.progressCallbacks.delete(jobId);
    
    return true;
  }

  async createPreview(
    input: RenderInput,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      fps?: number;
      quality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<string> {
    const { maxWidth = 640, maxHeight = 360, fps = 24, quality = 'medium' } = options;
    
    const outputPath = input.output.path.replace(/\.[^.]+$/, '_preview.mp4');
    
    const previewInput: RenderInput = {
      ...input,
      output: {
        path: outputPath,
        config: {
          outputFormat: 'mp4',
          codec: 'h264',
          quality: quality === 'low' ? 'draft' : quality === 'medium' ? 'standard' : 'high',
          hardwareAcceleration: true,
          preset: 'fast',
        },
      },
      operations: [
        ...input.operations,
        { type: 'scale', parameters: { width: maxWidth, height: maxHeight } },
        { type: 'fps', parameters: { fps } },
      ],
    };
    
    const job = await this.render(previewInput);
    
    if (job.status === 'failed') {
      throw new Error(job.error || 'Preview render failed');
    }
    
    return outputPath;
  }
}

export const renderEngine = new RenderEngine();
