import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateId, TokenUsage } from '@motion/shared';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface AgentContext {
  projectId: string;
  userId: string;
  assets: unknown[];
  operations: unknown[];
  runId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (args: any, context: AgentContext) => Promise<unknown>;
}

export class BaseAgent {
  protected config: AgentConfig;
  protected model: string;
  protected tools: Map<string, ToolDefinition> = new Map();
  protected tokenUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  constructor(config: AgentConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 60000,
      ...config,
    };
    this.model = config.model || 'gpt-4o';
  }

  protected registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  protected async executeTool(name: string, args: Record<string, unknown>, context: AgentContext): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    const validatedArgs = tool.parameters.parse(args);
    return tool.execute(validatedArgs, context);
  }

  protected async generateText(
    prompt: string,
    system?: string
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        const result = await generateText({
          model: openai(this.model),
          prompt,
          system,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });

        this.tokenUsage = {
          promptTokens: this.tokenUsage.promptTokens + (result.usage?.promptTokens || 0),
          completionTokens: this.tokenUsage.completionTokens + (result.usage?.completionTokens || 0),
          totalTokens: this.tokenUsage.totalTokens + (result.usage?.totalTokens || 0),
        };

        return result.text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[BaseAgent] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < (this.config.maxRetries || 3)) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  protected async generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    system?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        const result = await generateObject({
          model: openai(this.model),
          schema,
          prompt,
          system,
          temperature: this.config.temperature,
        });

        this.tokenUsage = {
          promptTokens: this.tokenUsage.promptTokens + (result.usage?.promptTokens || 0),
          completionTokens: this.tokenUsage.completionTokens + (result.usage?.completionTokens || 0),
          totalTokens: this.tokenUsage.totalTokens + (result.usage?.totalTokens || 0),
        };

        return result.object;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[BaseAgent] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < (this.config.maxRetries || 3)) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  protected createToolCall(
    name: string,
    args: Record<string, unknown>
  ): { id: string; name: string; args: Record<string, unknown> } {
    return {
      id: generateId(),
      name,
      args,
    };
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  async execute(
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<Record<string, unknown>> {
    throw new Error('execute not implemented');
  }
}
