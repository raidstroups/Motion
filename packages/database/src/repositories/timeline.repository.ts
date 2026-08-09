import { Timeline } from '@prisma/client';

import prisma from '../client';

export interface CreateTimelineInput {
  projectId: string;
  name: string;
  tracks: Record<string, unknown>;
  duration: number;
  fps: number;
}

export interface UpdateTimelineInput {
  name?: string;
  tracks?: Record<string, unknown>;
  duration?: number;
  fps?: number;
}

export class TimelineRepository {
  async create(data: CreateTimelineInput): Promise<Timeline> {
    return prisma.timeline.create({ data });
  }

  async findById(id: string): Promise<Timeline | null> {
    return prisma.timeline.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<Timeline[]> {
    return prisma.timeline.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<Timeline[]> {
    return prisma.timeline.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.timeline.count({ where: where as any });
  }

  async update(id: string, data: UpdateTimelineInput): Promise<Timeline> {
    return prisma.timeline.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.timeline.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.timeline.deleteMany({ where: { projectId } });
  }
}

export const timelineRepository = new TimelineRepository();
