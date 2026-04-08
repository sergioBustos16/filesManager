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

  getUploadUrl(objectPath: string): Promise<string> {
    // Extract folderId and fileId from objectPath (format: folders/{folderId}/{fileId})
    const pathParts = objectPath.split('/');
    if (pathParts.length !== 3 || pathParts[0] !== 'folders') {
      throw new BadRequestException('Invalid object path');
    }

    const folderId = pathParts[1];
    const fileId = pathParts[2];

    const base = this.publicBaseUrl.replace(/\/$/, '');
    const token = this.localStorageTokenService.generateUploadToken(
      folderId,
      fileId,
    );

    return Promise.resolve(
      `${base}/local-storage/upload/${encodeURIComponent(objectPath)}?token=${token}`,
    );
  }

  getDownloadUrl(objectPath: string): Promise<string> {
    // Similar to upload, but for download token
    const pathParts = objectPath.split('/');
    if (pathParts.length !== 3 || pathParts[0] !== 'folders') {
      throw new BadRequestException('Invalid object path');
    }

    const folderId = pathParts[1];
    const fileId = pathParts[2];

    const base = this.publicBaseUrl.replace(/\/$/, '');
    const token = this.localStorageTokenService.generateDownloadToken(
      folderId,
      fileId,
    );

    return Promise.resolve(
      `${base}/local-storage/download/${encodeURIComponent(objectPath)}?token=${token}`,
    );
  }

  async deleteObject(objectPath: string): Promise<void> {
    const filePath = path.join(this.localRoot, objectPath);
    await fs.rm(filePath, { force: true });
  }

  async fileExists(objectPath: string): Promise<boolean> {
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
