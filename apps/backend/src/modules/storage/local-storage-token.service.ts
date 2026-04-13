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

  /** Full object key, e.g. `folders/{folderId}/{fileId}` or `{prefix}/{folderId}/{fileId}`. */
  generateUploadToken(objectPath: string): string {
    const payload = { objectPath, type: 'upload' };
    const secret = this.getSecret();
    const expiresIn = this.getExpiresIn() as any;
    return jwt.sign(payload, secret, { expiresIn });
  }

  generateDownloadToken(objectPath: string): string {
    const payload = { objectPath, type: 'download' };
    const secret = this.getSecret();
    const expiresIn = this.getExpiresIn() as any;
    return jwt.sign(payload, secret, { expiresIn });
  }

  validateUploadToken(token: string): { objectPath: string } {
    try {
      const secret = this.getSecret();
      const payload = jwt.verify(token, secret) as {
        objectPath: string;
        type: string;
      };
      if (payload.type !== 'upload') {
        throw new BadRequestException('Invalid token type');
      }
      if (!payload.objectPath || typeof payload.objectPath !== 'string') {
        throw new BadRequestException('Invalid upload token');
      }
      return { objectPath: payload.objectPath };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid or expired upload token');
    }
  }

  validateDownloadToken(token: string): { objectPath: string } {
    try {
      const secret = this.getSecret();
      const payload = jwt.verify(token, secret) as {
        objectPath: string;
        type: string;
      };
      if (payload.type !== 'download') {
        throw new BadRequestException('Invalid token type');
      }
      if (!payload.objectPath || typeof payload.objectPath !== 'string') {
        throw new BadRequestException('Invalid download token');
      }
      return { objectPath: payload.objectPath };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid or expired download token');
    }
  }
}
