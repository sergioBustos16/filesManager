import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageController } from './local-storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [LocalStorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
