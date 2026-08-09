export type JobType = 
  | 'video_analysis'
  | 'object_detection'
  | 'segmentation'
  | 'tracking'
  | 'mask_generation'
  | 'object_removal'
  | 'color_correction'
  | 'audio_processing'
  | 'transition'
  | 'compositing'
  | 'rendering'
  | 'qa';

export type JobStatus = 
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface RenderJob {
  id: string;
  projectId: string;
  operationId: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  progress: number;
  workerId?: string;
  inputAssets: string[];
  outputAssets?: string[];
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface JobGraph {
  nodes: JobNode[];
  edges: JobEdge[];
}

export interface JobNode {
  id: string;
  jobId: string;
  type: JobType;
  status: JobStatus;
}

export interface JobEdge {
  from: string;
  to: string;
  type: 'requires' | 'optional';
}

export interface WorkerInfo {
  id: string;
  type: string;
  status: 'available' | 'busy' | 'offline';
  capabilities: string[];
  currentJobId?: string;
  maxConcurrentJobs: number;
  gpuAvailable: boolean;
}
