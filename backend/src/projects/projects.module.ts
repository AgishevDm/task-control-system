import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Module } from 'src/s3/s3.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { TasksService } from 'src/tasks/tasks.service';

@Module({
  imports: [RedisModule, JwtModule, S3Module],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService, TasksService],
})
export class ProjectsModule {}
