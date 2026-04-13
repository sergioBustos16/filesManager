import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';
import { FolderPermission } from '../folders/entities/folder-permission.entity';
import { Folder } from '../folders/entities/folder.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, FolderPermission, Folder]),
    StorageModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
