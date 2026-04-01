import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UploadRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;
}
