import { PrismaClient, Project, Asset, Clip, EditOperation, RenderJob, AgentRun } from '@prisma/client';

export type {
  Project,
  Asset,
  Clip,
  EditOperation,
  RenderJob,
  AgentRun,
};

export interface DatabaseConfig {
  url: string;
}

export const createDatabaseClient = (config?: DatabaseConfig) => {
  return new PrismaClient({
    datasources: config ? { db: { url: config.url } } : undefined,
  });
};
