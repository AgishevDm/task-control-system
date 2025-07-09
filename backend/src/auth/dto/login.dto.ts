import { IsBoolean, IsOptional, IsString } from 'class-validator';

// Добавьте в dto/login.dto.ts
export class LoginDto {
  @IsString()
  loginOrEmail: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
