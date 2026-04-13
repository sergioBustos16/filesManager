import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('storage_prefixes')
export class StoragePrefix {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  label!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}