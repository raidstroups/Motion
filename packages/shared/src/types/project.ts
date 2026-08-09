export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  metadata?: Record<string, unknown>;
}

export interface ProjectSettings {
  resolution: { width: number; height: number };
  fps: number;
  duration: number;
  codec: string;
  colorSpace?: string;
  audioSampleRate?: number;
  audioChannels?: number;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: number;
  name?: string;
  description?: string;
  editPlanId?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
