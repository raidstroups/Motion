'use client';

import { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from 'lucide-react';

interface VideoPreviewProps {
  clip: {
    url: string;
    thumbnailUrl?: string;
    duration: number;
  } | null;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
}

export function VideoPreview({
  clip,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-preview relative aspect-video bg-black rounded-lg overflow-hidden">
      {clip ? (
        <video
          ref={videoRef}
          src={clip.url}
          className="w-full h-full object-contain"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <div className="text-lg">No video loaded</div>
            <div className="text-sm">Upload a video or select a project to begin</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              className="p-2 hover:bg-white/10 rounded"
              onClick={() => onTimeUpdate(Math.max(0, currentTime - 1/30))}
            >
              <SkipBack size={20} />
            </button>
            <button 
              className="p-2 hover:bg-white/10 rounded"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              className="p-2 hover:bg-white/10 rounded"
              onClick={() => onTimeUpdate(Math.min(clip?.duration || 0, currentTime + 1/30))}
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-mono">
              {formatTime(currentTime)}
              {clip && (
                <span className="text-muted-foreground">
                  / {formatTime(clip.duration)}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded">
              <Maximize2 size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {clip && (
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${(currentTime / clip.duration) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
