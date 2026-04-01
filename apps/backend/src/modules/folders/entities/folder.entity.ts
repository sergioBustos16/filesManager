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

  @OneToMany(() => FolderPermission, (permission) => permission.folder)
  permissions!: FolderPermission[];

  @OneToMany(() => FileEntity, (file) => file.folder)
  files!: FileEntity[];
}
