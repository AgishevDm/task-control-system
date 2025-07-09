// src/auth/token.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('REDIS_TOKEN_CLIENT') private readonly redisClient: Redis,
  ) {}

  async verifyAccessToken(token: string): Promise<{ sub: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const isBlacklisted = await this.redisClient.get(`blacklist_${token}`);
      if (isBlacklisted) throw new Error('Token revoked');

      return payload;
    } catch (e) {
      throw new Error('Invalid or expired token');
    }
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const storedToken = await this.redisClient.get(`refresh_${payload.sub}`);
      if (storedToken !== token) throw new Error('Invalid refresh token');

      return payload;
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  async generateAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '15m', secret: process.env.JWT_SECRET },
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    await this.redisClient.set(`refresh_${userId}`, token, 'EX', 604800); // 7 дней
    return token;
  }

  async revokeTokens(userId: string, accessToken: string): Promise<void> {
    await this.redisClient.set(`blacklist_${accessToken}`, '1', 'EX', 900); // 15 минут
    await this.redisClient.del(`refresh_${userId}`);
  }
}
