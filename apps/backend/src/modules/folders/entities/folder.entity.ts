import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FolderPermission } from './folder-permission.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { StoragePrefix } from '../../storage-prefixes/entities/storage-prefix.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.createdFolders, {
    onDelete: 'RESTRICT',
  })
  createdBy!: User;

  @ManyToOne(() => StoragePrefix, {
    nullable: true,
    eager: true,
  })
  storagePrefix!: StoragePrefix;

  @Column({ nullable: true })
  storagePrefixId!: string;

  /** GCS bucket name (same project as `GCS_PROJECT_ID`). Null = use env `GCS_BUCKET`. Set only at creation. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  gcsBucketName!: string | null;

  @OneToMany(() => FolderPermission, (permission) => permission.folder)
  permissions!: FolderPermission[];

  @OneToMany(() => FileEntity, (file) => file.folder)
  files!: FileEntity[];
}
