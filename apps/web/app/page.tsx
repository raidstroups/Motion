'use client';

import { useState } from 'react';
import { VideoPreview } from '../components/VideoPreview';
import { Timeline } from '../components/Timeline';
import { AICommandInput } from '../components/AICommandInput';
import { ProjectPanel } from '../components/ProjectPanel';

export default function Home() {
  const [project, setProject] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
          />
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 p-4">
            <VideoPreview 
              clip={selectedClip}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeUpdate={setCurrentTime}
              onPlayPause={() => setIsPlaying(!isPlaying)}
            />
          </div>

          {/* Timeline */}
          <div className="h-64 border-t border-border p-4">
            <Timeline 
              project={project}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
              onClipSelect={setSelectedClip}
            />
          </div>

          {/* AI Command */}
          <div className="border-t border-border p-4">
            <AICommandInput 
              projectId={project?.id}
              onCommand={(cmd) => console.log('Command:', cmd)}
            />
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-80 border-l border-border p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Properties</h2>
            <div className="text-sm text-muted-foreground">
              Select a clip or operation to view properties
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
