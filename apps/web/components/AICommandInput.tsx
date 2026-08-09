'use client';

import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface AICommandInputProps {
  projectId?: string;
  onCommand: (command: string) => void;
}

export function AICommandInput({ projectId, onCommand }: AICommandInputProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions] = useState([
    'Remove the person behind me',
    'Brighten my face',
    'Clean up the audio',
    'Add a cinematic transition',
    'Color grade the footage',
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await onCommand(command);
      setCommand('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
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
            placeholder="Describe what you want to change in the video..."
            className="ai-command-input pl-10"
            disabled={isProcessing}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={!command.trim() || isProcessing}
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
          AI is analyzing your request...
        </div>
      )}
    </div>
  );
}
