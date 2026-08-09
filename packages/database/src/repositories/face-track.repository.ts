import { FaceTrack } from '@prisma/client';

import prisma from '../client';

export interface CreateFaceTrackInput {
  clipId: string;
  personId?: string;
  confidence: number;
  firstFrame: number;
  lastFrame: number;
  landmarks?: Record<string, unknown>[];
  embedding?: number[];
}

export interface UpdateFaceTrackInput {
  personId?: string;
  confidence?: number;
  firstFrame?: number;
  lastFrame?: number;
  landmarks?: Record<string, unknown>[];
  embedding?: number[];
}

export class FaceTrackRepository {
  async create(data: CreateFaceTrackInput): Promise<FaceTrack> {
    return prisma.faceTrack.create({ data });
  }

  async findById(id: string): Promise<FaceTrack | null> {
    return prisma.faceTrack.findUnique({ where: { id } });
  }

  async findByClipId(clipId: string): Promise<FaceTrack[]> {
    return prisma.faceTrack.findMany({
      where: { clipId },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findByPersonId(personId: string): Promise<FaceTrack[]> {
    return prisma.faceTrack.findMany({
      where: { personId },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findByProjectId(projectId: string): Promise<FaceTrack[]> {
    return prisma.faceTrack.findMany({
      where: { clip: { projectId } },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<FaceTrack[]> {
    return prisma.faceTrack.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { firstFrame: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.faceTrack.count({ where: where as any });
  }

  async update(id: string, data: UpdateFaceTrackInput): Promise<FaceTrack> {
    return prisma.faceTrack.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.faceTrack.delete({ where: { id } });
  }

  async deleteByClipId(clipId: string): Promise<void> {
    await prisma.faceTrack.deleteMany({ where: { clipId } });
  }
}

export const faceTrackRepository = new FaceTrackRepository();
