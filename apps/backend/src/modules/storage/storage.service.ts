import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageAdapter, UploadUrlResult } from './storage.types';
import { GcsStorageAdapter } from './adapters/gcs-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

@Injectable()
export class StorageService {
  private readonly adapter: StorageAdapter;

  constructor(private readonly configService: ConfigService) {
    const backend = this.configService.get<string>('storage.backend');
    if (backend === 'local') {
      const publicBase =
        this.configService.get<string>('publicApiUrl') ??
        `http://localhost:${this.configService.get<number>('port') ?? 3005}`;
      this.adapter = new LocalStorageAdapter(
        this.configService.get<string>('storage.localRoot') ?? 'storage',
        publicBase,
      );
      return;
    }

    this.adapter = new GcsStorageAdapter(
      this.configService.get<string>('storage.gcsBucket') ?? '',
      this.configService.get<string>('storage.gcsProjectId') ?? '',
    );
  }

  async createUploadRequest(folderId: string, fileId: string, mimeType: string): Promise<UploadUrlResult> {
    const objectPath = `folders/${folderId}/${fileId}`;
    const signedUrl = await this.adapter.getUploadUrl(objectPath, mimeType);
    return { signedUrl, objectPath };
  }

  getDownloadUrl(objectPath: string): Promise<string> {
    return this.adapter.getDownloadUrl(objectPath);
  }

  deleteObject(objectPath: string): Promise<void> {
    return this.adapter.deleteObject(objectPath);
  }
}
