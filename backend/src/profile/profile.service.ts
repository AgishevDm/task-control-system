import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileDto } from './dto/profile.dto';
import { S3Service } from 'src/s3/s3.service';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.prisma.account.findUnique({
      where: { primarykey: userId },
      select: {
        primarykey: true,
        firstName: true,
        lastName: true,
        email: true,
        login: true,
        avatarUrl: true,
        createAt: true,
        editAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      primarykey: user.primarykey,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      login: user.login,
      avatarUrl: user.avatarUrl || null,
      createAt: user.createAt,
      editAt: user.editAt,
    };
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const existingUser = await this.prisma.account.findUnique({
      where: { primarykey: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.account.update({
      where: { primarykey: userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        login: updateData.login,
        editAt: new Date(),
        ...(updateData.avatarUrl !== undefined && {
          avatarUrl: updateData.avatarUrl,
        }),
      },
    });

    return {
      primarykey: user.primarykey,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      login: user.login,
      avatarUrl: user.avatarUrl || null,
      createAt: user.createAt,
      editAt: user.editAt,
    };
  }

  async changePassword(
    userId: string,
    passwordData: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.account.findUnique({
      where: { primarykey: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      passwordData.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

    await this.prisma.account.update({
      where: { primarykey: userId },
      data: { password: hashedPassword },
    });
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    // Удаляем старый аватар, если он есть
    const user = await this.prisma.account.findUnique({
      where: { primarykey: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      try {
        await this.s3Service.deleteFileWithDbRecord(
          this.extractKeyFromUrl(user.avatarUrl),
        );
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Загружаем новый аватар
    const { url } = await this.s3Service.uploadFile(file, 'avatars', userId);

    await this.prisma.account.update({
      where: { primarykey: userId },
      data: { avatarUrl: url },
    });

    return { avatarUrl: url };
  }

  private extractKeyFromUrl(url: string): string {
    // Извлекаем ключ из URL (зависит от формата URL в вашем S3)
    const matches = url.match(/badgi\/avatars\/(.*)/);
    return matches ? `badgi/avatars/${matches[1]}` : '';
  }
}
