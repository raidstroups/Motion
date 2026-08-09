import { EditOperation, OperationStatus } from '@prisma/client';

import prisma from '../client';

export interface CreateEditOperationInput {
  projectId: string;
  type: string;
  sourceClipId: string;
  startTime: number;
  endTime: number;
  priority: number;
  status?: OperationStatus;
  confidence: number;
  dependencies: Record<string, unknown>;
  parameters: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateEditOperationInput {
  type?: string;
  startTime?: number;
  endTime?: number;
  priority?: number;
  status?: OperationStatus;
  confidence?: number;
  dependencies?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class EditOperationRepository {
  async create(data: CreateEditOperationInput): Promise<EditOperation> {
    return prisma.editOperation.create({ data });
  }

  async findById(id: string): Promise<EditOperation | null> {
    return prisma.editOperation.findUnique({
      where: { id },
      include: { renderJobs: true },
    });
  }

  async findByProjectId(projectId: string): Promise<EditOperation[]> {
    return prisma.editOperation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByStatus(projectId: string, status: OperationStatus): Promise<EditOperation[]> {
    return prisma.editOperation.findMany({
      where: { projectId, status },
      orderBy: { priority: 'desc' },
    });
  }

  async findByClipId(clipId: string): Promise<EditOperation[]> {
    return prisma.editOperation.findMany({
      where: { sourceClipId: clipId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<EditOperation[]> {
    return prisma.editOperation.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.editOperation.count({ where: where as any });
  }

  async update(id: string, data: UpdateEditOperationInput): Promise<EditOperation> {
    return prisma.editOperation.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: OperationStatus): Promise<EditOperation> {
    return prisma.editOperation.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await prisma.editOperation.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.editOperation.deleteMany({ where: { projectId } });
  }
}

export const editOperationRepository = new EditOperationRepository();
