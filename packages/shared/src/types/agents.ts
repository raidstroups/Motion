export type AgentType = 
  | 'director'
  | 'video_analyzer'
  | 'audio_analyzer'
  | 'vfx'
  | 'color'
  | 'lighting'
  | 'audio'
  | 'transition'
  | 'qa';

export type AgentStatus = 
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'completed'
  | 'failed';

export interface AgentRun {
  id: string;
  projectId: string;
  agentType: AgentType;
  status: AgentStatus;
  input: AgentInput;
  output?: AgentOutput;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  tokenUsage?: TokenUsage;
  model?: string;
}

export interface AgentInput {
  type: string;
  data: Record<string, unknown>;
}

export interface AgentOutput {
  type: string;
  data: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface AgentMessage {
  id: string;
  runId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError: boolean;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}
