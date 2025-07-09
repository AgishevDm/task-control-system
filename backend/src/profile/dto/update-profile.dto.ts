import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateProfileDto {
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
}
