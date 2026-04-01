import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { StorageAdapter } from '../storage.types';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly localRoot: string,
    private readonly publicBaseUrl: string,
  ) {}

  async getUploadUrl(objectPath: string): Promise<string> {
    const base = this.publicBaseUrl.replace(/\/$/, '');
    return `${base}/local-storage/upload/${encodeURIComponent(objectPath)}`;
  }

  async getDownloadUrl(objectPath: string): Promise<string> {
    const base = this.publicBaseUrl.replace(/\/$/, '');
    return `${base}/local-storage/download/${encodeURIComponent(objectPath)}`;
  }

  async deleteObject(objectPath: string): Promise<void> {
    const filePath = path.join(this.localRoot, objectPath);
    await fs.rm(filePath, { force: true });
  }
}
