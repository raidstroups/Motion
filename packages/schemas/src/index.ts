import { z } from 'zod';

export const ProjectSettingsSchema = z.object({
  resolution: z.object({
    width: z.number().min(1).max(8192),
    height: z.number().min(1).max(8192),
  }),
  fps: z.number().min(1).max(120),
  duration: z.number().min(0),
  codec: z.string(),
  colorSpace: z.string().optional(),
  audioSampleRate: z.number().optional(),
  audioChannels: z.number().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'processing', 'completed', 'failed']),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  settings: ProjectSettingsSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const AssetSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['video', 'audio', 'image']),
  name: z.string().min(1),
  url: z.string().url(),
  proxyUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  mimeType: z.string(),
  size: z.number().min(0),
  duration: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export const VideoMetadataSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1),
  fps: z.number().min(1),
  duration: z.number().min(0),
  codec: z.string(),
  bitrate: z.number().min(0),
  audioCodec: z.string().optional(),
  audioSampleRate: z.number().optional(),
  audioChannels: z.number().optional(),
  colorSpace: z.string().optional(),
  bitDepth: z.number().optional(),
});

export const ClipSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  assetId: z.string().uuid(),
  name: z.string().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  inPoint: z.number().min(0),
  outPoint: z.number().min(0),
  metadata: z.record(z.unknown()).optional(),
});

export const EditOperationSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  sourceClipId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  priority: z.number().min(0).max(100),
  status: z.enum(['planned', 'analyzing', 'processing', 'compositing', 'qa', 'completed', 'failed']),
  confidence: z.number().min(0).max(1),
  dependencies: z.array(z.string().uuid()),
  metadata: z.record(z.unknown()).optional(),
});

export const ObjectRemovalOperationSchema = EditOperationSchema.extend({
  type: z.literal('object_removal'),
  objectId: z.string().uuid(),
  maskId: z.string().uuid().optional(),
  method: z.enum(['inpainting', 'exclusion', 'replacement']),
  preserveBackground: z.boolean(),
});

export const ColorCorrectionOperationSchema = EditOperationSchema.extend({
  type: z.literal('color_correction'),
  maskId: z.string().uuid().optional(),
  adjustments: z.object({
    exposure: z.number().min(-5).max(5).optional(),
    contrast: z.number().min(-100).max(100).optional(),
    highlights: z.number().min(-100).max(100).optional(),
    shadows: z.number().min(-100).max(100).optional(),
    whites: z.number().min(-100).max(100).optional(),
    blacks: z.number().min(-100).max(100).optional(),
    temperature: z.number().min(-100).max(100).optional(),
    tint: z.number().min(-100).max(100).optional(),
    saturation: z.number().min(-100).max(100).optional(),
    vibrance: z.number().min(-100).max(100).optional(),
  }),
  scope: z.enum(['global', 'scene', 'shot', 'object', 'face', 'mask']),
});

export const RenderJobSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  operationId: z.string().uuid(),
  type: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100),
  workerId: z.string().uuid().optional(),
  inputAssets: z.array(z.string().uuid()),
  outputAssets: z.array(z.string().uuid()).optional(),
  error: z.string().optional(),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(0),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const EditPlanSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  operations: z.array(EditOperationSchema),
  dependencies: z.array(z.object({
    operationId: z.string().uuid(),
    dependsOn: z.array(z.string().uuid()),
    type: z.enum(['requires', 'enhances', 'conflicts']),
  })),
  renderStrategy: z.enum(['sequential', 'parallel', 'optimized']),
  qualityTarget: z.enum(['draft', 'high_quality', 'cinematic_master']),
  estimatedDuration: z.number().min(0).optional(),
  estimatedCost: z.number().min(0).optional(),
  createdAt: z.date(),
});

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type EditOperation = z.infer<typeof EditOperationSchema>;
export type ObjectRemovalOperation = z.infer<typeof ObjectRemovalOperationSchema>;
export type ColorCorrectionOperation = z.infer<typeof ColorCorrectionOperationSchema>;
export type RenderJob = z.infer<typeof RenderJobSchema>;
export type EditPlan = z.infer<typeof EditPlanSchema>;
