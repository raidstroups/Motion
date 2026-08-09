import { Shot } from '@prisma/client';

import prisma from '../client';

export interface CreateShotInput {
  sceneId: string;
  startTime: number;
  endTime: number;
  duration: number;
  cameraMotion?: string;
  confidence: number;
}

export interface UpdateShotInput {
  startTime?: number;
  endTime?: number;
  duration?: number;
  cameraMotion?: string;
  confidence?: number;
}

export class ShotRepository {
  async create(data: CreateShotInput): Promise<Shot> {
    return prisma.shot.create({ data });
  }

  async findById(id: string): Promise<Shot | null> {
    return prisma.shot.findUnique({ where: { id } });
  }

  async findBySceneId(sceneId: string): Promise<Shot[]> {
    return prisma.shot.findMany({
      where: { sceneId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByProjectId(projectId: string): Promise<Shot[]> {
    return prisma.shot.findMany({
      where: { scene: { clip: { projectId } } },
      orderBy: { startTime: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<Shot[]> {
    return prisma.shot.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { startTime: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.shot.count({ where: where as any });
  }

  async update(id: string, data: UpdateShotInput): Promise<Shot> {
    return prisma.shot.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.shot.delete({ where: { id } });
  }

  async deleteBySceneId(sceneId: string): Promise<void> {
    await prisma.shot.deleteMany({ where: { sceneId } });
  }
}

export const shotRepository = new ShotRepository();
