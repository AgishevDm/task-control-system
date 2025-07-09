import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { S3Module } from './s3/s3.module';
import { FilesController } from './files/files.controller';
import { MailModule } from './mail/mail.module';
import { ProfileModule } from './profile/profile.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersModule } from './user/users.module';
import { ChatModule } from './chat/chat.module';
import { ProjectsModule } from './projects/projects.module';
import { CalendarModule } from './calendar/calendar.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OnlyofficeModule } from './onlyoffice/onlyoffice.module';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    AuthModule,
    S3Module,
    MailModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // временная папка для загрузки
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 5MB
      },
    }),
    ProfileModule,
    UsersModule,
    ChatModule,
    ProjectsModule,
    CalendarModule,
    TasksModule,
    OnlyofficeModule,
  ],
  controllers: [AppController, FilesController],
  providers: [AppService],
})
export class AppModule {}
