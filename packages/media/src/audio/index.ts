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

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
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

  async applyNoiseReduction(
    inputPath: string,
    outputPath: string,
    options: {
      intensity?: number;
      frequency?: number;
      preserveSpeech?: boolean;
    } = {}
  ): Promise<string> {
    const { intensity = 0.5, frequency = 1000, preserveSpeech = true } = options;
    
    const afftd = `afftd=nf=-25:nr=${Math.round(intensity * 100)}:nt=w`;
    const highpass = preserveSpeech ? `,highpass=f=80` : '';
    const lowpass = preserveSpeech ? `,lowpass=f=8000` : '';
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`${afftd}${highpass}${lowpass}`)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyCompressor(
    inputPath: string,
    outputPath: string,
    options: {
      threshold?: number;
      ratio?: number;
      attack?: number;
      release?: number;
      makeup?: number;
    } = {}
  ): Promise<string> {
    const {
      threshold = -20,
      ratio = 4,
      attack = 5,
      release = 50,
      makeup = 0,
    } = options;
    
    const filter = `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}:makeup=${makeup}dB`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(filter)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async detectSilence(
    inputPath: string,
    options: {
      noiseThreshold?: number;
      durationThreshold?: number;
    } = {}
  ): Promise<SilenceSegment[]> {
    const { noiseThreshold = -30, durationThreshold = 0.5 } = options;
    
    const { stdout } = await execAsync(
      `ffprobe -f lavfi -i "amovie='${inputPath}',silencedetect=n=${noiseThreshold}dB:d=${durationThreshold}" -show_entries frame_tags=lavfi.silence_start,lavfi.silence_end -of csv=p=0 2>&1 || true`
    );
    
    const segments: SilenceSegment[] = [];
    const lines = stdout.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const startMatch = lines[i].match(/silence_start:\s*([\d.]+)/);
      if (startMatch && i + 1 < lines.length) {
        const endMatch = lines[i + 1].match(/silence_end:\s*([\d.]+)/);
        if (endMatch) {
          const start = parseFloat(startMatch[1]);
          const end = parseFloat(endMatch[1]);
          segments.push({
            start,
            end,
            duration: end - start,
          });
        }
      }
    }
    
    return segments;
  }

  async applyDucking(
    inputPath: string,
    duckingPath: string,
    outputPath: string,
    options: {
      duckingLevel?: number;
      attack?: number;
      release?: number;
      threshold?: number;
    } = {}
  ): Promise<string> {
    const {
      duckingLevel = -12,
      attack = 100,
      release = 500,
      threshold = -30,
    } = options;
    
    const filter = `[1:a]sidechaincompress=threshold=${threshold}dB:ratio=12:attack=${attack}:release=${release}:level_sc=1[duck];[0:a][duck]amix=inputs=2:duration=first`;
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .input(duckingPath)
        .complexFilter(filter)
        .outputOptions(['-map', '[0:a]'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyPitchShift(
    inputPath: string,
    outputPath: string,
    semitones: number
  ): Promise<string> {
    const factor = Math.pow(2, semitones / 12);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`asetrate=44100*${factor},aresample=44100`)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyTimeStretch(
    inputPath: string,
    outputPath: string,
    speed: number
  ): Promise<string> {
    const atempoFilters: string[] = [];
    let remainingSpeed = speed;
    
    while (remainingSpeed > 2.0) {
      atempoFilters.push('atempo=2.0');
      remainingSpeed /= 2.0;
    }
    while (remainingSpeed < 0.5) {
      atempoFilters.push('atempo=0.5');
      remainingSpeed /= 0.5;
    }
    atempoFilters.push(`atempo=${remainingSpeed}`);
    
    const filter = atempoFilters.join(',');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(filter)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async applyFade(
    inputPath: string,
    outputPath: string,
    options: {
      fadeIn?: number;
      fadeOut?: number;
    } = {}
  ): Promise<string> {
    const { fadeIn = 0, fadeOut = 0 } = options;
    const filters: string[] = [];
    
    if (fadeIn > 0) {
      filters.push(`afade=t=in:st=0:d=${fadeIn}`);
    }
    
    if (fadeOut > 0) {
      const info = await this.getAudioInfo(inputPath);
      const fadeStart = Math.max(0, info.duration - fadeOut);
      filters.push(`afade=t=out:st=${fadeStart}:d=${fadeOut}`);
    }
    
    if (filters.length === 0) {
      return inputPath;
    }
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(filters.join(','))
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async splitAudio(
    inputPath: string,
    segments: { start: number; end: number }[],
    outputDir: string
  ): Promise<string[]> {
    const paths: string[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const { start, end } = segments[i];
      const duration = end - start;
      const outputPath = `${outputDir}/segment_${i.toString().padStart(4, '0')}.wav`;
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(start)
          .duration(duration)
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });
      
      paths.push(outputPath);
    }
    
    return paths;
  }

  async concatenateAudio(
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

  async convertFormat(
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
}

export const audioProcessor = new AudioProcessor();
