import { IsDate, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProfileDto {
  @IsUUID()
  primarykey: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  login: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsDate()
  createAt: Date;

  @IsDate()
  editAt: Date;
}
