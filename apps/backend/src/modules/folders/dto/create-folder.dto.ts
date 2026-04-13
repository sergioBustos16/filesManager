import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitialPermissionDto {
  @IsUUID()
  groupId!: string;

  @IsBoolean()
  canRead!: boolean;

  @IsBoolean()
  canWrite!: boolean;

  @IsBoolean()
  canDelete!: boolean;
}

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** GCS bucket (must be in server allowlist). Only honored for Admin; immutable after create. */
  @IsString()
  @IsOptional()
  gcsBucketName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialPermissionDto)
  @IsOptional()
  permissions?: InitialPermissionDto[];
}
