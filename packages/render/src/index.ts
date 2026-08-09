import ffmpeg from 'fluent-ffmpeg';
import { generateId } from '@motion/shared';

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
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  outputPath: string;
  config: RenderConfig;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface RenderInput {
  assets: { path: string; startTime?: number; endTime?: number }[];
  operations: { type: string; parameters: Record<string, unknown> }[];
  output: { path: string; config: RenderConfig };
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

  async render(input: RenderInput): Promise<RenderJob> {
    const jobId = generateId();
    
    const job: RenderJob = {
      id: jobId,
      projectId: '',
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
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
    }
    
    return job;
  }

  private async processRender(input: RenderInput, job: RenderJob): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();
      
      // Add input assets
      input.assets.forEach(asset => {
        command = command.input(asset.path);
        
        if (asset.startTime !== undefined) {
          command = command.inputOptions(['-ss', asset.startTime.toString()]);
        }
        
        if (asset.endTime !== undefined) {
          command = command.inputOptions(['-to', asset.endTime.toString()]);
        }
      });
      
      // Apply operations
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
          case 'trim':
            // Handled via input options
            break;
          case 'fade':
            filters.push(`fade=t=in:st=${op.parameters.start}:d=${op.parameters.duration}`);
            break;
        }
      });
      
      if (filters.length > 0) {
        command = command.videoFilters(filters.join(','));
      }
      
      // Configure output
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
      
      // Quality settings
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
      
      // Hardware acceleration
      if (config.hardwareAcceleration) {
        command = command.outputOptions([
          '-hwaccel', 'auto',
          '-hwaccel_output_format', 'auto',
        ]);
      }
      
      // Progress tracking
      command.on('progress', (progress) => {
        if (progress.percent) {
          job.progress = Math.round(progress.percent);
        }
      });
      
      command
        .output(job.outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  getJob(jobId: string): RenderJob | undefined {
    return this.jobs.get(jobId);
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'rendering') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.endTime = new Date();
      return true;
    }
    return false;
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
