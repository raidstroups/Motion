export type AssetType = 'video' | 'audio' | 'image';

export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  name: string;
  url: string;
  proxyUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  duration?: number;
  metadata?: VideoMetadata;
  createdAt: Date;
}

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  duration: number;
  codec: string;
  bitrate: number;
  audioCodec?: string;
  audioSampleRate?: number;
  audioChannels?: number;
  colorSpace?: string;
  bitDepth?: number;
}

export interface Clip {
  id: string;
  projectId: string;
  assetId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  metadata?: Record<string, unknown>;
}

export interface Scene {
  id: string;
  clipId: string;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Shot {
  id: string;
  sceneId: string;
  startTime: number;
  endTime: number;
  duration: number;
  cameraMotion?: CameraMotion;
  confidence: number;
}

export type CameraMotion = 
  | 'static'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'zoom_in'
  | 'zoom_out'
  | 'dolly_in'
  | 'dolly_out'
  | 'tracking'
  | 'handheld'
  | 'crane'
  | 'steadicam';

export interface TrackedObject {
  id: string;
  clipId: string;
  category: string;
  label?: string;
  confidence: number;
  firstFrame: number;
  lastFrame: number;
  boundingBoxes: BoundingBox[];
  masks?: MaskReference[];
  trackingData?: TrackingData;
  embeddings?: number[];
  attributes?: Record<string, unknown>;
}

export interface BoundingBox {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface MaskReference {
  frameRange: { start: number; end: number };
  maskId: string;
}

export interface TrackingData {
  frames: number[];
  positions: { x: number; y: number }[];
  velocities?: { x: number; y: number }[];
  accelerations?: { x: number; y: number }[];
}

export interface FaceTrack {
  id: string;
  clipId: string;
  personId?: string;
  confidence: number;
  firstFrame: number;
  lastFrame: number;
  landmarks?: FaceLandmark[];
  embedding?: number[];
}

export interface FaceLandmark {
  frame: number;
  points: { x: number; y: number }[];
}

export interface VisualIssue {
  type: string;
  frameRange: { start: number; end: number };
  region?: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface VideoAnalysis {
  scenes: Scene[];
  shots: Shot[];
  objects: TrackedObject[];
  faces: FaceTrack[];
  cameraMotion: CameraMotion[];
  visualIssues: VisualIssue[];
}
