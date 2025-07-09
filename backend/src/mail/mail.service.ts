// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private transporter: Transporter<SentMessageInfo>;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Connected to email server');
    } catch (error) {
      this.logger.error('SMTP Connection Error:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      throw error;
    }
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      ...options,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error('SMTP Error Details:', {
        error: error.message,
        stack: error.stack,
        response: error.response,
        code: error.code,
        smtpCommand: error.command, // Покажет на каком этапе ошибка
      });
      return false;
    }
  }

  // Пока не используется нигде
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.configService.get('APP_URL')}/verify-email?token=${token}`;

    return this.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  // Пока не используется нигде
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;

    return this.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}
