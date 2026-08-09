import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId, AudioOperationType, AudioOperationParameters } from '@motion/shared';

const AudioOperationSchema = z.object({
  type: z.enum([
    'noise_reduction',
    'voice_isolation',
    'speaker_isolation',
    'hum_removal',
    'echo_reduction',
    'dereverberation',
    'eq',
    'compression',
    'loudness_normalization',
    'clipping_repair',
    'silence_detection',
    'background_music_ducking',
    'gain',
    'pitch_shift',
    'time_stretch',
  ]),
  startTime: z.number(),
  endTime: z.number(),
  targetSpeaker: z.string().optional(),
  parameters: z.record(z.unknown()),
  affectedChannels: z.array(z.number()).optional(),
});

type AudioOperationResult = z.infer<typeof AudioOperationSchema>;

export class AudioAgent extends BaseAgent {
  async execute(
    input: {
      instruction: string;
      trackId: string;
      startTime: number;
      endTime: number;
      speakerId?: string;
    },
    context: AgentContext
  ): Promise<AudioOperationResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    return this.generateStructured(
      AudioOperationSchema,
      userPrompt,
      systemPrompt
    );
  }

  private buildSystemPrompt(): string {
    return `You are a professional audio engineer AI. Your role is to:

1. Interpret audio processing instructions
2. Analyze audio characteristics
3. Plan precise audio operations
4. Apply corrections selectively
5. Maintain audio quality and sync

Key capabilities:
- Noise reduction and cleanup
- Voice isolation and enhancement
- Speaker diarization and isolation
- Hum and echo removal
- EQ and compression
- Loudness normalization
- Clipping repair
- Background music ducking

Available operations:
- noise_reduction: Remove background noise
- voice_isolation: Isolate speech from background
- speaker_isolation: Isolate specific speaker
- hum_removal: Remove electrical hum
- echo_reduction: Reduce echo/reverb
- dereverberation: Remove room reverb
- eq: Equalization adjustments
- compression: Dynamic range compression
- loudness_normalization: Normalize audio levels
- clipping_repair: Fix clipped audio
- silence_detection: Detect silent sections
- background_music_ducking: Duck music under speech
- gain: Adjust volume levels
- pitch_shift: Change pitch
- time_stretch: Change duration without pitch change

Principles:
- Preserve audio quality
- Maintain sync with video
- Process only affected sections
- Use appropriate techniques for each issue`;
  }

  private buildUserPrompt(
    input: {
      instruction: string;
      trackId: string;
      startTime: number;
      endTime: number;
      speakerId?: string;
    },
    context: AgentContext
  ): string {
    return `Audio processing request:

Instruction: "${input.instruction}"
Track ID: ${input.trackId}
Time range: ${input.startTime} - ${input.endTime}
Target speaker: ${input.speakerId || 'all'}

Analyze the instruction and create an audio processing plan:
1. Determine the type of operation needed
2. Specify exact time range
3. Identify target speaker (if applicable)
4. Set appropriate parameters
5. Consider any channel-specific processing

Provide specific values for each parameter.`;
  }

  async analyzeAudio(trackId: string): Promise<{
    speechSegments: { start: number; end: number; speakerId?: string }[];
    musicSegments: { start: number; end: number; genre?: string }[];
    noiseLevel: number;
    dynamicRange: number;
    issues: string[];
  }> {
    const systemPrompt = `Analyze audio track characteristics.
Identify:
- Speech segments and speakers
- Music segments and genres
- Noise level and type
- Dynamic range
- Audio issues that need correction`;

    const prompt = `Analyze audio track ${trackId}`;

    return this.generateStructured(
      z.object({
        speechSegments: z.array(z.object({
          start: z.number(),
          end: z.number(),
          speakerId: z.string().optional(),
        })),
        musicSegments: z.array(z.object({
          start: z.number(),
          end: z.number(),
          genre: z.string().optional(),
        })),
        noiseLevel: z.number(),
        dynamicRange: z.number(),
        issues: z.array(z.string()),
      }),
      prompt,
      systemPrompt
    );
  }

  async planVoiceIsolation(
    trackId: string,
    startTime: number,
    endTime: number,
    targetSpeaker?: string
  ): Promise<{
    diarization: { method: string; parameters: Record<string, unknown> };
    separation: { method: string; parameters: Record<string, unknown> };
    enhancement: { method: string; parameters: Record<string, unknown> };
    mixing: { method: string; parameters: Record<string, unknown> };
  }> {
    const systemPrompt = `Plan voice isolation operation.
Consider:
- How to detect and separate speakers
- How to isolate the target voice
- How to enhance voice quality
- How to mix the result`;

    const prompt = `Plan voice isolation for track ${trackId} between ${startTime} and ${endTime}
Target speaker: ${targetSpeaker || 'all'}`;

    return this.generateStructured(
      z.object({
        diarization: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        separation: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        enhancement: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        mixing: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
      }),
      prompt,
      systemPrompt
    );
  }

  async planNoiseReduction(
    trackId: string,
    startTime: number,
    endTime: number,
    noiseType?: string
  ): Promise<{
    analysis: { method: string; parameters: Record<string, unknown> };
    reduction: { method: string; parameters: Record<string, unknown> };
    preservation: { method: string; parameters: Record<string, unknown> };
    validation: { method: string; parameters: Record<string, unknown> };
  }> {
    const systemPrompt = `Plan noise reduction operation.
Consider:
- How to analyze noise profile
- How to reduce noise effectively
- How to preserve speech quality
- How to validate results`;

    const prompt = `Plan noise reduction for track ${trackId} between ${startTime} and ${endTime}
Noise type: ${noiseType || 'unknown'}`;

    return this.generateStructured(
      z.object({
        analysis: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        reduction: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        preservation: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
        validation: z.object({
          method: z.string(),
          parameters: z.record(z.unknown()),
        }),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const audioAgent = new AudioAgent();
