import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FolderPermission } from '../../folders/entities/folder-permission.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => User, (user) => user.groups)
  users!: User[];

  @OneToMany(() => FolderPermission, (permission) => permission.group)
  folderPermissions!: FolderPermission[];
}
