import { Module } from '@nestjs/common';
import { OnlyofficeService } from './onlyoffice.service';
import { OnlyofficeController } from './onlyoffice.controller';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'src/s3/s3.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.ONLYOFFICE_JWT_SECRET,
      signOptions: { algorithm: 'HS256' },
    }),
    RedisModule,
    S3Module,
  ],
  providers: [OnlyofficeService, PrismaService],
  controllers: [OnlyofficeController],
})
export class OnlyofficeModule {}
