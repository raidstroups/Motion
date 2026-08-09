import { z } from 'zod';

// ============================================================
// PROJECT
// ============================================================

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

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  settings: ProjectSettingsSchema,
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['draft', 'processing', 'completed', 'failed']).optional(),
  settings: ProjectSettingsSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// ASSET
// ============================================================

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

export const CreateAssetSchema = z.object({
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
});

export const UpdateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  proxyUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// VIDEO METADATA
// ============================================================

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

// ============================================================
// CLIP
// ============================================================

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

export const CreateClipSchema = z.object({
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

export const UpdateClipSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  inPoint: z.number().min(0).optional(),
  outPoint: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// SCENE & SHOT
// ============================================================

export const SceneSchema = z.object({
  id: z.string().uuid(),
  clipId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  confidence: z.number().min(0).max(1),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateSceneSchema = z.object({
  clipId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  confidence: z.number().min(0).max(1),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ShotSchema = z.object({
  id: z.string().uuid(),
  sceneId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  cameraMotion: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const CreateShotSchema = z.object({
  sceneId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  cameraMotion: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

// ============================================================
// TRACKED OBJECT & FACE
// ============================================================

export const BoundingBoxSchema = z.object({
  frame: z.number().min(0),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export const TrackedObjectSchema = z.object({
  id: z.string().uuid(),
  clipId: z.string().uuid(),
  category: z.string(),
  label: z.string().optional(),
  confidence: z.number().min(0).max(1),
  firstFrame: z.number().min(0),
  lastFrame: z.number().min(0),
  boundingBoxes: z.array(BoundingBoxSchema),
  masks: z.array(z.object({
    frameRange: z.object({ start: z.number(), end: z.number() }),
    maskId: z.string().uuid(),
  })).optional(),
  trackingData: z.object({
    frames: z.array(z.number()),
    positions: z.array(z.object({ x: z.number(), y: z.number() })),
  }).optional(),
  embeddings: z.array(z.number()).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const CreateTrackedObjectSchema = z.object({
  clipId: z.string().uuid(),
  category: z.string(),
  label: z.string().optional(),
  confidence: z.number().min(0).max(1),
  firstFrame: z.number().min(0),
  lastFrame: z.number().min(0),
  boundingBoxes: z.array(BoundingBoxSchema),
  masks: z.array(z.object({
    frameRange: z.object({ start: z.number(), end: z.number() }),
    maskId: z.string().uuid(),
  })).optional(),
  trackingData: z.object({
    frames: z.array(z.number()),
    positions: z.array(z.object({ x: z.number(), y: z.number() })),
  }).optional(),
  embeddings: z.array(z.number()).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const FaceTrackSchema = z.object({
  id: z.string().uuid(),
  clipId: z.string().uuid(),
  personId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  firstFrame: z.number().min(0),
  lastFrame: z.number().min(0),
  landmarks: z.array(z.object({
    frame: z.number(),
    points: z.array(z.object({ x: z.number(), y: z.number() })),
  })).optional(),
  embedding: z.array(z.number()).optional(),
});

export const CreateFaceTrackSchema = z.object({
  clipId: z.string().uuid(),
  personId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  firstFrame: z.number().min(0),
  lastFrame: z.number().min(0),
  landmarks: z.array(z.object({
    frame: z.number(),
    points: z.array(z.object({ x: z.number(), y: z.number() })),
  })).optional(),
  embedding: z.array(z.number()).optional(),
});

// ============================================================
// AUDIO
// ============================================================

export const AudioTrackSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  assetId: z.string().uuid(),
  name: z.string().min(1),
  language: z.string().optional(),
  isOriginal: z.boolean(),
  duration: z.number().min(0),
  sampleRate: z.number().min(1),
  channels: z.number().min(1),
  bitrate: z.number().min(0),
  codec: z.string(),
});

export const CreateAudioTrackSchema = z.object({
  projectId: z.string().uuid(),
  assetId: z.string().uuid(),
  name: z.string().min(1),
  language: z.string().optional(),
  isOriginal: z.boolean().default(true),
  duration: z.number().min(0),
  sampleRate: z.number().min(1),
  channels: z.number().min(1),
  bitrate: z.number().min(0),
  codec: z.string(),
});

export const AudioSegmentSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  type: z.enum(['speech', 'music', 'noise', 'silence', 'environment', 'effect']),
  speakerId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  text: z.string().optional(),
  language: z.string().optional(),
});

export const CreateAudioSegmentSchema = z.object({
  trackId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  type: z.enum(['speech', 'music', 'noise', 'silence', 'environment', 'effect']),
  speakerId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  text: z.string().optional(),
  language: z.string().optional(),
});

export const SpeakerSchema = z.object({
  id: z.string().uuid(),
  clipId: z.string().uuid(),
  label: z.string().optional(),
  firstSeen: z.number().min(0),
  lastSeen: z.number().min(0),
  embedding: z.array(z.number()).optional(),
});

export const AudioProcessingOperationSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  type: z.enum([
    'noise_reduction', 'voice_isolation', 'speaker_isolation', 'hum_removal',
    'echo_reduction', 'dereverberation', 'eq', 'compression',
    'loudness_normalization', 'clipping_repair', 'silence_detection',
    'background_music_ducking', 'gain', 'pitch_shift', 'time_stretch',
  ]),
  parameters: z.record(z.unknown()),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
});

// ============================================================
// EDIT OPERATIONS
// ============================================================

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

export const CreateEditOperationSchema = z.object({
  type: z.string(),
  sourceClipId: z.string().uuid(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  priority: z.number().min(0).max(100).default(50),
  confidence: z.number().min(0).max(1).default(0.8),
  dependencies: z.array(z.string().uuid()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateEditOperationSchema = z.object({
  status: z.enum(['planned', 'analyzing', 'processing', 'compositing', 'qa', 'completed', 'failed']).optional(),
  priority: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ObjectRemovalOperationSchema = EditOperationSchema.extend({
  type: z.literal('object_removal'),
  objectId: z.string().uuid(),
  maskId: z.string().uuid().optional(),
  method: z.enum(['inpainting', 'exclusion', 'replacement']),
  preserveBackground: z.boolean(),
});

export const ObjectReplacementOperationSchema = EditOperationSchema.extend({
  type: z.literal('object_replacement'),
  objectId: z.string().uuid(),
  replacementAssetId: z.string().uuid(),
  maskId: z.string().uuid().optional(),
  blendMode: z.string(),
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
    hue: z.number().min(-180).max(180).optional(),
    curves: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).optional(),
    lutId: z.string().uuid().optional(),
  }),
  scope: z.enum(['global', 'scene', 'shot', 'object', 'face', 'mask']),
});

export const LightingOperationSchema = EditOperationSchema.extend({
  type: z.literal('lighting'),
  maskId: z.string().uuid().optional(),
  adjustments: z.object({
    brightness: z.number().min(-100).max(100).optional(),
    shadowLift: z.number().min(-100).max(100).optional(),
    highlightReduction: z.number().min(-100).max(100).optional(),
    fillLight: z.number().min(-100).max(100).optional(),
    vignette: z.number().min(-100).max(100).optional(),
    localExposure: z.number().min(-100).max(100).optional(),
  }),
  scope: z.enum(['global', 'local', 'face']),
});

export const BlurOperationSchema = EditOperationSchema.extend({
  type: z.literal('blur'),
  maskId: z.string().uuid().optional(),
  blurType: z.enum(['gaussian', 'motion', 'radial', 'lens']),
  radius: z.number().min(0).max(100),
  strength: z.number().min(0).max(1),
  shapeMask: z.string().optional(),
});

export const MaskOperationSchema = EditOperationSchema.extend({
  type: z.literal('mask'),
  geometry: z.enum(['polygon', 'raster', 'segmentation', 'bezier']),
  data: z.string(),
  feather: z.number().min(0).max(100),
  expansion: z.number().min(-100).max(100),
  inversion: z.boolean(),
  trackingId: z.string().uuid().optional(),
});

export const ChromaKeyOperationSchema = EditOperationSchema.extend({
  type: z.literal('chroma_key'),
  keyColor: z.string(),
  similarity: z.number().min(0).max(1),
  smoothness: z.number().min(0).max(1),
  spillReduction: z.number().min(0).max(1),
  replacementAssetId: z.string().uuid().optional(),
});

export const TransitionOperationSchema = EditOperationSchema.extend({
  type: z.literal('transition'),
  clipAId: z.string().uuid(),
  clipBId: z.string().uuid(),
  transitionType: z.enum([
    'cross_dissolve', 'match_cut', 'motion_transition', 'whip', 'zoom',
    'object_occlusion', 'light_transition', 'directional_blur', 'masked',
    'morph', 'camera_motion_continuation', 'optical_flow',
  ]),
  duration: z.number().min(0),
  parameters: z.record(z.unknown()).optional(),
});

export const StabilizationOperationSchema = EditOperationSchema.extend({
  type: z.literal('stabilization'),
  method: z.enum(['crop', 'border', 'synth']),
  smoothness: z.number().min(0).max(100),
  cropAmount: z.number().min(0).max(50).optional(),
});

export const UpscaleOperationSchema = EditOperationSchema.extend({
  type: z.literal('upscale'),
  targetWidth: z.number().min(1).max(8192),
  targetHeight: z.number().min(1).max(8192),
  method: z.enum(['bicubic', 'lanczos', 'ai']),
  modelId: z.string().optional(),
});

export const SceneCutOperationSchema = EditOperationSchema.extend({
  type: z.literal('scene_cut'),
  cutType: z.enum(['hard', 'dissolve', 'fade']),
  position: z.enum(['start', 'end', 'custom']),
  customTime: z.number().min(0).optional(),
});

export const AudioIsolationOperationSchema = EditOperationSchema.extend({
  type: z.literal('audio_isolation'),
  trackId: z.string().uuid(),
  targetSpeaker: z.string().optional(),
  method: z.enum(['diarization', 'spectral', 'neural']),
});

export const NoiseReductionOperationSchema = EditOperationSchema.extend({
  type: z.literal('noise_reduction'),
  trackId: z.string().uuid(),
  noiseType: z.enum(['static', 'hum', 'environmental', 'all']),
  intensity: z.number().min(0).max(1),
  preserveSpeech: z.boolean(),
});

export const VoiceEnhancementOperationSchema = EditOperationSchema.extend({
  type: z.literal('voice_enhancement'),
  trackId: z.string().uuid(),
  targetSpeaker: z.string().optional(),
  enhancements: z.array(z.enum([
    'noise_reduction', 'eq', 'compression', 'deessed', 'depop',
  ])),
  gain: z.number().min(-20).max(20),
});

// ============================================================
// EDIT PLAN
// ============================================================

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

// ============================================================
// RENDER JOB
// ============================================================

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

export const CreateRenderJobSchema = z.object({
  projectId: z.string().uuid(),
  operationId: z.string().uuid(),
  type: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  inputAssets: z.array(z.string().uuid()),
  maxRetries: z.number().min(0).max(10).default(3),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// TIMELINE
// ============================================================

export const TimelineItemSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  clipId: z.string().uuid().optional(),
  operationId: z.string().uuid().optional(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  inPoint: z.number().min(0),
  outPoint: z.number().min(0),
  name: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const TimelineTrackSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['video', 'audio', 'vfx', 'mask', 'title', 'adjustment']),
  items: z.array(TimelineItemSchema),
  muted: z.boolean(),
  locked: z.boolean(),
  visible: z.boolean(),
});

export const TimelineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  tracks: z.array(TimelineTrackSchema),
  duration: z.number().min(0),
  fps: z.number().min(1),
  currentTime: z.number().min(0),
});

export const CreateTimelineSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).default('Main Timeline'),
  duration: z.number().min(0),
  fps: z.number().min(1).default(30),
});

export const UpdateTimelineSchema = z.object({
  name: z.string().min(1).optional(),
  duration: z.number().min(0).optional(),
  currentTime: z.number().min(0).optional(),
});

export const AddTimelineItemSchema = z.object({
  trackId: z.string().uuid(),
  clipId: z.string().uuid().optional(),
  operationId: z.string().uuid().optional(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(0),
  inPoint: z.number().min(0),
  outPoint: z.number().min(0),
  name: z.string().min(1),
});

export const UpdateTimelineItemSchema = z.object({
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  inPoint: z.number().min(0).optional(),
  outPoint: z.number().min(0).optional(),
  name: z.string().min(1).optional(),
});

// ============================================================
// PROJECT VERSION
// ============================================================

export const ProjectVersionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  version: z.number().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  editPlanId: z.string().uuid().optional(),
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateProjectVersionSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  editPlanId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// AGENT
// ============================================================

export const TokenUsageSchema = z.object({
  promptTokens: z.number().min(0),
  completionTokens: z.number().min(0),
  totalTokens: z.number().min(0),
  cost: z.number().min(0).optional(),
});

export const AgentRunSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  agentType: z.enum(['director', 'video_analyzer', 'audio_analyzer', 'vfx', 'color', 'lighting', 'audio', 'transition', 'qa']),
  status: z.enum(['idle', 'analyzing', 'planning', 'executing', 'reviewing', 'completed', 'failed']),
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  duration: z.number().min(0).optional(),
  tokenUsage: TokenUsageSchema.optional(),
  model: z.string().optional(),
});

export const AgentMessageSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  toolCalls: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    arguments: z.record(z.unknown()),
  })).optional(),
  toolResults: z.array(z.object({
    toolCallId: z.string().uuid(),
    content: z.string(),
    isError: z.boolean(),
  })).optional(),
  createdAt: z.date(),
});

// ============================================================
// API INPUT SCHEMAS
// ============================================================

export const UploadRequestSchema = z.object({
  projectId: z.string().uuid().optional(),
});

export const AnalyzeRequestSchema = z.object({
  projectId: z.string().uuid(),
  assetId: z.string().uuid(),
  assetPath: z.string().min(1),
});

export const ProcessRequestSchema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().min(1).max(5000),
  videoAnalysis: z.record(z.unknown()).optional(),
});

