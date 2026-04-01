export type UploadUrlResult = {
  signedUrl: string;
  objectPath: string;
};

export interface StorageAdapter {
  getUploadUrl(objectPath: string, mimeType: string): Promise<string>;
  getDownloadUrl(objectPath: string): Promise<string>;
  deleteObject(objectPath: string): Promise<void>;
}
