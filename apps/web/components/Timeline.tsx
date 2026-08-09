'use client';

import { useRef, useState, useEffect } from 'react';
import { 
  Video, 
  Music, 
  Wand2, 
  Mask, 
  Type, 
  Sliders,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'vfx' | 'mask' | 'title' | 'adjustment';
  items: TimelineItem[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

interface TimelineItem {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  color: string;
}

interface TimelineProps {
  project: any;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onClipSelect: (clip: any) => void;
}

export function Timeline({
  project,
  currentTime,
  onTimeChange,
  onClipSelect,
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'video-1',
      name: 'VIDEO',
      type: 'video',
      items: [
        {
          id: 'item-1',
          startTime: 0,
          endTime: 10,
          name: 'Clip 1',
          color: '#3b82f6',
        },
      ],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: 'vfx-1',
      name: 'VFX',
      type: 'vfx',
      items: [
        {
          id: 'vfx-item-1',
          startTime: 2,
          endTime: 8,
          name: 'Object Removal',
          color: '#8b5cf6',
        },
      ],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: 'mask-1',
      name: 'MASK',
      type: 'mask',
      items: [
        {
          id: 'mask-item-1',
          startTime: 2,
          endTime: 8,
          name: 'Person Mask',
          color: '#22c55e',
        },
      ],
      muted: false,
      locked: false,
      visible: true,
    },
    {
      id: 'audio-1',
      name: 'AUDIO',
      type: 'audio',
      items: [
        {
          id: 'audio-item-1',
          startTime: 0,
          endTime: 15,
          name: 'Main Audio',
          color: '#f59e0b',
        },
      ],
      muted: false,
      locked: false,
      visible: true,
    },
  ]);

  const pixelsPerSecond = 100 * zoom;
  const totalDuration = project?.settings?.duration || 60;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = x / pixelsPerSecond;
    onTimeChange(Math.max(0, Math.min(totalDuration, time)));
  };

  const toggleTrack = (trackId: string, property: 'muted' | 'locked' | 'visible') => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, [property]: !track[property] }
        : track
    ));
  };

  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'audio': return <Music size={16} />;
      case 'vfx': return <Wand2 size={16} />;
      case 'mask': return <Mask size={16} />;
      case 'title': return <Type size={16} />;
      case 'adjustment': return <Sliders size={16} />;
    }
  };

  return (
    <div className="timeline-container h-full flex flex-col">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <div className="flex items-center gap-2">
          <button 
            className="p-1 hover:bg-muted rounded"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            className="p-1 hover:bg-muted rounded"
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <div className="text-sm font-mono">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Time Ruler */}
      <div className="h-6 border-b border-border relative overflow-hidden">
        <div 
          className="absolute inset-0 flex"
          style={{ width: totalDuration * pixelsPerSecond }}
        >
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: i * pixelsPerSecond }}
            >
              <div className="h-2 w-px bg-muted-foreground" />
              {i % 5 === 0 && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTime(i)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-32 border-r border-border">
          {tracks.map(track => (
            <div 
              key={track.id}
              className="h-10 border-b border-border flex items-center px-2 gap-2"
            >
              {getTrackIcon(track.type)}
              <span className="text-xs font-medium flex-1 truncate">
                {track.name}
              </span>
              <button 
                className="p-0.5 hover:bg-muted rounded"
                onClick={() => toggleTrack(track.id, 'visible')}
              >
                {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button 
                className="p-0.5 hover:bg-muted rounded"
                onClick={() => toggleTrack(track.id, 'locked')}
              >
                {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          ))}
        </div>

        {/* Track Content */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-hidden cursor-pointer"
          onClick={handleTimelineClick}
        >
          <div 
            className="relative"
            style={{ 
              width: totalDuration * pixelsPerSecond,
              height: '100%',
            }}
          >
            {/* Tracks */}
            {tracks.map((track, trackIndex) => (
              <div 
                key={track.id}
                className="absolute left-0 right-0 h-10 border-b border-border"
                style={{ top: trackIndex * 40 }}
              >
                {/* Items */}
                {track.items.map(item => (
                  <div
                    key={item.id}
                    className="timeline-item absolute top-1 bottom-1 flex items-center px-2"
                    style={{
                      left: item.startTime * pixelsPerSecond,
                      width: (item.endTime - item.startTime) * pixelsPerSecond,
                      backgroundColor: item.color,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClipSelect(item);
                    }}
                  >
                    <span className="text-xs text-white truncate">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Playhead */}
            <div 
              className="playhead"
              style={{ left: currentTime * pixelsPerSecond }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
