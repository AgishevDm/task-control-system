import { Controller, Get, NotFoundException, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getCurrentUser(@Req() req) {
    const userId = req.user?.primarykey; // Предполагаем, что JWT стратегия кладет пользователя в req.user

    const user = await this.prisma.account.findUnique({
      where: { primarykey: userId },
      select: {
        primarykey: true,
        login: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createAt: true,
        editAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.primarykey,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createAt,
      updatedAt: user.editAt,
    };
  }

  @Get('search')
  async searchUsers(@Query('query') query: string) {
    const users = await this.prisma.account.findMany({
      where: {
        OR: [
          { login: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        primarykey: true,
        login: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return users.map((user) => ({
      primarykey: user.primarykey,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    }));
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.account.findUnique({
      where: { primarykey: id },
      select: {
        primarykey: true,
        login: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.primarykey,
      login: user.login,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }
}
