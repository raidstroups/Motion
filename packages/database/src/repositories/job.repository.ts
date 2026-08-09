import { PrismaClient, RenderJob, JobStatus, JobPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJobInput {
  projectId: string;
  operationId: string;
  type: string;
  priority?: JobPriority;
  inputAssets: string[];
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateJobInput {
  status?: JobStatus;
  progress?: number;
  workerId?: string;
  outputAssets?: string[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export class JobRepository {
  async create(data: CreateJobInput): Promise<RenderJob> {
    return prisma.renderJob.create({
      data: {
        projectId: data.projectId,
        operationId: data.operationId,
        type: data.type,
        priority: data.priority || 'normal',
        inputAssets: data.inputAssets,
        maxRetries: data.maxRetries || 3,
        metadata: data.metadata,
      },
    });
  }

  async findById(id: string): Promise<RenderJob | null> {
    return prisma.renderJob.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<RenderJob[]> {
    return prisma.renderJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: JobStatus): Promise<RenderJob[]> {
    return prisma.renderJob.findMany({
      where: { status },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, data: UpdateJobInput): Promise<RenderJob> {
    return prisma.renderJob.update({
      where: { id },
      data: {
        ...data,
        inputAssets: data.inputAssets ? JSON.stringify(data.inputAssets) : undefined,
        outputAssets: data.outputAssets ? JSON.stringify(data.outputAssets) : undefined,
      },
    });
  }

  async updateStatus(id: string, status: JobStatus): Promise<RenderJob> {
    return prisma.renderJob.update({
      where: { id },
      data: { status },
    });
  }

  async updateProgress(id: string, progress: number): Promise<RenderJob> {
    return prisma.renderJob.update({
      where: { id },
      data: { progress },
    });
  }

  async getQueuedJobs(limit: number = 10): Promise<RenderJob[]> {
    return prisma.renderJob.findMany({
      where: { status: 'queued' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  async getRunningJobs(): Promise<RenderJob[]> {
    return prisma.renderJob.findMany({
      where: { status: 'running' },
    });
  }

  async cancel(id: string): Promise<RenderJob> {
    return prisma.renderJob.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async incrementRetryCount(id: string): Promise<RenderJob> {
    const job = await prisma.renderJob.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    
    return prisma.renderJob.update({
      where: { id },
      data: { retryCount: job.retryCount + 1 },
    });
  }
}

export const jobRepository = new JobRepository();