export const RenderRequestSchema = z.object({
  projectId: z.string().uuid(),
  editPlanId: z.string().uuid(),
  assets: z.array(z.object({
    path: z.string().min(1),
    startTime: z.number().min(0).optional(),
    endTime: z.number().min(0).optional(),
  })),
  operations: z.array(z.object({
    type: z.string(),
    parameters: z.record(z.unknown()),
  })),
  outputFormat: z.enum(['mp4', 'mov', 'avi', 'mkv', 'webm']).default('mp4'),
  quality: z.enum(['draft', 'standard', 'high', 'ultra']).default('standard'),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type CreateAsset = z.infer<typeof CreateAssetSchema>;
export type UpdateAsset = z.infer<typeof UpdateAssetSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type CreateClip = z.infer<typeof CreateClipSchema>;
export type UpdateClip = z.infer<typeof UpdateClipSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type CreateScene = z.infer<typeof CreateSceneSchema>;
export type Shot = z.infer<typeof ShotSchema>;
export type CreateShot = z.infer<typeof CreateShotSchema>;
export type TrackedObject = z.infer<typeof TrackedObjectSchema>;
export type CreateTrackedObject = z.infer<typeof CreateTrackedObjectSchema>;
export type FaceTrack = z.infer<typeof FaceTrackSchema>;
export type CreateFaceTrack = z.infer<typeof CreateFaceTrackSchema>;
export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export type CreateAudioTrack = z.infer<typeof CreateAudioTrackSchema>;
export type AudioSegment = z.infer<typeof AudioSegmentSchema>;
export type CreateAudioSegment = z.infer<typeof CreateAudioSegmentSchema>;
export type Speaker = z.infer<typeof SpeakerSchema>;
export type AudioProcessingOperation = z.infer<typeof AudioProcessingOperationSchema>;
export type EditOperation = z.infer<typeof EditOperationSchema>;
export type CreateEditOperation = z.infer<typeof CreateEditOperationSchema>;
export type UpdateEditOperation = z.infer<typeof UpdateEditOperationSchema>;
export type EditPlan = z.infer<typeof EditPlanSchema>;
export type RenderJob = z.infer<typeof RenderJobSchema>;
export type CreateRenderJob = z.infer<typeof CreateRenderJobSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type CreateTimeline = z.infer<typeof CreateTimelineSchema>;
export type UpdateTimeline = z.infer<typeof UpdateTimelineSchema>;
export type TimelineTrack = z.infer<typeof TimelineTrackSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type AddTimelineItem = z.infer<typeof AddTimelineItemSchema>;
export type UpdateTimelineItem = z.infer<typeof UpdateTimelineItemSchema>;
export type ProjectVersion = z.infer<typeof ProjectVersionSchema>;
export type CreateProjectVersion = z.infer<typeof CreateProjectVersionSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ProcessRequest = z.infer<typeof ProcessRequestSchema>;
export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
