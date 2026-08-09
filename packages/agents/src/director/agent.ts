import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId, EditPlan, EditOperation } from '@motion/shared';

const EditPlanSchema = z.object({
  operations: z.array(z.object({
    type: z.string(),
    sourceClipId: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    priority: z.number(),
    confidence: z.number(),
    parameters: z.record(z.unknown()),
  })),
  dependencies: z.array(z.object({
    operationId: z.string(),
    dependsOn: z.array(z.string()),
    type: z.enum(['requires', 'enhances', 'conflicts']),
  })),
  renderStrategy: z.enum(['sequential', 'parallel', 'optimized']),
  qualityTarget: z.enum(['draft', 'high_quality', 'cinematic_master']),
  estimatedDuration: z.number().optional(),
  estimatedCost: z.number().optional(),
});

type EditPlanResult = z.infer<typeof EditPlanSchema>;

export interface DirectorAgentConfig extends AgentConfig {
  enablePlanning?: boolean;
  enableOptimization?: boolean;
}

export class DirectorAgent extends BaseAgent {
  private enablePlanning: boolean;
  private enableOptimization: boolean;

  constructor(config: DirectorAgentConfig = {}) {
    super(config);
    this.enablePlanning = config.enablePlanning !== false;
    this.enableOptimization = config.enableOptimization !== false;
  }

  async execute(
    input: { instruction: string; videoAnalysis?: unknown },
    context: AgentContext
  ): Promise<EditPlan> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    const result = await this.generateStructured(
      EditPlanSchema,
      userPrompt,
      systemPrompt
    );

    return this.createEditPlan(result, context);
  }

  private buildSystemPrompt(): string {
    return `You are a professional video post-production director AI. Your role is to:

1. Interpret user instructions in natural language
2. Analyze the video content and identify what needs to be modified
3. Create a detailed edit plan with specific operations
4. Determine the optimal order of operations
5. Estimate resources and time required

You have access to these operation types:
- object_removal: Remove objects or people from video
- color_correction: Adjust colors, exposure, contrast
- lighting: Modify lighting conditions
- blur: Apply blur effects
- transition: Create transitions between clips
- audio_processing: Process audio tracks
- stabilization: Stabilize shaky footage
- upscale: Enhance video resolution

Key principles:
- Never regenerate the entire video
- Only modify the specific regions/frames that need changes
- Preserve original content as much as possible
- Use non-destructive editing techniques
- Consider temporal consistency across frames

Create an edit plan that specifies:
- Each operation with exact timing and parameters
- Dependencies between operations
- Render strategy (sequential, parallel, or optimized)
- Quality target based on user needs`;
  }

  private buildUserPrompt(
    input: { instruction: string; videoAnalysis?: unknown },
    context: AgentContext
  ): string {
    let prompt = `User instruction: "${input.instruction}"\n\n`;
    
    prompt += `Project ID: ${context.projectId}\n`;
    prompt += `Available assets: ${context.assets.length}\n`;
    prompt += `Existing operations: ${context.operations.length}\n`;
    
    if (input.videoAnalysis) {
      prompt += `\nVideo analysis:\n${JSON.stringify(input.videoAnalysis, null, 2)}\n`;
    }
    
    prompt += `\nCreate a detailed edit plan for this instruction. Consider:
1. What specific operations are needed
2. The exact time ranges for each operation
3. Which objects or regions need to be targeted
4. Dependencies between operations
5. Optimal processing strategy`;
    
    return prompt;
  }

  private createEditPlan(
    result: EditPlanResult,
    context: AgentContext
  ): EditPlan {
    const operations: EditOperation[] = result.operations.map((op, index) => ({
      id: generateId(),
      type: op.type as EditOperation['type'],
      sourceClipId: op.sourceClipId,
      startTime: op.startTime,
      endTime: op.endTime,
      priority: op.priority,
      status: 'planned' as const,
      confidence: op.confidence,
      dependencies: op.dependencies || [],
      metadata: op.parameters,
    }));

    return {
      id: generateId(),
      projectId: context.projectId,
      operations,
      dependencies: result.dependencies.map(dep => ({
        ...dep,
        operationId: dep.operationId,
      })),
      renderStrategy: result.renderStrategy,
      qualityTarget: result.qualityTarget,
      estimatedDuration: result.estimatedDuration,
      estimatedCost: result.estimatedCost,
      createdAt: new Date(),
    };
  }

  async analyzeInstruction(
    instruction: string,
    videoAnalysis: unknown
  ): Promise<{
    intent: string;
    operations: string[];
    confidence: number;
    questions: string[];
  }> {
    const systemPrompt = `Analyze the user's video editing instruction and identify:
1. The main intent (what they want to achieve)
2. What specific operations are needed
3. Your confidence level (0-1)
4. Any clarifying questions you might need to ask`;

    const prompt = `Instruction: "${instruction}"\n\nVideo analysis: ${JSON.stringify(videoAnalysis, null, 2)}`;

    return this.generateStructured(
      z.object({
        intent: z.string(),
        operations: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        questions: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const directorAgent = new DirectorAgent();
