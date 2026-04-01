import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsString()
  @IsNotEmpty()
  path!: string;
}
