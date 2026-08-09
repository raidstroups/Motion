export interface Timeline {
  id: string;
  projectId: string;
  tracks: TimelineTrack[];
  duration: number;
  fps: number;
  currentTime: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  items: TimelineItem[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export type TrackType = 
  | 'video'
  | 'audio'
  | 'vfx'
  | 'mask'
  | 'title'
  | 'adjustment';

export interface TimelineItem {
  id: string;
  trackId: string;
  clipId?: string;
  operationId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  name: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  loopStart?: number;
  loopEnd?: number;
  isLooping: boolean;
}
