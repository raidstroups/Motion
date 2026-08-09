import { AudioTrack } from '@prisma/client';

import prisma from '../client';

export interface CreateAudioTrackInput {
  projectId: string;
  assetId: string;
  name: string;
  language?: string;
  isOriginal: boolean;
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  codec: string;
}

export interface UpdateAudioTrackInput {
  name?: string;
  language?: string;
  isOriginal?: boolean;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  codec?: string;
}

export class AudioTrackRepository {
  async create(data: CreateAudioTrackInput): Promise<AudioTrack> {
    return prisma.audioTrack.create({ data });
  }

  async findById(id: string): Promise<AudioTrack | null> {
    return prisma.audioTrack.findUnique({
      where: { id },
      include: { segments: true },
    });
  }

  async findByProjectId(projectId: string): Promise<AudioTrack[]> {
    return prisma.audioTrack.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByAssetId(assetId: string): Promise<AudioTrack[]> {
    return prisma.audioTrack.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<AudioTrack[]> {
    return prisma.audioTrack.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.audioTrack.count({ where: where as any });
  }

  async update(id: string, data: UpdateAudioTrackInput): Promise<AudioTrack> {
    return prisma.audioTrack.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.audioTrack.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.audioTrack.deleteMany({ where: { projectId } });
  }
}

export const audioTrackRepository = new AudioTrackRepository();
