import { IsBoolean, IsUUID } from 'class-validator';

export class UpsertPermissionDto {
  @IsUUID()
  groupId!: string;

  @IsBoolean()
  canRead!: boolean;

  @IsBoolean()
  canWrite!: boolean;

  @IsBoolean()
  canDelete!: boolean;
}
