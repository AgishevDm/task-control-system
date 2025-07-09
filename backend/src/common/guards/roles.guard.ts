import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../enums/roles/role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string; // Явно указываем тип
    // Другие возможные поля пользователя
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY, // Используем константу
      [context.getHandler(), context.getClass()], // Проверяем и метод и класс
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId; // Изменено: убрали .sub

    if (!userId) {
      throw new ForbiddenException('Пользователь не аутентифицирован');
    }

    const account = await this.prisma.account.findUnique({
      where: { primarykey: userId },
      select: {
        roleRef: { select: { name: true } }, // Только нужные поля
      },
    });

    if (!account?.roleRef) {
      throw new ForbiddenException('У вашего аккаунта нет назначенной роли');
    }

    return requiredRoles.includes(account.roleRef.name as SystemRole);
  }
}
