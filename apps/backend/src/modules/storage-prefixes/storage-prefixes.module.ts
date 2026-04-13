import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoragePrefix } from './entities/storage-prefix.entity';
import { StoragePrefixesService } from './storage-prefixes.service';
import { StoragePrefixesController } from './storage-prefixes.controller';
import { StoragePrefixesSeeder } from './storage-prefixes.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([StoragePrefix])],
  controllers: [StoragePrefixesController],
  providers: [StoragePrefixesService, StoragePrefixesSeeder],
  exports: [StoragePrefixesService],
})
export class StoragePrefixesModule {}