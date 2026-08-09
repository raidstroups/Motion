import { ProjectVersion } from '@prisma/client';

import prisma from '../client';

export interface CreateProjectVersionInput {
  projectId: string;
  version: number;
  name?: string;
  description?: string;
  editPlanId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectVersionInput {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export class ProjectVersionRepository {
  async create(data: CreateProjectVersionInput): Promise<ProjectVersion> {
    return prisma.projectVersion.create({ data });
  }

  async findById(id: string): Promise<ProjectVersion | null> {
    return prisma.projectVersion.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<ProjectVersion[]> {
    return prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  async findLatestByProjectId(projectId: string): Promise<ProjectVersion | null> {
    return prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<ProjectVersion[]> {
    return prisma.projectVersion.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { version: 'desc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.projectVersion.count({ where: where as any });
  }

  async getNextVersion(projectId: string): Promise<number> {
    const latest = await this.findLatestByProjectId(projectId);
    return (latest?.version || 0) + 1;
  }

  async update(id: string, data: UpdateProjectVersionInput): Promise<ProjectVersion> {
    return prisma.projectVersion.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.projectVersion.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.projectVersion.deleteMany({ where: { projectId } });
  }
}

export const projectVersionRepository = new ProjectVersionRepository();
