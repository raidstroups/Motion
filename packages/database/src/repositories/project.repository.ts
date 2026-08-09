import { PrismaClient, Project, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProjectInput {
  name: string;
  description?: string;
  userId: string;
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration: number;
    codec: string;
  };
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class ProjectRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
        settings: data.settings,
      },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        assets: true,
        clips: true,
        operations: true,
        timelines: true,
        versions: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: { status },
    });
  }
}

export const projectRepository = new ProjectRepository();
