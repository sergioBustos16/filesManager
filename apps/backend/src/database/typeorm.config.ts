import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Group } from '../modules/groups/entities/group.entity';
import { Folder } from '../modules/folders/entities/folder.entity';
import { FolderPermission } from '../modules/folders/entities/folder-permission.entity';
import { FileEntity } from '../modules/files/entities/file.entity';
import { StoragePrefix } from '../modules/storage-prefixes/entities/storage-prefix.entity';

export const buildTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USERNAME ?? 'postgres',
  password: String(process.env.DATABASE_PASSWORD ?? 'postgres'),
  database: process.env.DATABASE_NAME ?? 'filesmanager',
  entities: [User, Group, Folder, FolderPermission, FileEntity, StoragePrefix],
  synchronize: process.env.NODE_ENV !== 'production',
});
