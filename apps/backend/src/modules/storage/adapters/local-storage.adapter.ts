import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { StorageAdapter } from '../storage.types';
import { LocalStorageTokenService } from '../local-storage-token.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly localRoot: string,
    private readonly publicBaseUrl: string,
    private readonly configService: ConfigService,
    private readonly localStorageTokenService: LocalStorageTokenService,
  ) {}

  getUploadUrl(
    objectPath: string,
    _mimeType?: string,
    _gcsBucketName?: string | null,
  ): Promise<string> {
    const parts = objectPath.split('/');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid object path');
    }

    const base = this.publicBaseUrl.replace(/\/$/, '');
    const token =
      this.localStorageTokenService.generateUploadToken(objectPath);

    return Promise.resolve(
      `${base}/local-storage/upload/${encodeURIComponent(objectPath)}?token=${token}`,
    );
  }

  getDownloadUrl(
    objectPath: string,
    _gcsBucketName?: string | null,
  ): Promise<string> {
    const parts = objectPath.split('/');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid object path');
    }

    const base = this.publicBaseUrl.replace(/\/$/, '');
    const token =
      this.localStorageTokenService.generateDownloadToken(objectPath);

    return Promise.resolve(
      `${base}/local-storage/download/${encodeURIComponent(objectPath)}?token=${token}`,
    );
  }

  async deleteObject(
    objectPath: string,
    _gcsBucketName?: string | null,
  ): Promise<void> {
    const filePath = path.join(this.localRoot, objectPath);
    await fs.rm(filePath, { force: true });
  }

  async fileExists(
    objectPath: string,
    _gcsBucketName?: string | null,
  ): Promise<boolean> {
    try {
      const filePath = path.join(this.localRoot, objectPath);
      await fs.access(filePath);
      return true;
    } catch (err) {
      const nodeError = err as { code?: string };
      if (nodeError.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }
}
