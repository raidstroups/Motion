import { videoProcessor, VideoInfo } from '../video';
import { audioProcessor, AudioInfo } from '../audio';

export interface MediaMetadata {
  video?: VideoInfo;
  audio?: AudioInfo;
  format: string;
  size: number;
  duration: number;
  createdAt?: Date;
  modifiedAt?: Date;
}

export class MetadataExtractor {
  async extract(inputPath: string): Promise<MediaMetadata> {
    const fs = await import('fs');
    const path = await import('path');
    
    const stats = fs.statSync(inputPath);
    const ext = path.extname(inputPath).toLowerCase();
    
    const metadata: MediaMetadata = {
      format: ext.slice(1),
      size: stats.size,
      duration: 0,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
    
    try {
      metadata.video = await videoProcessor.getVideoInfo(inputPath);
      metadata.duration = metadata.video.duration;
    } catch (error) {
      console.log('No video stream found');
    }
    
    try {
      metadata.audio = await audioProcessor.getAudioInfo(inputPath);
      if (!metadata.duration) {
        metadata.duration = metadata.audio.duration;
      }
    } catch (error) {
      console.log('No audio stream found');
    }
    
    return metadata;
  }

  async extractFramesMetadata(
    inputPath: string,
    fps: number = 1
  ): Promise<{
    totalFrames: number;
    duration: number;
    fps: number;
    keyframes: number[];
  }> {
    const videoInfo = await videoProcessor.getVideoInfo(inputPath);
    
    const totalFrames = Math.ceil(videoInfo.duration * videoInfo.fps);
    const sampledFrames = Math.ceil(videoInfo.duration * fps);
    
    return {
      totalFrames,
      duration: videoInfo.duration,
      fps: videoInfo.fps,
      keyframes: Array.from({ length: sampledFrames }, (_, i) => 
        Math.floor((i / sampledFrames) * totalFrames)
      ),
    };
  }

  async extractSceneMetadata(
    inputPath: string,
    options: {
      threshold?: number;
      minSceneLength?: number;
    } = {}
  ): Promise<{
    scenes: { startFrame: number; endFrame: number; score: number }[];
    cuts: number[];
  }> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { threshold = 0.3, minSceneLength = 1 } = options;
    
    const videoInfo = await videoProcessor.getVideoInfo(inputPath);
    
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries frame=pict_type -of csv=p=0 "${inputPath}"`
    );
    
    const frameTypes = stdout.trim().split('\n');
    const keyframes: number[] = [];
    
    frameTypes.forEach((type, index) => {
      if (type === 'I') {
        keyframes.push(index);
      }
    });
    
    const scenes: { startFrame: number; endFrame: number; score: number }[] = [];
    const cuts: number[] = [];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const startFrame = keyframes[i];
      const endFrame = keyframes[i + 1];
      const duration = (endFrame - startFrame) / videoInfo.fps;
      
      if (duration >= minSceneLength) {
        scenes.push({
          startFrame,
          endFrame,
          score: 0.5 + Math.random() * 0.5,
        });
        cuts.push(startFrame);
      }
    }
    
    return { scenes, cuts };
  }
}

export const metadataExtractor = new MetadataExtractor();
