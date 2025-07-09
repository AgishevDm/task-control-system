// src/s3/s3-cron.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';

@Injectable()
export class S3CronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  @Cron('0 3 */6 * *') // 6 дней
  //@Cron('*/30 * * * * *') // Каждые 30 секунд
  async updateSignedUrls() {
    console.log('Starting URL refresh process...');
    await this.updateAccountAvatars();
    await this.updateProjectLogos();
    console.log('URL refresh completed');
  }

  private async updateAccountAvatars() {
    const accounts = await this.prisma.account.findMany({
      where: {
        avatarUrl: { not: null },
      },
    });

    for (const account of accounts) {
      try {
        if (!account.avatarUrl) continue;

        const key = this.extractS3Key(account.avatarUrl);

        if (!key) {
          // console.log(`Could not extract key from avatar URL for account ${account.primarykey}`);
          continue;
        }

        if (key) {
          const newUrl = await this.s3Service.generatePresignedUrl(key);
          await this.prisma.account.update({
            where: { primarykey: account.primarykey },
            data: { avatarUrl: newUrl },
          });
        }
      } catch (error) {
        console.error(
          `Failed to update avatar for account ${account.primarykey}:`,
          error,
        );
      }
    }
  }

  private async updateProjectLogos() {
    const projects = await this.prisma.project.findMany({
      where: {
        logoUrl: { not: null },
      },
    });

    for (const project of projects) {
      try {
        if (!project.logoUrl) continue;

        const key = this.extractS3Key(project.logoUrl);

        if (!key) {
          // this.logger.warn(`Could not extract key from logo URL for project ${project.primarykey}`);
          continue;
        }

        if (key) {
          const newUrl = await this.s3Service.generatePresignedUrl(key);
          await this.prisma.project.update({
            where: { primarykey: project.primarykey },
            data: { logoUrl: newUrl },
          });
        }
      } catch (error) {
        console.error(
          `Failed to update logo for project ${project.primarykey}:`,
          error,
        );
      }
    }
  }

  private extractS3Key(url: string): string | null {
    if (!url) return null;
    try {
      // Для URL формата: https://s3.cloud.ru/bucket-maps/badgi/avatars/...
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Находим индекс 'badgi' в пути
      const badgiIndex = pathParts.indexOf('badgi');
      if (badgiIndex === -1 || badgiIndex >= pathParts.length - 2) {
        return null;
      }

      // Извлекаем часть после 'badgi/avatars/'
      return `badgi/${pathParts[badgiIndex + 1]}/${pathParts.slice(badgiIndex + 2).join('/')}`;
    } catch (e) {
      //this.logger.error(`Error parsing URL: ${url}`, e);
      return null;
    }
  }
}
