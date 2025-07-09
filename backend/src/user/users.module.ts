import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [UsersController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class UsersModule {}
