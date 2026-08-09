import { TrackedObject } from '@prisma/client';

import prisma from '../client';

export interface CreateTrackedObjectInput {
  clipId: string;
  category: string;
  label?: string;
  confidence: number;
  firstFrame: number;
  lastFrame: number;
  boundingBoxes: Record<string, unknown>[];
  masks?: Record<string, unknown>;
  trackingData?: Record<string, unknown>;
  embeddings?: number[];
  attributes?: Record<string, unknown>;
}

export interface UpdateTrackedObjectInput {
  category?: string;
  label?: string;
  confidence?: number;
  firstFrame?: number;
  lastFrame?: number;
  boundingBoxes?: Record<string, unknown>[];
  masks?: Record<string, unknown>;
  trackingData?: Record<string, unknown>;
  embeddings?: number[];
  attributes?: Record<string, unknown>;
}

export class TrackedObjectRepository {
  async create(data: CreateTrackedObjectInput): Promise<TrackedObject> {
    return prisma.trackedObject.create({ data });
  }

  async findById(id: string): Promise<TrackedObject | null> {
    return prisma.trackedObject.findUnique({ where: { id } });
  }

  async findByClipId(clipId: string): Promise<TrackedObject[]> {
    return prisma.trackedObject.findMany({
      where: { clipId },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findByCategory(clipId: string, category: string): Promise<TrackedObject[]> {
    return prisma.trackedObject.findMany({
      where: { clipId, category },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findByProjectId(projectId: string): Promise<TrackedObject[]> {
    return prisma.trackedObject.findMany({
      where: { clip: { projectId } },
      orderBy: { firstFrame: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<TrackedObject[]> {
    return prisma.trackedObject.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { firstFrame: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.trackedObject.count({ where: where as any });
  }

  async update(id: string, data: UpdateTrackedObjectInput): Promise<TrackedObject> {
    return prisma.trackedObject.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.trackedObject.delete({ where: { id } });
  }

  async deleteByClipId(clipId: string): Promise<void> {
    await prisma.trackedObject.deleteMany({ where: { clipId } });
  }
}

export const trackedObjectRepository = new TrackedObjectRepository();
