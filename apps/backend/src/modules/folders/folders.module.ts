import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { Folder } from './entities/folder.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { StoragePrefix } from '../storage-prefixes/entities/storage-prefix.entity';
import { StoragePrefixesModule } from '../storage-prefixes/storage-prefixes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, FolderPermission, StoragePrefix]), StoragePrefixesModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
