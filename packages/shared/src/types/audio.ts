export interface AudioTrack {
  id: string;
  clipId: string;
  name: string;
  language?: string;
  isOriginal: boolean;
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  codec: string;
}

export interface AudioSegment {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  type: AudioSegmentType;
  speakerId?: string;
  confidence: number;
  text?: string;
  language?: string;
}

export type AudioSegmentType = 
  | 'speech'
  | 'music'
  | 'noise'
  | 'silence'
  | 'environment'
  | 'effect';

export interface Speaker {
  id: string;
  clipId: string;
  label?: string;
  firstSeen: number;
  lastSeen: number;
  embedding?: number[];
}

export interface AudioProcessingOperation {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  type: AudioOperationType;
  parameters: AudioOperationParameters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export type AudioOperationType = 
  | 'noise_reduction'
  | 'voice_isolation'
  | 'speaker_isolation'
  | 'hum_removal'
  | 'echo_reduction'
  | 'dereverberation'
  | 'eq'
  | 'compression'
  | 'loudness_normalization'
  | 'clipping_repair'
  | 'silence_detection'
  | 'background_music_ducking'
  | 'gain'
  | 'pitch_shift'
  | 'time_stretch';

export interface AudioOperationParameters {
  gain?: number;
  frequency?: number;
  q?: number;
  threshold?: number;
  ratio?: number;
  attack?: number;
  release?: number;
  targetLoudness?: number;
  targetSpeaker?: string;
  noiseReduction?: boolean;
  isolation?: boolean;
  compression?: boolean;
  [key: string]: unknown;
}
