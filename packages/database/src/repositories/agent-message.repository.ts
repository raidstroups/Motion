import { AgentMessage } from '@prisma/client';

import prisma from '../client';

export interface CreateAgentMessageInput {
  runId: string;
  role: string;
  content: string;
  toolCalls?: Record<string, unknown>[];
  toolResults?: Record<string, unknown>[];
}

export interface UpdateAgentMessageInput {
  content?: string;
  toolCalls?: Record<string, unknown>[];
  toolResults?: Record<string, unknown>[];
}

export class AgentMessageRepository {
  async create(data: CreateAgentMessageInput): Promise<AgentMessage> {
    return prisma.agentMessage.create({ data });
  }

  async findById(id: string): Promise<AgentMessage | null> {
    return prisma.agentMessage.findUnique({ where: { id } });
  }

  async findByRunId(runId: string): Promise<AgentMessage[]> {
    return prisma.agentMessage.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMany(params: { skip?: number; take?: number; where?: Record<string, unknown> } = {}): Promise<AgentMessage[]> {
    return prisma.agentMessage.findMany({
      where: params.where as any,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return prisma.agentMessage.count({ where: where as any });
  }

  async update(id: string, data: UpdateAgentMessageInput): Promise<AgentMessage> {
    return prisma.agentMessage.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.agentMessage.delete({ where: { id } });
  }

  async deleteByRunId(runId: string): Promise<void> {
    await prisma.agentMessage.deleteMany({ where: { runId } });
  }
}

export const agentMessageRepository = new AgentMessageRepository();
