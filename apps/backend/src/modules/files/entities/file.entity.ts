import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { FileStatus } from './file-status.enum';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  folderId!: string;

  @Column()
  name!: string;

  @Column()
  path!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column()
  mimeType!: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.READY,
  })
  status!: FileStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Folder, (folder) => folder.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder!: Folder;
}
