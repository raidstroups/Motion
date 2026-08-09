'use client';

import { useState } from 'react';
import { 
  FolderOpen, 
  Upload, 
  Film, 
  FileVideo,
  Clock,
  Settings,
  Trash2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  assets: Asset[];
  createdAt: Date;
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration: number;
  };
}

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size: number;
}

interface ProjectPanelProps {
  project: Project | null;
  onProjectChange: (project: Project | null) => void;
}

export function ProjectPanel({ project, onProjectChange }: ProjectPanelProps) {
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual upload logic
      console.log('Uploading files:', files);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Project</h2>
        {project ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{project.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                project.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400'
                  : project.status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {project.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {project.settings.resolution.width}x{project.settings.resolution.height} • {project.settings.fps}fps
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No project selected
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div>
        <h3 className="text-sm font-medium mb-2">Assets</h3>
        <label className="block border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
          <input
            type="file"
            accept="video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {isUploading ? 'Uploading...' : 'Drop files or click to upload'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Video, Audio, Image
          </div>
        </label>
      </div>

      {/* Assets List */}
      {project && project.assets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Files</h3>
          <div className="space-y-2">
            {project.assets.map(asset => (
              <div 
                key={asset.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
              >
                {asset.type === 'video' ? (
                  <FileVideo size={16} className="text-primary" />
                ) : (
                  <Film size={16} className="text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(asset.size)}
                    {asset.duration && ` • ${formatDuration(asset.duration)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full btn btn-secondary flex items-center justify-start gap-2">
            <Settings size={16} />
            Project Settings
          </button>
          <button className="w-full btn btn-secondary flex items-center justify-start gap-2">
            <Clock size={16} />
            Version History
          </button>
        </div>
      </div>
    </div>
  );
}
