import { AgentRun, AgentStatus } from '@prisma/client';

import prisma from '../client';

export interface CreateAgentRunInput {
  projectId: string;
  agentType: string;
  input: Record<string, unknown>;
  model?: string;
}

export interface UpdateAgentRunInput {
  status?: AgentStatus;
  output?: Record<string, unknown>;
  error?: string;
  completedAt?: Date;
  duration?: number;
  tokenUsage?: Record<string, unknown>;
  model?: string;
}

export class AgentRunRepository {
  async create(data: CreateAgentRunInput): Promise<AgentRun> {
    return prisma.agentRun.create({
      data: {
        ...data,
        status: 'idle',
        startedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<AgentRun | null> {
    return prisma.agentRun.findUnique({
      where: { id },
      include: { messages: true },
    });
  }

  async findByProjectId(projectId: string): Promise<AgentRun[]> {
    return prisma.agentRun.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findByStatus(projectId: string, status: AgentStatus): Promise<AgentRun[]> {
    return prisma.agentRun.findMany({
      where: { projectId, status },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findByAgentType(projectId: string, agentType: string): Promise<AgentRun[]> {
    return prisma.agentRun.findMany({
      where: { projectId, agentType },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<AgentRun[]> {
    return prisma.agentRun.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { startedAt: 'desc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.agentRun.count({ where: where as any });
  }

  async update(id: string, data: UpdateAgentRunInput): Promise<AgentRun> {
    return prisma.agentRun.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: AgentStatus): Promise<AgentRun> {
    return prisma.agentRun.update({ where: { id }, data: { status } });
  }

  async complete(id: string, output: Record<string, unknown>, tokenUsage?: Record<string, unknown>): Promise<AgentRun> {
    const now = new Date();
    const run = await prisma.agentRun.findUnique({ where: { id } });
    const duration = run ? (now.getTime() - run.startedAt.getTime()) / 1000 : 0;

    return prisma.agentRun.update({
      where: { id },
      data: {
        status: 'completed',
        output,
        completedAt: now,
        duration,
        tokenUsage,
      },
    });
  }

  async fail(id: string, error: string): Promise<AgentRun> {
    return prisma.agentRun.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        completedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.agentRun.delete({ where: { id } });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.agentRun.deleteMany({ where: { projectId } });
  }
}

export const agentRunRepository = new AgentRunRepository();
