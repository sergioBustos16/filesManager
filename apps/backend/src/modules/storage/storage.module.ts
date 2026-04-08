import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageController } from './local-storage.controller';
import { StorageService } from './storage.service';
import { LocalStorageTokenService } from './local-storage-token.service';

@Module({
  imports: [ConfigModule],
  controllers: [LocalStorageController],
  providers: [StorageService, LocalStorageTokenService],
  exports: [StorageService, LocalStorageTokenService],
})
export class StorageModule {}
