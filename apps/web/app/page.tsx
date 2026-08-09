'use client';

import { useState, useEffect } from 'react';
import { VideoPreview } from '../components/VideoPreview';
import { Timeline } from '../components/Timeline';
import { AICommandInput } from '../components/AICommandInput';
import { ProjectPanel } from '../components/ProjectPanel';
import { useAppStore } from '../store';
import { api } from '../lib/api';

export default function Home() {
  return <EditorContent />;
}

function EditorContent() {
  const { 
    project, setProject, 
    clips, setClips,
    playback, setPlayback,
    ui, setUI, setError
  } = useAppStore();
  
  const [selectedClip, setSelectedClip] = useState<any>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await api.projects.list();
        if (response.projects.length > 0) {
          const projectData = await api.projects.get(response.projects[0].id);
          setProject(projectData.project);
          setPlayback({ duration: projectData.project.settings.duration });
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    };
    
    loadProject();
  }, [setProject, setPlayback]);

  const handleCreateProject = async () => {
    try {
      const response = await api.projects.create({
        name: 'New Project',
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          duration: 60,
          codec: 'h264',
        },
      });
      setProject(response.project);
    } catch (error) {
      setError('Failed to create project');
    }
  };

  const handleCommand = async (command: string) => {
    if (!project) return;
    
    setUI({ isProcessing: true, processProgress: 0 });
    
    try {
      const processResponse = await api.process({
        projectId: project.id,
        instruction: command,
      });
      
      setUI({ processProgress: 50 });
      
      if (processResponse.editPlan.operations.length > 0) {
        const renderResponse = await api.render.start({
          projectId: project.id,
          editPlanId: 'current',
          assets: project.assets.map((a: any) => ({ path: a.url })),
          operations: processResponse.editPlan.operations.map((op: any) => ({
            type: op.type,
            parameters: op,
          })),
        });
        
        setUI({ processProgress: 100 });
      }
    } catch (error) {
      setError('Failed to process command');
    } finally {
      setUI({ isProcessing: false });
    }
  };

  const handleTimeChange = (time: number) => {
    setPlayback({ currentTime: time });
  };

  const handlePlayPause = () => {
    if (playback.isPlaying) {
      setPlayback({ isPlaying: false });
    } else {
      setPlayback({ isPlaying: true });
    }
  };

  const handleClipSelect = (clip: any) => {
    setSelectedClip(clip);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Motion Studio</h1>
          <span className="text-sm text-muted-foreground">AI Video Post-Production</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">File</button>
          <button className="btn btn-secondary">Edit</button>
          <button className="btn btn-secondary">View</button>
          <button className="btn btn-primary">Render</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border p-4">
          <ProjectPanel 
            project={project} 
            onProjectChange={setProject}
            onCreateProject={handleCreateProject}
          />
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 p-4">
            <VideoPreview 
              clip={selectedClip || (project?.assets?.[0] ? { 
                url: project.assets[0].url, 
                duration: project.assets[0].duration || 0 
              } : null)}
              currentTime={playback.currentTime}
              isPlaying={playback.isPlaying}
              onTimeUpdate={handleTimeChange}
              onPlayPause={handlePlayPause}
            />
          </div>

          {/* Timeline */}
          <div className="h-64 border-t border-border p-4">
            <Timeline 
              project={project}
              currentTime={playback.currentTime}
              onTimeChange={handleTimeChange}
              onClipSelect={handleClipSelect}
            />
          </div>

          {/* AI Command */}
          <div className="border-t border-border p-4">
            <AICommandInput 
              projectId={project?.id}
              onCommand={handleCommand}
              isProcessing={ui.isProcessing}
            />
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-80 border-l border-border p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Properties</h2>
            {selectedClip ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Name:</span> {selectedClip.name}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration:</span> {selectedClip.duration?.toFixed(2)}s
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a clip or operation to view properties
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Error Toast */}
      {ui.error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg">
          {ui.error}
          <button 
            className="ml-4 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
