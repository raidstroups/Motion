import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId, ColorAdjustments } from '@motion/shared';

const ColorCorrectionSchema = z.object({
  scope: z.enum(['global', 'scene', 'shot', 'object', 'face', 'mask']),
  adjustments: z.object({
    exposure: z.number().min(-5).max(5).optional(),
    contrast: z.number().min(-100).max(100).optional(),
    highlights: z.number().min(-100).max(100).optional(),
    shadows: z.number().min(-100).max(100).optional(),
    whites: z.number().min(-100).max(100).optional(),
    blacks: z.number().min(-100).max(100).optional(),
    temperature: z.number().min(-100).max(100).optional(),
    tint: z.number().min(-100).max(100).optional(),
    saturation: z.number().min(-100).max(100).optional(),
    vibrance: z.number().min(-100).max(100).optional(),
  }),
  maskId: z.string().optional(),
  affectedFrames: z.object({
    start: z.number(),
    end: z.number(),
  }),
  lutId: z.string().optional(),
  curves: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

type ColorCorrectionResult = z.infer<typeof ColorCorrectionSchema>;

export class ColorAgent extends BaseAgent {
  async execute(
    input: {
      instruction: string;
      clipId: string;
      startTime: number;
      endTime: number;
      objectId?: string;
    },
    context: AgentContext
  ): Promise<ColorCorrectionResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    return this.generateStructured(
      ColorCorrectionSchema,
      userPrompt,
      systemPrompt
    );
  }

  private buildSystemPrompt(): string {
    return `You are a professional colorist AI. Your role is to:

1. Interpret color correction instructions
2. Analyze current color state of video
3. Plan precise color adjustments
4. Apply corrections selectively when needed
5. Maintain color consistency across frames

Key capabilities:
- Global color correction
- Scene-based correction
- Object-specific correction
- Face/skin tone correction
- Mask-based local correction

Available adjustments:
- Exposure: Overall brightness
- Contrast: Difference between light and dark
- Highlights: Bright areas
- Shadows: Dark areas
- Whites: White point
- Blacks: Black point
- Temperature: Warm/cool balance
- Tint: Green/magenta balance
- Saturation: Color intensity
- Vibrance: Selective saturation

Principles:
- Preserve natural look unless stylization requested
- Maintain skin tone accuracy
- Keep temporal consistency
- Use minimal adjustments for subtle changes`;
  }

  private buildUserPrompt(
    input: {
      instruction: string;
      clipId: string;
      startTime: number;
      endTime: number;
      objectId?: string;
    },
    context: AgentContext
  ): string {
    return `Color correction request:

Instruction: "${input.instruction}"
Clip ID: ${input.clipId}
Time range: ${input.startTime} - ${input.endTime}
Target object: ${input.objectId || 'global'}

Analyze the instruction and create a color correction plan:
1. Determine the scope (global, scene, object, face, mask)
2. Specify exact adjustments needed
3. Consider any masking requirements
4. Estimate the impact of changes

Provide specific values for each adjustment parameter.`;
  }

  async analyzeColorState(frames: string[]): Promise<{
    dominantColors: { color: string; percentage: number }[];
    exposure: number;
    contrast: number;
    saturation: number;
    temperature: number;
    issues: string[];
  }> {
    const systemPrompt = `Analyze the color state of video frames.
Identify:
- Dominant colors and their distribution
- Exposure level (underexposed, correct, overexposed)
- Contrast level (low, normal, high)
- Saturation level (desaturated, normal, oversaturated)
- Temperature (cool, neutral, warm)
- Any color issues that need correction`;

    const prompt = `Analyze color state of these frames:
${frames.slice(0, 10).join(', ')}`;

    return this.generateStructured(
      z.object({
        dominantColors: z.array(z.object({
          color: z.string(),
          percentage: z.number(),
        })),
        exposure: z.number(),
        contrast: z.number(),
        saturation: z.number(),
        temperature: z.number(),
        issues: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }

  async planSelectiveCorrection(
    instruction: string,
    objectId: string,
    clipId: string,
    startTime: number,
    endTime: number
  ): Promise<{
    detection: { method: string; parameters: Record<string, unknown> };
    masking: { method: string; parameters: Record<string, unknown> };
    colorAdjustments: ColorAdjustments;
    blending: { method: string; feather: number };
  }> {
    const systemPrompt = `Plan selective color correction for a specific object.
Consider:
- How to detect and isolate the object
- How to create accurate masks
- What color adjustments are needed
- How to blend corrections naturally`;

    const prompt = `Plan selective color correction:
Instruction: "${instruction}"
Object: ${objectId}
Clip: ${clipId}
Time: ${startTime} - ${endTime}`;

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
        colorAdjustments: z.object({
          exposure: z.number().optional(),
          contrast: z.number().optional(),
          highlights: z.number().optional(),
          shadows: z.number().optional(),
          saturation: z.number().optional(),
        }),
        blending: z.object({
          method: z.string(),
          feather: z.number(),
        }),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const colorAgent = new ColorAgent();
