import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { StorageAdapter } from '../storage.types';

@Injectable()
export class GcsStorageAdapter implements StorageAdapter {
  private readonly storage: Storage;

  constructor(
    private readonly projectId: string,
    /** Used when per-folder bucket is not set */
    private readonly defaultBucketName: string,
  ) {
    this.storage = new Storage({ projectId: this.projectId });
  }

  private resolveBucket(gcsBucketName?: string | null): string {
    const name = gcsBucketName?.trim();
    if (name) return name;
    return this.defaultBucketName;
  }

  async getUploadUrl(
    objectPath: string,
    mimeType: string,
    gcsBucketName?: string | null,
  ): Promise<string> {
    const bucketName = this.resolveBucket(gcsBucketName);
    try {
      const [signedUrl] = await this.storage
        .bucket(bucketName)
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

  async getDownloadUrl(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<string> {
    const bucketName = this.resolveBucket(gcsBucketName);
    try {
      const [signedUrl] = await this.storage
        .bucket(bucketName)
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

  async deleteObject(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<void> {
    const bucketName = this.resolveBucket(gcsBucketName);
    try {
      await this.storage
        .bucket(bucketName)
        .file(objectPath)
        .delete({ ignoreNotFound: true });
    } catch {
      throw new InternalServerErrorException('Failed to delete object');
    }
  }

  async fileExists(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<boolean> {
    const bucketName = this.resolveBucket(gcsBucketName);
    try {
      await this.storage.bucket(bucketName).file(objectPath).getMetadata();
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
