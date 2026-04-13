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
      this.configService.get<string>('storage.gcsProjectId') ?? '',
      this.configService.get<string>('storage.gcsBucket') ?? '',
    );
  }

  /**
   * Object key inside the bucket (GCS or local root): `{folderId}/{fileId}`.
   * Bucket itself is chosen via `gcsBucketName` on the folder (or env default).
   */
  generateObjectPath(folderId: string, fileId: string): string {
    return `${folderId}/${fileId}`;
  }

  async createUploadRequest(
    folderId: string,
    fileId: string,
    mimeType: string,
    gcsBucketName?: string | null,
  ): Promise<UploadUrlResult> {
    const objectPath = this.generateObjectPath(folderId, fileId);
    const signedUrl = await this.adapter.getUploadUrl(
      objectPath,
      mimeType,
      gcsBucketName,
    );
    return { signedUrl, objectPath };
  }

  getDownloadUrl(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<string> {
    return this.adapter.getDownloadUrl(objectPath, gcsBucketName);
  }

  deleteObject(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<void> {
    return this.adapter.deleteObject(objectPath, gcsBucketName);
  }

  async fileExists(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<boolean> {
    return this.adapter.fileExists(objectPath, gcsBucketName);
  }
}
