import { Scene } from '@prisma/client';

import prisma from '../client';

export interface CreateSceneInput {
  clipId: string;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSceneInput {
  startTime?: number;
  endTime?: number;
  duration?: number;
  confidence?: number;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export class SceneRepository {
  async create(data: CreateSceneInput): Promise<Scene> {
    return prisma.scene.create({ data });
  }

  async findById(id: string): Promise<Scene | null> {
    return prisma.scene.findUnique({
      where: { id },
      include: { shots: true },
    });
  }

  async findByClipId(clipId: string): Promise<Scene[]> {
    return prisma.scene.findMany({
      where: { clipId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByProjectId(projectId: string): Promise<Scene[]> {
    return prisma.scene.findMany({
      where: { clip: { projectId } },
      orderBy: { startTime: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<Scene[]> {
    return prisma.scene.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { startTime: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.scene.count({ where: where as any });
  }

  async update(id: string, data: UpdateSceneInput): Promise<Scene> {
    return prisma.scene.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.scene.delete({ where: { id } });
  }

  async deleteByClipId(clipId: string): Promise<void> {
    await prisma.scene.deleteMany({ where: { clipId } });
  }
}

export const sceneRepository = new SceneRepository();
