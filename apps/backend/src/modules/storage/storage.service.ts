import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, UploadUrlResult } from './storage.types';
import { GcsStorageAdapter } from './adapters/gcs-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { LocalStorageTokenService } from './local-storage-token.service';

@Injectable()
export class StorageService {
  private readonly adapter: StorageAdapter;

  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageTokenService: LocalStorageTokenService,
  ) {
    const backend = this.configService.get<string>('storage.backend');
    if (backend === 'local') {
      const publicBase =
        this.configService.get<string>('publicApiUrl') ??
        `http://localhost:${this.configService.get<number>('port') ?? 3005}`;
      this.adapter = new LocalStorageAdapter(
        this.configService.get<string>('storage.localRoot') ?? 'storage',
        publicBase,
        this.configService,
        this.localStorageTokenService,
      );
      return;
    }

    this.adapter = new GcsStorageAdapter(
      this.configService.get<string>('storage.gcsBucket') ?? '',
      this.configService.get<string>('storage.gcsProjectId') ?? '',
    );
  }

  /**
   * Generate object path with optional prefix
   * Format: {prefixSlug}/{folderId}/{fileId} or folders/{folderId}/{fileId} for legacy
   */
  generateObjectPath(
    folderId: string,
    fileId: string,
    prefixSlug?: string,
  ): string {
    if (prefixSlug) {
      return `${prefixSlug}/${folderId}/${fileId}`;
    }
    // Legacy format for backward compatibility
    return `folders/${folderId}/${fileId}`;
  }

  async createUploadRequest(
    folderId: string,
    fileId: string,
    mimeType: string,
    prefixSlug?: string,
  ): Promise<UploadUrlResult> {
    const objectPath = this.generateObjectPath(folderId, fileId, prefixSlug);
    const signedUrl = await this.adapter.getUploadUrl(objectPath, mimeType);
    return { signedUrl, objectPath };
  }

  getDownloadUrl(objectPath: string): Promise<string> {
    return this.adapter.getDownloadUrl(objectPath);
  }

  deleteObject(objectPath: string): Promise<void> {
    return this.adapter.deleteObject(objectPath);
  }

  async fileExists(objectPath: string): Promise<boolean> {
    return this.adapter.fileExists(objectPath);
  }
}
