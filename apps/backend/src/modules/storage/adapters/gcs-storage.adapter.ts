import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
    try {
      const [signedUrl] = await this.storage
        .bucket(this.bucketName)
        .file(objectPath)
        .getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + 15 * 60 * 1000,
          contentType: mimeType,
        });
      return signedUrl;
    } catch {
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async getDownloadUrl(objectPath: string): Promise<string> {
    try {
      const [signedUrl] = await this.storage
        .bucket(this.bucketName)
        .file(objectPath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000,
        });
      return signedUrl;
    } catch {
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  async deleteObject(objectPath: string): Promise<void> {
    try {
      await this.storage
        .bucket(this.bucketName)
        .file(objectPath)
        .delete({ ignoreNotFound: true });
    } catch {
      throw new InternalServerErrorException('Failed to delete object');
    }
  }

  async fileExists(objectPath: string): Promise<boolean> {
    try {
      await this.storage.bucket(this.bucketName).file(objectPath).getMetadata();
      return true;
    } catch (err) {
      const gcpError = err as { code?: number };
      if (gcpError.code === 404) {
        return false;
      }
      throw new InternalServerErrorException('Failed to check file existence');
    }
  }
}
