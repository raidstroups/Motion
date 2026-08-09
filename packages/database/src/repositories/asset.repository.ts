import { PrismaClient, Asset, AssetType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAssetInput {
  projectId: string;
  type: AssetType;
  name: string;
  url: string;
  proxyUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class AssetRepository {
  async create(data: CreateAssetInput): Promise<Asset> {
    return prisma.asset.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        name: data.name,
        url: data.url,
        proxyUrl: data.proxyUrl,
        thumbnailUrl: data.thumbnailUrl,
        mimeType: data.mimeType,
        size: data.size,
        duration: data.duration,
        metadata: data.metadata,
      },
    });
  }

  async findById(id: string): Promise<Asset | null> {
    return prisma.asset.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<CreateAssetInput>): Promise<Asset> {
    return prisma.asset.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.asset.delete({ where: { id } });
  }

  async findByType(projectId: string, type: AssetType): Promise<Asset[]> {
    return prisma.asset.findMany({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const assetRepository = new AssetRepository();
