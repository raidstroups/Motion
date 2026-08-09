import { Clip } from '@prisma/client';

import prisma from '../client';

export interface CreateClipInput {
  projectId: string;
  assetId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateClipInput {
  name?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  inPoint?: number;
  outPoint?: number;
  metadata?: Record<string, unknown>;
}

export class ClipRepository {
  async create(data: CreateClipInput): Promise<Clip> {
    return prisma.clip.create({ data });
  }

  async findById(id: string): Promise<Clip | null> {
    return prisma.clip.findUnique({
      where: { id },
      include: { asset: true, scenes: true, shots: true, objects: true, faces: true },
    });
  }

  async findByProjectId(projectId: string): Promise<Clip[]> {
    return prisma.clip.findMany({
      where: { projectId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByAssetId(assetId: string): Promise<Clip[]> {
    return prisma.clip.findMany({
      where: { assetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<Clip[]> {
    return prisma.clip.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { startTime: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.clip.count({ where: where as any });
  }

  async update(id: string, data: UpdateClipInput): Promise<Clip> {
    return prisma.clip.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.clip.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.clip.deleteMany({ where: { projectId } });
  }
}

export const clipRepository = new ClipRepository();
