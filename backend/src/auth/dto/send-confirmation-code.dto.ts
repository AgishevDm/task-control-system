// src/auth/dto/send-confirmation-code.dto.ts
import { IsEmail } from 'class-validator';

export class SendConfirmationCodeDto {
  @IsEmail()
  email: string;
}
