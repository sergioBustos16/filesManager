import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateStoragePrefixDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @Max(999)
  @IsOptional()
  sortOrder?: number;
}