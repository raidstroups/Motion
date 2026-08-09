import { z } from 'zod';
import { BaseAgent, AgentConfig, AgentContext } from '../base-agent';
import { generateId, VideoAnalysis, Scene, Shot, TrackedObject, FaceTrack, CameraMotion } from '@motion/shared';

const VideoAnalysisSchema = z.object({
  scenes: z.array(z.object({
    id: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    duration: z.number(),
    confidence: z.number(),
    description: z.string().optional(),
  })),
  shots: z.array(z.object({
    id: z.string(),
    sceneId: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    duration: z.number(),
    cameraMotion: z.string().optional(),
    confidence: z.number(),
  })),
  objects: z.array(z.object({
    id: z.string(),
    category: z.string(),
    label: z.string().optional(),
    confidence: z.number(),
    firstFrame: z.number(),
    lastFrame: z.number(),
    boundingBoxes: z.array(z.object({
      frame: z.number(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      confidence: z.number(),
    })),
  })),
  faces: z.array(z.object({
    id: z.string(),
    personId: z.string().optional(),
    confidence: z.number(),
    firstFrame: z.number(),
    lastFrame: z.number(),
  })),
  cameraMotion: z.array(z.string()),
  visualIssues: z.array(z.object({
    type: z.string(),
    frameRange: z.object({ start: z.number(), end: z.number() }),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
  })),
});

type VideoAnalysisResult = z.infer<typeof VideoAnalysisSchema>;

export class VideoAnalyzerAgent extends BaseAgent {
  async execute(
    input: { assetId: string; frames: string[] },
    context: AgentContext
  ): Promise<VideoAnalysis> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input, context);

    const result = await this.generateStructured(
      VideoAnalysisSchema,
      userPrompt,
      systemPrompt
    );

    return this.createVideoAnalysis(result);
  }

  private buildSystemPrompt(): string {
    return `You are a professional video analysis AI. Your role is to:

1. Detect scenes, shots, and cuts in video
2. Identify and track objects, people, and faces
3. Analyze camera movements and motion
4. Detect visual issues and anomalies
5. Create a comprehensive video analysis

Key capabilities:
- Scene detection: Identify distinct scenes based on visual changes
- Shot detection: Identify camera shots within scenes
- Object detection: Identify and categorize objects
- Face detection: Detect and track faces
- Camera motion analysis: Detect pans, tilts, zooms, etc.
- Visual quality assessment: Identify issues like blur, noise, etc.

Output a structured analysis with:
- Scenes with timestamps and confidence
- Shots with camera motion types
- Objects with bounding boxes and tracking data
- Faces with landmarks and person association
- Camera motion patterns
- Visual issues detected`;
  }

  private buildUserPrompt(
    input: { assetId: string; frames: string[] },
    context: AgentContext
  ): string {
    return `Analyze the following video frames:

Asset ID: ${input.assetId}
Number of frames: ${input.frames.length}
Frame samples: ${input.frames.slice(0, 10).join(', ')}

Perform comprehensive video analysis including:
1. Scene detection and segmentation
2. Shot detection within scenes
3. Object detection and categorization
4. Face detection and tracking
5. Camera motion analysis
6. Visual quality assessment

Provide detailed timestamps and confidence scores for each detection.`;
  }

  private createVideoAnalysis(result: VideoAnalysisResult): VideoAnalysis {
    return {
      scenes: result.scenes.map(scene => ({
        id: scene.id || generateId(),
        clipId: '',
        startTime: scene.startTime,
        endTime: scene.endTime,
        duration: scene.duration,
        confidence: scene.confidence,
      })),
      shots: result.shots.map(shot => ({
        id: shot.id || generateId(),
        sceneId: shot.sceneId,
        startTime: shot.startTime,
        endTime: shot.endTime,
        duration: shot.duration,
        confidence: shot.confidence,
      })),
      objects: result.objects.map(obj => ({
        id: obj.id || generateId(),
        clipId: '',
        category: obj.category,
        label: obj.label,
        confidence: obj.confidence,
        firstFrame: obj.firstFrame,
        lastFrame: obj.lastFrame,
        boundingBoxes: obj.boundingBoxes,
      })),
      faces: result.faces.map(face => ({
        id: face.id || generateId(),
        clipId: '',
        personId: face.personId,
        confidence: face.confidence,
        firstFrame: face.firstFrame,
        lastFrame: face.lastFrame,
      })),
      cameraMotion: result.cameraMotion as CameraMotion[],
      visualIssues: result.visualIssues.map(issue => ({
        ...issue,
        region: undefined,
      })),
    };
  }

  async detectScenes(frames: string[]): Promise<{
    scenes: { startFrame: number; endFrame: number; confidence: number }[];
    cuts: number[];
  }> {
    const systemPrompt = `Detect scene changes and cuts in the provided frames.
Look for:
- Significant visual changes
- Color palette shifts
- Content changes
- Camera angle changes

Return scene boundaries with confidence scores.`;

    const prompt = `Analyze these ${frames.length} frames for scene changes.
Frames: ${frames.slice(0, 20).join(', ')}`;

    const result = await this.generateStructured(
      z.object({
        scenes: z.array(z.object({
          startFrame: z.number(),
          endFrame: z.number(),
          confidence: z.number(),
        })),
        cuts: z.array(z.number()),
      }),
      prompt,
      systemPrompt
    );

    return result;
  }

  async detectObjects(frames: string[]): Promise<{
    objects: {
      id: string;
      category: string;
      label?: string;
      confidence: number;
      firstFrame: number;
      lastFrame: number;
      boundingBoxes: { frame: number; x: number; y: number; width: number; height: number }[];
    }[];
  }> {
    const systemPrompt = `Detect and track objects across video frames.
Identify:
- People (Person_001, Person_002, etc.)
- Vehicles (Car_001, etc.)
- Animals (Dog_001, etc.)
- Objects (Table_001, etc.)
- Text/Logos (Logo_001, etc.)

Track each object across frames with bounding boxes.`;

    const prompt = `Analyze these ${frames.length} frames for objects.
Frames: ${frames.slice(0, 20).join(', ')}`;

    return this.generateStructured(
      z.object({
        objects: z.array(z.object({
          id: z.string(),
          category: z.string(),
          label: z.string().optional(),
          confidence: z.number(),
          firstFrame: z.number(),
          lastFrame: z.number(),
          boundingBoxes: z.array(z.object({
            frame: z.number(),
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
          })),
        })),
      }),
      prompt,
      systemPrompt
    );
  }
}

export const videoAnalyzerAgent = new VideoAnalyzerAgent();
