'use client';

import { useState, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  Film, 
  FileVideo,
  Clock,
  Settings,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

interface Project {
  id: string;
  name: string;
  status: string;
  assets: Asset[];
  createdAt: string;
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
  onCreateProject: () => void;
}

export function ProjectPanel({ project, onProjectChange, onCreateProject }: ProjectPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!files || files.length === 0 || !project) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.upload(Array.from(files), project.id);
      
      for (const file of response.files) {
        await api.assets.create(project.id, {
          type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image',
          name: file.name,
          url: file.url,
          mimeType: file.type,
          size: file.size,
        });
      }

      const updatedProject = await api.projects.get(project.id);
      onProjectChange(updatedProject.project);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!project) return;
    
    try {
      await api.assets.delete(project.id, assetId);
      const updatedProject = await api.projects.get(project.id);
      onProjectChange(updatedProject.project);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Project</h2>
          <button 
            className="p-1 hover:bg-muted rounded"
            onClick={onCreateProject}
          >
            <Plus size={16} />
          </button>
        </div>
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
            <button 
              className="btn btn-primary w-full"
              onClick={onCreateProject}
            >
              Create New Project
            </button>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div>
        <h3 className="text-sm font-medium mb-2">Assets</h3>
        <label className="block border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading || !project}
          />
          {isUploading ? (
            <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
          ) : (
            <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
          )}
          <div className="text-sm text-muted-foreground">
            {isUploading ? `Uploading... ${uploadProgress}%` : 'Drop files or click to upload'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Video, Audio
          </div>
        </label>
      </div>

      {/* Assets List */}
      {project && project.assets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Files ({project.assets.length})</h3>
          <div className="space-y-2">
            {project.assets.map(asset => (
              <div 
                key={asset.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted group"
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
                <button
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
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
