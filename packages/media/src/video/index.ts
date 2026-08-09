import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoInfo {
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

export class VideoProcessor {
  async getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const fpsParts = videoStream.r_frame_rate.split('/');
        const fps = parseInt(fpsParts[0]) / parseInt(fpsParts[1]);

        resolve({
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps,
          duration: metadata.format.duration || 0,
          codec: videoStream.codec_name || '',
          bitrate: parseInt(metadata.format.bit_rate || '0'),
          audioCodec: audioStream?.codec_name,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
          audioChannels: audioStream?.channels,
          colorSpace: videoStream.color_space,
          bitDepth: videoStream.bits_per_raw_sample ? parseInt(videoStream.bits_per_raw_sample.toString()) : undefined,
        });
      });
    });
  }

  async extractFrames(
    inputPath: string,
    outputDir: string,
    options: {
      fps?: number;
      format?: 'jpg' | 'png' | 'webp';
      quality?: number;
      startTime?: number;
      duration?: number;
    } = {}
  ): Promise<string[]> {
    const { fps = 1, format = 'jpg', quality = 2, startTime, duration } = options;
    
    const outputPattern = `${outputDir}/frame_%04d.${format}`;
    
    let command = ffmpeg(inputPath)
      .outputOptions(['-vf', `fps=${fps}`]);
    
    if (startTime !== undefined) {
      command = command.setStartTime(startTime);
    }
    
    if (duration !== undefined) {
      command = command.setDuration(duration);
    }
    
    if (format === 'jpg') {
      command = command.outputOptions(['-qscale:v', quality.toString()]);
    }
    
    await new Promise<void>((resolve, reject) => {
      command
        .output(outputPattern)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    
    const fs = await import('fs');
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('frame_') && f.endsWith(`.${format}`))
      .sort()
      .map(f => `${outputDir}/${f}`);
    
    return files;
  }

  async createProxy(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number;
      height?: number;
      fps?: number;
      codec?: string;
    } = {}
  ): Promise<string> {
    const { width = 640, height = 360, fps = 24, codec = 'libx264' } = options;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec(codec)
        .size(`${width}x${height}`)
        .fps(fps)
        .videoBitrate('500k')
        .outputOptions(['-preset', 'ultrafast'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    time: number = 0
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(time)
        .frames(1)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async generateSprite(
    inputPath: string,
    outputPath: string,
    options: {
      fps?: number;
      columns?: number;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
    } = {}
  ): Promise<{ spritePath: string; metadataPath: string }> {
    const { fps = 0.5, columns = 10, thumbnailWidth = 160, thumbnailHeight = 90 } = options;
    
    const tmpDir = `${outputPath}_tmp`;
    const fs = await import('fs');
    
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const frames = await this.extractFrames(inputPath, tmpDir, { fps, format: 'jpg', quality: 2 });
    
    const metadata = {
      fps,
      columns,
      thumbnailWidth,
      thumbnailHeight,
      totalFrames: frames.length,
      rows: Math.ceil(frames.length / columns),
    };
    
    const spritePath = `${outputPath}.jpg`;
    const metadataPath = `${outputPath}.json`;
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    await execAsync(
      `montage ${frames.join(' ')} -tile ${columns}x -geometry ${thumbnailWidth}x${thumbnailHeight}+0+0 ${spritePath}`
    );
    
    fs.rmSync(tmpDir, { recursive: true });
    
    return { spritePath, metadataPath };
  }

  async trimVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    const duration = endTime - startTime;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async concatVideos(
    inputPaths: string[],
    outputPath: string
  ): Promise<string> {
    const fs = await import('fs');
    const listFile = `${outputPath}_list.txt`;
    
    fs.writeFileSync(
      listFile,
      inputPaths.map(p => `file '${p}'`).join('\n')
    );
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => {
          fs.unlinkSync(listFile);
          resolve(outputPath);
        })
        .on('error', reject)
        .run();
    });
  }
}

export const videoProcessor = new VideoProcessor();
