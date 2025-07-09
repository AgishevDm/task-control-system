import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import Redis from 'ioredis';
import { MailService } from 'src/mail/mail.service';
import { SystemRole } from 'src/enums/roles/role.enum';
import { ProfileStatus } from '../enums/profile-status';
import { VerifyCodeDto, SendCodeDto, ResetPassword } from './dto/send-code.dto';

@Injectable()
export class AuthService {
  private readonly redis: Redis;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private jwtService: JwtService,
    @Inject('REDIS_TOKEN_CLIENT') redisClient: Redis,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.redis = redisClient;
  }

  async sendConfirmationCode(dto: SendCodeDto, type?: string) {
    const rateLimit = await this.redis.get(`confirm_rate_limit:${dto.email}`);
    if (rateLimit) {
      throw new RequestTimeoutException(
        'Повторная отправка кода возможна через 1 минуту',
      );
    }

    const existingUser = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && type !== 'resetEmail') {
      throw new ConflictException('Email уже зарегистрирован');
    } else if (!existingUser && type === 'resetEmail') {
      throw new ConflictException('На этот Email не зарегистрирован аккаунт');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const pipeline = this.redis.pipeline();
    pipeline.set(`confirm:${dto.email}`, code, 'EX', 900);
    pipeline.set(`confirm_rate_limit:${dto.email}`, '1', 'EX', 5);
    await pipeline.exec();

    console.log(`Код ${code} отправлен на почту ${dto.email}`);

    await this.mailService.sendMail({
      to: dto.email,
      subject:
        type === 'resetEmail'
          ? 'Код подтверждения для восстановления пароля'
          : 'Код подтверждения',
      html: `Ваш код подтверждения: <b>${code}</b> (действителен 15 минут)`,
    });
  }

  async verifyConfirmationCode(dto: VerifyCodeDto) {
    const attempts = await this.redis.get(`confirm_attempts:${dto.email}`);
    if (attempts && parseInt(attempts) >= 5) {
      throw new UnauthorizedException(
        'Слишком много попыток. Попробуйте позже.',
      );
    }

    const storedCode = await this.redis.get(`confirm:${dto.email}`);
    if (!storedCode || storedCode !== dto.code) {
      await this.redis.incr(`confirm_attempts:${dto.email}`);
      await this.redis.expire(`confirm_attempts:${dto.email}`, 3600);
      return false;
    }

    console.log('Код подтвержден');

    await this.redis.del([
      `confirm:${dto.email}`,
      `confirm_attempts:${dto.email}`,
    ]);
    return true;
  }

  async resetPassword(dto: ResetPassword) {
    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    await this.prisma.account.update({
      where: { email: dto.email },
      data: {
        password: hashedPassword,
        editAt: new Date(),
      },
    });

    return true;
  }

  async loginVerify(
    loginOrEmail: string,
    password: string,
  ): Promise<string | null> {
    const user = await this.prisma.account.findFirst({
      where: {
        OR: [{ login: loginOrEmail }, { email: loginOrEmail }],
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      await this.prisma.account.update({
        where: { primarykey: user.primarykey },
        data: {
          status: ProfileStatus.ACTIVE,
        },
      });
      return user.primarykey;
    }

    return null;
  }

  async generateTokens(userId: string, rememberMe: boolean) {
    if (rememberMe) {
      const accessToken = this.jwtService.sign(
        { sub: userId },
        { expiresIn: '15m' },
      );
      const refreshToken = this.jwtService.sign(
        { sub: userId },
        { expiresIn: '7d' },
      );

      try {
        await this.redis.set(
          `refresh_${userId}`,
          refreshToken,
          'EX',
          7 * 24 * 60 * 60,
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Redis error:', error.message);
        }

        throw new Error('Failed to save token');
      }

      return { accessToken, refreshToken };
    } else {
      const accessToken = this.jwtService.sign(
        { sub: userId },
        { expiresIn: '15m' },
      );

      return { accessToken };
    }
  }

  async validateRefreshToken(userId: string, token: string) {
    const storedToken = await this.redis.get(`refresh_${userId}`);
    return storedToken === token;
  }

  async logout(userId: string) {
    try {
      await this.redis.del(`refresh_${userId}`);
      console.log('Refresh token deleted for user:', userId);
    } catch (error) {
      console.error('Error deleting refresh token:', error);
    }
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.account.findFirst({
      where: {
        OR: [{ email: dto.email }, { login: dto.login }],
      },
    });
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким email или логином уже существует',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = await this.prisma.role.findFirst({
      where: { name: SystemRole.USER },
    });

    if (!role) {
      throw new Error('Роль для пользователя не найдена');
    }

    const user = await this.prisma.account.create({
      data: {
        email: dto.email,
        login: dto.login,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isEmailVerified: true,
        roleRef: { connect: { primarykey: role.primarykey } },
        status: ProfileStatus.PENDING,
      },
    });

    await this.mailService.sendMail({
      to: dto.email,
      subject: 'Добро пожаловать!',
      text: `Вы успешно зарегистрировались. Ваш логин: ${dto.login}`,
    });

    return user;
  }
}
