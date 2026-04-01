import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class AssignUserDto {
  @IsUUID()
  userId!: string;
}
