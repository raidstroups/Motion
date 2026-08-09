import { AudioSegment } from '@prisma/client';

import prisma from '../client';

export interface CreateAudioSegmentInput {
  trackId: string;
  startTime: number;
  endTime: number;
  type: string;
  speakerId?: string;
  confidence: number;
  text?: string;
  language?: string;
}

export interface UpdateAudioSegmentInput {
  startTime?: number;
  endTime?: number;
  type?: string;
  speakerId?: string;
  confidence?: number;
  text?: string;
  language?: string;
}

export class AudioSegmentRepository {
  async create(data: CreateAudioSegmentInput): Promise<AudioSegment> {
    return prisma.audioSegment.create({ data });
  }

  async findById(id: string): Promise<AudioSegment | null> {
    return prisma.audioSegment.findUnique({ where: { id } });
  }

  async findByTrackId(trackId: string): Promise<AudioSegment[]> {
    return prisma.audioSegment.findMany({
      where: { trackId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByType(trackId: string, type: string): Promise<AudioSegment[]> {
    return prisma.audioSegment.findMany({
      where: { trackId, type },
      orderBy: { startTime: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<AudioSegment[]> {
    return prisma.audioSegment.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { startTime: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.audioSegment.count({ where: where as any });
  }

  async update(id: string, data: UpdateAudioSegmentInput): Promise<AudioSegment> {
    return prisma.audioSegment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.audioSegment.delete({ where: { id } });
  }

  async deleteByTrackId(trackId: string): Promise<void> {
    await prisma.audioSegment.deleteMany({ where: { trackId } });
  }
}

export const audioSegmentRepository = new AudioSegmentRepository();
