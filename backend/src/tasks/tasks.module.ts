import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { S3Module } from '../s3/s3.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [RedisModule, JwtModule, S3Module],
  controllers: [TasksController, CommentsController],
  providers: [TasksService, CommentsService, PrismaService],
})
export class TasksModule {}
