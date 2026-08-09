import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateId } from '@motion/shared';

export interface StorageConfig {
  url: string;
  key: string;
  bucket?: string;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

export class StorageService {
  private client: SupabaseClient;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.client = createClient(config.url, config.key);
    this.bucket = config.bucket || 'motion-assets';
  }

  async upload(
    file: Buffer | File | Blob,
    path: string,
    options: {
      contentType?: string;
      upsert?: boolean;
    } = {}
  ): Promise<UploadResult> {
    const { contentType, upsert = false } = options;
    
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType,
        upsert,
      });

    if (error) throw error;

    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file instanceof Buffer ? file.length : file.size,
      mimeType: contentType || 'application/octet-stream',
    };
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error) throw error;

    return Buffer.from(await data.arrayBuffer());
  }

  async getSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) throw error;
  }

  async list(
    path: string = '',
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<{ name: string; id: string; metadata: Record<string, unknown> }[]> {
    const { limit = 100, offset = 0, sortBy } = options;
    
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(path, {
        limit,
        offset,
        sortBy: sortBy ? [sortBy] : undefined,
      });

    if (error) throw error;

    return data || [];
  }

  async getMetadata(path: string): Promise<Record<string, unknown>> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(path.replace(/\/[^/]+$/, ''), {
        limit: 1,
        search: path.split('/').pop(),
      });

    if (error) throw error;

    const file = data?.[0];
    return file?.metadata || {};
  }

  generatePath(
    projectId: string,
    type: 'original' | 'proxy' | 'analysis' | 'masks' | 'audio' | 'intermediate' | 'renders' | 'exports',
    filename: string
  ): string {
    const id = generateId();
    const ext = filename.split('.').pop();
    return `${projectId}/${type}/${id}.${ext}`;
  }
}

let storageInstance: StorageService | null = null;

export function initializeStorage(config: StorageConfig): StorageService {
  storageInstance = new StorageService(config);
  return storageInstance;
}

export function getStorage(): StorageService {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call initializeStorage first.');
  }
  return storageInstance;
}
