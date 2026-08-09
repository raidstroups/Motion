'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface AICommandInputProps {
  projectId?: string;
  onCommand: (command: string) => void;
  isProcessing?: boolean;
}

export function AICommandInput({ projectId, onCommand, isProcessing = false }: AICommandInputProps) {
  const [command, setCommand] = useState('');
  const [suggestions] = useState([
    'Remove the person behind me',
    'Brighten my face',
    'Clean up the audio',
    'Add a cinematic transition',
    'Color grade the footage',
    'Remove background noise',
    'Stabilize the video',
    'Add fade in/out',
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing || !projectId) return;

    onCommand(command);
    setCommand('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-2">
      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="flex-shrink-0 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isProcessing}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Sparkles 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={projectId ? "Describe what you want to change in the video..." : "Create a project first..."}
            className="ai-command-input pl-10"
            disabled={isProcessing || !projectId}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={!command.trim() || isProcessing || !projectId}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send size={16} />
              Execute
            </>
          )}
        </button>
      </form>

      {/* Status */}
      {isProcessing && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          AI is analyzing your request and creating an edit plan...
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Enter</kbd> to execute
      </div>
    </div>
  );
}
