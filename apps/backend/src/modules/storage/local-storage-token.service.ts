import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class LocalStorageTokenService {
  constructor(private readonly configService: ConfigService) {}

  private getSecret(): string {
    return (
      this.configService.get<string>('storage.localTokenSecret') ??
      'local-upload-secret'
    );
  }

  private getExpiresIn(): string {
    return (
      this.configService.get<string>('storage.localTokenExpiresIn') ?? '15m'
    );
  }

  generateUploadToken(folderId: string, fileId: string): string {
    const payload = { folderId, fileId, type: 'upload' };
    const secret = this.getSecret();
    const expiresIn = this.getExpiresIn() as any;
    return jwt.sign(payload, secret, { expiresIn });
  }

  generateDownloadToken(folderId: string, fileId: string): string {
    const payload = { folderId, fileId, type: 'download' };
    const secret = this.getSecret();
    const expiresIn = this.getExpiresIn() as any;
    return jwt.sign(payload, secret, { expiresIn });
  }

  validateUploadToken(token: string): { folderId: string; fileId: string } {
    try {
      const secret = this.getSecret();
      const payload = jwt.verify(token, secret) as {
        folderId: string;
        fileId: string;
        type: string;
      };
      if (payload.type !== 'upload') {
        throw new BadRequestException('Invalid token type');
      }
      return { folderId: payload.folderId, fileId: payload.fileId };
    } catch {
      throw new BadRequestException('Invalid or expired upload token');
    }
  }

  validateDownloadToken(token: string): { folderId: string; fileId: string } {
    try {
      const secret = this.getSecret();
      const payload = jwt.verify(token, secret) as {
        folderId: string;
        fileId: string;
        type: string;
      };
      if (payload.type !== 'download') {
        throw new BadRequestException('Invalid token type');
      }
      return { folderId: payload.folderId, fileId: payload.fileId };
    } catch {
      throw new BadRequestException('Invalid or expired download token');
    }
  }
}
