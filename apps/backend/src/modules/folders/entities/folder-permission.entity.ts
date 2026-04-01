import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('folder_permissions')
@Index(['folderId', 'groupId'], { unique: true })
export class FolderPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  folderId!: string;

  @Column()
  groupId!: string;

  @Column({ default: false })
  canRead!: boolean;

  @Column({ default: false })
  canWrite!: boolean;

  @Column({ default: false })
  canDelete!: boolean;

  @ManyToOne(() => Folder, (folder) => folder.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'folderId' })
  folder!: Folder;

  @ManyToOne(() => Group, (group) => group.folderPermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group!: Group;
}
