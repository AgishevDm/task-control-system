import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [RedisModule, JwtModule, S3Module],
  controllers: [CalendarController],
  providers: [CalendarService, PrismaService],
  exports: [CalendarService],
})
export class CalendarModule {}
