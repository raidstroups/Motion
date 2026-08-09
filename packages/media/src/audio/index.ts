import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AudioInfo {
  duration: number;
  sampleRate: number;
  channels: number;
  codec: string;
  bitrate: number;
}

export class AudioProcessor {
  async getAudioInfo(inputPath: string): Promise<AudioInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          sampleRate: parseInt(audioStream.sample_rate || '44100'),
          channels: audioStream.channels || 2,
          codec: audioStream.codec_name || '',
          bitrate: parseInt(metadata.format.bit_rate || '0'),
        });
      });
    });
  }

  async extractAudio(
    inputPath: string,
    outputPath: string,
    options: {
      codec?: string;
      sampleRate?: number;
      channels?: number;
      bitrate?: string;
    } = {}
  ): Promise<string> {
    const { codec = 'aac', sampleRate = 44100, channels = 2, bitrate = '192k' } = options;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec(codec)
        .audioFrequency(sampleRate)
        .audioChannels(channels)
        .audioBitrate(bitrate)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async removeAudio(
    inputPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noAudio()
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async mixAudio(
    inputs: { path: string; volume?: number }[],
    outputPath: string,
    options: {
      duration?: number;
      normalize?: boolean;
    } = {}
  ): Promise<string> {
    const { duration, normalize = false } = options;
    
    let command = ffmpeg();
    
    inputs.forEach(input => {
      command = command.input(input.path);
    });
    
    const filterComplex = inputs
      .map((input, i) => `[${i}:a]volume=${input.volume || 1}[a${i}]`)
      .join(';');
    
    const mixInputs = inputs.map((_, i) => `[a${i}]`).join('');
    const finalFilter = `${filterComplex};${mixInputs}amix=inputs=${inputs.length}:duration=longest[out]`;
    
    command
      .complexFilter(finalFilter)
      .outputOptions(['-map', '[out]']);
    
    if (duration) {
      command = command.setDuration(duration);
    }
    
    if (normalize) {
      command = command.audioFilters('loudnorm');
    }
    
    return new Promise((resolve, reject) => {
      command
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyGain(
    inputPath: string,
    outputPath: string,
    gainDb: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`volume=${gainDb}dB`)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyEQ(
    inputPath: string,
    outputPath: string,
    bands: { frequency: number; gain: number; q: number }[]
  ): Promise<string> {
    const filter = bands
      .map(b => `equalizer=f=${b.frequency}:width_type=h:width=200:g=${b.gain}`)
      .join(',');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(filter)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    targetLoudness: number = -16
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`loudnorm=I=${targetLoudness}:TP=-1.5:LRA=11`)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async generateWaveform(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number;
      height?: number;
      color?: string;
      bgColor?: string;
    } = {}
  ): Promise<string> {
    const { width = 800, height = 200, color = '0x00FF00', bgColor = '0x000000' } = options;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`showwavespic=s=${width}x${height}:colors=${color}:split_channels=0`)
        .frames(1)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }
}

export const audioProcessor = new AudioProcessor();
