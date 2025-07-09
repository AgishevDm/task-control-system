import { isEAN, IsEmail, IsString, Length } from 'class-validator';

// src/auth/dto/send-code.dto.ts
export class SendCodeDto {
  @IsEmail()
  email: string;
}

// src/auth/dto/verify-code.dto.ts
export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResetPassword {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// src/auth/dto/register.dto.ts
export class RegisterDto extends VerifyCodeDto {
  accountFIO: string;
  login: string;
  status: string;
  password: string;
}
