import { BadRequestException, Controller, Get, Put, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';
import { Public } from '../../common/public.decorator';

const UPLOAD_PREFIX = '/local-storage/upload/';
const DOWNLOAD_PREFIX = '/local-storage/download/';

@Controller('local-storage')
export class LocalStorageController {
  constructor(private readonly configService: ConfigService) {}

  private localRootAbs(): string {
    const root = this.configService.get<string>('storage.localRoot') ?? 'storage';
    return path.resolve(process.cwd(), root);
  }

  private parseObjectPath(req: Request, prefix: string): string {
    if (!req.path.startsWith(prefix)) {
      throw new BadRequestException('Invalid path');
    }
    const encoded = req.path.slice(prefix.length);
    if (!encoded) {
      throw new BadRequestException('Missing path');
    }
    let objectPath: string;
    try {
      objectPath = decodeURIComponent(encoded);
    } catch {
      throw new BadRequestException('Invalid path encoding');
    }
    const normalized = path.normalize(objectPath).replace(/^(\.\.(\/|\\|$))+/, '');
    if (normalized.includes('..')) {
      throw new BadRequestException('Invalid path');
    }
    const target = path.resolve(this.localRootAbs(), normalized);
    const root = this.localRootAbs();
    if (!target.startsWith(root + path.sep) && target !== root) {
      throw new BadRequestException('Invalid path');
    }
    return normalized;
  }

  @Public()
  @Put('upload/*')
  async upload(@Req() req: Request, @Res() res: Response) {
    const objectPath = this.parseObjectPath(req, UPLOAD_PREFIX);
    const target = path.join(this.localRootAbs(), objectPath);
    await fs.mkdir(path.dirname(target), { recursive: true });

    const body = req.body;
    if (Buffer.isBuffer(body)) {
      await fs.writeFile(target, body);
    } else {
      await pipeline(req, createWriteStream(target));
    }

    res.status(204).send();
  }

  @Public()
  @Get('download/*')
  async download(@Req() req: Request, @Res() res: Response) {
    const objectPath = this.parseObjectPath(req, DOWNLOAD_PREFIX);
    const target = path.join(this.localRootAbs(), objectPath);
    try {
      await fs.access(target);
    } catch {
      return res.status(404).send('Not found');
    }
    const stream = createReadStream(target);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(objectPath)}"`);
    stream.pipe(res);
  }
}
