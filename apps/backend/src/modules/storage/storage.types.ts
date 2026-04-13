export type UploadUrlResult = {
  signedUrl: string;
  objectPath: string;
};

export interface StorageAdapter {
  /** `gcsBucketName` used when backend is GCS; omitted/null uses env default bucket. */
  getUploadUrl(
    objectPath: string,
    mimeType: string,
    gcsBucketName?: string | null,
  ): Promise<string>;
  getDownloadUrl(
    objectPath: string,
    gcsBucketName?: string | null,
  ): Promise<string>;
  deleteObject(objectPath: string, gcsBucketName?: string | null): Promise<void>;
  fileExists(objectPath: string, gcsBucketName?: string | null): Promise<boolean>;
}
