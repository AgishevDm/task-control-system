import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { FileHierarchyController } from './file-hierarchy.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { S3CronService } from './s3-cron.service';

@Module({
  imports: [RedisModule, JwtModule, ConfigModule],
  controllers: [FileHierarchyController],
  providers: [S3Service, S3CronService, PrismaService],
  exports: [S3Service],
})
export class S3Module {}
