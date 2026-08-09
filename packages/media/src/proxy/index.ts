import { videoProcessor, VideoInfo } from '../video';

export interface ProxyConfig {
  resolutions: {
    label: string;
    width: number;
    height: number;
    bitrate: string;
  }[];
}

const defaultProxyConfig: ProxyConfig = {
  resolutions: [
    { label: '1080p', width: 1920, height: 1080, bitrate: '2M' },
    { label: '720p', width: 1280, height: 720, bitrate: '1M' },
    { label: '480p', width: 854, height: 480, bitrate: '500k' },
    { label: '360p', width: 640, height: 360, bitrate: '250k' },
  ],
};

export class ProxyGenerator {
  private config: ProxyConfig;

  constructor(config: ProxyConfig = defaultProxyConfig) {
    this.config = config;
  }

  async generateProxies(
    inputPath: string,
    outputDir: string,
    videoInfo: VideoInfo
  ): Promise<{ label: string; path: string }[]> {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const proxies: { label: string; path: string }[] = [];
    
    for (const resolution of this.config.resolutions) {
      if (resolution.width <= videoInfo.width && resolution.height <= videoInfo.height) {
        const outputPath = path.join(outputDir, `proxy_${resolution.label}.mp4`);
        
        await videoProcessor.createProxy(inputPath, outputPath, {
          width: resolution.width,
          height: resolution.height,
          fps: Math.min(videoInfo.fps, 30),
        });
        
        proxies.push({ label: resolution.label, path: outputPath });
      }
    }
    
    return proxies;
  }

  async generateThumbnailProxy(
    inputPath: string,
    outputDir: string,
    videoInfo: VideoInfo,
    count: number = 10
  ): Promise<{ timestamp: number; path: string }[]> {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const thumbnails: { timestamp: number; path: string }[] = [];
    const interval = videoInfo.duration / count;
    
    for (let i = 0; i < count; i++) {
      const timestamp = i * interval;
      const outputPath = path.join(outputDir, `thumb_${i.toString().padStart(4, '0')}.jpg`);
      
      await videoProcessor.generateThumbnail(inputPath, outputPath, timestamp);
      
      thumbnails.push({ timestamp, path: outputPath });
    }
    
    return thumbnails;
  }

  async selectBestProxy(
    proxies: { label: string; path: string }[],
    targetResolution?: { width: number; height: number }
  ): string {
    if (!targetResolution) {
      return proxies[0]?.path || '';
    }
    
    let bestProxy = proxies[0];
    let bestDiff = Infinity;
    
    for (const proxy of proxies) {
      const match = proxy.label.match(/(\d+)p/);
      if (match) {
        const height = parseInt(match[1]);
        const diff = Math.abs(height - targetResolution.height);
        
        if (diff < bestDiff) {
          bestDiff = diff;
          bestProxy = proxy;
        }
      }
    }
    
    return bestProxy.path;
  }
}

export const proxyGenerator = new ProxyGenerator();
