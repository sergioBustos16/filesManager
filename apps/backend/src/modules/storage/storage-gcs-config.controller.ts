import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../../common/admin.guard';

/**
 * Lists GCS bucket names allowed for per-folder assignment (same GCP project).
 * Admin-only; used when creating folders in production with STORAGE_BACKEND=gcs.
 */
@Controller('storage')
export class StorageGcsConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('gcs-buckets')
  @UseGuards(AdminGuard)
  listGcsBuckets() {
    return {
      buckets: this.configService.get<string[]>('storage.gcsAllowedBuckets') ?? [],
      defaultBucket:
        this.configService.get<string>('storage.gcsBucket') ?? '',
    };
  }
}
