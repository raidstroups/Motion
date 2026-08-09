import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateId } from '@motion/shared';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentContext {
  projectId: string;
  userId: string;
  assets: unknown[];
  operations: unknown[];
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected model: string;

  constructor(config: AgentConfig = {}) {
    this.config = config;
    this.model = config.model || 'gpt-4o';
  }

  protected async generateText(
    prompt: string,
    system?: string
  ): Promise<string> {
    const result = await generateText({
      model: openai(this.model),
      prompt,
      system,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    return result.text;
  }

  protected async generateStructured<T>(
    schema: z.ZodSchema<T>,
    prompt: string,
    system?: string
  ): Promise<T> {
    const result = await generateObject({
      model: openai(this.model),
      schema,
      prompt,
      system,
      temperature: this.config.temperature,
    });

    return result.object;
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

  abstract execute(
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<Record<string, unknown>>;
}
