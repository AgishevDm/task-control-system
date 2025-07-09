// src/common/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import Redis from 'ioredis';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly redis: Redis;

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @Inject('REDIS_TOKEN_CLIENT') redisTokenClient: Redis,
  ) {
    this.redis = redisTokenClient;
  }

  private isLogoutEndpoint(request: Request): boolean {
    return request.url.includes('/auth/logout') && request.method === 'POST';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Разрешаем доступ к logout без проверки токена
    if (this.isLogoutEndpoint(request)) {
      try {
        const token = this.extractToken(request);
        if (token) {
          const payload = await this.jwtService.verifyAsync(token);
          request.user = { primarykey: payload.sub };
        }
      } catch {} // Игнорируем ошибки верификации
      return true;
    }

    if (request.url.includes('/auth/refresh')) {
      return this.handleRefreshRequest(context);
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const response = context.switchToHttp().getResponse();

    try {
      const accessToken = this.extractToken(request);
      if (!accessToken) {
        throw new UnauthorizedException('Token not found');
      }
      const payload = await this.verifyToken(accessToken);
      request.user = { primarykey: payload.sub };
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return this.handleExpiredToken(context);
      }
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }

  private async verifyToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });
  }

  private async handleExpiredToken(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Для logout не пытаемся обновить токен
    if (this.isLogoutEndpoint(request)) {
      return true;
    }

    const refreshToken = this.extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const userId = { primarykey: payload.sub };

      const storedRefreshToken = await this.redis.get(`refresh_${userId}`);

      if (!storedRefreshToken) {
        throw new UnauthorizedException('Session expired');
      }

      if (refreshToken !== storedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = await this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      // Возвращаем только новый accessToken
      request.headers.authorization = `Bearer ${newAccessToken}`;
      response.setHeader('Authorization', `Bearer ${newAccessToken}`);

      if (request.url.includes('/auth/refresh')) {
        response.status(200).send({ accessToken: newAccessToken });
        return false; // Прерываем дальнейшую обработку guard'ом
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Session expired. Please login again');
    }
  }

  private async handleRefreshRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const refreshToken = this.extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const userId = payload.sub;

      const storedRefreshToken = await this.redis.get(`refresh_${userId}`);
      if (!storedRefreshToken || refreshToken !== storedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = await this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      request.headers.authorization = `Bearer ${newAccessToken}`;
      response.setHeader('Authorization', `Bearer ${newAccessToken}`);
      request.user = { primarykey: userId };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractRefreshToken(req: Request): string {
    return (
      req.cookies?.refreshToken ||
      req.headers['x-refresh-token']?.toString() ||
      req.body?.refreshToken
    );
  }

  private attachTokensToResponse(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const expressRes = res as unknown as Response;
    expressRes.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
    expressRes.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800000,
    });
  }
}
