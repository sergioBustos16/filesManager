import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { StorageAdapter } from '../storage.types';

@Injectable()
export class GcsStorageAdapter implements StorageAdapter {
  private readonly storage: Storage;

  constructor(
    private readonly bucketName: string,
    private readonly projectId: string,
  ) {
    this.storage = new Storage({ projectId: this.projectId });
  }

  async getUploadUrl(objectPath: string, mimeType: string): Promise<string> {
    const [signedUrl] = await this.storage.bucket(this.bucketName).file(objectPath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: mimeType,
    });
    return signedUrl;
  }

  async getDownloadUrl(objectPath: string): Promise<string> {
    const [signedUrl] = await this.storage.bucket(this.bucketName).file(objectPath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });
    return signedUrl;
  }

  async deleteObject(objectPath: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(objectPath).delete({ ignoreNotFound: true });
  }
}
