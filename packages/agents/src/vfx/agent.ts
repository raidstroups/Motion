import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId } from '@motion/shared';

const VFXOperationSchema = z.object({
  type: z.enum([
    'object_removal',
    'object_replacement',
    'blur',
    'mask',
    'chroma_key',
    'stabilization',
    'upscale',
  ]),
  objectId: z.string().optional(),
  maskData: z.string().optional(),
  parameters: z.record(z.unknown()),
  affectedFrames: z.object({
    start: z.number(),
    end: z.number(),
  }),
  affectedRegion: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
});

type VFXOperationResult = z.infer<typeof VFXOperationSchema>;

export class VFXAgent extends BaseAgent {
  async execute(
    input: {
      operation: string;
      objectId?: string;
      clipId: string;
      startTime: number;
      endTime: number;
    },
    context: AgentContext
  ): Promise<VFXOperationResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    return this.generateStructured(
      VFXOperationSchema,
      userPrompt,
      systemPrompt
    );
  }

  private buildSystemPrompt(): string {
    return `You are a professional VFX artist AI. Your role is to:

1. Plan and execute visual effects operations
2. Create precise masks for object isolation
3. Handle object removal with background reconstruction
4. Apply blur effects selectively
5. Perform chroma key operations
6. Stabilize footage
7. Upscale video quality

Key principles:
- Never modify the entire frame if only a region needs changes
- Preserve original content outside the affected area
- Maintain temporal consistency across frames
- Use appropriate techniques for each operation type

Available operations:
- object_removal: Remove objects using inpainting
- object_replacement: Replace objects with alternatives
- blur: Apply selective blur (face, background, etc.)
- mask: Create and apply masks
- chroma_key: Green screen removal
- stabilization: Fix shaky footage
- upscale: Enhance resolution

For each operation, specify:
- Exact affected frames (start/end)
- Affected region (if not full frame)
- Parameters for the operation
- Dependencies on other operations`;
  }

  private buildUserPrompt(
    input: {
      operation: string;
      objectId?: string;
      clipId: string;
      startTime: number;
      endTime: number;
    },
    context: AgentContext
  ): string {
    return `Plan VFX operation:

Operation: ${input.operation}
Object ID: ${input.objectId || 'N/A'}
Clip ID: ${input.clipId}
Time range: ${input.startTime} - ${input.endTime}

Create a detailed VFX plan including:
1. Type of operation
2. Affected frames (exact range)
3. Affected region (if applicable)
4. Parameters for the operation
5. Any dependencies on other operations

Consider:
- What frames need to be processed
- What region of each frame needs modification
- How to maintain temporal consistency
- What techniques to use for best results`;
  }

  async planObjectRemoval(
    objectId: string,
    clipId: string,
    startTime: number,
    endTime: number
  ): Promise<{
    maskGeneration: { method: string; parameters: Record<string, unknown> };
    tracking: { method: string; parameters: Record<string, unknown> };
    inpainting: { method: string; parameters: Record<string, unknown> };
    postProcessing: string[];
  }> {
    const systemPrompt = `Plan object removal operation in detail.
Consider:
- How to generate accurate masks
- How to track the object across frames
- How to reconstruct the background
- How to maintain temporal consistency`;

    const prompt = `Plan removal of object ${objectId} from clip ${clipId} between ${startTime} and ${endTime}`;

    return this.generateStructured(
      z.object({
        maskGeneration: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        tracking: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        inpainting: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        postProcessing: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }

  async planBlur(
    blurType: 'face' | 'background' | 'selective',
    clipId: string,
    startTime: number,
    endTime: number,
    options: {
      objectId?: string;
      intensity?: number;
    } = {}
  ): Promise<{
    detection: { method: string; parameters: Record<string, unknown> };
    masking: { method: string; parameters: Record<string, unknown> };
    blurApplication: { method: string; parameters: Record<string, unknown> };
    temporalConsistency: boolean;
  }> {
    const systemPrompt = `Plan blur operation for ${blurType} blur.
Consider:
- How to detect the target (face, background, etc.)
- How to create accurate masks
- How to apply blur effectively
- How to maintain consistency across frames`;

    const prompt = `Plan ${blurType} blur for clip ${clipId} between ${startTime} and ${endTime}
Options: ${JSON.stringify(options)}`;

    return this.generateStructured(
      z.object({
        detection: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        masking: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        blurApplication: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        temporalConsistency: z.boolean(),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const vfxAgent = new VFXAgent();
