import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';
import { Public } from '../../common/public.decorator';
import { LocalStorageTokenService } from './local-storage-token.service';

/** Signed upload/download tokens authenticate these routes; browser PUT has no user JWT. */
@Public()
@Controller('local-storage')
export class LocalStorageController {
  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageTokenService: LocalStorageTokenService,
  ) {}

  private localRootAbs(): string {
    const root =
      this.configService.get<string>('storage.localRoot') ?? 'storage';
    return path.resolve(process.cwd(), root);
  }

  /** Object paths are logical keys with `/`; `path.relative` on Windows uses `\\` and must not be compared to token paths raw. */
  private toPosixRelative(rel: string): string {
    return rel.split(path.sep).join('/');
  }

  /** NestJS 11 / path-to-regexp v8: use a named splat; bare `*` breaks matching / req.path. */
  private objectPathFromRouteParam(encodedPath: string): string {
    const segment = Array.isArray(encodedPath)
      ? encodedPath.join('/')
      : encodedPath;
    if (!segment) {
      throw new BadRequestException('Missing path');
    }
    let objectPath: string;
    try {
      objectPath = decodeURIComponent(segment);
    } catch {
      throw new BadRequestException('Invalid path encoding');
    }
    const target = path.resolve(this.localRootAbs(), objectPath);
    const root = this.localRootAbs();
    if (!target.startsWith(root + path.sep) && target !== root) {
      throw new BadRequestException('Invalid path');
    }
    return this.toPosixRelative(path.relative(this.localRootAbs(), target));
  }

  @Put('upload/*path')
  async upload(
    @Param('path') pathParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Validate upload token and ensure it matches the requested path
    const tokenData = this.validateUploadToken(req);
    const objectPath = this.objectPathFromRouteParam(pathParam);
    const expectedPath = `folders/${tokenData.folderId}/${tokenData.fileId}`;
    if (objectPath !== expectedPath) {
      throw new ForbiddenException(
        'Upload token does not match requested path',
      );
    }
    const target = path.join(this.localRootAbs(), objectPath);
    await fs.mkdir(path.dirname(target), { recursive: true });

    const body = req.body as Buffer | string;
    if (Buffer.isBuffer(body)) {
      await fs.writeFile(target, body);
    } else {
      await pipeline(req, createWriteStream(target));
    }

    res.status(204).send();
  }

  @Get('download/*path')
  async download(
    @Param('path') pathParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Validate download token and ensure it matches the requested path
    const tokenData = this.validateDownloadToken(req);
    const objectPath = this.objectPathFromRouteParam(pathParam);
    const expectedPath = `folders/${tokenData.folderId}/${tokenData.fileId}`;
    if (objectPath !== expectedPath) {
      throw new ForbiddenException(
        'Download token does not match requested path',
      );
    }
    const target = path.join(this.localRootAbs(), objectPath);
    try {
      await fs.access(target);
    } catch {
      return res.status(404).send('Not found');
    }
    const stream = createReadStream(target);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${path.basename(objectPath)}"`,
    );
    stream.pipe(res);
  }

  private validateUploadToken(req: Request): {
    folderId: string;
    fileId: string;
  } {
    const token =
      (req.query.token as string) ||
      req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Upload token required');
    }
    return this.localStorageTokenService.validateUploadToken(token);
  }

  private validateDownloadToken(req: Request): {
    folderId: string;
    fileId: string;
  } {
    const token =
      (req.query.token as string) ||
      req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Download token required');
    }
    return this.localStorageTokenService.validateDownloadToken(token);
  }
}
