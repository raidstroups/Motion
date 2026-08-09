import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId } from '@motion/shared';

const QAResultSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    frameRange: z.object({ start: z.number(), end: z.number() }).optional(),
    region: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
    suggestion: z.string().optional(),
  })),
  recommendations: z.array(z.string()),
  requiresReprocessing: z.boolean(),
  reprocessingRegions: z.array(z.object({
    operationId: z.string(),
    frameRange: z.object({ start: z.number(), end: z.number() }),
    region: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
  })).optional(),
});

type QAResult = z.infer<typeof QAResultSchema>;

export class QAAgent extends BaseAgent {
  async execute(
    input: {
      originalFrames: string[];
      editedFrames: string[];
      editPlan: unknown;
      operationId: string;
    },
    context: AgentContext
  ): Promise<QAResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    return this.generateStructured(
      QAResultSchema,
      userPrompt,
      systemPrompt
    );
  }

  private buildSystemPrompt(): string {
    return `You are a professional quality assurance AI for video post-production. Your role is to:

1. Compare original and edited video frames
2. Verify that requested operations were applied correctly
3. Detect any visual artifacts or issues
4. Ensure temporal consistency
5. Provide detailed quality assessment

Check for:
- Object removal completeness
- Mask accuracy
- Tracking consistency
- Color accuracy
- Audio sync
- Temporal consistency
- Visual artifacts (ghosting, flickering, warping)
- Frame corruption
- Transition smoothness
- Volume levels
- Clipping

Severity levels:
- low: Minor issue, barely noticeable
- medium: Noticeable issue, may need correction
- high: Significant issue, should be corrected
- critical: Major issue, must be corrected

Provide:
- Overall pass/fail
- Quality score (0-1)
- List of issues with severity and location
- Recommendations for improvement
- Whether reprocessing is needed
- Specific regions that need reprocessing`;
  }

  private buildUserPrompt(
    input: {
      originalFrames: string[];
      editedFrames: string[];
      editPlan: unknown;
      operationId: string;
    },
    context: AgentContext
  ): string {
    return `Quality assurance check:

Operation ID: ${input.operationId}
Original frames: ${input.originalFrames.length}
Edited frames: ${input.editedFrames.length}

Edit plan: ${JSON.stringify(input.editPlan, null, 2)}

Compare the original and edited frames to verify:
1. Was the requested operation applied correctly?
2. Are there any visual artifacts?
3. Is temporal consistency maintained?
4. Are there any quality issues?

Provide a detailed quality assessment.`;
  }

  async checkObjectRemoval(
    originalFrames: string[],
    editedFrames: string[],
    objectId: string
  ): Promise<{
    removalComplete: boolean;
    backgroundReconstructed: boolean;
    artifacts: string[];
    temporalConsistency: number;
  }> {
    const systemPrompt = `Check object removal quality.
Verify:
- Object is completely removed
- Background is properly reconstructed
- No artifacts remain
- Temporal consistency is maintained`;

    const prompt = `Check removal of object ${objectId}
Original frames: ${originalFrames.slice(0, 5).join(', ')}
Edited frames: ${editedFrames.slice(0, 5).join(', ')}`;

    return this.generateStructured(
      z.object({
        removalComplete: z.boolean(),
        backgroundReconstructed: z.boolean(),
        artifacts: z.array(z.string()),
        temporalConsistency: z.number().min(0).max(1),
      }),
      prompt,
      systemPrompt
    );
  }

  async checkColorCorrection(
    originalFrames: string[],
    editedFrames: string[],
    targetAdjustments: Record<string, number>
  ): Promise<{
    adjustmentsApplied: boolean;
    colorAccuracy: number;
    skinTonesPreserved: boolean;
    artifacts: string[];
  }> {
    const systemPrompt = `Check color correction quality.
Verify:
- Requested adjustments were applied
- Color accuracy is maintained
- Skin tones are preserved (if applicable)
- No color artifacts`;

    const prompt = `Check color correction
Target adjustments: ${JSON.stringify(targetAdjustments)}
Original frames: ${originalFrames.slice(0, 5).join(', ')}
Edited frames: ${editedFrames.slice(0, 5).join(', ')}`;

    return this.generateStructured(
      z.object({
        adjustmentsApplied: z.boolean(),
        colorAccuracy: z.number().min(0).max(1),
        skinTonesPreserved: z.boolean(),
        artifacts: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }

  async checkTemporalConsistency(
    frames: string[],
    operationType: string
  ): Promise<{
    consistent: boolean;
    flickering: boolean;
    ghosting: boolean;
    warping: boolean;
    score: number;
    issues: string[];
  }> {
    const systemPrompt = `Check temporal consistency for ${operationType}.
Verify:
- No flickering between frames
- No ghosting artifacts
- No warping or distortion
- Smooth transitions`;

    const prompt = `Check temporal consistency for ${operationType}
Frames: ${frames.slice(0, 10).join(', ')}`;

    return this.generateStructured(
      z.object({
        consistent: z.boolean(),
        flickering: z.boolean(),
        ghosting: z.boolean(),
        warping: z.boolean(),
        score: z.number().min(0).max(1),
        issues: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const qaAgent = new QAAgent();
