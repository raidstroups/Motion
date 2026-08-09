export type EditOperationType = 
  | 'object_removal'
  | 'object_replacement'
  | 'color_correction'
  | 'lighting'
  | 'blur'
  | 'tracking'
  | 'mask'
  | 'chroma_key'
  | 'audio_isolation'
  | 'noise_reduction'
  | 'voice_enhancement'
  | 'transition'
  | 'stabilization'
  | 'upscale'
  | 'scene_cut';

export type OperationStatus = 
  | 'planned'
  | 'analyzing'
  | 'processing'
  | 'compositing'
  | 'qa'
  | 'completed'
  | 'failed';

export interface BaseOperation {
  id: string;
  type: EditOperationType;
  sourceClipId: string;
  startTime: number;
  endTime: number;
  priority: number;
  status: OperationStatus;
  confidence: number;
  dependencies: string[];
  metadata?: Record<string, unknown>;
}

export interface ObjectRemovalOperation extends BaseOperation {
  type: 'object_removal';
  objectId: string;
  maskId?: string;
  method: 'inpainting' | 'exclusion' | 'replacement';
  preserveBackground: boolean;
}

export interface ObjectReplacementOperation extends BaseOperation {
  type: 'object_replacement';
  objectId: string;
  replacementAssetId: string;
  maskId?: string;
  blendMode: string;
}

export interface ColorCorrectionOperation extends BaseOperation {
  type: 'color_correction';
  maskId?: string;
  adjustments: ColorAdjustments;
  scope: 'global' | 'scene' | 'shot' | 'object' | 'face' | 'mask';
}

export interface ColorAdjustments {
  exposure?: number;
  contrast?: number;
  highlights?: number;
  shadows?: number;
  whites?: number;
  blacks?: number;
  temperature?: number;
  tint?: number;
  saturation?: number;
  vibrance?: number;
  hue?: number;
  curves?: { x: number; y: number }[];
  lutId?: string;
}

export interface LightingOperation extends BaseOperation {
  type: 'lighting';
  maskId?: string;
  adjustments: LightingAdjustments;
  scope: 'global' | 'local' | 'face';
}

export interface LightingAdjustments {
  brightness?: number;
  shadowLift?: number;
  highlightReduction?: number;
  fillLight?: number;
  vignette?: number;
  localExposure?: number;
}

export interface BlurOperation extends BaseOperation {
  type: 'blur';
  maskId?: string;
  blurType: 'gaussian' | 'motion' | 'radial' | 'lens';
  radius: number;
  strength: number;
  shapeMask?: string;
}

export interface MaskOperation extends BaseOperation {
  type: 'mask';
  geometry: 'polygon' | 'raster' | 'segmentation' | 'bezier';
  data: string;
  feather: number;
  expansion: number;
  inversion: boolean;
  trackingId?: string;
}

export interface ChromaKeyOperation extends BaseOperation {
  type: 'chroma_key';
  keyColor: string;
  similarity: number;
  smoothness: number;
  spillReduction: number;
  replacementAssetId?: string;
}

export interface TransitionOperation extends BaseOperation {
  type: 'transition';
  clipAId: string;
  clipBId: string;
  transitionType: TransitionType;
  duration: number;
  parameters?: Record<string, unknown>;
}

export type TransitionType = 
  | 'cross_dissolve'
  | 'match_cut'
  | 'motion_transition'
  | 'whip'
  | 'zoom'
  | 'object_occlusion'
  | 'light_transition'
  | 'directional_blur'
  | 'masked'
  | 'morph'
  | 'camera_motion_continuation'
  | 'optical_flow';

export interface StabilizationOperation extends BaseOperation {
  type: 'stabilization';
  method: 'crop' | 'border' | 'synth';
  smoothness: number;
  cropAmount?: number;
}

export interface UpscaleOperation extends BaseOperation {
  type: 'upscale';
  targetWidth: number;
  targetHeight: number;
  method: 'bicubic' | 'lanczos' | 'ai';
  modelId?: string;
}

export interface SceneCutOperation extends BaseOperation {
  type: 'scene_cut';
  cutType: 'hard' | 'dissolve' | 'fade';
  position: 'start' | 'end' | 'custom';
  customTime?: number;
}

export type EditOperation = 
  | ObjectRemovalOperation
  | ObjectReplacementOperation
  | ColorCorrectionOperation
  | LightingOperation
  | BlurOperation
  | MaskOperation
  | ChromaKeyOperation
  | TransitionOperation
  | StabilizationOperation
  | UpscaleOperation
  | SceneCutOperation;

export interface EditPlan {
  id: string;
  projectId: string;
  operations: EditOperation[];
  dependencies: OperationDependency[];
  renderStrategy: RenderStrategy;
  qualityTarget: QualityTarget;
  estimatedDuration?: number;
  estimatedCost?: number;
  createdAt: Date;
}

export interface OperationDependency {
  operationId: string;
  dependsOn: string[];
  type: 'requires' | 'enhances' | 'conflicts';
}

export type RenderStrategy = 'sequential' | 'parallel' | 'optimized';

export type QualityTarget = 'draft' | 'high_quality' | 'cinematic_master';
