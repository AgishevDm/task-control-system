import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  login: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @Length(6, 6)
  code: string; // Это поле только для DTO, в БД не сохраняется

  @IsString()
  status: string;
}
